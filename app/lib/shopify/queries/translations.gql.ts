// lib/shopify/queries/translations.gql.ts

// Для Storefront API - получить продукт с переводами
export const PRODUCT_WITH_TRANSLATIONS_STOREFRONT = /* GraphQL */ `
  query ProductWithTranslations($handle: String!, $language: LanguageCode!)
  @inContext(language: $language) {
    product(handle: $handle) {
      id
      title
      descriptionHtml
      featuredImage {
        url
        altText
      }
    }
  }
`;

// Если @inContext не работает, можно попробовать получить все переводы
// Но это работает только в Admin API, не в Storefront API
export const GET_PRODUCT_TRANSLATIONS_ADMIN = /* GraphQL */ `
  query GetProductTranslations($id: ID!) {
    product(id: $id) {
      id
      title
      descriptionHtml
      translations(locale: "et") {
        key
        value
        locale
      }
    }
  }
`;

// Проверка доступных локалей в магазине
export const CHECK_SHOP_LOCALES = /* GraphQL */ `
  query {
    localization {
      availableCountries {
        isoCode
        name
      }
      availableLanguages {
        isoCode
        name
        endonymName
      }
    }
  }
`;
