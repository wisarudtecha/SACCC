// src/cms/store/api/graphql/areaQueries.ts
const GET_COUNTRY_PROVINCE_DISTRICT_LISTS_QUERY = {
  operationName: "GetDistrictLists",
  root: "Area",
  fields: `status msg data desc`
};

const GET_AREA_LISTS_QUERY = {
  operationName: "GetAddrAreaLists",
  root: "Area",
  inputType: "AddrAreaInput!",
  fields: `status msg data desc`
};

const GET_DISTRICT_LISTS_QUERY = {
  operationName: "GetAddrDistrictLists",
  root: "Area",
  inputType: "AddrDistricInput!",
  fields: `status msg data desc`
};

const GET_PROVINCE_LISTS_QUERY = {
  operationName: "GetAddrProvincetLists",
  root: "Area",
  inputType: "AddrProvinceInput!",
  fields: `status msg data desc`
};

const GET_SUB_DISTRICT_LISTS_QUERY = {
  operationName: "GetAddrSubDistrictLists",
  root: "Area",
  inputType: "AddrSubDistricInput!",
  fields: `status msg data desc`
};

// ─── Country / Province / District hierarchy list queries ────────────────────
// Dedicated per-level endpoints (distinct from GET_COUNTRY_PROVINCE_DISTRICT_LISTS_QUERY's
// merged rows above, and from the Addr-lookup queries above) - each returns
// records carrying their own real numeric id.

const GET_COUNTRY_LISTS_QUERY = {
  operationName: "GetCountryLists",
  root: "Area",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

const GET_PROVINCE_HIERARCHY_LISTS_QUERY = {
  operationName: "GetProvinceLists",
  root: "Area",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

// Note: real backend operation name has a trailing underscore
const GET_DISTRICT_HIERARCHY_LISTS_QUERY = {
  operationName: "GetDistrictLists_",
  root: "Area",
  inputType: "ListDataInput!",
  fields: `status msg data desc`
};

// ─── Country Mutations ────────────────────────────────────────────────────────

const CREATE_COUNTRY_MUTATION = {
  operationName: "CreateCountry",
  root: "Area",
  inputType: "AreaCountryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_COUNTRY_MUTATION = {
  operationName: "UpdateCountry",
  root: "Area",
  inputType: "AreaCountryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_COUNTRY_MUTATION = {
  operationName: "DeleteCountry",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Province Mutations ───────────────────────────────────────────────────────

const CREATE_PROVINCE_MUTATION = {
  operationName: "CreateProvince",
  root: "Area",
  inputType: "AreaProvinceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_PROVINCE_MUTATION = {
  operationName: "UpdateProvince",
  root: "Area",
  inputType: "AreaProvinceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_PROVINCE_MUTATION = {
  operationName: "DeleteProvince",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── District Mutations ───────────────────────────────────────────────────────

const CREATE_DISTRICT_MUTATION = {
  operationName: "CreateDistrict",
  root: "Area",
  inputType: "AreaDistrictInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_DISTRICT_MUTATION = {
  operationName: "UpdateDistrict",
  root: "Area",
  inputType: "AreaDistrictInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_DISTRICT_MUTATION = {
  operationName: "DeleteDistrict",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

export const GQL_AREA = {
  "/area/country_province_districts": GET_COUNTRY_PROVINCE_DISTRICT_LISTS_QUERY,
  "/area": GET_AREA_LISTS_QUERY,
  "/districts": GET_DISTRICT_LISTS_QUERY,
  "/provinces": GET_PROVINCE_LISTS_QUERY,
  "/subdistricts": GET_SUB_DISTRICT_LISTS_QUERY,

  // Country / Province / District hierarchy lists
  "/area/countries": GET_COUNTRY_LISTS_QUERY,
  "/area/provinces": GET_PROVINCE_HIERARCHY_LISTS_QUERY,
  "/area/districts": GET_DISTRICT_HIERARCHY_LISTS_QUERY,

  // Countries
  "/countries/add": CREATE_COUNTRY_MUTATION,
  "/countries/:id": {
    PATCH: UPDATE_COUNTRY_MUTATION,
    DELETE: DELETE_COUNTRY_MUTATION,
  },

  // Provinces
  "/provinces/add": CREATE_PROVINCE_MUTATION,
  "/provinces/:id": {
    PATCH: UPDATE_PROVINCE_MUTATION,
    DELETE: DELETE_PROVINCE_MUTATION,
  },

  // Districts
  "/districts/add": CREATE_DISTRICT_MUTATION,
  "/districts/:id": {
    PATCH: UPDATE_DISTRICT_MUTATION,
    DELETE: DELETE_DISTRICT_MUTATION,
  },
};
