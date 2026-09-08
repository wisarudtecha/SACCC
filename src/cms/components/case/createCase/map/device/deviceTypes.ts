// View-model for the Device layer markers drawn on the case map.
//
// A Device is one row of the org's existing IoT registry (GET /devices). The
// layer shows Camera / Fire Hydrant / AED devices within the current map extent;
// selecting one sets `caseState.iotDevice` to that device's id and nothing else
// (stakeholder decision Q2). Cameras are pin-only - no live video feed.
//
// Kept free of any map SDK import, matching mapTypes.ts / staffTypes.ts.

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
