// Wiring test for the assignment picker's capability gates.
//
// The pure rules live in `officerColumns.test.ts`; this file exists to prove the modal
// actually ASKS them - that the resolved column list drives the header and the rows, and
// that an unentitled tenant sees the single lock notice instead of an ETA/TTL column. A
// column list that is computed but not rendered would pass the pure tests and still ship
// the original bug.
//
// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Unit } from "@/cms/types/dispatch";

const entitlementState = vi.hoisted(() => ({ hasGis: false }));
// `.env` in this repo ships VITE_SHOW_ENTITLEMENT_UPSELL="false", so the real flag
// module resolves to false under vitest too. Both states matter here: the flag decides
// whether the missing column is ANNOUNCED, never whether it is missing.
const upsellState = vi.hoisted(() => ({ enabled: true }));
const settingsState = vi.hoisted(() => ({
  showWorkload: true,
  showAssignedCases: true,
  enableRecommendRanking: true,
  etaTtlInPicker: true,
}));

vi.mock("@/core/config/featureFlags", () => ({
  get ENTITLEMENT_UPSELL_ENABLED() {
    return upsellState.enabled;
  },
  CASE_IOT_ENABLED: true,
}));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

// `hasFeature` is the fail-closed read the modal is required to use.
vi.mock("@/core/hooks/useEntitlements", () => ({
  useEntitlements: () => ({
    hasFeature: () => entitlementState.hasGis,
    isLocked: () => !entitlementState.hasGis,
    isLoading: false,
    status: "ready",
  }),
}));

vi.mock(
  "@/cms/components/admin/system-configuration/settings/useOrgMapSettings",
  async () => {
    const { buildDefaultOrgMapSettings } = await import("@/cms/utils/orgMapSettings");
    const defaults = buildDefaultOrgMapSettings("org-1");
    return {
      useOrgMapSettings: () => ({
        loaded: {
          ...defaults,
          assignment: settingsState,
          staff: {
            ...defaults.staff,
            etaTtl: {
              ...defaults.staff.etaTtl,
              applyToAssignmentPicker: settingsState.etaTtlInPicker,
            },
          },
        },
        isLoading: false,
        isMock: false,
        isSaving: false,
        save: async () => ({ ok: true }),
      }),
    };
  }
);

// The roster query: one officer with a mappable position, so the only reason ETA/TTL
// could disappear is the entitlement gate.
const OFFICER = {
  unitId: "unit-1",
  unitName: "Officer One",
  username: "officer.one",
  deptId: "dept-1",
  sttId: "status-1",
  isLogin: true,
  locLat: "13.7563",
  locLon: "100.5018",
  locLastUpdateTime: new Date().toISOString(),
  skillLists: [],
} as unknown as Unit;

vi.mock("@/cms/store/api/dispatch", () => ({
  useGetUnitQuery: () => ({
    data: { data: [OFFICER] },
    isLoading: false,
    error: undefined,
    refetch: () => {},
  }),
}));

import AssignOfficerModal from "./singleAssignOfficer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ETA_TTL_HEADER = "case.assign_officer_modal.eta_ttl";
const WORKLOAD_HEADER = "case.assign_officer_modal.workloads";
const LOCK_SUBTITLE = "entitlement.locked.subtitle";

let container: HTMLDivElement;
let root: Root;

function renderModal(): ReactNode {
  return (
    <AssignOfficerModal
      open
      onOpenChange={() => {}}
      caseId="case-1"
      onAssign={() => {}}
      caseData={{ caseLat: "13.75", caseLon: "100.52" } as never}
      sopUnitLists={[]}
    />
  );
}

const mount = async () => {
  await act(async () => {
    root.render(renderModal());
  });
};

/** Rendered text, header included - the lock block lives in a portal on document.body. */
const pageText = () => document.body.textContent ?? "";

beforeEach(() => {
  entitlementState.hasGis = false;
  upsellState.enabled = true;
  settingsState.showWorkload = true;
  settingsState.showAssignedCases = true;
  settingsState.enableRecommendRanking = true;
  settingsState.etaTtlInPicker = true;
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  document.body.innerHTML = "";
});

describe("AssignOfficerModal — GIS entitlement", () => {
  it("hides the ETA/TTL column and shows one lock notice for a tenant without GIS", async () => {
    await mount();

    expect(pageText()).not.toContain(ETA_TTL_HEADER);
    // Still an officer table: the non-GIS columns must survive.
    expect(pageText()).toContain(WORKLOAD_HEADER);
    // `entitlement.locked.subtitle` is the shared lock block copy, rendered exactly once.
    expect(pageText().split(LOCK_SUBTITLE)).toHaveLength(2);
  });

  it("renders the ETA/TTL column and no lock notice for an entitled tenant", async () => {
    entitlementState.hasGis = true;
    await mount();

    expect(pageText()).toContain(ETA_TTL_HEADER);
    expect(pageText()).not.toContain(LOCK_SUBTITLE);
  });

  it("still hides the column, with no notice, when the upsell flag is off", async () => {
    // The flag removes the announcement, not the gate: an unentitled tenant never gets
    // the column, whether or not the product is advertising the add-on.
    upsellState.enabled = false;
    entitlementState.hasGis = false;
    await mount();

    expect(pageText()).not.toContain(ETA_TTL_HEADER);
    expect(pageText()).not.toContain(LOCK_SUBTITLE);
  });

  it("drops the ETA/TTL column when the org turned it off for the picker, entitled or not", async () => {
    entitlementState.hasGis = true;
    settingsState.etaTtlInPicker = false;
    await mount();

    expect(pageText()).not.toContain(ETA_TTL_HEADER);
    // Entitled, so nothing to upsell - the column is simply not offered.
    expect(pageText()).not.toContain(LOCK_SUBTITLE);
  });

  it("honours the workload / assigned-cases / Recommend switches", async () => {
    settingsState.showWorkload = false;
    settingsState.showAssignedCases = false;
    settingsState.enableRecommendRanking = false;
    await mount();

    const text = pageText();
    expect(text).not.toContain(WORKLOAD_HEADER);
    expect(text).not.toContain("case.assign_officer_modal.assigned_cases");
    expect(text).not.toContain("case.assign_officer_modal.recommend_button");
  });
});
