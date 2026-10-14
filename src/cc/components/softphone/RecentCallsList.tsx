// Recent-calls list for the idle left panel.
// Tabbed by direction + missed status; populated from mock fixtures
// (real API swap-in later).
import { useMemo, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  Clock,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
} from "lucide-react";
import type { RecentCallItem, CallDirection } from "./softphoneTypes";
import { formatCallDuration } from "./softphoneCallState";

export interface RecentCallsListProps {
  calls: RecentCallItem[];
  onSelectCall?: (call: RecentCallItem) => void;
}

type CallFilter = "all" | CallDirection | "missed";

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

const FILTERS: { key: CallFilter; labelKey: string }[] = [
  { key: "all", labelKey: "cc.softphone.all_calls" },
  { key: "incoming", labelKey: "cc.softphone.incoming" },
  { key: "outgoing", labelKey: "cc.softphone.outgoing" },
  { key: "missed", labelKey: "cc.softphone.missed" },
];

export function RecentCallsList({ calls, onSelectCall }: RecentCallsListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CallFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return calls;
    if (filter === "missed") return calls.filter((c) => c.missed);
    return calls.filter((c) => c.direction === filter);
  }, [calls, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.softphone.recent_calls")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, labelKey }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {key === "incoming" && (
                <PhoneIncoming className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {key === "outgoing" && (
                <PhoneOutgoing className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {key === "missed" && (
                <PhoneMissed className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t("cc.softphone.calls_count", { count: filtered.length })}
      </p>

      <div className="flex flex-col gap-2">
        {filtered.map((call) => (
          <button
            key={call.callId}
            type="button"
            onClick={() => onSelectCall?.(call)}
            className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left dark:border-gray-800 dark:bg-gray-900 ${
              onSelectCall
                ? "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              {call.missed ? (
                <PhoneMissed className="h-4 w-4 text-red-500" aria-hidden="true" />
              ) : call.direction === "incoming" ? (
                <PhoneIncoming className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              ) : (
                <PhoneOutgoing className="h-4 w-4 text-blue-500" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {call.name}
                </p>
                {call.missed && (
                  <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {t("cc.softphone.missed")}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {call.number}
              </p>
            </div>

            <div className="shrink-0 text-right">
              {call.durationSeconds !== undefined && !call.missed && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>{formatCallDuration(call.durationSeconds)}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatTimeAgo(call.timestamp)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
