// src/cms/store/api/customerSocial.ts
/**
 * Customer social identities — REST-shaped RTK Query endpoints.
 *
 * Injected into `baseWelcomeCrmApi`, the slice that already owns `/customer`
 * (`custommerApi.ts`), `/customer_notes` (`customerNote.ts`) and `/customer_service`,
 * so these inherit the same base URL, auth header and hybrid REST/GraphQL routing.
 *
 * URLs come from `customerSocialRoutes` rather than being written inline — the GraphQL
 * map keys derive from the same file, and the two must not drift.
 *
 * Create, update and delete answer with `{ status, msg, desc }` and no payload (see
 * `customerSocialCURL.sh`), so there is nothing to merge into the cache by hand: every
 * mutation invalidates the tag and the list refetches.
 *
 * IMPORTANT — the list takes `start`/`length` and nothing else. There is no `custId`
 * filter and no search. Callers must not reach for this endpoint directly to answer
 * "what are this customer's channels?"; that question belongs to `useCustomerSocials`,
 * which owns the scan and is the one place to change if filtering is ever added.
 */
import { baseWelcomeCrmApi } from "@/core/store/api/baseApi";
import { customerSocialRoutes } from "@/cms/store/api/customerSocialRoutes";
import type { ApiResponse } from "@/core/types";
import type {
  CreateCustomerSocialInput,
  CustomerSocial,
  CustomerSocialListParams,
  DeleteCustomerSocialInput,
  UpdateCustomerSocialInput,
} from "@/cms/types/customerSocial";

/**
 * `custId` is sent as a string, deliberately.
 *
 * `customerNote.ts` coerces the same-named field to a number via `toCustId`, because the
 * note samples show it unquoted. The social samples quote it on both read and write
 * (`"custId": "1"`), so the schema wants a `String` here and coercing would bind the
 * wrong GraphQL type. `normalizeObject` (`gqlUtils.ts`) leaves strings alone apart from
 * "true"/"false", so what is written here is what goes on the wire.
 */
const toCustId = (customerId: string): string => String(customerId);

export const customerSocialApi = baseWelcomeCrmApi.injectEndpoints({
  endpoints: builder => ({

    customerSocialList: builder.query<ApiResponse<CustomerSocial[]>, CustomerSocialListParams>({
      query: params => ({
        url: customerSocialRoutes.list(),
        method: "GET",
        params,
      }),
      providesTags: ["CustomerSocial"],
    }),

    /**
     * `unknown` payload on purpose: the backend returns no `data` for writes, and
     * declaring a shape it doesn't send would be a lie the compiler then enforces.
     * `readSocialVerdict` (`customerSocial.policy.ts`) decides success from the envelope.
     */
    createCustomerSocial: builder.mutation<ApiResponse<unknown>, CreateCustomerSocialInput>({
      query: ({ customerId, socialType, socialId, socialName, imgUrl }) => ({
        url: customerSocialRoutes.create(),
        method: "POST",
        body: {
          custId: toCustId(customerId),
          socialType,
          socialId,
          socialName,
          imgUrl,
        },
      }),
      invalidatesTags: ["CustomerSocial"],
    }),

    updateCustomerSocial: builder.mutation<ApiResponse<unknown>, UpdateCustomerSocialInput>({
      query: ({ id, customerId, socialType, socialId, socialName, imgUrl }) => ({
        url: customerSocialRoutes.detail(id),
        method: "PATCH",
        body: {
          id,
          custId: toCustId(customerId),
          socialType,
          socialId,
          socialName,
          imgUrl,
        },
      }),
      invalidatesTags: ["CustomerSocial"],
    }),

    deleteCustomerSocial: builder.mutation<ApiResponse<unknown>, DeleteCustomerSocialInput>({
      query: ({ id }) => ({
        url: customerSocialRoutes.detail(id),
        method: "DELETE",
      }),
      invalidatesTags: ["CustomerSocial"],
    }),
  }),
});

export const {
  useCustomerSocialListQuery,
  useLazyCustomerSocialListQuery,
  useCreateCustomerSocialMutation,
  useUpdateCustomerSocialMutation,
  useDeleteCustomerSocialMutation,
} = customerSocialApi;
