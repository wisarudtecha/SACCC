// Where boundary data comes from.
//
// This interface is the whole point of the module. There are two
// implementations and exactly one is live at a time, chosen by
// VITE_BOUNDARY_SOURCE:
//
//   orgAreaSource   (default) the organization's own area RECORDS (names,
//                   hierarchy, active flags) from the BFF, joined against
//                   GEOMETRY from the generated public/geo/thailand/ files
//                   (see scripts/build-thailand-boundaries.mjs). The area API
//                   no longer supplies coordinates at all - only which
//                   provinces/districts exist and what they're called.
//                   Levelled country -> province -> district.
//   mockFileSource  three static files under public/geo covering Bangkok.
//                   Levelled province -> district -> subdistrict. Kept as the
//                   reference view: flipping to it is the fastest way to tell a
//                   rendering bug apart from a backend data problem.
//
// Both hand the layer hook a URL per level, so nothing downstream knows which
// one it is talking to. The mock's URLs are static paths; the org source builds
// a GeoJSON FeatureCollection in memory and serves it as a blob: URL, which is
// what lets fetched data reach a GeoJSONLayer without giving up the label
// engine and the SQL filtering that a GraphicsLayer would cost.
//
// SELECTION genuinely scopes the district level's request here (it does not
// for the other level, or for mockFileSource - both of those datasets arrive
// whole and filter client-side via definitionExpression). District geometry is
// nationwide (77 files, one per province) specifically so this source can fetch
// ONLY the provinces the boundary selection has picked, per getLayerUrl's
// signature having always reserved the selection argument for exactly this.
//
// Backend contract gaps this file works around, both worth raising upstream:
//   - No Chinese names. Area records carry `en` and `th` only, so NAME_CN is
//     filled with the English name.
//   - No colour slot, no geometry. Both come from the static index/geometry
//     files instead, which is also where the adjacency-colouring now happens
//     (scripts/build-thailand-boundaries.mjs, at build time) - this source no
//     longer computes colour client-side the way it used to.
import store from "@/core/store/index";
import { areaApi } from "@/cms/store/api/area";
import type { AreaCountryTree, Country, AreaProvince, AreaDistrict, PolygonCoordinates } from "@/cms/types/area";
import { API_CONFIG } from "@/core/config/api";
import { buildAreaCountryTrees } from "@/cms/utils/areaTree";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import {
  EMPTY_BOUNDARY_INDEX,
  type AdminLevel,
  type BoundaryIndex,
  type BoundaryOption,
  type BoundarySelection
} from "./boundaryTypes";

export interface BoundarySource {
  /**
   * URL for a level's geometry. Async because a server-backed source has to
   * fetch before it can produce one; the mock resolves immediately.
   */
  getLayerUrl(level: AdminLevel, selection: BoundarySelection): Promise<string>;
  /**
   * Hand a URL back when the layer is torn down. Revokes a blob: URL; a no-op
   * for a source that serves static paths.
   */
  releaseLayerUrl(url: string): void;
  /** Options for the picker lists. Geometry-free and small. */
  loadIndex(): Promise<BoundaryIndex>;
}

// ===================================================================
// Local file source
// ===================================================================

/** Served from public/geo/, matching how the i18n catalogues are served. */
const GEO_BASE_PATH = "/geo";

/**
 * Mock-only, so it lives here rather than in the shared level table: a
 * server-backed source has no file name for a level, and putting one in
 * BoundaryLevelConfig would mean every org level carried a field that never
 * means anything.
 */
const LOCAL_FILE_BY_LEVEL: Partial<Record<AdminLevel, string>> = {
  province: "th-bangkok-province.geojson",
  district: "th-bangkok-district.geojson",
  subdistrict: "th-bangkok-subdistrict.geojson"
};

// Module-level so the index is fetched once per session rather than once per
// map. Both case surfaces mount this, and the expand modal briefly runs a second
// MapView, so without a shared promise the same file would be requested 3-4
// times on one screen.
let indexPromise: Promise<BoundaryIndex> | null = null;

async function fetchLocalIndex(): Promise<BoundaryIndex> {
  try {
    const response = await fetch(`${GEO_BASE_PATH}/th-bangkok-index.json`);
    if (!response.ok) {
      throw new Error(`Boundary index request failed with ${response.status}`);
    }
    const loaded = (await response.json()) as Partial<BoundaryIndex>;
    // The file predates the country level and has no key for it. Spreading over
    // the empty index keeps every AdminLevel present, which is what the full
    // Record type promises its readers.
    return { ...EMPTY_BOUNDARY_INDEX, ...loaded };
  }
  catch (error) {
    // Let the next mount try again rather than caching the failure for good.
    indexPromise = null;
    console.error("Failed to load the administrative boundary index", error);
    // An empty index disables the picker but leaves the rest of the map working.
    return EMPTY_BOUNDARY_INDEX;
  }
}

export const mockFileSource: BoundarySource = {
  getLayerUrl(level) {
    const fileName = LOCAL_FILE_BY_LEVEL[level];
    if (!fileName) {
      // Only reachable if the local table and this map disagree, which is a
      // programming error rather than a data one.
      return Promise.reject(new Error(`No local boundary file for level: ${level}`));
    }
    return Promise.resolve(`${GEO_BASE_PATH}/${fileName}`);
  },
  releaseLayerUrl() {
    // Static paths - nothing to release.
  },
  loadIndex() {
    indexPromise = indexPromise ?? fetchLocalIndex();
    return indexPromise;
  }
};

// ===================================================================
// Org area source
// ===================================================================

/** A GeoJSON feature as the org source emits it. Attributes per ORG_BOUNDARY_LEVELS. */
interface OrgFeature {
  type: "Feature";
  properties: {
    OBJECTID: number;
    CODE: string;
    PARENT: string | null;
    NAME_TH: string;
    NAME_EN: string;
    NAME_CN: string;
    COLOR_IDX: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: PolygonCoordinates;
  };
}

interface OrgFeatureCollection {
  type: "FeatureCollection";
  features: OrgFeature[];
}

/** Active nodes only - a deactivated area should not draw and should not be listed. */
function isActive(node: { active?: boolean }): boolean {
  return node.active !== false;
}

/**
 * One area as the org API describes it, before geometry/colour are joined in.
 *
 * `code` is the lineage-prefixed business identifier (see buildFlatOrgAreas)
 * that buildDefinitionExpression and the picker key off; `rawId` is the bare
 * provId/distId/countryId that the STATIC geometry/colour files are keyed by.
 * The two diverge because provId/distId are only unique within their parent
 * (the same lesson as serviceCenterMatch.ts's districtKey), while the static
 * files don't need lineage-prefixing at all - they cover exactly one country.
 */
interface OrgAreaNode {
  code: string;
  parent: string | null;
  rawId: string;
  en: string;
  th: string;
}

interface FlatOrgAreas {
  country: OrgAreaNode[];
  province: OrgAreaNode[];
  district: OrgAreaNode[];
  /** Districts grouped by their province's rawId - what getLayerUrl's district scoping needs. */
  districtsByProvinceRawId: Map<string, OrgAreaNode[]>;
}

const EMPTY_FLAT_ORG_AREAS: FlatOrgAreas = {
  country: [],
  province: [],
  district: [],
  districtsByProvinceRawId: new Map()
};

/**
 * Flattens the fetched trees into the three levels the org table declares,
 * WITHOUT touching geometry - `AreaCountryTree`'s nodes still carry a
 * `coordinates` field (the API may still send it), it is simply never read
 * here. Geometry is joined in later, per level, from the static files.
 */
function buildFlatOrgAreas(trees: readonly AreaCountryTree[]): FlatOrgAreas {
  const country: OrgAreaNode[] = [];
  const province: OrgAreaNode[] = [];
  const district: OrgAreaNode[] = [];
  const districtsByProvinceRawId = new Map<string, OrgAreaNode[]>();

  trees.filter(isActive).forEach((countryNode) => {
    const countryCode = countryNode.countryId;
    country.push({ code: countryCode, parent: null, rawId: countryCode, en: countryNode.en, th: countryNode.th });

    (countryNode.provinces || []).filter(isActive).forEach((provinceNode) => {
      // See OrgAreaNode's comment: the lineage prefix keeps `code` unique
      // across countries while `rawId` (province.provId) stays the plain
      // join key into the static geometry/colour files.
      const provinceCode = `${countryCode}_${provinceNode.provId}`;
      province.push({
        code: provinceCode,
        parent: countryCode,
        rawId: provinceNode.provId,
        en: provinceNode.en,
        th: provinceNode.th
      });

      const districtsForProvince: OrgAreaNode[] = [];
      (provinceNode.districts || []).filter(isActive).forEach((districtNode) => {
        const node: OrgAreaNode = {
          code: `${provinceCode}_${districtNode.distId}`,
          parent: provinceCode,
          rawId: districtNode.distId,
          en: districtNode.en,
          th: districtNode.th
        };
        district.push(node);
        districtsForProvince.push(node);
      });
      districtsByProvinceRawId.set(provinceNode.provId, districtsForProvince);
    });
  });

  return { country, province, district, districtsByProvinceRawId };
}

/**
 * Fetches the org's countries/provinces/districts as flat lists and joins
 * them into the same AreaCountryTree shape the old tree-cache endpoint used
 * to return - mirrors src/cms/hooks/useOrgAreaTrees.ts exactly (buildAreaCountryTrees
 * is the shared join logic), which cannot be reused here because this module
 * is not a React context - a BoundarySource is a plain object consulted by the
 * layer hook, not a hook itself. The imperative store.dispatch(endpoint.initiate(...))
 * form is the repo's established way to read RTK Query from outside React (see
 * components/case/uitls/CaseApiManager.tsx). Keep the two in step: a change to
 * how org trees are fetched belongs in both.
 *
 * Deliberately does NOT use generate_tree/getOrgCountryTree (the old tree
 * cache): these are plain DB reads with no generate step and no cache to go
 * stale, so RTK Query's own tag invalidation keeps them fresh automatically.
 */
async function fetchOrgTrees(): Promise<AreaCountryTree[]> {
  const countriesSubscription = store.dispatch(areaApi.endpoints.getCountries.initiate({ start: 0, length: 1000 }));
  const provincesSubscription = store.dispatch(areaApi.endpoints.getProvinces.initiate({ start: 0, length: 10000 }));
  const districtsSubscription = store.dispatch(areaApi.endpoints.getDistricts.initiate({ start: 0, length: 20000 }));

  try {
    const [countriesResult, provincesResult, districtsResult] = await Promise.all([
      countriesSubscription,
      provincesSubscription,
      districtsSubscription
    ]);
    const countries = (countriesResult.data?.data as Country[] | undefined) || [];
    const provinces = (provincesResult.data?.data as AreaProvince[] | undefined) || [];
    const districts = (districtsResult.data?.data as AreaDistrict[] | undefined) || [];
    return buildAreaCountryTrees(countries, provinces, districts);
  }
  finally {
    countriesSubscription.unsubscribe();
    provincesSubscription.unsubscribe();
    districtsSubscription.unsubscribe();
  }
}

// One shared promise, for the same reason as the mock's indexPromise: a screen
// can hold 3-4 MapViews and they should all share one fetch.
let flatOrgDataPromise: Promise<FlatOrgAreas> | null = null;

function loadFlatOrgData(): Promise<FlatOrgAreas> {
  flatOrgDataPromise = flatOrgDataPromise ?? fetchOrgTrees()
    .then(buildFlatOrgAreas)
    .catch((error: unknown) => {
      flatOrgDataPromise = null;
      console.error("Failed to load the organization's area records", error);
      return EMPTY_FLAT_ORG_AREAS;
    });
  return flatOrgDataPromise;
}

// ===================================================================
// Static geometry + colour, generated by scripts/build-thailand-boundaries.mjs
// ===================================================================

const GEO_THAILAND_BASE_PATH = "/geo/thailand";

/** One entry from th-boundary-index.json - geometry-free, keyed by the RAW code. */
interface StaticIndexEntry {
  code: string;
  parent: string | null;
  th: string;
  en: string;
  cn: string;
  color: number;
}

interface StaticIndex {
  country: StaticIndexEntry[];
  province: StaticIndexEntry[];
  district: StaticIndexEntry[];
}

const EMPTY_STATIC_INDEX: StaticIndex = { country: [], province: [], district: [] };

async function fetchStaticIndex(): Promise<StaticIndex> {
  const response = await fetch(`${GEO_THAILAND_BASE_PATH}/th-boundary-index.json`);
  if (!response.ok) {
    throw new Error(`Thailand boundary index request failed with ${response.status}`);
  }
  return (await response.json()) as StaticIndex;
}

// Fetched once for the session - this is the small (~100KB), geometry-free
// option list covering the whole country, so the picker can list every
// province/district before (or without) any geometry file being fetched.
let staticIndexPromise: Promise<StaticIndex> | null = null;

function loadStaticIndex(): Promise<StaticIndex> {
  staticIndexPromise = staticIndexPromise ?? fetchStaticIndex().catch((error: unknown) => {
    staticIndexPromise = null;
    console.error("Failed to load the Thailand boundary index", error);
    return EMPTY_STATIC_INDEX;
  });
  return staticIndexPromise;
}

function colorMapFrom(entries: readonly StaticIndexEntry[]): Map<string, number> {
  return new Map(entries.map((entry) => [entry.code, entry.color]));
}

/**
 * Expands a fetched .topojson file into a Map of raw CODE -> Polygon rings.
 *
 * Every level's static file is built by scripts/build-thailand-boundaries.mjs
 * as a single named topology object wrapping a FeatureCollection, so there is
 * always exactly one object key and topojson-client's `feature()` always hands
 * back a FeatureCollection (never a bare Feature) for it - see that script's
 * `writeTopology` and the GeometryCollection shape topojson-server produces
 * from a FeatureCollection input.
 */
async function fetchTopoFeatureGeometries(url: string): Promise<Map<string, PolygonCoordinates>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Boundary geometry request failed with ${response.status}: ${url}`);
  }
  const topology = (await response.json()) as Topology;
  const objectName = Object.keys(topology.objects)[0];
  const collection = feature(topology, topology.objects[objectName]);
  const features = "features" in collection ? collection.features : [collection];

  const byCode = new Map<string, PolygonCoordinates>();
  for (const featureEntry of features) {
    const code = (featureEntry.properties as { CODE?: string } | null)?.CODE;
    if (code && featureEntry.geometry?.type === "Polygon") {
      byCode.set(code, featureEntry.geometry.coordinates as PolygonCoordinates);
    }
  }
  return byCode;
}

let countryGeometryPromise: Promise<Map<string, PolygonCoordinates>> | null = null;

function loadCountryGeometry(): Promise<Map<string, PolygonCoordinates>> {
  countryGeometryPromise = countryGeometryPromise ??
    fetchTopoFeatureGeometries(`${GEO_THAILAND_BASE_PATH}/th-country.topojson`).catch((error: unknown) => {
      countryGeometryPromise = null;
      console.error("Failed to load the Thailand country boundary", error);
      return new Map<string, PolygonCoordinates>();
    });
  return countryGeometryPromise;
}

// Fetched once per session and reused by every getLayerUrl("province", ...)
// call - this is also what makes the province layer "preloaded": the
// country+province build effect in useAdminBoundaryLayers.ts calls
// getLayerUrl for every level unconditionally on mount, regardless of
// visibility, so this fetch fires as soon as a case map mounts.
let provinceGeometryPromise: Promise<Map<string, PolygonCoordinates>> | null = null;

function loadProvinceGeometry(): Promise<Map<string, PolygonCoordinates>> {
  provinceGeometryPromise = provinceGeometryPromise ??
    fetchTopoFeatureGeometries(`${GEO_THAILAND_BASE_PATH}/th-province-all.topojson`).catch((error: unknown) => {
      provinceGeometryPromise = null;
      console.error("Failed to load the Thailand province boundaries", error);
      return new Map<string, PolygonCoordinates>();
    });
  return provinceGeometryPromise;
}

// Fetched on demand, one file per province, cached per province so re-selecting
// an already-picked province is free. THIS is the level-of-detail mechanism -
// a province never fetched here never costs a single byte of district geometry.
const districtGeometryByProvince = new Map<string, Promise<Map<string, PolygonCoordinates>>>();

function loadDistrictGeometry(provId: string): Promise<Map<string, PolygonCoordinates>> {
  let cached = districtGeometryByProvince.get(provId);
  if (!cached) {
    cached = fetchTopoFeatureGeometries(`${GEO_THAILAND_BASE_PATH}/district/${provId}.topojson`).catch(
      (error: unknown) => {
        districtGeometryByProvince.delete(provId);
        console.error(`Failed to load district boundaries for province ${provId}`, error);
        return new Map<string, PolygonCoordinates>();
      }
    );
    districtGeometryByProvince.set(provId, cached);
  }
  return cached;
}

// ===================================================================
// Joining org records with static geometry/colour
// ===================================================================

/**
 * Nodes without a matching static geometry still get an option (they are real
 * areas per the org's own records, and the user should see them in the list)
 * but no drawn feature. A mismatch here means the org has a province/district
 * the static Thailand dataset doesn't (or vice versa) - logged so a real data
 * gap is visible rather than silently drawing nothing (REQ 8).
 */
function buildFeatures(
  nodes: readonly OrgAreaNode[],
  geometryByRawId: ReadonlyMap<string, PolygonCoordinates>,
  colorByRawId: ReadonlyMap<string, number>,
  levelLabel: string
): OrgFeature[] {
  const features: OrgFeature[] = [];
  nodes.forEach((node) => {
    const rings = geometryByRawId.get(node.rawId);
    if (!rings) {
      console.error(`No ${levelLabel} boundary geometry for ${node.rawId} (${node.en})`);
      return;
    }
    features.push({
      type: "Feature",
      properties: {
        // GeoJSONLayer needs an objectIdField and will not invent one.
        OBJECTID: features.length + 1,
        CODE: node.code,
        PARENT: node.parent,
        NAME_TH: node.th || node.en,
        NAME_EN: node.en,
        NAME_CN: node.en,
        COLOR_IDX: colorByRawId.get(node.rawId) ?? 0
      },
      geometry: { type: "Polygon", coordinates: rings }
    });
  });
  return features;
}

function buildOptions(
  nodes: readonly OrgAreaNode[],
  colorByRawId: ReadonlyMap<string, number>,
  levelLabel: string
): BoundaryOption[] {
  return nodes.map((node) => {
    const color = colorByRawId.get(node.rawId);
    if (color === undefined) {
      console.error(`No ${levelLabel} boundary data for ${node.rawId} (${node.en}) - listed without a matched colour`);
    }
    return { code: node.code, parent: node.parent, th: node.th, en: node.en, cn: node.en, color: color ?? 0 };
  });
}

/**
 * Blob URLs, cached per KEY - a plain level name for country/province (their
 * content never varies), or `district:<sorted provIds>` for district (its
 * content is exactly whichever provinces are currently selected).
 *
 * Cached rather than minted per call so that the expand modal's second MapView
 * reuses the first one's URL instead of serialising the same FeatureCollection
 * again. Reference-counted because both views release independently and the
 * first teardown must not revoke a URL the other one is still drawing from.
 */
const blobUrlByKey = new Map<string, string>();
const blobRefCount = new Map<string, number>();

function retainBlobUrl(key: string, collection: OrgFeatureCollection): string {
  let url = blobUrlByKey.get(key);
  if (!url) {
    const blob = new Blob([JSON.stringify(collection)], { type: "application/geo+json" });
    url = URL.createObjectURL(blob);
    blobUrlByKey.set(key, url);
  }
  blobRefCount.set(url, (blobRefCount.get(url) ?? 0) + 1);
  return url;
}

/**
 * Drops the cached ORG RECORDS (names/hierarchy/active flags) and their
 * derived blobs so the next map read rebuilds them. Area edits never reach
 * this module otherwise: without this a map opened after an edit keeps
 * drawing the pre-edit names/hierarchy until a full page reload. Call it
 * wherever an area write lands (see AreaManagement's refreshAfterWrite).
 *
 * Static geometry/colour caches are NOT cleared here - they come from
 * build-time files that never change at runtime, unlike the org's own
 * records.
 *
 * The blob URLs are forgotten but deliberately NOT revoked: a mounted MapView
 * may still be drawing from one, and its own releaseLayerUrl call still
 * revokes it once the last holder lets go. Forgetting them is what makes the
 * next getLayerUrl serialise the new data instead of handing back the stale
 * blob.
 */
export function invalidateOrgBoundaryData(): void {
  flatOrgDataPromise = null;
  blobUrlByKey.clear();
}

export const orgAreaSource: BoundarySource = {
  async getLayerUrl(level, selection) {
    const [flat, staticIndex] = await Promise.all([loadFlatOrgData(), loadStaticIndex()]);

    if (level === "country") {
      const geometry = await loadCountryGeometry();
      const features = buildFeatures(flat.country, geometry, colorMapFrom(staticIndex.country), "country");
      return retainBlobUrl("country", { type: "FeatureCollection", features });
    }

    if (level === "province") {
      const geometry = await loadProvinceGeometry();
      const features = buildFeatures(flat.province, geometry, colorMapFrom(staticIndex.province), "province");
      return retainBlobUrl("province", { type: "FeatureCollection", features });
    }

    if (level === "district") {
      // selection.province carries LINEAGE-PREFIXED codes; the static files
      // and loadDistrictGeometry key by the bare provId, so resolve through
      // the org's own province list rather than parsing the composite code.
      const provinceRawIds = [
        ...new Set(
          selection.province
            .map((code) => flat.province.find((province) => province.code === code)?.rawId)
            .filter((rawId): rawId is string => Boolean(rawId))
        )
      ].sort();

      if (provinceRawIds.length === 0) {
        return retainBlobUrl("district:none", { type: "FeatureCollection", features: [] });
      }

      const geometryMaps = await Promise.all(provinceRawIds.map((provId) => loadDistrictGeometry(provId)));
      const mergedGeometry = new Map<string, PolygonCoordinates>();
      geometryMaps.forEach((map) => map.forEach((rings, code) => mergedGeometry.set(code, rings)));

      const nodes = provinceRawIds.flatMap((provId) => flat.districtsByProvinceRawId.get(provId) ?? []);
      const features = buildFeatures(nodes, mergedGeometry, colorMapFrom(staticIndex.district), "district");
      return retainBlobUrl(`district:${provinceRawIds.join(",")}`, { type: "FeatureCollection", features });
    }

    // subdistrict: the org table has no fourth level.
    return retainBlobUrl("subdistrict", { type: "FeatureCollection", features: [] });
  },

  releaseLayerUrl(url) {
    const remaining = (blobRefCount.get(url) ?? 0) - 1;
    if (remaining > 0) {
      blobRefCount.set(url, remaining);
      return;
    }
    blobRefCount.delete(url);
    for (const [key, cached] of blobUrlByKey) {
      if (cached === url) {
        blobUrlByKey.delete(key);
      }
    }
    URL.revokeObjectURL(url);
  },

  async loadIndex() {
    const [flat, staticIndex] = await Promise.all([loadFlatOrgData(), loadStaticIndex()]);
    return {
      country: buildOptions(flat.country, colorMapFrom(staticIndex.country), "country"),
      province: buildOptions(flat.province, colorMapFrom(staticIndex.province), "province"),
      district: buildOptions(flat.district, colorMapFrom(staticIndex.district), "district"),
      subdistrict: []
    };
  }
};

/**
 * The source the app uses. A single named export rather than a prop threaded
 * through every component: there is exactly one source at a time, and the switch
 * is a deploy-time decision, not a per-map one.
 */
export const boundarySource: BoundarySource =
  API_CONFIG.BOUNDARY_SOURCE === "local" ? mockFileSource : orgAreaSource;
