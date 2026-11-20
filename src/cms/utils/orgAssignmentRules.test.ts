// Defaults and the criterion check for the Assignment Rules sub-document.
//
// 2026-11-19 contract change (docs/ORG-SETTINGS-Assignment-Mode-Survey.md §1): the
// org-wide `mode` and four routing criteria were removed and `unitProperty` was
// added. The old "Automatic with no criterion is an error" suite lost its subject
// with `mode` (that rule returns in block 2, keyed on `assignmentMode[]`). What is
// still worth pinning is which keys count as a criterion - the checkbox group and
// that future rule both depend on the list, and a missing key there would silently
// make a criterion unsettable.
import { describe, expect, it } from "vitest";
import { DEFAULT_ROUTING_MODES, hasRoutingCriterion } from "./orgAssignmentRules";

describe("hasRoutingCriterion", () => {
  it("is false when every criterion is unselected", () => {
    expect(hasRoutingCriterion(DEFAULT_ROUTING_MODES)).toBe(false);
  });

  it("counts each of the four current criteria on its own", () => {
    const keys = ["skillBased", "availability", "areaBased", "unitProperty"] as const;

    keys.forEach((key) => {
      expect(hasRoutingCriterion({ ...DEFAULT_ROUTING_MODES, [key]: true })).toBe(true);
    });
  });

  it("does not mistake the combine modifier for a criterion", () => {
    // `combineWithAnd` describes HOW criteria combine - it is not one by itself.
    expect(hasRoutingCriterion({ ...DEFAULT_ROUTING_MODES, combineWithAnd: true })).toBe(false);
  });
});

