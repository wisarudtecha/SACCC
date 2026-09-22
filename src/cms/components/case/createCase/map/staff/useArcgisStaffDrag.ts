// Lets a dispatcher drag an officer's icon onto the case pin (ArcGIS).
//
// Three rules drive the design:
//
//   1. The drag START is decided synchronously. The map only stops panning if a
//      "drag" handler calls stopPropagation() in the same tick as the event, and
//      hitTest is async - so the officer under the pointer is found with the
//      layer's screen-space pick instead (see pickSingleStaffAt). A press that is
//      not on an allowed officer is left completely alone and pans as usual.
//   2. Nothing real moves. A ghost copy follows the pointer and is thrown away on
//      release; the officer marker and the case pin stay put, and this hook never
//      reports a location, so a drag can not change where the case is. The ghost,
//      Escape and the drop rule are shared with the other providers - see
//      staffDragSession.ts.
//   3. Dropping is judged against the case coordinate projected to pixels, not a
//      hitTest of the pin, so the same rule (isDropOnPin) works on every provider.
//
// Inert unless `draggableStaffIds` has someone in it.
import { useEffect, useRef } from "react";
import Point from "@arcgis/core/geometry/Point.js";
import type MapView from "@arcgis/core/views/MapView.js";
import type { MapLatLon } from "../mapTypes";
import { isDropOnPin } from "./assign/dropTarget";
import { startStaffDragSession, type StaffDragSession } from "./assign/staffDragSession";
import { getAvailabilityRgb, getStaffAvailability } from "./staffSymbols";
import type { StaffMarker } from "./staffTypes";

/** Minimal shape of the "drag" event we read - see the note in ArcgisAddressMap. */
interface ViewDragEventLike {
  action: "start" | "update" | "end";
  x: number;
  y: number;
  /** Where the pointer went DOWN; `x`/`y` on "start" are already a few px along. */
  origin?: { x: number; y: number };
  stopPropagation: () => void;
}

interface UseArcgisStaffDragOptions {
  viewRef: React.MutableRefObject<MapView | null>;
  /** True once the MapView has resolved; refs are only safe to use after this. */
  isReady: boolean;
  draggableStaffIds: ReadonlySet<string>;
  staff: readonly StaffMarker[];
  /** The case pin's coordinate - the drop target. */
  caseLocation: MapLatLon | null | undefined;
  pickSingleStaffAt: (x: number, y: number, allowedUnitIds: ReadonlySet<string>) => string | null;
  onDrop?: (unitId: string) => void;
}

export function useArcgisStaffDrag({
  viewRef,
  isReady,
  draggableStaffIds,
  staff,
  caseLocation,
  pickSingleStaffAt,
  onDrop
}: UseArcgisStaffDragOptions): void {
  // The handler is registered once per enable/disable, so it reads the changing
  // inputs through refs instead of being rebuilt (and dropping a drag) on every
  // staff poll.
  const draggableRef = useRef(draggableStaffIds);
  const staffRef = useRef(staff);
  const caseLocationRef = useRef(caseLocation);
  const pickRef = useRef(pickSingleStaffAt);
  const onDropRef = useRef(onDrop);
  draggableRef.current = draggableStaffIds;
  staffRef.current = staff;
  caseLocationRef.current = caseLocation;
  pickRef.current = pickSingleStaffAt;
  onDropRef.current = onDrop;

  const isEnabled = draggableStaffIds.size > 0;

  useEffect(() => {
    const view = viewRef.current;
    if (!isReady || !view || !isEnabled) {
      return;
    }

    // Held until the gesture's own "end", even after Escape has deactivated it:
    // the pointer is still down then, and the rest of the gesture must not fall
    // through to the map and start a pan half-way through.
    let session: StaffDragSession | null = null;

    const isOverPin = (x: number, y: number): boolean => {
      const location = caseLocationRef.current;
      if (!location) {
        return false;
      }
      const pin = view.toScreen(new Point({ latitude: location.latitude, longitude: location.longitude }));
      return pin ? isDropOnPin({ x, y }, { x: pin.x, y: pin.y }) : false;
    };

    const handle = view.on("drag", (event: ViewDragEventLike) => {
      if (event.action === "start") {
        const origin = event.origin ?? event;
        const unitId = pickRef.current(origin.x, origin.y, draggableRef.current);
        if (!unitId || !view.container) {
          return;
        }
        // Same tick as the event, or the map pans anyway.
        event.stopPropagation();

        const marker = staffRef.current.find((item) => item.unitId === unitId);
        session = startStaffDragSession({
          container: view.container,
          rgb: getAvailabilityRgb(
            getStaffAvailability(marker?.statusId ?? "", marker?.isLogin ?? false)
          ),
          unitId,
          isOverPin,
          onDrop: (droppedUnitId) => onDropRef.current?.(droppedUnitId)
        });
        session.move(event.x, event.y);
        return;
      }

      if (!session) {
        return;
      }
      event.stopPropagation();

      if (event.action === "update") {
        session.move(event.x, event.y);
        return;
      }
      session.end(event.x, event.y);
      session = null;
    });

    return () => {
      handle.remove();
      session?.cancel();
      session = null;
    };
  }, [isReady, isEnabled, viewRef]);
}
