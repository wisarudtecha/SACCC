// Unit tests for the Device layer's category resolution + symbol builders.
// Run: `pnpm test` (Vitest, node environment).
import { describe, it, expect } from "vitest";
import { DEVICE_CATEGORIES } from "./deviceTypes";
import {
  DEVICE_SYMBOL_TOKENS,
  createDeviceHaloSymbol,
  createDeviceHitAreaSymbol,
  createDeviceSymbol,
  getDeviceCategoryLabelKey,
  getDeviceCategoryRgb,
  resolveDeviceCategory
} from "./deviceSymbols";

describe("resolveDeviceCategory", () => {
  it("maps the three named device types, case- and whitespace-insensitive", () => {
    expect(resolveDeviceCategory("Camera")).toBe("camera");
    expect(resolveDeviceCategory("camera")).toBe("camera");
    expect(resolveDeviceCategory("  CAMERA  ")).toBe("camera");
    expect(resolveDeviceCategory("Fire Hydrant")).toBe("fire_hydrant");
    expect(resolveDeviceCategory("hydrant")).toBe("fire_hydrant");
    expect(resolveDeviceCategory("AED")).toBe("aed");
  });

  it("returns null for anything not in the provisional match table", () => {
    expect(resolveDeviceCategory("CCTV")).toBeNull();
    expect(resolveDeviceCategory("Sensor")).toBeNull();
    expect(resolveDeviceCategory("")).toBeNull();
    expect(resolveDeviceCategory("camera 2")).toBeNull();
  });
});

describe("getDeviceCategoryRgb / getDeviceCategoryLabelKey", () => {
  it("returns a distinct RGB triple per category", () => {
    const triples = DEVICE_CATEGORIES.map((c) => getDeviceCategoryRgb(c).join(","));
    expect(new Set(triples).size).toBe(DEVICE_CATEGORIES.length);
    for (const c of DEVICE_CATEGORIES) {
      const rgb = getDeviceCategoryRgb(c);
      expect(rgb).toHaveLength(3);
      expect(rgb.every((n) => n >= 0 && n <= 255)).toBe(true);
    }
  });

  it("returns an i18n key under case.display for every category", () => {
    for (const c of DEVICE_CATEGORIES) {
      expect(getDeviceCategoryLabelKey(c)).toMatch(/^case\.display\.map_device_category_/);
    }
  });
});

describe("createDeviceSymbol", () => {
  it("is a path marker in the category colour, larger when selected", () => {
    const idle = createDeviceSymbol("camera", { isSelected: false });
    const selected = createDeviceSymbol("camera", { isSelected: true });
    expect(idle.type).toBe("simple-marker");
    expect(idle.style).toBe("path");
    expect(idle.path).toBe(DEVICE_SYMBOL_TOKENS.categoryPath.camera);
    expect(selected.size).toBeGreaterThan(idle.size);
    expect(selected.outline.width).toBeGreaterThan(idle.outline.width);
  });

  it("lifts the glyph so it stands on the point (yoffset = size / 2)", () => {
    const symbol = createDeviceSymbol("aed", { isSelected: false });
    expect(symbol.yoffset).toBe(symbol.size / 2);
  });
});

describe("createDeviceHaloSymbol", () => {
  it("is a translucent circle in the category colour", () => {
    const halo = createDeviceHaloSymbol("fire_hydrant");
    expect(halo.type).toBe("simple-marker");
    expect(halo.style).toBe("circle");
    expect(halo.size).toBe(DEVICE_SYMBOL_TOKENS.haloSize);
    expect(halo.color[3]).toBeLessThan(1);
  });
});

describe("createDeviceHitAreaSymbol", () => {
  it("is a fully transparent circle sized like the selection halo", () => {
    const hitArea = createDeviceHitAreaSymbol();
    expect(hitArea.type).toBe("simple-marker");
    expect(hitArea.style).toBe("circle");
    expect(hitArea.size).toBe(DEVICE_SYMBOL_TOKENS.haloSize);
    expect(hitArea.color).toEqual([0, 0, 0, 0]);
    expect(hitArea.outline.width).toBe(0);
    expect(hitArea.outline.color).toEqual([0, 0, 0, 0]);
  });
});
