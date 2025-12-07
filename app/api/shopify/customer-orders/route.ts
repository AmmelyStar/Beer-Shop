// app/api/shopify/account-orders/route.ts

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { shopifyStorefrontFetch } from "@/app/lib/shopify/storefront";
import { getOrCreateCustomerAccessTokenForEmail } from "@/app/lib/shopify/customerAccount";

const CUSTOMER_ORDERS_QUERY = `
  query CustomerOrders($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      email
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            fulfillmentStatus
            financialStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

type CustomerOrdersResponse = {
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    orders: {
      edges: {
        node: {
          id: string;
          name: string;
          processedAt: string;
          fulfillmentStatus: string;
          financialStatus: string;
          totalPriceSet: {
            shopMoney: { amount: string; currencyCode: string };
          };
        };
      }[];
    };
  } | null;
};

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const email = user.primaryEmailAddress.emailAddress;

    // 1. Получаем (или создаём) customerAccessToken для этого email
    const accessToken =
      await getOrCreateCustomerAccessTokenForEmail(email);

    // 2. Тянем заказы из Shopify Storefront API
    const data = await shopifyStorefrontFetch<CustomerOrdersResponse>({
      query: CUSTOMER_ORDERS_QUERY,
      variables: { customerAccessToken: accessToken },
    });

    if (!data.customer) {
      return NextResponse.json(
        { error: "Customer not found in Shopify" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        customer: {
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email: data.customer.email,
        },
        orders: data.customer.orders.edges.map((edge) => edge.node),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Account orders error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
