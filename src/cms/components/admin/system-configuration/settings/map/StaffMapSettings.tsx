import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type {
  AutoManualMode,
  AutoManualSetting,
  OrgMapStaffSettings,
} from "@/core/types/organization";
import { AutoManualField, IntervalField } from "./AutoManualField";
import { FieldRow, SubsectionCard, ToggleRow } from "./settingsControls";

interface StaffMapSettingsProps {
  value: OrgMapStaffSettings;
  onChange: (patch: Partial<OrgMapStaffSettings>) => void;
  errors: Record<string, string>;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
}

type StaffModeKey = "routing" | "etaTtl" | "tracking";

const MODE_LABEL_KEYS: Record<StaffModeKey, string> = {
  routing: "settings.map.field.staff_routing.label",
  etaTtl: "settings.map.field.staff_eta_ttl.label",
  tracking: "settings.map.field.staff_tracking.label",
};

const INTERVAL_LABEL_KEYS: Record<StaffModeKey, string> = {
  routing: "settings.map.field.staff_routing.interval",
  etaTtl: "settings.map.field.staff_eta_ttl.interval",
  tracking: "settings.map.field.staff_tracking.interval",
};

export function StaffMapSettings({
  value,
  onChange,
  errors,
  advancedOpen,
  onAdvancedOpenChange,
}: StaffMapSettingsProps) {
  const { t } = useTranslation();

  const setMode = (key: StaffModeKey, mode: AutoManualMode) => {
    const current = value[key] as AutoManualSetting;
    onChange({ [key]: { ...current, mode } } as Partial<OrgMapStaffSettings>);
  };

  const setInterval = (key: StaffModeKey, autoIntervalSeconds: number | null) => {
    const current = value[key] as AutoManualSetting;
    onChange({
      [key]: { ...current, autoIntervalSeconds },
    } as Partial<OrgMapStaffSettings>);
  };

  return (
    <SubsectionCard titleKey="settings.map.group.staff">
      <ToggleRow
        labelKey="settings.map.field.show_staff.label"
        helpKey="settings.map.field.show_staff.help"
        checked={value.showStaff}
        onChange={(checked) => onChange({ showStaff: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.show_trail.label"
        helpKey="settings.map.field.show_trail.help"
        checked={value.showTrail}
        onChange={(checked) => onChange({ showTrail: checked })}
      />

      {(["routing", "etaTtl", "tracking"] as StaffModeKey[]).map((key) => (
        <AutoManualField
          key={key}
          labelKey={MODE_LABEL_KEYS[key]}
          mode={(value[key] as AutoManualSetting).mode}
          onModeChange={(mode) => setMode(key, mode)}
        />
      ))}

      <ToggleRow
        labelKey="settings.map.field.eta_ttl_apply_to_picker.label"
        helpKey="settings.map.field.eta_ttl_apply_to_picker.help"
        checked={value.etaTtl.applyToAssignmentPicker}
        onChange={(checked) =>
          onChange({ etaTtl: { ...value.etaTtl, applyToAssignmentPicker: checked } })
        }
      />

      {/* One shared, default-collapsed disclosure for the three auto-interval fields. */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => onAdvancedOpenChange(!advancedOpen)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-sm font-medium text-gray-800 dark:text-gray-100"
        >
          {advancedOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span>{t("settings.map.advanced")}</span>
        </button>

        {advancedOpen && (
          <div className="flex flex-col gap-4 border-t border-gray-100 px-3 py-4 dark:border-gray-800">
            {(["routing", "etaTtl", "tracking"] as StaffModeKey[]).map((key) => {
              const setting = value[key] as AutoManualSetting;
              return (
                <IntervalField
                  key={key}
                  labelKey={INTERVAL_LABEL_KEYS[key]}
                  value={setting.autoIntervalSeconds}
                  onChange={(next) => setInterval(key, next)}
                  errorKey={errors[`staff.${key}.autoIntervalSeconds`]}
                  disabled={setting.mode !== "auto"}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Surface interval errors even when the disclosure is collapsed. */}
      {!advancedOpen &&
        (["routing", "etaTtl", "tracking"] as StaffModeKey[]).some(
          (key) => errors[`staff.${key}.autoIntervalSeconds`]
        ) && (
          <FieldRow
            labelKey="settings.map.advanced"
            errorKey="settings.map.validation.interval_min"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("settings.map.advanced_has_errors")}
            </span>
          </FieldRow>
        )}
    </SubsectionCard>
  );
}
