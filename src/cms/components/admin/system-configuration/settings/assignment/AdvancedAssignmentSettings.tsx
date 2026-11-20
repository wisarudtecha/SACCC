// Advanced options for Assignment Rules, shown when the admin expands the
// section. Org-level flags (decision U8) - see the note on the options block for
// why they are no longer split by an Automatic/Manual mode.
// Configuration only; no engine consumes these values yet.
import { useState } from "react";
import Select from "@/core/components/form/Select";
import Switch from "@/core/components/form/switch/Switch";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  SERVICE_SUB_TYPES,
  type AdvancedAssignmentOptions,
} from "@/core/types/organization";
import { FieldRow, SubsectionCard } from "../map/settingsControls";

interface AdvancedAssignmentSettingsProps {
  options: AdvancedAssignmentOptions;
  onChange: (options: Partial<AdvancedAssignmentOptions>) => void;
}

export function AdvancedAssignmentSettings({
  options,
  onChange,
}: AdvancedAssignmentSettingsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // The stored document has always carried `serviceSubType` (the BFF's
  // organizationSettings.sh payload shows "general"), but no control ever set it -
  // so a rebuild from the typed model used to write the default back over whatever
  // an admin had chosen elsewhere. It gets an editor here.
  const serviceSubTypeOptions = SERVICE_SUB_TYPES.map((value) => ({
    value,
    label: t(`settings.assignment.advanced.sub_type.${value}`),
  }));

  const handleServiceSubTypeChange = (value: string) => {
    const next = SERVICE_SUB_TYPES.find((candidate) => candidate === value);
    if (next) {
      onChange({ serviceSubType: next });
    }
  };

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
      <FieldRow
        labelKey="settings.assignment.advanced.sub_type.label"
        helpKey="settings.assignment.advanced.sub_type.help"
      >
        <Select
          value={options.serviceSubType}
          onChange={handleServiceSubTypeChange}
          options={serviceSubTypeOptions}
        />
      </FieldRow>

      {/* All four options render together. They used to be split by the org-wide
          Automatic/Manual mode, but that field is gone from the 2026-11-19 contract
          (auto/manual is per case sub-type in `assignmentMode[]`), so any mode-based
          split here would hide half the record with nothing to key it on. The
          `auto*` flags describe what an automatically-staged sub-type may do; the
          `manual*` flags what a dispatcher may do (decision U8: they stay org-level). */}
      <FieldRow
        labelKey="settings.assignment.advanced.auto_require_all_skills.label"
        helpKey="settings.assignment.advanced.auto_require_all_skills.help"
      >
        <Switch
          label=""
          checked={options.autoRequireAllSkills}
          onChange={(checked) => onChange({ autoRequireAllSkills: checked })}
        />
      </FieldRow>
      <FieldRow
        labelKey="settings.assignment.advanced.auto_respect_shift.label"
        helpKey="settings.assignment.advanced.auto_respect_shift.help"
      >
        <Switch
          label=""
          checked={options.autoRespectShiftSchedule}
          onChange={(checked) => onChange({ autoRespectShiftSchedule: checked })}
        />
      </FieldRow>

      <FieldRow
        labelKey="settings.assignment.advanced.manual_suggest_workload.label"
        helpKey="settings.assignment.advanced.manual_suggest_workload.help"
      >
        <Switch
          label=""
          checked={options.manualSuggestByWorkload}
          onChange={(checked) => onChange({ manualSuggestByWorkload: checked })}
        />
      </FieldRow>
      <FieldRow
        labelKey="settings.assignment.advanced.manual_allow_override.label"
        helpKey="settings.assignment.advanced.manual_allow_override.help"
      >
        <Switch
          label=""
          checked={options.manualAllowOverride}
          onChange={(checked) => onChange({ manualAllowOverride: checked })}
        />
      </FieldRow>

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
