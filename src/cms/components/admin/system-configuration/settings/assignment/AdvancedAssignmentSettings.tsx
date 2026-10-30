// Advanced options for Assignment Rules, shown when the admin expands the
// section. Options vary by Automatic/Manual mode.
// Configuration only; no engine consumes these values yet.
import { useState } from "react";
import Switch from "@/core/components/form/switch/Switch";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AdvancedAssignmentOptions } from "@/core/types/organization";
import { FieldRow, SubsectionCard } from "../map/settingsControls";

interface AdvancedAssignmentSettingsProps {
  mode: "automatic" | "manual";
  options: AdvancedAssignmentOptions;
  onChange: (options: Partial<AdvancedAssignmentOptions>) => void;
}

export function AdvancedAssignmentSettings({
  mode,
  options,
  onChange,
}: AdvancedAssignmentSettingsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {t("settings.assignment.advanced.expand")}
        </button>
      </div>
    );
  }

  return (
    <SubsectionCard titleKey="settings.assignment.advanced.title">
      {mode === "automatic" && (
        <>
          <FieldRow
            labelKey="settings.assignment.advanced.auto_require_all_skills.label"
            helpKey="settings.assignment.advanced.auto_require_all_skills.help"
          >
            <Switch
              label=""
              checked={options.autoRequireAllSkills}
              onChange={(checked) =>
                onChange({ autoRequireAllSkills: checked })
              }
            />
          </FieldRow>
          <FieldRow
            labelKey="settings.assignment.advanced.auto_respect_shift.label"
            helpKey="settings.assignment.advanced.auto_respect_shift.help"
          >
            <Switch
              label=""
              checked={options.autoRespectShiftSchedule}
              onChange={(checked) =>
                onChange({ autoRespectShiftSchedule: checked })
              }
            />
          </FieldRow>
        </>
      )}

      {mode === "manual" && (
        <>
          <FieldRow
            labelKey="settings.assignment.advanced.manual_suggest_workload.label"
            helpKey="settings.assignment.advanced.manual_suggest_workload.help"
          >
            <Switch
              label=""
              checked={options.manualSuggestByWorkload}
              onChange={(checked) =>
                onChange({ manualSuggestByWorkload: checked })
              }
            />
          </FieldRow>
          <FieldRow
            labelKey="settings.assignment.advanced.manual_allow_override.label"
            helpKey="settings.assignment.advanced.manual_allow_override.help"
          >
            <Switch
              label=""
              checked={options.manualAllowOverride}
              onChange={(checked) =>
                onChange({ manualAllowOverride: checked })
              }
            />
          </FieldRow>
        </>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          {t("settings.assignment.advanced.collapse")}
        </button>
      </div>
    </SubsectionCard>
  );
}
