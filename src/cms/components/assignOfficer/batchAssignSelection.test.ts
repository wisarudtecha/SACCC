import { describe, expect, it } from "vitest";
import {
  MAX_BATCH_ASSIGN_OFFICERS,
  canSelectMore,
  isSelectAllDisabled,
  pruneSelection
} from "./batchAssignSelection";

describe("canSelectMore", () => {
  it("allows selecting while below the cap", () => {
    // Arrange / Act / Assert
    expect(canSelectMore(0)).toBe(true);
    expect(canSelectMore(MAX_BATCH_ASSIGN_OFFICERS - 1)).toBe(true);
  });

  it("blocks selecting once the cap is reached", () => {
    expect(canSelectMore(MAX_BATCH_ASSIGN_OFFICERS)).toBe(false);
    expect(canSelectMore(MAX_BATCH_ASSIGN_OFFICERS + 3)).toBe(false);
  });
});

describe("isSelectAllDisabled", () => {
  it("keeps Select All enabled while the list fits the cap", () => {
    expect(isSelectAllDisabled(0)).toBe(false);
    expect(isSelectAllDisabled(MAX_BATCH_ASSIGN_OFFICERS)).toBe(false);
  });

  it("disables Select All when the list exceeds the cap", () => {
    expect(isSelectAllDisabled(MAX_BATCH_ASSIGN_OFFICERS + 1)).toBe(true);
    expect(isSelectAllDisabled(50)).toBe(true);
  });
});

describe("pruneSelection", () => {
  it("keeps every selected id that is still selectable", () => {
    // Arrange
    const selected = ["a", "b", "c"];
    const available = new Set(["a", "b", "c", "d"]);
    // Act
    const pruned = pruneSelection(selected, available);
    // Assert
    expect(pruned).toEqual(["a", "b", "c"]);
  });

  it("returns empty selection when the list became empty", () => {
    expect(pruneSelection(["a", "b"], new Set())).toEqual([]);
  });

  it("drops selected staff who are no longer in the list", () => {
    // Arrange: "b" disappeared from the roster, "c" is new and unselected.
    const selected = ["a", "b"];
    const available = new Set(["a", "c"]);
    // Act
    const pruned = pruneSelection(selected, available);
    // Assert
    expect(pruned).toEqual(["a"]);
  });

  it("trims an over-cap selection back to the cap, keeping the earliest picks", () => {
    // Arrange
    const selected = ["a", "b", "c", "d", "e", "f", "g"];
    const available = new Set(["a", "b", "c", "d", "e", "f", "g"]);
    // Act
    const pruned = pruneSelection(selected, available);
    // Assert
    expect(pruned).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("prunes before trimming, so missing officers do not consume cap slots", () => {
    // Arrange: "x" and "y" are gone but still selected; the roster has 6.
    const selected = ["x", "y", "a", "b", "c", "d"];
    const available = new Set(["a", "b", "c", "d", "e", "f"]);
    // Act
    const pruned = pruneSelection(selected, available);
    // Assert: after pruning only 4 remain, so nothing is trimmed.
    expect(pruned).toEqual(["a", "b", "c", "d"]);
  });
});
