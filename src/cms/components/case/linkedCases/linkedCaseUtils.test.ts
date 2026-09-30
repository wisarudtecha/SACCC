import { describe, it, expect } from "vitest";
import { filterLinkableCases, partitionLinkedCaseResults } from "./linkedCaseUtils";
import type { Case } from "@/cms/store/api/caseApi";

const makeCase = (caseId: string): Case => ({ caseId }) as Case;

describe("filterLinkableCases", () => {
    it("removes cases whose id is in excludeIds", () => {
        const cases = [makeCase("A"), makeCase("B"), makeCase("C")];
        expect(filterLinkableCases(cases, ["B"]).map((c) => c.caseId)).toEqual(["A", "C"]);
    });

    it("returns everything when excludeIds is empty", () => {
        const cases = [makeCase("A"), makeCase("B")];
        expect(filterLinkableCases(cases, [])).toHaveLength(2);
    });

    it("ignores empty-string entries in excludeIds", () => {
        const cases = [makeCase("A")];
        expect(filterLinkableCases(cases, [""])).toHaveLength(1);
    });

    it("handles an empty case list", () => {
        expect(filterLinkableCases([], ["A"])).toEqual([]);
    });

    it("removes multiple excluded ids", () => {
        const cases = [makeCase("A"), makeCase("B"), makeCase("C"), makeCase("D")];
        expect(filterLinkableCases(cases, ["A", "D"]).map((c) => c.caseId)).toEqual(["B", "C"]);
    });
});

describe("partitionLinkedCaseResults", () => {
    type Settled = Parameters<typeof partitionLinkedCaseResults>[1];
    const makeSop = (caseId: string) => ({ data: { caseId, caseDetail: "d", statusId: "S001", priority: 1, createdDate: "2026-09-30", createdBy: "u" } });
    const ids = ["A", "B", "C"];

    it("returns all cases when every fetch succeeds", () => {
        const results = [
            { status: "fulfilled", value: makeSop("A") },
            { status: "fulfilled", value: makeSop("B") },
            { status: "fulfilled", value: makeSop("C") },
        ] as Settled;
        const { loaded, failedIds } = partitionLinkedCaseResults(ids, results);
        expect(loaded.map((c) => c.caseId)).toEqual(["A", "B", "C"]);
        expect(failedIds).toEqual([]);
    });

    it("keeps rejected fetches as failedIds in their original positions", () => {
        const results = [
            { status: "fulfilled", value: makeSop("A") },
            { status: "rejected", reason: new Error("not found") },
            { status: "fulfilled", value: makeSop("C") },
        ] as Settled;
        const { loaded, failedIds } = partitionLinkedCaseResults(ids, results);
        expect(loaded.map((c) => c.caseId)).toEqual(["A", "C"]);
        expect(failedIds).toEqual(["B"]);
    });

    it("treats a fulfilled fetch with no data as failed", () => {
        const results = [
            { status: "fulfilled", value: { data: undefined } },
        ] as Settled;
        const { loaded, failedIds } = partitionLinkedCaseResults(["X"], results);
        expect(loaded).toEqual([]);
        expect(failedIds).toEqual(["X"]);
    });
});
