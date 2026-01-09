// app/lib/shopify/customerAdmin.ts
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { shopifyAdminRestFetch } from "./admin";

// Типизируем минимально
type ShopifyCustomer = {
  id: number;
  email?: string | null;
  orders_count?: number | null;
};

type CustomersSearchResponse = {
  customers: ShopifyCustomer[];
};

type CustomerCreateResponse = {
  customer: ShopifyCustomer;
};

type OrdersSearchResponse = {
  orders: Array<{
    id: number;
    customer: { id: number } | null;
  }>;
};

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

function hasUpdateUser(x: unknown): x is ClerkClientLike {
  if (!x || typeof x !== "object") return false;
  if (!("users" in x)) return false;

  const users = (x as { users?: unknown }).users;
  if (!users || typeof users !== "object") return false;

  const updateUser = (users as { updateUser?: unknown }).updateUser;
  return typeof updateUser === "function";
}

// Универсальный хелпер: clerkClient может быть объектом или функцией (в зависимости от версии).
async function getClerkClient(): Promise<ClerkClientLike> {
  const cc: unknown = clerkClient;

  if (typeof cc === "function") {
    const produced = await (cc as () => Promise<unknown>)();
    if (hasUpdateUser(produced)) return produced;
    throw new Error("clerkClient() did not return expected client shape");
  }

  if (hasUpdateUser(cc)) return cc;

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

async function countOrdersForCustomer(customerId: string): Promise<number> {
  const q = `orders.json?customer_id=${customerId}&status=any&limit=1&fields=id`;
  const data = await shopifyAdminRestFetch<{ orders: Array<{ id: number }> }>(q);
  return data.orders?.length ?? 0;
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

  try {
    // 1) Если уже есть сохранённый customerId — используем его только если у него реально есть заказы
    if (existingId) {
      const n = await countOrdersForCustomer(existingId);
      if (n > 0) return existingId;
      // иначе ищем правильного по email
    }

    // 2) Ищем customer(s) по email
    const searchQuery = `email:${email}`;
    const searchPath = `customers/search.json?query=${encodeURIComponent(searchQuery)}`;

    const searchData = await shopifyAdminRestFetch<CustomersSearchResponse>(searchPath);
    const customers = Array.isArray(searchData.customers) ? searchData.customers : [];

    // если несколько — берём с максимальным orders_count
    let bestCustomer: ShopifyCustomer | null = null;
    for (const c of customers) {
      if (!bestCustomer) {
        bestCustomer = c;
        continue;
      }
      const a = bestCustomer.orders_count ?? 0;
      const b = c.orders_count ?? 0;
      if (b > a) bestCustomer = c;
    }

    let shopifyCustomerId: string | null = bestCustomer ? String(bestCustomer.id) : null;

    // 3) Если customer найден, но заказы могли быть guest/непривязанные —
    // пробуем найти заказ по email и взять order.customer.id
    if (shopifyCustomerId) {
      const orderSearch =
        `orders.json?status=any&limit=1&order=created_at%20desc` +
        `&query=email:${encodeURIComponent(email)}` +
        `&fields=id,customer`;

      const ordersByEmail = await shopifyAdminRestFetch<OrdersSearchResponse>(orderSearch);

      const first = ordersByEmail.orders?.[0];
      const fromOrderCustomerId = first?.customer?.id ? String(first.customer.id) : null;

      if (fromOrderCustomerId) {
        shopifyCustomerId = fromOrderCustomerId;
      }
    }

    // 4) Если customer не найден вообще — создаём
    if (!shopifyCustomerId) {
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

    if (!shopifyCustomerId) return null;

    // 5) Сохраняем customerId в Clerk
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
  } catch (err: unknown) {
    console.error("getOrCreateShopifyCustomer Admin error:", err);

    const msg = err instanceof Error ? err.message : String(err);

    if (isLikelyHtmlJsonParseError(err)) return null;
    if (msg.includes("ACCESS_DENIED") || msg.includes("401") || msg.includes("403")) return null;

    throw err;
  }
}
