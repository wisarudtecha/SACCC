// Email workspace domain types (FE / BFF) — FE-10
// `docs/task-breakdown.md` §FE-10
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Full wire-level contract is pending backend task BE-09. These types + guards
// are what the UI consumes; keep them in sync when the contract lands.
//
// Sharp edges encoded here:
// - `normalizeToApiResponse` coerces an absent `data` to `[]`, and
//   `Boolean([]) === true` — callers MUST validate the payload's *shape* via
//   `isEmailInboxResponse`, never its truthiness.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailTab = "inbox" | "sent" | "archive";

/** One attachment on an email message. */
export interface EmailAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

/** One item in the inbox list (lightweight preview). */
export interface EmailInboxItem {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  folder: EmailTab;
  attachmentCount: number;
  starred?: boolean;
}

/** Full email message detail (reading pane). */
export interface EmailMessage {
  id: string;
  from: string;
  fromName?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  time: string;
  unread: boolean;
  folder: EmailTab;
  attachments: EmailAttachment[];
  starred?: boolean;
}

/** Inbox list payload returned by `GET /email/inbox`. */
export interface EmailInboxResponse {
  threads: EmailInboxItem[];
}

/** AI suggestion returned by `POST /email/ai-suggest`. */
export interface AiSuggestion {
  text: string;
  tool?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape guards (defensive by design, never throw — same style as callEvents.ts)
// ─────────────────────────────────────────────────────────────────────────────

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isEmailTab(value: unknown): value is EmailTab {
  return value === "inbox" || value === "sent" || value === "archive";
}

function isEmailAttachment(value: unknown): value is EmailAttachment {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.filename) &&
    isNonEmptyString(candidate.url) &&
    isFiniteNumber(candidate.size) &&
    isNonEmptyString(candidate.mimeType)
  );
}

export function isEmailInboxItem(value: unknown): value is EmailInboxItem {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.from) &&
    isOptionalString(candidate.fromName) &&
    isNonEmptyString(candidate.subject) &&
    isNonEmptyString(candidate.preview) &&
    isNonEmptyString(candidate.time) &&
    isBoolean(candidate.unread) &&
    isEmailTab(candidate.folder) &&
    isFiniteNumber(candidate.attachmentCount)
  );
}

export function isEmailMessage(value: unknown): value is EmailMessage {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.from) &&
    isOptionalString(candidate.fromName) &&
    isStringArray(candidate.to) &&
    isStringArray(candidate.cc) &&
    isStringArray(candidate.bcc) &&
    isNonEmptyString(candidate.subject) &&
    isNonEmptyString(candidate.body) &&
    isNonEmptyString(candidate.time) &&
    isBoolean(candidate.unread) &&
    isEmailTab(candidate.folder) &&
    Array.isArray(candidate.attachments) &&
    candidate.attachments.every(isEmailAttachment)
  );
}

function isRecordArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function isEmailInboxResponse(
  value: unknown
): value is EmailInboxResponse {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    Array.isArray(candidate.threads) &&
    isRecordArray(candidate.threads, isEmailInboxItem)
  );
}

export function isAiSuggestion(value: unknown): value is AiSuggestion {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.text) &&
    isOptionalString(candidate.tool)
  );
}

/**
 * Extracts a valid inbox response from a raw `ApiResponse`-shaped response,
 * or null when the envelope resolved but carries no usable data.
 */
export function extractEmailInbox(
  response: unknown
): EmailInboxResponse | null {
  const candidate = toRecord(response);
  if (candidate === null) {
    return null;
  }
  return isEmailInboxResponse(candidate.data) ? candidate.data : null;
}

/**
 * Extracts a valid email message from a raw `ApiResponse`-shaped response,
 * or null when the envelope resolved but carries no usable data.
 */
export function extractEmailMessage(
  response: unknown
): EmailMessage | null {
  const candidate = toRecord(response);
  if (candidate === null) {
    return null;
  }
  return isEmailMessage(candidate.data) ? candidate.data : null;
}
