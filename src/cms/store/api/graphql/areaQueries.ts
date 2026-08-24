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

// ─── Single-record reads ──────────────────────────────────────────────────────

const GET_COUNTRY_BY_ID_QUERY = {
  operationName: "GetCountryById",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_PROVINCE_BY_ID_QUERY = {
  operationName: "GetProvinceById",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_DISTRICT_BY_ID_QUERY = {
  operationName: "GetDistrictById",
  root: "Area",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Org country tree ─────────────────────────────────────────────────────────
// These two REST paths live under /area/ but resolve to the AreaTemplate root,
// not Area. That is how the BFF exposes them (see src/cms/mocks/areaCURL.sh) -
// resist "correcting" the root to "Area", the operations do not exist there.

const GET_ORG_COUNTRY_TREE_QUERY = {
  operationName: "GetOrgCountryTree",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GENERATE_ORG_COUNTRY_TREE_MUTATION = {
  operationName: "GenerateOrgCountryTree",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
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

  // Org country tree (cached read + regenerate). Declared before the ":id" keys
  // below: these are anchored regexes so they do not actually collide, but
  // keeping literal-tailed paths first is the habit that stops a future addition
  // from being swallowed by ":id".
  "/area/countries/:id/tree": {
    GET: GET_ORG_COUNTRY_TREE_QUERY,
  },
  "/area/countries/:id/generate_tree": {
    POST: GENERATE_ORG_COUNTRY_TREE_MUTATION,
  },

  // Single-record reads. Method-keyed, never bare - a bare config satisfies
  // matchUrl's definesMethod guard for every method.
  "/area/countries/:id": {
    GET: GET_COUNTRY_BY_ID_QUERY,
  },
  "/area/provinces/:id": {
    GET: GET_PROVINCE_BY_ID_QUERY,
  },
  "/area/districts/:id": {
    GET: GET_DISTRICT_BY_ID_QUERY,
  },

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
