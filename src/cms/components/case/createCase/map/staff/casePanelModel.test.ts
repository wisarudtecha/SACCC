import { describe, expect, it } from "vitest";
import type { CaseSopUnit } from "@/cms/types/dispatch";
import {
  buildUserNameIndex,
  canFocusResponder,
  collectFramePoints,
  dedupeDispatchers,
  getResponderLabel,
  resolveFocusTarget,
  resolveUserLabel
} from "./casePanelModel";
import type { StaffMarker } from "./staffTypes";

function makeUnit(overrides: Partial<CaseSopUnit> = {}): CaseSopUnit {
  return {
    unitId: "u1",
    username: "alice.u",
    firstName: "Alice",
    lastName: "Anderson",
    createdBy: "dispatcher.a",
    statusId: "s1",
    ...overrides
  };
}

function makeMarker(unitId: string, latitude: number, longitude: number): StaffMarker {
  return {
    unitId,
    unitName: unitId,
    username: unitId,
    photo: "",
    statusId: "",
    isLogin: true,
    latitude,
    longitude,
    lastUpdateTime: "",
    skills: [],
    bearing: null,
    speedKmh: null,
    accuracyMeters: null,
    gpsTime: ""
  };
}

describe("dedupeDispatchers", () => {
  it("returns each assigner once, in first-seen order", () => {
    const units = [
      makeUnit({ unitId: "u1", createdBy: "b" }),
      makeUnit({ unitId: "u2", createdBy: "a" }),
      makeUnit({ unitId: "u3", createdBy: "b" })
    ];

    expect(dedupeDispatchers(units)).toEqual(["b", "a"]);
  });

  it("skips blank assigners", () => {
    const units = [makeUnit({ createdBy: "" }), makeUnit({ unitId: "u2", createdBy: "  " })];

    expect(dedupeDispatchers(units)).toEqual([]);
  });

  it("returns an empty list when nobody is assigned", () => {
    expect(dedupeDispatchers([])).toEqual([]);
  });
});

describe("resolveUserLabel", () => {
  const index = buildUserNameIndex([
    { username: "a", displayName: "Alice A." },
    { username: "b", displayName: "", firstName: "Bob", lastName: "Brown" },
    { username: "c", displayName: "", firstName: "", lastName: "" }
  ]);

  it("prefers the display name", () => {
    expect(resolveUserLabel("a", index)).toBe("Alice A.");
  });

  it("falls back to first and last name", () => {
    expect(resolveUserLabel("b", index)).toBe("Bob Brown");
  });

  it("falls back to the username when the user has no name", () => {
    expect(resolveUserLabel("c", index)).toBe("c");
  });

  it("falls back to the username when the user is unknown", () => {
    expect(resolveUserLabel("ghost", index)).toBe("ghost");
  });
});

describe("getResponderLabel", () => {
  it("joins first and last name", () => {
    expect(getResponderLabel(makeUnit())).toBe("Alice Anderson");
  });

  it("falls back to the username, then the unit id", () => {
    expect(getResponderLabel(makeUnit({ firstName: "", lastName: "" }))).toBe("alice.u");
    expect(getResponderLabel(makeUnit({ firstName: "", lastName: "", username: "" }))).toBe("u1");
  });
});

describe("resolveFocusTarget", () => {
  const staff = [makeMarker("u1", 13.7, 100.5)];

  it("returns the position of a mapped unit", () => {
    expect(resolveFocusTarget("u1", staff)).toEqual({ latitude: 13.7, longitude: 100.5 });
  });

  it("returns null for a unit with no marker", () => {
    expect(resolveFocusTarget("u2", staff)).toBeNull();
  });
});

describe("collectFramePoints", () => {
  const incident = { latitude: 13.0, longitude: 100.0 };
  const staff = [
    makeMarker("u1", 13.1, 100.1),
    makeMarker("u2", 13.2, 100.2),
    makeMarker("u3", 13.9, 100.9)
  ];

  it("frames the incident and every assigned responder", () => {
    const points = collectFramePoints(incident, new Set(["u1", "u2"]), staff, "u1");

    expect(points).toEqual([
      { latitude: 13.0, longitude: 100.0 },
      { latitude: 13.1, longitude: 100.1 },
      { latitude: 13.2, longitude: 100.2 }
    ]);
  });

  it("leaves out staff who are not assigned", () => {
    const points = collectFramePoints(incident, new Set(["u1"]), staff, "u1");

    expect(points).toHaveLength(2);
    expect(points).not.toContainEqual({ latitude: 13.9, longitude: 100.9 });
  });

  it("always includes the focused responder", () => {
    const points = collectFramePoints(incident, new Set(), staff, "u3");

    expect(points).toContainEqual({ latitude: 13.9, longitude: 100.9 });
  });

  it("skips an assigned responder with no position on the map", () => {
    const points = collectFramePoints(incident, new Set(["u1", "ghost"]), staff, "u1");

    expect(points).toHaveLength(2);
  });

  it("returns nothing without an incident location", () => {
    expect(collectFramePoints(null, new Set(["u1"]), staff, "u1")).toEqual([]);
    expect(collectFramePoints(undefined, new Set(["u1"]), staff, "u1")).toEqual([]);
  });
});

describe("canFocusResponder", () => {
  const staff = [makeMarker("u1", 13.7, 100.5)];

  it("is optimistic while the staff list is not loaded", () => {
    expect(canFocusResponder("u9", [], false)).toBe(true);
  });

  it("is true for a mapped unit once loaded", () => {
    expect(canFocusResponder("u1", staff, true)).toBe(true);
  });

  it("is false for a unit missing from a loaded list", () => {
    expect(canFocusResponder("u9", staff, true)).toBe(false);
  });
});
