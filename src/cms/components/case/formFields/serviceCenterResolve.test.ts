// Tests for the REQ 2 "Try Again" stub. See serviceCenterResolve.ts: until a
// real backend exists, this must always reject so useResolveServiceCenter's
// caller never overwrites the dispatcher's Service Center selection with a
// guess.
import { describe, it, expect } from "vitest";
import type { Area } from "@/cms/store/api/area";
import { stubResolveServiceCenter } from "./serviceCenterResolve";

const area = (overrides: Partial<Area>): Area => ({
  id: "area-1",
  orgId: "org-1",
  countryId: "TH",
  provId: "10",
  distId: "1001",
  districtEn: "Phra Nakhon",
  districtTh: "พระนคร",
  districtActive: true,
  provinceEn: "Bangkok",
  provinceTh: "กรุงเทพมหานคร",
  countryEn: "Thailand",
  countryTh: "ประเทศไทย",
  provinceActive: true,
  countryActive: true,
  ...overrides
});

describe("stubResolveServiceCenter", () => {
  it("rejects when there are no candidate areas", async () => {
    await expect(stubResolveServiceCenter([])).rejects.toThrow();
  });

  it("rejects even with populated candidate areas - no rule to prefer among them yet", async () => {
    await expect(
      stubResolveServiceCenter([area({ id: "A" }), area({ id: "B" })])
    ).rejects.toThrow();
  });
});
