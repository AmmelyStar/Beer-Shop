// app/lib/shopify/customerAccount.ts

import { shopifyStorefrontFetch } from "./storefront";

type CustomerCreateResponse = {
  customerCreate: {
    customer: { id: string } | null;
    customerUserErrors: { code: string; field: string[]; message: string }[];
  };
};

type CustomerAccessTokenCreateResponse = {
  customerAccessTokenCreate: {
    customerAccessToken: { accessToken: string; expiresAt: string } | null;
    customerUserErrors: { code: string; field: string[]; message: string }[];
  };
};

const CUSTOMER_CREATE_MUTATION = `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `
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

// простой детерминированный "хэш" на основе секретной строки + email
function generatePasswordForEmail(email: string): string {
  const secret =
    process.env.SHOPIFY_CUSTOMER_PASSWORD_SECRET ?? "beer-shop-secret";
  const src = `${secret}|${email}`;
  let hash = 0;

  for (let i = 0; i < src.length; i++) {
    hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
  }

  const base = hash.toString(36);
  // делаем строку подлиннее
  return (base + base.split("").reverse().join("")).slice(0, 20);
}

/**
 * Гарантируем, что для данного email есть Shopify customer,
 * и получаем customerAccessToken через Storefront API.
 */
export async function getOrCreateCustomerAccessTokenForEmail(
  email: string
): Promise<string> {
  const password = generatePasswordForEmail(email);

  // 1. Пытаемся создать customer (если уже есть, придёт ошибка TAKEN — это ок)
  const createData = await shopifyStorefrontFetch<CustomerCreateResponse>({
    query: CUSTOMER_CREATE_MUTATION,
    variables: {
      input: {
        email,
        password,
        acceptsMarketing: false,
      },
    },
  });

  const createErrors = createData.customerCreate.customerUserErrors;

  if (
    createErrors.length > 0 &&
    !createErrors.every((e) => e.code === "TAKEN")
  ) {
    throw new Error(
      `Shopify customerCreate errors: ${JSON.stringify(createErrors)}`
    );
  }

  // 2. Создаём customerAccessToken по тому же email+password
  const tokenData =
    await shopifyStorefrontFetch<CustomerAccessTokenCreateResponse>({
      query: CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      variables: {
        input: {
          email,
          password,
        },
      },
    });

  const { customerAccessToken, customerUserErrors } =
    tokenData.customerAccessTokenCreate;

  if (customerUserErrors.length > 0 || !customerAccessToken) {
    throw new Error(
      `Shopify customerAccessTokenCreate errors: ${JSON.stringify(
        customerUserErrors
      )}`
    );
  }

  return customerAccessToken.accessToken;
}
