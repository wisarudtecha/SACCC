// One live-call row in the supervisor roster: agent, status, live duration,
// linkage ids, and the row's action menu (Listen / Whisper / Barge-in /
// Force end). Entry point for the supervisor monitor commands — the current
// session mode (if any) disables its own button (re-issue is an idempotent
// no-op, command contract §4.3) and shows the shared MonitorBadge.
import { useTranslation } from "@/core/hooks/useTranslation";
import { Ear, Megaphone, PhoneOff, Users } from "lucide-react";
import type { RosterCall, SupervisorMonitorSession } from "./supervisorCallState";
import { formatCallDuration } from "../softphone/softphoneCallState";
import { MonitorBadge } from "../softphone/MonitorBadge";
import { useElapsedSeconds } from "./useElapsedSeconds";

export interface RosterRowProps {
  call: RosterCall;
  /** The viewing supervisor's session on this leg, or null. */
  session: SupervisorMonitorSession | null;
  /** True when commands are available (dev + mock mode, or adapter landed). */
  controlsEnabled: boolean;
  onListen: (callId: string) => void;
  onWhisper: (callId: string) => void;
  onBarge: (callId: string) => void;
  /** Opens the force-terminate confirmation (destructive — never immediate). */
  onRequestForceEnd: (callId: string) => void;
}

function statusLabelKey(status: RosterCall["status"]): string {
  switch (status) {
    case "active":
      return "cc.supervision.status_active";
    case "on_hold":
      return "cc.supervision.status_on_hold";
    case "transferred":
      return "cc.supervision.status_transferred";
  }
}

export function RosterRow({
  call,
  session,
  controlsEnabled,
  onListen,
  onWhisper,
  onBarge,
  onRequestForceEnd,
}: RosterRowProps) {
  const { t } = useTranslation();
  const elapsed = useElapsedSeconds(call.startedAt);

  const monitorButtonClass =
    "inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Agent + status */}
      <div className="min-w-[10rem] flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {call.agentId ?? t("cc.supervision.unknown_agent")}
        </p>
        <span className="mt-0.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {t(statusLabelKey(call.status))}
        </span>
      </div>

      {/* Live duration */}
      <p className="font-mono text-sm text-gray-600 tabular-nums dark:text-gray-300">
        <span className="sr-only">{t("cc.supervision.duration_label")}: </span>
        {formatCallDuration(elapsed)}
      </p>

      {/* Linkage */}
      <div className="flex min-w-[12rem] flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
        {call.ani && <span>{t("cc.softphone.call_label")}: {call.ani}</span>}
        {call.customerId && (
          <span>{t("cc.softphone.customer_label")}: {call.customerId}</span>
        )}
        {call.caseId && <span>{t("cc.softphone.case_label")}: {call.caseId}</span>}
      </div>

      {session && (
        <MonitorBadge
          monitor={{ supervisorId: session.supervisorId, mode: session.mode }}
        />
      )}

      {/* Action menu (SFE-06): commands mutate, CALL_MONITOR_* events confirm. */}
      <div className="ml-auto flex items-center gap-2" role="group" aria-label={t("cc.supervision.row_actions")}>
        <button
          type="button"
          className={monitorButtonClass}
          disabled={!controlsEnabled || session?.mode === "listen"}
          onClick={() => onListen(call.callId)}
        >
          <Ear className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cc.supervision.action_listen")}
        </button>
        <button
          type="button"
          className={monitorButtonClass}
          disabled={!controlsEnabled || session?.mode === "whisper"}
          onClick={() => onWhisper(call.callId)}
        >
          <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cc.supervision.action_whisper")}
        </button>
        <button
          type="button"
          className={monitorButtonClass}
          disabled={!controlsEnabled || session?.mode === "barge"}
          onClick={() => onBarge(call.callId)}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cc.supervision.action_barge")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/30"
          disabled={!controlsEnabled}
          onClick={() => onRequestForceEnd(call.callId)}
        >
          <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cc.supervision.action_force_end")}
        </button>
      </div>
    </li>
  );
}
