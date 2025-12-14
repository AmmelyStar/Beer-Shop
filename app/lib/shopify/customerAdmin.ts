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

// Универсальный хелпер: Clerk в разных версиях экспортирует clerkClient
// либо как объект, либо как функцию.
async function getClerkClient() {
  const maybeFn = clerkClient as unknown;
  if (typeof maybeFn === "function") {
    return (await (maybeFn as () => Promise<typeof clerkClient>)()) as any;
  }
  return clerkClient as any;
}

function isLikelyHtmlJsonParseError(err: unknown): boolean {
  // Часто выглядит как: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
  return (
    err instanceof SyntaxError &&
    typeof err.message === "string" &&
    err.message.includes("Unexpected token") &&
    err.message.includes("<")
  );
}

/**
 * 1) Берём текущего Clerk-пользователя
 * 2) Если в publicMetadata уже есть shopifyCustomerId — возвращаем его
 * 3) Иначе ищем customer в Shopify по email
 * 4) Если нет — создаём нового
 * 5) Сохраняем id в publicMetadata и возвращаем
 *
 * Если Admin API не даёт доступ (ACCESS_DENIED / 401 / 403) —
 * возвращаем null, чтобы не ломать страницу.
 */
export async function getOrCreateShopifyCustomer(): Promise<string | null> {
  const user = await currentUser();

  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email) return null;

  const publicMetadata = (user.publicMetadata || {}) as Record<string, unknown>;

  // Уже есть ID в Clerk?
  const existingId = publicMetadata.shopifyCustomerId as string | undefined;
  if (existingId) return existingId;

  let shopifyCustomerId: string | null = null;

  try {
    // 1) Search by email
    const searchQuery = `email:${email}`;
    const searchPath = `customers/search.json?query=${encodeURIComponent(
      searchQuery
    )}`;

    const searchData = await shopifyAdminRestFetch<CustomersSearchResponse>(
      searchPath
    );

    if (Array.isArray(searchData.customers) && searchData.customers.length > 0) {
      shopifyCustomerId = String(searchData.customers[0].id);
    } else {
      // 2) Create customer
      const createPayload = {
        customer: {
          email,
          first_name: user.firstName ?? undefined,
          last_name: user.lastName ?? undefined,
        },
      };

      const createData = await shopifyAdminRestFetch<CustomerCreateResponse>(
        "customers.json",
        {
          method: "POST",
          body: JSON.stringify(createPayload),
        }
      );

      shopifyCustomerId = String(createData.customer.id);
    }
  } catch (err: unknown) {
    // Ловим и логируем максимально понятно
    console.error("getOrCreateShopifyCustomer Admin error:", err);

    const msg = err instanceof Error ? err.message : String(err);

    // Частый кейс: shopifyAdminRestFetch пытался распарсить HTML как JSON
    if (isLikelyHtmlJsonParseError(err)) {
      // Обычно причина: 401/403 (токен), 404 (не тот домен/версия), редирект.
      // Не роняем Account страницу.
      return null;
    }

    // Явные “не трогаем customers” / нет прав:
    if (msg.includes("ACCESS_DENIED") || msg.includes("401") || msg.includes("403")) {
      return null;
    }

    // Остальные ошибки пусть всплывают (чтобы ты их увидела в деве)
    throw err;
  }

  if (!shopifyCustomerId) return null;

  // Сохраняем в Clerk publicMetadata
  try {
    const client = await getClerkClient();
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
