// src/cms/store/api/graphql/appointmentTypeQueries.ts
const GET_LIST_APPOINTMENT_TYPE_QUERY = {
  operationName: "GetListAppointmentType",
  root: "AppointmentType",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_APPOINTMENT_TYPE_BY_ID_QUERY = {
  operationName: "GetAppointmentTypeById",
  root: "AppointmentType",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_APPOINTMENT_TYPE_MUTATION = {
  operationName: "CreateAppointmentType",
  root: "AppointmentType",
  inputType: "AppointmentTypeInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_APPOINTMENT_TYPE_MUTATION = {
  operationName: "UpdateAppointmentType",
  root: "AppointmentType",
  inputType: "AppointmentTypeInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_APPOINTMENT_TYPE_MUTATION = {
  operationName: "DeleteAppointmentType",
  root: "AppointmentType",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_APPOINTMENT_TYPE = {
  "/appointment_types": GET_LIST_APPOINTMENT_TYPE_QUERY,
  "/appointment_types/:id": {
    GET: GET_APPOINTMENT_TYPE_BY_ID_QUERY,
    POST: CREATE_APPOINTMENT_TYPE_MUTATION,
    PATCH: UPDATE_APPOINTMENT_TYPE_MUTATION,
    DELETE: DELETE_APPOINTMENT_TYPE_MUTATION,
  },
};
