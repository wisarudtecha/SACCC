// src/core/utils/devLoginBypass.ts
import { isSSOAvailable } from "@/core/config/api";
import { AuthService } from "@/core/utils/authService";
import { AUTH_AUTHORITY_KEY, AUTH_LOCK_KEY, AUTH_SOURCE_KEY } from "@/core/utils/constants";
import { TokenManager } from "@/core/utils/tokenManager";

/**
 * Local-development escape hatch: fabricates a session so a locked-out login
 * form can be skipped when no backend is reachable.
 *
 * Seeds storage and reloads - AuthProvider.getInitialAuthState() then restores
 * the session on boot, so no production auth code needs to know this exists.
 *
 * The mock JWT is unsigned, so every REST/GraphQL call and the websocket will
 * reject it. This buys you the shell, routing and permission-gated UI only.
 *
 * Callers must also gate on `import.meta.env.DEV` so the call site itself is
 * removed from production bundles - the guard below is only a safety net.
 */
export const seedDevBypassSession = (): void => {
  if (!import.meta.env.DEV) {
    return;
  }

  // Never interfere with a real SSO session.
  if (isSSOAvailable()) {
    return;
  }

  const user = AuthService.createMockUser("dev.bypass");
  const accessToken = AuthService.createMockJWT(user);

  // Both TokenManager.setTokens() and getInitialAuthState() short-circuit while
  // this key is set, which is exactly the state a lockout leaves behind.
  sessionStorage.removeItem(AUTH_LOCK_KEY);

  // Mirror what AuthService.login() records on a manual success so the SSO
  // authority monitor in ProtectedRoute can take this session over later.
  sessionStorage.setItem(AUTH_SOURCE_KEY, "manual");
  sessionStorage.setItem(AUTH_AUTHORITY_KEY, "manual");

  // No `language` argument - leave whatever the user already picked in place.
  TokenManager.setTokens(accessToken, "dev-bypass-refresh-token", true, user);

  window.location.reload();
};
