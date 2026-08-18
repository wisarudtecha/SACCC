// src/cms/store/api/graphql/caseQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Case domain
// Source: SuperApp.postman_collection.json – "5. Case" and "8. Case-Status"

// ─── Case Queries ─────────────────────────────────────────────────────────────

const GET_LIST_CASE_QUERY = {
  operationName: "GetListCase",
  root: "Case",
  inputType: "CaseListInput",
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data { caseId caseTypeId caseSTypeId priority caseDetail statusId createdAt createdBy caseSla createdDate caseLocAddr caseLocAddrDecs }`
};

const GET_CASE_BY_CASE_ID_QUERY = {
  operationName: "GetCaseByCaseId",
  root: "Case",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_CASE_BY_ID_QUERY = {
  operationName: "GetCaseById",
  root: "Case",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_CASE_CUSTOMER_QUERY = {
  operationName: "GetCaseByCust",
  root: "Case",
  inputType: "CaseListByCustInput!",
  fields: `status msg data desc`
};

// ─── Case Mutations ───────────────────────────────────────────────────────────

const CREATE_CASE_MUTATION = {
  operationName: "CreateCase",
  root: "Case",
  inputType: "CaseInsertInput!",
  fields: `status msg desc caseId`,
  mutation: true
};

const UPDATE_CASE_MUTATION = {
  operationName: "UpdateCase",
  root: "Case",
  inputType: "CaseUpdateInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_CASE_CUSTOMER_MUTATION = {
  operationName: "UpdateCaseCustomer",
  root: "Case",
  inputType: "CaseCustomerInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_CASE_MUTATION = {
  operationName: "DeleteCase",
  root: "Case",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Case-Status Queries ──────────────────────────────────────────────────────

const GET_LIST_CASE_STATUS_QUERY = {
  operationName: "GetListCaseStatus",
  root: "CaseStatus",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_CASE_STATUS_BY_CASE_ID_QUERY = {
  operationName: "GetCaseStatusByCaseId",
  root: "CaseStatus",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Case-Type / Sub-Type Queries ─────────────────────────────────────────────

const GET_LIST_CASE_SUB_TYPE_QUERY = {
  operationName: "GetListCaseSubType",
  root: "CaseSubTypes",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_CASE_TYPE_QUERY = {
  operationName: "GetListCaseType",
  root: "CaseTypes",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_CASE_TYPE_AND_SUB_TYPE_QUERY = {
  operationName: "GetListCaseTypeWithSubTypes",
  root: "CaseTypes",
  fields: `status msg data desc`
};

// ─── Area helper (kept for backward compat) ───────────────────────────────────

const GET_DISTRICT_LISTS_QUERY = {
  operationName: "GetDistrictLists",
  root: "Area",
  fields: `status msg data desc`
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CASE = {
  // Area (retained for backward compatibility)
  "/area/country_province_districts": GET_DISTRICT_LISTS_QUERY,

  // Case
  "/case": GET_LIST_CASE_QUERY,
  "/case/add": CREATE_CASE_MUTATION,
  "/case/caseId/:id": GET_CASE_BY_CASE_ID_QUERY,
  "/case/customer/:customerId": GET_CASE_CUSTOMER_QUERY,
  "/case/:id": {
    GET: GET_CASE_BY_ID_QUERY,
    PATCH: UPDATE_CASE_MUTATION,
    DELETE: DELETE_CASE_MUTATION,
    // POST: CREATE_CASE_MUTATION,
  },
  "/case/:id/customer": {
    PATCH: UPDATE_CASE_CUSTOMER_MUTATION
  },
  "/case_status": GET_LIST_CASE_STATUS_QUERY,
  "/case_status/:id": GET_CASE_STATUS_BY_CASE_ID_QUERY,

  "/casesubtypes": GET_LIST_CASE_SUB_TYPE_QUERY,
  "/casetypes": GET_LIST_CASE_TYPE_QUERY,
  "/casetypes_with_subtype": GET_LIST_CASE_TYPE_AND_SUB_TYPE_QUERY,
};
