// @vitest-environment jsdom
// The ETA/TTL tick hook is three lines, but it is the seam where the wrong
// setting would be read: `routing`, `etaTtl` and `tracking` are all
// `AutoManualSetting`, so a copy-paste mistake type-checks perfectly and only
// shows up as "the countdown ignores what I configured".
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutoManualSetting } from "@/core/types/organization";

const mocks = vi.hoisted(() => ({
  etaTtl: { mode: "auto", autoIntervalSeconds: 60 } as AutoManualSetting,
}));

vi.mock("@/cms/components/admin/system-configuration/settings/useOrgMapSettings", () => ({
  useOrgMapSettings: () => ({
    loaded: {
      staff: {
        etaTtl: mocks.etaTtl,
        // Deliberately different values: reading the wrong sibling must fail.
        routing: { mode: "manual", autoIntervalSeconds: null },
        tracking: { mode: "auto", autoIntervalSeconds: 120 },
      },
    },
  }),
}));

import { useEtaTtlTickMs } from "./useEtaTtlTickMs";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement;

function Probe(): React.ReactElement {
  return <span>{String(useEtaTtlTickMs())}</span>;
}

function render(): string {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
  return container.textContent ?? "";
}

beforeEach(() => {
  mocks.etaTtl = { mode: "auto", autoIntervalSeconds: 60 };
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
});

describe("useEtaTtlTickMs", () => {
  it("reads the ETA/TTL setting, not a sibling staff setting", () => {
    expect(render()).toBe("60000");
  });

  it("falls back to the 30s tick under manual mode", () => {
    mocks.etaTtl = { mode: "manual", autoIntervalSeconds: null };

    expect(render()).toBe("30000");
  });
});
