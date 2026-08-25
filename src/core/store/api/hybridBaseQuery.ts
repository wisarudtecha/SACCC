// src/core/store/api/hybridBaseQuery.ts
import { BaseQueryFn, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithAuth } from "@/core/store/api/baseQueryFactory";
import { graphqlBaseQuery } from "@/core/store/api/graphqlBaseQuery";
import { buildGraphQLQuery } from "@/core/utils/gqlMapper";
import { containsFile, normalizeToApiResponse } from "@/core/utils/gqlUtils";
import { readEnvelopeMessage, readEnvelopeStatus } from "@/core/utils/apiResponseStatus";
import { TokenManager } from "@/core/utils/tokenManager";
import type { EnvelopeLike } from "@/core/utils/apiResponseStatus";
import type { RootState } from "@/core/store";

// v2.0 - Simplified version with auto-mapping and global switch
type HybridArgs = string | FetchArgs;

// v1.0 - More complex version with explicit GQL type and REST fallback
// type GraphQLArgs = {
//   type: "GQL";
//   document: string;
//   variables?: Record<string, unknown>;
//   fallback?: string | FetchArgs; // REST fallback (optional)
// };

// v1.0 - Initial version with explicit type and fallback
// type HybridArgs =
//   | string
//   | (FetchArgs & { type?: "REST" })
//   | GraphQLArgs;

// v1.0 - Initial version with explicit type
// const isGqlArgs = (args: unknown): args is { type: string } => {
//   return (typeof args === "object" && args !== null && "type" in args) || typeof args === "string";
// }

/** Drops the query string, which on lookup endpoints carries the value being searched for. */
const stripQueryString = (url: string | undefined): string => (url ?? "").split("?")[0];

/**
 * A business failure the BFF reports with HTTP 200.
 *
 * The BFF answers a rejected operation with `{ status: "-1", msg: "...", data: null }` and no
 * transport error, so without this the request FULFILS and `.unwrap()` resolves. Worse,
 * `normalizeToApiResponse` coerces `data: extracted?.data ?? []`, so the payload is even truthy -
 * which is how a `Boolean(response.data)` check downstream reads a failure as an empty success.
 * Translating it once here is the consolidation `src/core/utils/apiResponseStatus.ts` was
 * written to seed.
 *
 * Only a *conclusive* failure converts. `readEnvelopeStatus` reports "unknown" for the number
 * -1 (which `normalizeToApiResponse` itself substitutes when the server omits `status`), for the
 * empty string, and for any unrecognised token - all of which stay fulfilled, so every endpoint
 * that simply does not return the field behaves exactly as it did before.
 *
 * The envelope rides along in `data` because that is where `resolveApiError` and
 * `readMutationError` already look for the server's own wording.
 */
const readEnvelopeFailure = (
  envelope: unknown,
  // args: FetchArgs
): FetchBaseQueryError | null => {
  const record = (envelope && typeof envelope === "object")
    ? envelope as EnvelopeLike
    : undefined;

  if (!record || readEnvelopeStatus(record.status) !== "failure") {
    return null;
  }

  const message = readEnvelopeMessage(record);
  // Status and message only, and the path without its query string - the same restraint as
  // summariseGraphQLFailure below, and for the same reason.
  // console.error(
  //   `API reported a failure for ${args.method || "GET"} ${stripQueryString(args.url)}:`,
  //   { status: record.status, message }
  // );

  return {
    status: "ENVELOPE_ERROR",
    data: record,
    error: message || "The server rejected the request",
  } as unknown as FetchBaseQueryError;
};

/**
 * Reduces a failed GraphQL call to what is useful in a console and nothing more.
 *
 * Deliberately narrow: a `FetchBaseQueryError` carries the whole response body in `data`,
 * and each entry of a GraphQL `errors` array routinely quotes the offending input value in
 * its own message-adjacent fields. Only the status, the error code and the message text
 * survive — never the payload, never the variables.
 */
const summariseGraphQLFailure = (
  error: unknown,
  graphqlErrors: unknown[] | undefined
): Record<string, unknown> => {
  if (error) {
    const { status, error: errorText } = error as { status?: unknown; error?: unknown };
    return {
      status,
      message: typeof errorText === "string" ? errorText : undefined,
    };
  }

  return {
    errorCount: graphqlErrors?.length ?? 0,
    messages: (graphqlErrors ?? []).map(entry => {
      const { message, extensions } = (entry ?? {}) as {
        message?: unknown;
        extensions?: { code?: unknown };
      };
      return {
        message: typeof message === "string" ? message : "Unknown GraphQL error",
        code: extensions?.code,
      };
    }),
  };
};

export const createHybridBaseQuery = (restBaseUrl: string, gqlBaseUrl: string): BaseQueryFn<HybridArgs, unknown, FetchBaseQueryError> => {
  const restQuery = createBaseQueryWithAuth(restBaseUrl);

  const gqlQuery = fetchBaseQuery({
    baseUrl: gqlBaseUrl,
    method: "POST",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token || TokenManager.getToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Content-Type", "application/json");

      return headers;
    }
  });

  // File uploads carry a File/Blob inside `variables` - fetchBaseQuery would
  // JSON.stringify (and lose) it, so route those through a multipart-capable query instead.
  const gqlUploadQuery = graphqlBaseQuery(gqlBaseUrl);

  // v2.0 - Simplified version with auto-mapping and global switch
  return async (args, api, extraOptions) => {
    // Normalize args → FetchArgs
    let finalArgs: FetchArgs;

    if (typeof args === "string") {
      finalArgs = { url: args, method: "GET" };
    }
    else {
      finalArgs = args;
    }

    // =========================
    // SWITCH TRANSPORT (GLOBAL)
    // =========================
    if (import.meta.env.VITE_USE_GRAPHQL !== "true") {
      const result = await restQuery(finalArgs, api, extraOptions);
      if (result.error) {
        return { error: result.error, meta: result.meta };
      }
      const envelope = normalizeToApiResponse(result.data as Record<string, unknown>);
      const failure = readEnvelopeFailure(
        envelope,
        // finalArgs
      );
      if (failure) {
        return { error: failure, meta: result.meta };
      }
      return { data: envelope, meta: result.meta };
    }

    // =========================
    // AUTO MAP REST → GQL
    // =========================
    const gqlBody = buildGraphQLQuery(finalArgs);
    // console.log("🚀 ~ createHybridBaseQuery ~ gqlBody:", gqlBody);

    // No REST fallback: a missing GraphQL mapping is a hard error, not a silent REST retry.
    if (!gqlBody) {
      // Path only — the query string carries lookup values (a citizenId or phone number on
      // the customer search endpoints), and the console is not a place to put them.
      console.error(`No GraphQL mapping found for ${finalArgs.method || "GET"} ${stripQueryString(finalArgs.url)}`);
      return {
        error: {
          status: "CUSTOM_ERROR",
          error: `No GraphQL mapping found for ${finalArgs.method || "GET"} ${finalArgs.url}`,
        } as FetchBaseQueryError,
      };
    }

    const isUpload = containsFile(gqlBody.variables);

    // GraphQL
    const gqlResult = isUpload
      ? await gqlUploadQuery(
          { body: gqlBody.query, variables: gqlBody.variables },
          api,
          extraOptions
        )
      : await gqlQuery(
          {
            url: "",
            method: "POST",
            body: gqlBody,
          },
          api,
          extraOptions
        );
    // console.log("🚀 ~ createHybridBaseQuery ~ gqlResult:", gqlResult);

    // Handle GraphQL errors - no REST fallback: log and return the error directly.
    if (gqlResult.error || (gqlResult.data as { errors?: unknown[] })?.errors) {
      // Messages and codes only. The raw error object carries the response body, and a
      // GraphQL `errors` entry commonly echoes the input variables back verbatim — both
      // would put customer data in the console.
      console.error(
        `GraphQL request failed for ${finalArgs.method || "GET"} ${stripQueryString(finalArgs.url)}:`,
        summariseGraphQLFailure(gqlResult.error, (gqlResult.data as { errors?: unknown[] })?.errors)
      );
      return {
        error: (gqlResult.error ?? {
          status: "CUSTOM_ERROR",
          error: "GraphQL response contained errors",
          data: (gqlResult.data as { errors?: unknown[] })?.errors,
        }) as FetchBaseQueryError,
        meta: gqlResult.meta,
      };
    }

    // gqlQuery (fetchBaseQuery) returns the raw envelope ({ data: {...} }),
    // but gqlUploadQuery (graphqlBaseQuery) already unwraps one level to just {...} -
    // re-wrap it so normalizeToApiResponse's envelope-unwrapping sees the same shape either way.
    const gqlData = isUpload ? { data: gqlResult.data } : gqlResult.data;

    const envelope = normalizeToApiResponse(gqlData as Record<string, unknown>);
    const failure = readEnvelopeFailure(
      envelope,
      // finalArgs
    );
    if (failure) {
      return { error: failure, meta: gqlResult.meta };
    }

    return { data: envelope, meta: gqlResult.meta };
  };

  // v1.0 - Initial version with explicit type and fallback
  // return async (args, api, extraOptions) => {
  //   // string → REST
  //   if (typeof args === "string") {
  //     return restQuery({ url: args, method: "GET" }, api, extraOptions);
  //   }
  //   // REST object
  //   if (!isGqlArgs(args) || args.type !== "GQL") {
  //     return restQuery(args as FetchArgs, api, extraOptions);
  //   }
  //   // GraphQL
  //   const gqlResult = await gqlQuery(
  //     {
  //       url: "",
  //       method: "POST",
  //       body: {
  //         query: args.document,
  //         variables: args.variables,
  //       },
  //     },
  //     api,
  //     extraOptions
  //   );
  //   // Handle GraphQL errors
  //   if (gqlResult.error || (gqlResult.data as { errors?: unknown[] })?.errors) {
  //     console.warn("GraphQL failed, fallback to REST");
  //     if (args.fallback) {
  //       if (typeof args.fallback === "string") {
  //         return restQuery(
  //           {
  //             url: args.fallback,
  //             method: "GET"
  //           },
  //           api,
  //           extraOptions
  //         );
  //       }
  //       return restQuery(args.fallback, api, extraOptions);
  //     }
  //     return gqlResult;
  //   };
  // };
};
