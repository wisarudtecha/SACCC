// View-model for the Device layer markers drawn on the case map.
//
// A Device is one row of the org's existing IoT registry (GET /devices). The
// layer shows Camera / Fire Hydrant / AED devices within the current map extent;
// selecting one sets `caseState.iotDevice` to that device's id and nothing else
// (stakeholder decision Q2). Cameras are pin-only - no live video feed.
//
// Kept free of any map SDK import, matching mapTypes.ts / staffTypes.ts.
import type { Device } from "@/cms/types/deviceIoT";
import { isMappableCoordinate } from "../staff/staffTypes";
import { resolveDeviceCategory } from "./deviceSymbols";

/**
 * The resolved category bucket, distinct from the raw `Device.deviceType`
 * string. `deviceType` is free text with no backend enum (stakeholder decision
 * 3), so a device may not resolve to any known bucket - that is `null`, and such
 * a device appears under no category filter until the raw values are confirmed
 * against a live environment (see resolveDeviceCategory in deviceSymbols.ts).
 */
export type DeviceCategory = "camera" | "fire_hydrant" | "aed";

export const DEVICE_CATEGORIES: readonly DeviceCategory[] = [
  "camera",
  "fire_hydrant",
  "aed"
] as const;

/**
 * One IoT device, normalised for the map.
 *
 * `Device.latitude` / `Device.longitude` arrive as strings and are not
 * guaranteed usable (0/0 for a device that never reported); the normaliser that
 * builds this (toDeviceMarkers, added with the viewport fetch) parses them to
 * finite numbers and drops anything unmappable, the same discipline
 * toStaffMarkers applies. `deviceType` is kept verbatim for display alongside
 * the resolved `category`.
 */
export interface DeviceMarker {
  deviceId: string;
  deviceType: string;
  category: DeviceCategory | null;
  model?: string;
  latitude: number;
  longitude: number;
}

/** A finite number, or null. `Device` coordinates arrive from the API as strings. */
function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * `Device[]` from the IoT registry -> `DeviceMarker[]` the map can draw.
 *
 * The single place that decides what counts as a mappable Device, mirroring
 * `toStaffMarkers` / `toPlaceMarkers`: parse the string coordinates, drop
 * anything that is not a usable point (exact 0/0, out of range), keep the raw
 * `deviceType` verbatim for display, and resolve the category bucket once.
 *
 * A device whose `deviceType` matches no known value keeps `category: null` - it
 * is still a valid marker, but `useDeviceLayer` filters it out (it belongs to no
 * category toggle) until the real `deviceType` strings are confirmed.
 *
 * A device that the Device Management admin screen has soft-deleted
 * (`active === false`) is dropped here so it leaves the dispatcher's map. A
 * device with `active` absent or `true` is kept - the BFF does not always send
 * the field (see `types/deviceIoT.tsx`).
 */
export function toDeviceMarkers(devices: readonly Device[] | undefined): DeviceMarker[] {
  if (!devices?.length) {
    return [];
  }
  return devices.reduce<DeviceMarker[]>((markers, device) => {
    if (device.active === false) {
      return markers;
    }
    const latitude = toFiniteNumber(device.latitude);
    const longitude = toFiniteNumber(device.longitude);
    if (latitude === null || longitude === null || !isMappableCoordinate(latitude, longitude)) {
      return markers;
    }
    return [
      ...markers,
      {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        category: resolveDeviceCategory(device.deviceType),
        model: device.model || undefined,
        latitude,
        longitude
      }
    ];
  }, []);
}
