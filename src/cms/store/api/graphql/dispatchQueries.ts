// src/cms/store/api/graphql/dispatchQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Dispatch domain
// Source: SuperApp.postman_collection.json – "11. Dispatch"

// ─── Queries ─────────────────────────────────────────────────────────────────

const SOP_CASE_QUERY = {
  operationName: "SOPCase",
  root: "Dispatch",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const SOP_UNIT_QUERY = {
  operationName: "SOPUnit",
  root: "Dispatch",
  inputType: "GetSOPUnitInput!",
  fields: `status msg data desc`
};

const GET_UNIT_DISPATCH_QUERY = {
  operationName: "GetUnitDispatch",
  root: "Dispatch",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Mutations ────────────────────────────────────────────────────────────────

const CANCEL_CASE_MUTATION = {
  operationName: "CancelCase",
  root: "Dispatch",
  inputType: "CancelCaseInput!",
  fields: `status msg data desc`,
  mutation: true
};

const CANCEL_UNIT_MUTATION = {
  operationName: "CancelUnit",
  root: "Dispatch",
  inputType: "CancelUnitInput!",
  fields: `status msg data desc`,
  mutation: true
};

const EVENT_MUTATION = {
  operationName: "Event",
  root: "Dispatch",
  inputType: "EventDataInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_DISPATCH = {
  "/dispatch/sop/case": SOP_CASE_QUERY,
  "/dispatch/sop/unit": SOP_UNIT_QUERY,
  "/dispatch/units": GET_UNIT_DISPATCH_QUERY,
  "/dispatch/cancel/case": CANCEL_CASE_MUTATION,
  "/dispatch/cancel/unit": CANCEL_UNIT_MUTATION,
  "/dispatch/event": EVENT_MUTATION,
  "/dispatch/:id/SOP": SOP_CASE_QUERY,
  "/dispatch/:id/units": GET_UNIT_DISPATCH_QUERY,
  "/dispatch/:caseId/SOP/unit/:unitId": SOP_UNIT_QUERY,
};
