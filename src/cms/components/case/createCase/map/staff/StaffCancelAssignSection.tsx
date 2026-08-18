// "Cancel assignment" section of the staff detail panel.
//
// Mirror of StaffAssignSection: it only ever renders for a staff member who is
// already on this case (see `isVisible` in the section registry), and states the
// consequence of removing them before offering the button.
import { memo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import StaffActionButton from "./StaffActionButton";
import type { StaffSectionContext } from "./staffPanelSections";

interface StaffCancelAssignSectionProps {
  ctx: StaffSectionContext;
}

function StaffCancelAssignSectionBase({ ctx }: StaffCancelAssignSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p>{t("case.display.map_staff_cancel_description")}</p>
      {!ctx.canCancel && (
        <p className="text-amber-600 dark:text-amber-400">
          {t("case.display.map_staff_blocked_cancel")}
        </p>
      )}
      <StaffActionButton
        variant="cancel"
        label={t("case.display.map_staff_cancel_section_button")}
        submittingLabel={t("case.display.map_staff_submitting")}
        isSubmitting={ctx.isSubmitting}
        isAllowed={ctx.canCancel}
        onClick={ctx.onRequestCancel}
      />
    </div>
  );
}

export const StaffCancelAssignSection = memo(StaffCancelAssignSectionBase);
StaffCancelAssignSection.displayName = "StaffCancelAssignSection";

export default StaffCancelAssignSection;
