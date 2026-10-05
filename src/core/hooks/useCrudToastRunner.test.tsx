// useCrudToastRunner tests — the extracted CRUD toast protocol shared by
// OrganizationManagement (6 handlers) and RoleManagement (2 handlers).
//
// addToast is injected, so a plain spy captures the contract with no
// ToastGlobal/context mocking. jsdom is only needed because the hook holds
// React state (useState) — no DOM APIs are exercised.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCrudToastRunner,
  type CrudToastRunConfig,
} from "./useCrudToastRunner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The BFF's HTTP-200 business-failure/success envelope shape. */
interface TestEnvelope {
  status?: string | boolean;
  desc?: string;
  msg?: string;
  data?: unknown;
}

function baseConfig(overrides: Partial<CrudToastRunConfig> = {}): CrudToastRunConfig {
  return {
    hasPermission: true,
    permissionDeniedMessage: "Permission denied",
    successMessage: "Saved successfully",
    errorPrefix: "Failed to save",
    unknownApiMessage: "Unknown API error",
    ...overrides,
  };
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function renderRunner(): {
  run: ReturnType<typeof useCrudToastRunner>["run"];
  getIsLoading: () => boolean;
  addToast: ReturnType<typeof vi.fn>;
} {
  const addToast = vi.fn();
  const runner = {} as { run: ReturnType<typeof useCrudToastRunner>["run"]; isLoading: boolean };

  function Harness() {
    const { run, isLoading } = useCrudToastRunner({ addToast });
    runner.run = run;
    runner.isLoading = isLoading;
    return null;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<Harness />);
  });

  return { run: runner.run, getIsLoading: () => runner.isLoading, addToast };
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("useCrudToastRunner — success path", () => {
  it("toasts success and returns the unwrapped response", async () => {
    const { run, addToast } = renderRunner();
    const response: TestEnvelope = { status: "1", data: { id: 7 } };

    let result: TestEnvelope | undefined;
    await act(async () => {
      result = await run(baseConfig(), async () => response);
    });

    expect(result).toBe(response);
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith("success", "Saved successfully");
  });

  it("runs onSuccess only on success, onSettled always", async () => {
    const { run, addToast } = renderRunner();
    const onSuccess = vi.fn();
    const onSettled = vi.fn();

    await act(async () => {
      await run(
        baseConfig({ onSuccess, onSettled }),
        async () => ({ status: false, desc: "nope" })
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith("error", "Failed to save: Error: nope");
  });
});

describe("useCrudToastRunner — failure paths", () => {
  it("surfaces the envelope desc as the error message on a conclusive failure", async () => {
    const { run, addToast } = renderRunner();

    let result: TestEnvelope | undefined;
    await act(async () => {
      // "-1" is the BFF's conclusive failure token (apiResponseStatus.ts).
      // Through hybridBaseQuery this would already reject at unwrap; the
      // branch still handles it defensively.
      result = await run(baseConfig(), async () => ({ status: "-1", desc: "duplicate name" }));
    });

    expect(result).toBeUndefined();
    expect(addToast).toHaveBeenCalledWith("error", "Failed to save: Error: duplicate name");
  });

  it("falls back to msg, then to unknownApiMessage", async () => {
    const { run, addToast } = renderRunner();

    await act(async () => {
      await run(baseConfig(), async () => ({ status: false, msg: "validation failed" }));
    });
    expect(addToast).toHaveBeenLastCalledWith("error", "Failed to save: Error: validation failed");

    await act(async () => {
      await run(baseConfig(), async () => ({ status: "failed" }));
    });
    expect(addToast).toHaveBeenLastCalledWith("error", "Failed to save: Error: Unknown API error");
  });

  it("treats canonical success tokens as success even when falsy (number 0)", async () => {
    // The inline code this hook replaces used a bare truthiness check, which
    // error-toasted the number 0 — a SUCCESS token per apiResponseStatus.ts.
    const { run, addToast } = renderRunner();

    await act(async () => {
      await run(baseConfig(), async () => ({ status: 0 }));
    });

    expect(addToast).toHaveBeenCalledWith("success", "Saved successfully");
    expect(addToast).not.toHaveBeenCalledWith("error", expect.anything());
  });

  it("resolves inconclusive statuses as success (readDeleteOutcome bias)", async () => {
    const { run, addToast } = renderRunner();
    const onSuccess = vi.fn();

    await act(async () => {
      // Number -1 is what normalizeToApiResponse substitutes when the server
      // omits status; unknown tokens ("1") are inconclusive too.
      await run(baseConfig({ onSuccess }), async () => ({ status: -1 }));
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    await act(async () => {
      await run(baseConfig(), async () => ({ status: "1" }));
    });
    expect(addToast).toHaveBeenLastCalledWith("success", "Saved successfully");
  });

  it("toasts permission denial without invoking the action", async () => {
    const { run, addToast } = renderRunner();
    const action = vi.fn();

    await act(async () => {
      await run(baseConfig({ hasPermission: false }), action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith("error", "Failed to save: Error: Permission denied");
  });

  it("catches a rejected mutation (RTK unwrap throw) as an error toast", async () => {
    const { run, addToast } = renderRunner();
    const onSuccess = vi.fn();

    await act(async () => {
      await run(
        baseConfig({ onSuccess }),
        async () => {
          throw new Error("network down");
        }
      );
    });

    expect(addToast).toHaveBeenCalledWith("error", "Failed to save: Error: network down");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useCrudToastRunner — loading lifecycle", () => {
  it("is loading only while the action is in flight, on both outcomes", async () => {
    const { run, getIsLoading } = renderRunner();

    expect(getIsLoading()).toBe(false);

    let resolveAction: (value: TestEnvelope) => void = () => undefined;
    const pending = run(baseConfig(), () => new Promise<TestEnvelope>((resolve) => {
      resolveAction = resolve;
    }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(getIsLoading()).toBe(true);

    await act(async () => {
      resolveAction({ status: "1" });
      await pending;
    });
    expect(getIsLoading()).toBe(false);

    // Failure outcome resets loading too.
    await act(async () => {
      await run(baseConfig(), async () => ({ status: "-1", desc: "x" }));
    });
    expect(getIsLoading()).toBe(false);
  });
});
