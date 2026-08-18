// src/core/store/api/graphql/userGroupQueries.ts
// Maps REST-style keys to GraphQL operation configs for the User Group domain.
// Contracts documented in src/core/mocks/userCURL.v2.sh (root: UserGroup). Keyed by the exact
// REST `url` strings used in userApi.ts; the hybrid layer converts matching REST calls to
// GraphQL when VITE_USE_GRAPHQL === "true" (and there is no REST fallback in that mode, so the
// keys/placeholders below must exactly reproduce each operation's input shape).
//
// GetUserGroupById (GET /user_groups/:id — no trailing "/users") returns the group's own record
// PLUS its member usernames embedded in one field (`data.users: string[]`), confirmed via a real
// response. This is a single-record read (matches this schema's ...ById convention elsewhere —
// GetUserById/GetRoleById), just one whose payload happens to include a nested member list; it is
// NOT itself a list of member rows, so don't expect `data` to be an array.
//
// Placeholder names double as GraphQL input field names, so the group identifier is `:id`
// everywhere (member assigns, update/delete, and this read) — the mapper drops the matched path
// segment into `input.id`. matchUrl is method-aware, so the POST literals (.../users/add,
// .../users/batch) and the DELETE wildcard (.../users/:username) coexist without collision, and
// this GET shares the same "/user_groups/:id" key as the PATCH/DELETE mutations below it.

// ─── Queries ────────────────────────────────────────────────────────────────────

const GET_LIST_USER_GROUP_QUERY = {
  operationName: "GetListUserGroup",
  root: "UserGroup",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

// The group's own record + member usernames; input.id = grpId.
const GET_USER_GROUP_BY_ID_QUERY = {
  operationName: "GetUserGroupById",
  root: "UserGroup",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

// Groups a user belongs to; input.id = username. REST path is /user_with_groups/... (note
// "user_with_groups", not "user_groups" — confirmed against the real backend response).
const GET_USER_GROUP_BY_USERNAME_QUERY = {
  operationName: "GetUserGroupByUsername",
  root: "UserGroup",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

// ─── Mutations ──────────────────────────────────────────────────────────────────

const CREATE_USER_GROUP_MUTATION = {
  operationName: "CreateUserGroup",
  root: "UserGroup",
  inputType: "UserGroupInsertInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_USER_GROUP_MUTATION = {
  operationName: "UpdateUserGroup",
  root: "UserGroup",
  inputType: "UserGroupInsertInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_USER_GROUP_MUTATION = {
  operationName: "DeleteUserGroup",
  root: "UserGroup",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const ASSIGN_USER_GROUP_MUTATION = {
  operationName: "AssignUserGroup",
  root: "UserGroup",
  inputType: "AssignUserGroupInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const ASSIGN_USER_GROUP_BATCH_MUTATION = {
  operationName: "AssignUserGroupBatch",
  root: "UserGroup",
  inputType: "AssignUserGroupBatchInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_ASSIGN_USER_GROUP_MUTATION = {
  operationName: "DeleteAssignUserGroup",
  root: "UserGroup",
  inputType: "DeleteAssignUserGroupInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_USER_GROUP = {
  "/user_groups/all": GET_LIST_USER_GROUP_QUERY,
  "/user_groups/add": {
    POST: CREATE_USER_GROUP_MUTATION,
  },
  "/user_with_groups/username/:id": GET_USER_GROUP_BY_USERNAME_QUERY,
  "/user_groups/:id/users/add": {
    POST: ASSIGN_USER_GROUP_MUTATION,
  },
  "/user_groups/:id/users/batch": {
    POST: ASSIGN_USER_GROUP_BATCH_MUTATION,
  },
  "/user_groups/:id/users/:username": {
    DELETE: DELETE_ASSIGN_USER_GROUP_MUTATION,
  },
  "/user_groups/:id": {
    GET: GET_USER_GROUP_BY_ID_QUERY,
    PATCH: UPDATE_USER_GROUP_MUTATION,
    DELETE: DELETE_USER_GROUP_MUTATION,
  },
};
