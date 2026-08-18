// "Contextual Workflows" - the one section of the panel that does work.
//
// A supervisor standing at the map should be able to see what this officer is
// holding, put them on the case or take them off it, and open the full case
// record, without leaving the map. That is three existing pieces composed in one
// place, not new behaviour: the case list, the assign/cancel block, and a button
// that raises the case-details modal to CaseDetailView (a modal rendered inside
// the map container would be clipped by its `overflow-hidden`).
import { memo } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import StaffAssignSection from "./StaffAssignSection";
import StaffCancelAssignSection from "./StaffCancelAssignSection";
import StaffCaseList from "./StaffCaseList";
import type { StaffSectionContext } from "./staffPanelSections";

interface StaffContextualWorkflowsSectionProps {
  ctx: StaffSectionContext;
}

function StaffContextualWorkflowsSectionBase({ ctx }: StaffContextualWorkflowsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <StaffCaseList caseLabel={ctx.caseLabel} isAssigned={ctx.isAssigned} />

      {/* Assign and remove are two views of one state, so only one is ever
          offered - the same rule the panel's fixed action bar follows. */}
      {ctx.isAssigned ? (
        <StaffCancelAssignSection ctx={ctx} />
      ) : (
        <StaffAssignSection ctx={ctx} />
      )}

      <button
        type="button"
        onClick={ctx.onRequestCaseDetails}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{t("case.display.map_staff_case_details_button")}</span>
      </button>
    </div>
  );
}

export const StaffContextualWorkflowsSection = memo(StaffContextualWorkflowsSectionBase);
StaffContextualWorkflowsSection.displayName = "StaffContextualWorkflowsSection";

export default StaffContextualWorkflowsSection;
