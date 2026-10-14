// Lightweight contact preview for the idle right panel.
// Shown when a recent-call or contact-list item is clicked.
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  ArrowLeft,
  Mail,
  PhoneCall,
  ExternalLink,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  User,
} from "lucide-react";
import type { ContactListItem, RecentCallItem } from "./softphoneTypes";
import { formatCallDuration } from "./softphoneCallState";

export interface ContactPreviewCardProps {
  contact: ContactListItem | null;
  recentCalls: RecentCallItem[];
  isInAddressBook: boolean;
  onEmail: () => void;
  onCall: () => void;
  onViewFullDetails: () => void;
  onBack: () => void;
}

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

export function ContactPreviewCard({
  contact,
  recentCalls,
  isInAddressBook,
  onEmail,
  onCall,
  onViewFullDetails,
  onBack,
}: ContactPreviewCardProps) {
  const { t } = useTranslation();

  const displayName = contact?.name || t("cc.softphone.no_contact_found");
  const displayPhone = contact?.phone || "";
  const initials = displayName.slice(0, 1).toUpperCase();

  const showViewFullDetails = isInAddressBook || recentCalls.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("cc.softphone.back_to_contacts")}
      </button>

      {/* Profile header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {displayName}
          </p>
          {displayPhone && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {displayPhone}
            </p>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
        {contact?.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact?.company && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            <span>{contact.company}</span>
          </div>
        )}
        {contact?.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {contact?.email && (
          <button
            type="button"
            onClick={onEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {t("cc.softphone.email")}
          </button>
        )}
        <button
          type="button"
          onClick={onCall}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
          {t("cc.softphone.call")}
        </button>
        {showViewFullDetails && (
          <button
            type="button"
            onClick={onViewFullDetails}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {t("cc.softphone.view_full_details")}
          </button>
        )}
      </div>

      {/* Recent calls mini-list */}
      {recentCalls.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("cc.softphone.recent_calls")}
          </p>
          <div className="flex flex-col gap-2">
            {recentCalls.map((call) => (
              <div
                key={call.callId}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  {call.missed ? (
                    <PhoneMissed className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                  ) : call.direction === "incoming" ? (
                    <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                    {call.name}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(call.timestamp)}
                  </p>
                </div>
                {call.durationSeconds !== undefined && !call.missed && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{formatCallDuration(call.durationSeconds)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
