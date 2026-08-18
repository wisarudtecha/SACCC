// src/core/store/api/graphql/auditQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Audit domain
// Source: SuperApp.postman_collection.json – "4. Audit"

const GET_AUDIT_LOGS_QUERY = {
  operationName: "GetAuditLogs",
  root: "Audit",
  inputType: "AuditLogInput!",
  fields: `status msg data desc`
};

const GET_AUDIT_LOGS_BY_USERNAME_QUERY = {
  operationName: "GetAuditLogsByUsername",
  root: "Audit",
  inputType: "AuditUsernameInput!",
  fields: `status msg data desc`
};

export const GQL_AUDIT = {
  "/audit_log": GET_AUDIT_LOGS_QUERY,
  "/audit_log/:username": GET_AUDIT_LOGS_BY_USERNAME_QUERY,
};
