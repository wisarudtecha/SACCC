// Org escalation rules (Organization/System Settings -> Escalation Rules).
//
// GET / PATCH api/v1/organizations/{orgId}/escalation-rules
//
// FE contract ahead of the backend (CAD-FE-SLA-Breach-Escalation): neither
// route exists server-side yet. A 404 on GET is expected until it ships —
// `useEscalationRules` isolates the failure and falls back to schema defaults;
// a failed PATCH keeps the admin's edits and shows a persistent "not saved"
// banner. With VITE_MOCK_API="true" the session-scoped stub backs both calls
// instead and this endpoint is `skip`ped — same pattern as `useUnitWorkloads`.
//
// GraphQL: environments with VITE_USE_GRAPHQL="true" need a matching entry
// keyed by the exact REST url, registered in `GQL_MAP`
// (`src/core/utils/gqlMapper.ts`) — there is no REST fallback once GraphQL is
// enabled. The backend schema for escalation rules is not defined yet, so the
// entry is intentionally deferred until the schema is known; until then a
// GraphQL environment simply hits the isolated-failure path (defaults +
// "not saved" banner), never a crash. See CLAUDE.md → "Hybrid REST/GraphQL
// query layer".
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type {
  OrgEscalationRuleSettings,
  OrgEscalationRulesUpdateData,
} from "@/cms/types/escalation";

export const escalationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET api/v1/organizations/{orgId}/escalation-rules
    getOrgEscalationRules: builder.query<ApiResponse<OrgEscalationRuleSettings>, string>({
      query: (orgId) => ({ url: `/organizations/${orgId}/escalation-rules` }),
      providesTags: ["Organization"],
    }),

    // PATCH api/v1/organizations/{orgId}/escalation-rules
    updateOrgEscalationRules: builder.mutation<
      ApiResponse<OrgEscalationRuleSettings>,
      { orgId: string; data: OrgEscalationRulesUpdateData }
    >({
      query: ({ orgId, data }) => ({
        url: `/organizations/${orgId}/escalation-rules`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Organization"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload; see organizationApi.
  overrideExisting: import.meta.env.DEV,
});

export const { useGetOrgEscalationRulesQuery, useUpdateOrgEscalationRulesMutation } =
  escalationApi;
