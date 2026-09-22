// Runs drag-to-assign for the case map: who may be dragged, what happens on a
// drop, and the short "undo?" window that follows.
//
// The timing rules live in assignUndoModel's reducer; this hook is the glue that
// calls the assignment API and turns its answers into reducer actions. It owns
// one timer per officer, so several can be assigned in a row, each with an undo
// window of its own.
//
// Nothing here touches the map: it produces a set of draggable ids and a list of
// entries, and the caller renders those however the provider needs.
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { StaffMarker } from "../staffTypes";
import {
  INITIAL_UNDO_STATE,
  UNDO_WINDOW_MS,
  getPendingUnitIds,
  undoReducer,
  type UndoEntry
} from "./assignUndoModel";
import { getDragBlockReason, getDraggableUnitIds } from "./dragEligibility";

const NO_DRAGGABLE_IDS: ReadonlySet<string> = new Set();

interface UseAssignUndoOptions {
  staff: readonly StaffMarker[];
  /** Off when the staff layer is hidden or the user lacks the assign permission. */
  isEnabled: boolean;
  assignedUnitIds: ReadonlySet<string>;
  canAssign: boolean;
  onAssignNow: (marker: StaffMarker) => Promise<boolean>;
  onUndoAssign: (marker: StaffMarker) => Promise<boolean>;
}

export interface UseAssignUndoResult {
  entries: readonly UndoEntry[];
  /** Officers a drag may start from right now. */
  draggableStaffIds: ReadonlySet<string>;
  handleDrop: (unitId: string) => void;
  handleUndo: (unitId: string) => void;
}

export function useAssignUndo({
  staff,
  isEnabled,
  assignedUnitIds,
  canAssign,
  onAssignNow,
  onUndoAssign
}: UseAssignUndoOptions): UseAssignUndoResult {
  const [entries, dispatch] = useReducer(undoReducer, INITIAL_UNDO_STATE);

  // Async handlers read the latest values through refs so they never act on a
  // stale closure after an await.
  const staffRef = useRef(staff);
  const entriesRef = useRef(entries);
  const assignedUnitIdsRef = useRef(assignedUnitIds);
  const canAssignRef = useRef(canAssign);
  const onAssignNowRef = useRef(onAssignNow);
  const onUndoAssignRef = useRef(onUndoAssign);
  staffRef.current = staff;
  entriesRef.current = entries;
  assignedUnitIdsRef.current = assignedUnitIds;
  canAssignRef.current = canAssign;
  onAssignNowRef.current = onAssignNow;
  onUndoAssignRef.current = onUndoAssign;

  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Set synchronously, unlike `entries` (which only updates on the next render),
  // so a second drop of the same officer in the same tick cannot slip past.
  const inFlightRef = useRef(new Set<string>());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const timers = timersRef.current;
    return () => {
      isMountedRef.current = false;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const clearTimer = useCallback((unitId: string) => {
    const timer = timersRef.current.get(unitId);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(unitId);
    }
  }, []);

  // Closes the undo window at `deadlineMs`. The reducer is handed the deadline
  // itself rather than the clock, so a timer that fires a millisecond early still
  // expires the entry.
  const scheduleExpiry = useCallback(
    (unitId: string, deadlineMs: number) => {
      clearTimer(unitId);
      const timer = setTimeout(() => {
        timersRef.current.delete(unitId);
        dispatch({ type: "expired", unitId, nowMs: deadlineMs });
      }, Math.max(0, deadlineMs - Date.now()));
      timersRef.current.set(unitId, timer);
    },
    [clearTimer]
  );

  const pendingUnitIds = useMemo(() => getPendingUnitIds(entries), [entries]);

  const draggableStaffIds = useMemo(
    () =>
      isEnabled
        ? getDraggableUnitIds(staff, { assignedUnitIds, pendingUnitIds, canAssign })
        : NO_DRAGGABLE_IDS,
    [isEnabled, staff, assignedUnitIds, pendingUnitIds, canAssign]
  );

  const runDrop = useCallback(
    async (unitId: string) => {
      const marker = staffRef.current.find((item) => item.unitId === unitId);
      if (!marker || inFlightRef.current.has(unitId)) {
        return;
      }
      // The world may have moved since the drag started (logged out, refetched,
      // assigned elsewhere): check again at the moment of the drop.
      const blockReason = getDragBlockReason(marker, {
        assignedUnitIds: assignedUnitIdsRef.current,
        pendingUnitIds: getPendingUnitIds(entriesRef.current),
        canAssign: canAssignRef.current
      });
      if (blockReason) {
        return;
      }

      inFlightRef.current.add(unitId);
      dispatch({ type: "assign-started", unitId, unitName: marker.unitName });

      let isAssigned = false;
      try {
        isAssigned = await onAssignNowRef.current(marker);
      }
      catch (error) {
        // The upstream handler reports failures itself; this only guards against
        // a rejection leaving the entry stuck in "assigning".
        console.error("Drag-and-drop assignment failed", error);
      }
      inFlightRef.current.delete(unitId);
      if (!isMountedRef.current) {
        return;
      }

      if (!isAssigned) {
        dispatch({ type: "assign-failed", unitId });
        return;
      }
      const succeededAtMs = Date.now();
      dispatch({ type: "assign-succeeded", unitId, nowMs: succeededAtMs });
      scheduleExpiry(unitId, succeededAtMs + UNDO_WINDOW_MS);
    },
    [scheduleExpiry]
  );

  const runUndo = useCallback(
    async (unitId: string) => {
      const entry = entriesRef.current.find((item) => item.unitId === unitId);
      const marker = staffRef.current.find((item) => item.unitId === unitId);
      if (!entry || entry.status !== "assigned" || entry.expiresAtMs === null || !marker) {
        return;
      }
      const { expiresAtMs } = entry;

      dispatch({ type: "undo-started", unitId });
      // Hold the window open while the cancel is in flight.
      clearTimer(unitId);

      let isUndone = false;
      try {
        isUndone = await onUndoAssignRef.current(marker);
      }
      catch (error) {
        console.error("Undoing the drag-and-drop assignment failed", error);
      }
      if (!isMountedRef.current) {
        return;
      }

      if (isUndone) {
        dispatch({ type: "undo-succeeded", unitId });
        return;
      }
      // Still assigned: let the original deadline run out, or close it now if it
      // already has.
      dispatch({ type: "undo-failed", unitId });
      scheduleExpiry(unitId, expiresAtMs);
    },
    [clearTimer, scheduleExpiry]
  );

  // Fire-and-forget for the callers (a map event, a button press): every failure
  // path is already handled inside, so nothing is left to await.
  const handleDrop = useCallback((unitId: string) => void runDrop(unitId), [runDrop]);
  const handleUndo = useCallback((unitId: string) => void runUndo(unitId), [runUndo]);

  return { entries, draggableStaffIds, handleDrop, handleUndo };
}
