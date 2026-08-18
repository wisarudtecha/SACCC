// src/core/store/api/graphqlApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { graphqlBaseQuery } from "@/core/store/api/graphqlBaseQuery";

export const graphqlApi = createApi({
  reducerPath: "graphqlApi",
  tagTypes: [
    "Cases",
    "Order",
    "Product",
    "User",
  ], // reuse or new define
  baseQuery: graphqlBaseQuery(import.meta.env.VITE_GRAPHQL_BASE_URL),
  endpoints: () => ({})
});
