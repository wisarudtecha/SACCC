// Read-only SLA escalation entry for the case activity timeline, plus the
// permission-gated Acknowledge action (CAD-FE-SLA-Breach-Escalation §7).
//
// Visual language follows the existing activity-tab comments (`border-l-4 …
// pl-4`): red accent for breach, amber for warning, per the block design.
// Colour is never the only signal — every entry also carries an icon and
// explicit text (WCAG 1.4.1).
import React from "react";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDate } from "@/core/utils/crud";
import type { EscalationRecord } from "@/cms/types/escalation";

interface EscalationTimelineEntryProps {
  record: EscalationRecord;
  /** Whether the current user may acknowledge (permission-gated by the parent). */
  canAcknowledge: boolean;
  isAcknowledging: boolean;
  onAcknowledge: (escalationId: string) => void;
}

export const EscalationTimelineEntry: React.FC<EscalationTimelineEntryProps> = ({
  record,
  canAcknowledge,
  isAcknowledging,
  onAcknowledge,
}) => {
  const { t } = useTranslation();
  const isBreach = record.type === "breach";
  const isOpen = record.status === "open";

  const accentClass = isBreach
    ? "border-red-500 dark:border-red-400"
    : "border-amber-500 dark:border-amber-400";
  const iconClass = isBreach
    ? "text-red-500 dark:text-red-400"
    : "text-amber-500 dark:text-amber-400";
  const Icon = isBreach ? AlertTriangle : Bell;

  return (
    <div className={`border-l-4 ${accentClass} pl-4`}>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <Icon className={`w-4 h-4 ${iconClass}`} aria-hidden="true" />
          {isBreach ? t("sla.breached") : t("sla.warning")} — {t("sla.notified_role", { role: record.targetRole })}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(record.occurredAt)}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("sla.due_at", { time: formatDate(record.slaDueAt) })}
        {record.acknowledgedBy && record.acknowledgedAt
          ? ` — ${t("sla.acknowledged_by_at", { user: record.acknowledgedBy, time: formatDate(record.acknowledgedAt) })}`
          : ""}
      </p>

      {isOpen && canAcknowledge && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={isAcknowledging}
            onClick={() => onAcknowledge(record.id)}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-offset-gray-800"
          >
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {isAcknowledging ? t("sla.acknowledging") : t("sla.acknowledge")}
          </button>
        </div>
      )}
    </div>
  );
};
