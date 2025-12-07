// app/lib/shopify/customers.ts

import { shopifyAdminRequest } from "../shopify/shopify";
import {
  CUSTOMER_CREATE,
  CUSTOMER_FIND_BY_EMAIL,
} from "@/app/lib/shopify/queries/customers.gql";

type CustomerNode = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type CustomersByEmailResponse = {
  customers: {
    edges: Array<{ node: CustomerNode }>;
  };
};

type CustomerCreateResponse = {
  customerCreate: {
    customer: CustomerNode | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

export async function findShopifyCustomerByEmail(
  email: string
): Promise<CustomerNode | null> {
  const data = await shopifyAdminRequest<CustomersByEmailResponse>(
    CUSTOMER_FIND_BY_EMAIL,
    { query: `email:${email}` }
  );

  return data.customers.edges[0]?.node ?? null;
}

export async function createShopifyCustomer(input: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}): Promise<CustomerNode> {
  const data = await shopifyAdminRequest<CustomerCreateResponse>(
    CUSTOMER_CREATE,
    { input }
  );

  if (data.customerCreate.userErrors.length) {
    console.error("customerCreate errors", data.customerCreate.userErrors);
    throw new Error("Failed to create Shopify customer");
  }

  if (!data.customerCreate.customer) {
    throw new Error("No customer returned from Shopify");
  }

  return data.customerCreate.customer;
}

/**
 * Главная функция: синхронизирует пользователя из Clerk в Shopify
 */
export async function syncClerkUserToShopify(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}): Promise<CustomerNode> {
  const existing = await findShopifyCustomerByEmail(params.email);
  if (existing) {
    return existing;
  }

  return createShopifyCustomer(params);
}
