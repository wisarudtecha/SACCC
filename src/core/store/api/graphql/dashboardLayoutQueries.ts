// src/core/store/api/graphql/dashboardLayoutQueries.ts
//
// Confirmed against src/cms/mocks/layoutConfigCURL.sh (the BFF's own GraphQL examples
// for this domain) — root "Layout", operations GetListLayout/GetLayoutById/CreateLayout/
// UpdateLayout/DeleteLayout, input types LayoutListInput!/GetIdInput!/LayoutInput!.
//
// Unlike most GQL_* files here, list and create do NOT share a REST URL: list is
// GET /layout_configurations, create is POST /layout_configurations/add. Keeping them as
// separate single-config map keys (rather than a method-keyed record under one URL) avoids
// the ambiguity in e.g. brandQueries.ts, where a single-config key is matched regardless of
// method — safe there only because list and create happen to share a URL and no other
// method ever hits it.
const GET_LIST_LAYOUT_QUERY = {
  operationName: "GetListLayout",
  root: "Layout",
  inputType: "LayoutListInput!",
  fields: `status msg data desc pageSize totalRecords`,
};

const GET_LAYOUT_BY_ID_QUERY = {
  operationName: "GetLayoutById",
  root: "Layout",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_LAYOUT_MUTATION = {
  operationName: "CreateLayout",
  root: "Layout",
  inputType: "LayoutInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_LAYOUT_MUTATION = {
  operationName: "UpdateLayout",
  root: "Layout",
  inputType: "LayoutInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_LAYOUT_MUTATION = {
  operationName: "DeleteLayout",
  root: "Layout",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_DASHBOARD_LAYOUT = {
  "/layout_configurations": GET_LIST_LAYOUT_QUERY,
  "/layout_configurations/add": CREATE_LAYOUT_MUTATION,
  "/layout_configurations/:id": {
    GET: GET_LAYOUT_BY_ID_QUERY,
    PATCH: UPDATE_LAYOUT_MUTATION,
    DELETE: DELETE_LAYOUT_MUTATION,
  },
};
