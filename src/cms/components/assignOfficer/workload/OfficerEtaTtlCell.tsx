// The "ETA / TTL" column cell for one officer row.
//
// Computed ON DEMAND per row (Decision #3) — nothing solves until the dispatcher
// presses Calculate on that row. It renders against the exact same `RouteState`,
// formatters (`formatDriveTime` / `formatEtaClock` / `ttlMinutesRemaining`) and
// calculate button (`StaffRouteCalculateButton`) the map staff panel's
// StaffEtaTtlSection uses, so the value shown here for a given officer/case pair
// matches the map panel's for the same pair (Acceptance Criteria §13).
//
// The solve itself is owned by `useOfficerRouteSolves`; this component is pure
// presentation over the state it's handed. A failed/absent solve shows here and
// blocks nothing else.
import { memo, useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  formatDriveTime,
  formatEtaClock,
  routeErrorKey,
  ttlMinutesRemaining,
} from "@/cms/components/case/createCase/map/staff/routeFormat";
import StaffRouteCalculateButton from "@/cms/components/case/createCase/map/staff/StaffRouteCalculateButton";
import type { RouteState } from "@/cms/components/case/createCase/map/staff/routeTypes";

/** How often the TTL countdown re-renders. Display-only — never a re-solve. */
const TTL_TICK_MS = 30_000;

interface OfficerEtaTtlCellProps {
  state: RouteState;
  canSolve: boolean;
  cooldownSeconds: number;
  onSolve: () => void;
}

function OfficerEtaTtlCellBase({ state, canSolve, cooldownSeconds, onSolve }: OfficerEtaTtlCellProps) {
  const { t, language } = useTranslation();

  const [, setTick] = useState(0);
  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    const intervalId = window.setInterval(() => setTick((tick) => tick + 1), TTL_TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [state.status]);

  return (
    <div
      className="flex w-full flex-col items-stretch gap-1 text-xs"
      onClick={(event) => event.stopPropagation()}
    >
      {state.status === "idle" && (
        <p className="text-center text-gray-400 dark:text-gray-500">
          {t("case.display.map_staff_route_none")}
        </p>
      )}

      {state.status === "error" && (
        <p className="text-center text-amber-600 dark:text-amber-400">
          {t(routeErrorKey(state.reason))}
        </p>
      )}

      {state.status === "ready" && (
        <div className="space-y-0.5 text-gray-700 dark:text-gray-300">
          <p>
            {t("case.display.map_staff_route_drive_time")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDriveTime(state.result.travelMinutes, t)}
            </span>
          </p>
          <p>
            {t("case.display.map_staff_route_eta")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {formatEtaClock(
                state.result.solvedAtMs + state.result.travelMinutes * 60_000,
                language
              )}
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
        </div>
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

export const OfficerEtaTtlCell = memo(OfficerEtaTtlCellBase);
OfficerEtaTtlCell.displayName = "OfficerEtaTtlCell";

export default OfficerEtaTtlCell;
