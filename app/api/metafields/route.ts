// app/api/metafields/route.ts
import { NextResponse } from "next/server";
import { shopifyAdminRequest } from "../../lib/shopify";

// Ищем именно beer.csv
const FILE_NAME = "beer.csv";

// (опционально) защита по токену ?token=...
function checkAuth(req: Request) {
  const required = process.env.INTERNAL_SYNC_TOKEN;
  if (!required) return true;
  const url = new URL(req.url);
  return url.searchParams.get("token") === required;
}

type MetaDef = {
  namespace: string;
  key: string;
  type: "single_line_text_field" | "multi_line_text_field" | "number_integer";
};

const FIELD_MAP: Record<string, MetaDef> = {
  "custom.tasted_best_with": { namespace: "custom", key: "tasted_best_with", type: "multi_line_text_field" },
  "custom.pack_type":        { namespace: "custom", key: "pack_type",        type: "single_line_text_field" },
  "custom.shelf_life_days":  { namespace: "custom", key: "shelf_life_days",  type: "single_line_text_field" },
  "custom.country":          { namespace: "custom", key: "country",          type: "single_line_text_field" },
  "custom.ingredients":      { namespace: "custom", key: "ingredients",      type: "multi_line_text_field" },
  "custom.allergens":        { namespace: "custom", key: "allergens",        type: "multi_line_text_field" },
  "custom.bottle_in_boxes":  { namespace: "custom", key: "bottle_in_boxes",  type: "single_line_text_field" },
};

// ── GraphQL — запросы ─────────────────────────────────────────────
const Q_FILES = `
  query Files($query: String, $first: Int!) {
    files(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          __typename
          id
          createdAt
          ... on GenericFile { url }
          ... on MediaImage { image { url } }
        }
      }
    }
  }
`;

const Q_PRODUCT_BY_HANDLE = `
  query ProductId($handle: String!) {
    productByHandle(handle: $handle) { id title }
  }
`;

const M_METAFIELDS_SET = `
  mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key }
      userErrors { field message }
    }
  }
`;

// ── Типы для ответов Admin GraphQL (без any) ─────────────────────
type GenericFileNode = {
  __typename: "GenericFile";
  id: string;
  createdAt: string;
  url: string;
};

type MediaImageNode = {
  __typename: "MediaImage";
  id: string;
  createdAt: string;
  image: { url: string };
};

type OtherFileNode = {
  __typename: string; // другие типы файлов, которые нам не нужны
  id: string;
  createdAt: string;
};

type FilesNode = GenericFileNode | MediaImageNode | OtherFileNode;

type FilesQueryResult = {
  files: {
    edges: Array<{ node: FilesNode }>;
  };
};

type ProductByHandleResult = {
  productByHandle: { id: string; title: string } | null;
};

type MetafieldsSetResult = {
  metafieldsSet: {
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
};

// ── Утилиты ───────────────────────────────────────────────────────
function parseCsv(raw: string): Array<Record<string, string>> {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = split(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  });

  function split(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur); cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }
}

function normalizeHeader(h: string): string {
  const t = h.trim();
  if (t.toLowerCase().startsWith("metafield:")) {
    return t.split(":")[1]?.trim() ?? "";
  }
  return t;
}

function pickUrl(node: FilesNode): string | undefined {
  if (node.__typename === "GenericFile") return node.url;
  if (node.__typename === "MediaImage") return node.image.url;
  return undefined;
}

function urlLooksLike(u: string, target: string): boolean {
  const lower = u.toLowerCase();
  const t = target.toLowerCase();
  return lower.endsWith(`/${t}`) || lower.includes(`/${t}?`);
}

// ── Основной обработчик ───────────────────────────────────────────
export async function GET(req: Request) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1) Пытаемся найти beer.csv через filename-фильтр
    const byName = await shopifyAdminRequest<FilesQueryResult>(Q_FILES, {
      query: `filename:${JSON.stringify(FILE_NAME)}`,
      first: 5,
    });

    let fileUrl = byName.files.edges.length ? pickUrl(byName.files.edges[0].node) : undefined;

    // 2) Если не нашли — ищем среди последних 100 файлов по хвосту URL
    let candidates: string[] = [];
    if (!fileUrl) {
      const latest = await shopifyAdminRequest<FilesQueryResult>(Q_FILES, {
        query: undefined,
        first: 100,
      });

      candidates = latest.files.edges
        .map((e) => pickUrl(e.node))
        .filter((u): u is string => typeof u === "string");

      const match = candidates.find((u) => urlLooksLike(u, FILE_NAME));
      if (match) fileUrl = match;
    }

    if (!fileUrl) {
      return NextResponse.json(
        { ok: false, error: `File "${FILE_NAME}" not found in Files`, candidates },
        { status: 404 }
      );
    }

    // 3) Скачиваем CSV
    const csvText = await fetch(fileUrl, { cache: "no-store" }).then((r) => r.text());
    const rowsRaw = parseCsv(csvText);
    if (!rowsRaw.length) return NextResponse.json({ ok: true, updated: 0, skipped: 0, errors: [] });

    // 4) Нормализуем заголовки
    const rows = rowsRaw.map((row) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) out[normalizeHeader(k)] = v ?? "";
      return out;
    });

    let updated = 0;
    let skipped = 0;
    const errors: Array<{ handle: string; message: string }> = [];

    // 5) По строкам: ищем товар и пишем метаполя
    for (const row of rows) {
      const handle = (row["Handle"] || row["handle"] || "").trim();
      if (!handle) { skipped++; continue; }

      // productId по handle
      let productId: string | null = null;
      try {
        const p = await shopifyAdminRequest<ProductByHandleResult>(Q_PRODUCT_BY_HANDLE, { handle });
        productId = p.productByHandle?.id ?? null;
      } catch (e: unknown) {
        errors.push({ handle, message: `Lookup error: ${String(e)}` });
        continue;
      }
      if (!productId) { errors.push({ handle, message: "Product not found by handle" }); continue; }

      // собрать метаполя
      const inputs: Array<{
        ownerId: string;
        namespace: string;
        key: string;
        type: MetaDef["type"];
        value: string;
      }> = [];

      for (const [header, def] of Object.entries(FIELD_MAP)) {
        const val = row[header]?.trim();
        if (!val) continue;

        // Если хочешь хранить shelf_life_days числом — раскомментируй блок ниже и поменяй type
        // if (def.key === "shelf_life_days") {
        //   const n = parseInt(val, 10);
        //   if (!Number.isNaN(n)) {
        //     inputs.push({ ownerId: productId, namespace: def.namespace, key: def.key, type: "number_integer", value: String(n) });
        //   }
        //   continue;
        // }

        inputs.push({ ownerId: productId, namespace: def.namespace, key: def.key, type: def.type, value: val });
      }

      if (!inputs.length) { skipped++; continue; }

      // записать в Shopify
      try {
        const r = await shopifyAdminRequest<MetafieldsSetResult>(M_METAFIELDS_SET, { metafields: inputs });
        if (r.metafieldsSet.userErrors?.length) {
          errors.push({ handle, message: JSON.stringify(r.metafieldsSet.userErrors) });
        } else {
          updated++;
        }
      } catch (e: unknown) {
        errors.push({ handle, message: `Mutation error: ${String(e)}` });
      }
    }

    return NextResponse.json({ ok: true, updated, skipped, errors });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
