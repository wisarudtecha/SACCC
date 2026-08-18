// src/core/utils/sessionTermination.ts
/**
 * Hard session teardown.
 *
 * Used when a session must end unconditionally — currently only when the absolute cap
 * (SESSION_TIMEOUT_TIMER) is reached. Unlike the ordinary `logout()` in AuthProvider,
 * this drops every live connection and returns the app to a cold boot.
 *
 * The final `location.replace` is what actually performs the disconnect: it closes the
 * WebSocket, drops every RTK Query subscription and clears all outstanding timers in one
 * step. That matters because WebSocketProvider is mounted *inside* ProtectedRoute, so
 * AuthProvider cannot reach its `disconnect()` through context.
 */
import { forceSSOLogout } from "@/core/config/api";
import { AUTH_LOCK_KEY } from "@/core/utils/constants";
import { clearOfflineCache } from "@/core/utils/offlineCache";
import { clearHardExpiry } from "@/core/utils/sessionDeadline";
import { TokenManager } from "@/core/utils/tokenManager";

export type SessionTerminationReason = "hard-cap";

/** The cap is polled from several places; make sure only the first one through does the work. */
let isTerminating = false;

export const terminateSession = async (reason: SessionTerminationReason): Promise<void> => {
  if (isTerminating) {
    return;
  }
  isTerminating = true;

  console.warn(`Session terminated: ${reason}`);

  // The async work happens FIRST, while the app is still in a consistent state.
  // Clearing credentials before this await would leave the component tree mounted against
  // empty storage, and anything that reads localStorage during render (for example
  // NotificationDropdown, which re-reads `profile` on every render) would fault in that
  // window on the next re-render — the countdown interval alone is enough to trigger one.
  await clearOfflineCache("session termination");

  // Everything below is synchronous and ends in a navigation, so no render can observe
  // the half-torn-down state.
  try {
    // Blocks TokenManager.setTokens and the auth-lock branch of getInitialAuthState from
    // racing a re-authentication while the teardown is in flight.
    sessionStorage.setItem(AUTH_LOCK_KEY, "true");
  }
  catch (error) {
    console.error("Failed to set auth lock during session termination:", error);
  }

  TokenManager.clearTokens();

  // Without this the SSO auto-login effect in ProtectedRoute re-authenticates from the
  // surviving cookie immediately after the redirect, and the cap would do nothing.
  try {
    forceSSOLogout();
  }
  catch (error) {
    console.error("Failed to clear SSO cookies during session termination:", error);
  }

  clearHardExpiry();

  window.location.replace("/");
};
