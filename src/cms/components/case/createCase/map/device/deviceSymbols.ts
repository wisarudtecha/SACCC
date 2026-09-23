// Marker symbols for the Device layer, plus the one place that decides which
// free-text `deviceType` string falls into which category bucket.
//
// Same construction as placeSymbols.ts / staffSymbols.ts: one fixed colour and
// one 24x24 glyph per category, ArcGIS autocast builders for the ArcGIS layer,
// and PLACE-style shared tokens for the Longdo / MapTiler layers that draw from
// SVG. Per stakeholder question Q5 a category-coded icon is an accepted starting
// point; the icon set is still open.
import type { DeviceCategory } from "./deviceTypes";

type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

const CATEGORY_RGB: Record<DeviceCategory, Rgb> = {
  camera: [79, 70, 229], // indigo-600
  fire_hydrant: [8, 145, 178], // cyan-600
  aed: [22, 163, 74] // green-600
};

const CATEGORY_LABEL_KEY: Record<DeviceCategory, string> = {
  camera: "case.display.map_device_category_camera",
  fire_hydrant: "case.display.map_device_category_fire_hydrant",
  aed: "case.display.map_device_category_aed"
};

const CATEGORY_PATH: Record<DeviceCategory, string> = {
  // Camera body with a solid lens (sweep flags match the body's winding so the
  // lens fills under the nonzero fill rule instead of punching a hole - a
  // hollow lens made the icon's center visually unclickable).
  camera:
    "M9 4 7.6 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.6L15 4H9zm3 4.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  // Hydrant.
  fire_hydrant:
    "M8 8a4 4 0 0 1 8 0v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8zM6 19h12v3H6zM5 9h2v4H5zM17 9h2v4h-2z",
  // Heart.
  aed: "M12 21C6.8 17 3 13.3 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 13.3 17.2 17 12 21z"
};

const DEFAULT_SIZE = 20;
const SELECTED_SIZE = 26;
const FILL_ALPHA = 0.95;

const HALO_SIZE = 36;
const HALO_FILL_ALPHA = 0.22;
const HALO_OUTLINE_ALPHA = 0.5;

/** Cluster circle: same base/step/max as staffSymbols.ts and placeSymbols.ts. */
const GROUP_BASE_SIZE = 26;
const GROUP_SIZE_PER_MEMBER = 1.6;
const GROUP_MAX_SIZE = 40;
const GROUP_FILL_ALPHA = 0.92;
const GROUP_HALO_MARGIN = 12;

/**
 * Amber - distinct from the Place cluster colour (violet, see placeSymbols.ts)
 * and from every staff availability colour (green/red/gray), so a dispatcher
 * can tell the three kinds of cluster apart at a glance. Also distinct from
 * every Device category colour (indigo/cyan/green).
 */
const CLUSTER_RGB: Rgb = [217, 119, 6]; // amber-600

/**
 * TODO(deviceType): PROVISIONAL. Real `deviceType` values are not discoverable
 * anywhere in this repo - no device fixtures, no backend contract, no seed data,
 * and the field is free text with no enum (stakeholder decision 3). These keys
 * are a best guess at the strings the three named categories (decision 2) will
 * arrive as. Confirm against a live QA/SIT environment or the backend team and
 * correct this map before the Device layer ships; until then, a device whose
 * `deviceType` is spelled or cased differently resolves to `null` and shows
 * under no category filter.
 *
 * Keys must be lower-cased and trimmed - resolveDeviceCategory normalises the
 * input the same way before the lookup.
 */
const DEVICE_TYPE_MATCH: Record<string, DeviceCategory> = {
  camera: "camera",
  "fire hydrant": "fire_hydrant",
  hydrant: "fire_hydrant",
  aed: "aed"
};

/**
 * Map a raw `Device.deviceType` string to a category bucket, or `null` when it
 * matches none of the known values. Case- and whitespace-insensitive.
 *
 * `null` rather than a default bucket is deliberate: bucketing an unrecognised
 * device as, say, a Camera would put a wrong marker on a dispatcher's map, which
 * is worse than the device being absent from the category filters.
 */
export function resolveDeviceCategory(deviceType: string): DeviceCategory | null {
  const normalised = deviceType.trim().toLowerCase();
  return DEVICE_TYPE_MATCH[normalised] ?? null;
}

function withAlpha(rgb: Rgb, alpha: number): Rgba {
  return [rgb[0], rgb[1], rgb[2], alpha];
}

export function getDeviceGroupSize(count: number): number {
  return Math.min(GROUP_MAX_SIZE, GROUP_BASE_SIZE + count * GROUP_SIZE_PER_MEMBER);
}

/** The one place that maps a Device category to its marker colour. */
export function getDeviceCategoryRgb(category: DeviceCategory): Rgb {
  return CATEGORY_RGB[category];
}

/** The i18n key for a category's label. */
export function getDeviceCategoryLabelKey(category: DeviceCategory): string {
  return CATEGORY_LABEL_KEY[category];
}

export interface DeviceSymbolState {
  isSelected: boolean;
}

/**
 * ArcGIS autocast marker for one Device. Selection is carried by size plus a
 * heavier white ring; the category colour never changes.
 */
export function createDeviceSymbol(category: DeviceCategory, state: DeviceSymbolState) {
  const size = state.isSelected ? SELECTED_SIZE : DEFAULT_SIZE;

  return {
    type: "simple-marker" as const,
    style: "path" as const,
    path: CATEGORY_PATH[category],
    color: withAlpha(CATEGORY_RGB[category], FILL_ALPHA),
    size,
    yoffset: size / 2,
    outline: {
      color: [255, 255, 255, 1],
      width: state.isSelected ? 2 : 1.5
    }
  };
}

const HIT_AREA_SIZE = HALO_SIZE;
const TRANSPARENT: Rgba = [0, 0, 0, 0];

/**
 * Fully transparent circle drawn under EVERY device marker, sized well beyond
 * the visible glyph. ArcGIS hit-tests `path`-style markers against their
 * actual rendered geometry, so a hollow or thin icon (the camera's lens, in
 * particular) can miss a click that lands squarely on the marker; this gives
 * hitTest a generous, uniform circular target regardless of the glyph's shape,
 * without changing anything visible on the map.
 */
export function createDeviceHitAreaSymbol() {
  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: TRANSPARENT,
    size: HIT_AREA_SIZE,
    outline: {
      color: TRANSPARENT,
      width: 0
    }
  };
}

/** The disc drawn UNDER the selected Device marker, in the category colour. */
export function createDeviceHaloSymbol(category: DeviceCategory) {
  const rgb = CATEGORY_RGB[category];

  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(rgb, HALO_FILL_ALPHA),
    size: HALO_SIZE,
    outline: {
      color: withAlpha(rgb, HALO_OUTLINE_ALPHA),
      width: 1.5
    }
  };
}

/** The circle drawn in place of Device markers that overlap on screen. */
export function createDeviceGroupSymbol(count: number) {
  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(CLUSTER_RGB, GROUP_FILL_ALPHA),
    size: getDeviceGroupSize(count),
    outline: {
      color: [255, 255, 255, 1],
      width: 2
    }
  };
}

/** The member count, drawn as a second graphic over the cluster circle. */
export function createDeviceGroupLabelSymbol(count: number) {
  return {
    type: "text" as const,
    text: String(count),
    color: [255, 255, 255, 1],
    haloColor: [17, 24, 39, 0.55],
    haloSize: 1,
    horizontalAlignment: "center" as const,
    verticalAlignment: "middle" as const,
    font: {
      size: 11,
      weight: "bold" as const
    }
  };
}

/** The same halo as createDeviceHaloSymbol, sized to sit OUTSIDE a group circle. */
export function createDeviceGroupHaloSymbol(count: number) {
  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(CLUSTER_RGB, HALO_FILL_ALPHA),
    size: getDeviceGroupSize(count) + GROUP_HALO_MARGIN,
    outline: {
      color: withAlpha(CLUSTER_RGB, HALO_OUTLINE_ALPHA),
      width: 1.5
    }
  };
}

/**
 * Measurements and path data for the providers that draw from SVG (Longdo) or a
 * styled GeoJSON layer (MapTiler). See staffSymbols.ts' STAFF_SYMBOL_TOKENS.
 */
export const DEVICE_SYMBOL_TOKENS = {
  viewBox: 24,
  categoryPath: CATEGORY_PATH,
  categoryRgb: CATEGORY_RGB,
  size: DEFAULT_SIZE,
  selectedSize: SELECTED_SIZE,
  fillAlpha: FILL_ALPHA,
  haloSize: HALO_SIZE,
  haloFillAlpha: HALO_FILL_ALPHA,
  haloOutlineAlpha: HALO_OUTLINE_ALPHA,
  clusterRgb: CLUSTER_RGB,
  groupFillAlpha: GROUP_FILL_ALPHA,
  groupHaloMargin: GROUP_HALO_MARGIN
} as const;
