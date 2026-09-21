// State of the "assigned - undo?" popups, one entry per officer.
//
// A pure reducer so the timing rules are testable without React or a map:
//
//   assigning -> assigned (undo window open) -> gone (expired / undone)
//
// The countdown starts when the assignment SUCCEEDS, not at the drop - a slow API
// must not eat the window. Every timer-driven action carries `nowMs` and is
// checked against `expiresAtMs`, so a stale timer firing after the entry moved on
// (e.g. Undo already pressed) cannot remove the wrong state.
export const UNDO_WINDOW_MS = 3000;

export type UndoEntryStatus = "assigning" | "assigned" | "undoing";

export interface UndoEntry {
  unitId: string;
  unitName: string;
  status: UndoEntryStatus;
  /** Set once the assignment succeeded; null while it is still in flight. */
  expiresAtMs: number | null;
}

export type UndoAction =
  | { type: "assign-started"; unitId: string; unitName: string }
  | { type: "assign-succeeded"; unitId: string; nowMs: number }
  | { type: "assign-failed"; unitId: string }
  | { type: "undo-started"; unitId: string }
  | { type: "undo-succeeded"; unitId: string }
  | { type: "undo-failed"; unitId: string }
  | { type: "expired"; unitId: string; nowMs: number };

export type UndoState = readonly UndoEntry[];

export const INITIAL_UNDO_STATE: UndoState = [];

function updateEntry(
  state: UndoState,
  unitId: string,
  update: (entry: UndoEntry) => UndoEntry | null
): UndoState {
  return state.flatMap((entry) => {
    if (entry.unitId !== unitId) {
      return [entry];
    }
    const next = update(entry);
    return next ? [next] : [];
  });
}

export function undoReducer(state: UndoState, action: UndoAction): UndoState {
  switch (action.type) {
    case "assign-started":
      // One entry per officer; a second drag while one is live is ignored.
      if (state.some((entry) => entry.unitId === action.unitId)) {
        return state;
      }
      return [
        ...state,
        { unitId: action.unitId, unitName: action.unitName, status: "assigning", expiresAtMs: null }
      ];

    case "assign-succeeded":
      return updateEntry(state, action.unitId, (entry) =>
        entry.status === "assigning"
          ? { ...entry, status: "assigned", expiresAtMs: action.nowMs + UNDO_WINDOW_MS }
          : entry
      );

    case "assign-failed":
    case "undo-succeeded":
      return updateEntry(state, action.unitId, () => null);

    case "undo-started":
      return updateEntry(state, action.unitId, (entry) =>
        entry.status === "assigned" ? { ...entry, status: "undoing" } : entry
      );

    // The cancel did not go through, so the officer is still assigned. Reopen the
    // entry as "assigned"; the original deadline still applies.
    case "undo-failed":
      return updateEntry(state, action.unitId, (entry) =>
        entry.status === "undoing" ? { ...entry, status: "assigned" } : entry
      );

    case "expired":
      return updateEntry(state, action.unitId, (entry) => {
        const isDue = entry.expiresAtMs !== null && action.nowMs >= entry.expiresAtMs;
        return entry.status === "assigned" && isDue ? null : entry;
      });

    default:
      return state;
  }
}

/** Every officer with a live entry - they cannot be dragged again meanwhile. */
export function getPendingUnitIds(state: UndoState): Set<string> {
  return new Set(state.map((entry) => entry.unitId));
}
