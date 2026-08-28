// src/cms/store/api/customerContactDefault.ts
/**
 * The customer's primary contact channel — REST-shaped RTK Query endpoints.
 *
 * Injected into `baseWelcomeCrmApi`, the slice that already owns `/customer`
 * (`custommerApi.ts`), `/customer_notes` (`customerNote.ts`) and `/customer_with_socials`
 * (`customerSocial.ts`), so these inherit the same base URL, auth header and hybrid
 * REST/GraphQL routing.
 *
 * URLs come from `customerContactDefaultRoutes` rather than being written inline — the
 * GraphQL map keys derive from the same file, and the two must not drift.
 *
 * There is no create and no delete: the record is one row per customer that the BFF upserts,
 * so setting a primary for the first time and changing it later are the same PATCH.
 */
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { customerContactDefaultRoutes } from "@/cms/store/api/customerContactDefaultRoutes";
import type { ApiResponse } from "@/core/types";
import type {
  CustomerContactDefault,
  SetPrimaryContactInput,
} from "@/cms/types/customerContactDefault";

/**
 * The contract samples quote `custId` on read (`GetIdInput`) and leave it unquoted on write
 * (`"custId": 11111111`), while `Customer.id` is typed `string` throughout this codebase.
 * Coercing only when the value actually looks numeric is correct under either reading: a
 * numeric PK is sent as a number (which `normalizeObject` leaves untouched, so the GraphQL
 * `Int` binds), and anything else passes through unchanged rather than becoming `NaN`.
 *
 * Same rule as `customerNote.ts` — deliberately NOT the always-string rule in
 * `customerSocial.ts`, whose samples quote `custId` on write too.
 */
const toCustId = (customerId: string): number | string => {
  const numeric = Number(customerId);
  return customerId !== "" && Number.isFinite(numeric) ? numeric : customerId;
};

export const customerContactDefaultApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: builder => ({

    /**
     * A customer with no primary set is not an error — the BFF answers with a null payload,
     * which `normalizeToApiResponse` turns into `[]`. Callers decide "no record" by shape
     * (`isCustomerContactDefault`), never by truthiness.
     */
    getCustomerContactDefault: builder.query<ApiResponse<CustomerContactDefault>, string>({
      query: customerId => ({
        url: customerContactDefaultRoutes.detail(customerId),
        method: "GET",
      }),
      providesTags: (_result, _error, customerId) => [
        { type: "CustomerContactDefault", id: customerId },
      ],
    }),

    /**
     * `unknown` payload on purpose: the contract's success response is `{ status, msg, desc }`
     * with no `data`, and declaring a shape it doesn't send would be a lie the compiler then
     * enforces. Callers read the envelope instead (`apiResponseStatus.ts`).
     *
     * An absent `referId` is sent as absent rather than as `""` — `buildGraphQLQuery` strips
     * empty strings anyway, and "this channel, whichever entry is newest" is a meaningful
     * state the resolver handles.
     */
    updateCustomerContactDefault: builder.mutation<ApiResponse<unknown>, SetPrimaryContactInput>({
      query: ({ customerId, type, referId }) => ({
        url: customerContactDefaultRoutes.update(),
        method: "PATCH",
        body: {
          custId: toCustId(customerId),
          type,
          ...(referId ? { referId } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: "CustomerContactDefault", id: customerId },
      ],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls injectEndpoints a
  // second time. Without this, RTK Query keeps the definitions registered by the previous
  // run and an edit to a `query` silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useGetCustomerContactDefaultQuery,
  useLazyGetCustomerContactDefaultQuery,
  useUpdateCustomerContactDefaultMutation,
} = customerContactDefaultApi;
