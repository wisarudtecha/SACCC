// Agent-side "Supervisor monitoring" indicator (supervisor-call-control plan
// F6). Pure presentation — driven exclusively by the leg's monitor state,
// which `softphoneCallState.ts` derives from `CALL_MONITOR_*` events
// (lifecycle contract v0.2 §6.5): appears on STARTED, follows escalation
// modes, disappears on ENDED / CALL_ENDED.
//
// Visibility will be gated behind `cc.supervision.view` once the backend
// provisions the key (agents implicitly hold it) — same posture as the
// softphone route itself, which stays ungated until provisioning lands.
// Stealth-listen (Q-S3) would only change *whether* this renders, not how.
import { useTranslation } from "@/core/hooks/useTranslation";
import { Eye, Megaphone, Radio, Users, type LucideIcon } from "lucide-react";
import type { CallMonitorSession } from "./softphoneCallState";

/** Canonical monitor modes → icon; unknown modes fall back to a generic badge. */
const MODE_ICONS: Record<string, LucideIcon> = {
  listen: Eye,
  whisper: Megaphone,
  barge: Users,
};

export interface MonitorBadgeProps {
  monitor: CallMonitorSession;
}

export function MonitorBadge({ monitor }: MonitorBadgeProps) {
  const { t } = useTranslation();
  const isKnownMode = monitor.mode in MODE_ICONS;
  const Icon = isKnownMode ? MODE_ICONS[monitor.mode] : Radio;
  const modeLabel = isKnownMode
    ? t(`cc.softphone.monitor.mode_${monitor.mode}`)
    : t("cc.softphone.monitor.mode_unknown");

  return (
    <span
      role="status"
      aria-label={`${t("cc.softphone.monitor.badge")} — ${modeLabel}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t("cc.softphone.monitor.badge")} · {modeLabel}
    </span>
  );
}
