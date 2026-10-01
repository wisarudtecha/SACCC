// SLA escalation block for the case activity tab: who was notified, when, and
// who acknowledged (CAD acceptance criteria). Composes `useCaseEscalations`
// (stub-backed facade) with `EscalationTimelineEntry`.
//
// Renders nothing when the case has no escalation records, so the activity
// tab looks exactly as before for unaffected cases and while the backend is
// absent (non-mock mode returns an empty list by design).
import React from "react";
import { Siren } from "lucide-react";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { EscalationTimelineEntry } from "./EscalationTimelineEntry";
import { useCaseEscalations } from "./useCaseEscalations";

/** Permission that will gate the ack action once the backend registers it. */
export const SLA_ESCALATION_ACK_PERMISSION = "sla.escalation.ack";

function getProfileUsername(): string {
  const profile = localStorage.getItem("profile");
  if (profile) {
    try {
      return JSON.parse(profile)?.username ?? "unknown-user";
    } catch {
      return "unknown-user";
    }
  }
  return "unknown-user";
}

export const CaseEscalationSection: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { t } = useTranslation();
  const { records, isLoading, isError, acknowledgingId, acknowledge } = useCaseEscalations(caseId);
  const permissions = usePermissions();
  const isSystemAdmin = useIsSystemAdmin();

  // `sla.escalation.ack` is not in the permission catalog yet (BE-pending), so
  // mock mode grants it to keep the acknowledge flow demoable; production
  // falls back to the catalogued permission or system admin.
  const canAcknowledge =
    DEV_CONFIG.MOCK_API || isSystemAdmin || permissions.hasPermission(SLA_ESCALATION_ACK_PERMISSION);

  // Graceful states: an empty history, a failed load, or an offline client all
  // collapse to "no section" — the activity tab renders exactly as it did
  // before this feature, never a broken panel.
  if (isLoading || isError || records.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Siren className="w-5 h-5 text-red-500 dark:text-red-400" aria-hidden="true" />
        <h4 className="font-medium text-gray-900 dark:text-white">
          {t("sla.escalations_title")} ({records.length})
        </h4>
      </div>

      {/* aria-live: an acknowledge swaps the entry's status text in place —
          screen readers announce the change without moving focus. */}
      <div className="space-y-3" aria-live="polite">
        {records.map((record) => (
          <EscalationTimelineEntry
            key={record.id}
            record={record}
            canAcknowledge={canAcknowledge}
            isAcknowledging={acknowledgingId === record.id}
            onAcknowledge={(escalationId) => acknowledge(escalationId, getProfileUsername())}
          />
        ))}
      </div>
    </div>
  );
};
