// src/cms/components/dashboard/map/heatmap/longdo/LongdoDispatchHeatmap.tsx
//
// Longdo fallback: no native heatmap primitive exists in longdoApi.ts, so
// density is approximated with overlapping semi-transparent marker blobs (see
// dispatchHeatmapMarkerStyle.ts). NOT built on LongdoAddressMap.tsx
// (case-creation-only machinery this feature needs none of).
import { useEffect, useRef, useState } from "react";
import { loadLongdo } from "@/cms/components/case/createCase/map/longdo/longdoSetup";
import { applyLongdoBasemap, toLongdoLanguage } from "@/cms/components/case/createCase/map/longdo/longdoBasemaps";
import { DEFAULT_BASEMAP_ID } from "@/cms/components/case/createCase/map/basemaps";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "@/cms/components/case/createCase/map/longdo/longdoApi";
import { dispatchHeatmapMarkerOptions } from "@/cms/components/dashboard/map/heatmap/longdo/dispatchHeatmapMarkerStyle";
import {
  DISPATCH_HEATMAP_DEFAULT_CENTER,
  DISPATCH_HEATMAP_DEFAULT_ZOOM,
  type DispatchHeatmapProviderMapProps,
} from "@/cms/components/dashboard/map/heatmap/dispatchHeatmapTypes";

const MAP_HEIGHT = 520;

export const LongdoDispatchHeatmap: React.FC<DispatchHeatmapProviderMapProps> = ({
  points,
  isDarkTheme,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const longdoRef = useRef<LongdoGlobal | null>(null);
  const mapRef = useRef<LongdoMap | null>(null);
  const overlaysRef = useRef<LongdoOverlay[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Build the map once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let isCancelled = false;

    loadLongdo()
      .then(longdo => {
        if (isCancelled) {
          return;
        }
        longdoRef.current = longdo;
        const map = new longdo.Map({
          placeholder: container,
          location: { lon: DISPATCH_HEATMAP_DEFAULT_CENTER[0], lat: DISPATCH_HEATMAP_DEFAULT_CENTER[1] },
          zoom: DISPATCH_HEATMAP_DEFAULT_ZOOM,
          language: toLongdoLanguage(language),
        });
        mapRef.current = map;
        applyLongdoBasemap(longdo, map, DEFAULT_BASEMAP_ID, isDarkTheme);
        setIsReady(true);
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to initialise the Longdo dispatch heatmap", error);
        }
      });

    return () => {
      isCancelled = true;
      const disposable = mapRef.current as unknown as { destroy?: () => void; remove?: () => void } | null;
      if (typeof disposable?.destroy === "function") {
        disposable.destroy();
      }
      else if (typeof disposable?.remove === "function") {
        disposable.remove();
      }
      container.innerHTML = "";
      mapRef.current = null;
      longdoRef.current = null;
    };
    // Build-once: theme/language changes are not re-applied to a live map
    // here since this map has no toggle for either while mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the case points - rebuilt each time, per the SDK's "options are fixed
  // at construction" rule (see useLongdoBoundaryOverlays.ts's header).
  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    overlaysRef.current.forEach(overlay => map.Overlays.remove(overlay));
    overlaysRef.current = [];

    const created: LongdoOverlay[] = points.map(point =>
      new longdo.Marker(
        { lon: point.lon, lat: point.lat },
        dispatchHeatmapMarkerOptions(point.weight, isDarkTheme)
      )
    );
    created.forEach(overlay => map.Overlays.add(overlay));
    overlaysRef.current = created;
  }, [points, isReady, isDarkTheme]);

  return <div ref={containerRef} style={{ height: MAP_HEIGHT }} className="w-full rounded-lg" />;
};

export default LongdoDispatchHeatmap;
