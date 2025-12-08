// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { shopifyStorefrontRequest } from "../../lib/shopify/shopify";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateCustomerAccessTokenForEmail } from "../../lib/shopify/customerAccount";

// ---------- Общие типы ----------
type Money = { amount: string };
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

// 🔹 Удаляем ВСЕ линии через cartLinesRemove с массивом lineIds
const MUTATION_CLEAR = `
  mutation CartClear($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(
      cartId: $cartId,
      lineIds: $lineIds
    ) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

// 👇 мутация для привязки корзины к customerAccessToken
const MUTATION_BUYER_IDENTITY_UPDATE = `
  mutation CartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
  ) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
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
  cartLinesRemove: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type BuyerIdentityUpdateResponse = {
  cartBuyerIdentityUpdate: {
    cart: Cart | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

// ---------- helper: пытаемся получить customerAccessToken, но НЕ ломаем API ----------
async function tryGetCustomerAccessToken(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const token = await getOrCreateCustomerAccessTokenForEmail(email);
    return token;
  } catch (e) {
    console.error("Failed to get customerAccessToken, using guest cart:", e);
    return null;
  }
}

// ---------- helper: пытаемся “прибить” корзину к customerAccessToken ----------
async function attachBuyerIdentity(
  cart: Cart | null,
  customerAccessToken: string | null
): Promise<Cart | null> {
  if (!cart || !customerAccessToken) return cart;

  try {
    const data =
      await shopifyStorefrontRequest<BuyerIdentityUpdateResponse>(
        MUTATION_BUYER_IDENTITY_UPDATE,
        {
          cartId: cart.id,
          buyerIdentity: {
            customerAccessToken,
          },
        }
      );

    if (data.cartBuyerIdentityUpdate.userErrors?.length) {
      console.error(
        "cartBuyerIdentityUpdate errors:",
        data.cartBuyerIdentityUpdate.userErrors
      );
      // не ломаем ответ – просто возвращаем оригинальную корзину
      return cart;
    }

    return data.cartBuyerIdentityUpdate.cart ?? cart;
  } catch (e) {
    console.error("cartBuyerIdentityUpdate fatal error:", e);
    return cart;
  }
}

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
            {
              error: "Cart create error",
              details: data.cartCreate.userErrors,
            },
            { status: 500 }
          );
        }

        let cart = data.cartCreate.cart;

        // пробуем привязать корзину к Shopify customer
        const customerAccessToken = await tryGetCustomerAccessToken();
        cart = await attachBuyerIdentity(cart, customerAccessToken);

        return NextResponse.json(mapCart(cart));
      }

      // --- ADD ---
      case "add": {
        if (!variantId) {
          return NextResponse.json(
            { error: "Missing variantId" },
            { status: 400 }
          );
        }

        const qty =
          typeof quantity === "number" && quantity > 0 ? quantity : 1;

        let effectiveCartId = cartId;
        let createdCart: Cart | null = null;

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

          createdCart = created.cartCreate.cart;
          effectiveCartId = createdCart?.id ?? undefined;

          if (!effectiveCartId) {
            return NextResponse.json(
              { error: "No cartId returned from cartCreate" },
              { status: 500 }
            );
          }

          // пробуем привязать корзину к Shopify customer после создания
          const customerAccessToken = await tryGetCustomerAccessToken();
          createdCart = await attachBuyerIdentity(createdCart, customerAccessToken);
        }

        // Теперь точно есть cartId – добавляем линию
        const data = await shopifyStorefrontRequest<AddResponse>(
          MUTATION_ADD,
          { cartId: effectiveCartId, variantId, quantity: qty }
        );

        if (data.cartLinesAdd.userErrors?.length) {
          console.error("cartLinesAdd errors:", data.cartLinesAdd.userErrors);
          return NextResponse.json(
            {
              error: "Cart add error",
              details: data.cartLinesAdd.userErrors,
            },
            { status: 500 }
          );
        }

        // если мы только что создавали cart и обновляли buyerIdentity,
        // можно было бы вернуть createdCart, но у нас уже есть актуальная cart после add
        return NextResponse.json(mapCart(data.cartLinesAdd.cart));
      }

      // --- GET ---
      case "get": {
        if (!cartId || cartId === "undefined" || cartId === "null") {
          return NextResponse.json(mapCart(null));
        }

        try {
          const data = await shopifyStorefrontRequest<GetResponse>(QUERY_GET, {
            cartId,
          });

          return NextResponse.json(mapCart(data.cart));
        } catch (error) {
          console.error("Cart get error:", error);
          return NextResponse.json(mapCart(null));
        }
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
        // если cartId нет или он мусорный – просто отдаём пустую корзину
        if (!cartId || cartId === "undefined" || cartId === "null") {
          return NextResponse.json(mapCart(null));
        }

        // 1. забираем текущую корзину, чтобы узнать все lineIds
        const existing = await shopifyStorefrontRequest<GetResponse>(
          QUERY_GET,
          { cartId }
        );

        const cart = existing.cart;
        const lineIds =
          cart?.lines.edges.map((edge) => edge.node.id) ?? [];

        // корзина уже пустая
        if (!cart || lineIds.length === 0) {
          return NextResponse.json(mapCart(cart ?? null));
        }

        // 2. удаляем все линии одним вызовом
        const data = await shopifyStorefrontRequest<ClearResponse>(
          MUTATION_CLEAR,
          { cartId, lineIds }
        );

        if (data.cartLinesRemove.userErrors?.length) {
          console.error(
            "cartLinesRemove (clear) errors:",
            data.cartLinesRemove.userErrors
          );
          return NextResponse.json(
            {
              error: "Cart clear error",
              details: data.cartLinesRemove.userErrors,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(mapCart(data.cartLinesRemove.cart));
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
