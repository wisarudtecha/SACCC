// src/cms/store/api/graphql/appointmentQueries.ts
const GET_LIST_APPOINTMENT_QUERY = {
  operationName: "GetListAppointment",
  root: "Appointment",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_APPOINTMENT_BY_ID_QUERY = {
  operationName: "GetAppointmentByCustId",
  root: "Appointment",
  inputType: "ListDataInput2!",
  fields: `status msg data desc`,
};

const CREATE_APPOINTMENT_MUTATION = {
  operationName: "CreateAppointment",
  root: "Appointment",
  inputType: "AppointmentInsertInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_APPOINTMENT_MUTATION = {
  operationName: "UpdateAppointment",
  root: "Appointment",
  inputType: "AppointmentUpdateInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_APPOINTMENT_MUTATION = {
  operationName: "DeleteAppointment",
  root: "Appointment",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const GET_LIST_APPOINTMENT_STATUS_COUNT_QUERY = {
  operationName: "GetListAppointmentStatus",
  root: "AppointmentStatus",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

const GET_LIST_APPOINTMENT_STATUS_COUNT_BY_CUST_ID_QUERY = {
  operationName: "GetAppointmentCountStatusByCustId",
  root: "Appointment",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const PATCH_APPOINTMENT_MUTATION = {
  operationName: "AppointmentNextStage",
  root: "Appointment",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_APPOINTMENT = {
  "/appointment/next_stage/:id": {
    PATCH: PATCH_APPOINTMENT_MUTATION,
  },
  "/appointment/status_count": GET_LIST_APPOINTMENT_STATUS_COUNT_QUERY,
  "/appointment/status_count/:id": GET_LIST_APPOINTMENT_STATUS_COUNT_BY_CUST_ID_QUERY,
  "/appointment/:id": {
    GET: GET_APPOINTMENT_BY_ID_QUERY,
    // POST: CREATE_APPOINTMENT_MUTATION,
    PUT: UPDATE_APPOINTMENT_MUTATION,
    DELETE: DELETE_APPOINTMENT_MUTATION,
  },
  // "/appointment": GET_LIST_APPOINTMENT_QUERY,
  "/appointment": {
    GET: GET_LIST_APPOINTMENT_QUERY,
    POST: CREATE_APPOINTMENT_MUTATION,
  },
};
