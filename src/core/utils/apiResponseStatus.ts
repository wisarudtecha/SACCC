// src/core/utils/apiResponseStatus.ts
/**
 * Deciding whether an API call actually succeeded.
 *
 * `status` is inconsistent across this codebase — it is *declared* `boolean | undefined` on
 * `ApiResponse`, but existing pages test it as a string (`ProductStock.tsx` requires a string
 * !== "-1") or as a bare truthy value (`SkillManagement.tsx`), and `normalizeToApiResponse`
 * defaults it to the number -1. Those checks disagree with each other. Hence `unknown` in,
 * and a three-state outcome out.
 *
 * The consolidation this module was written to seed has since happened: `readEnvelopeStatus`
 * is now called by `hybridBaseQuery`, which turns a *conclusive* business failure — the BFF
 * answering HTTP 200 with `{ status: "-1", msg: "...", data: null }` — into a real RTK error,
 * so `.unwrap()` rejects and a query reports `isError`. What still reaches callers fulfilled
 * is the INCONCLUSIVE case: `readEnvelopeStatus` reports "unknown" for the number -1 (which
 * `normalizeToApiResponse` itself substitutes when the server omits `status`), for the empty
 * string, and for unrecognised tokens. That was left resolving on purpose — every endpoint
 * that simply does not return the field would otherwise start failing.
 *
 * So the payload check below still earns its place: `normalizeToApiResponse` coerces
 * `data: extracted?.data ?? []`, and `Boolean([])` is true, so an inconclusive envelope still
 * arrives carrying a truthy-but-empty payload. Read the shape, not the truthiness.
 */

export type ApiOutcome = "success" | "failure" | "unknown";

/** Structural shape, so an `ApiResponse<T>` assigns without a cast despite `status: boolean`. */
export interface EnvelopeLike {
  status?: unknown;
  msg?: unknown;
  message?: unknown;
  desc?: unknown;
  data?: unknown;
}

const SUCCESS_TOKENS = ["true", "0", "ok", "success", "succeeded"];
const FAILURE_TOKENS = ["false", "-1", "error", "fail", "failed"];

/**
 * The number -1 maps to "unknown", NOT "failure": it is the value `normalizeToApiResponse`
 * substitutes when the server omitted `status` entirely. Reading it as failure would make
 * every mutation look broken against a BFF that simply doesn't return the field.
 */
export const readEnvelopeStatus = (status: unknown): ApiOutcome => {
  if (status === true) {
    return "success";
  }
  if (status === false) {
    return "failure";
  }

  if (typeof status === "number") {
    if (status === -1) {
      return "unknown";
    }
    return status === 0 ? "success" : "failure";
  }

  if (typeof status === "string") {
    const token = status.trim().toLowerCase();
    if (token === "") {
      return "unknown";
    }
    if (SUCCESS_TOKENS.includes(token)) {
      return "success";
    }
    if (FAILURE_TOKENS.includes(token)) {
      return "failure";
    }
    return "unknown";
  }

  return "unknown";
};

const firstNonEmptyString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate;
    }
  }
  return "";
};

/** The server's own wording for a result, for use in a toast. Empty when it said nothing. */
export const readEnvelopeMessage = (response: EnvelopeLike | null | undefined): string =>
  firstNonEmptyString(response?.message, response?.desc, response?.msg);

/**
 * The error-message fallback chain used across CMS pages (message -> desc -> msg -> stringified).
 * All the unavoidable casting around RTK's `unknown` error shape is contained here.
 */
export const readMutationError = (error: unknown): string => {
  const data = (error as { data?: EnvelopeLike } | undefined)?.data;
  const fromEnvelope = readEnvelopeMessage(data);
  if (fromEnvelope) {
    return fromEnvelope;
  }

  // graphqlBaseQuery (upload path) uses a different shape again: { status, errors } / { status, message }.
  const direct = firstNonEmptyString(
    (error as { message?: unknown } | undefined)?.message,
    (error as { error?: unknown } | undefined)?.error
  );
  if (direct) {
    return direct;
  }

  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Whether a delete succeeded.
 *
 * Deletes carry no entity to inspect — `normalizeToApiResponse` coerces `data` to `[]`
 * either way — so the envelope's own status is the only signal, and an inconclusive
 * status has to be read as "probably fine" rather than a failure (many BFF operations
 * here omit the field entirely).
 *
 * Note this is the opposite bias to `readEntityVerdict` below, and deliberately so: for a
 * create/update a false success destroys the user's unsaved work, whereas for a delete a
 * false failure prompts a pointless retry of an already-idempotent operation.
 */
export const readDeleteOutcome = (response: EnvelopeLike | null | undefined): boolean =>
  readEnvelopeStatus(response?.status) !== "failure";

export interface EntityVerdict<T> {
  ok: boolean;
  outcome: ApiOutcome;
  message: string;
  entity?: T;
}

/**
 * Decide a create/update result from TWO signals rather than one.
 *
 * When `status` is conclusive we trust it. When it isn't, we fall back to the payload shape,
 * which is a genuinely strong signal here: because `normalizeToApiResponse` turns a null/absent
 * payload into `[]`, a well-formed entity object can only be present if the server actually
 * returned one. So `data === []` is a real negative, not an ambiguity.
 *
 * The bias is deliberate: only report success on positive evidence. A false failure costs the
 * user a retry (idempotent for an update; a visible, deletable duplicate for a create). A false
 * success clears the dirty flag and destroys their work while telling them it is safe.
 */
export const readEntityVerdict = <T>(
  response: EnvelopeLike | null | undefined,
  isEntity: (value: unknown) => value is T
): EntityVerdict<T> => {
  const outcome = readEnvelopeStatus(response?.status);
  const message = readEnvelopeMessage(response);
  const entity = isEntity(response?.data) ? response?.data : undefined;

  if (outcome === "failure") {
    return { ok: false, outcome, message };
  }

  if (outcome === "success") {
    return { ok: true, outcome, message, entity };
  }

  // Inconclusive status: let the payload decide.
  return { ok: entity !== undefined, outcome, message, entity };
};
