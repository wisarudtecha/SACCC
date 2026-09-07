import Select from "@/core/components/form/Select";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { OrgMapGeneralSettings } from "@/core/types/organization";
import { BASEMAP_OPTIONS } from "@/cms/components/case/createCase/map/basemaps";
import { FieldRow, SubsectionCard, ToggleRow } from "./settingsControls";

interface GeneralMapSettingsProps {
  value: OrgMapGeneralSettings;
  onChange: (patch: Partial<OrgMapGeneralSettings>) => void;
}

const INHERIT = "__inherit__";
const PROVIDER_DEFAULT = "__provider_default__";

export function GeneralMapSettings({ value, onChange }: GeneralMapSettingsProps) {
  const { t } = useTranslation();

  return (
    <SubsectionCard titleKey="settings.map.group.general">
      <FieldRow
        labelKey="settings.map.field.map_provider.label"
        helpKey="settings.map.field.map_provider.help"
      >
        <Select
          className="w-56"
          value={value.mapProvider ?? INHERIT}
          onChange={(next) =>
            onChange({
              mapProvider:
                next === INHERIT ? null : (next as OrgMapGeneralSettings["mapProvider"]),
            })
          }
          options={[
            { value: INHERIT, label: t("settings.map.field.map_provider.inherit") },
            { value: "arcgis", label: "ArcGIS" },
            { value: "longdo", label: "Longdo" },
            { value: "maptiler", label: "MapTiler" },
          ]}
        />
      </FieldRow>

      <FieldRow
        labelKey="settings.map.field.default_basemap.label"
        helpKey="settings.map.field.default_basemap.help"
      >
        <Select
          className="w-56"
          value={value.defaultBasemapId ?? PROVIDER_DEFAULT}
          onChange={(next) =>
            onChange({ defaultBasemapId: next === PROVIDER_DEFAULT ? null : next })
          }
          options={[
            {
              value: PROVIDER_DEFAULT,
              label: t("settings.map.field.default_basemap.provider_default"),
            },
            ...BASEMAP_OPTIONS.map((option) => ({
              value: option.id,
              label: t(option.labelKey),
            })),
          ]}
        />
      </FieldRow>

      <ToggleRow
        labelKey="settings.map.field.allow_map_style_change.label"
        helpKey="settings.map.field.allow_map_style_change.help"
        checked={value.allowMapStyleChange}
        onChange={(checked) => onChange({ allowMapStyleChange: checked })}
      />
    </SubsectionCard>
  );
}
