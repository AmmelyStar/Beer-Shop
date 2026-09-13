// app/api/account/orders/route.ts

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { shopifyAdminRestFetch } from "@/app/lib/shopify/admin";
import { getOrCreateShopifyCustomer } from "@/app/lib/shopify/customerAdmin";

type ShopifyImage = {
  id: number;
  src: string;
  alt: string | null;
};

type ShopifyProductVariant = {
  id: number;
  title: string;
  image_id: number | null;
};

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  image: ShopifyImage | null;
  images: ShopifyImage[];
  variants: ShopifyProductVariant[];
};

type ShopifyProductResponse = {
  product: ShopifyProduct;
};

type ShopifyLineItem = {
  id: number;
  name: string;
  title: string;
  quantity: number;
  price: string;
  product_id: number | null;
  variant_id: number | null;
  variant_title: string | null;
};

type ShopifyOrder = {
  id: number;
  name: string;
  processed_at: string;
  fulfillment_status: string | null;
  financial_status: string;
  current_total_price: string;
  currency: string;
  status_url: string | null;
  line_items: ShopifyLineItem[];
};

type CustomerOrdersResponse = {
  orders: ShopifyOrder[];
};

type OrderLineItemForUi = {
  id: number;
  productId: number | null;
  variantId: number | null;
  name: string;
  quantity: number;
  price: string;
  handle: string | null;
  imageSrc: string | null;
  imageAlt: string;
};

type OrderForUi = {
  id: number;
  name: string;
  createdAt: string;
  fulfillmentStatus: string | null;
  financialStatus: string;
  totalPrice: string;
  currency: string;
  statusUrl: string | null;
  lineItems: OrderLineItemForUi[];
};

async function getProductsForOrders(
  orders: ShopifyOrder[],
): Promise<Map<number, ShopifyProduct>> {
  const productIds = Array.from(
    new Set(
      orders
        .flatMap((order) =>
          order.line_items.map((item) => item.product_id),
        )
        .filter(
          (productId): productId is number =>
            typeof productId === "number",
        ),
    ),
  );

  const productResults: Array<ShopifyProduct | null> =
    await Promise.all(
      productIds.map(
        async (
          productId,
        ): Promise<ShopifyProduct | null> => {
          try {
            const endpoint =
              `products/${productId}.json` +
              "?fields=id,title,handle,image,images,variants";

            const response =
              await shopifyAdminRestFetch<ShopifyProductResponse>(
                endpoint,
              );

            return response.product;
          } catch (error: unknown) {
            console.warn(
              `Could not load Shopify product ${productId}:`,
              error instanceof Error
                ? error.message
                : String(error),
            );

            return null;
          }
        },
      ),
    );

  const validProducts = productResults.filter(
    (
      product: ShopifyProduct | null,
    ): product is ShopifyProduct => product !== null,
  );

  return new Map<number, ShopifyProduct>(
    validProducts.map(
      (product): [number, ShopifyProduct] => [
        product.id,
        product,
      ],
    ),
  );
}

function mapOrders(
  orders: ShopifyOrder[],
  products: Map<number, ShopifyProduct>,
): OrderForUi[] {
  return orders.map((order) => ({
    id: order.id,
    name: order.name,
    createdAt: order.processed_at,
    fulfillmentStatus: order.fulfillment_status,
    financialStatus: order.financial_status,
    totalPrice: order.current_total_price,
    currency: order.currency,
    statusUrl: order.status_url,

    lineItems: order.line_items.map((item) => {
      const product =
        item.product_id !== null
          ? products.get(item.product_id)
          : undefined;

      const variant = product?.variants.find(
        (productVariant) =>
          productVariant.id === item.variant_id,
      );

      const variantImage =
        variant?.image_id != null
          ? product?.images.find(
              (image) => image.id === variant.image_id,
            )
          : undefined;

     const image =
  variantImage ??
  product?.image ??
  product?.images?.[0] ??
  null;

      return {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        name:
          item.name ||
          product?.title ||
          item.title,
        quantity: item.quantity,
        price: item.price,
        handle: product?.handle ?? null,
        imageSrc: image?.src ?? null,
        imageAlt:
          image?.alt ||
          product?.title ||
          item.title ||
          item.name,
      };
    }),
  }));
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

   const customerId =
  await getOrCreateShopifyCustomer();

if (!customerId) {
  return NextResponse.json(
    { error: "Shopify customer not found" },
    { status: 404 },
  );
}

    const ordersEndpoint =
      `customers/${customerId}/orders.json` +
      "?status=any" +
      "&limit=20" +
      "&order=processed_at%20desc" +
      "&fields=id,name,processed_at,fulfillment_status,financial_status,current_total_price,currency,status_url,line_items";

    const ordersResponse =
      await shopifyAdminRestFetch<CustomerOrdersResponse>(
        ordersEndpoint,
      );

    const orders = ordersResponse.orders ?? [];
    const products = await getProductsForOrders(orders);

    return NextResponse.json(
      {
        orders: mapOrders(orders, products),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "Account orders error:",
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error,
    );

    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}