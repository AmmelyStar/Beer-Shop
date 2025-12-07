// app/api/shopify/customer-login/route.ts

import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/app/lib/shopify/storefront";

const CUSTOMER_LOGIN_MUTATION = `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const data = await shopifyStorefrontFetch<{
      customerAccessTokenCreate: {
        customerAccessToken: { accessToken: string; expiresAt: string } | null;
        customerUserErrors: { code: string; field: string[]; message: string }[];
      };
    }>({
      query: CUSTOMER_LOGIN_MUTATION,
      variables: {
        input: { email, password },
      },
    });

    const { customerAccessToken, customerUserErrors } =
      data.customerAccessTokenCreate;

    if (customerUserErrors?.length || !customerAccessToken) {
      return NextResponse.json(
        {
          error:
            customerUserErrors[0]?.message ||
            "Unable to log in customer in Shopify",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        accessToken: customerAccessToken.accessToken,
        expiresAt: customerAccessToken.expiresAt,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Customer login error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
