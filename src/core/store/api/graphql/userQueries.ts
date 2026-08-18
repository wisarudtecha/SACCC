// src/core/store/api/graphql/userQueries.ts
// Maps REST-style keys to GraphQL operation configs for the User domain
// Source: src/core/mocks/userCURL.sh (User, UserSkill roots)

// ─── User Queries ──────────────────────────────────────────────────────────────

const GET_LISTS_USER_QUERY = {
  operationName: "GetListUser",
  root: "User",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_USER_BY_ID_QUERY = {
  operationName: "GetUserById",
  root: "User",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// GetUserByUsername / GetUserForCaseInfo both take GetIdInput! with the username
// carried in input.id, so their path placeholder must be `:id` (not `:username`)
// for the mapper to drop the value into input.id automatically.
const GET_USER_BY_USERNAME_QUERY = {
  operationName: "GetUserByUsername",
  root: "User",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_USER_FOR_CASE_INFO_QUERY = {
  operationName: "GetUserForCaseInfo",
  root: "User",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── User Mutations ─────────────────────────────────────────────────────────────

const CREATE_USER_MUTATION = {
  operationName: "CreateUser",
  root: "User",
  inputType: "CreateUserInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_USER_MUTATION = {
  operationName: "UpdateUser",
  root: "User",
  inputType: "UpdateUserInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_USER_MUTATION = {
  operationName: "DeleteUser",
  root: "User",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// Password mutations. The `:id` on change_password lands in ChangePasswordInput.id via pathParams;
// reset_password identifies its target by email + username in the body instead.
const CHANGE_PASSWORD_MUTATION = {
  operationName: "ChangePassword",
  root: "User",
  inputType: "ChangePasswordInput!",
  fields: `status msg data desc`,
  mutation: true
};

const RESET_PASSWORD_MUTATION = {
  operationName: "ResetPassword",
  root: "User",
  inputType: "ResetPasswordInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── UserSkill (root: UserSkill) ────────────────────────────────────────────────

const GET_USER_SKILL_BY_USERNAME_QUERY = {
  operationName: "GetUserSkillByUsername",
  root: "UserSkill",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// userApi's updateUserWithSkillsBatch calls POST /users_with_skills_batch/add.
// userCURL.sh documents the op as PATCH /users_with_skills_batch/update, but the
// GraphQL layer only keys off the operation name, so the code's actual URL maps here.
const UPDATE_USER_SKILL_BATCH_MUTATION = {
  operationName: "UpdateUserSkillBatch",
  root: "UserSkill",
  inputType: "UserSkillBatchInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── UserArea (root: UserArea) ──────────────────────────────────────────────────

const GET_USER_AREA_BY_USERNAME_QUERY = {
  operationName: "GetUserAreaByUsername",
  root: "UserArea",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const UPDATE_USER_AREA_MUTATION = {
  operationName: "UpdateUserArea",
  root: "UserArea",
  inputType: "UserAreaInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_USER = {
  "/users": GET_LISTS_USER_QUERY,
  "/users/add": {
    POST: CREATE_USER_MUTATION,
  },
  // Declared ahead of "/users/:id" for clarity. Order is not actually load-bearing here:
  // "/users/:id" defines no POST, so matchUrl's definesMethod guard skips it for this URL.
  "/users/reset_password": {
    POST: RESET_PASSWORD_MUTATION,
  },
  "/users/:id": {
    GET: GET_USER_BY_ID_QUERY,
    PATCH: UPDATE_USER_MUTATION,
    DELETE: DELETE_USER_MUTATION,
  },
  // Three segments, so it cannot collide with the two-segment "/users/:id"; the only other
  // three-segment key is "/users/username/:id", which requires the literal "username".
  "/users/change_password/:id": {
    PATCH: CHANGE_PASSWORD_MUTATION,
  },
  // More-specific username routes first; segment counts keep them disjoint from
  // "/users/:id" and each other, so match order is not load-bearing.
  "/users/username/ForCaseInfo/:id": GET_USER_FOR_CASE_INFO_QUERY,
  "/users/username/:id": GET_USER_BY_USERNAME_QUERY,
  "/users_with_skills/username/:id": GET_USER_SKILL_BY_USERNAME_QUERY,
  "/users_with_skills_batch/add": {
    POST: UPDATE_USER_SKILL_BATCH_MUTATION,
  },
  "/users_with_area/username/:id": GET_USER_AREA_BY_USERNAME_QUERY,
  "/users_with_area/:id": {
    PATCH: UPDATE_USER_AREA_MUTATION,
  },
};
