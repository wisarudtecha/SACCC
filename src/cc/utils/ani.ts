// Thai caller-number (ANI) normalization for the incoming-call screen pop.
//
// 3CX (and most PBXs) deliver the caller number in whatever form the trunk
// provides: E.164 (`+66811223344`), international prefix (`0066…`), bare
// country code (`66…`), national (`0811223344`), or a 9-digit mobile without
// the trunk `0`. Customer records in this app store `mobileNo` in national
// form (see `custommerApi.ts` / create-case prefill usage), so every lookup
// needs one canonical form plus the variants worth trying.
//
// Pure functions only — no React, no imports beyond this file — so they stay
// unit-testable in the repo's node-environment Vitest setup.

/** One caller number in every form the screen pop needs. */
export interface AniNormalization {
  /** Original input, trimmed only. */
  raw: string;
  /** All digits extracted from the input, pre-normalization (`66811223344`). */
  digits: string;
  /** Thai national form with a leading `0` when recognizable, else the digits as-is. */
  national: string;
  /** `+66…` when the national form is Thai-shaped (9-10 digits, leading 0), else null. */
  e164: string | null;
}

/** Lengths a Thai national number can take: 9 (landline) or 10 (mobile). */
const THAI_NATIONAL_LENGTHS: readonly number[] = [9, 10];

/** All digits in the input, in order — shared with the dial-destination validator. */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, "");
}

function toE164(national: string): string | null {
  if (!national.startsWith("0") || !THAI_NATIONAL_LENGTHS.includes(national.length)) {
    return null;
  }
  return `+66${national.slice(1)}`;
}

/**
 * Normalizes a raw caller number (ANI) to Thai national form.
 *
 * Rules, in order: trim; drop everything that is not a digit; strip a leading
 * `+`/`00` international prefix; turn a `66` country-code prefix into the
 * trunk `0`; prepend `0` to a 9-digit mobile (8/9 prefix); anything else
 * (short codes, extensions) passes through untouched with a null `e164`.
 * Returns null when the input holds no digits at all.
 */
export function normalizeThaiAni(raw: string): AniNormalization | null {
  const trimmed = raw.trim();
  let digits = extractDigits(trimmed);
  if (digits.length === 0) {
    return null;
  }

  // Strip the international dialing prefix: "0066…" -> "66…" (the "+" form
  // already lost its non-digits above).
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Country-code form "66…" -> national "0…".
  if (digits.startsWith("66")) {
    digits = `0${digits.slice(2)}`;
  }

  // 9-digit mobile without the trunk 0 ("811223344") -> "0811223344".
  if (digits.length === 9 && (digits.startsWith("8") || digits.startsWith("9"))) {
    digits = `0${digits}`;
  }

  return {
    raw: trimmed,
    digits: extractDigits(trimmed),
    national: digits,
    e164: toE164(digits),
  };
}

/**
 * Ordered, deduped phone variants to try against `/customer/byPhoneNo`.
 * National form first (how this app stores `mobileNo`), then E.164, then the
 * raw digits — at most three lookups per incoming call.
 */
export function aniLookupVariants(ani: AniNormalization): string[] {
  const candidates = [ani.national, ani.e164, ani.digits];
  return candidates.filter(
    (variant, index): variant is string =>
      typeof variant === "string" && variant.length > 0 && candidates.indexOf(variant) === index
  );
}
