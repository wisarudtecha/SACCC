// The provider switch: renders whichever map SDK this session uses.
//
// The provider is no longer a build-time constant - an org may override
// `VITE_MAP_PROVIDER` (Map Settings -> Map Provider) - but it is still resolved
// ONCE per session by `mapRuntimeConfig`, and that is deliberate: swapping the
// provider mid-session unmounts the MapView and throws away pan/zoom plus any
// uncommitted sketch or pin.
//
// All three implementations stay LAZY and are chosen at render time. That keeps
// the code-splitting property this file has always had: an environment that
// picks one SDK never downloads the other two (@arcgis/core alone is the larger
// part of this app's JavaScript). Do NOT turn these into static imports.
//
// While the configuration is still unsettled the map renders its placeholder
// rather than drawing with the deployment default and re-rendering later - the
// second render would be the remount described above.
import { Suspense, lazy, memo, useEffect } from "react";
import { EntitlementGate } from "@/core/components/entitlements/EntitlementGate";
import type { MapProviderId } from "@/core/config/api";
import type { AddressMapProps } from "./mapTypes";
import { registerMountedMap } from "./mapRuntimeConfig";
import { useMapRuntimeConfig } from "./useMapRuntimeConfig";

const ArcgisMap = lazy(() => import("./ArcgisAddressMap"));
const LongdoMap = lazy(() => import("./longdo/LongdoAddressMap"));
const MapTilerMap = lazy(() => import("./maptiler/MapTilerAddressMap"));

/**
 * Pick the implementation for `provider`.
 *
 * A plain function returning an element, not a component: a component created
 * here would be a new type on every render and remount the map. A `switch` (not
 * an index into a Record) keeps each branch typed against its own component.
 */
function renderAddressMapFor(provider: MapProviderId, props: AddressMapProps) {
  switch (provider) {
    case "longdo":
      return <LongdoMap {...props} />;
    case "maptiler":
      return <MapTilerMap {...props} />;
    case "arcgis":
    default:
      return <ArcgisMap {...props} />;
  }
}

/**
 * Placeholder while the configuration settles or the implementation chunk loads.
 *
 * Sized from the same `height` the map will take, so the surrounding form does
 * not jump when it arrives - the maps are 220-320px inline and most of the
 * viewport when expanded, which is far too much reflow to absorb silently.
 */
function MapPlaceholder({ height }: { height: number | string }) {
  return (
    <div
      className="animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
      style={{ height }}
    />
  );
}

function AddressMapBase(props: AddressMapProps) {
  const { provider, settled, allowMapStyleChange } = useMapRuntimeConfig();
  const placeholderHeight = props.height ?? 360;

  // Tell the store a provider switch is on screen: a settings save must not swap
  // the provider under a live MapView (it would remount and lose pan/zoom plus any
  // uncommitted sketch or pin). See applyMapRuntimeConfig.
  useEffect(() => registerMountedMap(), []);

  return (
    // GIS is an Enterprise add-on (CC-GIS): unentitled tenants get the lock
    // panel, and the lazy map SDK chunk is never requested for them.
    <EntitlementGate
      feature="entitlement.gis"
      loadingFallback={<MapPlaceholder height={placeholderHeight} />}
    >
      {settled ? (
        <Suspense fallback={<MapPlaceholder height={placeholderHeight} />}>
          {/* B7: the org setting "Change Map Style" decides whether the basemap
              switcher is offered. Resolved here rather than at every call site
              because no caller passes `showBasemapSwitcher` - the prop stays for
              a surface that needs to force it. */}
          {renderAddressMapFor(provider, {
            ...props,
            showBasemapSwitcher: props.showBasemapSwitcher ?? allowMapStyleChange,
          })}
        </Suspense>
      ) : (
        <MapPlaceholder height={placeholderHeight} />
      )}
    </EntitlementGate>
  );
}

export const AddressMap = memo(AddressMapBase);
AddressMap.displayName = "AddressMap";

export default AddressMap;
