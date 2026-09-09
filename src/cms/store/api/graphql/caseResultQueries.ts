// src/cms/store/api/graphql/caseResultQueries.ts
// Maps REST-style keys to GraphQL operation configs for the CaseResult domain
// Source: src/cms/mocks/caseResultCURL.sh ("6. Case-Result" in SuperApp.postman_collection.json)
//
// operationName / root / inputType follow the curl file and the Skill convention
// (skillQueries.ts). Confirm against the real BFF schema before ship - every
// environment runs VITE_USE_GRAPHQL="true" with NO REST fallback, so a wrong
// mapping is a hard user-facing error, not a silent degrade.

// ─── Queries ─────────────────────────────────────────────────────────────────

const GET_LIST_CASE_RESULT_QUERY = {
  operationName: "GetListCaseResult",
  root: "CaseResult",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_CASE_RESULT_BY_ID_QUERY = {
  operationName: "GetCaseResultById",
  root: "CaseResult",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Mutations ───────────────────────────────────────────────────────────────

const CREATE_CASE_RESULT_MUTATION = {
  operationName: "CreateCaseResult",
  root: "CaseResult",
  inputType: "CaseResultInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_CASE_RESULT_MUTATION = {
  operationName: "UpdateCaseResult",
  root: "CaseResult",
  inputType: "CaseResultInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_CASE_RESULT_MUTATION = {
  operationName: "DeleteCaseResult",
  root: "CaseResult",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CASE_RESULT = {
  "/case/result/": GET_LIST_CASE_RESULT_QUERY,
  "/case/result/add": CREATE_CASE_RESULT_MUTATION,
  "/case/result/:id": {
    GET: GET_CASE_RESULT_BY_ID_QUERY,
    PATCH: UPDATE_CASE_RESULT_MUTATION,
    DELETE: DELETE_CASE_RESULT_MUTATION,
  },
};
