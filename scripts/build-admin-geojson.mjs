// Generates the administrative boundary files the case map draws.
//
//   node scripts/build-admin-geojson.mjs
//
// Reads the raw ArcGIS exports in src/cms/mocks/ and writes browser-ready files
// to public/geo/. Run it by hand and commit the output - this repo has no CI and
// no build step wired to it.
//
// Why generate rather than import the mocks directly:
//
//   1. The three files total ~1.3MB. `import`ing them would inline that into a
//      JS chunk, parsed as JS rather than JSON. Served from public/ instead they
//      cost the bundle nothing, ArcGIS parses them in its own worker, and the
//      browser HTTP-caches them - which matters because the map's expand modal
//      renders a SECOND MapView that would otherwise re-fetch and re-parse.
//   2. The raw data has no Chinese names, and its English names are ALL CAPS.
//      Arcade label expressions cannot reach a JS lookup table, so the
//      alternative to baking these in is fetch-transform-blobURL on every mount.
//      Baking is done once, here.
//
// This is a temporary source. A BFF endpoint covering all of Thailand is under
// development; when it lands only `boundarySource.ts` changes, not this script's
// output shape. The field names below are therefore the contract to hand the
// backend team - note especially that names are needed in all THREE languages.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "src", "cms", "mocks");
const OUTPUT_DIR = join(ROOT, "public", "geo");

/**
 * Coordinate decimal places to keep. The source carries 12-13 (sub-nanometre,
 * i.e. noise); 5 is ~1.1m at the equator, far finer than an administrative
 * boundary is actually surveyed to, and roughly halves the file size.
 */
const COORDINATE_DECIMALS = 5;

/**
 * Number of fill colours. Four is not arbitrary: by the four-colour theorem a
 * planar map needs at most four colours for no two bordering areas to share one,
 * and four is the largest set of the reference categorical hues that clears the
 * accessibility gates (see boundaryColors.ts for the validation record).
 *
 * Colours are therefore assigned by ADJACENCY, not by hashing the code. Hashing
 * would repeat a hue roughly every 8 districts with no regard for geography, so
 * neighbours would collide constantly; adjacency colouring guarantees they never
 * do, with far fewer colours.
 */
const PALETTE_SIZE = 4;

/**
 * Chinese names, keyed by the source's own English name so a wrong district
 * CODE can never silently attach a name to the wrong polygon.
 *
 * Deliberately partial. Per the product owner: where a Chinese rendering is
 * uncertain, fall back to the English name rather than guess. Anything absent
 * here gets its Title-Cased English name instead, and the map's label resolver
 * applies the same fallback again at runtime for safety.
 *
 * The full country (~8,260 areas) is not hand-authorable - those names must
 * come from the BFF.
 */
const CHINESE_NAMES = {
  // Province
  BANGKOK: "曼谷",
  // Districts, limited to renderings that are well established in
  // Chinese-language use (landmark, transit and business districts).
  "PHRA NAKHON": "拍那空",
  DUSIT: "律实",
  "BANG RAK": "挽叻",
  "PATHUM WAN": "巴吞旺",
  SAMPHANTHAWONG: "三攀他旺",
  "THON BURI": "吞武里",
  "HUAI KHWANG": "辉煌",
  "KHLONG TOEI": "空堤",
  SATHON: "沙吞",
  CHATUCHAK: "乍都乍",
  "DON MUEANG": "廊曼",
  "MIN BURI": "民武里"
};

/**
 * One entry per administrative level.
 *
 * `keep` lists the attributes carried through besides the name fields. Anything
 * unlisted is dropped: the source ships census columns (MALE, FEMALE, HOUSE,
 * TOTAL) and geometry metrics (Shape__Area, Shape__Length) that nothing renders.
 *
 * `parentField` is what the picker cascades on and what the sub-district layer
 * joins to so it can inherit its district's colour.
 *
 * `colorFrom` is "self" where the level is adjacency-coloured in its own right,
 * or "parent" where it copies its parent's colour - which is how sub-districts
 * come out the same colour as the district containing them.
 */
const LEVELS = [
  {
    level: "province",
    sourceFile: "TH_Bangkok_Province.json",
    outputFile: "th-bangkok-province.geojson",
    idField: "PROV_CODE",
    parentField: null,
    thaiField: "PROV_NAMT",
    englishField: "PROV_NAME",
    titleCaseField: "PROV_NAMEN",
    chineseField: "PROV_NAMC",
    colorFrom: "self",
    keep: ["OBJECTID", "PROV_CODE"]
  },
  {
    level: "district",
    sourceFile: "TH_Bangkok_District.json",
    outputFile: "th-bangkok-district.geojson",
    idField: "District",
    parentField: "PROV_CODE",
    thaiField: "AMP_NAMT",
    englishField: "AMP_NAME",
    titleCaseField: "AMP_NAMEN",
    chineseField: "AMP_NAMC",
    colorFrom: "self",
    keep: ["OBJECTID", "District", "AMP_CODE", "PROV_CODE"]
  },
  {
    level: "subdistrict",
    sourceFile: "TH_Bangkok_Subdistrict.json",
    outputFile: "th-bangkok-subdistrict.geojson",
    idField: "Subdist",
    // The district code, NOT the province: this is both the cascade key and the
    // colour-inheritance join. It is already prov+amp concatenated ("1049"), so
    // it stays unique once the data goes country-wide.
    parentField: "District",
    thaiField: "TAM_NAMT",
    englishField: "TAM_NAME",
    titleCaseField: "TAM_NAMEN",
    chineseField: "TAM_NAMC",
    colorFrom: "parent",
    keep: ["OBJECTID", "Subdist", "District", "TAM_CODE", "AMP_CODE", "PROV_CODE"]
  }
];

/** "PHRA NAKHON" -> "Phra Nakhon". The source stores English names upper-cased. */
function toTitleCase(value) {
  return value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, boundary, letter) =>
    `${boundary}${letter.toUpperCase()}`
  );
}

/**
 * Round every position in a nested GeoJSON coordinate array.
 *
 * `toFixed` then `Number` rather than Math.round(n * 1e5) / 1e5: the latter
 * reintroduces float artefacts (100.50075000000001) that defeat the whole point.
 */
function roundCoordinates(node) {
  if (typeof node[0] === "number") {
    return node.map((value) => Number(value.toFixed(COORDINATE_DECIMALS)));
  }
  return node.map(roundCoordinates);
}

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
 * These polygons come from one topology, so a shared border is a run of
 * IDENTICAL vertices - no distance tolerance is needed. Two shared vertices are
 * required rather than one: a single shared vertex is a corner touch, and
 * corner-touching areas are allowed to share a colour (they do not read as one
 * region), so treating those as adjacent would only inflate the colour count.
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
 * Greedy is not guaranteed to find a four-colouring even where one exists, so
 * rather than implement Kempe-chain reduction we simply try a number of
 * orderings and keep the first conflict-free result. Welsh-Powell (highest
 * degree first) is tried before the shuffles because it usually wins outright.
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

function buildLevel(config, parentColors) {
  const source = JSON.parse(readFileSync(join(SOURCE_DIR, config.sourceFile), "utf8"));
  const indexEntries = [];
  const colorByCode = new Map();
  let chineseHits = 0;
  let conflicts = 0;

  // Adjacency-colour this level, or inherit the parent's colour wholesale.
  let colorIndexes;
  if (config.colorFrom === "self") {
    const colored = colorGraph(buildAdjacency(source.features), PALETTE_SIZE);
    colorIndexes = colored.colors;
    conflicts = colored.conflicts;
  } else {
    colorIndexes = source.features.map(
      (feature) => parentColors.get(feature.properties[config.parentField]) ?? 0
    );
  }

  const features = source.features.map((feature, index) => {
    const properties = feature.properties;
    const english = properties[config.englishField];
    const titleCased = toTitleCase(english);
    const chinese = CHINESE_NAMES[english];
    if (chinese) {
      chineseHits += 1;
    }
    const code = properties[config.idField];
    const colorIndex = colorIndexes[index];
    colorByCode.set(code, colorIndex);

    const next = {};
    for (const field of config.keep) {
      next[field] = properties[field];
    }
    next[config.thaiField] = properties[config.thaiField];
    next[config.englishField] = english;
    next[config.titleCaseField] = titleCased;
    // Fall back to the readable English form, never to an empty label.
    next[config.chineseField] = chinese ?? titleCased;
    next.COLOR_IDX = colorIndex;

    indexEntries.push({
      code,
      parent: config.parentField ? properties[config.parentField] : null,
      th: properties[config.thaiField],
      en: titleCased,
      cn: chinese ?? titleCased,
      // Carried so the picker can show a swatch matching the map without
      // duplicating the colouring logic on the client.
      color: colorIndex
    });

    return {
      type: "Feature",
      properties: next,
      geometry: {
        type: feature.geometry.type,
        coordinates: roundCoordinates(feature.geometry.coordinates)
      }
    };
  });

  // Stable, human-scannable ordering; also makes the picker lists sensible
  // without sorting at runtime.
  indexEntries.sort((a, b) => a.code.localeCompare(b.code));

  const outputPath = join(OUTPUT_DIR, config.outputFile);
  writeFileSync(outputPath, JSON.stringify({ type: "FeatureCollection", features }));

  return { indexEntries, chineseHits, conflicts, colorByCode, outputPath, count: features.length };
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const index = {};
// Levels are processed parent-first so a child level can read the colours its
// parent was just assigned.
const colorsByLevel = new Map();
for (const config of LEVELS) {
  const parentColors = colorsByLevel.get(config.level === "subdistrict" ? "district" : null);
  const { indexEntries, chineseHits, conflicts, colorByCode, outputPath, count } = buildLevel(
    config,
    parentColors
  );
  colorsByLevel.set(config.level, colorByCode);
  index[config.level] = indexEntries;
  const sizeKb = Math.round(readFileSync(outputPath).byteLength / 1024);
  const colouring =
    config.colorFrom === "self"
      ? conflicts === 0
        ? "adjacency-coloured, no neighbours share a colour"
        : `adjacency-coloured, ${conflicts} UNRESOLVED neighbour clash(es)`
      : "colour inherited from parent district";
  console.log(
    `${config.level.padEnd(12)} ${String(count).padStart(4)} features  ` +
      `${String(sizeKb).padStart(4)}KB  ${chineseHits}/${count} Chinese  ${colouring}`
  );
}

// Geometry-free lookup for the picker lists, so options render before (or
// without) the polygons being loaded at all.
const indexPath = join(OUTPUT_DIR, "th-bangkok-index.json");
writeFileSync(indexPath, JSON.stringify(index));
console.log(`index        ${Math.round(readFileSync(indexPath).byteLength / 1024)}KB -> ${indexPath}`);
