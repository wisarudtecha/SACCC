// src/cms/store/api/graphql/formQueries.ts
const GET_LIST_FORM_QUERY = {
  operationName: "GetFormAll",
  root: "Forms",
  inputType: "ListDataInput!",
  fields: `status msg data totalPage totalRecords currentPage`,
};

const GET_LIST_FORM_WORKFLOW_QUERY = {
  operationName: "GetFormAllLinkWf",
  root: "Forms",
  inputType: "ListDataInput!",
  fields: `status msg data totalPage totalRecords currentPage`,
};

const GET_FORM_BY_CASE_SUBTYPE_QUERY = {
  operationName: "GetFormByCaseSubType",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const GET_FORM_BY_ID_QUERY = {
  operationName: "GetFormByFormId",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_FORM_MUTATION = {
  operationName: "CreateForms",
  root: "Forms",
  inputType: "FormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_FORM_MUTATION = {
  operationName: "UpdateForms",
  root: "Forms",
  inputType: "FormInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_FORM_MUTATION = {
  operationName: "DeleteForms",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// The three one-click form actions all take GetIdInput, but formApi sends the record id as
// `formId` (REST parity). `inputFieldAliases` renames it on the GraphQL side only, so the REST
// body keeps `formId` while UpdateFormsActive/UpdateFormsVersion/UpdateFormsPublish receive `id`.
const FORM_ACTION_ALIASES = { formId: "id" };

const UPDATE_FORM_ACTIVE_MUTATION = {
  operationName: "UpdateFormsActive",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
  inputFieldAliases: FORM_ACTION_ALIASES,
};

const UPDATE_FORM_VERSION_MUTATION = {
  operationName: "UpdateFormsVersion",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
  inputFieldAliases: FORM_ACTION_ALIASES,
};

const UPDATE_FORM_PUBLISH_MUTATION = {
  operationName: "UpdateFormsPublish",
  root: "Forms",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
  inputFieldAliases: FORM_ACTION_ALIASES,
};

// GetFormlinkWf declares its input as nullable (`GetIdInput`, not `GetIdInput!`), and formApi
// sends it as a query *param* (`params: { formId }`) on both a query and a mutation endpoint.
// Both are mapped to the same document: a mutation endpoint that only reads is still a `query`
// on the wire, so `mutation` stays unset and the mapper emits `query`.
const GET_FORM_LINK_WF_QUERY = {
  operationName: "GetFormlinkWf",
  root: "Forms",
  inputType: "GetIdInput",
  fields: `status msg data desc`,
  inputFieldAliases: FORM_ACTION_ALIASES,
};

export const GQL_FORM = {
  // "/forms": GET_LIST_FORM_QUERY,
  "/forms": {
    GET: GET_LIST_FORM_QUERY,
    POST: CREATE_FORM_MUTATION,
  },
  "/forms/casesubtype": {
    POST: GET_FORM_BY_CASE_SUBTYPE_QUERY
  },
  "/forms/getAllForms": GET_LIST_FORM_QUERY,
  "/forms/getAllFormslinkWf": GET_LIST_FORM_WORKFLOW_QUERY,
  // The action paths are declared BEFORE "/forms/:id", whose PATCH would otherwise swallow
  // "/forms/publish" (matchUrl compiles ":id" to ([^/]+)) and run UpdateForms with a
  // { formId, publish } body against itself.
  "/forms/active": { PATCH: UPDATE_FORM_ACTIVE_MUTATION },
  "/forms/version": { PATCH: UPDATE_FORM_VERSION_MUTATION },
  "/forms/publish": { PATCH: UPDATE_FORM_PUBLISH_MUTATION },
  "/forms/GetFormlinkWf": {
    GET: GET_FORM_LINK_WF_QUERY,
    POST: GET_FORM_LINK_WF_QUERY,
  },
  "/forms/:id": {
    GET: GET_FORM_BY_ID_QUERY,
    POST: CREATE_FORM_MUTATION,
    PATCH: UPDATE_FORM_MUTATION,
    DELETE: DELETE_FORM_MUTATION,
  },
};
