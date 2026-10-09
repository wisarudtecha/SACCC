// src/cc/components/workspace/EmailInboxPanel.tsx
"use client";

import { useMemo } from "react";
import {
  SearchIcon,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/cc/utils/cn";
import { Avatar, AvatarFallback } from "@/cc/components/ui/Avatar";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EmailInboxItem, EmailTab } from "@/cc/types/email";

interface EmailInboxPanelProps {
  emails: EmailInboxItem[];
  selectedId: string | null;
  activeTab: EmailTab;
  search: string;
  onSelect: (id: string) => void;
  onTabChange: (tab: EmailTab) => void;
  onSearchChange: (value: string) => void;
}

export default function EmailInboxPanel({
  emails,
  selectedId,
  activeTab,
  search,
  onSelect,
  onTabChange,
  onSearchChange,
}: EmailInboxPanelProps) {
  const { t } = useTranslation();

  const TABS: { id: EmailTab; label: string }[] = [
    { id: "inbox", label: t("cc.email.inbox") },
    { id: "sent", label: t("cc.email.sent") },
    { id: "archive", label: t("cc.email.archive") },
  ];

  const filteredEmails = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return emails;
    return emails.filter(
      (e) =>
        e.from.toLowerCase().includes(term) ||
        e.subject.toLowerCase().includes(term) ||
        e.preview.toLowerCase().includes(term)
    );
  }, [emails, search]);

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-black dark:text-white">
          {t("cc.email.inbox")}
        </h2>
        <button
          type="button"
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("cc.email.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("cc.email.noEmailsFound")}
          </div>
        ) : (
          filteredEmails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors",
                selectedId === email.id
                  ? "bg-gray-50 dark:bg-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                email.unread && selectedId !== email.id && "bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10 mt-0.5 shrink-0">
                  <AvatarFallback className="bg-blue-300 dark:bg-blue-600 text-white text-sm font-medium">
                    {(email.fromName || email.from).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3
                      className={cn(
                        "text-sm truncate",
                        email.unread
                          ? "font-semibold text-black dark:text-white"
                          : "font-medium text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {email.fromName || email.from}
                    </h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                      {email.time}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      email.unread
                        ? "font-semibold text-black dark:text-white"
                        : "font-medium text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {email.preview}
                  </p>
                </div>
                {email.unread && (
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
