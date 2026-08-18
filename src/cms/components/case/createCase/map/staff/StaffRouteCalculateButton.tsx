// The "Calculate route" / "Recalculate" button shared by StaffSmartRoutingSection
// and StaffEtaTtlSection. Both sections render against the same RouteState, so
// this is the one place the label/cooldown/spinner logic is decided - keeping
// it here is what guarantees the two sections can never disagree.
import { memo } from "react";
import { Loader2, RotateCw, Route } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { RouteState } from "./routeTypes";

interface StaffRouteCalculateButtonProps {
  state: RouteState;
  canSolve: boolean;
  cooldownSeconds: number;
  onSolve: () => void;
}

function StaffRouteCalculateButtonBase({
  state,
  canSolve,
  cooldownSeconds,
  onSolve
}: StaffRouteCalculateButtonProps) {
  const { t } = useTranslation();
  const isSolving = state.status === "solving";
  const isRecalculate = state.status === "ready";

  const label = isRecalculate
    ? t("case.display.map_staff_route_recalculate")
    : t("case.display.map_staff_route_calculate");

  // The cooldown still blocks clicks via `disabled` below - only the visible
  // countdown text is gone. Kept as an aria-label so screen readers still get
  // the wait time announced, without a ticking number sighted users see.
  const isCoolingDown = !canSolve && !isSolving && cooldownSeconds > 0;

  return (
    <button
      type="button"
      onClick={onSolve}
      disabled={!canSolve}
      aria-busy={isSolving}
      aria-label={isCoolingDown ? t("case.display.map_staff_refresh_wait", { seconds: cooldownSeconds }) : undefined}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
    >
      {isSolving ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : isRecalculate ? (
        <RotateCw className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Route className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{isSolving ? t("case.display.map_staff_route_solving") : label}</span>
    </button>
  );
}

export const StaffRouteCalculateButton = memo(StaffRouteCalculateButtonBase);
StaffRouteCalculateButton.displayName = "StaffRouteCalculateButton";

export default StaffRouteCalculateButton;
