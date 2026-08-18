// /src/components/auth/ProtectedRoute.tsx
import React
  ,
  {
    useEffect,
    useRef,
    // useState
  }
from "react";
import { LoginForm } from "@/core/components/auth/LoginForm";
import { SessionRefreshIndicator } from "@/core/components/auth/SessionRefreshIndicator";
import {
  forceSSOLogout,
  getSSOAccessToken,
  // isSSOLogout
} from "@/core/config/api";
import { useAuth } from "@/core/hooks/useAuth";
import { useAuthMode } from "@/core/hooks/useAuthMode";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { useTranslation } from "@/core/hooks/useTranslation";
import { AlertIcon } from "@/core/icons";
// import { AuthService } from "@/cms/utils/authService";
import { AUTH_AUTHORITY_KEY, AUTH_LOCK_KEY, AUTH_SOURCE_KEY, MAX_SSO_LOGIN_ATTEMPTS, SSO_TAKEOVER_KEY } from "@/cms/utils/constants";
import { PermissionManager } from "@/core/utils/permissionManager";
import type {
  ProtectedRouteProps,
  // User
} from "@/core/types/auth";

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  // requiredRole = [],
  requiredPermissions = [],
  // requireAnyPermission = [],
  module,
  action = "view",
  fallback: Fallback
}) => {
  const { state, login, logout } = useAuth();
  const { language, t } = useTranslation();

  const authMode = useAuthMode();
  const isSystemAdmin = useIsSystemAdmin();
  const ssoToken = getSSOAccessToken();
  const isSSOReady = Boolean(ssoToken);
  const ssoLoginAttempts = useRef(0);
  const isSSOTakeover = sessionStorage.getItem(SSO_TAKEOVER_KEY) === "true";

  // const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  // useEffect(() => {
  //   const fetchAuthService = async () => {
  //     setIsSystemAdmin(await AuthService.isSystemAdmin());
  //   }
  //   fetchAuthService();
  // }, [isSystemAdmin]);
  
  // Max attempts for automatic SSO login to avoid infinite retries
  // const ssoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------------------------- UI ---------------------------------- */

  const SSOLoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {/* {language === "th" && "โปรดรีเฟรชหน้าเว็บเพื่อดำเนินการต่อ" || "Please refresh page to continue."} */}
          {language === "th" ? "กำลังตรวจสอบสิทธิ์ SSO" : "Verifying SSO session"}
        </h2>
      </div>
    </div>
  );

  /* -------------------------- SSO Authority Monitor ------------------------- */

  // useEffect(() => {
  //   if (!state.user && !state.isLoading && ssoToken && ssoLoginAttempts.current < MAX_SSO_LOGIN_ATTEMPTS) {
  //     ssoLoginAttempts.current++;
  //     void login({ token: ssoToken ?? undefined, rememberMe: true });
  //     console.log("🚀 ~ SSO: Logining...");
  //   }
  //   else if (state.user) {
  //     ssoLoginAttempts.current = 0;
  //     if (!ssoToken) {
  //       void logout();
  //       console.log("🚀 ~ SSO: Logouting...");
  //     }
  //     else {
  //       void isSSOLogout();
  //       console.log("🚀 ~ SSO: Cookie Deleting...");
  //     }
  //   }
  // }, [ssoToken, state.user, state.isLoading, login, logout]);

  // useEffect(() => {
  //   // SSO MODE ONLY
  //   if (authMode === "SSO") {
  //     // Auto-login via SSO
  //     if (!state.user && !state.isLoading && ssoToken && ssoLoginAttempts.current < MAX_SSO_LOGIN_ATTEMPTS) {
  //       ssoLoginAttempts.current++;
  //       void login({ token: ssoToken, rememberMe: true, language: "th" });
  //       return;
  //     }
  //     // Parent logged out → child must logout
  //     if (state.user && !ssoToken) {
  //       void logout();
  //       return;
  //     }
  //   }
  // }, [authMode, ssoToken, state.user, state.isLoading, login, logout]);

  useEffect(() => {
    if (authMode !== "SSO") return;
    let lastSSOToken = ssoToken;
    const interval = setInterval(() => {
      const currentSSOToken = getSSOAccessToken();
      const authority = sessionStorage.getItem(AUTH_AUTHORITY_KEY);
      /**
       * 1. Parent logout → logout child (ONLY if SSO authority)
       */
      if (authority === "sso" && state.user && !currentSSOToken) {
        sessionStorage.setItem(AUTH_LOCK_KEY, "true");
        // Explicit now that getSSOAccessToken no longer clears cookies as a side effect.
        forceSSOLogout();
        logout();
        sessionStorage.removeItem(AUTH_AUTHORITY_KEY);
        sessionStorage.removeItem(AUTH_SOURCE_KEY);
        sessionStorage.removeItem(SSO_TAKEOVER_KEY);
        ssoLoginAttempts.current = 0;
        lastSSOToken = null;
        return;
      }
      /**
       * 2. SSO takeover manual session
       */
      if (
        authority === "manual" &&
        currentSSOToken &&
        currentSSOToken !== lastSSOToken
      ) {
        sessionStorage.setItem(AUTH_AUTHORITY_KEY, "sso");
        sessionStorage.setItem(AUTH_SOURCE_KEY, "sso");
        sessionStorage.setItem(SSO_TAKEOVER_KEY, "true");
        logout();
        ssoLoginAttempts.current = 0;
        lastSSOToken = currentSSOToken;
        return;
      }
      lastSSOToken = currentSSOToken;
    }, 1000);
    return () => clearInterval(interval);
  }, [authMode, state.user, logout, ssoToken]);

  /* ---------------------------- Auto SSO Login ----------------------------- */

  useEffect(() => {
    if (authMode !== "SSO") return;
    if (!ssoToken) return;
    if (state.user) return;
    if (state.isLoading) return;
    if (ssoLoginAttempts.current >= MAX_SSO_LOGIN_ATTEMPTS) return;
    ssoLoginAttempts.current += 1;
    sessionStorage.removeItem(AUTH_LOCK_KEY);
    sessionStorage.setItem(AUTH_SOURCE_KEY, "sso");
    sessionStorage.setItem(AUTH_AUTHORITY_KEY, "sso");
    void login({
      token: ssoToken,
      rememberMe: true,
      language: "th"
    });
  }, [authMode, ssoToken, state.user, state.isLoading, login]);

  /* ------------------------------- Loading --------------------------------- */

  // Only the initial authentication blocks. A background token refresh deliberately does
  // NOT gate here: returning a spinner instead of `children` unmounted the whole app on
  // every refresh cycle. SessionRefreshIndicator surfaces it non-blockingly instead.
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mb-6"></div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("auth.signin.state.is_loading")}
          </h2>

          <p className="text-gray-600 dark:text-gray-300">
            {t("auth.signin.state.wating")}
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------- Unauthenticated -------------------------- */

  // if (!state.user || !state.token || !state.refreshToken || !state.isAuthenticated) {
  //   return <LoginForm />;
  // }

  if (!state.user || !state.token || !state.refreshToken || !state.isAuthenticated) {
    // if (ssoToken) {
    //   // If exceeded attempts, fall back to explicit login form
    //   if (ssoLoginAttempts.current >= MAX_SSO_LOGIN_ATTEMPTS) {
    //     console.log("🚀 ~ Login: Form Displaying...");
    //     return <LoginForm />;
    //   }
    //   console.log("🚀 ~ Login: Loading...", null);
    //   return (
    //     <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
    //       <div className="text-center">
    //         <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mb-6"></div>
    //         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
    //           {t("auth.signin.state.is_loading")}
    //         </h2>
    //         <p className="text-gray-600 dark:text-gray-300">
    //           {t("auth.signin.state.wating")}
    //         </p>
    //       </div>
    //     </div>
    //   );
    // }

    // SSO mode → never show login form unless attempts exceeded
    // if (authMode === "SSO") {
    //   if (ssoLoginAttempts.current >= MAX_SSO_LOGIN_ATTEMPTS) {
    //     return <LoginForm />;
    //   }
    //   return <SSOLoadingScreen />;
    // }
    // Standalone mode → always allow login form
    // return <LoginForm />;

    /**
     * SSO takeover finished → allow manual login
     */
    if (isSSOTakeover) {
      sessionStorage.removeItem(SSO_TAKEOVER_KEY);
      return <LoginForm />;
    }
    /**
     * SSO mode but no token → fallback immediately
     */
    if (authMode === "SSO" && !isSSOReady) {
      return <LoginForm />;
    }
    /**
     * SSO auto login flow
     */
    if (authMode === "SSO") {
      if (ssoLoginAttempts.current >= MAX_SSO_LOGIN_ATTEMPTS) {
        return <LoginForm />;
      }
      return <SSOLoadingScreen />;
    }
    /**
     * Standalone
     */
    return <LoginForm />;
  }

  /* -------------------------- Permission Checks -------------------------- */

  if (module) {
    const modulePermission = `${module}.${action}`;
    if (!PermissionManager.hasPermission(state.user, modulePermission) && !isSystemAdmin) {
      return Fallback ? (
        <Fallback />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertIcon className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("auth.permission.access_denied.title")}
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t("auth.permission.access_denied.subtitle")} {action} {module}
            </p>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.permission.access_denied.description")}: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{modulePermission}</code>
            </div>
          </div>
        </div>
      );
    }
  }

  if (requiredPermissions.length > 0 && !isSystemAdmin) {
    if (!PermissionManager.hasAllPermissions(state.user, requiredPermissions) && !isSystemAdmin) {
      return Fallback ? (
        <Fallback />
      ) : (
        <div className="min-h-screen flex items-center justify-center cursor-default">
          <div className="text-center max-w-md">
            <AlertIcon className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t("auth.permission.insufficient_permissions.title")}
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t("auth.permission.insufficient_permissions.subtitle")}
            </p>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.permission.insufficient_permissions.description")}:
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-2">
                {requiredPermissions.map(perm => (
                  <div key={perm} className="font-mono text-xs">
                    <span
                      className={
                        PermissionManager.hasPermission(state.user, perm)
                          ? 'text-green-600 dark:text-green-300'
                          : 'text-red-600 dark:text-red-300'
                      }
                    >
                      {PermissionManager.hasPermission(state.user, perm) ? '✓' : '✗'}
                    </span> {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check role permissions
  // if (requiredRole.length > 0 && state.user && !requiredRole.includes(state.user.role)) {
  //   return Fallback ? (
  //     <Fallback />
  //   ) : (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <AlertIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
  //         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
  //         <p className="text-gray-600 dark:text-gray-300">You don"t have permission to access this page.</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Check specific permissions
  // if (requiredPermissions.length > 0 && state.user) {
  //   const hasPermissions = requiredPermissions.every(permission =>
  //     state.user!.permissions.includes(permission)
  //   );
  //   if (!hasPermissions) {
  //     return Fallback ? (
  //       <Fallback />
  //     ) : (
  //       <div className="min-h-screen flex items-center justify-center">
  //         <div className="text-center">
  //           <AlertIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
  //           <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Insufficient Permissions</h2>
  //           <p className="text-gray-600 dark:text-gray-300">You don"t have the required permissions for this action.</p>
  //         </div>
  //       </div>
  //     );
  //   }
  // }

  return (
    <>
      <SessionRefreshIndicator />
      {children}
    </>
  );
};
