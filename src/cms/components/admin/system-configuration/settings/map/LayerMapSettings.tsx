import { useTranslation } from "@/core/hooks/useTranslation";
import type { OrgMapLayerSettings } from "@/core/types/organization";
import { useGetPlacesQuery } from "@/cms/store/api/placesApi";
import {
  PLACE_FETCH_LIMIT,
  isPlaceLayerTruncated,
} from "@/cms/components/case/createCase/map/mapControlDefaults";
import { SubsectionCard, ToggleRow } from "./settingsControls";

interface LayerMapSettingsProps {
  value: OrgMapLayerSettings;
  onChange: (patch: Partial<OrgMapLayerSettings>) => void;
}

export function LayerMapSettings({ value, onChange }: LayerMapSettingsProps) {
  const { t } = useTranslation();

  // The Place layer fetches ONE page (`PLACE_FETCH_LIMIT`) and the response carries
  // no total, so quoting the count here is the only way an admin can tell
  // "everything is shown" from "the list was cut" (decisions D9/D17 in
  // docs/ORG-SETTINGS-Runtime-Wiring-Plan.md). Uses the same query as the map, so
  // RTK Query serves it from the cache it already has.
  const { data, isLoading, isError } = useGetPlacesQuery({
    start: 0,
    length: PLACE_FETCH_LIMIT,
  });
  const placeCount = Array.isArray(data?.data) ? data.data.length : 0;
  const placeCountNote = isError
    ? t("settings.map.field.show_place.count_error")
    : isLoading
      ? t("settings.map.field.show_place.count_loading")
      : t("settings.map.field.show_place.count", {
          count: placeCount,
          limit: PLACE_FETCH_LIMIT,
        });

  return (
    <SubsectionCard titleKey="settings.map.group.layers">
      <ToggleRow
        labelKey="settings.map.field.show_place.label"
        helpKey="settings.map.field.show_place.help"
        checked={value.showPlace}
        onChange={(checked) => onChange({ showPlace: checked })}
        note={
          <>
            {placeCountNote}
            {isPlaceLayerTruncated(placeCount) && (
              <span className="mt-1 block text-amber-700 dark:text-amber-400">
                {t("settings.map.field.show_place.truncated_warning", {
                  limit: PLACE_FETCH_LIMIT,
                })}
              </span>
            )}
          </>
        }
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
