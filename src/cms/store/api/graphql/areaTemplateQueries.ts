// src/cms/store/api/graphql/areaTemplateQueries.ts
// REST -> GraphQL mapping for the AreaTemplate root.
// Source of truth: src/cms/mocks/areaTemplateCURL.sh. inputType strings are
// copied verbatim from it, nullability included - TemplateProvinceListInput and
// TemplateDistrictListInput really do lack the trailing "!".

// ─── Template country queries ─────────────────────────────────────────────────

// GetListTemplateCountry takes no input at all. Omitting inputType makes
// buildGraphQLQuery emit a bare `query { ... }` with no $input variable, which
// is what the BFF expects here - see gqlMapper.ts.
const GET_LIST_TEMPLATE_COUNTRY_QUERY = {
  operationName: "GetListTemplateCountry",
  root: "AreaTemplate",
  fields: `status msg data desc`
};

const GET_TEMPLATE_COUNTRY_BY_ID_QUERY = {
  operationName: "GetTemplateCountryById",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_TEMPLATE_COUNTRY_VERSIONS_QUERY = {
  operationName: "GetTemplateCountryVersions",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

const GET_TEMPLATE_COUNTRY_TREE_QUERY = {
  operationName: "GetTemplateCountryTree",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Template province / district queries ─────────────────────────────────────

// Nullable input type (no "!") - matches the curl reference.
const GET_LIST_TEMPLATE_PROVINCE_QUERY = {
  operationName: "GetListTemplateProvince",
  root: "AreaTemplate",
  inputType: "TemplateProvinceListInput",
  fields: `status msg data desc`
};

const GET_TEMPLATE_PROVINCE_BY_ID_QUERY = {
  operationName: "GetTemplateProvinceById",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// Nullable input type (no "!") - matches the curl reference.
const GET_LIST_TEMPLATE_DISTRICT_QUERY = {
  operationName: "GetListTemplateDistrict",
  root: "AreaTemplate",
  inputType: "TemplateDistrictListInput",
  fields: `status msg data desc`
};

const GET_TEMPLATE_DISTRICT_BY_ID_QUERY = {
  operationName: "GetTemplateDistrictById",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`
};

// ─── Template country mutations ───────────────────────────────────────────────

const CREATE_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "CreateTemplateCountry",
  root: "AreaTemplate",
  inputType: "TemplateCountryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "UpdateTemplateCountry",
  root: "AreaTemplate",
  inputType: "TemplateCountryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "DeleteTemplateCountry",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

const PUBLISH_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "PublishTemplateCountry",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

const FORK_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "ForkTemplateCountry",
  root: "AreaTemplate",
  inputType: "ForkTemplateInput!",
  fields: `status msg data desc`,
  mutation: true
};

const GENERATE_TEMPLATE_COUNTRY_TREE_MUTATION = {
  operationName: "GenerateTemplateCountryTree",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Template province mutations ──────────────────────────────────────────────

const CREATE_TEMPLATE_PROVINCE_MUTATION = {
  operationName: "CreateTemplateProvince",
  root: "AreaTemplate",
  inputType: "TemplateProvinceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_TEMPLATE_PROVINCE_MUTATION = {
  operationName: "UpdateTemplateProvince",
  root: "AreaTemplate",
  inputType: "TemplateProvinceInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_TEMPLATE_PROVINCE_MUTATION = {
  operationName: "DeleteTemplateProvince",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Template district mutations ──────────────────────────────────────────────

const CREATE_TEMPLATE_DISTRICT_MUTATION = {
  operationName: "CreateTemplateDistrict",
  root: "AreaTemplate",
  inputType: "TemplateDistrictInput!",
  fields: `status msg data desc`,
  mutation: true
};

const UPDATE_TEMPLATE_DISTRICT_MUTATION = {
  operationName: "UpdateTemplateDistrict",
  root: "AreaTemplate",
  inputType: "TemplateDistrictInput!",
  fields: `status msg data desc`,
  mutation: true
};

const DELETE_TEMPLATE_DISTRICT_MUTATION = {
  operationName: "DeleteTemplateDistrict",
  root: "AreaTemplate",
  inputType: "GetIdInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Template -> organization area mutations ──────────────────────────────────

const CREATE_ORG_AREA_FROM_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "CreateOrgAreaFromTemplateCountry",
  root: "AreaTemplate",
  inputType: "FromTemplateCountryInput!",
  fields: `status msg data desc`,
  mutation: true
};

const SYNC_TEMPLATE_COUNTRY_MUTATION = {
  operationName: "SyncTemplateCountry",
  root: "AreaTemplate",
  inputType: "SyncTemplateInput!",
  fields: `status msg data desc`,
  mutation: true
};

// Two rules govern the key order and shape below, both learned the hard way in
// GQL_STORE / GQL_BRAND:
//
// 1. Always method-keyed objects, never a bare config. matchUrl's definesMethod
//    guard treats a bare config as defining *every* method, so a bare list query
//    on "/template/countries" would swallow POSTs meant for CreateTemplateCountry.
// 2. Literal-segment keys come before their ":id" sibling. The regex for
//    "/template/countries/:id" is ^/template/countries/([^/]+)$, which also
//    matches "/add" and "/from_template". Today the method filter saves us
//    because ":id" defines no POST; declaring the literals first means it stays
//    correct even if that changes.
export const GQL_AREA_TEMPLATE = {
  // Template countries
  "/template/countries": {
    GET: GET_LIST_TEMPLATE_COUNTRY_QUERY,
  },
  "/template/countries/add": {
    POST: CREATE_TEMPLATE_COUNTRY_MUTATION,
  },
  "/template/countries/from_template": {
    POST: CREATE_ORG_AREA_FROM_TEMPLATE_COUNTRY_MUTATION,
  },
  "/template/countries/:id/versions": {
    GET: GET_TEMPLATE_COUNTRY_VERSIONS_QUERY,
  },
  "/template/countries/:id/tree": {
    GET: GET_TEMPLATE_COUNTRY_TREE_QUERY,
  },
  "/template/countries/:id/publish": {
    POST: PUBLISH_TEMPLATE_COUNTRY_MUTATION,
  },
  "/template/countries/:id/fork": {
    POST: FORK_TEMPLATE_COUNTRY_MUTATION,
  },
  "/template/countries/:id/sync_template": {
    POST: SYNC_TEMPLATE_COUNTRY_MUTATION,
  },
  "/template/countries/:id/generate_tree": {
    POST: GENERATE_TEMPLATE_COUNTRY_TREE_MUTATION,
  },
  "/template/countries/:id": {
    GET: GET_TEMPLATE_COUNTRY_BY_ID_QUERY,
    PATCH: UPDATE_TEMPLATE_COUNTRY_MUTATION,
    DELETE: DELETE_TEMPLATE_COUNTRY_MUTATION,
  },

  // Template provinces
  "/template/provinces": {
    GET: GET_LIST_TEMPLATE_PROVINCE_QUERY,
  },
  "/template/provinces/add": {
    POST: CREATE_TEMPLATE_PROVINCE_MUTATION,
  },
  "/template/provinces/:id": {
    GET: GET_TEMPLATE_PROVINCE_BY_ID_QUERY,
    PATCH: UPDATE_TEMPLATE_PROVINCE_MUTATION,
    DELETE: DELETE_TEMPLATE_PROVINCE_MUTATION,
  },

  // Template districts
  "/template/districts": {
    GET: GET_LIST_TEMPLATE_DISTRICT_QUERY,
  },
  "/template/districts/add": {
    POST: CREATE_TEMPLATE_DISTRICT_MUTATION,
  },
  "/template/districts/:id": {
    GET: GET_TEMPLATE_DISTRICT_BY_ID_QUERY,
    PATCH: UPDATE_TEMPLATE_DISTRICT_MUTATION,
    DELETE: DELETE_TEMPLATE_DISTRICT_MUTATION,
  },
};
