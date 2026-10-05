// Call-center dashboard KPI domain types (FE / BFF) — remaining-scope plan
// Phase E2, `docs/3CX-FE-Development-Plan-Remaining-Scope.md`.
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Full wire-level contract (endpoint, field semantics, empty snapshot, test
// vectors, open questions Q1–Q10): docs/CC-Dashboard-KPI-Contract.md — keep
// this file and that document in sync when the contract changes.
//
// The endpoint does not exist on the BFF yet. The API slice
// (`src/cc/store/api/callCenterDashboardApi.ts`) is dormant by design until
// sign-off; these types + guards are what the UI (plan item E3) will consume.
//
// Sharp edges encoded here (contract §5/§6):
// - `normalizeToApiResponse` coerces an absent `data` to `[]`, and
//   `Boolean([]) === true` — callers MUST validate the payload's *shape* via
//   `isCallCenterDashboardSnapshot`, never its truthiness.
// - Optional fields ("no data yet": satisfaction, delta, efficiency) are
//   OMITTED by the backend, never `null`/`0` — zero and "no data" are
//   distinct UI states ("0%" vs "—"). The guards therefore REJECT `null`
//   optionals, mirroring `callEvents.ts`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Top KPI cards (contract §4.1). All calculation is backend-owned; the FE
 * renders finished numbers only.
 */
export interface CallCenterDashboardSummary {
  /** All inbound calls received in the period — answered + abandoned + missed. */
  totalCalls: number;
  /** Calls an agent actually answered. */
  answeredCalls: number;
  /** `answeredCalls / totalCalls × 100`, 1 decimal. */
  answeredRatePct: number;
  /** `totalTalkTime / answeredCalls`, whole seconds. FE formats as `12m 34s`. */
  avgDurationSeconds: number;
  /** CSAT %, 1 decimal. OMITTED while no CSAT capture mechanism exists (Q2). */
  satisfactionPct?: number;
  /** Change vs. the previous period, 1 decimal, may be negative. Omitted when unknown (Q1). */
  totalCallsDeltaPct?: number;
}

/** One point of the Daily Call Volume line chart; gap between series = abandoned. */
export interface CallCenterDailyVolumePoint {
  /** ISO date `YYYY-MM-DD` within `period` (Asia/Bangkok boundaries — Q6). */
  date: string;
  totalCalls: number;
  answeredCalls: number;
}

/** One slice of the Call Type Distribution pie chart. */
export interface CallCenterCallTypeSlice {
  /** Stable machine key (vocabulary pending contract Q4). */
  typeKey: string;
  /** Backend default display label; FE i18n may override by `typeKey` later. */
  label?: string;
  count: number;
}

/** One agent's bars in the Agent Performance chart. */
export interface CallCenterAgentPerformance {
  /** Same id space as the lifecycle events' `agentId`. */
  agentId: string;
  agentName: string;
  callsHandled: number;
  /** `(productive time / logged-in time) × 100` — exact formula pending Q3. */
  efficiencyPct?: number;
  /** Agent-level average CSAT. Omitted while CSAT is unavailable (Q2). */
  satisfactionPct?: number;
}

/** Whole-dashboard snapshot returned by `GET /call-center/dashboard`. */
export interface CallCenterDashboardSnapshot {
  /** Echo of the effective `YYYY-MM`. */
  period: string;
  summary: CallCenterDashboardSummary;
  dailyVolume: CallCenterDailyVolumePoint[];
  callTypeDistribution: CallCenterCallTypeSlice[];
  agentPerformance: CallCenterAgentPerformance[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape guards (defensive by design, never throw — same style as callEvents.ts)
// ─────────────────────────────────────────────────────────────────────────────

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || isFiniteNumber(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

/**
 * Narrows `unknown` to a plain record, or null for non-objects (including
 * arrays). See the identical helper in `callEvents.ts` for why guards read
 * fields through this record instead of casting a narrowed interface.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isSummary(value: unknown): value is CallCenterDashboardSummary {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isFiniteNumber(candidate.totalCalls) &&
    isFiniteNumber(candidate.answeredCalls) &&
    isFiniteNumber(candidate.answeredRatePct) &&
    isFiniteNumber(candidate.avgDurationSeconds) &&
    isOptionalFiniteNumber(candidate.satisfactionPct) &&
    isOptionalFiniteNumber(candidate.totalCallsDeltaPct)
  );
}

function isDailyVolumePoint(value: unknown): value is CallCenterDailyVolumePoint {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.date) &&
    isFiniteNumber(candidate.totalCalls) &&
    isFiniteNumber(candidate.answeredCalls)
  );
}

function isCallTypeSlice(value: unknown): value is CallCenterCallTypeSlice {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.typeKey) &&
    isOptionalString(candidate.label) &&
    isFiniteNumber(candidate.count)
  );
}

function isAgentPerformance(value: unknown): value is CallCenterAgentPerformance {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.agentId) &&
    isNonEmptyString(candidate.agentName) &&
    isFiniteNumber(candidate.callsHandled) &&
    isOptionalFiniteNumber(candidate.efficiencyPct) &&
    isOptionalFiniteNumber(candidate.satisfactionPct)
  );
}

function isRecordArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * True when `value` is a well-formed dashboard snapshot. A payload failing
 * any rule is NOT a snapshot — the caller must render the empty/error state,
 * never cast. Rejects the `[]` that `normalizeToApiResponse` substitutes for
 * an absent `data` (contract §5's truthiness trap).
 */
export function isCallCenterDashboardSnapshot(
  value: unknown
): value is CallCenterDashboardSnapshot {
  const candidate = toRecord(value);
  return (
    candidate !== null &&
    isNonEmptyString(candidate.period) &&
    isSummary(candidate.summary) &&
    isRecordArray(candidate.dailyVolume, isDailyVolumePoint) &&
    isRecordArray(candidate.callTypeDistribution, isCallTypeSlice) &&
    isRecordArray(candidate.agentPerformance, isAgentPerformance)
  );
}

/**
 * True when the snapshot is structurally valid but carries no activity — the
 * contract §6 empty snapshot (e.g. a future month). The UI renders the empty
 * state rather than zeroed charts.
 */
export function isSnapshotEmpty(snapshot: CallCenterDashboardSnapshot): boolean {
  return (
    snapshot.summary.totalCalls === 0 &&
    snapshot.dailyVolume.length === 0 &&
    snapshot.callTypeDistribution.length === 0 &&
    snapshot.agentPerformance.length === 0
  );
}

/**
 * Extracts a valid snapshot from a raw `ApiResponse`-shaped response, or null
 * when the envelope resolved but carries no usable snapshot (empty `data`,
 * wrong shape, `data: null`). Business failures are NOT handled here —
 * `hybridBaseQuery` already turns a `status: "-1"` envelope into an RTK error
 * the hook reports via `isError`. Companion of the `readAreaCountryTree`
 * pattern in `src/cms/utils/areaTree.ts`.
 */
export function extractDashboardSnapshot(
  response: unknown
): CallCenterDashboardSnapshot | null {
  const candidate = toRecord(response);
  if (candidate === null) {
    return null;
  }
  return isCallCenterDashboardSnapshot(candidate.data) ? candidate.data : null;
}

/**
 * Formats a `Date` as the dashboard's `period` query param (`YYYY-MM`), using
 * the client's local clock — the month picker is a local-UI concern, while
 * day/month bucketing boundaries are server-side (Asia/Bangkok, contract Q6).
 */
export function formatDashboardPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** `YYYY-MM` with a real calendar month (01–12). */
const DASHBOARD_PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validates a raw `YYYY-MM` string — e.g. from `<input type="month">`, which
 * yields `""` when cleared — and falls back to the current month when
 * malformed. Guards the API param against arbitrary user input.
 */
export function normalizeDashboardPeriod(
  value: string,
  fallback: Date = new Date()
): string {
  return DASHBOARD_PERIOD_PATTERN.test(value)
    ? value
    : formatDashboardPeriod(fallback);
}
