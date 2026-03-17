// app/api/metafields/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { shopifyAdminRequest } from "../../lib/shopify/shopify";

const FILE_NAME = "beer.csv";

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

type CsvFieldMap = Record<string, MetaDef>;
type CsvRow = Record<string, string>;

const FIELD_MAP: CsvFieldMap = {
  country: {
    namespace: "custom",
    key: "country",
    type: "single_line_text_field",
  },
  "shelf life/days": {
    namespace: "custom",
    key: "shelf_life_days",
    type: "single_line_text_field",
  },
  brand: {
    namespace: "custom",
    key: "brand",
    type: "single_line_text_field",
  },
  style: {
    namespace: "custom",
    key: "style",
    type: "single_line_text_field",
  },
  abv: {
    namespace: "custom",
    key: "abv",
    type: "single_line_text_field",
  },
  ibu: {
    namespace: "custom",
    key: "ibu",
    type: "single_line_text_field",
  },
  fg: {
    namespace: "custom",
    key: "fg",
    type: "single_line_text_field",
  },
  // ВАЖНО:
  // pack size (l) НЕ пишем в product metafields автоматически,
  // потому что при нескольких variants у одного продукта объём должен жить в variant option.
  "pack type": {
    namespace: "custom",
    key: "pack_type",
    type: "single_line_text_field",
  },
  "bottle in the box": {
    namespace: "custom",
    key: "bottle_in_boxes",
    type: "single_line_text_field",
  },
  "bottle in the boxes": {
    namespace: "custom",
    key: "bottle_in_boxes",
    type: "single_line_text_field",
  },
  allergens: {
    namespace: "custom",
    key: "allergens",
    type: "multi_line_text_field",
  },
  ingredients: {
    namespace: "custom",
    key: "ingredients",
    type: "multi_line_text_field",
  },
  "tasted best with": {
    namespace: "custom",
    key: "tasted_best_with",
    type: "multi_line_text_field",
  },
  ean: {
    namespace: "custom",
    key: "ean",
    type: "single_line_text_field",
  },
  "box №": {
    namespace: "custom",
    key: "box_nr",
    type: "single_line_text_field",
  },
  "box no": {
    namespace: "custom",
    key: "box_nr",
    type: "single_line_text_field",
  },
  description: {
    namespace: "custom",
    key: "description_extra",
    type: "multi_line_text_field",
  },
};

const Q_FILES = `
query Files($query: String!, $first: Int!) {
  files(first: $first, query: $query) {
    edges {
      node {
        ... on GenericFile {
          id
          url
        }
      }
    }
  }
}
`;

const Q_PRODUCT_BY_HANDLE = `
query ProductId($handle: String!) {
  productByHandle(handle: $handle) {
    id
    handle
    title
  }
}
`;

const Q_PRODUCTS_BY_TITLE = `
query ProductsByTitle($query: String!, $first: Int!) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        handle
        title
      }
    }
  }
}
`;

const Q_PRODUCT_VARIANTS = `
query ProductVariants($id: ID!) {
  product(id: $id) {
    id
    title
    variants(first: 20) {
      edges {
        node {
          id
          title
          price
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
}
`;

const M_METAFIELDS_SET = `
mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      key
      namespace
      value
    }
    userErrors {
      field
      message
    }
  }
}
`;

const M_VARIANT_PRICE_UPDATE = `
mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants {
      id
      price
    }
    userErrors {
      field
      message
    }
  }
}
`;

type FilesResponse = {
  files: {
    edges: Array<{
      node: {
        id: string;
        url: string;
      };
    }>;
  };
};

type ProductHandleResponse = {
  productByHandle: {
    id: string;
    handle: string;
    title: string;
  } | null;
};

type ProductsByTitleResponse = {
  products: {
    edges: Array<{
      node: {
        id: string;
        handle: string;
        title: string;
      };
    }>;
  };
};

type VariantNode = {
  id: string;
  title: string;
  price: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
};

type ProductVariantsResponse = {
  product: {
    id: string;
    title: string;
    variants: {
      edges: Array<{
        node: VariantNode;
      }>;
    };
  } | null;
};

type MetafieldsSetResponse = {
  metafieldsSet: {
    metafields: Array<{
      key: string;
      namespace: string;
      value: string;
    }>;
    userErrors: Array<{
      field?: string[];
      message: string;
    }>;
  };
};

type VariantUpdateResponse = {
  productVariantsBulkUpdate: {
    productVariants: Array<{
      id: string;
      price: string;
    }>;
    userErrors: Array<{
      field?: string[];
      message: string;
    }>;
  };
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function normalizeCell(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrice(value: string): string {
  return value.trim().replace(",", ".");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeVolume(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(",", ".")
    .replace(/\s*l(itre|iter|iters|itres)?$/i, " l")
    .replace(/\s+/g, " ");
}

function escapeShopifySearchTerm(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

function parseCsv(raw: string): CsvRow[] {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row: Record<string, string>) => {
    const normalized: CsvRow = {};

    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = normalizeCell(value);
    }

    return normalized;
  });
}

function getRowVolume(row: CsvRow): string {
  return (
    row["pack size (l)"] ||
    row["pack size"] ||
    row["volume"] ||
    row["size"] ||
    row["option1 value"] ||
    ""
  );
}

function getRowPrice(row: CsvRow): string {
  return (
    row["sale price"] ||
    row["variant price"] ||
    row["price"] ||
    ""
  );
}

async function findProduct(row: CsvRow): Promise<{
  id: string;
  handle: string;
  title: string;
  foundBy: "handle" | "title" | null;
}> {
  const handle = row["handle"];
  const name = row["name"];

  if (handle) {
    const byHandle = await shopifyAdminRequest<ProductHandleResponse>(
      Q_PRODUCT_BY_HANDLE,
      { handle }
    );

    if (byHandle.productByHandle) {
      return {
        ...byHandle.productByHandle,
        foundBy: "handle",
      };
    }
  }

  if (name) {
    const titleQuery = `title:"${escapeShopifySearchTerm(name)}"`;

    const byTitle = await shopifyAdminRequest<ProductsByTitleResponse>(
      Q_PRODUCTS_BY_TITLE,
      {
        query: titleQuery,
        first: 10,
      }
    );

    const exactMatch = byTitle.products.edges.find(
      (edge) => normalizeText(edge.node.title) === normalizeText(name)
    );

    if (exactMatch) {
      return {
        ...exactMatch.node,
        foundBy: "title",
      };
    }

    const firstMatch = byTitle.products.edges[0]?.node;
    if (firstMatch) {
      return {
        ...firstMatch,
        foundBy: "title",
      };
    }
  }

  return {
    id: "",
    handle: "",
    title: "",
    foundBy: null,
  };
}

function findMatchingVariant(
  variants: VariantNode[],
  row: CsvRow
): VariantNode | null {
  if (!variants.length) return null;

  const csvVolumeRaw = getRowVolume(row);
  const csvVolume = csvVolumeRaw ? normalizeVolume(csvVolumeRaw) : "";

  if (!csvVolume) {
    return variants[0] ?? null;
  }

  const bySelectedOption = variants.find((variant) =>
    variant.selectedOptions?.some((option) => {
      const optionName = option.name.trim().toLowerCase();
      const optionValue = normalizeVolume(option.value);

      const isVolumeOption = [
        "volume",
        "size",
        "liter",
        "litre",
        "capacity",
      ].includes(optionName);

      return isVolumeOption && optionValue === csvVolume;
    })
  );

  if (bySelectedOption) return bySelectedOption;

  const byTitle = variants.find(
    (variant) => normalizeVolume(variant.title) === csvVolume
  );

  if (byTitle) return byTitle;

  const byTitleContains = variants.find((variant) =>
    normalizeVolume(variant.title).includes(csvVolume)
  );

  if (byTitleContains) return byTitleContains;

  return variants[0] ?? null;
}

export async function GET(req: Request) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const files = await shopifyAdminRequest<FilesResponse>(Q_FILES, {
      query: `filename:${FILE_NAME}`,
      first: 10,
    });

    const matchedFiles = files.files.edges ?? [];
    const fileUrl = matchedFiles[0]?.node?.url;

    if (!fileUrl) {
      return NextResponse.json(
        { ok: false, error: "CSV not found" },
        { status: 404 }
      );
    }

    const csv = await fetch(fileUrl).then((r) => r.text());
    const rows = parseCsv(csv);

    let updated = 0;
    const errors: Array<{ handle: string; error: string }> = [];
    const debug: Array<Record<string, unknown>> = [];

    for (const row of rows as CsvRow[]) {
      const handle = row["handle"];
      const name = row["name"];

      if (!handle && !name) {
        errors.push({
          handle: "",
          error: "Missing handle and name in CSV row",
        });
        continue;
      }

      const foundProduct = await findProduct(row);
      const productId = foundProduct.id || null;

      if (!productId) {
        errors.push({
          handle: handle || name || "",
          error: "Product not found by handle or title",
        });

        debug.push({
          handle: handle ?? "",
          titleFromCsv: name ?? "",
          rowVolume: getRowVolume(row),
          rowPrice: getRowPrice(row),
          productFound: false,
        });

        continue;
      }

      const productWithVariants =
        await shopifyAdminRequest<ProductVariantsResponse>(Q_PRODUCT_VARIANTS, {
          id: productId,
        });

      const variants =
        productWithVariants.product?.variants.edges.map((edge) => edge.node) ?? [];

      if (!variants.length) {
        errors.push({
          handle: handle || name || "",
          error: "No variants found for product",
        });

        debug.push({
          handle: handle ?? "",
          titleFromCsv: name ?? "",
          matchedProductTitle: foundProduct.title,
          matchedProductHandle: foundProduct.handle,
          foundBy: foundProduct.foundBy,
          rowVolume: getRowVolume(row),
          rowPrice: getRowPrice(row),
          productFound: true,
          variantFound: false,
        });

        continue;
      }

      const matchedVariant = findMatchingVariant(variants, row);

      if (!matchedVariant) {
        errors.push({
          handle: handle || name || "",
          error: "Matching variant not found",
        });

        debug.push({
          handle: handle ?? "",
          titleFromCsv: name ?? "",
          matchedProductTitle: foundProduct.title,
          matchedProductHandle: foundProduct.handle,
          foundBy: foundProduct.foundBy,
          rowVolume: getRowVolume(row),
          rowPrice: getRowPrice(row),
          availableVariants: variants.map((variant) => ({
            id: variant.id,
            title: variant.title,
            selectedOptions: variant.selectedOptions,
            price: variant.price,
          })),
          productFound: true,
          variantFound: false,
        });

        continue;
      }

      const metafields: Array<{
        ownerId: string;
        namespace: string;
        key: string;
        type: "single_line_text_field" | "multi_line_text_field" | "number_integer";
        value: string;
      }> = [];

      for (const [csvKey, def] of Object.entries(FIELD_MAP)) {
        const val = row[csvKey];
        if (!val) continue;

        metafields.push({
          ownerId: productId,
          namespace: def.namespace,
          key: def.key,
          type: def.type,
          value: val,
        });
      }

      if (metafields.length) {
        const metafieldResult =
          await shopifyAdminRequest<MetafieldsSetResponse>(M_METAFIELDS_SET, {
            metafields,
          });

        if (metafieldResult.metafieldsSet.userErrors.length > 0) {
          const message = metafieldResult.metafieldsSet.userErrors
            .map((e) => e.message)
            .join(", ");

          errors.push({
            handle: handle || name || "",
            error: `Metafields: ${message}`,
          });
        }
      }

      const rowPrice = getRowPrice(row);

      if (rowPrice) {
        const normalizedPrice = normalizePrice(rowPrice);

        const priceResult =
          await shopifyAdminRequest<VariantUpdateResponse>(
            M_VARIANT_PRICE_UPDATE,
            {
              productId,
              variants: [
                {
                  id: matchedVariant.id,
                  price: normalizedPrice,
                },
              ],
            }
          );

        if (priceResult.productVariantsBulkUpdate.userErrors.length > 0) {
          const message = priceResult.productVariantsBulkUpdate.userErrors
            .map((e) => e.message)
            .join(", ");

          errors.push({
            handle: handle || name || "",
            error: `Price: ${message}`,
          });
        }
      }

      debug.push({
        handle: handle ?? "",
        titleFromCsv: name ?? "",
        matchedProductTitle: foundProduct.title,
        matchedProductHandle: foundProduct.handle,
        foundBy: foundProduct.foundBy,
        rowVolume: getRowVolume(row),
        rowPrice: rowPrice,
        matchedVariant: {
          id: matchedVariant.id,
          title: matchedVariant.title,
          selectedOptions: matchedVariant.selectedOptions,
          oldPrice: matchedVariant.price,
        },
        productFound: true,
        variantFound: true,
      });

      updated++;
    }

    return NextResponse.json({
      ok: true,
      updated,
      fileUrl,
      totalRows: rows.length,
      errors,
      debug,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}