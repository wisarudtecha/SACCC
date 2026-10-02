// Envelope-safe extraction helpers for the incoming-call screen pop.
//
// The customer / case RTK endpoints used by the screen pop
// (`GET /customer/byPhoneNo/{phoneNo}`, `GET /customer/{id}`,
// `GET /case/customer/{customerId}`) answer with the shared `ApiResponse`
// envelope, and `normalizeToApiResponse` in the hybrid base query coerces a
// missing `data` field to `[]` (see CLAUDE.md → "Hybrid REST/GraphQL query
// layer"). Consequence: a resolved "no match" response can carry a
// truthy-but-empty payload — so every extraction here validates the *shape*
// of `data`, never its truthiness.
//
// Pure functions only — no React, no imports beyond this file — so they stay
// unit-testable in the repo's node-environment Vitest setup.

/** The customer fields the screen-pop card actually renders. */
export interface CustomerSummary {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
  photo: string;
}

/** The case fields the screen-pop card's "recent cases" rows render. */
export interface CaseSummary {
  caseId: string;
  statusId: string;
  priority: number;
  receivedDate: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Extracts a customer summary from an `ApiResponse<Customer>` envelope.
 * Returns null for anything that is not a single customer-shaped payload —
 * including the `data: []` an omitted-field response coerces to.
 */
export function extractCustomer(envelope: unknown): CustomerSummary | null {
  if (!isRecord(envelope)) {
    return null;
  }
  const payload = envelope.data;
  if (!isRecord(payload)) {
    return null;
  }
  const id = readString(payload, "id");
  if (id.length === 0) {
    return null;
  }
  return {
    id,
    displayName: readString(payload, "displayName"),
    firstName: readString(payload, "firstName"),
    lastName: readString(payload, "lastName"),
    mobileNo: readString(payload, "mobileNo"),
    email: readString(payload, "email"),
    photo: readString(payload, "photo"),
  };
}

function toCaseSummary(payload: Record<string, unknown>): CaseSummary | null {
  const caseId = readString(payload, "caseId");
  if (caseId.length === 0) {
    return null;
  }
  return {
    caseId,
    statusId: readString(payload, "statusId"),
    priority: readNumber(payload, "priority"),
    receivedDate: readString(payload, "receivedDate"),
  };
}

/**
 * Extracts case summaries from an `ApiResponse<Case[]>` envelope.
 * Entries without a usable `caseId` are skipped; everything else maps with
 * safe defaults. Always returns an array, never null.
 */
export function extractCaseSummaries(envelope: unknown): CaseSummary[] {
  if (!isRecord(envelope)) {
    return [];
  }
  const payload = envelope.data;
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const summary = toCaseSummary(entry);
    return summary ? [summary] : [];
  });
}

/**
 * Picks the cases the card should show: the backend-linked case first (when
 * present), then the rest newest-first by `receivedDate`, capped at `limit`.
 * Missing dates sort last; the input array is never mutated.
 */
export function selectRecentCases(
  cases: CaseSummary[],
  linkedCaseId: string | undefined,
  limit: number
): CaseSummary[] {
  const linked = linkedCaseId
    ? cases.find((item) => item.caseId === linkedCaseId)
    : undefined;
  const rest = cases
    .filter((item) => item.caseId !== linkedCaseId)
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));
  const ordered = linked ? [linked, ...rest] : rest;
  return ordered.slice(0, Math.max(0, limit));
}
