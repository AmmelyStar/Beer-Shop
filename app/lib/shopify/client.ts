// app/lib/shopify/client.ts
import type { Locale } from "@/app/[lang]/messages";

// Маппинг локали Next.js -> Shopify language code
export const LOCALE_TO_SHOPIFY: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  uk: "UK",
  et: "ET",
  fi: "FI",
};

// Для Accept-Language заголовка
export const LOCALE_TO_ACCEPT_LANGUAGE: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  uk: "uk-UA",
  et: "et-EE",
  fi: "fi-FI",
};

// Для @inContext(country: ...)
export const LOCALE_TO_COUNTRY: Record<Locale, string> = {
  en: "US",
  ru: "RU",
  uk: "UA",
  et: "EE",
  fi: "FI",
};

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 60,
  cacheTag?: string,
  locale?: Locale
): Promise<T> {
  const endpoint = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token":
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
  };

  // Локализация через Accept-Language
  if (locale) {
    headers["Accept-Language"] = LOCALE_TO_ACCEPT_LANGUAGE[locale] || "en-US";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate, tags: cacheTag ? [cacheTag] : undefined },
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "Shopify error:",
        JSON.stringify(json.errors || res.statusText, null, 2)
      );
      console.error("Query variables:", variables);
      console.error("Locale:", locale);
      console.error("Headers:", headers);
    }
    throw new Error(JSON.stringify(json.errors || res.statusText));
  }

  return json.data as T;
}

/**
 * Удобная обёртка: сам подставляет language и country из Locale
 * и прокидывает Accept-Language через shopifyFetch
 */
export async function shopifyFetchWithLocale<T>(
  query: string,
  vars: Record<string, unknown> = {},
  lang: Locale,
  revalidate = 60
): Promise<T> {
  const language = LOCALE_TO_SHOPIFY[lang] ?? "EN";
  const country = LOCALE_TO_COUNTRY[lang] ?? "US";

  const variables = {
    ...vars,
    language,
    country,
  };

  return shopifyFetch<T>(query, variables, revalidate, `sf:${lang}`, lang);
}
