import Select from "@/core/components/form/Select";
import { RotateCw } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { API_CONFIG, type MapProviderId } from "@/core/config/api";
import type { OrgMapGeneralSettings } from "@/core/types/organization";
import { basemapOptionsFor } from "@/cms/components/case/createCase/map/basemaps";
import { useMapRuntimeConfig } from "@/cms/components/case/createCase/map/useMapRuntimeConfig";
import { FieldRow, SubsectionCard, ToggleRow } from "./settingsControls";

interface GeneralMapSettingsProps {
  value: OrgMapGeneralSettings;
  /**
   * Whether the "reload page" escape hatch may be pressed. False while there are
   * unsaved edits: reloading would discard them silently.
   */
  canReload?: boolean;
  onChange: (patch: Partial<OrgMapGeneralSettings>) => void;
}

const INHERIT = "__inherit__";
const PROVIDER_DEFAULT = "__provider_default__";

/** Display names; the vendor spells its own brand, so these are not translated. */
const PROVIDER_LABELS: Record<MapProviderId, string> = {
  arcgis: "ArcGIS",
  longdo: "Longdo",
  maptiler: "MapTiler",
};

export function GeneralMapSettings({
  value,
  canReload = true,
  onChange,
}: GeneralMapSettingsProps) {
  const { t } = useTranslation();

  // The form lists the catalogue for the provider the ADMIN SELECTED, which may
  // not be the one in force yet - the provider takes effect on the next load.
  const basemapOptions = basemapOptionsFor(value.mapProvider ?? API_CONFIG.MAP_PROVIDER);

  // What the running session actually draws with. Read from the runtime store,
  // not from `value`: the form shows what is saved, this line explains what the
  // saved value turned into.
  const { fallbackReason, deploymentDefaultProvider } = useMapRuntimeConfig();

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

      {/* D5/D16: the only fallback that has a user-visible cause is "this build
          cannot draw what the org picked" (a provider missing its API key, or an
          id this client does not know). Entitlement is NOT reported here - the
          whole section is already inside the GIS EntitlementGate. */}
      {fallbackReason === "unsupported" && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
        >
          {t("settings.map.field.map_provider.fallback_unsupported", {
            provider: PROVIDER_LABELS[deploymentDefaultProvider],
          })}
        </p>
      )}

      {/* WHAT A PROVIDER CHANGE DOES, AND THE ONE CASE THAT NEEDS A RELOAD.
          Every other setting on this page applies on save (the save invalidates the
          OrgSettings tag, so the RTK consumers refetch). The provider lives in
          `mapRuntimeConfig`, which resolves once per session so a live MapView is
          never remounted; a successful save applies it for the maps opened AFTER it,
          and a map already on screen keeps the old provider.
          So the button below is NOT a substitute for cache invalidation - it exists
          for the one situation a session cannot cover (a map already open elsewhere,
          or an apply that was deferred because a map was mounted). */}
      <div className="flex flex-col items-start gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.map.field.map_provider.effect_note")}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          disabled={!canReload}
          title={
            canReload
              ? undefined
              : t("settings.map.field.map_provider.reload_disabled_hint")
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {t("settings.map.field.map_provider.reload")}
        </button>
      </div>

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
            ...basemapOptions.map((option) => ({
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
