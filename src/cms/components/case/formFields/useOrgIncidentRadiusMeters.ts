// The org-configured fallback radius (metres) for the no-match incident circle.
//
// Mirrors useUnitWorkloads: behind this facade sits either the real org-settings
// endpoint (GET /organizations/{orgId}) or nothing (mock mode / backend not
// shipped). The RTK hook is always called so hook order stays stable, but it is
// `skip`ped in mock mode or when there is no orgId.
//
// FAILURE IS ISOLATED HERE. The org-settings route and its `incidentRadiusMeters`
// field do not exist server-side yet; a 404 / missing field / bad shape all
// surface as "no value" and this returns DEFAULT_INCIDENT_RADIUS_METERS. It
// never throws and never blocks the Service Center match.
import { useAuth } from "@/core/hooks/useAuth";
import { useGetOrgSettingsQuery } from "@/core/store/api/organizationApi";
import { isOrgSettings } from "@/core/types/organization";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { DEFAULT_INCIDENT_RADIUS_METERS, pickIncidentRadiusMeters } from "@/cms/utils/incidentRadius";

export function useOrgIncidentRadiusMeters(): number {
  const { state } = useAuth();
  const orgId = state.user?.orgId ?? "";
  const isMock = DEV_CONFIG.MOCK_API;

  const { data } = useGetOrgSettingsQuery(orgId, { skip: !orgId || isMock });

  if (isMock || !isOrgSettings(data?.data)) {
    return DEFAULT_INCIDENT_RADIUS_METERS;
  }
  return pickIncidentRadiusMeters(data.data.incidentRadiusMeters);
}
