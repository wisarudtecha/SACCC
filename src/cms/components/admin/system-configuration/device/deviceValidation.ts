// Pure, framework-free validators for the Device Management create/edit form
// (src/cms/components/admin/system-configuration/device/DeviceManagement.tsx).
//
// Kept in their own module so they can be unit-tested without a DOM - the repo's
// test runner (Vitest, `environment: "node"`) only covers pure logic. Mirrors
// the inline `isValidCoordinate` helper in `place/PlaceManagement.tsx`, which is
// re-exported here so the Device screen and any future clone share one copy.

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LON_MIN = -180;
export const LON_MAX = 180;

/**
 * A non-empty numeric string within [min, max]. Same contract as the Place
 * screen's coordinate check: an empty string is invalid (latitude / longitude
 * are required on the Device form).
 */
export const isValidCoordinate = (raw: string, min: number, max: number): boolean => {
  if (!raw.trim()) {
    return false;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
};

/**
 * Dotted-quad IPv4 (`10.0.0.1`). Four decimal octets, each 0-255, no leading
 * zeroes on a multi-digit octet, nothing else. Callers treat an empty string as
 * "not provided" (the field is optional) and only call this on a non-empty value.
 */
export const isValidIpv4 = (raw: string): boolean => {
  const value = raw.trim();
  const parts = value.split(".");
  if (parts.length !== 4) {
    return false;
  }
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }
    if (part.length > 1 && part.startsWith("0")) {
      return false;
    }
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
};

/**
 * A MAC address as six hex pairs separated by `:` or `-`
 * (`AA:BB:CC:DD:EE:FF` or `aa-bb-cc-dd-ee-ff`). The separator must be consistent.
 * Callers only invoke this on a non-empty value (the field is optional).
 */
export const isValidMacAddress = (raw: string): boolean => {
  const value = raw.trim();
  return /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/.test(value)
    || /^[0-9A-Fa-f]{2}(-[0-9A-Fa-f]{2}){5}$/.test(value);
};
