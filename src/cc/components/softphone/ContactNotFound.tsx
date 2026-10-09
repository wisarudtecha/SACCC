// "No contact found" panel for the active-call right panel.
// Shows a warning, link-existing / create-new buttons, a search field,
// and suggested contacts to link.
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { AlertTriangle, Link2, Plus, Search, UserPlus } from "lucide-react";
import type { ContactListItem } from "./softphoneTypes";

export interface ContactNotFoundProps {
  suggestedContacts: ContactListItem[];
  onLinkContact: (contactId: string) => void;
  onCreateNew: () => void;
}

export function ContactNotFound({
  suggestedContacts,
  onLinkContact,
  onCreateNew,
}: ContactNotFoundProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col gap-4">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t("cc.softphone.no_contact_found")}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("cc.softphone.no_contact_hint")}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {t("cc.softphone.link_existing")}
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("cc.softphone.create_new")}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("cc.softphone.search_by_name_email_phone")}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>

      {/* Suggested contacts */}
      <div className="flex flex-col gap-2">
        {suggestedContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {contact.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {contact.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contact.phone}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {contact.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onLinkContact(contact.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("cc.softphone.link_contact")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
