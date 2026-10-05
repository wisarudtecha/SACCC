// CRUD mutation runner with toast feedback — extracted from the inline
// try/catch/finally blocks that OrganizationManagement and RoleManagement
// repeated per handler (permission gate → RTK mutation `.unwrap()` →
// envelope status check → success/error toast → loading state).
//
// `addToast` is INJECTED rather than pulled from a context on purpose: the
// extracting components render their own local `ToastContainer`
// (`useToast()` + `<ToastContainer />`), so the hook must feed *their*
// channel, not the global one. This also keeps the hook unit-testable with a
// plain spy (same design as useDashboardLayoutActions' addToast).
//
// Behavior notes vs the inline code it replaces:
//   - the permission check runs inside the try, so a denied permission
//     surfaces as the standard `${errorPrefix}: ${message}` error toast;
//   - CONCLUSIVE business failures (`status: "-1"` / `false` / failure
//     tokens) never reach the status branch at all — `hybridBaseQuery`
//     already turns them into rejections at `.unwrap()`, landing in the
//     catch below. The branch only discriminates what resolves;
//   - the status branch uses the canonical `readEnvelopeStatus` semantics
//     (apiResponseStatus.ts) instead of the inline code's bare truthiness
//     check, which mis-read edge tokens — e.g. the number 0 is a SUCCESS
//     token but falsy, so the old code error-toasted it. Following
//     `readDeleteOutcome`'s deliberate bias, only a conclusive "failure"
//     fails here: these mutations carry no inspectable payload, and a false
//     failure costs a pointless retry of an idempotent operation;
//   - `onSuccess` runs only on success, `onSettled` ALWAYS runs (the
//     original `finally`: modal close).
import { useCallback, useState } from "react";
import {
  readEnvelopeMessage,
  readEnvelopeStatus,
  type EnvelopeLike,
} from "@/core/utils/apiResponseStatus";

/** Toast types the runner emits — matches useToast's addToast signature. */
export type CrudToastType = "success" | "error" | "warning" | "info" | "loading";

/** Minimal injected toast function; components pass their `addToast`. */
export type CrudToastAddToast = (type: CrudToastType, message: string) => unknown;

export interface CrudToastRunConfig {
  /** Whether the current user may run the action (caller computes this). */
  hasPermission: boolean;
  /** Pre-translated message thrown when {@link hasPermission} is false. */
  permissionDeniedMessage: string;
  /** Pre-translated toast shown when the envelope reports success. */
  successMessage: string;
  /** Pre-translated prefix for the error toast: `${errorPrefix}: ${error}`. */
  errorPrefix: string;
  /** Pre-translated fallback when a failing envelope carries no message. */
  unknownApiMessage: string;
  /** Runs only on success — focus/reset follow-ups from the original status branch. */
  onSuccess?: () => void;
  /** Always runs after settle — the original `finally` (e.g. close the modal). */
  onSettled?: () => void;
}

export interface UseCrudToastRunnerResult {
  /**
   * Runs `action` under the toast/loading protocol. Returns the unwrapped
   * response on success, `undefined` on any failure (permission denied,
   * business failure, transport error).
   */
  run: <T>(config: CrudToastRunConfig, action: () => Promise<T>) => Promise<T | undefined>;
  /** True while a `run` call is in flight. */
  isLoading: boolean;
}

export function useCrudToastRunner({
  addToast,
}: {
  addToast: CrudToastAddToast;
}): UseCrudToastRunnerResult {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async <T,>(
      config: CrudToastRunConfig,
      action: () => Promise<T>
    ): Promise<T | undefined> => {
      try {
        setIsLoading(true);
        if (!config.hasPermission) {
          throw new Error(config.permissionDeniedMessage);
        }

        const response = await action();
        const envelope = response as EnvelopeLike | null | undefined;

        // Same bias as readDeleteOutcome: only a conclusive failure fails.
        // See the header note for why inconclusive statuses resolve as
        // success for these payload-less CRUD mutations.
        if (readEnvelopeStatus(envelope?.status) !== "failure") {
          addToast("success", config.successMessage);
          config.onSuccess?.();
          return response;
        }

        throw new Error(readEnvelopeMessage(envelope) || config.unknownApiMessage);
      }
      catch (error) {
        addToast("error", `${config.errorPrefix}: ${error}`);
        return undefined;
      }
      finally {
        setIsLoading(false);
        config.onSettled?.();
      }
    },
    [addToast]
  );

  return { run, isLoading };
}

