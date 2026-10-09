// Contact-detail card for the active-call right panel.
// Tabs (Contact / Copilot / KB / More), profile, real contact channels,
// and sub-tabs (Profile / History / Notes).
import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useAppNavigate } from "@/core/router/useAppNavigate";
import { useGetCustomerQuery } from "@/cms/store/api/custommerApi";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { ContactChannelList } from "@/cms/components/customer/social/ContactChannelList";
import { NoteManager } from "@/cms/components/customer/notes/NoteManager";
import {
  ExternalLink,
  MessageCircle,
  Tag,
  User,
} from "lucide-react";
import type { CustomerSummary } from "../../utils/incomingCallPayload";
import type { CaseSummary } from "../../utils/incomingCallPayload";

export interface ContactDetailProps {
  customer: CustomerSummary;
  recentCases: CaseSummary[];
}

type TopTab = "contact" | "copilot" | "kb" | "more";
type SubTab = "profile" | "history" | "notes";

const TOP_TABS: { key: TopTab; labelKey: string; icon: React.ReactNode }[] = [
  { key: "contact", labelKey: "cc.softphone.contact", icon: <User className="h-4 w-4" /> },
  { key: "copilot", labelKey: "cc.softphone.copilot", icon: <MessageCircle className="h-4 w-4" /> },
  { key: "kb", labelKey: "cc.softphone.kb", icon: <Tag className="h-4 w-4" /> },
  { key: "more", labelKey: "cc.softphone.more", icon: <ExternalLink className="h-4 w-4" /> },
];

const SUB_TABS: { key: SubTab; labelKey: string }[] = [
  { key: "profile", labelKey: "cc.softphone.profile" },
  { key: "history", labelKey: "cc.softphone.history" },
  { key: "notes", labelKey: "cc.softphone.notes" },
];

export function ContactDetail({ customer, recentCases }: ContactDetailProps) {
  const { t } = useTranslation();
  const navigate = useAppNavigate("cms");
  const [topTab, setTopTab] = useState<TopTab>("contact");
  const [subTab, setSubTab] = useState<SubTab>("profile");

  const { data: customerData } = useGetCustomerQuery(customer.id);
  const fullCustomer = customerData?.data;

  const { socials, isLoading: socialsLoading, isPartial } = useCustomerSocials({
    customerId: customer.id,
    enabled: Boolean(customer.id),
  });

  const customerName =
    customer.displayName || `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TOP_TABS.map(({ key, labelKey, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTopTab(key)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              topTab === key
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {icon}
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {topTab === "contact" && (
        <div className="flex flex-col gap-4">
          {/* Profile header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {customerName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {customerName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {customer.mobileNo}
              </p>
            </div>
          </div>

          {/* Info grid — only real fields from CustomerSummary */}
          <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
            {customer.email && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{t("common.email")}:</span>
                <span>{customer.email}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/customer")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("cc.softphone.view_full_profile")}
          </button>

          {/* Sub-tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {SUB_TABS.map(({ key, labelKey }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSubTab(key)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                  subTab === key
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {subTab === "profile" && (
            <div className="flex flex-col gap-3">
              <ContactChannelList
                customer={fullCustomer}
                socials={socials}
                isLoading={socialsLoading}
                isPartial={isPartial}
                hideHeading
              />
            </div>
          )}

          {subTab === "history" && (
            <div className="flex flex-col gap-2">
              {recentCases.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("cc.screenpop.no_cases")}
                </p>
              ) : (
                recentCases.map((c) => (
                  <div
                    key={c.caseId}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {c.caseId}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {c.receivedDate}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === "notes" && (
            <NoteManager customerId={customer.id} />
          )}
        </div>
      )}

      {topTab === "copilot" && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          AI Copilot — coming soon.
        </p>
      )}

      {topTab === "kb" && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Knowledge Base — coming soon.
        </p>
      )}

      {topTab === "more" && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          More options — coming soon.
        </p>
      )}
    </div>
  );
}
