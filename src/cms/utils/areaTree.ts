// src/cms/utils/areaTree.ts
/**
 * Reading and searching the org's nested area trees.
 *
 * A node matches on its Thai or English name. A match keeps its ancestors (so
 * the row stays reachable in the hierarchy) but NOT its siblings, and keeps its
 * own descendants (so matching a province still shows that province's
 * districts). The previous flat-list filter kept every province of a matching
 * country, which made a country-name search look like it had done nothing.
 */
import { readEnvelopeMessage, readMutationError } from "@/core/utils/apiResponseStatus";
import type { EnvelopeLike } from "@/core/utils/apiResponseStatus";
import type {
  AreaCountryTree,
  AreaTreeProvinceNode,
  AreaTreeDistrictNode,
  Country,
  AreaProvince,
  AreaDistrict
} from "@/cms/types/area";

// ===================================================================
// Reading a tree response
// ===================================================================

/**
 * Whether a value really is a country tree.
 *
 * The array check is the whole point. `normalizeToApiResponse` coerces a null payload to `[]`,
 * and `Boolean([])` is true - so every `if (response.data)` guard in this codebase used to let
 * an un-generated tree through as if it were a country, which is how blank rows, "undefined
 * (undefined)" select options and phantom map boundaries all appeared at once.
 */
export const isAreaCountryTree = (value: unknown): value is AreaCountryTree =>
  Boolean(value)
  && typeof value === "object"
  && !Array.isArray(value)
  && typeof (value as AreaCountryTree).countryId === "string";

/**
 * `not-generated` is the recoverable case: the tree is a server-side cache that nothing has
 * built yet, and the remedy is the Generate button rather than an error. `failed` is everything
 * else - a real fault the user cannot fix from this screen.
 */
export type AreaTreeOutcome = "ok" | "not-generated" | "failed";

export interface AreaTreeRead {
  tree?: AreaCountryTree;
  outcome: AreaTreeOutcome;
  /** The server's own wording, for a toast or a banner. Empty when it said nothing. */
  message: string;
}

/**
 * The BFF answers an un-generated tree with "Tree not generated yet for this area country, call
 * generate_tree first". Its wording is the only signal that separates this from any other
 * rejection - `status` is "-1" for every business failure alike - so match it loosely enough to
 * survive a rephrase, and fall back to `failed`, which is the safe direction to be wrong in.
 */
const classifyFailure = (message: string): AreaTreeOutcome => {
  const text = message.toLowerCase();
  return (text.includes("generate_tree") || text.includes("not generated"))
    ? "not-generated"
    : "failed";
};

/** Reads a tree request that resolved. */
export const readAreaCountryTree = (response: EnvelopeLike | undefined | null): AreaTreeRead => {
  const message = readEnvelopeMessage(response);
  if (isAreaCountryTree(response?.data)) {
    return { tree: response?.data, outcome: "ok", message };
  }
  return { outcome: classifyFailure(message), message };
};

/**
 * Reads a tree request that rejected.
 *
 * Both paths exist because `hybridBaseQuery` now turns a negative envelope into a real RTK
 * error, while an envelope with no conclusive status still resolves - so a caller has to
 * classify whichever way its request settled.
 */
export const readAreaCountryTreeFailure = (error: unknown): AreaTreeRead => {
  const message = readMutationError(error);
  return { outcome: classifyFailure(message), message };
};

// ===================================================================
// Search
// ===================================================================

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

// ===================================================================
// Joining the flat list endpoints into the tree shape
// ===================================================================
// GetCountries/GetProvinces/GetDistricts return flat, unnested records - this
// rebuilds the same AreaCountryTree shape the tree-cache endpoint returns, so
// every downstream consumer (AreaHierarchyView, filterAreaTrees,
// findCountryIdByCode) keeps working unchanged regardless of which fetch
// strategy feeds it.
//
// Provinces join to their country by `countryId` (business code). Districts
// join by the *composite* `countryId:provId`, not `provId` alone - a province
// code is only unique within its own country, so joining on provId alone
// would let a district attach to the wrong country whenever two countries
// happen to share a province code.

const toTreeDistrict = (district: AreaDistrict): AreaTreeDistrictNode => ({
  id: district.id,
  distId: district.distId,
  en: district.en,
  th: district.th,
  active: district.active,
  postcode: district.postcode,
  coordinates: district.coordinates
});

const toTreeProvince = (
  province: AreaProvince,
  districts: AreaDistrict[]
): AreaTreeProvinceNode => ({
  id: province.id,
  provId: province.provId,
  en: province.en,
  th: province.th,
  active: province.active,
  coordinates: province.coordinates,
  districts: districts.map(toTreeDistrict)
});

export const buildAreaCountryTrees = (
  countries: Country[],
  provinces: AreaProvince[],
  districts: AreaDistrict[]
): AreaCountryTree[] => {
  const districtsByProvince = new Map<string, AreaDistrict[]>();
  districts.forEach(district => {
    const key = `${district.countryId}:${district.provId}`;
    const bucket = districtsByProvince.get(key);
    if (bucket) {
      bucket.push(district);
    }
    else {
      districtsByProvince.set(key, [district]);
    }
  });

  const provincesByCountry = new Map<string, AreaProvince[]>();
  provinces.forEach(province => {
    const bucket = provincesByCountry.get(province.countryId);
    if (bucket) {
      bucket.push(province);
    }
    else {
      provincesByCountry.set(province.countryId, [province]);
    }
  });

  return countries.map(country => ({
    id: country.id,
    countryId: country.countryId,
    en: country.en,
    th: country.th,
    active: country.active,
    coordinates: country.coordinates,
    yearOfData: country.yearOfData,
    shapeArea: country.shapeArea,
    shapeLength: country.shapeLength,
    provinces: (provincesByCountry.get(country.countryId) || []).map(province =>
      toTreeProvince(province, districtsByProvince.get(`${province.countryId}:${province.provId}`) || [])
    )
  }));
};
