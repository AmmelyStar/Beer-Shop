// app/lib/shopify/queries/customers.gql.ts

export const CUSTOMER_CREATE = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CUSTOMER_FIND_BY_EMAIL = /* GraphQL */ `
  query CustomersByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          firstName
          lastName
          phone
        }
      }
    }
  }
`;
