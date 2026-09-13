// app/lib/shopify/customerAdmin.ts

import {
  clerkClient,
  currentUser,
} from "@clerk/nextjs/server";

import { shopifyAdminRestFetch } from "./admin";

type ShopifyCustomer = {
  id: number;
  email?: string | null;
  orders_count?: number | null;
};

type CustomerResponse = {
  customer: ShopifyCustomer;
};

type CustomersSearchResponse = {
  customers: ShopifyCustomer[];
};

type CustomerCreateResponse = {
  customer: ShopifyCustomer;
};

type ClerkUsersApi = {
  updateUser: (
    userId: string,
    data: {
      publicMetadata: Record<string, unknown>;
    },
  ) => Promise<unknown>;
};

type ClerkClientLike = {
  users: ClerkUsersApi;
};

function hasUpdateUser(
  value: unknown,
): value is ClerkClientLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (!("users" in value)) {
    return false;
  }

  const users = (
    value as { users?: unknown }
  ).users;

  if (!users || typeof users !== "object") {
    return false;
  }

  const updateUser = (
    users as { updateUser?: unknown }
  ).updateUser;

  return typeof updateUser === "function";
}

async function getClerkClient(): Promise<ClerkClientLike> {
  const client: unknown = clerkClient;

  if (typeof client === "function") {
    const result = await (
      client as () => Promise<unknown>
    )();

    if (hasUpdateUser(result)) {
      return result;
    }

    throw new Error(
      "clerkClient() did not return expected client shape",
    );
  }

  if (hasUpdateUser(client)) {
    return client;
  }

  throw new Error(
    "clerkClient has unexpected shape",
  );
}

function normalizeEmail(
  email: string | null | undefined,
): string {
  return (email ?? "").trim().toLowerCase();
}

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

function isNotFoundError(
  error: unknown,
): boolean {
  const message =
    getErrorMessage(error).toLowerCase();

  return (
    message.includes("404") ||
    message.includes("not found")
  );
}

function isEmailAlreadyTakenError(
  error: unknown,
): boolean {
  const message =
    getErrorMessage(error).toLowerCase();

  return (
    message.includes("422") &&
    message.includes("email") &&
    (
      message.includes("already been taken") ||
      message.includes("has been taken") ||
      message.includes("is taken")
    )
  );
}

function isLikelyHtmlJsonParseError(
  error: unknown,
): boolean {
  return (
    error instanceof SyntaxError &&
    error.message.includes("Unexpected token") &&
    error.message.includes("<")
  );
}

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function getCustomerById(
  customerId: string,
): Promise<ShopifyCustomer | null> {
  try {
    const endpoint =
      `customers/${customerId}.json` +
      "?fields=id,email,orders_count";

    const data =
      await shopifyAdminRestFetch<CustomerResponse>(
        endpoint,
      );

    return data.customer ?? null;
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

function chooseCustomer(
  customers: ShopifyCustomer[],
): ShopifyCustomer | null {
  if (customers.length === 0) {
    return null;
  }

  return customers.reduce(
    (bestCustomer, currentCustomer) => {
      const bestOrders =
        bestCustomer.orders_count ?? 0;

      const currentOrders =
        currentCustomer.orders_count ?? 0;

      return currentOrders > bestOrders
        ? currentCustomer
        : bestCustomer;
    },
  );
}

async function findCustomerByEmail(
  email: string,
): Promise<ShopifyCustomer | null> {
  const normalizedEmail =
    normalizeEmail(email);

  const queries = [
    `email:${normalizedEmail}`,
    normalizedEmail,
  ];

  for (const query of queries) {
    const endpoint =
      "customers/search.json" +
      `?query=${encodeURIComponent(query)}` +
      "&limit=10" +
      "&fields=id,email,orders_count";

    const data =
      await shopifyAdminRestFetch<CustomersSearchResponse>(
        endpoint,
      );

    const customers = Array.isArray(
      data.customers,
    )
      ? data.customers
      : [];

    const exactMatches = customers.filter(
      (customer) =>
        normalizeEmail(customer.email) ===
        normalizedEmail,
    );

    const exactCustomer =
      chooseCustomer(exactMatches);

    if (exactCustomer) {
      return exactCustomer;
    }

    // Shopify может скрыть email в ответе,
    // хотя поиск по email нашёл одного клиента.
    if (
      customers.length === 1 &&
      !customers[0].email
    ) {
      return customers[0];
    }
  }

  return null;
}

async function findCustomerByEmailWithRetry(
  email: string,
): Promise<ShopifyCustomer | null> {
  const attempts = 5;

  for (
    let attempt = 0;
    attempt < attempts;
    attempt += 1
  ) {
    const customer =
      await findCustomerByEmail(email);

    if (customer) {
      return customer;
    }

    if (attempt < attempts - 1) {
      await wait(250);
    }
  }

  return null;
}

async function createCustomer(
  email: string,
  firstName?: string | null,
  lastName?: string | null,
): Promise<ShopifyCustomer> {
  const payload = {
    customer: {
      email,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    },
  };

  const data =
    await shopifyAdminRestFetch<CustomerCreateResponse>(
      "customers.json",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

  return data.customer;
}

async function saveCustomerIdToClerk(
  userId: string,
  customerId: string,
  currentMetadata: Record<string, unknown>,
): Promise<void> {
  try {
    const client =
      await getClerkClient();

    await client.users.updateUser(
      userId,
      {
        publicMetadata: {
          ...currentMetadata,
          shopifyCustomerId: customerId,
          shopifySyncedAt:
            new Date().toISOString(),
        },
      },
    );
  } catch (error: unknown) {
    console.error(
      "Failed to save Shopify customer ID to Clerk:",
      getErrorMessage(error),
    );
  }
}

export async function getOrCreateShopifyCustomer(): Promise<
  string | null
> {
  const user = await currentUser();

  const email =
    user?.primaryEmailAddress?.emailAddress;

  if (!user || !email) {
    return null;
  }

  const normalizedCurrentEmail =
    normalizeEmail(email);

  const publicMetadata = (
    user.publicMetadata ?? {}
  ) as Record<string, unknown>;

  const savedCustomerId =
    typeof publicMetadata.shopifyCustomerId ===
    "string"
      ? publicMetadata.shopifyCustomerId
      : null;

  try {
    let customer: ShopifyCustomer | null =
      null;

    // Проверяем, что сохранённый Shopify ID
    // действительно принадлежит текущему email.
    if (savedCustomerId) {
      const savedCustomer =
        await getCustomerById(savedCustomerId);

      if (
        savedCustomer &&
        normalizeEmail(savedCustomer.email) ===
          normalizedCurrentEmail
      ) {
        customer = savedCustomer;
      } else {
        console.warn(
          "Saved Shopify customer ID does not belong to current Clerk email",
        );
      }
    }

    // Ищем существующего Shopify-клиента.
    if (!customer) {
      customer =
        await findCustomerByEmail(email);
    }

    // Если клиента нет, создаём нового.
    if (!customer) {
      try {
        customer = await createCustomer(
          email,
          user.firstName,
          user.lastName,
        );
      } catch (error: unknown) {
        if (
          !isEmailAlreadyTakenError(error)
        ) {
          throw error;
        }

        // Параллельный запрос мог успеть создать
        // клиента раньше текущего запроса.
        customer =
          await findCustomerByEmailWithRetry(
            email,
          );

        if (!customer) {
          throw error;
        }
      }
    }

    const shopifyCustomerId =
      String(customer.id);

    // Сохраняем правильный ID у текущего
    // пользователя Clerk.
    if (
      savedCustomerId !==
      shopifyCustomerId
    ) {
      await saveCustomerIdToClerk(
        user.id,
        shopifyCustomerId,
        publicMetadata,
      );
    }

    return shopifyCustomerId;
  } catch (error: unknown) {
    const message =
      getErrorMessage(error);

    console.error(
      "getOrCreateShopifyCustomer Admin error:",
      message,
    );

    if (
      isLikelyHtmlJsonParseError(error)
    ) {
      return null;
    }

    if (
      message.includes("ACCESS_DENIED") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      return null;
    }

    throw new Error(message);
  }
}