// src/cms/components/customer/contact/CustomerContactsTab.tsx
/**
 * The customer's contact records — the people a customer account keeps, each with their own
 * phone number.
 *
 * PII handling follows the same split as every other customer surface:
 *
 *   - **Display** is the backend's job. The list renders what the API returned, redacted where
 *     the backend redacted (`maskContactValue` is flag-gated and is identity unless this
 *     deployment opts into client-side masking).
 *   - **Editing** is a permission question and stays live in every deployment. A viewer without
 *     `pii.user.sensitive.personal` gets the phone as text styled like a disabled input — never
 *     an `<input disabled>`, which still advertises a field they cannot have — and the key is
 *     omitted from the PATCH body, because the PATCH ignores absent keys and the value in state
 *     is the redaction rather than the number.
 *
 * `contactAddr` is deliberately **not** classified: the published PII matrix lists only
 * `contactPhone` for this entity. It is displayed as text and is not editable here — adding
 * address editing would need a classification decision first, not a UI change.
 */
import { useState } from "react";
import Loading from "@/core/components/common/Loading";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { useCustomerContacts } from "@/cms/hooks/useCustomerContacts";
import type { CustomerContact } from "@/cms/types/customerContact";

/** Mirrors the input's own metrics so swapping one for text doesn't shift the layout. */
const LOCKED_FIELD_CLASSES =
  "h-11 flex items-center px-4 py-2.5 text-sm text-gray-800 dark:text-white/90";

/** Every non-empty address part, in the order the object declares them. */
const addressText = (contact: CustomerContact): string => {
  const address = contact.contactAddr;
  if (!address) {
    return "";
  }

  return Object.values(address)
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(", ");
};

interface ContactEditorProps {
  contact: CustomerContact;
  /** False when this viewer may not edit the phone number. */
  canEditPhone: boolean;
  isSaving: boolean;
  onCancel: () => void;
  /** `contactPhone` is absent when the viewer may not edit it — see the file header. */
  onSave: (input: { contactName: string; contactPhone?: string }) => void;
}

/**
 * Declared at module scope on purpose: a component defined inside another component's body is a
 * new function on every render, so React remounts the subtree and the inputs lose focus.
 */
const ContactEditor = ({ contact, canEditPhone, isSaving, onCancel, onSave }: ContactEditorProps) => {
  const { t } = useTranslation();
  const { redactContactValue } = usePiiMasker();
  const [contactName, setContactName] = useState(contact.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(contact.contactPhone ?? "");

  return (
    <div className="space-y-3 p-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("common.name")}
        </label>
        <Input
          type="text"
          value={contactName}
          onChange={event => setContactName(event.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("common.phone_number")}
        </label>
        {canEditPhone ? (
          <Input
            type="text"
            value={contactPhone}
            onChange={event => setContactPhone(event.target.value)}
          />
        ) : (
          <p className={LOCKED_FIELD_CLASSES}>
            {redactContactValue("contactPhone", contact.contactPhone) || "-"}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={isSaving}
          onClick={() =>
            onSave(canEditPhone ? { contactName, contactPhone } : { contactName })
          }
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
};

export const CustomerContactsTab: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();
  const { canViewContactField, maskContactValue } = usePiiMasker();
  const { contacts, isLoading, isFetching, isPartial, isError, updateContact, refresh } =
    useCustomerContacts(customerId);

  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Editing the phone is a permission question, so it does not consult
   * `PII_MASKING_ENABLED` — a deployment that lets the backend mask still has to stop an
   * unviewable value from being typed over.
   */
  const canEditPhone = canViewContactField("contactPhone");

  const editing = contacts.find(contact => String(contact.id) === editingId) ?? null;

  const handleSave = async (input: { contactName: string; contactPhone?: string }) => {
    if (!editing) {
      return;
    }

    const saved = await updateContact({
      id: String(editing.id),
      custId: editing.custId,
      contactName: input.contactName,
      // Absent, not blanked: the PATCH ignores absent keys, so the stored number survives.
      ...(canEditPhone ? { contactPhone: input.contactPhone } : {}),
    });

    addToast(saved ? "success" : "error", t(saved ? "common.success" : "common.error"));

    if (saved) {
      setEditingId(null);
      refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="p-5">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return <div className="p-5 text-center text-red-500">{t("common.error")}</div>;
  }

  if (contacts.length === 0) {
    return <div className="p-5 text-center text-gray-500">{t("common.no_result")}</div>;
  }

  return (
    <div className="space-y-3 p-5">
      {/* Bounded, not complete — say so rather than presenting a truncated list as the truth. */}
      {isPartial && <p className="text-sm text-amber-600">{t("customer.contact.partial")}</p>}

      {contacts.map(contact => {
        const id = String(contact.id);
        const address = addressText(contact);

        return (
          <div
            key={id}
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {editingId === id && editing ? (
              <ContactEditor
                key={id}
                contact={editing}
                canEditPhone={canEditPhone}
                isSaving={isFetching}
                onCancel={() => setEditingId(null)}
                onSave={handleSave}
              />
            ) : (
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {contact.contactName || "-"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contact.contactPhone
                      ? maskContactValue("contactPhone", contact.contactPhone)
                      : "-"}
                  </p>
                  {address && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{address}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(id)}
                >
                  {t("common.edit")}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomerContactsTab;
