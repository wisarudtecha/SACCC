// Active-call panel for the softphone. Pure presentation — every transition
// was decided by the state machine (`softphoneCallState.ts`); this file only
// renders a `CallSession` and carries no side effects.
import { useTranslation } from "@/core/hooks/useTranslation";
import { PhoneCall } from "lucide-react";
import type { CallSession, CallSessionStatus } from "./softphoneCallState";

export interface ActiveCallPanelProps {
  call: CallSession;
}

const STATUS_STYLES: Record<CallSessionStatus, string> = {
  active:
    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  on_hold:
    "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  transferred:
    "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  ended: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
};

const STATUS_KEYS: Record<CallSessionStatus, string> = {
  active: "cc.softphone.status_active",
  on_hold: "cc.softphone.status_on_hold",
  transferred: "cc.softphone.status_transferred",
  ended: "cc.softphone.status_ended",
};

export function ActiveCallPanel({ call }: ActiveCallPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <PhoneCall className="h-5 w-5 text-green-600" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {t("cc.softphone.call_label")} {call.callId}
          </p>
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[call.status]}`}
          >
            {t(STATUS_KEYS[call.status])}
          </span>
        </div>
      </div>

      {(call.customerId !== undefined || call.caseId !== undefined) && (
        <div className="flex flex-wrap gap-2">
          {call.customerId !== undefined && (
            <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
              {t("cc.softphone.customer_label")}: {call.customerId}
            </span>
          )}
          {call.caseId !== undefined && (
            <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
              {t("cc.softphone.case_label")}: {call.caseId}
            </span>
          )}
        </div>
      )}

      {call.status === "transferred" && call.transferredTo !== undefined && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {t("cc.softphone.transferred_to")}: {call.transferredTo}
        </p>
      )}
    </div>
  );
}
