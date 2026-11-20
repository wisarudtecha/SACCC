// src/core/store/api/graphql/configPropertyQueries.ts
// Maps the REST-shaped config-property endpoints to the BFF's ConfigProperty root.
//
// Verified against the live schema by anonymous introspection (cc-bff-stg,
// 2026-11-18) rather than inferred from the mock docs:
//
//   Query.ConfigProperty.GetConfigPropertyByKey(input: ConfigPropertyKeyInput)
//   Mutation.ConfigProperty.SetConfigPropertyByKey(input: ConfigPropertySetInput!)
//   ConfigPropertyKeyInput  { propKey: String! }
//   ConfigPropertySetInput  { propKey: String!, propVal: JSON! }
//   ApiResponse             { status msg data desc }
//
// `propVal` is the JSON scalar, so the whole settings document travels as one value
// and `fields` never has to enumerate anything inside it.
//
// Re-validate after touching these names:
//   node scripts/validate-gql-map.mjs https://cc-bff-stg.one-sky.ai/graphql

const GET_CONFIG_PROPERTY_BY_KEY_QUERY = {
  operationName: "GetConfigPropertyByKey",
  root: "ConfigProperty",
  inputType: "ConfigPropertyKeyInput",
  fields: `status msg data desc`
};

// Upsert by key: creates the row when the key does not exist yet, which is why the
// settings page needs no Create step.
const SET_CONFIG_PROPERTY_BY_KEY_MUTATION = {
  operationName: "SetConfigPropertyByKey",
  root: "ConfigProperty",
  inputType: "ConfigPropertySetInput!",
  fields: `status msg data desc`,
  mutation: true
};

// ─── Registration Map ─────────────────────────────────────────────────────────

export const GQL_CONFIG_PROPERTY = {
  // The caller builds the url with encodeURIComponent(propKey). A propKey like
  // "org.config.properties" keeps its dots (they are URL-unreserved), and ":" is
  // compiled to ([^/]+), so the single segment matches.
  "/config_properties/key/:propKey": {
    GET: GET_CONFIG_PROPERTY_BY_KEY_QUERY,
    POST: SET_CONFIG_PROPERTY_BY_KEY_MUTATION,
  },
};
