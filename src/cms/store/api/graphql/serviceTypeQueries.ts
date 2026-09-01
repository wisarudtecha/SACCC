// src/cms/store/api/graphql/serviceTypeQueries.ts
const GET_LIST_SERVICE_TYPE_QUERY = {
  operationName: "GetListServiceType",
  root: "ServiceType",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_SERVICE_TYPE_BY_ID_QUERY = {
  operationName: "GetServiceTypeById",
  root: "ServiceType",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_SERVICE_TYPE_MUTATION = {
  operationName: "CreateServiceType",
  root: "ServiceType",
  inputType: "ServiceTypeInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_SERVICE_TYPE_MUTATION = {
  operationName: "UpdateServiceType",
  root: "ServiceType",
  inputType: "ServiceTypeInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_SERVICE_TYPE_MUTATION = {
  operationName: "DeleteServiceType",
  root: "ServiceType",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// Keys must be method-keyed: matchUrl() (src/core/utils/gqlMapper.ts) treats a plain entry as
// defining every HTTP method, so a bare "/service_type" would compile POST (create) into the
// GetListServiceType *query*. The REST endpoint updates with PUT; PATCH kept for callers that use it.
export const GQL_SERVICE_TYPE = {
  "/service_type": {
    GET: GET_LIST_SERVICE_TYPE_QUERY,
    POST: CREATE_SERVICE_TYPE_MUTATION,
  },
  "/service_type/:id": {
    GET: GET_SERVICE_TYPE_BY_ID_QUERY,
    PUT: UPDATE_SERVICE_TYPE_MUTATION,
    PATCH: UPDATE_SERVICE_TYPE_MUTATION,
    DELETE: DELETE_SERVICE_TYPE_MUTATION,
  },
};
