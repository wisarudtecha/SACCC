// src/cms/utils/areaTree.ts
/**
 * Search over the org's nested area trees.
 *
 * A node matches on its Thai or English name. A match keeps its ancestors (so
 * the row stays reachable in the hierarchy) but NOT its siblings, and keeps its
 * own descendants (so matching a province still shows that province's
 * districts). The previous flat-list filter kept every province of a matching
 * country, which made a country-name search look like it had done nothing.
 */
import type { AreaCountryTree, AreaTreeProvinceNode } from "@/cms/types/area";

const matches = (node: { en?: string; th?: string }, needle: string): boolean =>
  (node.th || "").toLowerCase().includes(needle) ||
  (node.en || "").toLowerCase().includes(needle);

const filterProvince = (
  province: AreaTreeProvinceNode,
  needle: string
): AreaTreeProvinceNode | null => {
  if (matches(province, needle)) {
    // The province itself matched - keep it whole, districts included.
    return province;
  }

  const districts = (province.districts || []).filter(district => matches(district, needle));
  if (districts.length === 0) {
    return null;
  }
  return { ...province, districts };
};

export const filterAreaTrees = (
  trees: AreaCountryTree[],
  searchQuery: string
): AreaCountryTree[] => {
  const needle = (searchQuery || "").trim().toLowerCase();
  if (!needle) {
    return trees;
  }

  return trees.reduce<AreaCountryTree[]>((kept, country) => {
    if (matches(country, needle)) {
      kept.push(country);
      return kept;
    }

    const provinces = (country.provinces || [])
      .map(province => filterProvince(province, needle))
      .filter((province): province is AreaTreeProvinceNode => province !== null);

    if (provinces.length > 0) {
      kept.push({ ...country, provinces });
    }
    return kept;
  }, []);
};

/** Every country id present in the trees - used to target tree regeneration. */
export const findCountryIdByCode = (
  trees: AreaCountryTree[],
  countryCode: string
): number | undefined =>
  trees.find(country => country.countryId === countryCode)?.id;
