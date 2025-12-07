// app/lib/shopify/customerAdmin.ts

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { shopifyAdminRestFetch } from "./admin";

type ShopifyCustomer = {
  id: number;
  email?: string | null;
};

type CustomersSearchResponse = {
  customers: ShopifyCustomer[];
};

type CustomerCreateResponse = {
  customer: ShopifyCustomer;
};

/**
 * 1) Берём текущего Clerk-пользователя
 * 2) Если в publicMetadata уже есть shopifyCustomerId — возвращаем его
 * 3) Иначе ищем customer в Shopify по email
 * 4) Если нет — создаём нового
 * 5) Сохраняем id в publicMetadata и возвращаем
 *
 * Если Admin API не даёт доступ к Customer (ACCESS_DENIED) —
 * возвращаем null, чтобы не ломать страницу.
 */
export async function getOrCreateShopifyCustomer(): Promise<string | null> {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress?.emailAddress) {
    return null;
  }

  const email = user.primaryEmailAddress.emailAddress;
  const publicMetadata =
    (user.publicMetadata || {}) as Record<string, unknown>;

  // 1. Уже есть ID в Clerk?
  const existingId = publicMetadata.shopifyCustomerId as
    | string
    | undefined;

  if (existingId) {
    return existingId;
  }

  let shopifyCustomerId: string | null = null;

  try {
    // 2. Ищем в Shopify по email
    const searchQuery = `email:${email}`;
    const searchData =
      await shopifyAdminRestFetch<CustomersSearchResponse>(
        `customers/search.json?query=${encodeURIComponent(searchQuery)}`
      );

    if (searchData.customers.length > 0) {
      shopifyCustomerId = String(searchData.customers[0].id);
    } else {
      // 3. Не нашли — создаём нового клиента
      const createPayload = {
        customer: {
          email,
          first_name: user.firstName ?? undefined,
          last_name: user.lastName ?? undefined,
        },
      };

      const createData =
        await shopifyAdminRestFetch<CustomerCreateResponse>(
          "customers.json",
          {
            method: "POST",
            body: JSON.stringify(createPayload),
          }
        );

      shopifyCustomerId = String(createData.customer.id);
    }
  } catch (err) {
    console.error("getOrCreateShopifyCustomer Admin error:", err);

    // Если это тот самый ACCESS_DENIED по Customer object —
    // просто возвращаем null, чтобы не падать.
    const msg =
      err instanceof Error ? err.message : String(err);
    if (msg.includes("ACCESS_DENIED")) {
      return null;
    }

    throw err; // другие ошибки пусть всплывают
  }

  if (!shopifyCustomerId) {
    return null;
  }

  // 4. Сохраняем в Clerk publicMetadata
  try {
    const client = await clerkClient();

    await client.users.updateUser(user.id, {
      publicMetadata: {
        ...publicMetadata,
        shopifyCustomerId,
        shopifySyncedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to save shopifyCustomerId to Clerk:", err);
    // даже если сохранить не получилось — всё равно возвращаем id
  }

  return shopifyCustomerId;
}
