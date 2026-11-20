// The hierarchy + segmented control that replaced the flat Select table.
//
// Three things are worth pinning, because all three are silent when wrong:
//   1. the grouping is by CASE TYPE (that is the whole point of the hierarchy);
//   2. collapsing a group is a view concern - it must not touch the stored entries;
//   3. the stage control is a real radiogroup (one selection, arrow keys, roving
//      tabindex) and writing one stage never disturbs the other.
//
// @vitest-environment jsdom
import { useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssignmentModeEntry } from "@/core/types/organization";
import { AssignmentModeTable } from "./AssignmentModeTable";

vi.mock("@/core/hooks/useTranslation", () => ({
  // Returning the key makes every label/aria-label assertable without a catalog.
  useTranslation: () => ({ t: (key: string) => key, language: "en" }),
}));

vi.mock("@/cms/store/api/serviceApi", () => ({
  useGetCaseTypesSubTypesQuery: () => ({
    data: {
      data: [
        {
          typeId: "type-fire",
          en: "Fire",
          th: "ไฟ",
          sTypeId: "st-alarm",
          sTypeCode: "101",
          subTypeEn: "Alarm",
          subTypeTh: "แจ้งเหตุ",
        },
        {
          typeId: "type-fire",
          en: "Fire",
          th: "ไฟ",
          sTypeId: "st-smoke",
          sTypeCode: "102",
          subTypeEn: "Smoke",
          subTypeTh: "ควัน",
        },
        {
          typeId: "type-flood",
          en: "Flood",
          th: "น้ำท่วม",
          sTypeId: "st-water",
          sTypeCode: "201",
          subTypeEn: "Water",
          subTypeTh: "น้ำ",
        },
      ],
    },
    isLoading: false,
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PIC = "settings.assignment.mode_table.column_pic";
const ASSIGNMENT = "settings.assignment.mode_table.column_assignment";
const OPTION_NONE = "settings.assignment.mode_table.option_none";
const OPTION_AUTO = "settings.assignment.mode_table.option_auto";

let latest: AssignmentModeEntry[] = [];

function Harness({ initial }: { initial: AssignmentModeEntry[] }) {
  const [entries, setEntries] = useState<AssignmentModeEntry[]>(initial);
  latest = entries;
  return <AssignmentModeTable entries={entries} onChange={setEntries} />;
}

let container: HTMLDivElement;
let root: Root;

const mount = async (initial: AssignmentModeEntry[] = []) => {
  latest = initial;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<Harness initial={initial} />);
  });
};

const radiogroupFor = (rowLabel: string, stageKey: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(`[role="radiogroup"][aria-label="${rowLabel} - ${stageKey}"]`);

const radioByLabel = (group: HTMLElement | null, optionKey: string): HTMLButtonElement | null => {
  if (!group) return null;
  return (
    Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
      (radio) => (radio.textContent ?? "").trim() === optionKey
    ) ?? null
  );
};

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  latest = [];
});

describe("AssignmentModeTable hierarchy", () => {
  it("groups the sub-types under their case type", async () => {
    await mount();

    const text = container.textContent ?? "";
    expect(text).toContain("Fire");
    expect(text).toContain("Flood");
    expect(text).toContain("101-Alarm");
    expect(text).toContain("201-Water");
  });

  it("collapses a group without touching the stored entries", async () => {
    const initial: AssignmentModeEntry[] = [
      { type: "pic", mode: "auto", caseSubTypes: ["st-alarm"] },
    ];
    await mount(initial);

    const fireToggle = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[aria-expanded]")
    ).find((button) => (button.textContent ?? "").includes("Fire"));
    expect(fireToggle).toBeDefined();
    expect(fireToggle?.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      fireToggle?.click();
    });

    expect(fireToggle?.getAttribute("aria-expanded")).toBe("false");
    // The child rows are gone from the DOM...
    expect(container.textContent).not.toContain("101-Alarm");
    // ...but the data is untouched.
    expect(latest).toEqual(initial);
  });

  it("renders a radiogroup per stage, with exactly one option checked", async () => {
    await mount([{ type: "pic", mode: "auto", caseSubTypes: ["st-alarm"] }]);

    const picGroup = radiogroupFor("101-Alarm", PIC);
    expect(picGroup).not.toBeNull();
    expect(picGroup?.querySelectorAll('[role="radio"]').length).toBe(3);
    expect(radioByLabel(picGroup, OPTION_AUTO)?.getAttribute("aria-checked")).toBe("true");
    expect(radioByLabel(picGroup, OPTION_NONE)?.getAttribute("aria-checked")).toBe("false");

    // The other stage of the same row is untouched and starts unset.
    const assignmentGroup = radiogroupFor("101-Alarm", ASSIGNMENT);
    expect(radioByLabel(assignmentGroup, OPTION_NONE)?.getAttribute("aria-checked")).toBe("true");
  });
});

describe("AssignmentModeTable editing", () => {
  it("writes one stage and leaves the other stage alone", async () => {
    await mount();

    const assignmentGroup = radiogroupFor("101-Alarm", ASSIGNMENT);
    await act(async () => {
      radioByLabel(assignmentGroup, OPTION_AUTO)?.click();
    });

    expect(latest).toEqual([
      { type: "assignment", mode: "auto", caseSubTypes: ["st-alarm"] },
    ]);

    const picGroup = radiogroupFor("101-Alarm", PIC);
    await act(async () => {
      radioByLabel(picGroup, OPTION_AUTO)?.click();
    });

    // Normalized order is by stage (pic, then assignment) - stable across saves.
    expect(latest).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["st-alarm"] },
      { type: "assignment", mode: "auto", caseSubTypes: ["st-alarm"] },
    ]);
  });

  it("clears a mode back to 'not set'", async () => {
    await mount([{ type: "pic", mode: "auto", caseSubTypes: ["st-alarm"] }]);

    await act(async () => {
      radioByLabel(radiogroupFor("101-Alarm", PIC), OPTION_NONE)?.click();
    });

    expect(latest).toEqual([]);
  });

  it("moves the selection with the arrow keys (radiogroup behaviour)", async () => {
    await mount();

    const picGroup = radiogroupFor("101-Alarm", PIC);
    expect(picGroup).not.toBeNull();

    await act(async () => {
      picGroup?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });

    // Not set -> Auto is the next option in the group.
    expect(latest).toEqual([{ type: "pic", mode: "auto", caseSubTypes: ["st-alarm"] }]);
  });
});
