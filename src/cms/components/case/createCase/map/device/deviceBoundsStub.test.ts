// Unit tests for the offline Device viewport stub.
// Run: `pnpm test` (Vitest, node environment).
import { describe, it, expect } from "vitest";
import type { DeviceBoundsRequest } from "@/cms/types/deviceIoT";
import { resolveDeviceCategory } from "./deviceSymbols";
import { buildStubDevicesInBounds } from "./deviceBoundsStub";

const BOX: DeviceBoundsRequest = { minLat: 13.7, minLon: 100.5, maxLat: 13.8, maxLon: 100.6 };

describe("buildStubDevicesInBounds", () => {
  it("is deterministic for a given box", () => {
    expect(buildStubDevicesInBounds(BOX)).toEqual(buildStubDevicesInBounds(BOX));
  });

  it("returns 10-14 devices", () => {
    const count = buildStubDevicesInBounds(BOX).length;
    expect(count).toBeGreaterThanOrEqual(10);
    expect(count).toBeLessThanOrEqual(14);
  });

  it("places every device inside the box with finite coordinates", () => {
    for (const d of buildStubDevicesInBounds(BOX)) {
      const lat = parseFloat(d.latitude);
      const lon = parseFloat(d.longitude);
      expect(Number.isFinite(lat)).toBe(true);
      expect(Number.isFinite(lon)).toBe(true);
      expect(lat).toBeGreaterThanOrEqual(BOX.minLat);
      expect(lat).toBeLessThanOrEqual(BOX.maxLat);
      expect(lon).toBeGreaterThanOrEqual(BOX.minLon);
      expect(lon).toBeLessThanOrEqual(BOX.maxLon);
    }
  });

  it("spans both recognised and unrecognised deviceType strings", () => {
    const types = new Set(buildStubDevicesInBounds(BOX).map((d) => d.deviceType));
    const resolved = [...types].map(resolveDeviceCategory);
    expect(resolved.some((c) => c !== null)).toBe(true);
    expect(resolved.some((c) => c === null)).toBe(true);
  });

  it("yields a different set for a different box", () => {
    const a = buildStubDevicesInBounds(BOX).map((d) => d.deviceId);
    const b = buildStubDevicesInBounds({
      minLat: 18.7,
      minLon: 98.9,
      maxLat: 18.8,
      maxLon: 99.0
    }).map((d) => d.deviceId);
    expect(a).not.toEqual(b);
  });

  it("gives every device a unique id", () => {
    const ids = buildStubDevicesInBounds(BOX).map((d) => d.deviceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
