// scripts/import-metafields-from-csv.ts
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
// Если у тебя Node 18+, можно использовать глобальный fetch и удалить эту строку.
// Иначе установи node-fetch: npm i node-fetch@3
import fetch from "node-fetch";

// ==== ENV ====
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

if (!STORE_DOMAIN || !ADMIN_TOKEN) {
  console.error(
    "[ENV] Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN in .env.local"
  );
  process.exit(1);
}

const ADMIN_ENDPOINT = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

// ----- types -----
type CSVRow = Record<string, string | undefined>;

type MetaDef = {
  namespace: string;
  key: string;
  type: "single_line_text_field" | "multi_line_text_field" | "number_integer";
};

const FIELD_MAP: Record<string, MetaDef> = {
  "custom.tasted_best_with": { namespace: "custom", key: "tasted_best_with", type: "multi_line_text_field" },
  "custom.pack_type":        { namespace: "custom", key: "pack_type",        type: "single_line_text_field" },
  "custom.shelf_life_days":  { namespace: "custom", key: "shelf_life_days",  type: "single_line_text_field" }, // можно number_integer
  "custom.country":          { namespace: "custom", key: "country",          type: "single_line_text_field" },
  "custom.ingredients":      { namespace: "custom", key: "ingredients",      type: "multi_line_text_field" },
  "custom.allergens":        { namespace: "custom", key: "allergens",        type: "multi_line_text_field" },
  "custom.bottle_in_boxes":  { namespace: "custom", key: "bottle_in_boxes",  type: "single_line_text_field" },
};

// поддержим заголовки вида "Metafield: custom.key"
function normalizeHeader(h: string | undefined): string {
  if (!h) return "";
  const trimmed = h.trim();
  if (trimmed.toLowerCase().startsWith("metafield:")) {
    return trimmed.split(":")[1]?.trim() ?? ""; // -> "custom.key"
  }
  return trimmed;
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ADMIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`[HTTP ${res.status}] ${text}`);

  const json = JSON.parse(text) as { data: T; errors?: unknown };
  if (Array.isArray((json as { errors?: unknown }).errors) && (json as { errors: unknown[] }).errors.length) {
    throw new Error(`GQL errors: ${JSON.stringify((json as { errors: unknown[] }).errors)}`);
  }
  return json.data;
}

const Q_PRODUCT_BY_HANDLE = /* GraphQL */ `
  query ProductId($handle: String!) {
    productByHandle(handle: $handle) { id title }
  }
`;

type ProductByHandleRes = {
  productByHandle: { id: string; title: string } | null;
};

const M_METAFIELDS_SET = /* GraphQL */ `
  mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key }
      userErrors { field message }
    }
  }
`;

type MetafieldsSetRes = {
  metafieldsSet: {
    metafields: { id: string; namespace: string; key: string }[];
    userErrors: { field: string[] | null; message: string }[];
  };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function run(csvPath: string) {
  const abs = path.resolve(csvPath);
  const buf = fs.readFileSync(abs);

  const rows = parse(buf, { columns: true, skip_empty_lines: true }) as CSVRow[];

  // нормализуем заголовки
  const normalized: CSVRow[] = rows.map((row) => {
    const out: CSVRow = {};
    for (const [k, v] of Object.entries(row)) {
      out[normalizeHeader(k)] = v;
    }
    return out;
  });

  let ok = 0;
  let fail = 0;

  for (const row of normalized) {
    const handleRaw = row["Handle"] ?? row["handle"] ?? "";
    const handle = String(handleRaw).trim();
    if (!handle) {
      console.log("⏭️  Skip row: no Handle");
      continue;
    }

    // 1) productId
    let productId: string | null = null;
    try {
      const data = await gql<ProductByHandleRes>(Q_PRODUCT_BY_HANDLE, { handle });
      productId = data.productByHandle?.id ?? null;
      if (!productId) {
        console.log(`❌ Not found: ${handle}`);
        fail++;
        continue;
      }
    } catch (e: unknown) {
      console.log(`❌ Query error [${handle}]: ${errorMessage(e)}`);
      fail++;
      continue;
    }

    // 2) собрать метаполя из колонок
    const inputs: Array<{
      ownerId: string;
      namespace: string;
      key: string;
      type: MetaDef["type"];
      value: string;
    }> = [];

    for (const [header, def] of Object.entries(FIELD_MAP)) {
      const val = row[header];
      if (val == null || String(val).trim() === "") continue;

      const value = String(val).trim();

      // Если хочешь хранить shelf_life_days числом:
      // if (def.key === "shelf_life_days") {
      //   const n = parseInt(value, 10);
      //   if (!Number.isNaN(n)) {
      //     value = String(n);
      //     def.type = "number_integer";
      //   } else {
      //     continue;
      //   }
      // }

      inputs.push({
        ownerId: productId,
        namespace: def.namespace,
        key: def.key,
        type: def.type,
        value,
      });
    }

    if (!inputs.length) {
      console.log(`ℹ️  No metafields for ${handle}`);
      continue;
    }

    // 3) записать
    try {
      const data = await gql<MetafieldsSetRes>(M_METAFIELDS_SET, { metafields: inputs });
      const errs = data.metafieldsSet.userErrors || [];
      if (errs.length) {
        console.log(`❌ metafieldsSet errors [${handle}]:`, errs);
        fail++;
      } else {
        console.log(`✅ Updated ${handle}: ${inputs.map((i) => `${i.namespace}.${i.key}`).join(", ")}`);
        ok++;
      }
    } catch (e: unknown) {
      console.log(`❌ Mutation error [${handle}]: ${errorMessage(e)}`);
      fail++;
    }

    await sleep(300);
  }

  console.log(`\nDone. OK: ${ok}, Failed: ${fail}`);
}

// CLI
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx --env-file=.env.local scripts/import-metafields-from-csv.ts ./path/to/file.csv");
  process.exit(1);
}
run(csvPath).catch((e) => {
  console.error(errorMessage(e));
  process.exit(1);
});
