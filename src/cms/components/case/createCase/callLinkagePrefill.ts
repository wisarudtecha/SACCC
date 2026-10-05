// Query-param parsing for the call-linkage prefill on the create-case screen.
//
// The screen pop navigates to `/cms/case/creation?phoneNo=…&customerId=…&
// callId=…&ani=…&callTimestamp=…`; phone/customer are handled inline in
// `createCase.tsx`, this module owns the call-linkage params. Same defensive
// stance as `readPrefillPhoneParam`: a stray or malformed param must never
// seed garbage into the case state — parse, trim, cap, and drop what is not
// usable.
//
// Pure functions only — no React — so they stay unit-testable in the repo's
// node-environment Vitest setup.
import type { CallLinkagePrefill } from "@/cms/types/case";

/** Longest callId accepted — generous; real ids are short external leg ids. */
const CALL_ID_MAX_LENGTH = 100;

/** Longest raw ANI accepted — E.164 plus formatting margin. */
const ANI_MAX_LENGTH = 32;

/** Longest timestamp accepted — ISO 8601 plus margin. */
const TIMESTAMP_MAX_LENGTH = 64;

function readCappedTrimmed(value: string | null, maxLength: number): string {
  return (value ?? "").trim().slice(0, maxLength);
}

/**
 * Extracts the call-linkage prefill from the create-case URL's query params.
 * Returns null when there is no usable `callId` — the linkage is keyed on the
 * call leg, so an ANI or timestamp alone identifies nothing. `ani` and
 * `callTimestamp` are kept only when non-empty (ANI) / parseable as a date
 * (timestamp).
 */
export function readCallLinkagePrefill(
  searchParams: URLSearchParams
): CallLinkagePrefill | null {
  const callId = readCappedTrimmed(searchParams.get("callId"), CALL_ID_MAX_LENGTH);
  if (callId.length === 0) {
    return null;
  }
  const prefill: CallLinkagePrefill = { callId };

  const ani = readCappedTrimmed(searchParams.get("ani"), ANI_MAX_LENGTH);
  if (ani.length > 0) {
    prefill.ani = ani;
  }

  const callTimestamp = readCappedTrimmed(
    searchParams.get("callTimestamp"),
    TIMESTAMP_MAX_LENGTH
  );
  // Only accept values that parse as dates; anything else is dropped rather
  // than stored as a decorative string.
  if (callTimestamp.length > 0 && !Number.isNaN(Date.parse(callTimestamp))) {
    prefill.callTimestamp = callTimestamp;
  }

  return prefill;
}
