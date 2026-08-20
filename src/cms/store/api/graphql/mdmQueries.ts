// src/cms/store/api/graphql/mdmQueries.ts
// Maps REST-style keys to GraphQL operation configs for the MDM domain
// (Unit, Company, Source, Type, Property, Status)
// Source: src/cms/mocks/mdmCURL.sh

// ─── Queries ─────────────────────────────────────────────────────────────────

const GET_LIST_MDM_STATUS_QUERY = {
  operationName: "GetListMdmStatus",
  root: "MdmStatus",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_MDM_PROPERTIES_QUERY = {
  operationName: "GetListMdmProperty",
  root: "MdmProperty",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_MDM_PROPERTY_BY_ID_QUERY = {
  operationName: "GetMdmPropertyById",
  root: "MdmProperty",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_LIST_MDM_UNIT_QUERY = {
  operationName: "GetListMdmUnit",
  root: "MdmUnit",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_MDM_UNIT_BY_ID_QUERY = {
  operationName: "GetMdmUnitById",
  root: "MdmUnit",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_MDM_UNIT_PROP_BY_ID_QUERY = {
  operationName: "GetMdmUnitPropById",
  root: "MdmUnit",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_MDM_COMPANY_QUERY = {
  operationName: "GetListMdmCompany",
  root: "MdmCompany",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_MDM_SOURCE_QUERY = {
  operationName: "GetListMdmSource",
  root: "MdmSource",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_LIST_MDM_TYPE_QUERY = {
  operationName: "GetListMdmType",
  root: "MdmType",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

// ─── Unit Mutations ─────────────────────────────────────────────────────────
// Note: input type name ("MmdUnitInput") matches a real backend typo - keep as-is.

const CREATE_MDM_UNIT_MUTATION = {
  operationName: "CreateMdmUnit",
  root: "MdmUnit",
  inputType: "MmdUnitInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_MDM_UNIT_MUTATION = {
  operationName: "UpdateMdmUnit",
  root: "MdmUnit",
  inputType: "MmdUnitInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_MDM_UNIT_MUTATION = {
  operationName: "DeleteMdmUnit",
  root: "MdmUnit",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Property Mutations ─────────────────────────────────────────────────────

const CREATE_MDM_PROPERTY_MUTATION = {
  operationName: "CreateMdmProperty",
  root: "MdmProperty",
  inputType: "MdmPropertyInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_MDM_PROPERTY_MUTATION = {
  operationName: "UpdateMdmProperty",
  root: "MdmProperty",
  inputType: "MdmPropertyInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_MDM_PROPERTY_MUTATION = {
  operationName: "DeleteMdmProperty",
  root: "MdmProperty",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_MDM = {
  "/mdm/properties": GET_LIST_MDM_PROPERTIES_QUERY,
  "/mdm/properties/add": CREATE_MDM_PROPERTY_MUTATION,
  "/mdm/properties/:id": {
    GET: GET_MDM_PROPERTY_BY_ID_QUERY,
    PATCH: UPDATE_MDM_PROPERTY_MUTATION,
    DELETE: DELETE_MDM_PROPERTY_MUTATION,
  },
  "/mdm/status": GET_LIST_MDM_STATUS_QUERY,

  "/mdm/units": GET_LIST_MDM_UNIT_QUERY,
  "/mdm/units/add": CREATE_MDM_UNIT_MUTATION,
  // Placeholder MUST be named ":id" - gqlMapper derives the GraphQL input field names
  // from the placeholder names, and GetMdmUnitPropById expects `input: { id, start, length }`.
  // No collision with "/mdm/units/:id": that pattern's ([^/]+) cannot cross the extra
  // "/properties/" path segment.
  "/mdm/units/properties/:id": GET_MDM_UNIT_PROP_BY_ID_QUERY,
  "/mdm/units/:id": {
    GET: GET_MDM_UNIT_BY_ID_QUERY,
    PATCH: UPDATE_MDM_UNIT_MUTATION,
    DELETE: DELETE_MDM_UNIT_MUTATION,
  },

  "/mdm/companies": GET_LIST_MDM_COMPANY_QUERY,
  "/mdm/sources": GET_LIST_MDM_SOURCE_QUERY,
  "/mdm/types": GET_LIST_MDM_TYPE_QUERY,
};
