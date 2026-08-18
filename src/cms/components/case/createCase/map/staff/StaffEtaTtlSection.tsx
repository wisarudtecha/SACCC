// "ETA / TTL Dashboard" section - drive time, arrival clock time, and time
// remaining, all derived from the SAME RouteState the Smart Routing section
// solves. Never triggers its own solve; while idle it offers the identical
// calculate control so a dispatcher who opens this section first is not stuck.
import { memo, useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDriveTime, formatEtaClock, routeErrorKey, ttlMinutesRemaining } from "./routeFormat";
import type { StaffSectionContext } from "./staffPanelSections";
import StaffRouteCalculateButton from "./StaffRouteCalculateButton";

interface StaffEtaTtlSectionProps {
  ctx: StaffSectionContext;
}

/** How often the TTL countdown re-renders. Display-only - no re-solve. */
const TTL_TICK_MS = 30_000;

function StaffEtaTtlSectionBase({ ctx }: StaffEtaTtlSectionProps) {
  const { t, language } = useTranslation();
  const { state, canSolve, cooldownSeconds, onSolve } = ctx.route;

  // Write-only: bumping it re-renders so the TTL countdown advances without a
  // second solve. No timer runs while there is nothing to count down.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    const intervalId = setInterval(() => setTick((tick) => tick + 1), TTL_TICK_MS);
    return () => clearInterval(intervalId);
  }, [state.status]);

  return (
    <div className="space-y-2">
      {state.status === "idle" && <p>{t("case.display.map_staff_route_none")}</p>}

      {state.status === "error" && (
        <p className="text-amber-600 dark:text-amber-400">{t(routeErrorKey(state.reason))}</p>
      )}

      {state.status === "ready" && (
        <>
          <p>
            {t("case.display.map_staff_route_drive_time")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDriveTime(state.result.travelMinutes, t)}
            </span>
          </p>
          <p>
            {t("case.display.map_staff_route_eta")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {formatEtaClock(state.result.solvedAtMs + state.result.travelMinutes * 60_000, language)}
            </span>
          </p>
          <p>
            {t("case.display.map_staff_route_ttl")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {(() => {
                const remaining = ttlMinutesRemaining(
                  state.result.solvedAtMs + state.result.travelMinutes * 60_000,
                  Date.now()
                );
                return remaining > 0
                  ? formatDriveTime(remaining, t)
                  : t("case.display.map_staff_route_overdue");
              })()}
            </span>
          </p>
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

export const StaffEtaTtlSection = memo(StaffEtaTtlSectionBase);
StaffEtaTtlSection.displayName = "StaffEtaTtlSection";

export default StaffEtaTtlSection;
