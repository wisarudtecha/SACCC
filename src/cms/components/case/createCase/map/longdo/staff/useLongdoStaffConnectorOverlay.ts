// Draws the straight dashed staff -> incident lines on a Longdo map.
//
// The counterpart of useStaffConnectorLayer (ArcGIS), in the shape of
// useLongdoBreadcrumbOverlay: dashed, non-interactive, never touching the camera.
// Unlike the breadcrumb there are several lines (one per staff member), so the
// overlays are tracked per unitId and DIFFED, the way useLongdoStaffOverlays does
// its markers: what left or moved is removed, what is new is added, and what is
// unchanged is left alone - a position refresh that moved nobody rebuilds nothing.
//
// The lines are NOT routes - straight, no road network, nothing solved.
import { useEffect, useRef } from "react";
import type { MapLatLon, StaffConnector } from "../../mapTypes";
import { CONNECTOR_TOKENS } from "../../staff/connectorSymbols";
import type { LongdoGlobal, LongdoMap, LongdoOverlay } from "../longdoApi";

interface UseLongdoStaffConnectorOverlayOptions {
  longdoRef: React.MutableRefObject<LongdoGlobal | null>;
  mapRef: React.MutableRefObject<LongdoMap | null>;
  isReady: boolean;
  connectors: readonly StaffConnector[];
  /** The incident pin every line ends at. Nothing is drawn without it. */
  incident: MapLatLon | null | undefined;
  visible: boolean;
  isDarkTheme: boolean;
}

interface DrawnConnector {
  overlay: LongdoOverlay;
  /** What the line was drawn from; a different signature means it has to be redrawn. */
  signature: string;
}

function toCssColor(rgb: readonly [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function lineSignature(connector: StaffConnector, incident: MapLatLon, isDarkTheme: boolean): string {
  return [
    connector.longitude,
    connector.latitude,
    incident.longitude,
    incident.latitude,
    isDarkTheme ? "d" : "l"
  ].join(",");
}

export function useLongdoStaffConnectorOverlay({
  longdoRef,
  mapRef,
  isReady,
  connectors,
  incident,
  visible,
  isDarkTheme
}: UseLongdoStaffConnectorOverlayOptions): void {
  const drawnRef = useRef<Map<string, DrawnConnector>>(new Map());

  useEffect(() => {
    const longdo = longdoRef.current;
    const map = mapRef.current;
    if (!isReady || !longdo || !map) {
      return;
    }

    const drawn = drawnRef.current;
    const wanted = visible && incident ? connectors : [];
    const wantedIds = new Set(wanted.map((connector) => connector.unitId));

    // Remove what is gone.
    drawn.forEach((entry, unitId) => {
      if (!wantedIds.has(unitId)) {
        map.Overlays.remove(entry.overlay);
        drawn.delete(unitId);
      }
    });

    if (!incident) {
      return;
    }

    const color = toCssColor(
      isDarkTheme ? CONNECTOR_TOKENS.darkRgb : CONNECTOR_TOKENS.lightRgb,
      CONNECTOR_TOKENS.alpha
    );

    wanted.forEach((connector) => {
      const signature = lineSignature(connector, incident, isDarkTheme);
      const existing = drawn.get(connector.unitId);
      if (existing?.signature === signature) {
        return;
      }
      // Moved, recoloured or new: an overlay's geometry is not reassigned in
      // place on this SDK, so replace it.
      if (existing) {
        map.Overlays.remove(existing.overlay);
      }
      const overlay = new longdo.Polyline(
        [
          { lon: connector.longitude, lat: connector.latitude },
          { lon: incident.longitude, lat: incident.latitude }
        ],
        {
          lineColor: color,
          lineWidth: CONNECTOR_TOKENS.width,
          lineStyle: longdo.LineStyle.Dashed,
          // Non-interactive by construction, so it can never take a click meant
          // for the map or for a marker it passes under.
          clickable: false,
          pointer: false
        }
      );
      map.Overlays.add(overlay);
      drawn.set(connector.unitId, { overlay, signature });
    });
  }, [longdoRef, mapRef, isReady, connectors, incident, visible, isDarkTheme]);

  // Drop every line when this hook goes away. The ref is read IN the cleanup
  // because the map is built asynchronously and is still null when the first
  // effect runs.
  useEffect(() => {
    const drawn = drawnRef.current;
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      drawn.forEach((entry) => map?.Overlays.remove(entry.overlay));
      drawn.clear();
    };
  }, [mapRef]);
}
