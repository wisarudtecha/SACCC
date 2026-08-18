// src/core/config/api.ts
import Cookies from "js-cookie";

type RuntimeEnv = "local" | "stg" | "qa" | "prod";

export const resolveRuntimeEnv = (): RuntimeEnv => {
  const env = import.meta.env.VITE_ENV;
  if (env?.includes("staging")) {
    return "stg";
  }
  if (env?.includes("quality")) {
    return "qa";
  }
  if (env === "production") {
    return "prod";
  }
  
  // throw new Error(`Unsupported VITE_ENV: ${env}`);
  return "local"; // default to staging
};

const COOKIE_PREFIX_MAP: Record<RuntimeEnv, string> = {
  local: "local_dev_mt_mdss",
  stg: "stg_mt_mdss",
  qa: "qa_mt_mdss",
  prod: "bma_mt_mdss"
};

const getCookieName = (key: string): string => {
  const env = resolveRuntimeEnv();
  return `${COOKIE_PREFIX_MAP[env]}_${key}`;
};

const getApiBaseUrl = (baseUrl: string) => {
  // const envApi = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  const envApi = baseUrl || "/api/v1";
  // console.log("API_BASE_URL:", envApi);
  if (envApi) {
    return envApi;
  }
  const allowedHosts = import.meta.env.VITE_ALLOWED_HOSTS.split(",");
  const isDevelopment = allowedHosts.includes(window.location.hostname);
  return isDevelopment && "/api/v1" || envApi;
};

const getWelcomeApiBaseUrl = (): string => {
  const envApi = import.meta.env.VITE_API_BASE_URL_CRM || "/api/v1";
  if (envApi) {
    return envApi;
  }
  const allowedHosts = import.meta.env.VITE_ALLOWED_HOSTS.split(",");
  const isDevelopment = allowedHosts.includes(window.location.hostname);
  return isDevelopment && "/api/v1" || envApi;
};

export interface SSOCookie {
  accessToken: string | null;
  disabled_audio: string | null;
  refreshToken: string | null;
  tokenExpireTime: string | null;
  workspace: string | null;
}

export const getSSOCookie = (): SSOCookie => {
  return {
    accessToken: Cookies.get(getCookieName("accesstoken")) || null,
    disabled_audio: Cookies.get(getCookieName("disabled_audio")) || null,
    refreshToken: Cookies.get(getCookieName("refreshtoken")) || null,
    tokenExpireTime: Cookies.get(getCookieName("token_expire_time")) || null,
    workspace: Cookies.get(getCookieName("workspace")) || null,
  };
}

export const forceSSOLogout = (): void => {
  const keys = [
    "accesstoken",
    "disabled_audio",
    "refreshtoken",
    "token_expire_time",
    "workspace"
  ];

  keys.forEach(key => {
    Cookies.remove(getCookieName(key));
  });
}

/**
 * Read-only SSO check: returns the access token when the cookie set is complete.
 *
 * This must stay free of side effects. It is called from render paths (AppHeader twice per
 * render, LoginForm, UserDropdown, ProtectedRoute) and from a 1-second poll. It previously
 * called forceSSOLogout() whenever any single cookie was missing, so the moment
 * token_expire_time lapsed the next render destroyed the remaining cookies and the poll
 * signed the user out within a second, with no warning. Cookie clearing is now only done
 * where a logout is actually intended.
 */
export const getSSOAccessToken = (): string | null => {
  const sso = getSSOCookie();
  if (sso.accessToken && sso.refreshToken && sso.tokenExpireTime && sso.workspace) {
    return sso.accessToken;
  }
  return null;
}

/** Retained for existing call sites; delegates to the read-only check above. */
export const isSSOAvailable = (): string | null => getSSOAccessToken();

export const isSSOLogout = (): string | null => {
  const MT_MDSS = getSSOCookie();
  if (!MT_MDSS.accessToken && !MT_MDSS.refreshToken && !MT_MDSS.workspace) {
    forceSSOLogout();
    return MT_MDSS.tokenExpireTime;
  }
  return null;
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  BASE_URL_CRM: getApiBaseUrl(import.meta.env.VITE_API_BASE_URL_CRM),
  DEMO_MODE: false,
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    VERIFY: "/auth/verify",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    PROFILE: "/auth/profile",
    ROLE_PERMISSION_BY_ROLE_ID: "/role_permission/roleId/"
  },
  ENV: resolveRuntimeEnv(),
  GRAPHQL_URL: getApiBaseUrl(import.meta.env.VITE_GRAPHQL_BASE_URL),
  // ArcGIS map / geocoding (address search + reverse geocode on case forms).
  // The API key is supplied per-environment via VITE_ARCGIS_API_KEY; the geocode
  // service defaults to the ArcGIS World Geocoding Service when unset.
  ARCGIS_API_KEY: import.meta.env.VITE_ARCGIS_API_KEY || "",
  ARCGIS_GEOCODE_URL:
    import.meta.env.VITE_ARCGIS_GEOCODE_URL ||
    "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer",
  // World Route service - separate, credit-consuming premium operation; the key
  // needs routing privileges on top of the basemap/geocoding ones above.
  ARCGIS_ROUTE_URL:
    import.meta.env.VITE_ARCGIS_ROUTE_URL ||
    "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  TIMEOUT: 10000 // 10 seconds
};

export const API_WELCOME_CONFIG = {
  BASE_URL: getWelcomeApiBaseUrl(),
  DEMO_MODE: false,
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    VERIFY: "/auth/verify",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    PROFILE: "/auth/profile",
    ROLE_PERMISSION_BY_ROLE_ID: "/role_permission/roleId/"
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  TIMEOUT: 10000 // 10 seconds
};
