// src/core/utils/sessionDeadline.ts
/**
 * Session deadline resolution.
 *
 * Two independent deadlines govern a session:
 *
 * - The *soft* deadline is when the current credentials stop working. It comes from the
 *   server's `X-Session-Timeout` header when present, otherwise from the JWT `exp` claim.
 *   A successful token refresh moves it forward, so it repeats every refresh cycle.
 * - The *hard* deadline is an absolute cap measured from login. It is persisted so a page
 *   reload cannot extend it, and it ignores both user activity and token validity.
 */
import { SESSION_HARD_EXPIRY_KEY, SESSION_TIMEOUT_TIMER } from "@/core/utils/constants";
import { TokenManager } from "@/core/utils/tokenManager";

/** Anything further out than this is treated as a malformed header rather than a deadline. */
const MAX_PLAUSIBLE_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * The unit of `X-Session-Timeout` is not specified by the BFF contract, so accept the three
 * unambiguous encodings and convert them all to absolute epoch milliseconds:
 *
 * - `< 1e6`  seconds remaining (up to ~11 days)
 * - `< 1e10` epoch seconds
 * - else     epoch milliseconds
 *
 * Values that land in the past or absurdly far in the future are rejected, so a
 * misencoded header degrades to the JWT `exp` fallback instead of expiring the session.
 */
export const normalizeSessionDeadline = (raw: string | number | null | undefined): number | null => {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const value = typeof raw === "number" ? raw : Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const now = Date.now();
  let deadline: number;

  if (value < 1e6) {
    deadline = now + value * 1000;
  }
  else if (value < 1e10) {
    deadline = value * 1000;
  }
  else {
    deadline = value;
  }

  if (deadline <= now || deadline - now > MAX_PLAUSIBLE_SESSION_MS) {
    return null;
  }

  return deadline;
};

/**
 * Resolve when the current credentials stop working.
 *
 * The server header wins while it is still in the future; otherwise fall back to the JWT
 * `exp`. An already-expired `exp` is returned as-is so the caller can act immediately
 * rather than treating it as "no deadline known".
 */
export const resolveSoftDeadline = (headerDeadline: number | null, token: string | null): number | null => {
  if (headerDeadline !== null && headerDeadline > Date.now()) {
    return headerDeadline;
  }

  if (!token) {
    return null;
  }

  return TokenManager.getTokenExpiryTime(token);
};

export const getHardExpiry = (): number | null => {
  const raw = localStorage.getItem(SESSION_HARD_EXPIRY_KEY);
  if (!raw) {
    return null;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * Arm the absolute cap. Write-once by design: if a deadline already exists it is returned
 * untouched, so reloading the page (or a re-render that re-runs the login effect) cannot
 * buy the user more time.
 */
export const startHardExpiry = (): number => {
  const existing = getHardExpiry();
  if (existing !== null) {
    return existing;
  }

  const deadline = Date.now() + SESSION_TIMEOUT_TIMER * 60 * 1000;
  localStorage.setItem(SESSION_HARD_EXPIRY_KEY, String(deadline));
  return deadline;
};

export const clearHardExpiry = (): void => {
  localStorage.removeItem(SESSION_HARD_EXPIRY_KEY);
};

/**
 * Force-arm a fresh cap, discarding any existing deadline. Used at login so a new session
 * never inherits a stale deadline left behind by a browser crash or a closed tab — which
 * would otherwise expire the new session early, or immediately.
 */
export const resetHardExpiry = (): number => {
  clearHardExpiry();
  return startHardExpiry();
};

export const isHardExpired = (now: number = Date.now()): boolean => {
  const deadline = getHardExpiry();
  return deadline !== null && now >= deadline;
};
