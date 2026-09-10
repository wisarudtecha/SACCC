// The org-configured incident-map behaviour for the Service Center match: the
// fallback-circle radius, whether that circle renders at all, and whether a
// single polygon match auto-selects + locks the field.
//
// Mirrors the old useOrgIncidentRadiusMeters facade but sources the nested
// OrgMapIncidentSettings shape (GET /organizations/{orgId}/map-settings), which
// supersedes the flat OrgSettings.incidentRadiusMeters.
//
// FAILURE IS ALREADY ISOLATED in useOrgMapSettings: a 404 / GraphQL error / bad
// shape / mock mode all resolve to buildDefaultOrgMapSettings (radius 900,
// showRadius true, autoLock true). `loaded` is therefore always a fully
// populated record, this hook never throws, and it never blocks the match.
import { useMemo } from "react";
import { useOrgMapSettings } from "@/cms/components/admin/system-configuration/settings/useOrgMapSettings";
import { pickIncidentRadiusMeters } from "@/cms/utils/incidentRadius";

export interface OrgIncidentMapConfig {
  /** Fallback circle radius in metres, coerced to a finite positive number. */
  radiusMeters: number;
  /** Draw the no-match fallback circle. */
  showRadius: boolean;
  /** Auto-select + lock the Service Center field on a single polygon match. */
  autoLockOnMatch: boolean;
}

export function useOrgIncidentMapConfig(): OrgIncidentMapConfig {
  const { loaded } = useOrgMapSettings();
  const { radiusMeters, showRadius, autoLockServiceCenterOnMatch } = loaded.incident;

  // Memoised on the primitives so the returned object identity is stable - it
  // feeds a useMemo dep array in useServiceCenterMatch.
  return useMemo<OrgIncidentMapConfig>(
    () => ({
      radiusMeters: pickIncidentRadiusMeters(radiusMeters),
      showRadius: showRadius !== false,
      autoLockOnMatch: autoLockServiceCenterOnMatch !== false
    }),
    [radiusMeters, showRadius, autoLockServiceCenterOnMatch]
  );
}
