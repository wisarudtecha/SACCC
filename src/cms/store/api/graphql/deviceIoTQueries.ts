// src/cms/store/api/graphql/deviceIoTQueries.ts
// SCAFFOLD (unverified): no Postman collection or schema doc exists in this repo for the
// Device IoT domain, so operationName/root/inputType/fields below are a best-effort guess
// following the ListDataInput convention used by other list queries (e.g. inventoryQueries.ts,
// appointmentStatusQueries.ts). Safe to land because hybrid mode (VITE_USE_GRAPHQL without
// VITE_GRAPHQL_STRICT) still falls back to REST if this mapping is wrong. Verify against the
// real BFF schema before relying on it, and before ever enabling VITE_GRAPHQL_STRICT for the
// route that uses this (CasePanel.tsx's useGetDeviceIoTQuery).
const GET_LIST_DEVICE_IOT_QUERY = {
  operationName: "GetListDeviceIoT",
  root: "DeviceIoT",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

export const GQL_DEVICE_IOT = {
  "/devices": GET_LIST_DEVICE_IOT_QUERY,
};
