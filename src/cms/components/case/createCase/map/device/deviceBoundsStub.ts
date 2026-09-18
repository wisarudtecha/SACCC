// Deterministic stand-in for the viewport-scoped device fetch (getDeviceIoT
// with a bbox filter - contract in src/cms/store/api/deviceIoT.ts).
//
// Used ONLY when VITE_MOCK_API="true". It lets the case-map Device layer (P5) -
// its markers, category filters, colours, and the DEVICE_TYPE_MATCH resolution -
// be built and demoed before the backend and the real `deviceType` strings are
// available. It is NOT wired to live data and MUST NOT be imported by production
// code paths. Same shape of stub as unitWorkloadStub.ts.
//
// The output is a pure function of the (rounded) bounding box, so a given
// viewport always yields the same devices, and panning changes the set the way a
// real refetch would.
//
// TODO(deviceType): the `deviceType` strings below are the same provisional
// guess as DEVICE_TYPE_MATCH in device/deviceSymbols.ts. "CCTV" and "Sensor" are
// deliberately NOT recognised, so P5's "uncategorised -> hidden" path gets
// exercised. Correct all of these once real values are known.
import type { Device, DeviceBoundsRequest } from "@/cms/types/deviceIoT";

/** Small, fast string hash (djb2). Stable across sessions and machines. */
function hashString(input: string): number {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  // >>> 0 folds it back into an unsigned 32-bit int.
  return hash >>> 0;
}

/** A hash-derived fraction in [0, 1). */
function fraction(seed: string): number {
  return hashString(seed) / 0x100000000;
}

function hex2(n: number): string {
  return (n & 0xff).toString(16).padStart(2, "0").toUpperCase();
}

// First three are recognised by DEVICE_TYPE_MATCH; the last two are not.
const STUB_DEVICE_TYPES = ["Camera", "Fire Hydrant", "AED", "CCTV", "Sensor"];
const STUB_MODELS = ["AXIS-P3245", "HYD-4000", "ZOLL-AED-PLUS", "HIK-DS2CD", "ENV-S1"];

/**
 * Mirrors a bbox-filtered `getDeviceIoT` response for a bounding box.
 * Returns ~10-14 devices at deterministic positions inside the box.
 */
export function buildStubDevicesInBounds(bounds: DeviceBoundsRequest): Device[] {
  const key = [bounds.minLat, bounds.minLon, bounds.maxLat, bounds.maxLon]
    .map((n) => n.toFixed(4))
    .join(":");
  const count = 10 + (hashString(key) % 5); // 10..14
  const latSpan = bounds.maxLat - bounds.minLat;
  const lonSpan = bounds.maxLon - bounds.minLon;

  return Array.from({ length: count }, (_, index) => {
    const seed = `${key}:${index}`;
    const h = hashString(seed);
    const latitude = bounds.minLat + fraction(`${seed}:lat`) * latSpan;
    const longitude = bounds.minLon + fraction(`${seed}:lon`) * lonSpan;
    const code = h.toString(36).toUpperCase().padStart(6, "0").slice(-6);

    return {
      orgId: "STUB-ORG",
      deviceId: `STUB-DEV-${code}`,
      deviceType: STUB_DEVICE_TYPES[h % STUB_DEVICE_TYPES.length] || "Camera",
      model: STUB_MODELS[h % STUB_MODELS.length] || "AXIS-P3245",
      firmwareVer: `1.${h % 9}.${(h >> 3) % 9}`,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      ipAddress: `10.${h % 255}.${(h >> 8) % 255}.${(h >> 16) % 255}`,
      macAddress: `AA:BB:${hex2(h)}:${hex2(h >> 8)}:${hex2(h >> 16)}:${hex2(h >> 24)}`,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      createdBy: "stub",
      updatedBy: "stub"
    };
  });
}
