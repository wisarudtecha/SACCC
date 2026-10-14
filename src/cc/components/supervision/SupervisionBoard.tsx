// The supervisor live-call roster board (`/cc/supervision`, SFE-05 + SFE-06).
//
// Mock-driven until the 3CX adapter lands: roster rows and session state
// always render from (mock or real) websocket events; the commands fall
// back to the dev-only mock lifecycle in dev + mock mode (see
// `useSupervisorCalls.ts`).
//
// Permission note: the surface is designed for `cc.supervision.view`
// (roster + indicator visibility; one key per command mode — see the
// command contract §5.1). The key is not provisioned by the backend yet, so
// the check is bypassed in dev + mock mode only — exactly the
// `controlsEnabled` mock pattern the softphone uses. Remove the bypass when
// provisioning lands and gate the route in `src/cc/App.tsx` the same way.
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useAuth } from "@/core/hooks/useAuth";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { ConfirmModal } from "@/core/components/crud/ConfirmModal";
import type { ConfirmDialog } from "@/core/types/crud";
import { PhoneCall } from "lucide-react";
import { isMockCallLifecycleActive, MOCK_SUPERVISOR_ID } from "../softphone/mockCallLifecycle";
import { useSupervisorCalls } from "./useSupervisorCalls";
import { RosterRow } from "./RosterRow";
import { MonitorSessionStrip } from "./MonitorSessionStrip";

/** The permission key that will gate this surface once provisioned (contract §5.1). */
const SUPERVISION_VIEW_PERMISSION = "cc.supervision.view";

export default function SupervisionBoard() {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { hasPermission } = usePermissions();
  const { addToast } = useToastContext();

  // Mock persona stands in for the viewing supervisor until the adapter
  // lands (command contract Q-S2: sessions are derived from events keyed by
  // (callId, supervisorId) — the FE must know which supervisor "me" is).
  const supervisorId = isMockCallLifecycleActive()
    ? MOCK_SUPERVISOR_ID
    : authState.user?.id ?? null;

  const onCommandError = useCallback(
    (message: string | null) => {
      addToast("error", message ?? t("cc.supervision.command_failed"));
    },
    [addToast, t]
  );

  const {
    roster,
    sessions,
    controlsEnabled,
    controls,
  } = useSupervisorCalls(supervisorId, onCommandError);

  const [pendingForceEnd, setPendingForceEnd] = useState<string | null>(null);

  // Mock-only bypass until the backend provisions the permission key — see
  // the permission note in the header.
  const canView =
    hasPermission(SUPERVISION_VIEW_PERMISSION) || isMockCallLifecycleActive();

  const sessionList = useMemo(
    () => Object.values(sessions),
    [sessions]
  );

  const confirmDialog: ConfirmDialog | null =
    pendingForceEnd !== null
      ? {
          isOpen: true,
          type: "custom",
          entityId: pendingForceEnd,
          entityName: pendingForceEnd,
          title: t("cc.supervision.force_end_title"),
          message: t("cc.supervision.force_end_message", {
            callId: pendingForceEnd,
          }),
        }
      : null;

  if (!canView) {
    return (
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-3 px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.supervision.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("cc.supervision.permission_denied")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.supervision.title")}
        </h1>
        {isMockCallLifecycleActive() && (
          <button
            type="button"
            onClick={() => controls.simulateCall()}
            className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-3 py-1.5 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Simulate Call
          </button>
        )}
      </header>

      <MonitorSessionStrip
        sessions={sessionList}
        controlsEnabled={controlsEnabled}
        onListen={controls.listen}
        onWhisper={controls.whisper}
        onBarge={controls.barge}
        onStop={controls.stopMonitor}
      />

      {!controlsEnabled && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("cc.supervision.controls_unavailable")}
        </p>
      )}

      {roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <PhoneCall className="h-10 w-10 text-gray-400" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {t("cc.supervision.empty_title")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("cc.supervision.empty_hint")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={t("cc.supervision.roster_label")}>
          {roster.map((call) => (
            <RosterRow
              key={call.callId}
              call={call}
              session={sessions[call.callId] ?? null}
              controlsEnabled={controlsEnabled}
              onListen={controls.listen}
              onWhisper={controls.whisper}
              onBarge={controls.barge}
              onRequestForceEnd={setPendingForceEnd}
            />
          ))}
        </ul>
      )}

      {confirmDialog && (
        <ConfirmModal
          dialog={confirmDialog}
          onConfirm={() => {
            if (pendingForceEnd !== null) {
              controls.forceEnd(pendingForceEnd);
            }
            setPendingForceEnd(null);
          }}
          onCancel={() => setPendingForceEnd(null)}
        />
      )}
    </div>
  );
}
