import { useTranslation } from "@/core/hooks/useTranslation";
import type { OrgMapLayerSettings } from "@/core/types/organization";
import { SubsectionCard, ToggleRow } from "./settingsControls";

interface LayerMapSettingsProps {
  value: OrgMapLayerSettings;
  onChange: (patch: Partial<OrgMapLayerSettings>) => void;
}

export function LayerMapSettings({ value, onChange }: LayerMapSettingsProps) {
  const { t } = useTranslation();

  // showPlace is shown but disabled: the Place map layer it configures does not
  // exist yet. Same "ships disabled, says so" treatment as MapPlaceButton, and it
  // reuses that component's copy.
  const placeNote = `${t("case.display.map_place")} - ${t("case.display.map_staff_in_development")}`;

  return (
    <SubsectionCard titleKey="settings.map.group.layers">
      <ToggleRow
        labelKey="settings.map.field.show_place.label"
        helpKey="settings.map.field.show_place.help"
        checked={value.showPlace}
        onChange={(checked) => onChange({ showPlace: checked })}
        disabled
        note={placeNote}
      />
      <ToggleRow
        labelKey="settings.map.field.show_boundaries.label"
        helpKey="settings.map.field.show_boundaries.help"
        checked={value.showBoundaries}
        onChange={(checked) => onChange({ showBoundaries: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.show_search.label"
        helpKey="settings.map.field.show_search.help"
        checked={value.showSearch}
        onChange={(checked) => onChange({ showSearch: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.show_address_coordinates.label"
        helpKey="settings.map.field.show_address_coordinates.help"
        checked={value.showAddressCoordinates}
        onChange={(checked) => onChange({ showAddressCoordinates: checked })}
      />
      <ToggleRow
        labelKey="settings.map.field.allow_place_incident_pin.label"
        helpKey="settings.map.field.allow_place_incident_pin.help"
        checked={value.allowPlaceIncidentPin}
        onChange={(checked) => onChange({ allowPlaceIncidentPin: checked })}
      />
    </SubsectionCard>
  );
}
