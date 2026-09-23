// Owns everything the Device layer needs: the viewport-scoped fetch of the org's
// IoT devices, the show/hide toggle, the per-category filters, the current
// selection, the "link this device to the case" write, and the layer's status
// line.
//
// Called inside BoundaryMapField, next to useBoundarySelection / usePlaceLayer,
// for the same reason: BoundaryMapField renders a SECOND MapView when expanded,
// so the state has to live ABOVE it or expanding would reset the layer. Being
// the single choke point all three case-map surfaces pass through, the surfaces
// stay unaware of the layer - except CaseLocationSection, which passes an
// `onSelect` so a Link writes `caseState.iotDevice` (stakeholder decision Q2).
//
// Unlike Place, selecting a Device marker is TWO-STEP: a marker click only opens
// the info popup (local state); the popup's explicit "Link" button is the only
// thing that calls `onSelect`, and "Unlink" calls it with null. Nothing else
// touches the case.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { useGetDeviceIoTQuery } from "@/cms/store/api/deviceIoT";
import type { Device, DeviceBoundsRequest } from "@/cms/types/deviceIoT";
import { buildStubDevicesInBounds } from "./deviceBoundsStub";
import {
  DEVICE_BOUNDS_DEBOUNCE_MS,
  boundsKey,
  boundsToBbox,
  roundBounds,
  sameBounds
} from "./deviceBounds";
import { DEVICE_CATEGORIES, toDeviceMarkers, type DeviceMarker, type DeviceSelection } from "./deviceTypes";
import type { DeviceCategory } from "./deviceTypes";
import type { MapBounds } from "../mapTypes";

// A never-matched box for the query arg while the fetch is skipped (RTK still
// wants a serialisable argument even with `skip: true`).
const ZERO_BOUNDS: DeviceBoundsRequest = { minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 };

type CategoryVisibility = Record<DeviceCategory, boolean>;

const ALL_CATEGORIES_HIDDEN: CategoryVisibility = DEVICE_CATEGORIES.reduce(
  (visibility, category) => ({ ...visibility, [category]: false }),
  {} as CategoryVisibility
);

interface UseDeviceLayerOptions {
  /**
   * Writes the selected device id (or null) to the case. Only CaseLocationSection
   * passes this; on the view-only surfaces it is undefined and the popup shows no
   * Link/Unlink buttons.
   */
  onSelect?: (deviceId: string | null) => void;
  /** The case's current `iotDevice`, so the popup can show the linked state. */
  linkedDeviceId?: string | null;
}

export interface UseDeviceLayerResult {
  /** Markers to draw: category-filtered and category-resolved (null category dropped). */
  devices: DeviceMarker[];
  showDevice: boolean;
  toggleShowDevice: () => void;
  categoryVisibility: CategoryVisibility;
  toggleCategory: (category: DeviceCategory) => void;
  selectedDeviceId: string | null;
  /** The selected marker, or null when nothing is selected / the layer is off / it was filtered out. */
  selectedDevice: DeviceMarker | null;
  /** The current selection - a single Device, an unseparable group, or none. */
  selection: DeviceSelection | null;
  /**
   * The group's live members, re-resolved against `devices` every render (so
   * panning doesn't go stale), or null while no group is selected.
   */
  groupMarkers: DeviceMarker[] | null;
  /** Open/close the info popup for a marker. Does NOT write to the case. */
  selectDevice: (selection: DeviceSelection | null) => void;
  /**
   * The group a Device was picked out of, or null when it was selected
   * directly. Lets the info popup offer a "back to the group" button, mirroring
   * CaseStaffMapField's groupOrigin.
   */
  groupOrigin: readonly string[] | null;
  /** Pick a single Device out of the open group panel, remembering the group. */
  pickFromGroup: (deviceId: string) => void;
  /** Return to the group a Device was picked out of. No-op if there is none. */
  backToGroup: () => void;
  /** Link the currently-selected device to the case (popup "Link" button). */
  linkSelectedDevice: () => void;
  /** Clear the case's linked device (popup "Unlink" button). */
  unlinkDevice: () => void;
  linkedDeviceId: string | null;
  /** Feed the map's current extent; debounced + de-duped before it drives a refetch. */
  reportBounds: (bounds: MapBounds) => void;
  /** Localised status line for the toolbar (error / nothing in view), or undefined. */
  notice: string | undefined;
}

export function useDeviceLayer({
  onSelect,
  linkedDeviceId = null
}: UseDeviceLayerOptions = {}): UseDeviceLayerResult {
  const { t } = useTranslation();
  const isMock = DEV_CONFIG.MOCK_API;

  // Reset every mount (ticket Decision 6): layer hidden, every category
  // unchecked too (mirrors the Boundaries picker's nothing-selected default),
  // nothing selected, nothing persisted.
  const [showDevice, setShowDevice] = useState(false);
  const [categoryVisibility, setCategoryVisibility] =
    useState<CategoryVisibility>(ALL_CATEGORIES_HIDDEN);
  const [selection, setSelection] = useState<DeviceSelection | null>(null);
  const [groupOrigin, setGroupOrigin] = useState<readonly string[] | null>(null);
  const [bounds, setBounds] = useState<DeviceBoundsRequest | null>(null);

  // --- Debounced viewport reporting -----------------------------------------
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedBoundsRef = useRef<DeviceBoundsRequest | null>(null);
  committedBoundsRef.current = bounds;

  const reportBounds = useCallback((next: MapBounds) => {
    const rounded = roundBounds(next);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (!sameBounds(committedBoundsRef.current, rounded)) {
        setBounds(rounded);
      }
    }, DEVICE_BOUNDS_DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  // --- Real fetch (skipped in mock mode / while the layer is off) ----------
  // No separate "devices in bounds" operation on the backend - this is the
  // ordinary device list query (GetDeviceLists), filtered by bbox instead of
  // pagination (same shape as Place's bbox filtering).
  const shouldQuery = showDevice && !isMock && bounds !== null;
  const { data, isFetching, isError } = useGetDeviceIoTQuery(
    { bbox: boundsToBbox(bounds ?? ZERO_BOUNDS) },
    { skip: !shouldQuery }
  );

  // --- Mock fetch (deterministic, keyed on the rounded bounds like a refetch) --
  const [mockDevices, setMockDevices] = useState<Device[]>([]);
  const boundsSignature = boundsKey(bounds);
  useEffect(() => {
    if (isMock && showDevice && bounds) {
      setMockDevices(buildStubDevicesInBounds(bounds));
    } else {
      setMockDevices([]);
    }
    // `boundsSignature` stands in for `bounds` so a pan that lands on the same
    // rounded box does not re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock, showDevice, boundsSignature]);

  const rawDevices: Device[] | undefined = isMock ? mockDevices : data?.data;

  const allMarkers = useMemo(() => toDeviceMarkers(rawDevices), [rawDevices]);

  const devices = useMemo(
    () =>
      allMarkers.filter(
        (marker): marker is DeviceMarker & { category: DeviceCategory } =>
          marker.category !== null && categoryVisibility[marker.category]
      ),
    [allMarkers, categoryVisibility]
  );

  const selectedDeviceId = selection?.type === "device" ? selection.deviceId : null;

  const selectedDevice = useMemo(
    () =>
      showDevice
        ? devices.find((marker) => marker.deviceId === selectedDeviceId) ?? null
        : null,
    [showDevice, devices, selectedDeviceId]
  );

  // Re-resolved from live `devices` every render, mirroring
  // CaseStaffMapField's groupMarkers: the picker outlives the group that
  // opened it, so a viewport refetch must not close the card.
  const groupMarkers = useMemo(
    () =>
      showDevice && selection?.type === "group"
        ? devices.filter((marker) => selection.deviceIds.includes(marker.deviceId))
        : null,
    [showDevice, selection, devices]
  );

  // --- Actions -------------------------------------------------------------
  const toggleShowDevice = useCallback(() => {
    setShowDevice((on) => !on);
    setSelection(null);
    setGroupOrigin(null);
  }, []);

  const toggleCategory = useCallback((category: DeviceCategory) => {
    setCategoryVisibility((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

  // A direct click (map marker or group panel's close/re-selection) always
  // starts a fresh journey - only pickFromGroup below sets groupOrigin.
  const selectDevice = useCallback((next: DeviceSelection | null) => {
    setSelection(next);
    setGroupOrigin(null);
  }, []);

  const pickFromGroup = useCallback(
    (deviceId: string) => {
      if (selection?.type === "group") {
        setGroupOrigin(selection.deviceIds);
      }
      setSelection({ type: "device", deviceId });
    },
    [selection]
  );

  const backToGroup = useCallback(() => {
    if (!groupOrigin) {
      return;
    }
    setSelection({ type: "group", deviceIds: groupOrigin });
    setGroupOrigin(null);
  }, [groupOrigin]);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const linkSelectedDevice = useCallback(() => {
    if (selectedDeviceId) {
      onSelectRef.current?.(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const unlinkDevice = useCallback(() => {
    onSelectRef.current?.(null);
  }, []);

  // --- Status line ------------------------------------------------------------
  const notice = useMemo(() => {
    if (!isMock && isError) {
      return t("case.display.map_device_error");
    }
    if (showDevice && bounds && !isFetching && allMarkers.length === 0) {
      return t("case.display.map_device_empty");
    }
    return undefined;
  }, [isMock, isError, showDevice, bounds, isFetching, allMarkers.length, t]);

  return {
    devices,
    showDevice,
    toggleShowDevice,
    categoryVisibility,
    toggleCategory,
    selectedDeviceId,
    selectedDevice,
    selection,
    groupMarkers,
    selectDevice,
    groupOrigin,
    pickFromGroup,
    backToGroup,
    linkSelectedDevice,
    unlinkDevice,
    linkedDeviceId,
    reportBounds,
    notice
  };
}
