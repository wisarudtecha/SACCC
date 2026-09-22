// Detail card for the case whose incident pin was clicked on the map.
//
// A React card docked over the map, for the same reasons StaffDetailPanel is one
// (no Esri popup: theming, translations, the app's dialog stack). It is the case's
// counterpart to that card: the case's own details, and who was assigned to it by
// whom - with a click on a responder that brings them into view.
//
// Owns no case or dispatch logic. Everything arrives as props from
// CaseStaffMapField, which is where the state has to live (see the note there on
// why nothing here survives being the owner).
import { memo, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { getPriorityColorClass, getTextPriority } from "@/cms/components/function/Prioriy";
import Badge from "@/core/components/ui/badge/Badge";
import { statusIdToStatusTitle } from "@/cms/components/ui/status/status";
import type { CaseDetails } from "@/cms/types/case";
import type { CaseSopUnit } from "@/cms/types/dispatch";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUsersQuery } from "@/core/store/api/userApi";
import type { UserProfile } from "@/core/types/user";
import { buildUserInfoIndex } from "./casePanelModel";
import CasePanelInfoSection from "./CasePanelInfoSection";
import { CaseResponderList } from "./CasePanelPeopleSections";
import PanelCollapseToggle from "../PanelCollapseToggle";
import { readCaseStatuses } from "./staffDisplay";
import type { StaffMarker } from "./staffTypes";

/** Same page size CaseHistory / UnitForm use to resolve usernames to names. */
const USER_LOOKUP_PAGE = { start: 0, length: 1000 } as const;

interface CasePanelProps {
  /** The case number shown to the user, for the header - see StaffAssignmentOverlay.caseLabel. */
  caseLabel: string;
  caseData?: CaseDetails;
  /** Units on this case, from the SOP `unitLists`. */
  assignedUnits: readonly CaseSopUnit[];
  staff: readonly StaffMarker[];
  isStaffLoaded: boolean;
  /** The unit open in the Staff Panel, if any. */
  selectedUnitId: string | null;
  onFocusResponder: (unitId: string) => void;
  onRequestCaseDetails: () => void;
  onClose: () => void;
  /**
   * Collapsed to its header row. Owned by the caller, like the panel's open
   * state, so it survives the large map closing and reopening.
   */
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  /** Positioning classes - the caller places the card over the map. */
  className?: string;
}

function CasePanelBase({
  caseLabel,
  caseData,
  assignedUnits,
  staff,
  isStaffLoaded,
  selectedUnitId,
  onFocusResponder,
  onRequestCaseDetails,
  onClose,
  isCollapsed,
  onToggleCollapsed,
  className = ""
}: CasePanelProps) {
  const { t, language } = useTranslation();

  // Only fetched while the panel is open (it is not mounted otherwise). A failed
  // or slow lookup costs nothing but the names/photos - the dispatcher falls back
  // to their username and initials, which is what the SOP record actually holds.
  const { data: usersData } = useGetUsersQuery(USER_LOOKUP_PAGE);
  const userInfoIndex = useMemo(
    () => buildUserInfoIndex((usersData?.data as unknown as UserProfile[] | undefined) ?? []),
    [usersData]
  );

  const caseStatuses = useMemo(readCaseStatuses, []);
  const priority = getTextPriority(caseData?.priority ?? Number.POSITIVE_INFINITY);
  const priorityLabel = t(`case.sop_card.${priority.level} Priority`);

  return (
    // Flex column so the body scrolls internally instead of spilling out of the
    // map container. The height budget is the CALLER's - see StaffDetailPanel.
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95 ${
        isCollapsed ? "w-48" : "w-64 sm:w-72"
      } ${className}`}
    >
      <div
        className={`flex shrink-0 flex-col gap-1.5 p-3 dark:border-gray-700 ${
          isCollapsed ? "" : "border-b border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
            {caseLabel}
          </p>
          <PanelCollapseToggle isCollapsed={isCollapsed} onToggle={onToggleCollapsed} />
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
        {/* Status + priority, promoted out of the info list below so the two
            things a dispatcher glances at first are visible without scrolling,
            even collapsed. */}
        {!isCollapsed && caseData && (
          <div className="flex items-center gap-2 pl-6">
            <Badge color="primary" size="xs">
              {statusIdToStatusTitle(caseData.status, language)}
            </Badge>
            <span
              aria-hidden
              title={priorityLabel}
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${getPriorityColorClass(caseData.priority)}`}
            />
            <span className="sr-only">{priorityLabel}</span>
          </div>
        )}
      </div>

      {/* Hidden rather than unmounted, so the sections keep their state. */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? "hidden" : ""}`}
      >
        <CasePanelInfoSection caseData={caseData} />
        <CaseResponderList
          units={assignedUnits}
          staff={staff}
          isStaffLoaded={isStaffLoaded}
          caseStatuses={caseStatuses}
          language={language}
          userInfoIndex={userInfoIndex}
          selectedUnitId={selectedUnitId}
          onFocusResponder={onFocusResponder}
        />
        <div className="p-3">
          <button
            type="button"
            onClick={onRequestCaseDetails}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t("case.display.map_staff_case_details_button")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const CasePanel = memo(CasePanelBase);
CasePanel.displayName = "CasePanel";

export default CasePanel;
