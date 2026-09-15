import { describe, expect, it } from "vitest";
import {
  compactCaseSummary,
  compactCaseSummaryByArea,
  compactTopOrdered,
} from "./compactAdapters";
import type { CaseSummaryData, CaseSummaryByAreaData, TopOrderedData, SlaData } from "@/core/components/custom-dashboard/sources/types";

describe("compactCaseSummary", () => {
  it("returns null for a mismatched kind", () => {
    const data = { kind: "sla" } as unknown as SlaData;
    expect(compactCaseSummary(data, "en")).toBeNull();
  });

  it("picks the bilingual title and total for the matching kind", () => {
    const data: CaseSummaryData = {
      kind: "case-summary",
      title: { en: "Cases", th: "เคส" },
      total: 42,
      groups: [],
    };
    expect(compactCaseSummary(data, "en")).toEqual({ label: "Cases", value: 42 });
    expect(compactCaseSummary(data, "th")).toEqual({ label: "เคส", value: 42 });
  });
});

describe("compactCaseSummaryByArea", () => {
  const rows: CaseSummaryByAreaData["rows"] = [
    { areaId: "a1", area: { en: "A1", th: "A1" }, distId: "a1", isTotal: false, groups: [], total: { new: 1, inprogress: 2, complete: 3 } },
    { areaId: "a2", area: { en: "A2", th: "A2" }, distId: "a2", isTotal: false, groups: [], total: { new: 4, inprogress: 0, complete: 1 } },
  ];

  it("uses the payload's Total row when present", () => {
    const data: CaseSummaryByAreaData = {
      kind: "case-summary-by-area",
      title: { en: "By Area", th: "By Area" },
      rows,
      total: { areaId: "total", area: { en: "Total", th: "Total" }, distId: null, isTotal: true, groups: [], total: { new: 10, inprogress: 5, complete: 5 } },
    };
    expect(compactCaseSummaryByArea(data, "en")?.value).toBe(20);
  });

  it("sums the rows itself when no Total row is present", () => {
    const data: CaseSummaryByAreaData = {
      kind: "case-summary-by-area",
      title: { en: "By Area", th: "By Area" },
      rows,
      total: undefined,
    };
    // (1+2+3) + (4+0+1) = 11
    expect(compactCaseSummaryByArea(data, "en")?.value).toBe(11);
  });
});

describe("compactTopOrdered", () => {
  it("returns null when there are no items", () => {
    const data: TopOrderedData = { kind: "top-ordered", items: [] };
    expect(compactTopOrdered(data, "en")).toBeNull();
  });

  it("returns the #1 ranked item", () => {
    const data: TopOrderedData = {
      kind: "top-ordered",
      items: [
        { rank: 1, name: { en: "Widget A", th: "Widget A" }, quantity: 12, price: 100 },
        { rank: 2, name: { en: "Widget B", th: "Widget B" }, quantity: 9, price: 50 },
      ],
    };
    expect(compactTopOrdered(data, "en")).toEqual({ label: "Widget A", value: 12 });
  });
});
