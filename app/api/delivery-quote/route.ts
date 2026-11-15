// app/api/delivery-quote/route.ts

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { shopifyAdminGraphqlFetch } from "@/app/lib/shopify/admin";

export const runtime = "nodejs";

const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

type QuoteLine = {
  merchandiseId: string;
  quantity: number;
};

type QuoteCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
};

type DeliveryQuoteBody = {
  countryCode: string;
  customer: QuoteCustomer;
  lines: QuoteLine[];
  cartId?: string;
  lang?: string;
  website?: string;
};

type VariantPricesQuery = {
  nodes: Array<{
    id: string;
    price: string;
  } | null>;
};

type ExistingDraftOrder = {
  id: string;
  name: string;
  status: string;
  completedAt: string | null;
};

type DraftOrdersQuery = {
  draftOrders: {
    nodes: ExistingDraftOrder[];
  };
};

type DraftOrderCreateMutation = {
  draftOrderCreate: {
    draftOrder: {
      id: string;
      name: string;
      status: string;
      totalPriceSet: {
        shopMoney: {
          amount: string;
          currencyCode: string;
        };
      };
    } | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
  };
};

const VARIANT_PRICES_QUERY = `
  query VariantPrices($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price
      }
    }
  }
`;

const FIND_DRAFT_ORDER_QUERY = `
  query FindDeliveryDraftOrder($search: String!) {
    draftOrders(
      first: 1
      query: $search
      sortKey: UPDATED_AT
      reverse: true
    ) {
      nodes {
        id
        name
        status
        completedAt
      }
    }
  }
`;

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        status
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isValidCartId(cartId: string): boolean {
  return cartId.startsWith(
    "gid://shopify/Cart/"
  );
}

function createCartTag(cartId: string): string {
  const hash = createHash("sha256")
    .update(cartId)
    .digest("hex")
    .slice(0, 24);

  return `delivery-cart-${hash}`;
}

function normalizeLines(
  value: unknown
): QuoteLine[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return null;
  }

  const lines: QuoteLine[] = [];

  for (const item of value) {
    if (!isObject(item)) {
      return null;
    }

    const merchandiseId = getString(
      item.merchandiseId
    );

    const quantity =
      typeof item.quantity === "number"
        ? item.quantity
        : Number(item.quantity);

    if (
      !merchandiseId.startsWith(
        "gid://shopify/ProductVariant/"
      ) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    ) {
      return null;
    }

    lines.push({
      merchandiseId,
      quantity,
    });
  }

  return lines;
}

function getPublicStatus(
  draft: ExistingDraftOrder
): "pending" | "paid" {
  if (
    draft.status === "COMPLETED" ||
    draft.completedAt
  ) {
    return "paid";
  }

  return "pending";
}

async function findDraftOrder(
  cartId: string
): Promise<ExistingDraftOrder | null> {
  const cartTag = createCartTag(cartId);

  const data =
    await shopifyAdminGraphqlFetch<DraftOrdersQuery>(
      FIND_DRAFT_ORDER_QUERY,
      {
        search: `tag:${cartTag}`,
      }
    );

  return data.draftOrders.nodes[0] ?? null;
}

/**
 * Проверяет состояние запроса доставки.
 *
 * GET /api/delivery-quote?cartId=...
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const cartId = getString(
      url.searchParams.get("cartId")
    );

    if (!cartId || !isValidCartId(cartId)) {
      return NextResponse.json(
        {
          error: "Valid cart ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const draft = await findDraftOrder(
      cartId
    );

    if (!draft) {
      return NextResponse.json({
        status: "none",
        requestNumber: null,
      });
    }

    return NextResponse.json({
      status: getPublicStatus(draft),
      requestNumber: draft.name,
    });
  } catch (error: unknown) {
    console.error(
      "Delivery quote status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not check delivery quote status",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rawBody: unknown =
      await request.json();

    if (!isObject(rawBody)) {
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      rawBody as unknown as DeliveryQuoteBody;

    /*
     * Скрытое поле против простых ботов.
     */
    if (getString(body.website)) {
      return NextResponse.json({
        success: true,
      });
    }

    const countryCode = getString(
      body.countryCode
    ).toUpperCase();

    if (!EU_COUNTRY_CODES.has(countryCode)) {
      return NextResponse.json(
        {
          error:
            "Delivery country is not supported",
        },
        {
          status: 400,
        }
      );
    }

    const cartId = getString(body.cartId);

    if (!cartId || !isValidCartId(cartId)) {
      return NextResponse.json(
        {
          error: "Valid cart ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isObject(body.customer)) {
      return NextResponse.json(
        {
          error:
            "Customer information is required",
        },
        {
          status: 400,
        }
      );
    }

    const firstName = getString(
      body.customer.firstName
    );

    const lastName = getString(
      body.customer.lastName
    );

    const email = getString(
      body.customer.email
    ).toLowerCase();

    const phone = getString(
      body.customer.phone
    );

    const address1 = getString(
      body.customer.address1
    );

    const address2 = getString(
      body.customer.address2
    );

    const city = getString(
      body.customer.city
    );

    const postalCode = getString(
      body.customer.postalCode
    );

    if (
      !firstName ||
      !lastName ||
      !isValidEmail(email) ||
      !address1 ||
      !city ||
      !postalCode
    ) {
      return NextResponse.json(
        {
          error:
            "Required customer fields are missing",
        },
        {
          status: 400,
        }
      );
    }

    const lines = normalizeLines(body.lines);

    if (!lines) {
      return NextResponse.json(
        {
          error: "Cart lines are invalid",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Проверяем, не отправлялась ли эта корзина раньше.
     */
    const existingDraft =
      await findDraftOrder(cartId);

    if (existingDraft) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        status:
          getPublicStatus(existingDraft),
        requestNumber: existingDraft.name,
      });
    }

    /*
     * Получаем реальные цены непосредственно
     * из Shopify. Сумме из браузера не доверяем.
     */
    const variantIds = [
      ...new Set(
        lines.map(
          (line) => line.merchandiseId
        )
      ),
    ];

    const variantData =
      await shopifyAdminGraphqlFetch<VariantPricesQuery>(
        VARIANT_PRICES_QUERY,
        {
          ids: variantIds,
        }
      );

    const priceByVariantId = new Map<
      string,
      number
    >();

    for (const variant of variantData.nodes) {
      if (!variant) {
        continue;
      }

      const price = Number(variant.price);

      if (Number.isFinite(price)) {
        priceByVariantId.set(
          variant.id,
          price
        );
      }
    }

    let subtotal = 0;

    for (const line of lines) {
      const price = priceByVariantId.get(
        line.merchandiseId
      );

      if (price === undefined) {
        return NextResponse.json(
          {
            error:
              "One or more products were not found",
          },
          {
            status: 400,
          }
        );
      }

      subtotal += price * line.quantity;
    }

    subtotal =
      Math.round(subtotal * 100) / 100;

    const requiresDeliveryQuote =
      countryCode !== "EE" ||
      subtotal > 50;

    if (!requiresDeliveryQuote) {
      return NextResponse.json(
        {
          error:
            "This order should use the standard checkout",
          code:
            "STANDARD_CHECKOUT_REQUIRED",
        },
        {
          status: 409,
        }
      );
    }

    const lang = getString(body.lang);
    const cartTag = createCartTag(cartId);

    const draftData =
      await shopifyAdminGraphqlFetch<DraftOrderCreateMutation>(
        DRAFT_ORDER_CREATE_MUTATION,
        {
          input: {
            email,
            phone: phone || undefined,

            shippingAddress: {
              firstName,
              lastName,
              address1,
              address2:
                address2 || undefined,
              city,
              zip: postalCode,
              countryCode,
              phone: phone || undefined,
            },

            lineItems: lines.map(
              (line) => ({
                variantId:
                  line.merchandiseId,
                quantity: line.quantity,
              })
            ),

            tags: [
              "delivery-quote-request",
              "website-order",
              cartTag,
            ],

            note:
              "The customer requested an individual delivery quote. Do not send an invoice until the delivery cost has been added.",

            customAttributes: [
              {
                key: "Delivery country",
                value: countryCode,
              },
              {
                key: "Cart subtotal",
                value: `${subtotal.toFixed(
                  2
                )} EUR`,
              },
              {
                key: "Cart ID",
                value: cartId,
              },
              {
                key: "Website language",
                value:
                  lang || "Not provided",
              },
            ],

            allowDiscountCodesInCheckout:
              true,
          },
        }
      );

    const result =
      draftData.draftOrderCreate;

    if (result.userErrors.length > 0) {
      console.error(
        "Draft order user errors:",
        result.userErrors
      );

      return NextResponse.json(
        {
          error:
            "Shopify could not create the draft order",
          details: result.userErrors,
        },
        {
          status: 400,
        }
      );
    }

    if (!result.draftOrder) {
      return NextResponse.json(
        {
          error:
            "Shopify did not return a draft order",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadySubmitted: false,
        status: "pending",
        requestNumber:
          result.draftOrder.name,
        subtotal,
        currency:
          result.draftOrder
            .totalPriceSet.shopMoney
            .currencyCode,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Delivery quote API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not create delivery quote request",
      },
      {
        status: 500,
      }
    );
  }
}