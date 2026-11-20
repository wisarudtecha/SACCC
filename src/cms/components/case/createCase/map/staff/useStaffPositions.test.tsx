// @vitest-environment jsdom
// The staff roster's safety-net poll is the only timer in this hook that costs a
// network request, and Phase C3 made it configurable. These tests pin the three
// decisions that are invisible in code review and expensive in production:
//
//   D6  `manual` sets NO timer (one request per open case, per interval, forever)
//   D7  `auto` below 30s is raised to 30s (the schema accepts 15s; the server
//       was not sized for it)
//   C3  a hidden tab stops the poll entirely
//
// A regression here looks like "the dashboard is a bit chatty", which is exactly
// why it needs a test rather than a comment.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutoManualSetting } from "@/core/types/organization";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  tracking: { mode: "auto", autoIntervalSeconds: 60 } as AutoManualSetting,
  isVisible: true,
}));

vi.mock("@/cms/store/api/dispatch", () => ({
  useGetUnitQuery: () => ({
    data: { data: [] },
    isFetching: false,
    isError: false,
    isSuccess: true,
    refetch: mocks.refetch,
  }),
}));

vi.mock("@/core/components/websocket/websocket", () => ({
  useWebSocket: () => ({ onMessage: () => () => {} }),
}));

vi.mock("@/cms/components/admin/system-configuration/settings/useOrgMapSettings", () => ({
  useOrgMapSettings: () => ({ loaded: { staff: { tracking: mocks.tracking } } }),
}));

vi.mock("@/core/hooks/useDocumentVisible", () => ({
  useDocumentVisible: () => mocks.isVisible,
}));

import { useStaffPositions } from "./useStaffPositions";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;

function Probe(): React.ReactElement {
  useStaffPositions("case-1", true);
  return <span />;
}

function render(): void {
  const container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

/** Let `intervalMs` of fake time pass, inside act so state updates flush. */
function advance(intervalMs: number): void {
  act(() => {
    vi.advanceTimersByTime(intervalMs);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.refetch.mockClear();
  mocks.tracking = { mode: "auto", autoIntervalSeconds: 60 };
  mocks.isVisible = true;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  vi.useRealTimers();
});

describe("staff roster safety-net poll (Phase C3)", () => {
  it("polls at the configured interval under auto mode", () => {
    render();

    advance(59_000);
    expect(mocks.refetch).not.toHaveBeenCalled();

    advance(1_000);
    expect(mocks.refetch).toHaveBeenCalledTimes(1);

    advance(60_000);
    expect(mocks.refetch).toHaveBeenCalledTimes(2);
  });

  it("raises an interval below the 30s floor up to 30s (D7)", () => {
    mocks.tracking = { mode: "auto", autoIntervalSeconds: 15 };
    render();

    advance(29_000);
    expect(mocks.refetch).not.toHaveBeenCalled();

    advance(1_000);
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("sets no timer at all under manual mode (D6)", () => {
    mocks.tracking = { mode: "manual", autoIntervalSeconds: null };
    render();

    advance(10 * 60_000);

    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it("stops polling while the tab is hidden, and resumes when it is visible", () => {
    mocks.isVisible = false;
    render();

    advance(10 * 60_000);
    expect(mocks.refetch).not.toHaveBeenCalled();

    mocks.isVisible = true;
    act(() => {
      root?.render(<Probe />);
    });
    advance(60_000);

    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });
});
