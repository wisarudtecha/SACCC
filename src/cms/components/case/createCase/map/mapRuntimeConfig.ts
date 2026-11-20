// The runtime map configuration: which provider actually draws, plus the
// org-level basemap/style knobs (Phase A of
// docs/ORG-SETTINGS-Runtime-Wiring-Plan.md).
//
// WHY A MODULE STORE AND NOT A HOOK: three call sites have no React context to
// read from - `basemaps.ts` (module-scope basemap catalogue + preference key),
// `routeService.ts` (the lazy paid-service loader) and `AddressMap.tsx` (which
// must know the provider BEFORE it renders a component). A hook cannot answer
// any of them.
//
// THE PROVIDER IS RESOLVED ONCE PER SESSION (decision D1/§2.2 of the plan).
// A provider change unmounts and remounts the whole MapView, which throws away
// pan/zoom plus any uncommitted sketch or pin - so this store settles once and
// then refuses to change, except across a tenant switch (logout -> login, where
// no map is mounted anyway).
//
// PURE MODULE: no SDK import, no React import, so it can be read from anywhere.
import { API_CONFIG, type MapProviderId } from "@/core/config/api";

/**
 * Why the effective provider is not the one the org asked for.
 *
 * Deliberately NO "not-entitled" member (decision D16): entitlement is answered
 * at the chokepoint by `EntitlementGate` in `AddressMap` / `DispatchHeatmap` /
 * `CaseAreaChoroplethMap`, and the Map Settings form itself is already inside
 * that gate - so a "not-entitled" reason would have no surface to be shown on.
 */
export type MapProviderFallbackReason = "not-configured" | "unsupported" | null;

export interface MapRuntimeConfig {
  /** The provider that actually draws (already fallen back). */
  provider: MapProviderId;
  /** What the org asked for, verbatim. null = the org never chose one. */
  requestedProvider: string | null;
  /** null = the org's choice was honoured (or none was made - see the reason below). */
  fallbackReason: MapProviderFallbackReason;
  /** The deployment default (`VITE_MAP_PROVIDER`), i.e. what a fallback lands on. */
  deploymentDefaultProvider: MapProviderId;
  /**
   * The org's default basemap, verbatim. NOT validated here: which ids exist is
   * a property of the provider catalogue, and importing that would make
   * `basemaps.ts` (which reads this store) and this module import each other.
   * Consumers validate with `isSupportedBasemapId` before use (Phase B).
   */
  basemapId: string | null;
  /** Whether the on-map basemap switcher is offered. */
  allowMapStyleChange: boolean;
  /** Org the configuration was resolved for; null before login. */
  orgId: string | null;
  /**
   * False until a decision has been taken. Maps render a placeholder while it is
   * false: rendering first and swapping the provider afterwards is exactly the
   * mid-session remount this store exists to prevent.
   */
  settled: boolean;
}

/** Raw values off the settings document - strings, because the store is a trust boundary. */
export interface MapRuntimeConfigInput {
  orgId: string;
  requestedProvider: string | null;
  basemapId: string | null;
  allowMapStyleChange: boolean;
}

const SUPPORTED_PROVIDERS: readonly MapProviderId[] = ["arcgis", "longdo", "maptiler"];

function isMapProviderId(value: string): value is MapProviderId {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Can this build actually draw with `provider`?
 *
 * A provider without its key renders a blank map, not a degraded one, so an org
 * that picked it would be left with a broken case form. ArcGIS is the exception
 * and counts as available: its basemap styles service degrades to the legacy
 * well-known ids (`createFallbackBasemap` in arcgisBasemaps.ts), which need no
 * key - only the premium geocode/route calls do.
 */
function isProviderUsable(provider: MapProviderId): boolean {
  switch (provider) {
    case "longdo":
      return Boolean(API_CONFIG.LONGDO_API_KEY);
    case "maptiler":
      return Boolean(API_CONFIG.MAPTILER_API_KEY);
    case "arcgis":
    default:
      return true;
  }
}

function buildInitialState(): MapRuntimeConfig {
  return {
    provider: API_CONFIG.MAP_PROVIDER,
    requestedProvider: null,
    fallbackReason: null,
    deploymentDefaultProvider: API_CONFIG.MAP_PROVIDER,
    basemapId: null,
    allowMapStyleChange: true,
    orgId: null,
    settled: false,
  };
}

let state: MapRuntimeConfig = buildInitialState();

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Current configuration. Identity is stable between changes (required by useSyncExternalStore). */
export function getMapRuntimeConfig(): MapRuntimeConfig {
  return state;
}

export function subscribeMapRuntimeConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function resolve(input: MapRuntimeConfigInput): MapRuntimeConfig {
  const deploymentDefaultProvider = API_CONFIG.MAP_PROVIDER;
  const base = {
    requestedProvider: input.requestedProvider,
    basemapId: input.basemapId,
    allowMapStyleChange: input.allowMapStyleChange,
    deploymentDefaultProvider,
    orgId: input.orgId,
    settled: true,
  };

  const requested = input.requestedProvider;
  if (requested === null || requested === "") {
    return { ...base, provider: deploymentDefaultProvider, fallbackReason: "not-configured" };
  }
  if (!isMapProviderId(requested) || !isProviderUsable(requested)) {
    return { ...base, provider: deploymentDefaultProvider, fallbackReason: "unsupported" };
  }
  return { ...base, provider: requested, fallbackReason: null };
}

function isSameConfig(a: MapRuntimeConfig, b: MapRuntimeConfig): boolean {
  return (
    a.provider === b.provider &&
    a.requestedProvider === b.requestedProvider &&
    a.fallbackReason === b.fallbackReason &&
    a.basemapId === b.basemapId &&
    a.allowMapStyleChange === b.allowMapStyleChange &&
    a.orgId === b.orgId &&
    a.settled === b.settled
  );
}

/**
 * Settle the configuration for `orgId`. Called once per session by
 * `MapRuntimeConfigBootstrap`; a repeat for the SAME org is ignored (with a dev
 * warning, because it means a second writer exists).
 *
 * A different org replaces the state on purpose: carrying tenant A's provider -
 * or its basemap preference - into tenant B's session is exactly what the
 * org-scoped storage key exists to prevent. No map is mounted across a login
 * boundary, so this cannot remount a live one.
 *
 * A repeat that resolves to the values already in force is a no-op and stays
 * silent: the bootstrap legitimately re-runs when the settings document refetches
 * (e.g. after an admin save), which is not a second writer.
 */
export function setMapRuntimeConfig(input: MapRuntimeConfigInput): void {
  const next = resolve(input);
  if (state.settled && state.orgId === input.orgId) {
    if (isSameConfig(state, next)) {
      return;
    }
    if (import.meta.env.DEV) {
      console.warn(
        "[mapRuntimeConfig] ignored a changed configuration for org",
        input.orgId,
        "- the provider is resolved once per session on purpose (see the file header)."
      );
    }
    return;
  }
  state = next;
  emit();
}

/**
 * Settle with the deployment default because nobody is signed in.
 *
 * Must be called (not merely implied): while `settled` is false every map renders
 * a placeholder, so a path that never settles is a map that never appears.
 */
export function settleMapRuntimeConfigWithDefaults(): void {
  if (state.settled && state.orgId === null) {
    return;
  }
  state = { ...buildInitialState(), settled: true };
  emit();
}

/**
 * How many provider switches are mounted right now.
 *
 * The only reason this store needs to know: `applyMapRuntimeConfig` must not swap
 * the provider under a live MapView. Counting is enough - the map surfaces are the
 * only writers of this number, and a stale count would only make an apply more
 * conservative (deferred), never less.
 */
let mountedMapCount = 0;

/**
 * Declare that a map surface (a provider switch, not a leaf marker layer) is
 * mounted. Returns the unregister function, so the usual call is:
 *
 *   useEffect(() => registerMountedMap(), []);
 */
export function registerMountedMap(): () => void {
  mountedMapCount += 1;
  return () => {
    mountedMapCount = Math.max(0, mountedMapCount - 1);
  };
}

export type MapRuntimeConfigApplyResult = "applied" | "deferred" | "unchanged";

/**
 * Apply the configuration from a JUST-SAVED settings document.
 *
 * This is the one way the "resolved once per session" rule is allowed to bend, and
 * it exists because an admin who saves "Map provider = Longdo" should not have to
 * reload the page to get it. Two guarantees keep it safe:
 *
 *   1. DEFERRED WHILE A MAP IS MOUNTED. Swapping the provider remounts the MapView
 *      and throws away pan/zoom plus any uncommitted sketch or pin - the exact
 *      reason the store resolves once. If a map is on screen, this returns
 *      "deferred" and the session keeps its current provider (the settings screen
 *      shows a note and a reload button for that case).
 *   2. NOT A GENERAL-PURPOSE SETTER. Only the Organization Settings save calls it.
 *      `setMapRuntimeConfig` keeps the once-per-session rule for every other
 *      caller.
 *
 * Callers must also reset `routeService` (see `applyMapSettingsToSession`), or the
 * map would draw with one provider while Calculate still calls the other.
 */
export function applyMapRuntimeConfig(
  input: MapRuntimeConfigInput
): MapRuntimeConfigApplyResult {
  if (mountedMapCount > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        "[mapRuntimeConfig] apply deferred: a map is mounted, so the provider stays as it is for this session."
      );
    }
    return "deferred";
  }

  const next = resolve(input);
  if (isSameConfig(state, next)) {
    return "unchanged";
  }
  state = next;
  emit();
  return "applied";
}

/** Test helper: drop everything back to "not settled yet". Never call from app code. */
export function resetMapRuntimeConfig(): void {
  state = buildInitialState();
  mountedMapCount = 0;
  emit();
}
