import { describe, expect, it } from "vitest";
import type { UnitWorkload } from "@/cms/types/unitWorkload";
import { compareWorkloadRank, getWorkloadRank } from "./workloadRank";

function makeWorkload(unitId: string, activeCaseCount: number, caseCount = activeCaseCount): UnitWorkload {
  return {
    unitId,
    activeCaseCount,
    cases: Array.from({ length: caseCount }, (_, index) => ({ caseId: `${unitId}-${index}` }))
  };
}

const rankIds = (entries: Record<string, UnitWorkload>, ids: string[]) =>
  [...ids].sort((a, b) => compareWorkloadRank(getWorkloadRank(entries[a]), getWorkloadRank(entries[b])));

describe("workload rank", () => {
  it("orders by active case count, least loaded first", () => {
    const entries = { a: makeWorkload("a", 3), b: makeWorkload("b", 0), c: makeWorkload("c", 1) };

    expect(rankIds(entries, ["a", "b", "c"])).toEqual(["b", "c", "a"]);
  });

  it("breaks a load tie by the length of the case list", () => {
    const entries = { a: makeWorkload("a", 2, 4), b: makeWorkload("b", 2, 1) };

    expect(rankIds(entries, ["a", "b"])).toEqual(["b", "a"]);
  });

  it("ranks an officer with no workload entry after everyone with one", () => {
    const entries = { a: makeWorkload("a", 9) };

    expect(rankIds(entries, ["missing", "a"])).toEqual(["a", "missing"]);
  });

  it("treats two unranked officers as equal, never NaN", () => {
    const missing = getWorkloadRank(undefined);

    expect(compareWorkloadRank(missing, missing)).toBe(0);
  });

  it("keeps the original order for an exact tie", () => {
    const entries = { a: makeWorkload("a", 1), b: makeWorkload("b", 1) };

    expect(rankIds(entries, ["b", "a"])).toEqual(["b", "a"]);
  });
});
