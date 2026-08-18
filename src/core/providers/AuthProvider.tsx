// src/core/providers/AuthProvider.tsx
import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { AuthContext } from "@/core/context/AuthContext";
import { authReducer } from "@/core/hooks/useAuthContext";
import { useHardSessionCap } from "@/core/hooks/useHardSessionCap";
import { useSessionExpiry } from "@/core/hooks/useSessionExpiry";
import { store } from "@/core/store";
import { authGqlEndpoints } from "@/core/store/api/graphql/authGqlApi";
import { AuthService } from "@/core/utils/authService";
import { ACTIVITY_DISPATCH_THROTTLE, AUTH_LOCK_KEY, USE_GRAPHQL } from "@/core/utils/constants";
import { clearOfflineCache } from "@/core/utils/offlineCache";
import { clearHardExpiry, resetHardExpiry } from "@/core/utils/sessionDeadline";
import { TokenManager } from "@/core/utils/tokenManager";
import type { AuthState, LoginCredentials, RegisterData } from "@/core/types/auth";
import { caseApiSetup } from "@/cms/components/case/uitls/CaseApiManager";
import { useToastContext } from "@/core/components/crud/ToastGlobal";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialAuthState = (): AuthState => {
    // console.log("🔍 Initializing auth state...");
    const isAuthLocked = sessionStorage.getItem(AUTH_LOCK_KEY) === "true";
    if (isAuthLocked) {
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        error: null,
        sessionTimeout: null,
        failedAttempts: 0,
        isLocked: false,
        networkStatus: navigator.onLine ? "online" : "offline",
        lastActivity: Date.now()
      };
    }

    const token = TokenManager.getToken();
    const user = TokenManager.getStoredUser();
    if (token && user && !TokenManager.isTokenExpired(token)) {
      // console.log("✅ Valid session found during initialization");
      // If user doesn't have the new structure, create it with proper permissions
      if (!user.orgId || !user.roleId) {
        const updatedUser = AuthService.createMockUser(user.username);
        TokenManager.setTokens(
          token,
          TokenManager.getRefreshToken() || "",
          // false,
          true,
          updatedUser
        );
        return {
          user: updatedUser,
          token,
          refreshToken: TokenManager.getRefreshToken(),
          isAuthenticated: true,
          isLoading: false,
          isRefreshing: false,
          error: null,
          sessionTimeout: null,
          failedAttempts: 0,
          isLocked: false,
          networkStatus: navigator.onLine ? "online" : "offline",
          lastActivity: Date.now()
        };
      }
      return {
        user,
        token,
        refreshToken: TokenManager.getRefreshToken(),
        isAuthenticated: true,
        isLoading: false,
        isRefreshing: false,
        error: null,
        sessionTimeout: null,
        failedAttempts: 0,
        isLocked: false,
        networkStatus: navigator.onLine ? "online" : "offline",
        lastActivity: Date.now()
      };
    }
    else {
      // console.log("❌ No valid session found during initialization");
      if (token) {
        // TokenManager.clearTokens();
      }
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        error: null,
        sessionTimeout: null,
        failedAttempts: 0,
        isLocked: false,
        networkStatus: navigator.onLine ? "online" : "offline",
        lastActivity: Date.now()
      };
    }
  };

  const [state, dispatch] = useReducer(authReducer, getInitialAuthState());
  const {addToast}=useToastContext();
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => dispatch({ type: "SET_NETWORK_STATUS", payload: "online" });
    const handleOffline = () => dispatch({ type: "SET_NETWORK_STATUS", payload: "offline" });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Activity tracking.
  // Throttled: these events fire dozens of times a second, and every dispatch produces a
  // new state object, which re-renders every auth context consumer (ProtectedRoute,
  // PermissionGate, usePermissions, ...). Session length does not depend on activity —
  // the absolute cap is deliberately activity-independent — so a coarse timestamp is fine.
  useEffect(() => {
    let lastDispatchedAt = 0;

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastDispatchedAt < ACTIVITY_DISPATCH_THROTTLE) {
        return;
      }
      lastDispatchedAt = now;
      dispatch({ type: "UPDATE_LAST_ACTIVITY" });
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      // await AuthService.logout();
    }
    catch (error) {
      console.error("Logout error:", error);
    }
    finally {
      // Before the credentials go, while the tree is still mounted against consistent
      // state. The offline case cache is not covered by TokenManager, so without this it
      // survives on disk and the next agent to sign in on a shared workstation inherits
      // the previous agent's case data. Never rejects — a failed clear cannot block logout.
      await clearOfflineCache("logout");

      TokenManager.clearTokens();
      // Drop the absolute cap so the next login arms a fresh one instead of inheriting
      // — or instantly tripping — the previous session's deadline.
      clearHardExpiry();
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Session timeout and token refresh scheduling now live in useSessionExpiry and
  // useHardSessionCap. They are invoked below, after refreshToken is defined.

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: "LOGIN_START" });

    try {
      let response;

      if (USE_GRAPHQL) {
        const result = await store.dispatch(authGqlEndpoints.login.initiate({
          username: credentials.username,
          password: credentials.password,
          organization: credentials.organization
        })).unwrap();

        const Auth = result?.Auth || {};
        const AuthLogin = Auth?.AuthLogin || {};

        if (Number(AuthLogin?.status) < 0 || !AuthLogin?.data) {
          const errMsg = [AuthLogin?.msg, AuthLogin?.desc].filter(Boolean).join(" - ") || "Login failed";
          throw new Error(errMsg);
        }

        response = AuthLogin.data;
      }
      else {
        response = await AuthService.login(credentials);
      }

      // A deliberate sign-in always clears the auth lock. AuthService only does this on the
      // REST path, so without this the GraphQL and demo paths would hit the lock check in
      // TokenManager.setTokens and silently fail to persist the session — which is exactly
      // the state terminateSession leaves behind after the absolute cap fires.
      sessionStorage.removeItem(AUTH_LOCK_KEY);

      TokenManager.setTokens(
        response.accessToken,
        response.refreshToken || response.accessToken,
        // credentials.rememberMe,
        true,
        response.user,
        credentials?.language || ""
      );

      // Start the absolute cap from this login rather than reusing whatever deadline may
      // have survived a crash or an abruptly closed tab.
      resetHardExpiry();

      const err = (await caseApiSetup()).filter(item => { return item != "" });
      
      if (err.length != 0) {
        err.map(item => { addToast("error", item, 5000, true) })
      }
      
      // sessionStorage.removeItem("sso_takeover_active");

      dispatch({ 
        type: "LOGIN_SUCCESS", 
        payload: { 
          user: response.user, 
          token: response.accessToken,
          refreshToken: response.refreshToken
        }
      });

      dispatch({ type: "RESET_FAILED_ATTEMPTS" });
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
    }
  }, [addToast]);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await AuthService.register(data);

      sessionStorage.removeItem(AUTH_LOCK_KEY);

      TokenManager.setTokens(
        response.accessToken,
        response.refreshToken,
        false,
        response.user
      );

      resetHardExpiry();

      dispatch({ 
        type: "LOGIN_SUCCESS", 
        payload: { 
          user: response.user, 
          token: response.accessToken,
          refreshToken: response.refreshToken
        } 
      });
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const currentRefreshToken = TokenManager.getRefreshToken();
    if (!currentRefreshToken || state.isRefreshing) {
      console.log("🔄 Token refresh already in progress.");
      return;
    }

    if (state.isRefreshing) {
      console.log("🔄 Token refresh already in progress.");
      return;
    }

    // console.log("🔄 Refreshing token...");
    dispatch({ type: "REFRESH_START" });

    try {
      const response = await AuthService.refreshToken(currentRefreshToken);

      // The session can end while the request is in flight (expiry, manual logout, or the
      // absolute cap). Every one of those clears stored tokens, so re-persisting here
      // would resurrect a session that has already been torn down.
      if (!TokenManager.getRefreshToken()) {
        console.warn("Token refresh resolved after the session ended; discarding result");
        dispatch({ type: "REFRESH_FAILURE" });
        return;
      }

      // `localStorage || sessionStorage` always resolved to localStorage, so a session
      // stored in sessionStorage produced an empty profile that then got persisted.
      // TokenManager checks both stores.
      const profile = TokenManager.getStoredUser() ?? state.user;

      if (!profile) {
        // setTokens clears the stored profile before rewriting, so persisting the new
        // tokens without one would leave the session without a user. Treat it as a failed
        // refresh and let the soft timeline expire the session normally.
        console.error("Token refresh succeeded but no stored profile was available");
        dispatch({ type: "REFRESH_FAILURE" });
        return;
      }

      TokenManager.setTokens(
        response.accessToken,
        response.refreshToken,
        true,
        profile
      );

      dispatch({ 
        type: "REFRESH_SUCCESS", 
        payload: {
          user: profile,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        } 
      });
      console.log("✅ Token refresh successful");
    }
    catch (error) {
      console.error("Token refresh failed:", error);
      // Deliberately does not sign the user out. Refresh runs SESSION_REFRESH_LEAD minutes
      // before expiry, so the current token is usually still valid — the soft timeline
      // warns at SESSION_TIMEOUT_WARNING and expires the session on time. Ejecting here is
      // what previously sent users to the login form with no warning.
      dispatch({ type: "REFRESH_FAILURE" });
    }
  }, [state.isRefreshing, state.user]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await AuthService.forgotPassword(email);
    }
    catch (error) {
      console.error(error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  /* ------------------------- Session lifecycle timers ------------------------- */

  // Absolute cap: SESSION_TIMEOUT_TIMER minutes from login, regardless of activity or
  // token validity. Persisted, so a reload cannot extend it. Enforced entirely inside the
  // hook (terminateSession runs there when the deadline passes) — deliberately silent,
  // with no warning modal: reaching this limit is a hard, unconditional sign-out.
  useHardSessionCap(state.isAuthenticated);

  const handleSessionWarning = useCallback((deadline: number) => {
    dispatch({ type: "SET_SESSION_TIMEOUT", payload: deadline });
  }, []);

  // Soft timeline, driven by the real credential deadline (X-Session-Timeout header, or
  // the JWT `exp`): silent refresh, then warning, then sign-out.
  useSessionExpiry({
    isAuthenticated: state.isAuthenticated,
    token: state.token,
    onRefresh: refreshToken,
    onWarn: handleSessionWarning,
    onExpire: logout
  });

  const contextValue = useMemo(() => ({
    state,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    clearError
  }), [state, login, register, logout, refreshToken, forgotPassword, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
