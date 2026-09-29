import { describe, it, expect } from "vitest";
import { filterLinkableCases } from "./linkedCaseUtils";
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
