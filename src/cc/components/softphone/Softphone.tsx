// The softphone workspace (`/cc/softphone`). Composition only — state lives
// in `useSoftphone`, transitions in `softphoneCallState.ts`, presentation in
// `ActiveCallPanel` / `TelephonyToolbar`.
import { useTranslation } from "@/core/hooks/useTranslation";
import { PhoneOff } from "lucide-react";
import { ActiveCallPanel } from "./ActiveCallPanel";
import { TelephonyToolbar } from "./TelephonyToolbar";
import { useSoftphone } from "./useSoftphone";
import { formatCallDuration } from "./softphoneCallState";

export default function Softphone() {
  const { t } = useTranslation();
  const {
    activeCall,
    lastEndedCall,
    agentState,
    controlsEnabled,
    controls,
    clearEnded,
  } = useSoftphone();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.softphone.title")}
        </h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300">
          {t("cc.softphone.agent_state")}:{" "}
          <span className="font-medium">
            {agentState ?? t("cc.softphone.agent_state_unknown")}
          </span>
        </span>
      </header>

      <main className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
        {activeCall !== null ? (
          <ActiveCallPanel call={activeCall} />
        ) : lastEndedCall !== null ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <PhoneOff className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t("cc.softphone.ended_title")} — {lastEndedCall.callId}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t("cc.softphone.end_reason")}: {lastEndedCall.endReason}
                  </span>
                  {lastEndedCall.durationSeconds !== undefined && (
                    <span>
                      {t("cc.softphone.end_duration")}:{" "}
                      {formatCallDuration(lastEndedCall.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="ml-auto rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => clearEnded(lastEndedCall.callId)}
              >
                {t("cc.softphone.ended_dismiss")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <PhoneOff
              className="h-8 w-8 text-gray-300 dark:text-gray-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("cc.softphone.no_active_call")}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("cc.softphone.no_active_call_hint")}
            </p>
          </div>
        )}

        <TelephonyToolbar
          call={activeCall}
          controlsEnabled={controlsEnabled}
          controls={controls}
        />

        {controlsEnabled && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("cc.softphone.mock_hint")}
          </p>
        )}
      </main>
    </div>
  );
}
