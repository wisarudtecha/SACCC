// src/core/store/api/graphql/organizationQueries.ts
// Maps REST-style keys to GraphQL operation configs for:
//   Department (12), Command (13), Station (14)
// Source: SuperApp.postman_collection.json

// ─── Command Queries ──────────────────────────────────────────────────────────

const GET_LISTS_COMMAND_QUERY = {
  operationName: "GetListCommand",
  root: "Command",
  inputType: "ListDataInput",
  fields: `status msg data desc`
};

const GET_COMMAND_BY_ID_QUERY = {
  operationName: "GetCommandById",
  root: "Command",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Command Mutations ────────────────────────────────────────────────────────

const CREATE_COMMAND_MUTATION = {
  operationName: "CreateCommand",
  root: "Command",
  inputType: "CommandInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_COMMAND_MUTATION = {
  operationName: "UpdateCommand",
  root: "Command",
  inputType: "CommandInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_COMMAND_MUTATION = {
  operationName: "DeleteCommand",
  root: "Command",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Department Queries ───────────────────────────────────────────────────────

const GET_LISTS_DEPARTMENT_QUERY = {
  operationName: "GetListDepartment",
  root: "Department",
  inputType: "ListDataInput",
  fields: `status msg data desc`
};

const GET_DEPARTMENT_BY_ID_QUERY = {
  operationName: "GetDepartmentById",
  root: "Department",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_LISTS_DEP_COMM_STN_QUERY = {
  operationName: "GetListDepCommStn",
  root: "Department",
  fields: `status msg data desc`
};

// ─── Department Mutations ─────────────────────────────────────────────────────

const CREATE_DEPARTMENT_MUTATION = {
  operationName: "CreateDepartment",
  root: "Department",
  inputType: "DepartmentInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_DEPARTMENT_MUTATION = {
  operationName: "UpdateDepartment",
  root: "Department",
  inputType: "DepartmentInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_DEPARTMENT_MUTATION = {
  operationName: "DeleteDepartment",
  root: "Department",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Station Queries ──────────────────────────────────────────────────────────

const GET_LISTS_STATION_QUERY = {
  operationName: "GetListStation",
  root: "Station",
  inputType: "ListDataInput",
  fields: `status msg data desc`
};

const GET_STATION_QUERY = {
  operationName: "GetStationById",
  root: "Station",
  inputType: "GetIdInput",
  fields: `status msg data desc`
};

// ─── Station Mutations ────────────────────────────────────────────────────────

const CREATE_STATION_MUTATION = {
  operationName: "CreateStation",
  root: "Station",
  inputType: "StationInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_STATION_MUTATION = {
  operationName: "UpdateStation",
  root: "Station",
  inputType: "StationInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_STATION_MUTATION = {
  operationName: "DeleteStation",
  root: "Station",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_ORGANIZATION = {
  // Commands
  "/commands": GET_LISTS_COMMAND_QUERY,
  "/commands/:id": {
    GET: GET_COMMAND_BY_ID_QUERY,
    POST: CREATE_COMMAND_MUTATION,
    PATCH: UPDATE_COMMAND_MUTATION,
    DELETE: DELETE_COMMAND_MUTATION,
  },

  // Departments
  "/departments": GET_LISTS_DEPARTMENT_QUERY,
  "/departments/:id": {
    GET: GET_DEPARTMENT_BY_ID_QUERY,
    POST: CREATE_DEPARTMENT_MUTATION,
    PATCH: UPDATE_DEPARTMENT_MUTATION,
    DELETE: DELETE_DEPARTMENT_MUTATION,
  },
  "/department_command_stations": GET_LISTS_DEP_COMM_STN_QUERY,

  // Stations
  "/stations": GET_LISTS_STATION_QUERY,
  "/stations/:id": {
    GET: GET_STATION_QUERY,
    POST: CREATE_STATION_MUTATION,
    PATCH: UPDATE_STATION_MUTATION,
    DELETE: DELETE_STATION_MUTATION,
  },
};
