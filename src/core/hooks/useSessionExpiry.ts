// src/core/hooks/useSessionExpiry.ts
/**
 * Schedules the soft session timeline against the *actual* credential deadline — the
 * server's `X-Session-Timeout` header when present, otherwise the JWT `exp`.
 *
 *   deadline − SESSION_REFRESH_LEAD    silent refresh
 *   deadline − SESSION_TIMEOUT_WARNING warning modal
 *   deadline                           sign out
 *
 * The refresh lead is deliberately longer than the warning lead: a successful refresh
 * moves the deadline forward, the effect re-runs on the new token and everything is
 * rescheduled, so the modal is never reached while refresh is healthy.
 */
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { SESSION_REFRESH_LEAD, SESSION_TIMEOUT_WARNING } from "@/core/utils/constants";
import { resolveSoftDeadline } from "@/core/utils/sessionDeadline";
import type { RootState } from "@/core/store";

/** setTimeout overflows past 2^31-1 ms and fires immediately; chain instead. */
const MAX_TIMEOUT_MS = 2_147_483_647;

type TimerRef = { current: ReturnType<typeof setTimeout> | null };

const scheduleAt = (ref: TimerRef, when: number, run: () => void): void => {
  const delay = when - Date.now();

  if (delay <= 0) {
    run();
    return;
  }

  if (delay > MAX_TIMEOUT_MS) {
    ref.current = setTimeout(() => scheduleAt(ref, when, run), MAX_TIMEOUT_MS);
    return;
  }

  ref.current = setTimeout(run, delay);
};

interface UseSessionExpiryOptions {
  isAuthenticated: boolean;
  token: string | null;
  onRefresh: () => void;
  onWarn: (deadline: number) => void;
  onExpire: () => void;
}

export const useSessionExpiry = ({
  isAuthenticated,
  token,
  onRefresh,
  onWarn,
  onExpire
}: UseSessionExpiryOptions): void => {
  const headerDeadline = useSelector((state: RootState) => state.auth.sessionTimeout);

  // Held in refs so a caller re-creating these callbacks does not tear down live timers.
  const onRefreshRef = useRef(onRefresh);
  const onWarnRef = useRef(onWarn);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
    onWarnRef.current = onWarn;
    onExpireRef.current = onExpire;
  }, [onRefresh, onWarn, onExpire]);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearAll = () => {
      [refreshTimer, warnTimer, expireTimer].forEach(timer => {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      });
    };

    clearAll();

    // No session is not an event: schedule nothing, and above all do not sign the user
    // out here. Doing so previously destroyed stored tokens on any transient falsy state.
    if (!isAuthenticated || !token) {
      return;
    }

    const deadline = resolveSoftDeadline(headerDeadline, token);
    if (deadline === null) {
      return;
    }

    // Already inside a window (short-lived token, or a tab restored from sleep) runs the
    // handler immediately rather than silently skipping it.
    scheduleAt(refreshTimer, deadline - SESSION_REFRESH_LEAD * 60 * 1000, () => onRefreshRef.current());
    scheduleAt(warnTimer, deadline - SESSION_TIMEOUT_WARNING * 60 * 1000, () => onWarnRef.current(deadline));
    scheduleAt(expireTimer, deadline, () => onExpireRef.current());

    return clearAll;
  }, [isAuthenticated, token, headerDeadline]);
};
