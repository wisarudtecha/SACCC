// Dial-destination validation for the softphone dialpad (`/cc/softphone`) —
// actual-calling plan FE-1.2, BRD FR-07 click-to-call.
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Wire-level contract (request/response envelope, outbound event sequence,
// test vectors, open questions): docs/Make-Call-Command-Contract.md — keep
// this file and that document in sync when the contract changes.
//
// The FE sends the destination exactly as the agent entered it (trimmed) — it
// does NOT normalize to E.164/national form. Which canonical form the adapter
// requires is the contract's open question Q10; client-side rewriting caused
// lookup drift before (see ani.ts).
//
// Pure functions only — no React — so they stay unit-testable in the repo's
// node-environment Vitest setup.
// ─────────────────────────────────────────────────────────────────────────────

import { extractDigits } from "./ani";

/** Separator characters allowed between significant characters, for readability only. */
const SEPARATOR_CHARS = " -().";

/**
 * Upper bound on significant characters (digits + `*` + `#`). E.164 caps
 * numbers at 15 digits; the looser bound covers DTMF service codes such as
 * `*121#`. The backend adapter is the real validator (contract §5).
 */
export const MAX_SIGNIFICANT_CHARS = 20;

/** Why a dial destination was rejected (contract §6). */
export type DialDestinationRejectionReason =
  | "empty"
  | "invalid"
  | "too_long";

/** Result of validating a raw dialpad input. */
export type DialDestinationValidation =
  | { ok: true; destination: string }
  | { ok: false; reason: DialDestinationRejectionReason };

function isSignificantChar(char: string): boolean {
  return /\d/.test(char) || char === "*" || char === "#";
}

/**
 * Validates a dial destination: non-empty after trim; digits, `*`, `#`, an
 * optional single leading `+`, and separators (space, `-`, `(`, `)`, `.`) only;
 * 1–20 significant characters. The `ok` branch carries the trimmed input
 * verbatim — that string is what the command request sends (contract §3.1).
 */
export function validateDialDestination(
  input: string
): DialDestinationValidation {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const chars = [...trimmed];
  let significant = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    if (isSignificantChar(char)) {
      significant += 1;
      continue;
    }
    if (char === "+" && index === 0) {
      continue;
    }
    if (SEPARATOR_CHARS.includes(char)) {
      continue;
    }
    return { ok: false, reason: "invalid" };
  }

  if (significant === 0) {
    // A bare "+" or separators only — nothing dialable.
    return { ok: false, reason: "invalid" };
  }
  if (significant > MAX_SIGNIFICANT_CHARS) {
    return { ok: false, reason: "too_long" };
  }

  return { ok: true, destination: trimmed };
}

/**
 * i18n key for a rejection reason, or null when the destination is valid.
 */
export function dialDestinationErrorKey(
  reason: DialDestinationRejectionReason
): string {
  switch (reason) {
    case "empty":
      return "cc.softphone.dialpad_invalid_empty";
    case "invalid":
      return "cc.softphone.dialpad_invalid_chars";
    case "too_long":
      return "cc.softphone.dialpad_invalid_length";
  }
}

/**
 * Digits-only rendering of a destination for status display ("081 122-3344"
 * → "0811223344"). Reuses the ANI digit extraction — same primitive, no
 * parallel implementation.
 */
export function dialDestinationDigits(destination: string): string {
  return extractDigits(destination);
}
