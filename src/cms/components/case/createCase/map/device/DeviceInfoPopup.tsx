// The card shown when a Device marker is clicked.
//
// A copy of PlaceInfoPopup with one addition: stakeholder decision Q2 says
// selecting a Device sets `caseState.iotDevice`. That write is TWO-STEP - the
// click only opens this card; the explicit "Link this device to the case" button
// here is the only thing that writes, and "Unlink" clears it. On the view-only
// surfaces (`canLink` false) neither button renders and the card is pure info,
// exactly like PlaceInfoPopup.
//
// Plain React rather than a provider popup, for the same reasons as
// PlaceInfoPopup: native map popups render in the vendor's light theme, cannot
// reach the app's translation catalogues, and swallow the next map click.
import { memo, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PanelCollapseToggle from "../PanelCollapseToggle";
import { getDeviceCategoryLabelKey, getDeviceCategoryRgb } from "./deviceSymbols";
import type { DeviceMarker } from "./deviceTypes";

interface DeviceInfoPopupProps {
  device: DeviceMarker;
  /** Whether this surface may link a device to the case (Link/Unlink buttons). */
  canLink: boolean;
  /** Whether this device is the one currently linked to the case. */
  isLinked: boolean;
  onClose: () => void;
  /** Set only when this Device was picked out of a cluster panel - shows a "back to the group" row. */
  onBack?: () => void;
  /** How many Devices the group held, for the back row's label. */
  backCount?: number;
  onLink: () => void;
  onUnlink: () => void;
  /** Positioning classes; the caller places the card over the map. */
  className?: string;
}

function DeviceInfoPopupBase({
  device,
  canLink,
  isLinked,
  onClose,
  onBack,
  backCount,
  onLink,
  onUnlink,
  className = ""
}: DeviceInfoPopupProps) {
  const { t } = useTranslation();
  // Collapsed to type and category, to leave room when other panels are open. The
  // Link / Unlink action is part of what collapses - it is one press away.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const closeLabel = t("case.display.map_device_close");
  const categoryRgb = device.category ? getDeviceCategoryRgb(device.category) : null;
  const categoryLabel = device.category
    ? t(getDeviceCategoryLabelKey(device.category))
    : t("case.display.map_device_uncategorised");

  return (
    <div
      className={`rounded-md bg-white/95 p-3 text-xs shadow-md dark:bg-gray-800/95 ${className}`}
    >
      {/* See PlaceInfoPopup.tsx for why negative margins rather than an outer shell. */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-mx-3 -mt-3 mb-2 flex w-[calc(100%+1.5rem)] items-center gap-1 border-b border-gray-200 px-3 py-1.5 text-left text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {t("case.display.map_device_group_back", { count: backCount ?? 0 })}
          </span>
        </button>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 dark:text-white">
            {device.deviceType}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-gray-600 dark:text-gray-300">
            {categoryRgb && (
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: `rgb(${categoryRgb[0]}, ${categoryRgb[1]}, ${categoryRgb[2]})` }}
              />
            )}
            {categoryLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <PanelCollapseToggle
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed((value) => !value)}
            isCompact
          />
          <button
            type="button"
            onClick={onClose}
            title={closeLabel}
            aria-label={closeLabel}
            className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {device.model && (
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {t("case.display.map_device_model")}: {device.model}
            </p>
          )}
          <p className="mt-1 font-mono text-[11px] text-gray-500 dark:text-gray-400">
            {t("case.display.map_device_id")}: {device.deviceId}
          </p>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t("case.display.map_device_coordinates")}: {device.latitude.toFixed(5)},{" "}
            {device.longitude.toFixed(5)}
          </p>

          {canLink && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
              {isLinked ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {t("case.display.map_device_linked")}
                  </span>
                  <button
                    type="button"
                    onClick={onUnlink}
                    className="shrink-0 rounded border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-black/5 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    {t("case.display.map_device_unlink")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onLink}
                  className="w-full rounded bg-blue-600 px-2 py-1 font-medium text-white hover:bg-blue-700"
                >
                  {t("case.display.map_device_link")}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const DeviceInfoPopup = memo(DeviceInfoPopupBase);
DeviceInfoPopup.displayName = "DeviceInfoPopup";

export default DeviceInfoPopup;
