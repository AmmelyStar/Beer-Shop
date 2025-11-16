// lib/shopify/queries/pages.gql.ts

export const PAGE_BY_HANDLE = /* GraphQL */ `
  query PageByHandle(
    $handle: String!
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
    }
  }
`;
