// Explains the map's icon/color/line vocabulary - staff availability and
// data-freshness, Place/Device categories and clusters, the incident-radius
// circle, and the staff -> case dashed connector.
//
// Collapsed by default and positioned absolutely by the caller (expanded map
// only, see AddressMapField.tsx) so opening it overlays the map instead of
// resizing it - like PlaceGroupPanel/DeviceGroupPanel, but pinned to the
// bottom and with no close button (nothing to dismiss, just collapse again).
// All four sections always render, regardless of which layers are active on
// the current map instance, so the legend reads the same everywhere.
import { memo, useState } from "react";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "./PanelCollapseToggle";
import {
  getAvailabilityRgb,
  STAFF_SYMBOL_TOKENS
} from "./staff/staffSymbols";
import { CONNECTOR_TOKENS } from "./staff/connectorSymbols";
import {
  getPlaceCategoryLabelKey,
  getPlaceCategoryRgb,
  PLACE_SYMBOL_TOKENS
} from "./place/placeSymbols";
import type { PlaceCategory } from "./place/placeTypes";
import {
  getDeviceCategoryLabelKey,
  getDeviceCategoryRgb,
  DEVICE_SYMBOL_TOKENS
} from "./device/deviceSymbols";
import type { DeviceCategory } from "./device/deviceTypes";
import { incidentRadiusFillCss, incidentRadiusStrokeCss } from "./incidentRadius/incidentRadiusSymbols";

interface LegendProps {
  className?: string;
}

const PLACE_CATEGORIES: readonly PlaceCategory[] = ["police_station", "hospital", "fire_station"];
const DEVICE_CATEGORIES: readonly DeviceCategory[] = ["camera", "fire_hydrant", "aed"];

function rgbCss([r, g, b]: readonly [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function DotSwatch({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: color, opacity }}
    />
  );
}

function DashedDotSwatch({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: fill, border: `2px dashed ${stroke}` }}
    />
  );
}

function DashedLineSwatch({ color }: { color: string }) {
  return <span className="inline-block h-0 w-4 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />;
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  );
}

function LegendSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[10rem] flex-1">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function LegendBase({ className = "" }: LegendProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div
      className={`flex max-h-[60vh] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95 ${className}`}
    >
      <div
        className={`flex shrink-0 items-center gap-2 p-3 ${isCollapsed ? "" : "border-b border-gray-200 dark:border-gray-700"}`}
      >
        <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
          {t("case.display.map_legend_title")}
        </p>
        <PanelCollapseToggle isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((value) => !value)} />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar flex flex-wrap gap-x-6 gap-y-4 p-3 ${isCollapsed ? "hidden" : ""}`}
      >
        <LegendSection title={t("case.display.map_legend_section_staff")}>
          <LegendRow
            swatch={<DotSwatch color={rgbCss(getAvailabilityRgb("ready"))} />}
            label={t("case.display.map_legend_staff_ready")}
          />
          <LegendRow
            swatch={<DotSwatch color={rgbCss(getAvailabilityRgb("engaged"))} />}
            label={t("case.display.map_legend_staff_engaged")}
          />
          <LegendRow
            swatch={<DotSwatch color={rgbCss(getAvailabilityRgb("off-duty"))} />}
            label={t("case.display.map_legend_staff_off_duty")}
          />
          <LegendRow
            swatch={<DotSwatch color={rgbCss(getAvailabilityRgb("ready"))} opacity={STAFF_SYMBOL_TOKENS.activeAlpha} />}
            label={t("case.display.map_legend_staff_live")}
          />
          <LegendRow
            swatch={<DotSwatch color={rgbCss(getAvailabilityRgb("ready"))} opacity={STAFF_SYMBOL_TOKENS.mutedAlpha} />}
            label={t("case.display.map_legend_staff_stale")}
          />
          <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            {t("case.display.map_legend_staff_cluster_note")}
          </p>
        </LegendSection>

        <LegendSection title={t("case.display.map_legend_section_place")}>
          {PLACE_CATEGORIES.map((category) => (
            <LegendRow
              key={category}
              swatch={<DotSwatch color={rgbCss(getPlaceCategoryRgb(category))} />}
              label={t(getPlaceCategoryLabelKey(category))}
            />
          ))}
          <LegendRow
            swatch={<DotSwatch color={rgbCss(PLACE_SYMBOL_TOKENS.clusterRgb)} />}
            label={t("case.display.map_legend_place_cluster")}
          />
        </LegendSection>

        <LegendSection title={t("case.display.map_legend_section_device")}>
          {DEVICE_CATEGORIES.map((category) => (
            <LegendRow
              key={category}
              swatch={<DotSwatch color={rgbCss(getDeviceCategoryRgb(category))} />}
              label={t(getDeviceCategoryLabelKey(category))}
            />
          ))}
          <LegendRow
            swatch={<DotSwatch color={rgbCss(DEVICE_SYMBOL_TOKENS.clusterRgb)} />}
            label={t("case.display.map_legend_device_cluster")}
          />
        </LegendSection>

        <LegendSection title={t("case.display.map_legend_section_overlays")}>
          <LegendRow
            swatch={
              <DashedDotSwatch
                fill={incidentRadiusFillCss(isDarkTheme)}
                stroke={incidentRadiusStrokeCss(isDarkTheme)}
              />
            }
            label={t("case.display.map_legend_incident_radius")}
          />
          <LegendRow
            swatch={
              <DashedLineSwatch
                color={rgbCss(isDarkTheme ? CONNECTOR_TOKENS.darkRgb : CONNECTOR_TOKENS.lightRgb)}
              />
            }
            label={t("case.display.map_legend_staff_connector")}
          />
        </LegendSection>
      </div>
    </div>
  );
}

export const Legend = memo(LegendBase);
Legend.displayName = "Legend";

export default Legend;
