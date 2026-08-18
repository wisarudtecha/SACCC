// src/cms/store/api/graphql/appointmentStatusQueries.ts
const GET_LIST_APPOINTMENT_STATUS_QUERY = {
  operationName: "GetListAppointmentStatus",
  root: "AppointmentStatus",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_APPOINTMENT_STATUS_BY_ID_QUERY = {
  operationName: "GetAppointmentStatusById",
  root: "AppointmentStatus",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_APPOINTMENT_STATUS_MUTATION = {
  operationName: "CreateAppointmentStatus",
  root: "AppointmentStatus",
  inputType: "AppointmentStatusInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_APPOINTMENT_STATUS_MUTATION = {
  operationName: "UpdateAppointmentStatus",
  root: "AppointmentStatus",
  inputType: "AppointmentStatusInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_APPOINTMENT_STATUS_MUTATION = {
  operationName: "DeleteAppointmentStatus",
  root: "AppointmentStatus",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_APPOINTMENT_STATUS = {
  "/appointment_status": GET_LIST_APPOINTMENT_STATUS_QUERY,
  "/appointment_status/:id": {
    GET: GET_APPOINTMENT_STATUS_BY_ID_QUERY,
    POST: CREATE_APPOINTMENT_STATUS_MUTATION,
    PATCH: UPDATE_APPOINTMENT_STATUS_MUTATION,
    DELETE: DELETE_APPOINTMENT_STATUS_MUTATION,
  },
};
