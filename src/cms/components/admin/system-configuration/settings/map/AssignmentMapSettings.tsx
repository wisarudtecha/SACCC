import type { OrgMapAssignmentSettings } from "@/core/types/organization";
import { SubsectionCard, ToggleRow } from "./settingsControls";

interface AssignmentMapSettingsProps {
  value: OrgMapAssignmentSettings;
  onChange: (patch: Partial<OrgMapAssignmentSettings>) => void;
}

export function AssignmentMapSettings({ value, onChange }: AssignmentMapSettingsProps) {
  return (
    <SubsectionCard titleKey="settings.map.group.assignment">
      <ToggleRow
        labelKey="settings.map.field.show_workload.label"
        helpKey="settings.map.field.show_workload.help"
        checked={value.showWorkload}
        onChange={(checked) => onChange({ showWorkload: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.show_assigned_cases.label"
        helpKey="settings.map.field.show_assigned_cases.help"
        checked={value.showAssignedCases}
        onChange={(checked) => onChange({ showAssignedCases: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.enable_recommend_ranking.label"
        helpKey="settings.map.field.enable_recommend_ranking.help"
        checked={value.enableRecommendRanking}
        onChange={(checked) => onChange({ enableRecommendRanking: checked })}
      />
    </SubsectionCard>
  );
}
