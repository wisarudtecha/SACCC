// src/core/store/api/graphql/authGqlApi.ts
import { graphqlApi } from "@/core/store/api/graphqlApi";

export const authGqlApi = graphqlApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: variables => ({
        body: `mutation ($input: LoginInput!) { Auth { AuthLogin(input: $input) { status msg data desc } } }`,
        variables: { input: variables }
      })
    })
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const { endpoints: authGqlEndpoints } = authGqlApi;
