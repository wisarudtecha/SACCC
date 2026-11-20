// The `assignmentMode[]` model: decode/normalize, editing, the "unknown entries must
// survive a Save" contract, and the validation rule that replaced the retired
// org-wide `assignmentRules.mode` check.
//
// The risk these pin down is silent data loss: the adapter replaces arrays wholesale,
// so anything that reads or rebuilds this array incorrectly deletes entries the
// client does not understand - with no error anywhere and no way to notice from the UI.
import { describe, expect, it } from "vitest";
import { DEFAULT_ROUTING_MODES } from "./orgAssignmentRules";
import {
  collectAssignmentModeSubTypeIds,
  decodeOrgAssignmentMode,
  encodeOrgAssignmentMode,
  getAssignmentModeForSubType,
  readUnknownAssignmentModeEntries,
  setAssignmentModeForSubType,
  validateAssignmentMode,
} from "./orgAssignmentMode";

describe("decodeOrgAssignmentMode", () => {
  it("groups the wire shape into one entry per stage and mode", () => {
    const decoded = decodeOrgAssignmentMode([
      { caseSubTypes: ["a", "b"], mode: "auto", type: "pic" },
      { caseSubTypes: ["c"], mode: "manual", type: "pic" },
      { caseSubTypes: ["d"], mode: "auto", type: "assignment" },
    ]);

    expect(decoded).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["a", "b"] },
      { type: "pic", mode: "manual", caseSubTypes: ["c"] },
      { type: "assignment", mode: "auto", caseSubTypes: ["d"] },
    ]);
  });

  it("returns an empty array for a missing or non-array value", () => {
    expect(decodeOrgAssignmentMode(undefined)).toEqual([]);
    expect(decodeOrgAssignmentMode(null)).toEqual([]);
    expect(decodeOrgAssignmentMode({})).toEqual([]);
    expect(decodeOrgAssignmentMode("auto")).toEqual([]);
  });

  it("skips entries with an unknown stage or mode", () => {
    const decoded = decodeOrgAssignmentMode([
      { caseSubTypes: ["a"], mode: "auto", type: "escalation" },
      { caseSubTypes: ["b"], mode: "automatic", type: "pic" },
      { caseSubTypes: ["c"], mode: "auto", type: "pic" },
      null,
      "junk",
    ]);

    expect(decoded).toEqual([{ type: "pic", mode: "auto", caseSubTypes: ["c"] }]);
  });

  it("keeps a sub-type in one mode only, last occurrence wins", () => {
    const decoded = decodeOrgAssignmentMode([
      { caseSubTypes: ["a"], mode: "auto", type: "pic" },
      { caseSubTypes: ["a"], mode: "manual", type: "pic" },
    ]);

    expect(decoded).toEqual([{ type: "pic", mode: "manual", caseSubTypes: ["a"] }]);
  });

  it("does not mix the same sub-type across stages", () => {
    const decoded = decodeOrgAssignmentMode([
      { caseSubTypes: ["a"], mode: "auto", type: "pic" },
      { caseSubTypes: ["a"], mode: "manual", type: "assignment" },
    ]);

    expect(decoded).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["a"] },
      { type: "assignment", mode: "manual", caseSubTypes: ["a"] },
    ]);
  });

  it("drops non-string sub-type ids", () => {
    const decoded = decodeOrgAssignmentMode([
      { caseSubTypes: ["a", 42, null, ""], mode: "auto", type: "pic" },
    ]);

    expect(decoded).toEqual([{ type: "pic", mode: "auto", caseSubTypes: ["a"] }]);
  });
});

describe("encodeOrgAssignmentMode", () => {
  it("re-normalizes so a caller cannot write duplicates", () => {
    const encoded = encodeOrgAssignmentMode([
      { type: "pic", mode: "auto", caseSubTypes: ["a"] },
      { type: "pic", mode: "auto", caseSubTypes: ["a", "b"] },
    ]);

    expect(encoded).toEqual([{ type: "pic", mode: "auto", caseSubTypes: ["a", "b"] }]);
  });

  it("drops an entry with no sub-types - that is the 'not set' state", () => {
    expect(encodeOrgAssignmentMode([{ type: "pic", mode: "auto", caseSubTypes: [] }])).toEqual(
      []
    );
  });
});

describe("readUnknownAssignmentModeEntries", () => {
  it("keeps entries whose stage or mode this client does not know", () => {
    const unknown = readUnknownAssignmentModeEntries([
      { caseSubTypes: ["a"], mode: "auto", type: "escalation" },
      { caseSubTypes: ["b"], mode: "semi-auto", type: "pic" },
      { caseSubTypes: ["c"], mode: "auto", type: "pic" },
    ]);

    expect(unknown).toEqual([
      { caseSubTypes: ["a"], mode: "auto", type: "escalation" },
      { caseSubTypes: ["b"], mode: "semi-auto", type: "pic" },
    ]);
  });

  it("drops values that are not objects at all", () => {
    expect(readUnknownAssignmentModeEntries([null, "junk", 7])).toEqual([]);
  });
});

describe("getAssignmentModeForSubType", () => {
  const entries = [{ type: "pic" as const, mode: "auto" as const, caseSubTypes: ["a"] }];

  it("returns the mode for a configured sub-type", () => {
    expect(getAssignmentModeForSubType(entries, "pic", "a")).toBe("auto");
  });

  it("returns null for an unconfigured sub-type or the other stage", () => {
    expect(getAssignmentModeForSubType(entries, "pic", "z")).toBeNull();
    expect(getAssignmentModeForSubType(entries, "assignment", "a")).toBeNull();
  });
});

describe("setAssignmentModeForSubType", () => {
  it("adds a new entry for a sub-type that was not set", () => {
    expect(setAssignmentModeForSubType([], "pic", "a", "auto")).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["a"] },
    ]);
  });

  it("moves a sub-type between modes instead of duplicating it", () => {
    const start = [{ type: "pic" as const, mode: "auto" as const, caseSubTypes: ["a", "b"] }];
    const next = setAssignmentModeForSubType(start, "pic", "a", "manual");

    expect(next).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["b"] },
      { type: "pic", mode: "manual", caseSubTypes: ["a"] },
    ]);
  });

  it("clears the entry, and drops the group once it is empty", () => {
    const start = [{ type: "pic" as const, mode: "auto" as const, caseSubTypes: ["a"] }];
    expect(setAssignmentModeForSubType(start, "pic", "a", null)).toEqual([]);
  });

  it("leaves the other stage untouched", () => {
    const start = [
      { type: "pic" as const, mode: "auto" as const, caseSubTypes: ["a"] },
      { type: "assignment" as const, mode: "manual" as const, caseSubTypes: ["a"] },
    ];
    const next = setAssignmentModeForSubType(start, "pic", "a", null);

    expect(next).toEqual([{ type: "assignment", mode: "manual", caseSubTypes: ["a"] }]);
  });
});

describe("collectAssignmentModeSubTypeIds", () => {
  it("lists every referenced id once, across stages", () => {
    const ids = collectAssignmentModeSubTypeIds([
      { type: "pic", mode: "auto", caseSubTypes: ["a", "b"] },
      { type: "assignment", mode: "manual", caseSubTypes: ["b", "c"] },
    ]);

    expect(ids).toEqual(["a", "b", "c"]);
  });
});

describe("validateAssignmentMode", () => {
  const noCriteria = DEFAULT_ROUTING_MODES; // every criterion false

  it("rejects any staging of auto when no routing criterion is selected", () => {
    const errors = validateAssignmentMode(
      [{ type: "assignment", mode: "auto", caseSubTypes: ["a"] }],
      noCriteria
    );

    expect(errors["assignmentMode"]).toBe(
      "settings.assignment.validation.no_criteria_selected"
    );
  });

  it("accepts auto once a criterion is selected", () => {
    expect(
      validateAssignmentMode(
        [{ type: "pic", mode: "auto", caseSubTypes: ["a"] }],
        { ...noCriteria, unitProperty: true }
      )
    ).toEqual({});
  });

  it("accepts a manual-only configuration with no criteria - that is a valid setup", () => {
    expect(
      validateAssignmentMode(
        [{ type: "pic", mode: "manual", caseSubTypes: ["a"] }],
        noCriteria
      )
    ).toEqual({});
  });

  it("accepts an unconfigured document", () => {
    expect(validateAssignmentMode([], noCriteria)).toEqual({});
  });
});
