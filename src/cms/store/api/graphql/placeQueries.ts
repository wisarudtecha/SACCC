// src/cms/store/api/graphql/placeQueries.ts
// Maps REST-style keys to GraphQL operation configs for the Place domain
// (org-curated facilities: Police Station / Hospital / Fire Station).
// Source: src/cms/mocks/placeCURL.sh (illustrative, built from the CAD-BE
// dependency/PR docs - not captured from a live call; verify before relying
// on exact field values, per that file's own header).
//
// Previously lived under GQL_MDM in mdmQueries.ts as "MdmPlace" - moved out
// once placeCURL.sh confirmed the real root is "Place", not "MdmPlace".
//
// KNOWN ANOMALY: placeCURL.sh's CreatePlace/UpdatePlace examples include a
// client-supplied "orgId" in the mutation input. That conflicts with the REST
// spec (orgId is JWT-derived, never client-supplied - see
// docs/specification/API_Specification_Place_Device.md) and with every other
// MDM mutation in mdmCURL.sh (none send orgId in their input - the one
// occurrence there is a server-echoed response field, not an input).
// Treating this as an unverified curl artifact: orgId is deliberately NOT
// added to the FE payload (placesApi.ts). Confirm against a live backend
// before changing that.

const GET_PLACE_LISTS_QUERY = {
  operationName: "GetPlaceLists",
  root: "Place",
  inputType: "PlaceListInput",
  fields: `status msg data desc`
};

const GET_PLACE_BY_ID_QUERY = {
  operationName: "GetPlaceById",
  root: "Place",
  inputType: "GetIdInput",
  fields: `status msg data desc`
};

const CREATE_PLACE_MUTATION = {
  operationName: "CreatePlace",
  root: "Place",
  inputType: "PlaceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_PLACE_MUTATION = {
  operationName: "UpdatePlace",
  root: "Place",
  inputType: "PlaceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_PLACE_MUTATION = {
  operationName: "DeletePlace",
  root: "Place",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

export const GQL_PLACE = {
  "/places": {
    GET: GET_PLACE_LISTS_QUERY,
    POST: CREATE_PLACE_MUTATION,
  },
  "/places/:id": {
    GET: GET_PLACE_BY_ID_QUERY,
    PATCH: UPDATE_PLACE_MUTATION,
    DELETE: DELETE_PLACE_MUTATION,
  },
};
