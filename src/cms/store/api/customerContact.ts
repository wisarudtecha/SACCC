// src/cms/store/api/customerContact.ts
/**
 * RTK Query slice for `/customer_contacts` — the people a customer account keeps, each with
 * their own phone number.
 *
 * URLs come from `customerContactRoutes` rather than being written inline, so the REST call and
 * the `GQL_MAP` pattern stay in step (see that file for why the detail parameter must be `:id`).
 *
 * The list operation takes only `start`/`length`: the contract defines no `custId` filter and no
 * total. `useCustomerContacts` therefore sweeps pages and filters by customer, exactly as
 * `useCustomerSocials` does — do not "optimise" this into a single page without checking the
 * contract first, or the tab silently shows a partial list.
 */
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { customerContactRoutes } from "@/cms/store/api/customerContactRoutes";
import type { ApiResponse } from "@/core/types";
import type {
  CustomerContact,
  UpdateCustomerContactInput,
} from "@/cms/types/customerContact";

/**
 * The contract samples quote `custId` on read (`GetIdInput`) and leave it unquoted on write
 * (`"custId": 11111111`), while `Customer.id` is typed `string` throughout this codebase.
 * Coercing only when the value actually looks numeric is correct under either reading.
 *
 * Deliberately the same rule as `customerContactDefault.ts` — the two entities sit under the
 * same contract family and their `custId` samples match.
 */
const toCustId = (customerId: string): number | string => {
  const numeric = Number(customerId);
  return customerId !== "" && Number.isFinite(numeric) ? numeric : customerId;
};

export interface CustomerContactListParams {
  start: number;
  length: number;
}

export const customerContactApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: builder => ({
    /**
     * One page of contacts across the whole organisation.
     *
     * `data` may be an empty array for "no rows" and for "the payload was null" alike — callers
     * validate the shape (`isCustomerContact`), never the truthiness.
     */
    getCustomerContactList: builder.query<ApiResponse<CustomerContact[]>, CustomerContactListParams>({
      query: ({ start, length }) => ({
        url: customerContactRoutes.list(),
        method: "GET",
        params: { start, length },
      }),
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(contact => ({
                type: "CustomerContact" as const,
                id: String(contact.id),
              })),
              { type: "CustomerContact" as const, id: "LIST" },
            ]
          : [{ type: "CustomerContact" as const, id: "LIST" }],
    }),

    getCustomerContactById: builder.query<ApiResponse<CustomerContact>, string>({
      query: id => ({
        url: customerContactRoutes.detail(id),
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "CustomerContact", id }],
    }),

    /**
     * A PATCH that ignores absent keys, so omitting a field the viewer may not edit leaves the
     * stored value alone. Callers build the body from state that still holds the real value —
     * never from the redaction they rendered.
     */
    updateCustomerContact: builder.mutation<ApiResponse<unknown>, UpdateCustomerContactInput>({
      query: ({ id, ...body }) => ({
        url: customerContactRoutes.detail(id),
        method: "PATCH",
        body: { id, ...body, custId: toCustId(String(body.custId)) },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CustomerContact", id },
        { type: "CustomerContact", id: "LIST" },
      ],
    }),
  }),
  // Vite HMR re-runs this module without a full reload, which calls `injectEndpoints` again.
  // Without `overrideExisting` the FIRST definition keeps serving requests, so an edit here
  // appears to have no effect until a manual refresh — see the anti-regression notes.
  overrideExisting: import.meta.env.DEV,
});

export const {
  useGetCustomerContactListQuery,
  useLazyGetCustomerContactListQuery,
  useGetCustomerContactByIdQuery,
  useLazyGetCustomerContactByIdQuery,
  useUpdateCustomerContactMutation,
} = customerContactApi;
