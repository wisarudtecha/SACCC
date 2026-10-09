// The softphone workspace (`/cc/softphone`). Two-panel redesign:
//   left  = call area (make-call / active-call / recent-calls)
//   right = contacts / contact detail
// State lives in `useSoftphone`; contact resolution in `useSoftphoneContact`.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { PhoneCall, ArrowLeft } from "lucide-react";
import { useLazyGetCustommersProductQuery } from "@/cms/store/api/custommerApi";
import { useLazyGetCustomerQuery } from "@/cms/store/api/custommerApi";
import { useLazyGetListCaseByCustomerIdQuery } from "@/cms/store/api/caseApi";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { AgentStateSelector } from "./AgentStateSelector";
import { ActiveCallCard } from "./ActiveCallCard";
import { CallControls } from "./CallControls";
import { QuickActions } from "./QuickActions";
import { RecentCallsList } from "./RecentCallsList";
import { MakeCallSection } from "./MakeCallSection";
import { ContactsList } from "./ContactsList";
import { ContactDetail } from "./ContactDetail";
import { ContactNotFound } from "./ContactNotFound";
import { ContactFilterDrawer } from "./ContactFilterDrawer";
import { useSoftphone } from "./useSoftphone";
import { useSoftphoneContact } from "./useSoftphoneContact";
import { MOCK_CONTACTS, MOCK_RECENT_CALLS } from "./softphoneFixture";
import { formatCallDuration } from "./softphoneCallState";
import type { ContactListItem } from "./softphoneTypes";
import {
  extractCustomer,
  extractCaseSummaries,
  selectRecentCases,
  type CustomerSummary,
  type CaseSummary,
} from "../../utils/incomingCallPayload";

function mapCustomerProductToContactListItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: Record<string, any>
): ContactListItem | null {
  const id = typeof item.id === "string" ? item.id : "";
  const name =
    item.displayName ||
    `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
    "";
  const phone = item.mobileNo || "";
  if (!id || !name) return null;
  return { id, name, phone };
}

export default function Softphone() {
  const { t } = useTranslation();
  const {
    activeCall,
    lastEndedCall,
    agentState,
    controlsEnabled,
    controls,
    clearEnded,
  } = useSoftphone();

  const { customer, lookupStatus, recentCases } = useSoftphoneContact(
    activeCall,
    controlsEnabled
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{
    customer: CustomerSummary;
    recentCases: CaseSummary[];
  } | null>(null);
  const [selectedContactLoading, setSelectedContactLoading] = useState(false);

  const [searchCustomers] = useLazyGetCustommersProductQuery();
  const [fetchCustomer] = useLazyGetCustomerQuery();
  const [fetchCases] = useLazyGetListCaseByCustomerIdQuery();

  const isMock = DEV_CONFIG.MOCK_API;

  // Debounced customer search
  useEffect(() => {
    if (isMock) return;
    const q = contactQuery.trim();
    if (!q) {
      setContacts([]);
      return;
    }
    setContactsLoading(true);
    const timer = setTimeout(() => {
      searchCustomers({ start: 0, length: 20, search: q })
        .unwrap()
        .then((res) => {
          const data = res?.data;
          const list = Array.isArray(data)
            ? data
                .map(mapCustomerProductToContactListItem)
                .filter((c): c is ContactListItem => c !== null)
            : [];
          setContacts(list);
        })
        .catch(() => setContacts([]))
        .finally(() => setContactsLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [contactQuery, searchCustomers, isMock]);

  const handleSelectContact = useCallback(
    async (contact: ContactListItem) => {
      if (isMock) {
        setSelectedContact(null);
        return;
      }
      setSelectedContactLoading(true);
      try {
        const customerRes = await fetchCustomer(contact.id).unwrap();
        const extracted = extractCustomer(customerRes);
        if (!extracted) {
          setSelectedContact(null);
          return;
        }
        const caseRes = await fetchCases({
          customerId: extracted.id,
          start: 0,
          length: 10,
        }).unwrap();
        const cases = selectRecentCases(
          extractCaseSummaries(caseRes),
          undefined,
          3
        );
        setSelectedContact({ customer: extracted, recentCases: cases });
      } catch {
        setSelectedContact(null);
      } finally {
        setSelectedContactLoading(false);
      }
    },
    [fetchCustomer, fetchCases, isMock]
  );

  const displayContacts = isMock ? MOCK_CONTACTS : contacts;

  const handleLinkContact = useCallback((contactId: string) => {
    void contactId;
    // TODO: link unknown caller to existing contact
  }, []);

  const handleCreateNewContact = useCallback(() => {
    // TODO: navigate to customer creation
  }, []);

  const hasActiveCall = activeCall !== null;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-4 py-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {t("cc.softphone.title")}
        </h1>
        <AgentStateSelector
          agentState={agentState}
          enabled={controlsEnabled}
          onSelect={controls.setAgentState}
        />
      </header>

      {/* Two-panel layout */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left panel */}
        <div className="flex flex-col gap-4">
          {hasActiveCall ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <ActiveCallCard
                  call={activeCall}
                  contactName={customer?.displayName ?? null}
                  contactNumber={customer?.mobileNo ?? null}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <CallControls
                  call={activeCall}
                  controlsEnabled={controlsEnabled}
                  controls={controls}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <QuickActions
                  callId={activeCall.callId}
                  customerId={activeCall.customerId}
                  caseId={activeCall.caseId}
                  phoneNo={customer?.mobileNo ?? null}
                  controlsEnabled={controlsEnabled}
                />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <MakeCallSection
                  controlsEnabled={controlsEnabled}
                  activeCallId={null}
                  lastEndedCallId={lastEndedCall?.callId ?? null}
                  controls={controls}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <RecentCallsList calls={isMock ? MOCK_RECENT_CALLS : []} />
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {hasActiveCall ? (
            <>
              {lookupStatus === "resolved" && customer ? (
                <ContactDetail customer={customer} recentCases={recentCases} />
              ) : (
                <ContactNotFound
                  suggestedContacts={isMock ? MOCK_CONTACTS.slice(0, 3) : contacts.slice(0, 3)}
                  onLinkContact={handleLinkContact}
                  onCreateNew={handleCreateNewContact}
                />
              )}
            </>
          ) : selectedContact ? (
            <div className="flex h-full flex-col gap-4">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("cc.softphone.back_to_contacts")}
              </button>
              <ContactDetail
                customer={selectedContact.customer}
                recentCases={selectedContact.recentCases}
              />
            </div>
          ) : selectedContactLoading ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("common.loading")}
            </p>
          ) : (
            <ContactsList
              contacts={displayContacts}
              query={contactQuery}
              onQueryChange={setContactQuery}
              onSelect={handleSelectContact}
              onFilterOpen={() => setFilterOpen(true)}
              isLoading={contactsLoading}
            />
          )}
        </div>
      </div>

      {/* Last ended call notice (when no active call) */}
      {!hasActiveCall && lastEndedCall !== null && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <PhoneCall className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("cc.softphone.ended_title")} — {lastEndedCall.callId}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {t("cc.softphone.end_reason")}: {lastEndedCall.endReason}
                </span>
                {lastEndedCall.durationSeconds !== undefined && (
                  <span>
                    {t("cc.softphone.end_duration")}:{" "}
                    {formatCallDuration(lastEndedCall.durationSeconds)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => clearEnded(lastEndedCall.callId)}
            >
              {t("cc.softphone.ended_dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Filter drawer */}
      <ContactFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => setFilterOpen(false)}
        onReset={() => setFilterOpen(false)}
      />
    </div>
  );
}
