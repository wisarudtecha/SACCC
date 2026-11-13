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

const UPDATE_ROLE_PERMISSION_MULTI_MUTATION = {
  operationName: "UpdateRolePermissionMulti",
  root: "RolePermission",
  inputType: "RolePermissionMultiInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const CREATE_ROLE_PERMISSION_MUTATION = {
  operationName: "CreateRolePermission",
  root: "RolePermission",
  inputType: "RolePermissionInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// userApi.updateUserRolePermissions PATCHes /role_permission/:roleId with
// RolePermissionsUpdateData { permissions }. The roleId reaches the input from the path param and
// RolePermissionInput wants exactly { roleId, permissions }, so no alias is needed.
const UPDATE_ROLE_PERMISSION_MUTATION = {
  operationName: "UpdateRolePermission",
  root: "RolePermission",
  inputType: "RolePermissionInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ROLE_PERMISSION_MUTATION = {
  operationName: "DeleteRolePermission",
  root: "RolePermission",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_ROLE = {
  "/role": GET_LIST_ROLE_QUERY,
  // organizationApi/userApi create roles through POST /role/add (an "add" suffix, not a ":id"
  // path). Declared before "/role/:id" so the literal segment wins the match.
  "/role/add": { POST: CREATE_ROLE_MUTATION },
  "/role/:id": {
    GET: GET_ROLE_BY_ID_QUERY,
    POST: CREATE_ROLE_MUTATION,
    PATCH: UPDATE_ROLE_MUTATION,
    DELETE: DELETE_ROLE_MUTATION,
  },
  "/role_permission": GET_LIST_ROLE_PERMISSION_QUERY,
  // Fixed path (not ":id") so the mapper does not inject a spurious id:"multi" into
  // RolePermissionMultiInput. Declared before the ":param" keys below for the same reason as
  // "/role/add": the literal segment must win.
  "/role_permission/multi": {
    PATCH: UPDATE_ROLE_PERMISSION_MULTI_MUTATION,
  },
  "/role_permission/add": { POST: CREATE_ROLE_PERMISSION_MUTATION },
  // Two different path-param names on the same shape, because userApi sends the role id as
  // `roleId` on PATCH and the role-permission row id as `id` on DELETE. matchUrl() lets both keys
  // compile to the same regex and picks the first one that defines the requested method, so each
  // parameter name stays truthful to its own call site (`getRolePermissionById`-style GETs are
  // unaffected: neither key declares GET).
  "/role_permission/:roleId": { PATCH: UPDATE_ROLE_PERMISSION_MUTATION },
  "/role_permission/:id": { DELETE: DELETE_ROLE_PERMISSION_MUTATION },
};
