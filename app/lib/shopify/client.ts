// app/lib/shopify/client.ts

import type { Locale } from "@/app/lib/locale";

type ShopifyLanguageCode = "EN" | "RU" | "UK" | "ET" | "FI";

const LOCALE_TO_SHOPIFY: Record<Locale, ShopifyLanguageCode> = {
  en: "EN",
  ru: "RU",
  uk: "UK",
  et: "ET",
  fi: "FI",
};

const LOCALE_TO_ACCEPT_LANGUAGE: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  uk: "uk-UA",
  et: "et-EE",
  fi: "fi-FI",
};

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 60,
  cacheTag?: string,
  locale: Locale = "en"
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION;
  const accessToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain) {
    throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  }

  if (!apiVersion) {
    throw new Error(
      "SHOPIFY_STOREFRONT_API_VERSION is missing"
    );
  }

  if (!accessToken) {
    throw new Error(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing"
    );
  }

  const endpoint =
    `https://${domain}/api/${apiVersion}/graphql.json`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": accessToken,
    "Accept-Language":
      LOCALE_TO_ACCEPT_LANGUAGE[locale] ?? "en-US",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
    next: {
      revalidate,
      tags: cacheTag ? [cacheTag] : undefined,
    },
  });

  const result = (await response.json()) as {
    data?: T;
    errors?: Array<{
      message?: string;
      extensions?: unknown;
    }>;
  };

  if (!response.ok || result.errors?.length) {
    console.error(
      "Shopify Storefront API error:",
      JSON.stringify(result.errors ?? {}, null, 2)
    );

    console.error(
      "Shopify request variables:",
      JSON.stringify(variables, null, 2)
    );

    throw new Error(
      result.errors?.[0]?.message ||
        `Shopify request failed: ${response.status}`
    );
  }

  if (!result.data) {
    throw new Error(
      "Shopify returned an empty response"
    );
  }

  return result.data;
}

/**
 * Добавляет Shopify language в GraphQL variables.
 *
 * Страну здесь специально не передаём:
 * язык интерфейса не означает страну покупателя.
 */
export async function shopifyFetchWithLocale<T>(
  query: string,
  variables: Record<string, unknown> = {},
  locale: Locale = "en",
  revalidate = 60
): Promise<T> {
  const language =
    LOCALE_TO_SHOPIFY[locale] ?? "EN";

  return shopifyFetch<T>(
    query,
    {
      ...variables,
      language,
    },
    revalidate,
    `shopify:${locale}`,
    locale
  );
}