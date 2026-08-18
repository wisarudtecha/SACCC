// The cases an officer is holding, as shown inside Contextual Workflows.
//
// Only the case currently being viewed can be sourced today: every dispatch
// endpoint is per-case (/dispatch/{caseId}/units, /dispatch/{caseId}/SOP/unit/
// {unitId}), and nothing answers "which cases does this unit hold". Fetching
// every case and filtering client-side was rejected - it is expensive and
// permission-scoped data would be incomplete anyway.
//
// So the row for the current case is rendered from data we already have, and the
// rest is declared as pending. `StaffCaseRow` takes the shape of one row so that
// adding the other cases later is a data change, not a rewrite.
import { memo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";

interface StaffCaseRowProps {
  /** Case number shown to the user, e.g. the work order number. */
  caseLabel: string;
  /** The case the panel is opened on; drawn with an accent and a badge. */
  isCurrentCase: boolean;
  /** Whether this staff member actually holds the case. */
  isAssigned: boolean;
}

export function StaffCaseRow({ caseLabel, isCurrentCase, isAssigned }: StaffCaseRowProps) {
  const { t } = useTranslation();

  // Four independent signals distinguish the current case from the others -
  // border, fill, badge and position - so it never relies on colour alone.
  const accentClass = isAssigned
    ? "border-l-[3px] border-solid border-blue-500 bg-blue-50 dark:bg-blue-500/[.13]"
    : "border-l-[3px] border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-white/5";

  return (
    <div
      className={`rounded-r px-2 py-1.5 ${
        isCurrentCase ? accentClass : "bg-gray-50 opacity-[.72] dark:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-white">
          {caseLabel || "-"}
        </span>
        {isCurrentCase && (
          <span
            className={`shrink-0 rounded px-1 text-[10px] ${
              isAssigned
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {t("case.display.map_staff_badge_current_case")}
          </span>
        )}
      </div>
      {isCurrentCase && !isAssigned && (
        <p className="mt-0.5 text-gray-500 dark:text-gray-400">
          {t("case.display.map_staff_not_assigned_here")}
        </p>
      )}
    </div>
  );
}

interface StaffCaseListProps {
  caseLabel: string;
  isAssigned: boolean;
}

function StaffCaseListBase({ caseLabel, isAssigned }: StaffCaseListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <StaffCaseRow caseLabel={caseLabel} isCurrentCase isAssigned={isAssigned} />
      <p className="text-gray-400 dark:text-gray-500">
        {t("case.display.map_staff_other_cases_pending")}
      </p>
    </div>
  );
}

export const StaffCaseList = memo(StaffCaseListBase);
StaffCaseList.displayName = "StaffCaseList";

export default StaffCaseList;
