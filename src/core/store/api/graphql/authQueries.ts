// src/core/store/api/graphql/authQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Auth domain
// Source: SuperApp.postman_collection.json – "2. Authentication"

const AUTH_LOGIN_MUTATION = {
  operationName: "AuthLogin",
  root: "Auth",
  inputType: "LoginInput!",
  fields: `status msg data desc`,
  mutation: true
};

const AUTH_REFRESH_MUTATION = {
  operationName: "AuthRefresh",
  root: "Auth",
  inputType: "RefreshInput!",
  fields: `status msg data desc`,
  mutation: true
};

const AUTH_LOGOUT_MUTATION = {
  operationName: "AuthLogout",
  root: "Auth",
  fields: `status msg data desc`,
  mutation: true
};

const VERIFY_TOKEN_QUERY = {
  operationName: "AuthVerifyToken",
  root: "Auth",
  inputType: "VerifyTokenInput!",
  fields: `status msg data desc`
};

export const GQL_AUTH = {
  "/auth/login": AUTH_LOGIN_MUTATION,
  "/auth/refresh": AUTH_REFRESH_MUTATION,
  "/auth/logout": AUTH_LOGOUT_MUTATION,
  "/auth/verify": VERIFY_TOKEN_QUERY,
};
