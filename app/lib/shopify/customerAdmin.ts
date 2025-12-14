// app/lib/shopify/customerAdmin.ts
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { shopifyAdminRestFetch } from "./admin";

// Типизируем минимально то, что нам нужно от Clerk client
type ClerkUsersApi = {
  updateUser: (
    userId: string,
    data: { publicMetadata: Record<string, unknown> }
  ) => Promise<unknown>;
};

type ClerkClientLike = {
  users: ClerkUsersApi;
};

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

// Универсальный хелпер: clerkClient может быть объектом или функцией (в зависимости от версии).
async function getClerkClient(): Promise<ClerkClientLike> {
  const cc = clerkClient as unknown;

  // Вариант 1: clerkClient — функция, возвращает client
  if (typeof cc === "function") {
    const produced = await (cc as () => Promise<unknown>)();
    // runtime-check на наличие users.updateUser
    if (
      produced &&
      typeof produced === "object" &&
      "users" in produced &&
      (produced as { users?: unknown }).users &&
      typeof (produced as { users: { updateUser?: unknown } }).users.updateUser === "function"
    ) {
      return produced as ClerkClientLike;
    }
    throw new Error("clerkClient() did not return expected client shape");
  }

  // Вариант 2: clerkClient — объект
  if (
    cc &&
    typeof cc === "object" &&
    "users" in cc &&
    (cc as { users?: unknown }).users &&
    typeof (cc as { users: { updateUser?: unknown } }).users.updateUser === "function"
  ) {
    return cc as ClerkClientLike;
  }

  throw new Error("clerkClient has unexpected shape");
}

function isLikelyHtmlJsonParseError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    typeof err.message === "string" &&
    err.message.includes("Unexpected token") &&
    err.message.includes("<")
  );
}

/**
 * Возвращаем Shopify customer id для текущего Clerk-пользователя.
 * Если Admin API недоступен/нет прав — возвращаем null, чтобы не ломать страницу.
 */
export async function getOrCreateShopifyCustomer(): Promise<string | null> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email) return null;

  const publicMetadata = (user.publicMetadata || {}) as Record<string, unknown>;
  const existingId = publicMetadata.shopifyCustomerId as string | undefined;
  if (existingId) return existingId;

  let shopifyCustomerId: string | null = null;

  try {
    const searchQuery = `email:${email}`;
    const searchPath = `customers/search.json?query=${encodeURIComponent(searchQuery)}`;

    const searchData = await shopifyAdminRestFetch<CustomersSearchResponse>(searchPath);

    if (Array.isArray(searchData.customers) && searchData.customers.length > 0) {
      shopifyCustomerId = String(searchData.customers[0].id);
    } else {
      const createPayload = {
        customer: {
          email,
          first_name: user.firstName ?? undefined,
          last_name: user.lastName ?? undefined,
        },
      };

      const createData = await shopifyAdminRestFetch<CustomerCreateResponse>(
        "customers.json",
        { method: "POST", body: JSON.stringify(createPayload) }
      );

      shopifyCustomerId = String(createData.customer.id);
    }
  } catch (err: unknown) {
    console.error("getOrCreateShopifyCustomer Admin error:", err);

    const msg = err instanceof Error ? err.message : String(err);

    if (isLikelyHtmlJsonParseError(err)) return null;
    if (msg.includes("ACCESS_DENIED") || msg.includes("401") || msg.includes("403")) return null;

    throw err;
  }

  if (!shopifyCustomerId) return null;

  try {
    const client = await getClerkClient();
    await client.users.updateUser(user.id, {
      publicMetadata: {
        ...publicMetadata,
        shopifyCustomerId,
        shopifySyncedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("Failed to save shopifyCustomerId to Clerk:", err);
  }

  return shopifyCustomerId;
}
