// Filter panel for the contacts list.
// UI-only until backend contact-filter API lands.
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { X } from "lucide-react";

export interface ContactFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: ContactFilters) => void;
  onReset: () => void;
}

export interface ContactFilters {
  channel: string[];
  company: string;
  accountManager: string;
  tags: string[];
  source: string;
  createdDate: string;
}

const CHANNELS = ["Call", "Chat", "LINE", "Facebook"];
const TAG_OPTIONS = ["Enterprise", "Premium", "VIP", "New"];

export function ContactFilterDrawer({
  open,
  onClose,
  onApply,
  onReset,
}: ContactFilterDrawerProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ContactFilters>({
    channel: [],
    company: "",
    accountManager: "",
    tags: [],
    source: "",
    createdDate: "",
  });

  const toggleChannel = (ch: string) => {
    setFilters((prev) => ({
      ...prev,
      channel: prev.channel.includes(ch)
        ? prev.channel.filter((c) => c !== ch)
        : [...prev.channel, ch],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleReset = () => {
    setFilters({
      channel: [],
      company: "",
      accountManager: "",
      tags: [],
      source: "",
      createdDate: "",
    });
    onReset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex w-full max-w-sm flex-col gap-4 bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {t("common.filters")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Channel */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Channel
          </label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.channel.includes(ch)
                    ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Company
          </label>
          <input
            type="text"
            value={filters.company}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, company: e.target.value }))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Account Manager */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Account Manager
          </label>
          <input
            type="text"
            value={filters.accountManager}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, accountManager: e.target.value }))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filters.tags.includes(tag)
                    ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Source
          </label>
          <input
            type="text"
            value={filters.source}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, source: e.target.value }))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Created Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Created Date
          </label>
          <input
            type="date"
            value={filters.createdDate}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, createdDate: e.target.value }))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onApply(filters)}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("cc.softphone.apply_filters")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t("cc.softphone.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
