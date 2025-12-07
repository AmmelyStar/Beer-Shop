// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { shopifyStorefrontRequest } from "../../lib/shopify/shopify";

// ---------- Общие типы ----------
type Money = { amount: string }
type Image = { url: string; altText?: string | null };

type Variant = {
  id: string;
  title: string;
  image?: Image | null;
  price?: Money | null;
};

type CartLineNode = {
  id: string;
  quantity: number;
  merchandise: Variant;
};

type CartLineEdge = { node: CartLineNode };

type Cart = {
  id: string;
  checkoutUrl: string;
  lines: { edges: CartLineEdge[] };
};

type CartLineDto = {
  id: string;
  merchandiseId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  imageAlt: string;
};

type CartDto = {
  cartId: string;
  checkoutUrl: string | null;
  lines: CartLineDto[];
};

// ---------- Маппер Cart → DTO ----------
function mapCart(cart: Cart | null | undefined): CartDto {
  if (!cart) {
    return { cartId: "", checkoutUrl: null, lines: [] };
  }

  const lines: CartLineDto[] =
    cart.lines.edges?.map((edge) => {
      const v = edge.node.merchandise;
      return {
        id: edge.node.id,
        merchandiseId: v.id,
        title: v.title,
        quantity: edge.node.quantity,
        unitPrice: Number(v.price?.amount ?? 0),
        imageUrl: v.image?.url ?? "",
        imageAlt: v.image?.altText ?? v.title,
      };
    }) ?? [];

  return {
    cartId: cart.id,
    checkoutUrl: cart.checkoutUrl,
    lines,
  };
}

// ---------- Общий фрагмент для полей корзины ----------
const CART_FRAGMENT = `
  id
  checkoutUrl
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            image { url altText }
            price { amount }
          }
        }
      }
    }
  }
`;

// ---------- Запросы / мутации ----------
const MUTATION_CREATE = `
  mutation CartCreate {
    cartCreate {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

const MUTATION_ADD = `
  mutation CartLinesAdd($cartId: ID!, $variantId: ID!, $quantity: Int!) {
    cartLinesAdd(
      cartId: $cartId,
      lines: [{ merchandiseId: $variantId, quantity: $quantity }]
    ) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;



const QUERY_GET = `
  query CartGet($cartId: ID!) {
    cart(id: $cartId) {
      ${CART_FRAGMENT}
    }
  }
`;

const MUTATION_REMOVE = `
  mutation CartLinesRemove($cartId: ID!, $lineId: ID!) {
    cartLinesRemove(
      cartId: $cartId,
      lineIds: [$lineId]
    ) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

const MUTATION_UPDATE = `
  mutation CartLinesUpdate($cartId: ID!, $lineId: ID!, $quantity: Int!) {
    cartLinesUpdate(
      cartId: $cartId,
      lines: [{ id: $lineId, quantity: $quantity }]
    ) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

const MUTATION_CLEAR = `
  mutation CartClear($cartId: ID!) {
    cartLinesRemoveAll(cartId: $cartId) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

// ---------- Типы ответов ----------
type CreateResponse = {
  cartCreate: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type AddResponse = {
  cartLinesAdd: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type GetResponse = {
  cart: Cart | null;
};

type RemoveResponse = {
  cartLinesRemove: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type UpdateResponse = {
  cartLinesUpdate: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type ClearResponse = {
  cartLinesRemoveAll: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

// ---------- Сам handler ----------
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      cartId?: string;
      variantId?: string;
      lineId?: string;
      quantity?: number;
    };

    const { action, cartId, variantId, lineId, quantity } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing action" },
        { status: 400 }
      );
    }

    switch (action) {
      // --- CREATE ---
      case "create": {
        const data = await shopifyStorefrontRequest<CreateResponse>(
          MUTATION_CREATE
        );

        if (data.cartCreate.userErrors?.length) {
          console.error("cartCreate errors:", data.cartCreate.userErrors);
          return NextResponse.json(
            { error: "Cart create error", details: data.cartCreate.userErrors },
            { status: 500 }
          );
        }

        return NextResponse.json(mapCart(data.cartCreate.cart));
      }

     // --- ADD ---
case "add": {
  // variantId обязателен, cartId может отсутствовать при первом добавлении
  if (!variantId) {
    return NextResponse.json(
      { error: "Missing variantId" },
      { status: 400 }
    );
  }

  // нормализуем quantity: если не пришло или <= 0, используем 1
  const qty =
    typeof quantity === "number" && quantity > 0 ? quantity : 1;

  let effectiveCartId = cartId;

  // Если cartId нет – сначала создаём корзину
  if (!effectiveCartId) {
    const created = await shopifyStorefrontRequest<CreateResponse>(
      MUTATION_CREATE
    );

    if (created.cartCreate.userErrors?.length) {
      console.error(
        "cartCreate errors (from add):",
        created.cartCreate.userErrors
      );
      return NextResponse.json(
        {
          error: "Cart create error",
          details: created.cartCreate.userErrors,
        },
        { status: 500 }
      );
    }

    effectiveCartId = created.cartCreate.cart?.id ?? undefined;

    if (!effectiveCartId) {
      return NextResponse.json(
        { error: "No cartId returned from cartCreate" },
        { status: 500 }
      );
    }
  }

  // Теперь точно есть cartId – добавляем линию
  const data = await shopifyStorefrontRequest<AddResponse>(
    MUTATION_ADD,
    { cartId: effectiveCartId, variantId, quantity: qty }
  );

  if (data.cartLinesAdd.userErrors?.length) {
    console.error("cartLinesAdd errors:", data.cartLinesAdd.userErrors);
    return NextResponse.json(
      { error: "Cart add error", details: data.cartLinesAdd.userErrors },
      { status: 500 }
    );
  }

  return NextResponse.json(mapCart(data.cartLinesAdd.cart));
}
      // --- GET ---
      case "get": {
        if (!cartId) {
          return NextResponse.json(
            { error: "Missing cartId" },
            { status: 400 }
          );
        }

        const data = await shopifyStorefrontRequest<GetResponse>(QUERY_GET, {
          cartId,
        });

        return NextResponse.json(mapCart(data.cart));
      }

      // --- REMOVE ---
      case "remove": {
        if (!cartId || !lineId) {
          return NextResponse.json(
            { error: "Missing cartId or lineId" },
            { status: 400 }
          );
        }

        const data = await shopifyStorefrontRequest<RemoveResponse>(
          MUTATION_REMOVE,
          { cartId, lineId }
        );

        if (data.cartLinesRemove.userErrors?.length) {
          console.error(
            "cartLinesRemove errors:",
            data.cartLinesRemove.userErrors
          );
          return NextResponse.json(
            {
              error: "Cart remove error",
              details: data.cartLinesRemove.userErrors,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(mapCart(data.cartLinesRemove.cart));
      }

      // --- UPDATE ---
      case "update": {
        if (!cartId || !lineId || typeof quantity !== "number") {
          return NextResponse.json(
            { error: "Missing cartId, lineId or quantity" },
            { status: 400 }
          );
        }

        const data = await shopifyStorefrontRequest<UpdateResponse>(
          MUTATION_UPDATE,
          { cartId, lineId, quantity }
        );

        if (data.cartLinesUpdate.userErrors?.length) {
          console.error(
            "cartLinesUpdate errors:",
            data.cartLinesUpdate.userErrors
          );
          return NextResponse.json(
            {
              error: "Cart update error",
              details: data.cartLinesUpdate.userErrors,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(mapCart(data.cartLinesUpdate.cart));
      }

      // --- CLEAR ---
      case "clear": {
        if (!cartId) {
          return NextResponse.json(
            { error: "Missing cartId" },
            { status: 400 }
          );
        }

        const data = await shopifyStorefrontRequest<ClearResponse>(
          MUTATION_CLEAR,
          { cartId }
        );

        if (data.cartLinesRemoveAll.userErrors?.length) {
          console.error(
            "cartLinesRemoveAll errors:",
            data.cartLinesRemoveAll.userErrors
          );
          return NextResponse.json(
            {
              error: "Cart clear error",
              details: data.cartLinesRemoveAll.userErrors,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(mapCart(data.cartLinesRemoveAll.cart));
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("Cart API fatal error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
