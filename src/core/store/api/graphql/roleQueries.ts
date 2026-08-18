// src/core/store/api/graphql/roleQueries.ts
const GET_LIST_ROLE_QUERY = {
  operationName: "GetListRole",
  root: "Role",
  inputType: "ListDataInput!",
  // fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
  fields: `status msg data desc`,
};

const GET_ROLE_BY_ID_QUERY = {
  operationName: "GetRoleById",
  root: "Role",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_ROLE_MUTATION = {
  operationName: "CreateRole",
  root: "Role",
  inputType: "RoleInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_ROLE_MUTATION = {
  operationName: "UpdateRole",
  root: "Role",
  inputType: "RoleInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ROLE_MUTATION = {
  operationName: "DeleteRole",
  root: "Role",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const GET_LIST_ROLE_PERMISSION_QUERY = {
  operationName: "GetListRolePermission",
  root: "RolePermission",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const UPDATE_ROLE_PERMISSION_MUTATION = {
  operationName: "UpdateRolePermissionMulti",
  root: "RolePermission",
  inputType: "RolePermissionMultiInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_ROLE = {
  "/role": GET_LIST_ROLE_QUERY,
  "/role/:id": {
    GET: GET_ROLE_BY_ID_QUERY,
    POST: CREATE_ROLE_MUTATION,
    PATCH: UPDATE_ROLE_MUTATION,
    DELETE: DELETE_ROLE_MUTATION,
  },
  "/role_permission": GET_LIST_ROLE_PERMISSION_QUERY,
  // Fixed path (not ":id") so the mapper does not inject a spurious id:"multi" into
  // RolePermissionMultiInput. The per-roleId PATCH (/role_permission/:roleId) has no
  // GraphQL equivalent and its only consumer is commented out, so it is left unmapped
  // and safely falls back to REST instead of being mis-routed to UpdateRolePermissionMulti.
  "/role_permission/multi": {
    PATCH: UPDATE_ROLE_PERMISSION_MUTATION,
  },
};
