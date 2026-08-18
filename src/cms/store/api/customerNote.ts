// src/cms/store/api/customerNote.ts
/**
 * Internal customer notes — REST-shaped RTK Query endpoints.
 *
 * Injected into `baseWelcomeCrmApi`, the slice that already owns `/customer`
 * (`custommerApi.ts`) and `/customer_service` (`customerService.ts`), so notes
 * inherit the same base URL, auth header and hybrid REST/GraphQL routing.
 *
 * URLs come from `customerNoteRoutes` rather than being written inline — the
 * GraphQL map keys are derived from the same file, and the two must not drift.
 *
 * Create, update and delete all answer with `{ status, msg, desc }` and no payload
 * (see `customerNoteCURL.sh`), so there is nothing to merge into the cache by hand:
 * every mutation invalidates the tag and the list refetches.
 */
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { customerNoteRoutes } from "@/cms/store/api/customerNoteRoutes";
import type { ApiResponse } from "@/core/types";
import type {
  CreateCustomerNoteInput,
  CustomerNote,
  CustomerNoteListParams,
  DeleteCustomerNoteInput,
  UpdateCustomerNoteInput,
} from "@/cms/types/customerNote";

/**
 * The backend samples show `custId` as an integer while `Customer.id` is typed
 * `string` throughout this codebase, and the two have never been reconciled. Coercing
 * only when the value actually looks numeric is correct under either reading: a
 * numeric PK is sent as a number (which `normalizeObject` leaves untouched, so the
 * GraphQL `Int` binds), and anything else is passed through unchanged rather than
 * being turned into `NaN`.
 */
const toCustId = (customerId: string): number | string => {
  const numeric = Number(customerId);
  return customerId !== "" && Number.isFinite(numeric) ? numeric : customerId;
};

/**
 * The stream reads newest-first. The contract doesn't enumerate sortable columns, so
 * this assumes the entity's own `createdAt` is one — worth confirming in the first
 * smoke test against a real environment.
 */
const DEFAULT_ORDER_BY = "createdAt";
const DEFAULT_DIRECTION = "DESC";

export const customerNoteApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: builder => ({

    customerNoteList: builder.query<ApiResponse<CustomerNote[]>, CustomerNoteListParams>({
      query: ({ customerId, orderBy, direction, ...params }) => ({
        url: customerNoteRoutes.list(),
        method: "GET",
        params: {
          ...params,
          custId: toCustId(customerId),
          orderBy: orderBy || DEFAULT_ORDER_BY,
          direction: direction || DEFAULT_DIRECTION,
        },
      }),
      providesTags: ["CustomerNote"],
    }),

    /**
     * `unknown` payload on purpose: the backend returns no `data` for writes, and
     * declaring a shape it doesn't send would be a lie the compiler then enforces.
     * `readNoteVerdict` (`customerNote.policy.ts`) decides success from the envelope.
     */
    createCustomerNote: builder.mutation<ApiResponse<unknown>, CreateCustomerNoteInput>({
      query: ({ customerId, note }) => ({
        url: customerNoteRoutes.create(),
        method: "POST",
        body: { custId: toCustId(customerId), note },
      }),
      invalidatesTags: ["CustomerNote"],
    }),

    updateCustomerNote: builder.mutation<ApiResponse<unknown>, UpdateCustomerNoteInput>({
      query: ({ customerId, id, note }) => ({
        url: customerNoteRoutes.detail(id),
        method: "PATCH",
        body: { id, custId: toCustId(customerId), note },
      }),
      invalidatesTags: ["CustomerNote"],
    }),

    deleteCustomerNote: builder.mutation<ApiResponse<unknown>, DeleteCustomerNoteInput>({
      query: ({ id }) => ({
        url: customerNoteRoutes.detail(id),
        method: "DELETE",
      }),
      invalidatesTags: ["CustomerNote"],
    }),
  }),
});

export const {
  useCustomerNoteListQuery,
  useLazyCustomerNoteListQuery,
  useCreateCustomerNoteMutation,
  useUpdateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
} = customerNoteApi;
