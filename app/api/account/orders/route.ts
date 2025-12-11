// app/api/account/orders/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
  line_items: {
    id: number;
    name: string;
    quantity: number;
  }[];
};

type OrdersResponse = {
  orders: ShopifyOrder[];
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Берём / создаём Shopify customer для этого пользователя
  const customerId = await getOrCreateShopifyCustomer();

  if (!customerId) {
    // Нет доступа к Customer в Admin API или другая проблема — просто отдаём пустой список
    return NextResponse.json({ orders: [] });
  }

  try {
    const query = `orders.json?customer_id=${customerId}&status=any&order=created_at%20desc&limit=20`;

    const data = await shopifyAdminRestFetch<OrdersResponse>(query);

    const orders = (data.orders || []).map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: o.created_at,
      financialStatus: o.financial_status,
      fulfillmentStatus: o.fulfillment_status,
      totalPrice: o.total_price,
      currency: o.currency,
      lineItems: o.line_items.map((li) => ({
        id: li.id,
        name: li.name,
        quantity: li.quantity,
      })),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Error fetching Shopify orders:", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
