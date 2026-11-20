// How often the ETA/TTL countdown re-renders, from the org's `staff.etaTtl` setting.
//
// The two surfaces that show the countdown (the map's staff panel and the
// assignment picker's per-officer column) must tick at the same rate, so the
// resolution lives in `staffCadence.ts` and this hook only supplies the document.
//
// Reading the document here rather than taking a prop keeps both call sites
// honest: a new surface cannot forget to pass the interval and quietly fall back
// to a hardcoded 30s. RTK Query dedupes the read with everything else on the
// screen.
import { useOrgMapSettings } from "@/cms/components/admin/system-configuration/settings/useOrgMapSettings";
import { resolveEtaTtlTickMs } from "./staffCadence";

export function useEtaTtlTickMs(): number {
  const { loaded } = useOrgMapSettings();
  return resolveEtaTtlTickMs(loaded.staff.etaTtl);
}
