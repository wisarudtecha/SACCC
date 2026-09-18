export interface Device {
  orgId: string;
  deviceId: string;
  deviceType: string;
  model: string;
  firmwareVer: string;
  latitude: string;
  longitude: string;
  ipAddress: string;
  macAddress: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  /**
   * Fields below are added by the Device Management admin screen
   * (CAD-FE-Device-Management). They are OPTIONAL on the read model on purpose:
   * the BFF does not echo them yet (still PROVISIONAL, see deviceIoTQueries.ts),
   * and existing read consumers (`CasePanel`, `toDeviceMarkers`,
   * `buildStubDevicesInBounds`) must keep compiling without them. The create /
   * edit form always sends them - see `DeviceCreateData` / `DeviceUpdateData`.
   */
  en?: string;
  th?: string;
  active?: boolean;
}

/**
 * Payload for `POST /devices`. Mirrors `PlaceCreateData` in `types/place.ts`,
 * plus `deviceId`: the client-supplied natural key, required and unique
 * table-wide (not scoped per org - see API_Specification_Place_Device.md).
 */
export interface DeviceCreateData {
  deviceId: string;
  en: string;
  th: string;
  deviceType: string;
  model: string;
  firmwareVer: string;
  ipAddress: string;
  macAddress: string;
  latitude: string;
  longitude: string;
  active: boolean;
}

/**
 * Payload for `PATCH /devices/:id`. Same shape as `DeviceCreateData` minus
 * `deviceId` - immutable once created, it comes from the path, not the body.
 */
export type DeviceUpdateData = Omit<DeviceCreateData, "deviceId">;

/** Query params for `GET /devices`. */
export interface DeviceQueryParams {
  start?: number;
  length?: number;
  /** Exact match. */
  deviceType?: string;
  /** `minLng,minLat,maxLng,maxLat`. */
  bbox?: string;
  /** `true` to include soft-deleted (`active=false`) devices. Default: excluded. */
  includeInactive?: boolean;
}

/** Props for the `DeviceManagement` component - mirrors `PlaceManagementProps`. */
export interface DeviceManagementProps {
  devices?: Device[];
  isLoading?: boolean;
  isError?: boolean;
  /** Re-run the list query (RTK Query `refetch`) - used by the container's retry. */
  onRefresh?: () => void;
}

export interface DeviceMetrics {
  totalDevices: number | string;
  activeDevices: number | string;
  inactiveDevices: number | string;
}

/**
 * Bounding box for the viewport-scoped device query. WGS84 degrees. The case-map
 * Device layer (P5) sends the current map extent and refetches (debounced) on
 * pan/zoom - ticket Decision 4, "full visible-extent set".
 */
export interface DeviceBoundsRequest {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}