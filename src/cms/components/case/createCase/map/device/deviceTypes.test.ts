// Unit tests for the Device map view-model normalizer.
// Run: `pnpm test` (Vitest, node environment).
import { describe, it, expect } from "vitest";
import type { Device } from "@/cms/types/deviceIoT";
import { toDeviceMarkers } from "./deviceTypes";

function device(overrides: Partial<Device> = {}): Device {
  return {
    orgId: "org-1",
    deviceId: "DEV-1",
    deviceType: "Camera",
    model: "AXIS-P3245",
    firmwareVer: "1.0.0",
    latitude: "13.7563",
    longitude: "100.5018",
    ipAddress: "10.0.0.1",
    macAddress: "AA:BB:CC:DD:EE:FF",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    createdBy: "seed",
    updatedBy: "seed",
    ...overrides
  };
}

describe("toDeviceMarkers", () => {
  it("returns [] for empty / undefined input", () => {
    expect(toDeviceMarkers(undefined)).toEqual([]);
    expect(toDeviceMarkers([])).toEqual([]);
  });

  it("parses string coordinates to finite numbers", () => {
    const [marker] = toDeviceMarkers([device({ latitude: "13.5", longitude: "100.25" })]);
    expect(marker.latitude).toBe(13.5);
    expect(marker.longitude).toBe(100.25);
    expect(typeof marker.latitude).toBe("number");
  });

  it("keeps the raw deviceType and resolves the category bucket", () => {
    const markers = toDeviceMarkers([
      device({ deviceId: "a", deviceType: "Camera" }),
      device({ deviceId: "b", deviceType: "Fire Hydrant" }),
      device({ deviceId: "c", deviceType: "AED" }),
      device({ deviceId: "d", deviceType: "CCTV" })
    ]);
    expect(markers.map((m) => [m.deviceType, m.category])).toEqual([
      ["Camera", "camera"],
      ["Fire Hydrant", "fire_hydrant"],
      ["AED", "aed"],
      ["CCTV", null]
    ]);
  });

  it("keeps a null-category device as a marker (it is filtered later, not here)", () => {
    expect(toDeviceMarkers([device({ deviceType: "Sensor" })])).toHaveLength(1);
  });

  it("drops exact 0/0 coordinates", () => {
    expect(toDeviceMarkers([device({ latitude: "0", longitude: "0" })])).toEqual([]);
  });

  it("drops out-of-range coordinates", () => {
    expect(toDeviceMarkers([device({ latitude: "999", longitude: "100" })])).toEqual([]);
    expect(toDeviceMarkers([device({ latitude: "13", longitude: "500" })])).toEqual([]);
  });

  it("drops non-numeric coordinates", () => {
    expect(toDeviceMarkers([device({ latitude: "", longitude: "" })])).toEqual([]);
    expect(toDeviceMarkers([device({ latitude: "abc", longitude: "100" })])).toEqual([]);
  });

  it("normalises an empty model to undefined", () => {
    const [marker] = toDeviceMarkers([device({ model: "" })]);
    expect(marker.model).toBeUndefined();
  });

  it("carries the deviceId through unchanged", () => {
    const [marker] = toDeviceMarkers([device({ deviceId: "STUB-DEV-ABC123" })]);
    expect(marker.deviceId).toBe("STUB-DEV-ABC123");
  });

  it("keeps mappable devices and drops unmappable ones from a mixed list", () => {
    const markers = toDeviceMarkers([
      device({ deviceId: "keep", latitude: "13.7", longitude: "100.5" }),
      device({ deviceId: "drop", latitude: "0", longitude: "0" })
    ]);
    expect(markers.map((m) => m.deviceId)).toEqual(["keep"]);
  });

  it("drops a soft-deleted device (active === false) but keeps active/undefined ones", () => {
    const markers = toDeviceMarkers([
      device({ deviceId: "gone", active: false }),
      device({ deviceId: "on", active: true }),
      device({ deviceId: "legacy" }) // active absent - BFF may omit it
    ]);
    expect(markers.map((m) => m.deviceId)).toEqual(["on", "legacy"]);
  });
});
