// Make-call input section for the idle left panel.
// Wraps the existing Dialpad with a design-matching input row.
import { useTranslation } from "@/core/hooks/useTranslation";
import { PhoneCall } from "lucide-react";
import { Dialpad } from "./Dialpad";
import type { SoftphoneControls } from "./useSoftphone";

export interface MakeCallSectionProps {
  controlsEnabled: boolean;
  activeCallId: string | null;
  lastEndedCallId: string | null;
  controls: SoftphoneControls;
}

export function MakeCallSection({
  controlsEnabled,
  activeCallId,
  lastEndedCallId,
  controls,
}: MakeCallSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PhoneCall className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.softphone.make_call")}
        </p>
      </div>

      <Dialpad
        enabled={controlsEnabled}
        activeCallId={activeCallId}
        lastEndedCallId={lastEndedCallId}
        onDial={controls.dial}
      />
    </div>
  );
}
