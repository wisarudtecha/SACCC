// src/cms/store/api/graphql/caseResultQueries.ts
// Maps REST-style keys to GraphQL operation configs for the CaseResult domain
// Source: SuperApp.postman_collection.json – "6. Case-Result"

// ─── Queries ─────────────────────────────────────────────────────────────────

const GET_LIST_CASE_RESULT_QUERY = {
  operationName: "GetListCaseResult",
  root: "CaseResult",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CASE_RESULT = {
  "/case_results": GET_LIST_CASE_RESULT_QUERY,
  // "/case/results/:id": GET_LIST_CASE_RESULT_QUERY,
  "/case/result/": GET_LIST_CASE_RESULT_QUERY,
};
