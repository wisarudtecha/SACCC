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

/**
 * Which map SDK the app renders with. Declared here rather than in the map
 * folder so that `core` does not have to reach into `@/cms` for the type of one
 * of its own config values.
 */
export type MapProviderId = "arcgis" | "longdo" | "maptiler";

/**
 * Where the case map's administrative boundary POLYGONS come from.
 *
 * Named here rather than in `@/cms` for the same reason as MapProviderId: this is
 * one of this config object's own values, so `core` should not have to reach into
 * a module to type it. The level tables and both boundary sources live in
 * `@/cms/components/case/createCase/map/boundaries`.
 *
 *   "org"    the organization's area records + static TopoJSON under
 *            public/geo/thailand (one file per level)
 *   "minio"  the organization's area records + one geometry object per AREA in
 *            object storage (see minioBoundaryGeometry.ts)
 *   "local"  the static Bangkok GeoJSON fixtures, kept as the reference view
 */
export type BoundarySourceId = "org" | "minio" | "local";

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
  // Which map SDK draws every map in the app.
  //   "arcgis" (default) the ArcGIS Maps SDK
  //   "longdo"           the Longdo Map v3 SDK
  //   "maptiler"         MapLibre GL JS against MapTiler styles / geocoding
  // Anything other than the literal "longdo" / "maptiler" resolves to "arcgis",
  // so an unset or mistyped value falls back to the provider known to work
  // rather than to a blank map - the same failure direction as BOUNDARY_SOURCE
  // below.
  MAP_PROVIDER: (import.meta.env.VITE_MAP_PROVIDER === "longdo"
    ? "longdo"
    : import.meta.env.VITE_MAP_PROVIDER === "maptiler"
      ? "maptiler"
      : "arcgis") as MapProviderId,
  // Longdo Map key, covering the tiles and the search / address / route JSON
  // APIs. Supplied per-environment via VITE_LONGDO_API_KEY.
  LONGDO_API_KEY: import.meta.env.VITE_LONGDO_API_KEY || "",
  // MapTiler key, covering the vector/raster tile styles and the geocoding API.
  // Supplied per-environment via VITE_MAPTILER_API_KEY. Browser-side key scoped
  // by origin allowlist, not a secret.
  MAPTILER_API_KEY: import.meta.env.VITE_MAPTILER_API_KEY || "",
  // OpenRouteService key, used only when MAP_PROVIDER === "maptiler" (MapTiler
  // has no routing API of its own). Supplied per-environment via
  // VITE_ORS_API_KEY. Travels in the Authorization header, browser-side key.
  ORS_API_KEY: import.meta.env.VITE_ORS_API_KEY || "",
  // Which administrative boundary polygons the case maps draw.
  //   "minio" (default) the organization's own area data from the BFF, with
  //           polygon geometry fetched per area from object storage
  //           (see BOUNDARY_MINIO_BASE_URL below)
  //   "org"             the organization's own area data, with geometry from the
  //                     static TopoJSON files under public/geo/thailand
  //   "local"           the static Bangkok GeoJSON files under public/geo,
  //                     levelled province -> district -> subdistrict
  // Anything unrecognised resolves to "org", so an unset or mistyped value fails
  // towards real data rather than towards the fixtures.
  BOUNDARY_SOURCE: (import.meta.env.VITE_BOUNDARY_SOURCE === "local"
    ? "local"
    : import.meta.env.VITE_BOUNDARY_SOURCE === "minio"
      ? "minio"
      : "org") as BoundarySourceId,
  // Base URL of the boundary geometry bucket, INCLUDING bucket name and prefix.
  // Objects live at `${BASE}/{orgId}/{countryId}[/{provId}[/{distId}]].json.gz` -
  // the layout is encoded in minioBoundaryGeometry.ts, so only this one root is
  // configurable. Public read on the bucket; no credentials, no signing.
  //
  // NO FALLBACK ON PURPOSE. A per-environment bucket cannot have a safe default:
  // defaulting to the staging bucket would make a production deploy that forgot
  // this variable read staging geometry and look fine. Empty means "not
  // configured", and boundarySource.ts falls back to the static-geometry source
  // when it is empty.
  BOUNDARY_MINIO_BASE_URL: (import.meta.env.VITE_BOUNDARY_MINIO_BASE_URL || "").replace(/\/+$/, ""),
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
