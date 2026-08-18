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
  })
});

export const { endpoints: authGqlEndpoints } = authGqlApi;
