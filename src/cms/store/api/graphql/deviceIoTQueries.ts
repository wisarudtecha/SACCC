// src/cms/store/api/graphql/deviceIoTQueries.ts
//
// Maps REST-style keys to GraphQL operation configs for the Device IoT domain.
// Source: src/cms/mocks/deviceCURL.sh (illustrative, built from the CAD-BE
// dependency/PR docs - not captured from a live call; verify before relying
// on exact field values, per that file's own header). Confirmed root
// "Device" (not "DeviceIoT") and operation names GetDeviceLists /
// GetDeviceById / InsertDeviceIoT / UpdateDeviceIoT / DeleteDeviceIoT.
//
// There is no separate "devices in bounds" operation on this schema - an
// earlier GET_DEVICE_IOT_IN_BOUNDS_QUERY guess (operation "GetDeviceIoTInBounds",
// input "DeviceIoTBoundsInput!") was disproved by a live GRAPHQL_VALIDATION_FAILED
// response ("Unknown type DeviceIoTBoundsInput" / "Cannot query field
// GetDeviceIoTInBounds", suggesting GetDeviceById/GetDeviceLists instead).
// deviceCURL.sh's own bbox example confirms bbox-filtered fetching goes
// through the ordinary device list query (GetDeviceLists) - see
// useDeviceLayer.ts, which now calls getDeviceIoT with a bbox param instead
// of a dedicated bounds endpoint. The REST "/devices/within-bounds" path this
// used to key off of no longer exists either (src/cms/store/api/deviceIoT.ts).
//
// deviceId vs id: GetDeviceById / DeleteDeviceIoT use GetIdInput (field
// "id"), but UpdateDeviceIoT uses DeviceIoTInput! and expects "deviceId"
// inside the input (GraphQL has no URL path, so the identifying field must
// travel with the body - unlike REST's PATCH /devices/{deviceId}, where it's
// path-only). gqlMapper.ts derives the GraphQL input field name from the
// ":placeholder" name in a GQL_MAP key, so this needs two separate keys for
// the same URL shape ("/devices/:id" vs "/devices/:deviceId") - see the
// GQL_DEVICE_IOT registration below.

const GET_DEVICE_LISTS_QUERY = {
  operationName: "GetDeviceLists",
  root: "Device",
  inputType: "DeviceListInput!",
  fields: `status msg data desc`,
};

const GET_DEVICE_BY_ID_QUERY = {
  operationName: "GetDeviceById",
  root: "Device",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
};

const INSERT_DEVICE_IOT_MUTATION = {
  operationName: "InsertDeviceIoT",
  root: "Device",
  inputType: "DeviceIoTInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const UPDATE_DEVICE_IOT_MUTATION = {
  operationName: "UpdateDeviceIoT",
  root: "Device",
  inputType: "DeviceIoTInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const DELETE_DEVICE_IOT_MUTATION = {
  operationName: "DeleteDeviceIoT",
  root: "Device",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_DEVICE_IOT = {
  "/devices": {
    GET: GET_DEVICE_LISTS_QUERY,
    POST: INSERT_DEVICE_IOT_MUTATION,
  },
  "/devices/:id": {
    GET: GET_DEVICE_BY_ID_QUERY,
    DELETE: DELETE_DEVICE_IOT_MUTATION,
  },
  "/devices/:deviceId": {
    PATCH: UPDATE_DEVICE_IOT_MUTATION,
  },
};
