// Detail card for the staff member selected on the map.
//
// A React card docked over the map rather than an Esri Popup: popups render in
// the Esri light theme, can't reach the app's translation catalogues, and would
// fight the app's own dialog stack - the same reasoning already applied to
// BasemapSwitcher.
//
// The officer's position, the assignment action, and the declared framework for
// everything else (see staffPanelSections.tsx) - sections that are not built yet
// are labelled as under development rather than mocked up, so nobody mistakes
// them for working UI.
//
// The assign / remove action appears twice on purpose: once in a fixed bar that
// never scrolls away, and once inside its section with the context that explains
// it. Both are driven by the same `ctx`, so they cannot disagree.
import { memo, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, MapPin, X } from "lucide-react";
import { DateStringToAgoFormat } from "@/cms/components/date/DateToString";
import { useTranslation } from "@/core/hooks/useTranslation";
import StaffActionButton from "./StaffActionButton";
import {
  getCaseStatusName,
  getStaffInitials,
  getUnitStatusName,
  readCaseStatuses,
  readUnitStatuses
} from "./staffDisplay";
import { STAFF_PANEL_SECTIONS, type StaffSectionContext } from "./staffPanelSections";
import { getStaffStatusDotClass } from "./staffSymbols";
import { isStaleLocation, type StaffMarker } from "./staffTypes";

interface StaffDetailPanelProps {
  marker: StaffMarker;
  onClose: () => void;
  /** Assignment wiring for the open case; every section renders against it. */
  ctx: StaffSectionContext;
  /**
   * Set only when this officer was picked out of a group. Without a way back,
   * the picker is a dead end and the only route to the others is to find their
   * cluster on the map again.
   */
  onBack?: () => void;
  /** How many officers the group held, for the back link's label. */
  backCount?: number;
  /** Positioning classes - the caller places the card over the map. */
  className?: string;
}

const COORDINATE_PRECISION = 6;

function StaffDetailPanelBase({
  marker,
  onClose,
  ctx,
  onBack,
  backCount,
  className = ""
}: StaffDetailPanelProps) {
  const { t, language } = useTranslation();
  const [openSectionIds, setOpenSectionIds] = useState<readonly string[]>([]);

  const unitStatuses = useMemo(readUnitStatuses, []);
  const caseStatuses = useMemo(readCaseStatuses, []);

  const statusName = getUnitStatusName(unitStatuses, marker.statusId);
  const isStale = isStaleLocation(marker);

  // Every row is independent: a heading opens or closes its own section and
  // nothing else.
  //
  // This card used to measure its own height and force the case list open past a
  // threshold. That made the state self-referential - opening ANY section grew
  // the card past the threshold, which re-opened the case list - so expanding
  // Personal Information or Real-Time Staff Tracking always dragged Contextual
  // Workflows open with it. Nothing is lost by dropping it: the assign / remove
  // action the pin was keeping in view lives in the fixed bar above, which never
  // scrolls away.
  const toggleSection = (id: string) =>
    setOpenSectionIds((open) =>
      open.includes(id) ? open.filter((openId) => openId !== id) : [...open, id]
    );

  const isActionBlocked = ctx.isAssigned ? !ctx.canCancel : !ctx.canAssign;

  return (
    // Flex column so the body below scrolls internally instead of spilling out
    // of the map container, which clips overflow. The height budget is the
    // CALLER's: it knows where the card is anchored, and a max-height set here
    // as well would compete with theirs at a precedence that depends on
    // stylesheet order rather than on which one is correct.
    <div
      className={`flex w-64 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm sm:w-72 dark:border-gray-700 dark:bg-gray-900/95 ${className}`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1 border-b border-gray-200 px-3 py-1.5 text-left text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {t("case.display.map_staff_group_back", { count: backCount ?? 0 })}
          </span>
        </button>
      )}

      <div className="flex shrink-0 items-start gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100">
          {marker.photo ? (
            <img src={marker.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            getStaffInitials(marker.unitName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {marker.unitName}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${getStaffStatusDotClass(marker.statusId, marker.isLogin)}`}
            />
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">{statusName}</span>
            {!marker.isLogin && (
              <span className="shrink-0 rounded bg-gray-200 px-1 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {t("case.display.map_staff_offline")}
              </span>
            )}
          </div>
          {/* This officer's status ON THIS CASE, distinct from the duty status
              above - only shown when they're actually assigned here. */}
          {Boolean(ctx.caseUnitStatusId) && (
            <p className="mt-0.5 truncate text-[11px] text-blue-600 dark:text-blue-300">
              {getCaseStatusName(caseStatuses, ctx.caseUnitStatusId!, language)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          title={t("case.display.map_staff_close")}
          aria-label={t("case.display.map_staff_close")}
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Outside the scroll area on purpose: the primary action stays visible
          and clickable whatever is open below it or how far the user scrolled. */}
      <div className="shrink-0 border-b border-gray-200 p-3 dark:border-gray-700">
        {ctx.isAssigned ? (
          <StaffActionButton
            variant="cancel"
            label={t("case.display.map_staff_cancel_button")}
            submittingLabel={t("case.display.map_staff_submitting")}
            isSubmitting={ctx.isSubmitting}
            isAllowed={ctx.canCancel}
            onClick={ctx.onRequestCancel}
          />
        ) : (
          <StaffActionButton
            variant="assign"
            label={t("case.display.map_staff_assign_button")}
            submittingLabel={t("case.display.map_staff_submitting")}
            isSubmitting={ctx.isSubmitting}
            isAllowed={ctx.canAssign}
            onClick={ctx.onRequestAssign}
          />
        )}
        {isActionBlocked && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            {ctx.isAssigned
              ? t("case.display.map_staff_blocked_cancel")
              : t("case.display.map_staff_blocked_assign")}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {/* The one section with real data. */}
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{t("case.display.map_staff_coordinates")}</span>
          </div>
          <p className="mt-1 font-mono text-sm text-gray-900 tabular-nums dark:text-white">
            {marker.latitude.toFixed(COORDINATE_PRECISION)},{" "}
            {marker.longitude.toFixed(COORDINATE_PRECISION)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t("case.display.map_staff_last_update")}:{" "}
            {marker.lastUpdateTime
              ? DateStringToAgoFormat(marker.lastUpdateTime, language)
              : "-"}
            {isStale && (
              <span className="ml-1 rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {t("case.display.map_staff_stale")}
              </span>
            )}
          </p>
        </div>

        {STAFF_PANEL_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSectionIds.includes(section.id);
          return (
            <div key={section.id} className="border-b border-gray-200 last:border-b-0 dark:border-gray-700">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="flex-1 truncate">{t(section.labelKey)}</span>
                {section.status === "in-development" && (
                  <span className="shrink-0 rounded bg-blue-50 px-1 text-[10px] text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    {t("case.display.map_staff_in_development")}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pl-10 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {section.render?.(marker, ctx) ?? t(section.descriptionKey)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const StaffDetailPanel = memo(StaffDetailPanelBase);
StaffDetailPanel.displayName = "StaffDetailPanel";

export default StaffDetailPanel;
