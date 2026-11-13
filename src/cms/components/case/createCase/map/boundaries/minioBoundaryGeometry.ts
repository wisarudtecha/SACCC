// Boundary polygon geometry served from MinIO (object storage), one object per AREA.
//
// Object layout, confirmed by probing the cms-stg bucket rather than assumed:
//
//   {base}/{orgId}/{countryId}.json.gz
//   {base}/{orgId}/{countryId}/{provId}.json.gz
//   {base}/{orgId}/{countryId}/{provId}/{distId}.json.gz
//
// The path segments are the ORG's business ids (countryId / provId / distId from
// the area API) - not the TIS-1099 codes the retired public/geo/thailand files
// were keyed by. See boundarySource.ts's OrgAreaNode for where each segment
// comes from.
//
// WHAT EACH OBJECT CONTAINS: one area's rings, `PolygonCoordinates`
// ([[ [lng, lat], ... ]]) and nothing else. No FeatureCollection, no properties,
// no name, no colour. Everything a drawn feature needs besides the ring is
// supplied by boundarySource.ts from the area API and the adjacency colouring.
// A missing object (404) is the normal state for an area whose polygon has not
// been drawn yet, so it is reported as `null` rather than thrown.
//
// THE ".json.gz" EXTENSION DOES NOT MEAN GZIP. The staging objects are plain
// JSON text, stored with `Content-Type: application/gzip` and no
// `Content-Encoding`, so nothing decompresses them in transit - the bytes on the
// wire start with `[` and not the gzip magic `1f 8b`. Because the name promises
// compression, this module reads bytes FIRST and decompresses only when the
// magic number says the payload really is gzip, so the day the writer starts
// compressing for real nothing here has to change. Do not "simplify" this to
// `response.json()` - that breaks silently the moment the writer ships gzip
// without a matching Content-Encoding.
import type { PolygonCoordinates } from "@/cms/types/area";

/** Gzip magic number: every gzip stream starts with these two bytes. */
const GZIP_MAGIC_FIRST = 0x1f;
const GZIP_MAGIC_SECOND = 0x8b;

/**
 * How many geometry objects to fetch at once.
 *
 * Geometry is per area, not per level, so a level with N areas costs N requests -
 * nationwide provinces are ~76 objects and one province's districts ~50, against
 * one file for the whole level under the old static source. Eight in flight keeps
 * a map mount responsive without opening hundreds of sockets at once.
 */
export const MINIO_FETCH_CONCURRENCY = 8;

/** One area's path segments inside the bucket, coarsest first. */
export type BoundaryPathSegments = readonly string[];

/**
 * Object path for one area, relative to the base URL.
 *
 * Segments are encoded individually: an id is a data value from the area API, and
 * a single stray "/" or "%" must not be able to reshape the path.
 */
export function boundaryObjectPath(segments: BoundaryPathSegments): string {
  return `${segments.map((segment) => encodeURIComponent(segment)).join("/")}.json.gz`;
}

/** Full object URL for one area. */
export function boundaryGeometryUrl(baseUrl: string, segments: BoundaryPathSegments): string {
  return `${baseUrl.replace(/\/+$/, "")}/${boundaryObjectPath(segments)}`;
}

/**
 * Shape guard for the payload.
 *
 * Deliberately structural rather than truthiness-based (see the repo's
 * "a truthiness check is not a success check" rule): an empty array is truthy, a
 * JSON object with the wrong nesting is truthy, and either would otherwise reach
 * the geometry constructors and blank the layer. Arrays are checked to depth
 * because the payload is `[ring][point][lng, lat]`.
 */
export function isPolygonRings(value: unknown): value is PolygonCoordinates {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every(
    (ring) =>
      Array.isArray(ring)
      && ring.length >= 3
      && ring.every(
        (point) =>
          Array.isArray(point)
          && point.length >= 2
          && Number.isFinite(point[0])
          && Number.isFinite(point[1])
      )
  );
}

/**
 * Decode a fetched object body to JSON text, decompressing only when it is
 * really gzipped. Kept separate from parsing so the magic-byte branch is
 * testable without a network stub.
 */
export async function decodeObjectBody(body: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(body);
  const isGzip = bytes.length >= 2
    && bytes[0] === GZIP_MAGIC_FIRST
    && bytes[1] === GZIP_MAGIC_SECOND;
  if (!isGzip) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  // Read through globalThis so a missing DecompressionStream (older Safari) is a
  // clear "cannot decode" below instead of a module-load crash.
  const Decompressor = (globalThis as {
    DecompressionStream?: new (format: "gzip") => TransformStream<Uint8Array, Uint8Array>;
  }).DecompressionStream;
  if (!Decompressor) {
    throw new Error("Boundary geometry is gzip-compressed but DecompressionStream is unavailable");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new Decompressor("gzip"));
  return new Response(stream).text();
}

/**
 * Fetch and parse one area's rings.
 *
 * Resolves `null` for every "no polygon here" outcome - 404, other HTTP failures,
 * a compressed stream that will not decode, a body that is not rings - because
 * for an org that has only drawn some of its areas, those are all the same
 * thing to the map: nothing to draw at that node. Genuine surprises are logged
 * with the object URL so a real data problem stays visible.
 */
export async function fetchBoundaryRings(
  url: string,
  signal?: AbortSignal
): Promise<PolygonCoordinates | null> {
  try {
    const response = await fetch(url, { signal });
    if (response.status === 404) {
      // Expected: this area has no drawn polygon yet.
      return null;
    }
    if (!response.ok) {
      console.error(`Boundary geometry request failed with ${response.status}: ${url}`);
      return null;
    }
    const decoded = await decodeObjectBody(await response.arrayBuffer());
    const parsed: unknown = JSON.parse(decoded);
    if (!isPolygonRings(parsed)) {
      console.error(`Boundary geometry for ${url} is not a polygon ring set`);
      return null;
    }
    return parsed;
  }
  catch (error) {
    // An aborted fetch is a torn-down map, not a data problem.
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    console.error(`Failed to load boundary geometry from ${url}`, error);
    return null;
  }
}

/**
 * Run `worker` over `items` with at most `limit` in flight, preserving input
 * order in the result.
 *
 * The level builders need results positionally aligned with their node lists, so
 * order is part of the contract. Written out rather than pulled from a library
 * because this is the only place in the map layer that fans out this hard.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const size = Math.max(1, Math.min(limit, items.length));
  let next = 0;

  const run = async (): Promise<void> => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: size }, run));
  return results;
}
