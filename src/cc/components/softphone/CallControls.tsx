// Call-control buttons for the active-call left panel.
// Replaces TelephonyToolbar with a design-matching layout.
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  Mic,
  MicOff,
  Pause,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
} from "lucide-react";
import type { SoftphoneControls } from "./useSoftphone";
import type { CallSession } from "./softphoneCallState";

export interface CallControlsProps {
  call: CallSession | null;
  controlsEnabled: boolean;
  controls: SoftphoneControls;
}

export function CallControls({
  call,
  controlsEnabled,
  controls,
}: CallControlsProps) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(false);

  const controllable =
    call !== null && (call.status === "active" || call.status === "on_hold");
  const disabled = !controllable || !controlsEnabled;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          aria-label={muted ? t("cc.softphone.toolbar_unmute") : t("cc.softphone.toolbar_mute")}
          title={muted ? t("cc.softphone.toolbar_unmute") : t("cc.softphone.toolbar_mute")}
          disabled={!controllable}
          onClick={() => setMuted((p) => !p)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {muted ? (
            <MicOff className="h-5 w-5 text-gray-500" aria-hidden="true" />
          ) : (
            <Mic className="h-5 w-5 text-gray-500" aria-hidden="true" />
          )}
          <span>{muted ? t("cc.softphone.toolbar_unmute") : t("cc.softphone.toolbar_mute")}</span>
        </button>

        {call?.status === "on_hold" ? (
          <button
            type="button"
            aria-label={t("cc.softphone.toolbar_resume")}
            title={t("cc.softphone.toolbar_resume")}
            disabled={disabled}
            onClick={controls.resume}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <PhoneCall className="h-5 w-5 text-gray-500" aria-hidden="true" />
            <span>{t("cc.softphone.toolbar_resume")}</span>
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("cc.softphone.toolbar_hold")}
            title={t("cc.softphone.toolbar_hold")}
            disabled={disabled}
            onClick={controls.hold}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Pause className="h-5 w-5 text-gray-500" aria-hidden="true" />
            <span>{t("cc.softphone.toolbar_hold")}</span>
          </button>
        )}

        <button
          type="button"
          aria-label={t("cc.softphone.toolbar_transfer")}
          title={t("cc.softphone.toolbar_transfer")}
          disabled={disabled}
          onClick={controls.transfer}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <PhoneForwarded className="h-5 w-5 text-gray-500" aria-hidden="true" />
          <span>{t("cc.softphone.toolbar_transfer")}</span>
        </button>
      </div>

      <button
        type="button"
        aria-label={t("cc.softphone.toolbar_hang_up")}
        title={t("cc.softphone.toolbar_hang_up")}
        disabled={disabled}
        onClick={controls.hangUp}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PhoneOff className="h-5 w-5" aria-hidden="true" />
        <span>{t("cc.softphone.end_call")}</span>
      </button>
    </div>
  );
}
