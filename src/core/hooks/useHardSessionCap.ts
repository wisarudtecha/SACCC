// src/core/hooks/useHardSessionCap.ts
/**
 * Enforces the absolute session cap: SESSION_TIMEOUT_TIMER minutes measured from login,
 * independent of user activity and of whether the access token is still valid. Reaching
 * it is a silent, unconditional sign-out — no warning modal, by design.
 *
 * The deadline is compared against the wall clock rather than armed as one long
 * `setTimeout`, because a multi-hour timer is skipped by background-tab throttling, does
 * not survive laptop sleep, and dies on reload. Checking on mount, on an interval and on
 * tab refocus covers all three.
 *
 * Returns the active deadline for callers that need it (e.g. diagnostics); AuthProvider
 * itself only needs the side effect and discards the return value.
 */
import { useEffect, useState } from "react";
import { SESSION_HARD_CAP_CHECK_INTERVAL } from "@/core/utils/constants";
import { isHardExpired, startHardExpiry } from "@/core/utils/sessionDeadline";
import { terminateSession } from "@/core/utils/sessionTermination";

export const useHardSessionCap = (isAuthenticated: boolean): number | null => {
  const [hardExpiry, setHardExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHardExpiry(null);
      return;
    }

    // Write-once: an existing deadline is returned untouched, so a reload cannot extend it.
    setHardExpiry(startHardExpiry());

    const enforce = () => {
      if (isHardExpired()) {
        void terminateSession("hard-cap");
      }
    };

    // Runs immediately to catch a reload that happened after the deadline had passed.
    enforce();

    const interval = setInterval(enforce, SESSION_HARD_CAP_CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        enforce();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return hardExpiry;
};
