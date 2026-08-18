// "Real-Time Staff Tracking" section - the telemetry the unit reported with its
// position: speed, direction of travel, GPS accuracy and how old the fix is,
// plus the breadcrumb trail control.
//
// These values are now genuinely live. MOB's TRACKING event carries the position
// AND everything measured alongside it (see mobEvents.ts), so each row updates as
// the unit reports rather than waiting for the unit list to be refetched. The
// section shipped with a caveat saying the opposite, which was true when it was
// written and is not any more - a disclaimer that has become false misleads just
// as effectively as an overclaim.
//
// What stays is the age. A unit can stop reporting at any moment and nothing
// announces it, so the fix age is a first-class row rather than a footnote and
// the same `map_staff_stale` badge marks it once it is old.
import { memo } from "react";
// Footprints, not Route: the Smart Routing section already owns the Route icon,
// and the trail is where this officer HAS BEEN - the opposite of where they are
// going. The dashed line on the map draws that same distinction (breadcrumbSymbols.ts).
import { Compass, Crosshair, Footprints, Gauge, Satellite } from "lucide-react";
import { DateStringToAgoFormat } from "@/cms/components/date/DateToString";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { StaffSectionContext } from "./staffPanelSections";
import { formatAccuracy, formatBearing, formatSpeed, getTravelBearing } from "./staffTelemetry";
import { isStaleTimestamp, type StaffMarker } from "./staffTypes";
import { MIN_TRAIL_POINTS } from "./useStaffTrails";

interface StaffTrackingSectionProps {
  marker: StaffMarker;
  ctx: StaffSectionContext;
}

interface StaffTelemetryRowProps {
  icon: typeof Gauge;
  label: string;
  value: string;
  /** One line explaining a value that would otherwise be read as more than it is. */
  hint?: string;
  /** Rendered after the value - the stale badge, when the reading is old. */
  badge?: string;
}

function StaffTelemetryRow({ icon: Icon, label, value, hint, badge }: StaffTelemetryRowProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-0.5 font-medium text-gray-900 tabular-nums dark:text-white">
        {value}
        {badge && (
          <span className="ml-1 rounded bg-amber-100 px-1 font-normal text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            {badge}
          </span>
        )}
      </p>
      {hint && <p className="mt-0.5 text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

/** The four reported values. Split out so the section itself stays readable. */
function StaffTelemetryRows({ marker }: { marker: StaffMarker }) {
  const { t, language } = useTranslation();
  const travelBearing = getTravelBearing(marker);
  const isFixStale = isStaleTimestamp(marker.gpsTime);

  return (
    <>
      <StaffTelemetryRow
        icon={Gauge}
        label={t("case.display.map_staff_tracking_speed")}
        value={marker.speedKmh === null ? "-" : formatSpeed(marker.speedKmh, t)}
      />

      <StaffTelemetryRow
        icon={Compass}
        label={t("case.display.map_staff_tracking_heading")}
        // A heading is only shown while the unit is actually travelling: a
        // stopped unit keeps reporting the direction it last faced, which reads
        // as a unit still on its way. See staffTelemetry.ts.
        value={travelBearing === null ? "-" : formatBearing(travelBearing, t)}
        hint={
          travelBearing === null && marker.bearing !== null
            ? t("case.display.map_staff_tracking_heading_stopped")
            : undefined
        }
      />

      <StaffTelemetryRow
        icon={Crosshair}
        label={t("case.display.map_staff_tracking_accuracy")}
        value={marker.accuracyMeters === null ? "-" : formatAccuracy(marker.accuracyMeters, t)}
      />

      <StaffTelemetryRow
        icon={Satellite}
        label={t("case.display.map_staff_tracking_fix_age")}
        value={marker.gpsTime ? DateStringToAgoFormat(marker.gpsTime, language) : "-"}
        badge={isFixStale ? t("case.display.map_staff_stale") : undefined}
      />
    </>
  );
}

function StaffTrackingSectionBase({ marker, ctx }: StaffTrackingSectionProps) {
  const { t } = useTranslation();
  const { isVisible: isTrailVisible, pointCount, onToggle } = ctx.trail;

  // A unit can report a position and nothing else - an older handset, or a
  // provider that supplies coordinates only. Four dashes in a row read as a
  // broken panel, so say plainly that there is nothing to show.
  const hasTelemetry =
    marker.speedKmh !== null ||
    marker.bearing !== null ||
    marker.accuracyMeters !== null ||
    Boolean(marker.gpsTime);

  return (
    <div className="space-y-2">
      {/* The trail is fed by position alone, so it can still be worth drawing for
          a unit that reports nothing else - which is why this is a message in
          place of the rows rather than an early return past the control below. */}
      {hasTelemetry ? (
        <StaffTelemetryRows marker={marker} />
      ) : (
        <p>{t("case.display.map_staff_tracking_none")}</p>
      )}

      {/* The trail control. Positions are collected for as long as the staff
          layer is open, whether or not the trail is being drawn, so pressing
          this shows the path already travelled rather than starting an empty one
          - see useStaffTrails.ts. */}
      <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isTrailVisible}
          disabled={pointCount < MIN_TRAIL_POINTS}
          className={`flex w-full items-center gap-1.5 rounded border px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isTrailVisible
              ? "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-700/50 dark:text-slate-100"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          }`}
        >
          <Footprints className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">
            {isTrailVisible
              ? t("case.display.map_staff_tracking_trail_hide")
              : t("case.display.map_staff_tracking_trail_show")}
          </span>
          <span className="shrink-0 tabular-nums text-gray-400 dark:text-gray-500">
            {pointCount}
          </span>
        </button>
        <p className="mt-1 leading-relaxed text-gray-500 dark:text-gray-400">
          {pointCount < MIN_TRAIL_POINTS
            ? t("case.display.map_staff_tracking_trail_empty")
            : t("case.display.map_staff_tracking_trail_caveat")}
        </p>
      </div>
    </div>
  );
}

export const StaffTrackingSection = memo(StaffTrackingSectionBase);
StaffTrackingSection.displayName = "StaffTrackingSection";

export default StaffTrackingSection;
