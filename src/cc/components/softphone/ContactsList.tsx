// Contacts list for the idle right panel.
// Search + filter trigger + avatar list.
import { useTranslation } from "@/core/hooks/useTranslation";
import { Search, SlidersHorizontal, User } from "lucide-react";
import type { ContactListItem } from "./softphoneTypes";

export interface ContactsListProps {
  contacts: ContactListItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (contact: ContactListItem) => void;
  onFilterOpen: () => void;
  isLoading?: boolean;
}

export function ContactsList({
  contacts,
  query,
  onQueryChange,
  onSelect,
  onFilterOpen,
  isLoading = false,
}: ContactsListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.softphone.contacts")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("common.search_placeholder")}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        <button
          type="button"
          onClick={onFilterOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("cc.softphone.filter")}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("common.loading")}
          </p>
        )}

        {!isLoading &&
          contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelect(contact)}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {contact.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {contact.name}
                  </p>
                  {contact.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {contact.phone}
                </p>
                {contact.company && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {contact.company}
                  </p>
                )}
              </div>
            </button>
          ))}

        {!isLoading && contacts.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("common.no_result")}
          </p>
        )}
      </div>
    </div>
  );
}
