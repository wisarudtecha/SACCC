// src/cms/store/api/graphql/userContactQueries.ts
// Orphaned: not spread into GQL_MAP (gqlMapper.ts) and no REST endpoint currently calls /user-contacts*.
const GET_LIST_USER_CONTACT_QUERY = {
  operationName: "GetListUserContact",
  root: "UserContact",
  inputType: "ListDataInput",
  fields: `status msg currentPage pageSize totalFiltered totalRecords totalPage data desc`,
};

const GET_USER_CONTACT_BY_ID_QUERY = {
  operationName: "GetUserContactById",
  root: "UserContact",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_USER_CONTACT_MUTATION = {
  operationName: "CreateUserContact",
  root: "UserContact",
  inputType: "UserContactInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_USER_CONTACT_MUTATION = {
  operationName: "UpdateUserContact",
  root: "UserContact",
  inputType: "UserContactInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_USER_CONTACT_MUTATION = {
  operationName: "DeleteUserContact",
  root: "UserContact",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_USER_CONTACT = {
  "/user-contacts": GET_LIST_USER_CONTACT_QUERY,
  "/user-contacts/:id": {
    GET: GET_USER_CONTACT_BY_ID_QUERY,
    POST: CREATE_USER_CONTACT_MUTATION,
    PATCH: UPDATE_USER_CONTACT_MUTATION,
    DELETE: DELETE_USER_CONTACT_MUTATION,
  },
};
