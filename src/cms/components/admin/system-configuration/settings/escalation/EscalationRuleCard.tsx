// One escalation-rule card: enabled toggle, warning threshold %, recipient
// role. Presentational; the parent section owns form state and the atomic
// Save. All copy lives under the settings.escalation.* i18n prefix.
import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EscalationRule } from "@/cms/types/escalation";
import {
  clampWarningThresholdPct,
  WARNING_THRESHOLD_PCT_MAX,
  WARNING_THRESHOLD_PCT_MIN,
} from "@/cms/utils/escalationRules";

/** Role options for the recipient picker (CAD decision 3: roles, not users). */
export const ESCALATION_ROLE_OPTIONS = ["Supervisor", "Org Admin", "Dispatcher"] as const;

const ROLE_LABEL_KEYS: Record<(typeof ESCALATION_ROLE_OPTIONS)[number], string> = {
  Supervisor: "settings.escalation.role.supervisor",
  "Org Admin": "settings.escalation.role.org_admin",
  Dispatcher: "settings.escalation.role.dispatcher",
};

interface EscalationRuleCardProps {
  rule: EscalationRule;
  /** True while the section's Save is in flight — inputs stay frozen. */
  disabled?: boolean;
  onChange: (patch: Partial<EscalationRule>) => void;
}

export function EscalationRuleCard({ rule, disabled = false, onChange }: EscalationRuleCardProps) {
  const { t } = useTranslation();
  const inputsDisabled = disabled || !rule.enabled;

  // Local text state so the admin can clear the field and retype; the value is
  // validated and committed on blur, never mid-keystroke (an empty or invalid
  // field simply reverts to the current value).
  const [thresholdText, setThresholdText] = useState(String(rule.warningThresholdPct));
  useEffect(() => {
    setThresholdText(String(rule.warningThresholdPct));
  }, [rule.warningThresholdPct]);

  const commitThreshold = () => {
    const parsed = Number(thresholdText);
    if (thresholdText.trim() === "" || !Number.isFinite(parsed)) {
      setThresholdText(String(rule.warningThresholdPct));
      return;
    }
    const clamped = clampWarningThresholdPct(parsed);
    setThresholdText(String(clamped));
    if (clamped !== rule.warningThresholdPct) {
      onChange({ warningThresholdPct: clamped });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {rule.policyName ?? rule.policyId}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{rule.policyId}</p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={rule.enabled}
            disabled={disabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 accent-brand-500 dark:border-gray-600"
          />
          {t("settings.escalation.field.enabled.label")}
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`escalation-threshold-${rule.policyId}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {t("settings.escalation.field.warning_threshold.label")}
          </label>
          <input
            id={`escalation-threshold-${rule.policyId}`}
            type="number"
            min={WARNING_THRESHOLD_PCT_MIN}
            max={WARNING_THRESHOLD_PCT_MAX}
            value={thresholdText}
            disabled={inputsDisabled}
            aria-describedby={`escalation-threshold-help-${rule.policyId}`}
            onChange={(event) => setThresholdText(event.target.value)}
            onBlur={commitThreshold}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <p
            id={`escalation-threshold-help-${rule.policyId}`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {t("settings.escalation.field.warning_threshold.help")}
          </p>
        </div>

        <div>
          <label
            htmlFor={`escalation-role-${rule.policyId}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {t("settings.escalation.field.target_role.label")}
          </label>
          <select
            id={`escalation-role-${rule.policyId}`}
            value={rule.targetRole}
            disabled={inputsDisabled}
            aria-describedby={`escalation-role-help-${rule.policyId}`}
            onChange={(event) => onChange({ targetRole: event.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {/* A persisted role outside the known list still renders truthfully. */}
            {!ESCALATION_ROLE_OPTIONS.includes(
              rule.targetRole as (typeof ESCALATION_ROLE_OPTIONS)[number]
            ) && <option value={rule.targetRole}>{rule.targetRole}</option>}
            {ESCALATION_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {t(ROLE_LABEL_KEYS[role])}
              </option>
            ))}
          </select>
          <p
            id={`escalation-role-help-${rule.policyId}`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {t("settings.escalation.field.target_role.help")}
          </p>
        </div>
      </div>
    </div>
  );
}
