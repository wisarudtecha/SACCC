// Lets a dispatcher drag an officer's icon onto the case pin (MapTiler / MapLibre).
//
// The counterpart of useArcgisStaffDrag, and it keeps its rules: the drag START
// is decided immediately, nothing real moves (a ghost follows the pointer; the
// ghost, Escape and the drop rule are shared - see staffDragSession.ts), and the
// drop is judged against the case coordinate projected to pixels.
//
// What differs is where the events come from, and three consequences:
//
//   1. Staff markers are DOM elements, so "which officer was pressed" is an
//      attribute lookup (`data-staff-unit-id`, set only on SINGLE officers - group
//      circles carry none, so they cannot be dragged). No screen-space pick.
//   2. Panning is stopped with `map.dragPan.disable()` on pointerdown, which
//      comes before the mousedown/touchstart MapLibre listens to. The press is
//      not preventDefault()ed: that risks suppressing the plain click that
//      selects an officer.
//   3. The drag must not depend on the marker ELEMENT. useMapTilerStaffOverlays
//      replaces an element whenever its appearance changes (a staff poll can do
//      that mid-drag), so there is no pointer capture: the move / up listeners
//      live on `window` and the drag remembers only the unitId.
//
// A press only becomes a drag after it moves past a small threshold; until then
// nothing is claimed, so a plain click still selects the officer.
import { useEffect, useRef } from "react";
import type { Map as MlMap } from "maplibre-gl";
import type { MapLatLon } from "../../mapTypes";
import { isDropOnPin } from "../../staff/assign/dropTarget";
import { hasMovedPastThreshold } from "../../staff/assign/dragThreshold";
import { startStaffDragSession, type StaffDragSession } from "../../staff/assign/staffDragSession";
import { getAvailabilityRgb, getStaffAvailability } from "../../staff/staffSymbols";
import type { StaffMarker } from "../../staff/staffTypes";

const STAFF_UNIT_SELECTOR = "[data-staff-unit-id]";

interface UseMapTilerStaffDragOptions {
  mapRef: React.MutableRefObject<MlMap | null>;
  isReady: boolean;
  draggableStaffIds: ReadonlySet<string>;
  staff: readonly StaffMarker[];
  /** The case pin's coordinate - the drop target. */
  caseLocation: MapLatLon | null | undefined;
  onDrop?: (unitId: string) => void;
}

interface Press {
  unitId: string;
  pointerId: number;
  /** Viewport pixels where the pointer went down. */
  startX: number;
  startY: number;
}

export function useMapTilerStaffDrag({
  mapRef,
  isReady,
  draggableStaffIds,
  staff,
  caseLocation,
  onDrop
}: UseMapTilerStaffDragOptions): void {
  // Registered once per enable/disable, so the changing inputs are read through
  // refs rather than rebuilding (and dropping a drag) on every staff poll.
  const draggableRef = useRef(draggableStaffIds);
  const staffRef = useRef(staff);
  const caseLocationRef = useRef(caseLocation);
  const onDropRef = useRef(onDrop);
  draggableRef.current = draggableStaffIds;
  staffRef.current = staff;
  caseLocationRef.current = caseLocation;
  onDropRef.current = onDrop;

  const isEnabled = draggableStaffIds.size > 0;

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || !isEnabled) {
      return;
    }
    const canvasContainer = map.getCanvasContainer();
    // The ghost lives here. Read once, because `map` loses its null-narrowing
    // inside the hoisted handler functions below.
    const mapContainer = map.getContainer();

    let press: Press | null = null;
    let session: StaffDragSession | null = null;
    let wasDragPanEnabled = false;
    let isSelectionLocked = false;
    let previousUserSelect = "";

    // Container-relative, which is what both `map.project` and the ghost use.
    const toContainerPoint = (clientX: number, clientY: number) => {
      const rect = canvasContainer.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const isOverPin = (x: number, y: number): boolean => {
      const location = caseLocationRef.current;
      if (!location) {
        return false;
      }
      const pin = map.project([location.longitude, location.latitude]);
      return isDropOnPin({ x, y }, { x: pin.x, y: pin.y });
    };

    // The browser fires one `click` on release after a drag; on an officer's
    // marker that would also SELECT them. Swallow that one click - and give up on
    // the next tick if none arrives, so an unrelated later click is never eaten.
    const swallowNextClick = () => {
      const swallow = (event: MouseEvent) => event.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    };

    // Undoes everything a press changed, whichever way it ended.
    const releasePress = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (wasDragPanEnabled) {
        map.dragPan.enable();
        // Reset so a later call (the effect cleanup, possibly after the map was
        // removed) does not touch a map this press is no longer holding.
        wasDragPanEnabled = false;
      }
      if (isSelectionLocked) {
        document.body.style.userSelect = previousUserSelect;
        isSelectionLocked = false;
      }
      press = null;
      session = null;
    };

    function handlePointerMove(event: PointerEvent) {
      if (!press || event.pointerId !== press.pointerId) {
        return;
      }
      if (!session) {
        const current = { x: event.clientX, y: event.clientY };
        if (!hasMovedPastThreshold({ x: press.startX, y: press.startY }, current)) {
          return;
        }
        const { unitId } = press;
        const marker = staffRef.current.find((item) => item.unitId === unitId);
        session = startStaffDragSession({
          container: mapContainer,
          rgb: getAvailabilityRgb(
            getStaffAvailability(marker?.statusId ?? "", marker?.isLogin ?? false)
          ),
          unitId,
          isOverPin,
          onDrop: (droppedUnitId) => onDropRef.current?.(droppedUnitId)
        });
        // Otherwise the page selects text under the pointer as it travels.
        previousUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        isSelectionLocked = true;
      }
      const point = toContainerPoint(event.clientX, event.clientY);
      session.move(point.x, point.y);
    }

    function handlePointerUp(event: PointerEvent) {
      if (!press || event.pointerId !== press.pointerId) {
        return;
      }
      const wasDragging = session !== null;
      if (session) {
        const point = toContainerPoint(event.clientX, event.clientY);
        session.end(point.x, point.y);
      }
      releasePress();
      if (wasDragging) {
        swallowNextClick();
      }
    }

    function handlePointerCancel(event: PointerEvent) {
      if (!press || event.pointerId !== press.pointerId) {
        return;
      }
      session?.cancel();
      releasePress();
    }

    const handlePointerDown = (event: PointerEvent) => {
      const isPrimaryPress = event.isPrimary && (event.pointerType !== "mouse" || event.button === 0);
      if (press || !isPrimaryPress || !(event.target instanceof Element)) {
        return;
      }
      const unitId = event.target.closest<HTMLElement>(STAFF_UNIT_SELECTOR)?.dataset.staffUnitId;
      if (!unitId || !draggableRef.current.has(unitId)) {
        // Not a draggable officer: leave the press to the map, which pans as usual.
        return;
      }
      press = {
        unitId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY
      };
      wasDragPanEnabled = map.dragPan.isEnabled();
      map.dragPan.disable();
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    };

    // Capture phase, so this sees the press before anything on the marker does.
    canvasContainer.addEventListener("pointerdown", handlePointerDown, { capture: true });

    return () => {
      canvasContainer.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      session?.cancel();
      releasePress();
    };
  }, [mapRef, isReady, isEnabled]);
}
