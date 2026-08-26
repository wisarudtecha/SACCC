// src/cms/hooks/useOrgAreaTrees.ts
/**
 * Builds the org's nested area trees from the flat list endpoints.
 *
 * GetCountries/GetProvinces/GetDistricts are plain DB reads - no generate-tree
 * step, no cache to go stale. RTK Query's own tag invalidation
 * (`invalidatesTags: ["Area"]` on every area mutation, `providesTags: ["Area"]`
 * on these three queries) refetches them automatically after a write, so this
 * hook needs no manual reload token or subscription bookkeeping - just three
 * standard queries joined client-side.
 */
import { useMemo } from "react";
import { useGetCountriesQuery, useGetProvincesQuery, useGetDistrictsQuery } from "@/cms/store/api/area";
import { buildAreaCountryTrees } from "@/cms/utils/areaTree";
import type { AreaCountryTree, Country } from "@/cms/types/area";

interface UseOrgAreaTreesResult {
  trees: AreaCountryTree[];
  /** Country list records - the hierarchy's provenance fields (e.g. sourceTemplateId) come from here. */
  countries: Country[];
  isLoading: boolean;
}

export const useOrgAreaTrees = (): UseOrgAreaTreesResult => {
  const { data: countriesResp, isLoading: isLoadingCountries } = useGetCountriesQuery({ start: 0, length: 1000 });
  const { data: provincesResp, isLoading: isLoadingProvinces } = useGetProvincesQuery({ start: 0, length: 10000 });
  const { data: districtsResp, isLoading: isLoadingDistricts } = useGetDistrictsQuery({ start: 0, length: 20000 });

  const countries = useMemo(() => countriesResp?.data || [], [countriesResp]);

  const trees = useMemo(
    () => buildAreaCountryTrees(countries, provincesResp?.data || [], districtsResp?.data || []),
    [countries, provincesResp, districtsResp]
  );

  return {
    trees,
    countries,
    isLoading: isLoadingCountries || isLoadingProvinces || isLoadingDistricts
  };
};
