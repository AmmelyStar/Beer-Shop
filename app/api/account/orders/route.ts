// app/api/account/orders/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getOrCreateShopifyCustomer } from "@/app/lib/shopify/customerAdmin";
import { shopifyAdminRestFetch } from "@/app/lib/shopify/admin";

type ShopifyOrder = {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;

  checkout?: {
    order_status_url?: string | null;
  } | null;

  line_items: {
    id: number;
    name: string;
    quantity: number;
  }[];
};

type OrdersResponse = {
  orders: ShopifyOrder[];
};

function mapOrders(data: OrdersResponse) {
  return (data.orders || []).map((o) => ({
    id: o.id,
    name: o.name,
    createdAt: o.created_at,
    financialStatus: o.financial_status,
    fulfillmentStatus: o.fulfillment_status,
    totalPrice: o.total_price,
    currency: o.currency,
    statusUrl: o.checkout?.order_status_url ?? null,
    lineItems: o.line_items.map((li) => ({
      id: li.id,
      name: li.name,
      quantity: li.quantity,
    })),
  }));
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const customerId = await getOrCreateShopifyCustomer();

  try {
    const baseFields =
      "id,name,created_at,financial_status,fulfillment_status,total_price,currency,checkout,line_items";

    // 1) основной запрос по customer_id (если есть)
    if (customerId) {
      const query =
        `orders.json?customer_id=${customerId}` +
        `&status=any&order=created_at%20desc&limit=20` +
        `&fields=${baseFields}`;

      console.log("SHOPIFY CUSTOMER ID:", customerId);

      const data = await shopifyAdminRestFetch<OrdersResponse>(query);

      console.log("ORDERS COUNT (by customer):", data.orders?.length ?? 0);

      // если нашлись — отдаём
      if ((data.orders?.length ?? 0) > 0) {
        return NextResponse.json({ orders: mapOrders(data) });
      }
    }

    // 2) fallback: поиск заказов по email (важно для guest/непривязанных)
    if (email) {
      const byEmail =
        `orders.json?status=any&order=created_at%20desc&limit=20` +
        `&query=email:${encodeURIComponent(email)}` +
        `&fields=${baseFields}`;

      console.log("FALLBACK ORDERS BY EMAIL:", email);

      const data2 = await shopifyAdminRestFetch<OrdersResponse>(byEmail);

      console.log("ORDERS COUNT (by email):", data2.orders?.length ?? 0);

      return NextResponse.json({ orders: mapOrders(data2) });
    }

    // если нет ни customerId, ни email — просто пусто
    return NextResponse.json({ orders: [] });
  } catch (err) {
    console.error("Error fetching Shopify orders:", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
