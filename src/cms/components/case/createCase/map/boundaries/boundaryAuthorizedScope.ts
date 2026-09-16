// Expands a dispatcher's authorized District ids into the codes they imply at
// every coarser level, so the boundary picker in case-assignment mode can be
// scoped to the dispatcher's own area of responsibility even though the
// backend's `distIdLists` names districts only (GetOrgCountryTree has no
// notion of "restrict to these districts" itself - see boundarySource.ts).
//
// Walks the already-loaded BoundaryIndex rather than re-fetching anything:
// each district's `parent` is its province, and each kept province's `parent`
// is its country, so one pass up from the authorized districts is enough.
import type { AdminLevel, BoundaryIndex } from "./boundaryTypes";

export type AuthorizedScope = Partial<Record<AdminLevel, ReadonlySet<string>>>;

/**
 * Empty (no authorized ids, or none of them resolve against the loaded index)
 * means "unrestricted" to every caller - see restrictBoundaryIndex.
 */
export function expandAuthorizedScope(
  index: BoundaryIndex,
  authorizedDistrictIds: readonly string[]
): AuthorizedScope {
  if (authorizedDistrictIds.length === 0) {
    return {};
  }

  const authorized = new Set(authorizedDistrictIds);
  const districts = index.district.filter((option) => authorized.has(option.code));
  if (districts.length === 0) {
    return {};
  }

  const provinceCodes = new Set(
    districts.map((district) => district.parent).filter((code): code is string => code !== null)
  );
  const provinces = index.province.filter((option) => provinceCodes.has(option.code));

  const countryCodes = new Set(
    provinces.map((province) => province.parent).filter((code): code is string => code !== null)
  );
  const countries = index.country.filter((option) => countryCodes.has(option.code));

  return {
    district: new Set(districts.map((option) => option.code)),
    province: new Set(provinces.map((option) => option.code)),
    country: new Set(countries.map((option) => option.code))
  };
}
