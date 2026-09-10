// src/cms/store/api/graphql/deviceIoTQueries.ts
//
// PROVISIONAL / UNVERIFIED. No Postman collection or BFF schema doc exists in
// this repo for the Device IoT domain, so operationName / root / inputType /
// fields below are a best-effort guess following the ListDataInput convention
// used by other list queries (e.g. inventoryQueries.ts, appointmentStatusQueries.ts).
//
// There is NO REST fallback. Every environment runs VITE_USE_GRAPHQL="true" and
// hybridBaseQuery does not fall back to REST when a GraphQL mapping is wrong or
// missing - it returns a hard error to the caller. (An earlier version of this
// comment claimed a VITE_GRAPHQL_STRICT flag gated a REST fallback; that flag
// does not exist anywhere in the codebase.) So these ops MUST be confirmed
// against the real BFF schema before anything relies on them:
//   - GetListDeviceIoT     -> CasePanel.tsx's useGetDeviceIoTQuery
//   - GetDeviceIoTInBounds -> the case-map Device layer's viewport fetch (P5)
//   - GetDeviceIoTById / CreateDeviceIoT / UpdateDeviceIoT
//                          -> the Device Management admin screen
//                             (CAD-FE-Device-Management). operationName / root /
//                             inputType follow the MdmProperty / MdmPlace
//                             convention in mdmQueries.ts and MUST be confirmed
//                             against the real BFF schema before ship - the BFF
//                             must also accept `en` / `th` / `active` on the
//                             Device input and echo them on the read ops.

const GET_LIST_DEVICE_IOT_QUERY = {
  operationName: "GetListDeviceIoT",
  root: "DeviceIoT",
  inputType: "ListDataInput!",
  fields: `status msg data desc`,
};

// GET /devices/within-bounds. `DeviceIoTBoundsInput!` is a guess - it is expected
// to carry { minLat, minLon, maxLat, maxLon } (WGS84 degrees).
const GET_DEVICE_IOT_IN_BOUNDS_QUERY = {
  operationName: "GetDeviceIoTInBounds",
  root: "DeviceIoT",
  inputType: "DeviceIoTBoundsInput!",
  fields: `status msg data desc`,
};

// ── Device Management admin CRUD - PROVISIONAL (see header note) ──────────────

const GET_DEVICE_IOT_BY_ID_QUERY = {
  operationName: "GetDeviceIoTById",
  root: "DeviceIoT",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const CREATE_DEVICE_IOT_MUTATION = {
  operationName: "CreateDeviceIoT",
  root: "DeviceIoT",
  inputType: "DeviceIoTInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_DEVICE_IOT_MUTATION = {
  operationName: "UpdateDeviceIoT",
  root: "DeviceIoT",
  inputType: "DeviceIoTInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_DEVICE_IOT = {
  "/devices": GET_LIST_DEVICE_IOT_QUERY,
  "/devices/within-bounds": GET_DEVICE_IOT_IN_BOUNDS_QUERY,

  // Bare "/devices" (list) never collides with "/devices/add" (create) - they
  // are distinct keys, same safety note as "/mdm/places" in mdmQueries.ts.
  "/devices/add": CREATE_DEVICE_IOT_MUTATION,
  "/devices/:id": {
    GET: GET_DEVICE_IOT_BY_ID_QUERY,
    PATCH: UPDATE_DEVICE_IOT_MUTATION,
  },
};
