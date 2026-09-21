import { describe, expect, it } from "vitest";
import {
  INITIAL_UNDO_STATE,
  UNDO_WINDOW_MS,
  getPendingUnitIds,
  undoReducer,
  type UndoAction,
  type UndoState
} from "./assignUndoModel";
import { getDragBlockReason, getDraggableUnitIds, type DragEligibilityContext } from "./dragEligibility";
import { PIN_DROP_RADIUS_PX, isDropOnPin } from "./dropTarget";
import type { StaffMarker } from "../staffTypes";

const NOW = Date.parse("2026-09-21T10:00:00Z");

function makeMarker(overrides: Partial<StaffMarker> = {}): StaffMarker {
  return {
    unitId: "u1",
    unitName: "Unit 1",
    username: "unit1",
    photo: "",
    statusId: "",
    isLogin: true,
    latitude: 13.7,
    longitude: 100.5,
    lastUpdateTime: new Date(NOW - 60_000).toISOString(),
    skills: [],
    bearing: null,
    speedKmh: null,
    accuracyMeters: null,
    gpsTime: "",
    ...overrides
  };
}

function makeContext(overrides: Partial<DragEligibilityContext> = {}): DragEligibilityContext {
  return {
    assignedUnitIds: new Set<string>(),
    pendingUnitIds: new Set<string>(),
    canAssign: true,
    nowMs: NOW,
    ...overrides
  };
}

function run(actions: readonly UndoAction[], from: UndoState = INITIAL_UNDO_STATE): UndoState {
  return actions.reduce(undoReducer, from);
}

describe("getDragBlockReason", () => {
  it("allows a logged-in officer with a fresh position", () => {
    expect(getDragBlockReason(makeMarker(), makeContext())).toBeNull();
  });

  it("blocks a logged-out officer", () => {
    expect(getDragBlockReason(makeMarker({ isLogin: false }), makeContext())).toBe("logged-out");
  });

  it("blocks an officer whose position is stale", () => {
    const stale = makeMarker({ lastUpdateTime: new Date(NOW - 10 * 60_000).toISOString() });
    expect(getDragBlockReason(stale, makeContext())).toBe("stale-location");
  });

  it("blocks an officer who never reported a position time", () => {
    expect(getDragBlockReason(makeMarker({ lastUpdateTime: "" }), makeContext())).toBe(
      "stale-location"
    );
  });

  it("blocks an officer already assigned to the case", () => {
    const context = makeContext({ assignedUnitIds: new Set(["u1"]) });
    expect(getDragBlockReason(makeMarker(), context)).toBe("already-assigned");
  });

  it("blocks an officer with a request or undo window still live", () => {
    const context = makeContext({ pendingUnitIds: new Set(["u1"]) });
    expect(getDragBlockReason(makeMarker(), context)).toBe("request-pending");
  });

  it("blocks everyone when the case cannot be assigned", () => {
    expect(getDragBlockReason(makeMarker(), makeContext({ canAssign: false }))).toBe(
      "assign-not-allowed"
    );
  });
});

describe("getDraggableUnitIds", () => {
  it("keeps only the eligible officers", () => {
    const markers = [
      makeMarker({ unitId: "ok" }),
      makeMarker({ unitId: "out", isLogin: false }),
      makeMarker({ unitId: "done" })
    ];
    const context = makeContext({ assignedUnitIds: new Set(["done"]) });
    expect([...getDraggableUnitIds(markers, context)]).toEqual(["ok"]);
  });
});

describe("isDropOnPin", () => {
  const pin = { x: 100, y: 100 };

  it("accepts a drop on the anchor", () => {
    expect(isDropOnPin(pin, pin)).toBe(true);
  });

  it("accepts a drop exactly at the radius", () => {
    expect(isDropOnPin({ x: 100 + PIN_DROP_RADIUS_PX, y: 100 }, pin)).toBe(true);
  });

  it("rejects a drop beyond the radius", () => {
    expect(isDropOnPin({ x: 100 + PIN_DROP_RADIUS_PX + 1, y: 100 }, pin)).toBe(false);
  });

  it("measures diagonally, not per axis", () => {
    const corner = { x: 100 + PIN_DROP_RADIUS_PX, y: 100 + PIN_DROP_RADIUS_PX };
    expect(isDropOnPin(corner, pin)).toBe(false);
  });
});

describe("undoReducer", () => {
  const started: UndoAction = { type: "assign-started", unitId: "u1", unitName: "Unit 1" };

  it("starts an entry in the assigning state with no deadline", () => {
    expect(run([started])).toEqual([
      { unitId: "u1", unitName: "Unit 1", status: "assigning", expiresAtMs: null }
    ]);
  });

  it("ignores a second start for the same officer", () => {
    expect(run([started, started])).toHaveLength(1);
  });

  it("opens the undo window from the moment the assignment succeeds", () => {
    const state = run([started, { type: "assign-succeeded", unitId: "u1", nowMs: NOW }]);
    expect(state[0]).toMatchObject({ status: "assigned", expiresAtMs: NOW + UNDO_WINDOW_MS });
  });

  it("removes the entry when the assignment fails", () => {
    expect(run([started, { type: "assign-failed", unitId: "u1" }])).toEqual([]);
  });

  it("tracks several officers independently", () => {
    const state = run([
      started,
      { type: "assign-started", unitId: "u2", unitName: "Unit 2" },
      { type: "assign-succeeded", unitId: "u2", nowMs: NOW },
      { type: "assign-failed", unitId: "u1" }
    ]);
    expect(state.map((entry) => entry.unitId)).toEqual(["u2"]);
  });

  it("expires an assigned entry once its deadline has passed", () => {
    const state = run([
      started,
      { type: "assign-succeeded", unitId: "u1", nowMs: NOW },
      { type: "expired", unitId: "u1", nowMs: NOW + UNDO_WINDOW_MS }
    ]);
    expect(state).toEqual([]);
  });

  it("does not expire an entry before its deadline", () => {
    const state = run([
      started,
      { type: "assign-succeeded", unitId: "u1", nowMs: NOW },
      { type: "expired", unitId: "u1", nowMs: NOW + UNDO_WINDOW_MS - 1 }
    ]);
    expect(state).toHaveLength(1);
  });

  it("does not expire an entry that is still assigning", () => {
    const state = run([started, { type: "expired", unitId: "u1", nowMs: NOW + 99_999 }]);
    expect(state).toHaveLength(1);
  });

  it("keeps an entry that is undoing when a stale expiry timer fires", () => {
    const state = run([
      started,
      { type: "assign-succeeded", unitId: "u1", nowMs: NOW },
      { type: "undo-started", unitId: "u1" },
      { type: "expired", unitId: "u1", nowMs: NOW + UNDO_WINDOW_MS }
    ]);
    expect(state[0]?.status).toBe("undoing");
  });

  it("removes the entry once the undo succeeds", () => {
    const state = run([
      started,
      { type: "assign-succeeded", unitId: "u1", nowMs: NOW },
      { type: "undo-started", unitId: "u1" },
      { type: "undo-succeeded", unitId: "u1" }
    ]);
    expect(state).toEqual([]);
  });

  it("returns to assigned, with the same deadline, when the undo fails", () => {
    const state = run([
      started,
      { type: "assign-succeeded", unitId: "u1", nowMs: NOW },
      { type: "undo-started", unitId: "u1" },
      { type: "undo-failed", unitId: "u1" }
    ]);
    expect(state[0]).toMatchObject({ status: "assigned", expiresAtMs: NOW + UNDO_WINDOW_MS });
  });

  it("cannot start an undo before the assignment has succeeded", () => {
    const state = run([started, { type: "undo-started", unitId: "u1" }]);
    expect(state[0]?.status).toBe("assigning");
  });

  it("does not mutate the previous state", () => {
    const before = run([started]);
    const snapshot = JSON.stringify(before);
    undoReducer(before, { type: "assign-succeeded", unitId: "u1", nowMs: NOW });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("getPendingUnitIds", () => {
  it("lists every officer with a live entry", () => {
    const state = run([
      { type: "assign-started", unitId: "u1", unitName: "Unit 1" },
      { type: "assign-started", unitId: "u2", unitName: "Unit 2" }
    ]);
    expect([...getPendingUnitIds(state)].sort()).toEqual(["u1", "u2"]);
  });
});
