// src/core/store/api/graphql/permissionQueries.ts
// Orphaned: no REST caller. Permission checks go through permissionManager.ts client-side, never hit this endpoint.
const GET_LIST_PERMISSION_QUERY = {
  operationName: "GetListPermission",
  root: "Permission",
  inputType: "ListDataInput",
  // fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
  fields: `status msg data desc`,
};

const GET_PERMISSION_BY_ID_QUERY = {
  operationName: "GetPermissionById",
  root: "Permission",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_PERMISSION_MUTATION = {
  operationName: "CreatePermission",
  root: "Permission",
  inputType: "PermissionInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_PERMISSION_MUTATION = {
  operationName: "UpdatePermission",
  root: "Permission",
  inputType: "PermissionInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_PERMISSION_MUTATION = {
  operationName: "DeletePermission",
  root: "Permission",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_PERMISSION = {
  "/permission": GET_LIST_PERMISSION_QUERY,
  "/permission/:id": {
    GET: GET_PERMISSION_BY_ID_QUERY,
    POST: CREATE_PERMISSION_MUTATION,
    PATCH: UPDATE_PERMISSION_MUTATION,
    DELETE: DELETE_PERMISSION_MUTATION,
  },
};
