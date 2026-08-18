// Where boundary data comes from.
//
// This interface is the whole point of the module. Today the data is three
// static files covering Bangkok; the BFF endpoint under development covers all
// of Thailand - 77 provinces, 928 districts and ~7,255 sub-districts, which is
// 20-50MB of sub-district geometry. That cannot be downloaded and filtered in
// the browser the way the mock is.
//
// So the SELECTION is treated as a fetch key rather than a display filter, and
// every caller goes through this interface. Swapping to the BFF then means
// adding a second implementation here and nothing else:
//
//   - MockFileSource ignores the selection when building a URL, because the file
//     already contains everything, and the layer filters client-side via
//     definitionExpression (see buildDefinitionExpression).
//   - A BffBoundarySource would put the selected parent codes INTO the URL and
//     let the server return only those features, leaving definitionExpression to
//     do nothing more than a final tidy-up.
//
// Contract to hand the backend team: names in all THREE languages per feature
// (src/cms/types/area.ts `AreaResponse` currently has _thai/_english and needs
// _chinese), plus a stable per-feature colour slot or enough parent information
// for the client to recompute one.
import { getBoundaryLevel } from "./boundaryLevels";
import type { AdminLevel, BoundaryIndex, BoundarySelection } from "./boundaryTypes";

export interface BoundarySource {
  /**
   * URL for a level's geometry. `selection` is passed even though the mock
   * ignores it - a server-backed source needs it to scope the response, and
   * having it in the signature now is what keeps the swap mechanical.
   */
  getLayerUrl(level: AdminLevel, selection: BoundarySelection): string;
  /** Options for the picker lists. Geometry-free and small. */
  loadIndex(): Promise<BoundaryIndex>;
}

/** Served from public/geo/, matching how the i18n catalogues are served. */
const GEO_BASE_PATH = "/geo";

// Module-level so the index is fetched once per session rather than once per
// map. Both case surfaces mount this, and the expand modal briefly runs a second
// MapView, so without a shared promise the same file would be requested 3-4
// times on one screen.
let indexPromise: Promise<BoundaryIndex> | null = null;

const EMPTY_INDEX: BoundaryIndex = { province: [], district: [], subdistrict: [] };

async function fetchIndex(): Promise<BoundaryIndex> {
  try {
    const response = await fetch(`${GEO_BASE_PATH}/th-bangkok-index.json`);
    if (!response.ok) {
      throw new Error(`Boundary index request failed with ${response.status}`);
    }
    return (await response.json()) as BoundaryIndex;
  }
  catch (error) {
    // Let the next mount try again rather than caching the failure for good.
    indexPromise = null;
    console.error("Failed to load the administrative boundary index", error);
    // An empty index disables the picker but leaves the rest of the map working.
    return EMPTY_INDEX;
  }
}

export const mockFileSource: BoundarySource = {
  getLayerUrl(level) {
    return `${GEO_BASE_PATH}/${getBoundaryLevel(level).fileName}`;
  },
  loadIndex() {
    indexPromise = indexPromise ?? fetchIndex();
    return indexPromise;
  }
};

/**
 * The source the app uses. A single named export rather than a prop threaded
 * through every component: there is exactly one source at a time, and the switch
 * to the BFF is a deploy-time decision, not a per-map one.
 */
export const boundarySource: BoundarySource = mockFileSource;
