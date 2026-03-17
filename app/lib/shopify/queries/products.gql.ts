// lib/shopify/queries/products.gql.ts

const PRODUCT_METAFIELD_IDENTIFIERS = `
  identifiers: [
    { namespace: "specs", key: "abv" }
    { namespace: "specs", key: "ibu" }
    { namespace: "specs", key: "fg" }
    { namespace: "specs", key: "allergens" }
    { namespace: "specs", key: "brand" }
    { namespace: "specs", key: "country" }
    { namespace: "specs", key: "gtin" }
    { namespace: "specs", key: "ingredients" }
    { namespace: "specs", key: "pack_size_l" }
    { namespace: "specs", key: "pack_type" }
    { namespace: "specs", key: "pairing" }
    { namespace: "specs", key: "shelf_life_days" }
    { namespace: "specs", key: "tasted_best_with" }
    { namespace: "specs", key: "bottle_in_boxes" }

    { namespace: "custom", key: "abv" }
    { namespace: "custom", key: "ibu" }
    { namespace: "custom", key: "fg" }
    { namespace: "custom", key: "allergens" }
    { namespace: "custom", key: "brand" }
    { namespace: "custom", key: "country" }
    { namespace: "custom", key: "gtin" }
    { namespace: "custom", key: "ingredients" }
    { namespace: "custom", key: "pack_size_l" }
    { namespace: "custom", key: "pack_type" }
    { namespace: "custom", key: "pairing" }
    { namespace: "custom", key: "shelf_life_days" }
    { namespace: "custom", key: "tasted_best_with" }
    { namespace: "custom", key: "bottle_in_boxes" }
    { namespace: "custom", key: "style" }
    { namespace: "custom", key: "ean" }
    { namespace: "custom", key: "box_nr" }
    { namespace: "custom", key: "description_extra" }

    { namespace: "shopify", key: "beer-style" }
    { namespace: "shopify", key: "package-type" }

    { namespace: "marketing", key: "trending" }
  ]
`;

const PRODUCT_METAFIELDS = `
  metafields(
    ${PRODUCT_METAFIELD_IDENTIFIERS}
  ) {
    namespace
    key
    type
    value
  }
`;

const PRODUCT_METAFIELDS_WITH_REFERENCES = `
  metafields(
    ${PRODUCT_METAFIELD_IDENTIFIERS}
  ) {
    namespace
    key
    type
    value
    reference {
      ... on Metaobject {
        id
        handle
        type
        fields {
          key
          value
          type
        }
      }
    }
    references(first: 10) {
      edges {
        node {
          ... on Metaobject {
            id
            handle
            type
            fields {
              key
              value
              type
              references(first: 5) {
                edges {
                  node {
                    ... on Metaobject {
                      handle
                      fields {
                        key
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_VARIANT_FIELDS = `
  id
  title
  availableForSale
  quantityAvailable
  selectedOptions {
    name
    value
  }
  price {
    amount
    currencyCode
  }
  compareAtPrice {
    amount
    currencyCode
  }
`;

const PRODUCT_CARD_FIELDS = `
  id
  title
  handle
  descriptionHtml
  featuredImage {
    url
    altText
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  selectedOrFirstAvailableVariant {
    ${PRODUCT_VARIANT_FIELDS}
  }
  variants(first: 20) {
    edges {
      node {
        ${PRODUCT_VARIANT_FIELDS}
      }
    }
  }
  collections(first: 10) {
    edges {
      node {
        handle
        title
      }
    }
  }
`;

const PRODUCT_FULL_FIELDS = `
  id
  title
  handle
  descriptionHtml
  featuredImage {
    url
    altText
  }
  images(first: 10) {
    edges {
      node {
        url
        altText
      }
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  selectedOrFirstAvailableVariant {
    ${PRODUCT_VARIANT_FIELDS}
  }
  variants(first: 20) {
    edges {
      node {
        ${PRODUCT_VARIANT_FIELDS}
      }
    }
  }
  collections(first: 20) {
    edges {
      node {
        handle
        title
      }
    }
  }
`;

export const PRODUCTS_ALL_WITH_METAFIELDS = /* GraphQL */ `
  query ProductsAllWithMetafields(
    $first: Int = 250
    $after: String
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      edges {
        cursor
        node {
          ${PRODUCT_CARD_FIELDS}
          ${PRODUCT_METAFIELDS}
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE = /* GraphQL */ `
  query ProductByHandle(
    $handle: String!
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    product(handle: $handle) {
      ${PRODUCT_FULL_FIELDS}
      ${PRODUCT_METAFIELDS_WITH_REFERENCES}
    }
  }
`;

export const PRODUCTS_BY_COLLECTION = /* GraphQL */ `
  query ProductsByCollection(
    $handle: String!
    $first: Int = 250
    $after: String
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    collection(handle: $handle) {
      id
      title
      products(first: $first, after: $after, sortKey: CREATED, reverse: true) {
        edges {
          cursor
          node {
            ${PRODUCT_CARD_FIELDS}
            updatedAt
            ${PRODUCT_METAFIELDS}
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const PRODUCT_BY_ID = /* GraphQL */ `
  query ProductById(
    $id: ID!
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    product(id: $id) {
      ${PRODUCT_FULL_FIELDS}
      ${PRODUCT_METAFIELDS_WITH_REFERENCES}
    }
  }
`;

export const PRODUCTS_BY_QUERY_WITH_METAFIELDS = /* GraphQL */ `
  query ProductsByQueryWithMetafields(
    $first: Int = 50
    $after: String
    $query: String!
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: UPDATED_AT
      reverse: true
    ) {
      edges {
        cursor
        node {
          ${PRODUCT_CARD_FIELDS}
          ${PRODUCT_METAFIELDS}
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;