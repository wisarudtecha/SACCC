// Four-colour assignment for boundary polygons, computed in the browser.
//
// A TypeScript port of the colouring half of scripts/build-admin-geojson.mjs
// (vertexKeys / buildAdjacency / mulberry32 / colorGraph). The two are the same
// algorithm on purpose and should be changed together.
//
// WHY THIS EXISTS AT ALL: the static /geo files carry a COLOR_IDX attribute
// baked in at build time. The org area API does not - it returns names and
// coordinates and nothing else - so the boundary source has to derive the slot
// itself before it can hand ArcGIS a FeatureCollection.
//
// It is NOT good enough to hash the area code into four slots. boundaryColors.ts
// documents its accessibility record (worst CVD separation ΔE 6.9, which is only
// permissible where a second non-colour channel also carries the distinction) on
// the explicit basis that *bordering* areas never share a hue. Adjacency
// colouring is what makes that true; a hash would quietly invalidate the
// validation record while still looking fine on screen.
import type { PolygonCoordinates } from "@/cms/types/area";

/** Result of colouring one level, parallel to the input array. */
export interface ColoringResult {
  colors: number[];
  /** Bordering pairs that still share a slot. Expected to be 0. */
  conflicts: number;
}

/**
 * Every vertex of a ring set, as "lng,lat" strings, for adjacency testing.
 *
 * String keys rather than numeric pairs because this is an exact-match test and
 * a Set of strings is the cheapest way to do it - see the note in buildAdjacency
 * about why no distance tolerance is wanted.
 */
function vertexKeys(rings: PolygonCoordinates): Set<string> {
  const keys = new Set<string>();
  for (const ring of rings) {
    for (const point of ring) {
      keys.add(`${point[0]},${point[1]}`);
    }
  }
  return keys;
}

/**
 * Neighbour sets, by shared boundary vertices.
 *
 * These polygons come from one topology, so a shared border is a run of
 * IDENTICAL vertices - no distance tolerance is needed. Two shared vertices are
 * required rather than one: a single shared vertex is a corner touch, and
 * corner-touching areas are allowed to share a colour (they do not read as one
 * region), so treating those as adjacent would only inflate the colour count.
 */
function buildAdjacency(geometries: readonly PolygonCoordinates[]): Set<number>[] {
  const owners = new Map<string, number[]>();
  geometries.forEach((rings, index) => {
    for (const key of vertexKeys(rings)) {
      const list = owners.get(key);
      if (list) {
        list.push(index);
      }
      else {
        owners.set(key, [index]);
      }
    }
  });

  const sharedCount = new Map<string, number>();
  for (const list of owners.values()) {
    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        const pair = `${list[a]}:${list[b]}`;
        sharedCount.set(pair, (sharedCount.get(pair) ?? 0) + 1);
      }
    }
  }

  const neighbours: Set<number>[] = geometries.map(() => new Set<number>());
  for (const [pair, count] of sharedCount) {
    if (count < 2) {
      continue;
    }
    const [a, b] = pair.split(":").map(Number);
    neighbours[a].add(b);
    neighbours[b].add(a);
  }
  return neighbours;
}

/**
 * Deterministic PRNG.
 *
 * In the build script this mattered because the output was committed. Here it
 * matters for a different reason: colouring runs on every page load, and an area
 * that changed hue between two loads of the same data would read as a bug.
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many shuffled orderings to try before giving up on a clean colouring. */
const MAX_SHUFFLE_ROUNDS = 200;

/**
 * Greedy graph colouring, best of several vertex orderings.
 *
 * Greedy is not guaranteed to find a four-colouring even where one exists, so
 * rather than implement Kempe-chain reduction we simply try a number of
 * orderings and keep the first conflict-free result. Welsh-Powell (highest
 * degree first) is tried before the shuffles because it usually wins outright.
 */
function colorGraph(neighbours: readonly Set<number>[], paletteSize: number): ColoringResult {
  const total = neighbours.length;
  const byDegreeDesc = [...neighbours.keys()].sort(
    (a, b) => neighbours[b].size - neighbours[a].size
  );

  const attempt = (order: readonly number[]): ColoringResult => {
    const colors = new Array<number>(total).fill(-1);
    for (const node of order) {
      const taken = new Set<number>();
      for (const neighbour of neighbours[node]) {
        if (colors[neighbour] >= 0) {
          taken.add(colors[neighbour]);
        }
      }
      let chosen = -1;
      for (let candidate = 0; candidate < paletteSize; candidate += 1) {
        if (!taken.has(candidate)) {
          chosen = candidate;
          break;
        }
      }
      // Every colour is already on a neighbour: unavoidable clash. Take colour 0
      // and let the conflict count below surface it.
      colors[node] = chosen >= 0 ? chosen : 0;
    }
    let conflicts = 0;
    neighbours.forEach((set, node) => {
      for (const neighbour of set) {
        if (neighbour > node && colors[neighbour] === colors[node]) {
          conflicts += 1;
        }
      }
    });
    return { colors, conflicts };
  };

  let best = attempt(byDegreeDesc);
  if (best.conflicts === 0) {
    return best;
  }
  const random = mulberry32(0x5eed);
  for (let round = 0; round < MAX_SHUFFLE_ROUNDS && best.conflicts > 0; round += 1) {
    const order = [...byDegreeDesc];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const candidate = attempt(order);
    if (candidate.conflicts < best.conflicts) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Palette slots for one level's geometries, parallel to the input array.
 *
 * Areas with no geometry still get a slot (0) so the caller can index the result
 * positionally without filtering first.
 */
export function assignBoundaryColors(
  geometries: readonly (PolygonCoordinates | null | undefined)[],
  paletteSize: number
): ColoringResult {
  if (geometries.length === 0) {
    return { colors: [], conflicts: 0 };
  }
  const normalised = geometries.map((rings) => rings ?? []);
  return colorGraph(buildAdjacency(normalised), paletteSize);
}
