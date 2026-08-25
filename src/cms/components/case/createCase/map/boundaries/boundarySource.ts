// Where boundary data comes from.
//
// This interface is the whole point of the module. There are two
// implementations and exactly one is live at a time, chosen by
// VITE_BOUNDARY_SOURCE:
//
//   orgAreaSource   (default) the organization's own area data, from the BFF.
//                   Levelled country -> province -> district.
//   mockFileSource  three static files under public/geo covering Bangkok.
//                   Levelled province -> district -> subdistrict. Kept as the
//                   reference view: flipping to it is the fastest way to tell a
//                   rendering bug apart from a backend data problem.
//
// Both hand the layer hook a URL per level, so nothing downstream knows which
// one it is talking to. The mock's URLs are static paths; the org source builds
// a GeoJSON FeatureCollection in memory and serves it as a blob: URL, which is
// what lets a JSON-over-RTK-Query payload reach a GeoJSONLayer without giving up
// the label engine and the SQL filtering that a GraphicsLayer would cost.
//
// SELECTION is passed to getLayerUrl even though neither implementation scopes
// its request by it. Both datasets arrive whole - one city, or one org - and the
// layer filters client-side via definitionExpression. A future source backed by
// the country-wide, every-sub-district dataset (77 provinces / 928 districts /
// ~7,255 sub-districts, 20-50MB of geometry) could not do that, and would put
// the selected parent codes into the URL instead; having the argument in the
// signature now is what keeps that swap mechanical.
//
// Backend contract gaps this file works around, both worth raising upstream:
//   - No Chinese names. Area records carry `en` and `th` only, so NAME_CN is
//     filled with the English name.
//   - No colour slot. Computed here by adjacency - see boundaryColoring.ts for
//     why a hash would not do.
import store from "@/core/store/index";
import { areaApi } from "@/cms/store/api/area";
import type {
  AreaCountryTree,
  AreaTreeProvinceNode,
  Country,
  PolygonCoordinates
} from "@/cms/types/area";
import { API_CONFIG } from "@/core/config/api";
import {
  readAreaCountryTree,
  // readAreaCountryTreeFailure
} from "@/cms/utils/areaTree";
import { BOUNDARY_PALETTE_SIZE } from "./boundaryColors";
import { assignBoundaryColors } from "./boundaryColoring";
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

/** One level's worth of built data, before it becomes a blob. */
interface OrgLevelData {
  collection: OrgFeatureCollection;
  options: BoundaryOption[];
}

type OrgLevelDataByLevel = Record<AdminLevel, OrgLevelData>;

/** A node as it appears at any level of the tree, before geometry is required. */
interface OrgNodeInput {
  code: string;
  parent: string | null;
  en: string;
  th: string;
  coordinates?: PolygonCoordinates | null;
}

function emptyLevelData(): OrgLevelData {
  return { collection: { type: "FeatureCollection", features: [] }, options: [] };
}

/**
 * Turns one level's nodes into a FeatureCollection plus its picker options.
 *
 * Colouring runs over the whole level at once - adjacency is a property of the
 * set, not of any one area - and the same slot is written to both outputs so the
 * picker's swatch matches the polygon on the map.
 *
 * Nodes without geometry still get an option (they are real areas, and the user
 * should see them in the list) but no feature, since there is nothing to draw.
 */
function buildLevelData(nodes: readonly OrgNodeInput[]): OrgLevelData {
  if (nodes.length === 0) {
    return emptyLevelData();
  }

  const { colors } = assignBoundaryColors(
    nodes.map((node) => node.coordinates),
    BOUNDARY_PALETTE_SIZE
  );

  const features: OrgFeature[] = [];
  const options: BoundaryOption[] = [];

  nodes.forEach((node, index) => {
    const colorIndex = colors[index] ?? 0;
    // The area API carries no Chinese name, so cn is the English one. Doing the
    // fallback here rather than at render time keeps the index and the map
    // labels showing the same string.
    const nameCn = node.en;

    options.push({
      code: node.code,
      parent: node.parent,
      th: node.th,
      en: node.en,
      cn: nameCn,
      color: colorIndex
    });

    const rings = node.coordinates;
    if (!rings || rings.length === 0) {
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
        NAME_CN: nameCn,
        COLOR_IDX: colorIndex
      },
      // NOTE: PolygonCoordinates is number[][][] - a single polygon's rings. The
      // type cannot express a MultiPolygon, so an area made of separate pieces
      // (an island province, an exclave) will render as one polygon whose rings
      // are read as holes. Raised with backend; if they start returning
      // multi-part geometry this is the line that has to change.
      geometry: { type: "Polygon", coordinates: rings }
    });
  });

  return { collection: { type: "FeatureCollection", features }, options };
}

/** Active nodes only - a deactivated area should not draw and should not be listed. */
function isActive(node: { active?: boolean }): boolean {
  return node.active !== false;
}

/**
 * Flattens the fetched trees into the three levels the org table declares.
 *
 * Codes are the business identifiers (countryId / provId / distId) rather than
 * the numeric row ids, because they are what the parent links are expressed in
 * and what buildDefinitionExpression puts into SQL.
 */
function buildOrgLevels(trees: readonly AreaCountryTree[]): OrgLevelDataByLevel {
  const countries: OrgNodeInput[] = [];
  const provinces: OrgNodeInput[] = [];
  const districts: OrgNodeInput[] = [];

  trees.filter(isActive).forEach((country) => {
    countries.push({
      code: country.countryId,
      parent: null,
      en: country.en,
      th: country.th,
      coordinates: country.coordinates
    });

    (country.provinces || []).filter(isActive).forEach((province: AreaTreeProvinceNode) => {
      provinces.push({
        code: province.provId,
        parent: country.countryId,
        en: province.en,
        th: province.th,
        coordinates: province.coordinates
      });

      (province.districts || []).filter(isActive).forEach((district) => {
        districts.push({
          code: district.distId,
          parent: province.provId,
          en: district.en,
          th: district.th,
          coordinates: district.coordinates
        });
      });
    });
  });

  return {
    country: buildLevelData(countries),
    province: buildLevelData(provinces),
    district: buildLevelData(districts),
    // Declared so the Record stays total; the org table has no fourth level.
    subdistrict: emptyLevelData()
  };
}

/**
 * One country's tree, or undefined with the reason logged.
 *
 * A country whose tree has never been generated answers with a *fulfilled* response carrying
 * an empty payload, so the old `Boolean(response.data)` test admitted it and the picker grew a
 * nameless country. readAreaCountryTree is the shared guard for that; see its comment.
 *
 * The subscription is released in a finally. This module caches the derived levels in
 * orgDataPromise for the session, so keeping an RTK cache entry alive buys nothing - while a
 * subscription that is never released makes every `invalidatesTags: ["Area"]` refetch this
 * query in the background with no map mounted. That is a deliberate departure from
 * components/case/uitls/CaseApiManager.tsx, which leaves its subscriptions open and is
 * otherwise the pattern this file follows.
 */
async function fetchCountryTree(countryId: number): Promise<AreaCountryTree | undefined> {
  const subscription = store.dispatch(areaApi.endpoints.getOrgCountryTree.initiate(countryId));
  try {
    const read = readAreaCountryTree(await subscription.unwrap());
    if (read.tree) {
      return read.tree;
    }
    // One unreadable country should not blank the whole map, but it should not be silent
    // either - this is the only place the "call generate_tree first" answer surfaces.
    console.error(`No area boundaries for country ${countryId}: ${read.message || read.outcome}`);
    return undefined;
  }
  catch
    // (error: unknown)
  {
    // const read = readAreaCountryTreeFailure(error);
    // console.error(`Failed to load the area tree for country ${countryId}: ${read.message || read.outcome}`);
    return undefined;
  }
  finally {
    subscription.unsubscribe();
  }
}

/**
 * Fetches every country's tree.
 *
 * Deliberately mirrors src/cms/hooks/useOrgAreaTrees.ts, which cannot be reused
 * here because this module is not a React context - a BoundarySource is a plain
 * object consulted by the layer hook, not a hook itself. The imperative
 * store.dispatch(endpoint.initiate(...)) form is the repo's established way to
 * read RTK Query from outside React (see components/case/uitls/CaseApiManager.tsx).
 * Keep the two in step: a change to how org trees are fetched belongs in both.
 */
async function fetchOrgTrees(): Promise<AreaCountryTree[]> {
  const countriesSubscription = store.dispatch(
    areaApi.endpoints.getCountries.initiate({ start: 0, length: 1000 })
  );

  let countries: Country[];
  try {
    const countriesResult = await countriesSubscription;
    countries = (countriesResult.data?.data as Country[] | undefined) || [];
  }
  finally {
    countriesSubscription.unsubscribe();
  }

  if (countries.length === 0) {
    return [];
  }

  const trees = await Promise.all(countries.map((country) => fetchCountryTree(country.id)));

  return trees.filter((tree): tree is AreaCountryTree => tree !== undefined);
}

// One shared promise, for the same reason as the mock's indexPromise: the index
// and all three layer URLs are derived from a single fetch, and a screen can
// hold 3-4 MapViews.
let orgDataPromise: Promise<OrgLevelDataByLevel> | null = null;

function loadOrgData(): Promise<OrgLevelDataByLevel> {
  orgDataPromise = orgDataPromise ?? fetchOrgTrees()
    .then(buildOrgLevels)
    .catch((error: unknown) => {
      orgDataPromise = null;
      console.error("Failed to load the organization's area boundaries", error);
      return {
        country: emptyLevelData(),
        province: emptyLevelData(),
        district: emptyLevelData(),
        subdistrict: emptyLevelData()
      };
    });
  return orgDataPromise;
}

/**
 * Blob URLs, cached per level.
 *
 * Cached rather than minted per call so that the expand modal's second MapView
 * reuses the first one's URL instead of serialising the same FeatureCollection
 * again. Reference-counted because both views release independently and the
 * first teardown must not revoke a URL the other one is still drawing from.
 */
const blobUrlByLevel = new Map<AdminLevel, string>();
const blobRefCount = new Map<string, number>();

function retainBlobUrl(level: AdminLevel, collection: OrgFeatureCollection): string {
  let url = blobUrlByLevel.get(level);
  if (!url) {
    const blob = new Blob([JSON.stringify(collection)], { type: "application/geo+json" });
    url = URL.createObjectURL(blob);
    blobUrlByLevel.set(level, url);
  }
  blobRefCount.set(url, (blobRefCount.get(url) ?? 0) + 1);
  return url;
}

/**
 * Drops the cached boundaries so the next map read rebuilds them.
 *
 * Area edits never reach this module: the levels are derived once and held for the session, so
 * without this a map opened after an edit keeps drawing the pre-edit shapes until a full page
 * reload. Call it wherever an area write lands (see AreaManagement's refreshAfterWrite).
 *
 * The blob URLs are forgotten but deliberately NOT revoked: a mounted MapView may still be
 * drawing from one, and its own releaseLayerUrl call still revokes it once the last holder lets
 * go. Forgetting them is what makes the next getLayerUrl serialise the new data instead of
 * handing back the stale blob.
 */
export function invalidateOrgBoundaryData(): void {
  orgDataPromise = null;
  blobUrlByLevel.clear();
}

export const orgAreaSource: BoundarySource = {
  async getLayerUrl(level) {
    const data = await loadOrgData();
    return retainBlobUrl(level, data[level].collection);
  },

  releaseLayerUrl(url) {
    const remaining = (blobRefCount.get(url) ?? 0) - 1;
    if (remaining > 0) {
      blobRefCount.set(url, remaining);
      return;
    }
    blobRefCount.delete(url);
    for (const [level, cached] of blobUrlByLevel) {
      if (cached === url) {
        blobUrlByLevel.delete(level);
      }
    }
    URL.revokeObjectURL(url);
  },

  async loadIndex() {
    const data = await loadOrgData();
    return {
      country: data.country.options,
      province: data.province.options,
      district: data.district.options,
      subdistrict: data.subdistrict.options
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
