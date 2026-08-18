// src/cms/store/api/graphql/archive/caseGqlApi.ts
// import { graphqlApi } from "@/core/store/api/graphqlApi";
// import { unwrapGql } from "@/core/utils/gqlUtils";
// import { GET_CASES_QUERY } from "@/cms/store/api/graphql/queries/caseQueries";

// const normalizeCaseList = (res: Record<string, unknown> | null | undefined) => ({
//   data: res?.data ?? [],
//   totalRecords: res?.totalRecords ?? 0,
//   totalFiltered: res?.totalFiltered ?? 0,
//   pageSize: res?.pageSize ?? 10,
//   currentPage: res?.currentPage ?? 1,
// });

// export const caseGqlApi = graphqlApi.injectEndpoints({
//   endpoints: builder => ({
//     getListCaseGql: builder.query({
//       query: params => ({
//         body: GET_CASES_QUERY,
//         variables: {
//           input: {
//             start: params.start,
//             length: params.length
//           }
//         }
//       }),
//       transformResponse: response => {
//         // const res = response.cases;
//         const res = unwrapGql(["Case", "GetListCase"])(response);
//         // return {
//         //   data: res.data,
//         //   totalRecords: res.totalRecords,
//         //   totalFiltered: res.totalFiltered,
//         //   pageSize: res.pageSize,
//         //   currentPage: res.currentPage
//         // };
//         return normalizeCaseList(res as Record<string, unknown>);
//       },
//       providesTags: ["Cases"]
//     }),
//   })
// });

// export const {
//   useGetListCaseGqlQuery
// } = caseGqlApi;
