// Lets a dispatcher drag an officer's icon onto the case pin (Longdo).
//
// The counterpart of useMapTilerStaffDrag / useArcgisStaffDrag, and it keeps
// their rules: the drag START is decided immediately, nothing real moves (a
// ghost follows the pointer; the ghost, Escape and the drop rule are shared -
// see staffDragSession.ts), and the drop is judged against the case coordinate
// projected to pixels.
//
// What is different about Longdo, and why this is not a copy of the MapTiler one:
//
//   1. THERE IS NO PAN LOCK. MapLibre has dragPan.disable(); Longdo has nothing
//      comparable. Swallowing events in the MIDDLE of a gesture would be worse
//      than useless - the SDK would have seen "mouse down" and never see the
//      matching "up", and the map would keep panning after the button was
//      released. So the PRESS itself is blocked: the SDK never sees the gesture
//      begin, and there is no state of its own to get stuck.
//   2. The listeners sit on `window` in the CAPTURE phase, so they run before any
//      listener the SDK put on the map's own elements, whatever phase it used.
//   3. Because the SDK never sees the press it will not report `overlayClick`
//      for it, so a press that turns out to be a plain click is reported here
//      (`onSelect`). If the SDK does report one as well, the double selection is
//      harmless: selecting the same officer twice is a no-op.
//   4. Icons are plain DOM (verified - see longdo-spike.html) carrying
//      `data-staff-unit-id`, set only on SINGLE officers, so group circles are
//      undraggable and "which officer" is an attribute lookup.
//   5. The drag must not depend on the icon ELEMENT: useLongdoStaffOverlays
//      REPLACES an overlay whenever its appearance changes, so the move / up
//      listeners are on `window` and the drag remembers only the unitId.
//
// A press only becomes a drag after it moves past a small threshold.
import { useEffect, useRef } from "react";
import type { MapLatLon } from "../../mapTypes";
import { isDropOnPin } from "../../staff/assign/dropTarget";
import { hasMovedPastThreshold } from "../../staff/assign/dragThreshold";
import { startStaffDragSession, type StaffDragSession } from "../../staff/assign/staffDragSession";
import { getAvailabilityRgb, getStaffAvailability } from "../../staff/staffSymbols";
import type { StaffMarker, StaffSelection } from "../../staff/staffTypes";
import type { LongdoMap } from "../longdoApi";
import { screenFromLocation } from "../longdoGeometry";

const STAFF_UNIT_SELECTOR = "[data-staff-unit-id]";

interface UseLongdoStaffDragOptions {
  mapRef: React.MutableRefObject<LongdoMap | null>;
  /** The map's container: the ghost lives in it and pointer positions are relative to it. */
  containerRef: React.RefObject<HTMLElement | null>;
  isReady: boolean;
  draggableStaffIds: ReadonlySet<string>;
  staff: readonly StaffMarker[];
  /** The case pin's coordinate - the drop target. */
  caseLocation: MapLatLon | null | undefined;
  onDrop?: (unitId: string) => void;
  /** A press that never became a drag is a click on the officer. */
  onSelect?: (selection: StaffSelection) => void;
}

interface Press {
  unitId: string;
  pointerId: number;
  /** Viewport pixels where the pointer went down. */
  startX: number;
  startY: number;
}

export function useLongdoStaffDrag({
  mapRef,
  containerRef,
  isReady,
  draggableStaffIds,
  staff,
  caseLocation,
  onDrop,
  onSelect
}: UseLongdoStaffDragOptions): void {
  // Registered once per enable/disable, so the changing inputs are read through
  // refs rather than rebuilding (and dropping a drag) on every staff poll.
  const draggableRef = useRef(draggableStaffIds);
  const staffRef = useRef(staff);
  const caseLocationRef = useRef(caseLocation);
  const onDropRef = useRef(onDrop);
  const onSelectRef = useRef(onSelect);
  draggableRef.current = draggableStaffIds;
  staffRef.current = staff;
  caseLocationRef.current = caseLocation;
  onDropRef.current = onDrop;
  onSelectRef.current = onSelect;

  const isEnabled = draggableStaffIds.size > 0;

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!isReady || !map || !container || !isEnabled) {
      return;
    }
    // Read once, because these lose their null-narrowing inside the hoisted
    // handler functions below.
    const liveMap: LongdoMap = map;
    const liveContainer: HTMLElement = container;

    let press: Press | null = null;
    let session: StaffDragSession | null = null;
    let isSelectionLocked = false;
    let previousUserSelect = "";

    // Container-relative, which is what both `screenFromLocation` and the ghost use.
    const toContainerPoint = (clientX: number, clientY: number) => {
      const rect = liveContainer.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const isOverPin = (x: number, y: number): boolean => {
      const location = caseLocationRef.current;
      if (!location) {
        return false;
      }
      const pin = screenFromLocation(
        liveMap.bound(),
        liveContainer.getBoundingClientRect(),
        { lon: location.longitude, lat: location.latitude }
      );
      return pin ? isDropOnPin({ x, y }, pin) : false;
    };

    // The browser fires one `click` on release after a drag; on an officer's icon
    // that would also SELECT them. Swallow that one click - and give up on the
    // next tick if none arrives, so an unrelated later click is never eaten.
    const swallowNextClick = () => {
      const swallow = (event: MouseEvent) => event.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    };

    // The compatibility events for a press we own. pointerdown is blocked
    // directly; mousedown and touchstart are separate events that follow it, and
    // either could be what the SDK pans on, so both are held back while a press is
    // ours - and only then, so every other press reaches the map untouched.
    const blockCompatibilityPress = (event: Event) => {
      if (press) {
        event.stopPropagation();
      }
    };

    // Undoes everything a press changed, whichever way it ended.
    const releasePress = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
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
          container: liveContainer,
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
      const { unitId } = press;
      const wasDragging = session !== null;
      if (session) {
        const point = toContainerPoint(event.clientX, event.clientY);
        session.end(point.x, point.y);
      }
      releasePress();
      if (wasDragging) {
        swallowNextClick();
        return;
      }
      // Never became a drag: the click the SDK was not allowed to see.
      onSelectRef.current?.({ type: "staff", unitId });
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
      // The listener is on `window`, so anything on the page arrives here.
      if (!liveContainer.contains(event.target)) {
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
      // Held back from the SDK - see the header for why the PRESS is what is blocked.
      event.stopPropagation();
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    };

    // Capture phase on `window`: ahead of anything the SDK bound below it.
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("mousedown", blockCompatibilityPress, { capture: true });
    window.addEventListener("touchstart", blockCompatibilityPress, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("mousedown", blockCompatibilityPress, { capture: true });
      window.removeEventListener("touchstart", blockCompatibilityPress, { capture: true });
      session?.cancel();
      releasePress();
    };
  }, [mapRef, containerRef, isReady, isEnabled]);
}
