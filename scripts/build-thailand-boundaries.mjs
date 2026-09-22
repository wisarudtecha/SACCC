// Generates the nationwide administrative boundary files for the case map.
//
//   node scripts/build-thailand-boundaries.mjs
//
// Reads the raw exports in src/cms/mocks/ and writes browser-ready, split,
// TopoJSON files to public/geo/thailand/. Run it by hand and commit the
// output - this repo has no CI and no build step wired to it (same
// convention as scripts/build-admin-geojson.mjs, which does the same job for
// the Bangkok-only reference data and is left untouched by this script).
//
// Why split AND TopoJSON, not just one or the other (see the size spike this
// script is based on):
//
//   - The raw files are one FeatureCollection per level for the WHOLE
//     country (77 provinces / 928 districts, 21MB / 57MB, 15-decimal
//     coordinates). Loading either one whole is not "level of detail" -
//     every case-map page load would pull every district in Thailand to
//     draw the one province the operator cares about.
//   - Splitting the district layer per province turns "one 57MB fetch" into
//     "one ~50-450KB fetch, scoped to whichever province the boundary
//     selection has picked".
//   - TopoJSON on top of that roughly quarters the split, truncated size
//     again (measured on Chiang Mai, the largest province: 1.27MB truncated
//     GeoJSON -> 442KB at q=1e6), because adjacent provinces/districts share
//     borders that TopoJSON stores once instead of once per polygon.
//
// Coordinate precision: rounded to 5 decimals before quantization (matches
// build-admin-geojson.mjs's COORDINATE_DECIMALS), then quantized at 1e6 by
// topojson-server. 1e6 (not the more aggressive 1e5) was chosen because,
// across Thailand's ~9x15 degree extent, 1e5 works out to roughly 10-17m per
// grid step - coarser than the "5-6 decimal / meter-level" precision this
// data is meant to carry - while 1e6 is roughly 1-1.7m.
//
// Join keys: the raw features carry ADMIN_ID1 (province code) / ADMIN_ID2
// (district code), e.g. "10" / "1001" for Bangkok / Phra Nakhon - the same
// TIS-1099-style codes as provId/distId elsewhere in the app
// (th-bangkok-index.json, src/cms/types/area.ts). CODE/PARENT on every
// output feature use these codes directly so a later BoundarySource can
// join this data against the org's own province/district records the same
// way boundarySource.ts already does for its org-tree levels.
//
// Country code: this script has no access to the org's live API, so it has
// no way to know which real-org `countryId` "Thailand" maps to. The
// national outline is written with the placeholder CODE "TH". Whatever
// later wires a BoundarySource to these files needs a one-line remap from
// the org's actual countryId to this "TH", or vice versa.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { topology } from "topojson-server";
import { merge } from "topojson-client";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "src", "cms", "mocks");
const OUTPUT_DIR = join(ROOT, "public", "geo", "thailand");
const DISTRICT_OUTPUT_DIR = join(OUTPUT_DIR, "district");

const PROVINCE_SOURCE_FILE = "TH_Country_Province.json";
const DISTRICT_SOURCE_FILE = "TH_Country_District.json";

/** See header comment: halves noise before quantization, matches the Bangkok script. */
const COORDINATE_DECIMALS = 5;

/** TopoJSON quantization - see header comment for why 1e6 over 1e5. */
const QUANTIZATION = 1e6;

/**
 * Coarser quantization for the country outline ONLY. It is
 * `defaultVisible: false` (ORG_BOUNDARY_LEVELS in boundaryLevels.ts) and only
 * ever shown at full-country zoom, so the meter-level precision the
 * province/district layers need is wasted here - topojson.merge() dissolves
 * the INTERNAL province borders, but Thailand's external border/coastline
 * still carries the full QUANTIZATION-level detail unless requantized
 * separately, which is what makes the country file disproportionately large.
 * 1e4 is roughly 100-170m per grid step across Thailand's extent - invisible
 * at national zoom, a fraction of the size.
 */
const COUNTRY_QUANTIZATION = 1e4;

/** Four-colour theorem palette size - see boundaryColors.ts for the accessibility record. */
const PALETTE_SIZE = 4;

const COUNTRY_CODE = "TH";

// ===================================================================
// Coordinate rounding (verbatim technique from build-admin-geojson.mjs)
// ===================================================================

/** "SAMUT PRAKAN" -> "Samut Prakan". The source stores English names upper-cased. */
function toTitleCase(value) {
  return value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, boundary, letter) =>
    `${boundary}${letter.toUpperCase()}`
  );
}

/**
 * `toFixed` then `Number` rather than Math.round(n * 1e5) / 1e5: the latter
 * reintroduces float artefacts (100.50075000000001) that defeat the whole point.
 */
function roundCoordinates(node) {
  if (typeof node[0] === "number") {
    return node.map((value) => Number(value.toFixed(COORDINATE_DECIMALS)));
  }
  return node.map(roundCoordinates);
}

// ===================================================================
// Adjacency colouring
//
// vertexKeys/buildAdjacency/mulberry32/colorGraph (Welsh-Powell + shuffle
// restarts) are verbatim from build-admin-geojson.mjs / boundaryColoring.ts.
// This script ADDS a DSATUR pass and a min-conflicts repair pass on top,
// which those two do not have - deliberately: at Bangkok's ~50-node scale
// Welsh-Powell+shuffle reliably finds a conflict-free 4-colouring, but at
// national scale (77 provinces / 928 districts) it left 1 and 65 unresolved
// clashes respectively (see colorGraphBest below). The three copies are no
// longer byte-identical because of this; if that ever needs reconciling,
// the extra stages here are also safe to backport to the other two, since
// they only ever IMPROVE on Welsh-Powell's result, never regress it.
// ===================================================================

/** Every vertex of a feature, as "lon,lat" strings, for adjacency testing. */
function vertexKeys(geometry) {
  const keys = new Set();
  const walk = (node) => {
    if (typeof node[0] === "number") {
      keys.add(`${node[0]},${node[1]}`);
      return;
    }
    node.forEach(walk);
  };
  walk(geometry.coordinates);
  return keys;
}

/**
 * Neighbour sets, by shared boundary vertices.
 *
 * Two shared vertices are required rather than one: a single shared vertex
 * is a corner touch, and corner-touching areas are allowed to share a
 * colour (they do not read as one region), so treating those as adjacent
 * would only inflate the colour count.
 */
function buildAdjacency(features) {
  const owners = new Map();
  features.forEach((feature, index) => {
    for (const key of vertexKeys(feature.geometry)) {
      const list = owners.get(key);
      if (list) {
        list.push(index);
      } else {
        owners.set(key, [index]);
      }
    }
  });

  const sharedCount = new Map();
  for (const list of owners.values()) {
    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        const pair = `${list[a]}:${list[b]}`;
        sharedCount.set(pair, (sharedCount.get(pair) ?? 0) + 1);
      }
    }
  }

  const neighbours = features.map(() => new Set());
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

/** Deterministic PRNG - the output is committed, so it must be reproducible. */
function mulberry32(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Greedy graph colouring, best of several vertex orderings.
 *
 * Greedy is not guaranteed to find a four-colouring even where one exists,
 * so rather than implement Kempe-chain reduction we simply try a number of
 * orderings and keep the first conflict-free result. Welsh-Powell (highest
 * degree first) is tried before the shuffles because it usually wins
 * outright.
 */
function colorGraph(neighbours, paletteSize) {
  const total = neighbours.length;
  const byDegreeDesc = [...neighbours.keys()].sort(
    (a, b) => neighbours[b].size - neighbours[a].size
  );

  const attempt = (order) => {
    const colors = new Array(total).fill(-1);
    for (const node of order) {
      const taken = new Set();
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
  for (let round = 0; round < 200 && best.conflicts > 0; round += 1) {
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

function countConflicts(neighbours, colors) {
  let conflicts = 0;
  neighbours.forEach((set, node) => {
    for (const neighbour of set) {
      if (neighbour > node && colors[neighbour] === colors[node]) {
        conflicts += 1;
      }
    }
  });
  return conflicts;
}

/**
 * DSATUR (Brelaz): repeatedly colour the still-uncoloured node with the
 * highest SATURATION degree (most distinct colours already used among its
 * coloured neighbours, ties broken by raw degree), not a fixed ordering
 * computed once up front. This tracks how constrained each node has become
 * as colouring proceeds, which is why it finds a valid k-colouring far more
 * often than Welsh-Powell's static order on graphs this size.
 */
function colorGraphDsatur(neighbours, paletteSize) {
  const total = neighbours.length;
  const colors = new Array(total).fill(-1);
  const usedByNeighbour = neighbours.map(() => new Set());
  const degree = neighbours.map((set) => set.size);
  const uncoloured = new Set(neighbours.keys());

  while (uncoloured.size > 0) {
    let chosenNode = -1;
    let bestSaturation = -1;
    let bestDegree = -1;
    for (const node of uncoloured) {
      const saturation = usedByNeighbour[node].size;
      if (
        saturation > bestSaturation ||
        (saturation === bestSaturation && degree[node] > bestDegree)
      ) {
        chosenNode = node;
        bestSaturation = saturation;
        bestDegree = degree[node];
      }
    }

    const taken = usedByNeighbour[chosenNode];
    let chosen = -1;
    for (let candidate = 0; candidate < paletteSize; candidate += 1) {
      if (!taken.has(candidate)) {
        chosen = candidate;
        break;
      }
    }
    colors[chosenNode] = chosen >= 0 ? chosen : 0;
    uncoloured.delete(chosenNode);
    for (const neighbour of neighbours[chosenNode]) {
      usedByNeighbour[neighbour].add(colors[chosenNode]);
    }
  }

  return { colors, conflicts: countConflicts(neighbours, colors) };
}

/**
 * Min-conflicts local search with random-restart kicks: repeatedly pick a
 * still-conflicted node and move it to whichever palette slot leaves it with
 * the fewest conflicts against its CURRENT neighbour colours (ties broken
 * randomly, not always the lowest index - always picking the same tied slot
 * is what lets plain min-conflicts cycle between the same few states forever
 * instead of escaping). If the conflict count hasn't improved for a while,
 * KICK: recolour one random conflicted node to a uniformly random slot even
 * if that is not locally best, which perturbs the search out of the plateau.
 * Classic repair heuristic for sparse constraint graphs - cheap, and only
 * ever run as a second pass on top of an already-good DSATUR result.
 */
function repairConflicts(neighbours, initialColors, paletteSize, maxSteps, seed) {
  let colors = [...initialColors];
  let bestColors = [...colors];
  let bestConflicts = countConflicts(neighbours, colors);
  const random = mulberry32(seed);
  const STALL_LIMIT = 300;
  let stall = 0;

  const conflictCountFor = (node, color) => {
    let count = 0;
    for (const neighbour of neighbours[node]) {
      if (colors[neighbour] === color) {
        count += 1;
      }
    }
    return count;
  };

  for (let step = 0; step < maxSteps && bestConflicts > 0; step += 1) {
    const conflicted = [];
    neighbours.forEach((set, node) => {
      for (const neighbour of set) {
        if (colors[neighbour] === colors[node]) {
          conflicted.push(node);
          break;
        }
      }
    });
    if (conflicted.length === 0) {
      break;
    }

    const node = conflicted[Math.floor(random() * conflicted.length)];

    if (stall >= STALL_LIMIT) {
      // Plateaued: force a random move on a random conflicted node rather
      // than the locally-best one, then keep searching from there.
      colors[node] = Math.floor(random() * paletteSize);
      stall = 0;
    }
    else {
      let bestCount = conflictCountFor(node, colors[node]);
      let candidates = [colors[node]];
      for (let candidate = 0; candidate < paletteSize; candidate += 1) {
        if (candidate === colors[node]) {
          continue;
        }
        const count = conflictCountFor(node, candidate);
        if (count < bestCount) {
          bestCount = count;
          candidates = [candidate];
        }
        else if (count === bestCount) {
          candidates.push(candidate);
        }
      }
      colors[node] = candidates[Math.floor(random() * candidates.length)];
    }

    const currentConflicts = countConflicts(neighbours, colors);
    if (currentConflicts < bestConflicts) {
      bestConflicts = currentConflicts;
      bestColors = [...colors];
      stall = 0;
    }
    else {
      stall += 1;
    }
  }

  return { colors: bestColors, conflicts: bestConflicts };
}

/**
 * Best of Welsh-Powell+shuffle, DSATUR, and several seeded DSATUR+min-
 * conflicts-repair runs. Never worse than plain colorGraph alone - the extra
 * stages only run to try to improve on it, and the lowest-conflict result
 * wins.
 */
function colorGraphBest(neighbours, paletteSize) {
  const welshPowell = colorGraph(neighbours, paletteSize);
  if (welshPowell.conflicts === 0) {
    return welshPowell;
  }

  const dsatur = colorGraphDsatur(neighbours, paletteSize);
  let best = dsatur.conflicts < welshPowell.conflicts ? dsatur : welshPowell;
  if (best.conflicts === 0) {
    return best;
  }

  const REPAIR_SEEDS = [0xc0ffee, 0xfeed1, 0xfeed2, 0xfeed3, 0xfeed4];
  for (const seed of REPAIR_SEEDS) {
    const repaired = repairConflicts(neighbours, dsatur.colors, paletteSize, 100_000, seed);
    if (repaired.conflicts < best.conflicts) {
      best = repaired;
    }
    if (best.conflicts === 0) {
      break;
    }
  }
  return best;
}

// ===================================================================
// Build
// ===================================================================

function byteSize(path) {
  return readFileSync(path).byteLength;
}

function fmtKb(bytes) {
  return `${Math.round(bytes / 1024)}KB`;
}

function writeTopology(objects, outputPath, quantization = QUANTIZATION) {
  const built = topology(objects, quantization);
  writeFileSync(outputPath, JSON.stringify(built));
  return built;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(DISTRICT_OUTPUT_DIR, { recursive: true });

console.log("Reading source files...");
const provinceSource = JSON.parse(readFileSync(join(SOURCE_DIR, PROVINCE_SOURCE_FILE), "utf8"));
const districtSource = JSON.parse(readFileSync(join(SOURCE_DIR, DISTRICT_SOURCE_FILE), "utf8"));
console.log(`  ${provinceSource.features.length} province features, ${districtSource.features.length} district features`);

const indexEntries = { country: [], province: [], district: [] };

// -------------------------------------------------------------------
// Province level: all 77, one file. Coloured once, globally.
// -------------------------------------------------------------------
console.log("\nBuilding province level...");
const provinceColoring = colorGraphBest(buildAdjacency(provinceSource.features), PALETTE_SIZE);

const provinceFeatures = provinceSource.features.map((feature, index) => {
  const code = feature.properties.ADMIN_ID1;
  const th = feature.properties.NAME1;
  const en = toTitleCase(feature.properties.NAME_ENG1);
  const colorIndex = provinceColoring.colors[index];

  indexEntries.province.push({
    code,
    parent: COUNTRY_CODE,
    th,
    en,
    cn: en,
    color: colorIndex
  });

  return {
    type: "Feature",
    properties: {
      CODE: code,
      PARENT: COUNTRY_CODE,
      NAME_TH: th,
      NAME_EN: en,
      NAME_CN: en,
      COLOR_IDX: colorIndex
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates)
    }
  };
});

const provinceCollection = { type: "FeatureCollection", features: provinceFeatures };
const provinceTopology = writeTopology(
  { provinces: provinceCollection },
  join(OUTPUT_DIR, "th-province-all.topojson")
);
const provinceOutPath = join(OUTPUT_DIR, "th-province-all.topojson");
console.log(
  `  province     ${String(provinceFeatures.length).padStart(4)} features  ${fmtKb(byteSize(provinceOutPath)).padStart(6)}  ` +
    (provinceColoring.conflicts === 0
      ? "adjacency-coloured, no neighbours share a colour"
      : `adjacency-coloured, ${provinceColoring.conflicts} UNRESOLVED neighbour clash(es)`)
);

// -------------------------------------------------------------------
// Country level: one dissolved outline, derived from the province topology.
// -------------------------------------------------------------------
console.log("\nBuilding country level...");
const mergedCountryGeometry = merge(provinceTopology, provinceTopology.objects.provinces.geometries);
const countryCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        CODE: COUNTRY_CODE,
        PARENT: null,
        NAME_TH: "ประเทศไทย",
        NAME_EN: "Thailand",
        NAME_CN: "Thailand",
        COLOR_IDX: 0
      },
      geometry: mergedCountryGeometry
    }
  ]
};
const countryOutPath = join(OUTPUT_DIR, "th-country.topojson");
writeTopology({ country: countryCollection }, countryOutPath, COUNTRY_QUANTIZATION);
indexEntries.country.push({
  code: COUNTRY_CODE,
  parent: null,
  th: "ประเทศไทย",
  en: "Thailand",
  cn: "Thailand",
  color: 0
});
console.log(`  country         1 feature   ${fmtKb(byteSize(countryOutPath)).padStart(6)}`);

// -------------------------------------------------------------------
// District level: coloured once globally (so two neighbouring provinces'
// districts near a shared border never clash), then split per province.
// -------------------------------------------------------------------
console.log("\nBuilding district level (coloured globally, split per province)...");
const districtColoring = colorGraphBest(buildAdjacency(districtSource.features), PALETTE_SIZE);

const districtFeaturesByProvince = new Map();
districtSource.features.forEach((feature, index) => {
  const provinceCode = feature.properties.ADMIN_ID1;
  const code = feature.properties.ADMIN_ID2;
  const th = feature.properties.NAME2;
  const en = toTitleCase(feature.properties.NAME_ENG2);
  const colorIndex = districtColoring.colors[index];

  indexEntries.district.push({
    code,
    parent: provinceCode,
    th,
    en,
    cn: en,
    color: colorIndex
  });

  const built = {
    type: "Feature",
    properties: {
      CODE: code,
      PARENT: provinceCode,
      NAME_TH: th,
      NAME_EN: en,
      NAME_CN: en,
      COLOR_IDX: colorIndex
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates)
    }
  };

  const bucket = districtFeaturesByProvince.get(provinceCode);
  if (bucket) {
    bucket.push(built);
  } else {
    districtFeaturesByProvince.set(provinceCode, [built]);
  }
});

let totalDistrictBytes = 0;
let districtFileCount = 0;
for (const [provinceCode, features] of [...districtFeaturesByProvince.entries()].sort((a, b) =>
  a[0].localeCompare(b[0])
)) {
  const collection = { type: "FeatureCollection", features };
  const outPath = join(DISTRICT_OUTPUT_DIR, `${provinceCode}.topojson`);
  writeTopology({ districts: collection }, outPath);
  const size = byteSize(outPath);
  totalDistrictBytes += size;
  districtFileCount += 1;
  console.log(`  district/${provinceCode.padEnd(4)} ${String(features.length).padStart(3)} features  ${fmtKb(size).padStart(6)}`);
}
console.log(
  `  -> ${districtFileCount} province files, ${fmtKb(totalDistrictBytes)} total, ` +
    (districtColoring.conflicts === 0
      ? "adjacency-coloured, no neighbours share a colour"
      : `adjacency-coloured, ${districtColoring.conflicts} UNRESOLVED neighbour clash(es)`)
);

// -------------------------------------------------------------------
// Geometry-free index for the picker lists.
// -------------------------------------------------------------------
indexEntries.province.sort((a, b) => a.code.localeCompare(b.code));
indexEntries.district.sort((a, b) => a.code.localeCompare(b.code));
const indexPath = join(OUTPUT_DIR, "th-boundary-index.json");
writeFileSync(indexPath, JSON.stringify(indexEntries));
console.log(`\nIndex: ${fmtKb(byteSize(indexPath))} -> ${indexPath}`);

const grandTotal =
  byteSize(provinceOutPath) + byteSize(countryOutPath) + totalDistrictBytes + byteSize(indexPath);
console.log(`\nTotal written: ${fmtKb(grandTotal)} (${(grandTotal / 1024 / 1024).toFixed(1)}MB) across ${districtFileCount + 3} files`);
