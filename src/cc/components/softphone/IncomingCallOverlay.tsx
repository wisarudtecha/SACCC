// Inline incoming-call overlay for the softphone workspace.
// Appears when a CALL_INCOMING event arrives while the agent is on the
// softphone page. Dismissed on answer or reject.
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  PhoneCall,
  PhoneForwarded,
  PhoneMissed,
  User,
} from "lucide-react";

export interface IncomingCallOverlayProps {
  callerNumber: string;
  isNewContact: boolean;
  durationSeconds?: number;
  onReject: () => void;
  onAnswer: () => void;
  onTransfer: () => void;
}

export function IncomingCallOverlay({
  callerNumber,
  isNewContact,
  durationSeconds,
  onReject,
  onAnswer,
  onTransfer,
}: IncomingCallOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t("cc.softphone.incoming_call")}
          </span>
        </div>
        {isNewContact && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t("cc.softphone.new_contact")}
          </span>
        )}
        {durationSeconds !== undefined && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {new Date(durationSeconds * 1000).toISOString().slice(14, 19)}
          </span>
        )}
      </div>

      {/* Caller */}
      <div className="flex items-center gap-3 self-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <User className="h-5 w-5 text-gray-500" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {callerNumber}
        </p>
      </div>

      {/* Actions */}
      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <PhoneMissed className="h-4 w-4" aria-hidden="true" />
          {t("cc.softphone.reject")}
        </button>
        <button
          type="button"
          onClick={onAnswer}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          {t("cc.softphone.answer")}
        </button>
      </div>

      <button
        type="button"
        onClick={onTransfer}
        className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        <PhoneForwarded className="h-4 w-4" aria-hidden="true" />
        {t("cc.softphone.transfer_call")}
      </button>
    </div>
  );
}
