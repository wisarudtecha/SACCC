// Pure-logic tests for the MinIO boundary geometry helpers.
//
// These cover the two contracts that fail SILENTLY if they drift: the object path
// layout (a wrong segment count or key still returns 404-shaped emptiness, which
// reads as "no polygons drawn" rather than as a bug) and the payload shape guard
// (a wrong guard lets a non-ring payload reach the geometry constructors).
//
// No network: the fetch wrapper itself is thin and its interesting branch - gzip
// vs plain - is exercised through decodeObjectBody instead.
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  boundaryGeometryUrl,
  boundaryObjectPath,
  decodeObjectBody,
  isPolygonRings,
  mapWithConcurrency
} from "./minioBoundaryGeometry";

/** Shape of a real staging object, captured from the cms-stg bucket. */
const STAGING_PAYLOAD = [
  [
    [100.483678, 13.763817],
    [100.474926, 13.751794],
    [100.508733, 13.751126],
    [100.544147, 13.7681],
    [100.483678, 13.763817]
  ]
];

describe("boundaryObjectPath", () => {
  it("nests one segment per level, per the documented layout", () => {
    expect(boundaryObjectPath(["C-ID"])).toBe("C-ID.json.gz");
    expect(boundaryObjectPath(["C-ID", "P-ID"])).toBe("C-ID/P-ID.json.gz");
    expect(boundaryObjectPath(["C-ID", "P-ID", "D-ID"])).toBe("C-ID/P-ID/D-ID.json.gz");
  });

  it("encodes segments individually so an id cannot reshape the path", () => {
    // A stray slash must stay inside its own segment, not add a level.
    expect(boundaryObjectPath(["a/b", "c d"])).toBe("a%2Fb/c%20d.json.gz");
  });
});

describe("boundaryGeometryUrl", () => {
  it("joins the base and the object path with exactly one slash", () => {
    const base = "https://storage-internal.one-sky.ai/cms-stg/area-org-tree";
    expect(boundaryGeometryUrl(base, ["ORG", "C-ID"])).toBe(
      "https://storage-internal.one-sky.ai/cms-stg/area-org-tree/ORG/C-ID.json.gz"
    );
  });

  it("tolerates a base URL with a trailing slash", () => {
    expect(boundaryGeometryUrl("https://host/prefix/", ["ORG"])).toBe("https://host/prefix/ORG.json.gz");
  });
});

describe("isPolygonRings", () => {
  it("accepts the payload shape the bucket actually serves", () => {
    expect(isPolygonRings(STAGING_PAYLOAD)).toBe(true);
  });

  it("rejects an empty ring set even though an empty array is truthy", () => {
    expect(isPolygonRings([])).toBe(false);
  });

  it("rejects a GeoJSON object, which is a different contract", () => {
    expect(isPolygonRings({ type: "Polygon", coordinates: STAGING_PAYLOAD })).toBe(false);
  });

  it("rejects a ring with too few points to be a polygon", () => {
    expect(isPolygonRings([[[100.4, 13.7], [100.5, 13.8]]])).toBe(false);
  });

  it("rejects a ring whose points are not finite coordinates", () => {
    expect(isPolygonRings([[[100.4, 13.7], [100.5, 13.8], [Number.NaN, 13.9]]])).toBe(false);
    expect(isPolygonRings([[[100.4, 13.7], [100.5, 13.8], ["100.6", "13.9"]]])).toBe(false);
  });
});

describe("decodeObjectBody", () => {
  it("reads plain JSON text without trying to decompress it", async () => {
    // The staging objects are plain JSON despite the .json.gz name.
    const body = new TextEncoder().encode(JSON.stringify(STAGING_PAYLOAD)).buffer;
    const decoded = await decodeObjectBody(body as ArrayBuffer);
    expect(JSON.parse(decoded)).toEqual(STAGING_PAYLOAD);
  });

  it("decompresses when the payload really is gzip", async () => {
    const compressed = gzipSync(Buffer.from(JSON.stringify(STAGING_PAYLOAD)));
    const body = compressed.buffer.slice(
      compressed.byteOffset,
      compressed.byteOffset + compressed.byteLength
    ) as ArrayBuffer;
    const decoded = await decodeObjectBody(body);
    expect(JSON.parse(decoded)).toEqual(STAGING_PAYLOAD);
  });
});

describe("mapWithConcurrency", () => {
  it("keeps results positionally aligned with the input", async () => {
    // Deliberately returns faster for later items, which is what a naive
    // Promise.all with a completion-order push would get wrong.
    const results = await mapWithConcurrency([10, 5, 1, 0], 2, async (ms, index) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return index;
    });
    expect(results).toEqual([0, 1, 2, 3]);
  });

  it("never exceeds the concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 12 }, (_, index) => index), 3, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return true;
    });
    expect(peak).toBeLessThanOrEqual(3);
  });

  it("resolves an empty list without starting a worker", async () => {
    let calls = 0;
    const results = await mapWithConcurrency([], 4, async () => {
      calls += 1;
      return 0;
    });
    expect(results).toEqual([]);
    expect(calls).toBe(0);
  });
});
