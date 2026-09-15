// src/cms/components/dashboard/dispatch/useOfficerStatusList.ts
//
// Reuses the same real unit-list query as the Unit Management admin screen
// (UnitManagementPage.tsx's useGetUnitsQuery), not the `EnhancedUnit`/
// `operational.availability.status` shape used only by the legacy v1/ unit-card
// demo (fed by mockUnits, not a live query) - raw `Unit` records carry no
// `operational` field at all, only `active`/`isLogin`/`isOutArea`.
import { useMemo } from "react";
import { useGetUnitsQuery } from "@/cms/store/api/unitApi";
import type { Unit } from "@/cms/types/unit";

const OFFICER_STATUS_LIST_LENGTH = 100;
/**
 * No org-wide push feed for unit status exists yet - see
 * Claude outputs/FE-BE_Dependency_Request_CAD-FE-Dispatch-Dashboard-Officer-Heatmap.md.
 * Poll instead of a one-shot fetch so the panel doesn't go stale for the length
 * of a whole dashboard session.
 */
const OFFICER_STATUS_POLL_INTERVAL_MS = 30000;

export type OfficerStatus = "available" | "busy" | "offline";

export interface OfficerStatusEntry {
  unitId: string;
  unitName: string;
  status: OfficerStatus;
}

/** `isOutArea` reads as "busy" here - out of its assigned area is the closest real signal this dataset has to "not readily available" without a maintenance/breakdown field. */
export const deriveOfficerStatus = (unit: Pick<Unit, "active" | "isLogin" | "isOutArea">): OfficerStatus => {
  if (!unit.active || !unit.isLogin) {
    return "offline";
  }
  return unit.isOutArea ? "busy" : "available";
};

export interface OfficerStatusListState {
  officers: OfficerStatusEntry[];
  isLoading: boolean;
}

export const useOfficerStatusList = (): OfficerStatusListState => {
  const { data, isLoading } = useGetUnitsQuery(
    { start: 0, length: OFFICER_STATUS_LIST_LENGTH },
    { pollingInterval: OFFICER_STATUS_POLL_INTERVAL_MS }
  );

  const officers = useMemo<OfficerStatusEntry[]>(
    () =>
      (data?.data ?? []).map(unit => ({
        unitId: unit.unitId,
        unitName: unit.unitName,
        status: deriveOfficerStatus(unit),
      })),
    [data]
  );

  return { officers, isLoading };
};
