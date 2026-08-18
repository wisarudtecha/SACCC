// "Assign case" section of the staff detail panel.
//
// The same action also sits in the panel's fixed action bar; this copy is the
// one with context - it says what will actually happen (the SOP dispatch stage
// runs), or why the button is off. Both call the same handler.
import { memo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import StaffActionButton from "./StaffActionButton";
import type { StaffSectionContext } from "./staffPanelSections";

interface StaffAssignSectionProps {
  ctx: StaffSectionContext;
}

function StaffAssignSectionBase({ ctx }: StaffAssignSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p>{t("case.display.map_staff_assign_description")}</p>
      {!ctx.canAssign && (
        <p className="text-amber-600 dark:text-amber-400">
          {t("case.display.map_staff_blocked_assign")}
        </p>
      )}
      <StaffActionButton
        variant="assign"
        label={t("case.display.map_staff_assign_section_button")}
        submittingLabel={t("case.display.map_staff_submitting")}
        isSubmitting={ctx.isSubmitting}
        isAllowed={ctx.canAssign}
        onClick={ctx.onRequestAssign}
      />
    </div>
  );
}

export const StaffAssignSection = memo(StaffAssignSectionBase);
StaffAssignSection.displayName = "StaffAssignSection";

export default StaffAssignSection;
