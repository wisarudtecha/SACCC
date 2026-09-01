// The provider switch: renders whichever map SDK this environment is
// configured for (VITE_MAP_PROVIDER, resolved into API_CONFIG.MAP_PROVIDER).
//
// The two implementations are LAZY, and that is the point of this file rather
// than a ternary over two imports. Static imports would put both SDKs in the
// bundle - @arcgis/core is the larger part of this app's JavaScript, and an
// environment that chose Longdo should never download it.
//
// The choice is made once at module scope: it comes from build-time
// configuration, cannot change while the app is running, and doing it here
// means the unused implementation is never even requested.
import { Suspense, lazy, memo } from "react";
import { API_CONFIG } from "@/core/config/api";
import type { AddressMapProps } from "./mapTypes";

const ProviderMap =
  API_CONFIG.MAP_PROVIDER === "longdo"
    ? lazy(() => import("./longdo/LongdoAddressMap"))
    : lazy(() => import("./ArcgisAddressMap"));

/**
 * Placeholder while the implementation chunk loads.
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
  return (
    <Suspense fallback={<MapPlaceholder height={props.height ?? 360} />}>
      <ProviderMap {...props} />
    </Suspense>
  );
}

export const AddressMap = memo(AddressMapBase);
AddressMap.displayName = "AddressMap";

export default AddressMap;
