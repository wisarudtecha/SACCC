// The supervisor's active monitor-session strip (SFE-06): current mode per
// monitored leg plus escalation / de-escalation / stop controls. State
// changes arrive exclusively as CALL_MONITOR_* events — commands mutate,
// events confirm, never the reverse (command contract §1).
import { useTranslation } from "@/core/hooks/useTranslation";
import { Ear, Megaphone, Square, Users } from "lucide-react";
import type { SupervisorMonitorSession } from "./supervisorCallState";

export interface MonitorSessionStripProps {
  /** The viewing supervisor's sessions (one entry per monitored leg). */
  sessions: SupervisorMonitorSession[];
  controlsEnabled: boolean;
  onListen: (callId: string) => void;
  onWhisper: (callId: string) => void;
  onBarge: (callId: string) => void;
  onStop: (callId: string) => void;
}

function modeLabelKey(mode: string): string {
  switch (mode) {
    case "listen":
      return "cc.softphone.monitor.mode_listen";
    case "whisper":
      return "cc.softphone.monitor.mode_whisper";
    case "barge":
      return "cc.softphone.monitor.mode_barge";
    default:
      return "cc.softphone.monitor.mode_unknown";
  }
}

export function MonitorSessionStrip({
  sessions,
  controlsEnabled,
  onListen,
  onWhisper,
  onBarge,
  onStop,
}: MonitorSessionStripProps) {
  const { t } = useTranslation();
  if (sessions.length === 0) {
    return null;
  }

  const buttonClass =
    "inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800";

  return (
    // The visible h2 below is the section's accessible name — no separate
    // aria-label (two keys for one string would drift apart).
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
      <h2 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        {t("cc.supervision.session_strip_title")}
      </h2>
      <ul className="flex flex-col gap-2">
        {sessions.map((session) => (
          <li
            key={session.callId}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="font-mono text-xs text-amber-900 dark:text-amber-200">
              {session.callId}
            </span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-200">
              {t(modeLabelKey(session.mode))}
            </span>
            <div className="ml-auto flex items-center gap-2" role="group" aria-label={t("cc.supervision.session_actions")}>
              <button
                type="button"
                className={buttonClass}
                disabled={!controlsEnabled || session.mode === "listen"}
                onClick={() => onListen(session.callId)}
              >
                <Ear className="h-3.5 w-3.5" aria-hidden="true" />
                {t("cc.supervision.escalate_listen")}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={!controlsEnabled || session.mode === "whisper"}
                onClick={() => onWhisper(session.callId)}
              >
                <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                {t("cc.supervision.escalate_whisper")}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={!controlsEnabled || session.mode === "barge"}
                onClick={() => onBarge(session.callId)}
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {t("cc.supervision.escalate_barge")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-900/30"
                disabled={!controlsEnabled}
                onClick={() => onStop(session.callId)}
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
                {t("cc.supervision.stop_monitoring")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
