// One incoming-call popup card. Pure presentation — every transition and
// lookup state was decided by the reducer/orchestration layer; this file
// only renders an `IncomingCallPopupItem` and calls the action callbacks.
//
// Visual language mirrors the notification popup card in
// `NotificationDropdown.tsx` (rounded card, slide-in via translate + opacity
// over `POPUP_TRANSITION_MS`), but anchored bottom-right so it never
// collides with the toasts (top-right, z-999999) or notification popups
// (top-right, z-9999).
import { useEffect, useState } from "react";
import { PhoneIncoming, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { POPUP_TRANSITION_MS } from "@/core/utils/constants";
import type { CustomerSummary } from "../../utils/incomingCallPayload";
import type { IncomingCallPopupItem } from "./incomingCallPopupState";

export interface IncomingCallCardProps {
  item: IncomingCallPopupItem;
  /** Total cards in the stack — drives the queue badge on the newest card. */
  queueCount: number;
  /** True for the newest card (the one carrying the queue badge). */
  isNewest: boolean;
  onAnswer: (callId: string) => void;
  onOpenCase: (caseId: string) => void;
  onCreateCase: (item: IncomingCallPopupItem) => void;
  onDismiss: (callId: string) => void;
}

function initialsOf(customer: CustomerSummary): string {
  const source =
    customer.displayName || `${customer.firstName} ${customer.lastName}`.trim();
  return source.slice(0, 1).toUpperCase() || "?";
}

function formatDate(iso: string): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function IncomingCallCard({
  item,
  queueCount,
  isNewest,
  onAnswer,
  onOpenCase,
  onCreateCase,
  onDismiss,
}: IncomingCallCardProps) {
  const { t } = useTranslation();
  const [entered, setEntered] = useState(false);

  // Enter on the next frame so the initial translated state paints first.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const callId = item.call.callId;
  const callerNumber = item.ani.national || item.ani.raw;
  const customer = item.customer;
  const customerName =
    customer?.displayName || `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim();

  return (
    <div
      role="dialog"
      aria-label={t("cc.screenpop.title")}
      className="relative w-90 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl transition-all ease-in-out"
      style={{
        transitionDuration: `${POPUP_TRANSITION_MS}ms`,
        transform: `translateX(${entered ? "0" : "420px"})`,
        opacity: entered ? 1 : 0,
      }}
    >
      {isNewest && queueCount > 1 && (
        <div className="absolute -top-2 -left-2 z-10">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">
            {queueCount}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600" />
        </span>
        <PhoneIncoming className="h-5 w-5 text-green-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.screenpop.title")}
        </p>
        <button
          type="button"
          aria-label={t("cc.screenpop.action_dismiss")}
          className="ml-auto rounded-full p-1 text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white border border-gray-200 dark:border-gray-700"
          onClick={() => onDismiss(callId)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Caller line */}
      <div className="px-3 pt-2 flex items-center gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("cc.screenpop.caller_id")}
        </p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {callerNumber}
        </p>
      </div>

      {/* Customer section */}
      <div className="px-3 py-2">
        {item.lookup === "pending" || item.lookup === "resolving" ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("cc.screenpop.looking_up")}
          </p>
        ) : item.lookup === "resolved" && customer ? (
          <div className="flex items-center gap-3">
            {customer.photo ? (
              <img
                src={customer.photo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                {initialsOf(customer)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {customerName || t("cc.screenpop.customer")}
              </p>
              {customer.mobileNo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {customer.mobileNo}
                </p>
              )}
              {customer.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {customer.email}
                </p>
              )}
            </div>
          </div>
        ) : item.lookup === "unknown" ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("cc.screenpop.no_customer")}
          </p>
        ) : (
          <p className="text-sm text-red-500 dark:text-red-400">
            {t("cc.screenpop.lookup_error")}
          </p>
        )}
      </div>

      {/* Recent cases (only meaningful once a customer resolved) */}
      {customer && (
        <div className="px-3 pb-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("cc.screenpop.open_cases")}
          </p>
          {item.casesStatus === "loading" ? (
            <div className="space-y-1">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="h-6 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : item.casesStatus === "error" ? (
            <p className="text-xs text-red-500 dark:text-red-400">
              {t("cc.screenpop.cases_error")}
            </p>
          ) : item.cases.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("cc.screenpop.no_cases")}
            </p>
          ) : (
            <ul className="space-y-1">
              {item.cases.map((caseItem) => (
                <li key={caseItem.caseId}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => onOpenCase(caseItem.caseId)}
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                      {caseItem.caseId}
                    </span>
                    {caseItem.statusId && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {caseItem.statusId}
                      </span>
                    )}
                    {item.call.caseId === caseItem.caseId && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {t("cc.screenpop.linked_case")}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-[10px] text-gray-400">
                      {formatDate(caseItem.receivedDate)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions — Answer is the primary (green) action; a resolved command
          means "answer accepted", the CALL_ANSWERED event confirms. */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2"
            onClick={() => onAnswer(callId)}
          >
            {t("cc.screenpop.action_answer")}
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
            onClick={() => onCreateCase(item)}
          >
            {t("cc.screenpop.action_create_case")}
          </button>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 text-sm px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => onDismiss(callId)}
        >
          {t("cc.screenpop.action_dismiss")}
        </button>
      </div>
    </div>
  );
}
