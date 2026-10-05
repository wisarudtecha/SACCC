// Telephony toolbar for the softphone. Pure presentation — the buttons call
// the `SoftphoneControls` callbacks and render from the passed `call` state;
// whether the commands actually do anything (dev + mock mode) is decided by
// `controlsEnabled` from `useSoftphone`.
//
// Mute is a local device toggle (it is not part of the lifecycle event
// contract) so it lives as component state rather than call state.
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  Mic,
  MicOff,
  Pause,
  PhoneForwarded,
  PhoneOff,
  PhoneCall,
} from "lucide-react";
import type { SoftphoneControls } from "./useSoftphone";
import type { CallSession } from "./softphoneCallState";

export interface TelephonyToolbarProps {
  /** The session the buttons act on; null when no call is connected. */
  call: CallSession | null;
  /** True when the control commands are wired (dev + mock mode only). */
  controlsEnabled: boolean;
  controls: SoftphoneControls;
}

type ControlButtonProps = {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  /** Tailwind classes for the enabled variant. */
  variant?: "neutral" | "danger";
};

function ControlButton({
  label,
  icon,
  disabled,
  onClick,
  variant = "neutral",
}: ControlButtonProps) {
  const enabledStyle =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${enabledStyle} ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TelephonyToolbar({
  call,
  controlsEnabled,
  controls,
}: TelephonyToolbarProps) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(false);

  // A connected leg the agent can still act on. A transferred leg is out of
  // this agent's hands until its terminal CALL_ENDED arrives (contract Q7),
  // so every command is disabled for it.
  const controllable =
    call !== null && (call.status === "active" || call.status === "on_hold");
  const disabled = !controllable || !controlsEnabled;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <ControlButton
          label={
            muted
              ? t("cc.softphone.toolbar_unmute")
              : t("cc.softphone.toolbar_mute")
          }
          icon={
            muted ? (
              <MicOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic className="h-4 w-4" aria-hidden="true" />
            )
          }
          disabled={!controllable}
          onClick={() => setMuted((previous) => !previous)}
        />
        {call?.status === "on_hold" ? (
          <ControlButton
            label={t("cc.softphone.toolbar_resume")}
            icon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
            disabled={disabled}
            onClick={controls.resume}
          />
        ) : (
          <ControlButton
            label={t("cc.softphone.toolbar_hold")}
            icon={<Pause className="h-4 w-4" aria-hidden="true" />}
            disabled={disabled}
            onClick={controls.hold}
          />
        )}
        <ControlButton
          label={t("cc.softphone.toolbar_transfer")}
          icon={<PhoneForwarded className="h-4 w-4" aria-hidden="true" />}
          disabled={disabled}
          onClick={controls.transfer}
        />
        <ControlButton
          label={t("cc.softphone.toolbar_hang_up")}
          icon={<PhoneOff className="h-4 w-4" aria-hidden="true" />}
          disabled={disabled}
          onClick={controls.hangUp}
          variant="danger"
        />
      </div>
      {!controlsEnabled && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("cc.softphone.controls_unavailable")}
        </p>
      )}
    </div>
  );
}
