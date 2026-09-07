import Input from "@/core/components/form/input/InputField";
import type { OrgMapIncidentSettings } from "@/core/types/organization";
import { FieldRow, SubsectionCard, ToggleRow } from "./settingsControls";

interface IncidentMapSettingsProps {
  value: OrgMapIncidentSettings;
  onChange: (patch: Partial<OrgMapIncidentSettings>) => void;
  errors: Record<string, string>;
}

export function IncidentMapSettings({ value, onChange, errors }: IncidentMapSettingsProps) {
  return (
    <SubsectionCard titleKey="settings.map.group.incident">
      <FieldRow
        labelKey="settings.map.field.radius_meters.label"
        helpKey="settings.map.field.radius_meters.help"
        errorKey={errors["incident.radiusMeters"]}
      >
        <Input
          type="number"
          className="w-40"
          min="1"
          step={1}
          error={Boolean(errors["incident.radiusMeters"])}
          value={Number.isFinite(value.radiusMeters) ? value.radiusMeters : ""}
          onChange={(e) => {
            const next = e.target.value.trim();
            onChange({ radiusMeters: next === "" ? NaN : Number(next) });
          }}
        />
      </FieldRow>

      <ToggleRow
        labelKey="settings.map.field.show_radius.label"
        helpKey="settings.map.field.show_radius.help"
        checked={value.showRadius}
        onChange={(checked) => onChange({ showRadius: checked })}
      />

      <ToggleRow
        labelKey="settings.map.field.auto_lock_service_center.label"
        helpKey="settings.map.field.auto_lock_service_center.help"
        checked={value.autoLockServiceCenterOnMatch}
        onChange={(checked) => onChange({ autoLockServiceCenterOnMatch: checked })}
      />
    </SubsectionCard>
  );
}
