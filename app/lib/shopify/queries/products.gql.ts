// // lib/shopify/queries/products.gql.ts

// export const PRODUCTS_ALL_WITH_METAFIELDS = /* GraphQL */ `
//   query ProductsAllWithMetafields(
//     $first: Int = 250
//     $after: String
//     $language: LanguageCode
//   ) @inContext(language: $language) {
//     products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
//       edges {
//         cursor
//         node {
//           id
//           title
//           handle
//           descriptionHtml
//           featuredImage {
//             url
//             altText
//           }
//           priceRange {
//             minVariantPrice {
//               amount
//               currencyCode
//             }
//           }
//           collections(first: 10) {
//             edges {
//               node {
//                 handle
//                 title
//               }
//             }
//           }
//           metafields(
//             identifiers: [
//               { namespace: "specs", key: "abv" }
//               { namespace: "specs", key: "ibu" }
//               { namespace: "specs", key: "fg" }
//               { namespace: "specs", key: "allergens" }
//               { namespace: "specs", key: "brand" }
//               { namespace: "specs", key: "country" }
//               { namespace: "specs", key: "gtin" }
//               { namespace: "specs", key: "ingredients" }
//               { namespace: "specs", key: "pack_size_l" }
//               { namespace: "specs", key: "pack_type" }
//               { namespace: "specs", key: "pairing" }
//               { namespace: "specs", key: "shelf_life_days" }
//               { namespace: "shopify", key: "beer-style" }
//               { namespace: "shopify", key: "package-type" }
//             ]
//           ) {
//             namespace
//             key
//             type
//             value
//           }
//         }
//       }
//       pageInfo {
//         hasNextPage
//         endCursor
//       }
//     }
//   }
// `;

// export const PRODUCT_BY_HANDLE = /* GraphQL */ `
//   query ProductByHandle($handle: String!, $language: LanguageCode)
//   @inContext(language: $language) {
//     product(handle: $handle) {
//       id
//       title
//       handle
//       descriptionHtml
//       featuredImage {
//         url
//         altText
//       }
//       images(first: 10) {
//         edges {
//           node {
//             url
//             altText
//           }
//         }
//       }
//       priceRange {
//         minVariantPrice {
//           amount
//           currencyCode
//         }
//       }
//       collections(first: 20) {
//         edges {
//           node {
//             handle
//             title
//           }
//         }
//       }
//       metafields(
//         identifiers: [
//           { namespace: "specs", key: "abv" }
//           { namespace: "specs", key: "ibu" }
//           { namespace: "specs", key: "fg" }
//           { namespace: "specs", key: "pack_size_l" }
//           { namespace: "specs", key: "country" }
//           { namespace: "specs", key: "brand" }
//           { namespace: "specs", key: "ingredients" }
//           { namespace: "specs", key: "allergens" }
//           { namespace: "specs", key: "pairing" }
//           { namespace: "shopify", key: "beer-style" }
//           { namespace: "shopify", key: "package-type" }
//         ]
//       ) {
//         namespace
//         key
//         type
//         value
//         references(first: 10) {
//           edges {
//             node {
//               ... on Metaobject {
//                 id
//                 handle
//                 type
//                 fields {
//                   key
//                   value
//                   type
//                   references(first: 5) {
//                     edges {
//                       node {
//                         ... on Metaobject {
//                           handle
//                           fields {
//                             key
//                             value
//                           }
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `;

// export const PRODUCTS_BY_COLLECTION = /* GraphQL */ `
//   query ProductsByCollection(
//     $handle: String!
//     $first: Int = 250
//     $after: String
//     $language: LanguageCode
//   ) @inContext(language: $language) {
//     collection(handle: $handle) {
//       id
//       title
//       products(first: $first, after: $after, sortKey: CREATED, reverse: true) {
//         edges {
//           cursor
//           node {
//             id
//             title
//             handle
//             updatedAt
//             descriptionHtml
//             featuredImage {
//               url
//               altText
//             }
//             priceRange {
//               minVariantPrice {
//                 amount
//                 currencyCode
//               }
//             }
//             collections(first: 10) {
//               edges {
//                 node {
//                   handle
//                   title
//                 }
//               }
//             }
//             metafields(
//               identifiers: [
//                 { namespace: "specs", key: "abv" }
//                 { namespace: "specs", key: "ibu" }
//                 { namespace: "specs", key: "fg" }
//                 { namespace: "specs", key: "pack_size_l" }
//                 { namespace: "specs", key: "country" }
//                 { namespace: "specs", key: "brand" }
//                 { namespace: "specs", key: "ingredients" }
//                 { namespace: "specs", key: "allergens" }
//                 { namespace: "shopify", key: "beer-style" }
//                 { namespace: "shopify", key: "package-type" }
//               ]
//             ) {
//               namespace
//               key
//               type
//               value
//             }
//           }
//         }
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//       }
//     }
//   }
// `;

// lib/shopify/queries/products.gql.ts

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
          }
          collections(first: 10) {
            edges {
              node {
                handle
                title
              }
            }
          }
          metafields(
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
              { namespace: "shopify", key: "beer-style" }
              { namespace: "shopify", key: "package-type" }
              { namespace: "marketing", key: "trending" }
            ]
          ) {
            namespace
            key
            type
            value
          }
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
      }
      collections(first: 20) {
        edges {
          node {
            handle
            title
          }
        }
      }
      metafields(
        identifiers: [
          { namespace: "specs", key: "abv" }
          { namespace: "specs", key: "ibu" }
          { namespace: "specs", key: "fg" }
          { namespace: "specs", key: "pack_size_l" }
          { namespace: "specs", key: "country" }
          { namespace: "specs", key: "brand" }
          { namespace: "specs", key: "ingredients" }
          { namespace: "specs", key: "allergens" }
          { namespace: "specs", key: "pairing" }
          { namespace: "shopify", key: "beer-style" }
          { namespace: "shopify", key: "package-type" }
          { namespace: "marketing", key: "trending" }
        ]
      ) {
        namespace
        key
        type
        value
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
            id
            title
            handle
            updatedAt
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
            }
            collections(first: 10) {
              edges {
                node {
                  handle
                  title
                }
              }
            }
            metafields(
              identifiers: [
                { namespace: "specs", key: "abv" }
                { namespace: "specs", key: "ibu" }
                { namespace: "specs", key: "fg" }
                { namespace: "specs", key: "pack_size_l" }
                { namespace: "specs", key: "country" }
                { namespace: "specs", key: "brand" }
                { namespace: "specs", key: "ingredients" }
                { namespace: "specs", key: "allergens" }
                { namespace: "shopify", key: "beer-style" }
                { namespace: "shopify", key: "package-type" }
                { namespace: "marketing", key: "trending" }
              ]
            ) {
              namespace
              key
              type
              value
            }
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
