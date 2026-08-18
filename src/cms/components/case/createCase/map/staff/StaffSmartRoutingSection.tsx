// "Smart Routing Engine" section - the calculate/recalculate control, the solve
// state, distance, and the staleness caveat when the officer's position is old.
//
// Never solves on its own: mounting this section (the accordion row opening)
// is not a trigger. Only pressing the button is - each solve costs ArcGIS
// credits, see docs/prompt-staff-map-route.md §6.
import { memo } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDistanceKm, routeErrorKey } from "./routeFormat";
import type { StaffSectionContext } from "./staffPanelSections";
import StaffRouteCalculateButton from "./StaffRouteCalculateButton";

interface StaffSmartRoutingSectionProps {
  ctx: StaffSectionContext;
}

function StaffSmartRoutingSectionBase({ ctx }: StaffSmartRoutingSectionProps) {
  const { t } = useTranslation();
  const { state, canSolve, cooldownSeconds, onSolve } = ctx.route;

  return (
    <div className="space-y-2">
      {state.status === "idle" && <p>{t("case.display.map_staff_route_none")}</p>}

      {state.status === "error" && (
        <p className="text-amber-600 dark:text-amber-400">{t(routeErrorKey(state.reason))}</p>
      )}

      {state.status === "ready" && (
        <>
          <p>
            {t("case.display.map_staff_route_distance")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDistanceKm(state.result.distanceKm, t)}
            </span>
          </p>
          {state.result.isFromStalePosition && (
            <p className="text-amber-600 dark:text-amber-400">
              {t("case.display.map_staff_route_stale_caveat")}
            </p>
          )}
        </>
      )}

      <StaffRouteCalculateButton
        state={state}
        canSolve={canSolve}
        cooldownSeconds={cooldownSeconds}
        onSolve={onSolve}
      />
    </div>
  );
}

export const StaffSmartRoutingSection = memo(StaffSmartRoutingSectionBase);
StaffSmartRoutingSection.displayName = "StaffSmartRoutingSection";

export default StaffSmartRoutingSection;
