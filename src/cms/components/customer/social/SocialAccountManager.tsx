// src/cms/components/customer/social/SocialAccountManager.tsx
import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { ConfirmationModal } from "@/cms/components/case/modal/ConfirmationModal";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { useCustomerPrimaryContact } from "@/cms/hooks/useCustomerPrimaryContact";
import { toAddCustomerPayload } from "@/cms/utils/customerPayload";
import { providerMeta } from "@/cms/utils/customerSocial.policy";
import type { PrimaryContactTarget } from "@/cms/utils/customerSocial.policy";
import { ContactChannelList } from "@/cms/components/customer/social/ContactChannelList";
import { SocialAccountEditor } from "@/cms/components/customer/social/SocialAccountEditor";
import {
  useLazyGetCustomerQuery,
  useUpdateCustommersMutationMutation,
} from "@/cms/store/api/custommerApi";
import type { Customer } from "@/cms/store/api/custommerApi";
import type { CustomerSocial, DraftCustomerSocial } from "@/cms/types/customerSocial";

interface SocialAccountManagerProps {
  customer: Customer | undefined;
  /**
   * The contact channel currently selected in the customer form's dropdown, which may not be
   * saved yet. Given, it decides the Primary badge and which rows offer "set as primary", so
   * the list reflects the choice the agent is making rather than the last one they saved.
   *
   * The case side panel omits it — it has no preference dropdown, so the saved value stands.
   */
  preference?: string;
}

/**
 * Channels whose identifier *is* customer PII — an extra phone number or email address —
 * rather than a platform handle. Kept in step with `ContactChannelList`'s masking.
 */
const isPiiChannel = (socialType: string): boolean =>
  socialType === "PHONE" || socialType === "EMAIL";

const toDraft = (social: CustomerSocial): DraftCustomerSocial => ({
  socialType: social.socialType as DraftCustomerSocial["socialType"],
  socialId: social.socialId,
  socialName: social.socialName,
  imgUrl: social.imgUrl ?? "",
  email: "",
});

/**
 * A customer's contact channels, and the add/edit/unlink flow over them.
 *
 * The only component that writes social identities. It owns the two questions the editor
 * below it deliberately does not answer: is this identity already spoken for, and did the
 * write actually land — the second being non-obvious because the BFF answers business
 * failures with HTTP 200.
 */
export const SocialAccountManager = ({ customer, preference }: SocialAccountManagerProps) => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();
  const { canViewPii } = usePiiMasker();

  const customerId = customer?.id;

  const {
    socials,
    isLoading,
    isFetching,
    isMutating,
    isPartial,
    lookupIdentity,
    addSocial,
    editSocial,
    removeSocial,
    refresh,
  } = useCustomerSocials({ customerId });

  const {
    primaryKey,
    preferredFamily,
    isSaving: isSavingPrimary,
    setPrimary,
    repointAfterRemoval,
  } = useCustomerPrimaryContact({ customer, socials, preferenceOverride: preference });

  const [fetchCustomer] = useLazyGetCustomerQuery();
  const [updateCustomer] = useUpdateCustommersMutationMutation();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerSocial | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerSocial | null>(null);

  /**
   * Name the customer an identity already belongs to, rather than reporting a bare
   * "already linked". The index only carries a `custId`, so the name costs a lookup — but
   * "this LINE account belongs to Somchai P." is the entire value of the check, and a
   * generic error here is how an agent ends up creating a duplicate profile instead.
   */
  const describeOwner = useCallback(
    async (ownerId: string): Promise<string> => {
      try {
        const response = await fetchCustomer(ownerId).unwrap();
        const owner = response?.data;
        const name = owner?.displayName
          || [owner?.firstName, owner?.lastName].filter(Boolean).join(" ");
        return name || ownerId;
      }
      catch {
        // The name is a nicety; failing to get it must not swallow the conflict itself.
        return ownerId;
      }
    },
    [fetchCustomer]
  );

  /**
   * Text Chat's optional email. `CustomerSocialInput` has no email column, so it lands on
   * the customer instead — and only when that field is empty, since a chat session's email
   * is weaker evidence than whatever is already on the profile. Read-modify-write, because
   * `PATCH /customer/:id` takes a whole `AddCustomer` and is not documented as merging.
   */
  const applyOptionalEmail = useCallback(
    async (draft: DraftCustomerSocial) => {
      const email = draft.email?.trim();
      if (!email || !customer || !customerId || customer.email) {
        return;
      }

      try {
        await updateCustomer({
          id: customerId,
          data: { ...toAddCustomerPayload(customer), email },
        }).unwrap();
      }
      catch {
        // The channel itself saved; say so rather than failing the whole action.
        addToast("warning", t("customer.social.email_not_saved"));
      }
    },
    [customer, customerId, updateCustomer, addToast, t]
  );

  const guardIdentity = useCallback(
    async (draft: DraftCustomerSocial, ignoreId?: string): Promise<boolean> => {
      const lookup = lookupIdentity(draft.socialType, draft.socialId);
      if (lookup.state !== "taken" || lookup.social.id === ignoreId) {
        // "available" and "unknown" both proceed. An incomplete index cannot prove the
        // identity is free, and the backend's uniqueness constraint is the real guard —
        // this check exists to catch the common case early with a better message.
        return true;
      }

      const label = providerMeta(draft.socialType);
      const channel = label ? t(label.labelKey) : draft.socialType;

      if (String(lookup.social.custId) === String(customerId)) {
        addToast("error", t("customer.social.already_linked_here", { channel }));
        return false;
      }

      const owner = await describeOwner(String(lookup.social.custId));
      addToast("error", t("customer.social.already_linked_elsewhere", { channel, owner }));
      return false;
    },
    [lookupIdentity, customerId, describeOwner, addToast, t]
  );

  const handleCreate = useCallback(
    async (draft: DraftCustomerSocial) => {
      if (!(await guardIdentity(draft))) {
        return;
      }

      const result = await addSocial(draft);
      if (!result.ok) {
        // Leave the editor open with the values intact — retrying should not mean retyping.
        addToast("error", result.message || t("customer.social.save_failed"));
        return;
      }

      await applyOptionalEmail(draft);
      addToast("success", result.message || t("customer.social.linked"));
      setIsComposerOpen(false);
      refresh();
    },
    [guardIdentity, addSocial, applyOptionalEmail, addToast, t, refresh]
  );

  const handleUpdate = useCallback(
    async (draft: DraftCustomerSocial) => {
      if (!editing) {
        return;
      }
      if (!(await guardIdentity(draft, editing.id))) {
        return;
      }

      const result = await editSocial(editing.id, draft);
      if (!result.ok) {
        addToast("error", result.message || t("customer.social.save_failed"));
        return;
      }

      addToast("success", result.message || t("customer.social.updated"));
      setEditing(null);
      refresh();
    },
    [editing, guardIdentity, editSocial, addToast, t, refresh]
  );

  /**
   * Choosing a primary writes the specific entry and nothing else — the channel is the
   * `contractPreference` dropdown's to decide, and a row pick must not quietly re-answer it.
   * The list only offers this on rows the preference already permits.
   */
  const handleSetPrimary = useCallback(
    async (target: PrimaryContactTarget) => {
      const result = await setPrimary(target);

      addToast(
        result.ok ? "success" : "error",
        result.message || t(result.ok ? "customer.social.primary_updated" : "customer.social.primary_failed")
      );
    },
    [setPrimary, addToast, t]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const result = await removeSocial(pendingDelete.id);
    addToast(
      result.ok ? "success" : "error",
      result.message || t(result.ok ? "customer.social.unlinked" : "customer.social.unlink_failed")
    );
    setPendingDelete(null);

    if (result.ok) {
      // Silent housekeeping: the badge has already fallen back on its own, this just stops the
      // stored record pointing at a row that no longer exists.
      await repointAfterRemoval(pendingDelete);
      refresh();
    }
  }, [pendingDelete, removeSocial, addToast, t, repointAfterRemoval, refresh]);

  const openComposer = useCallback(() => {
    // One editor at a time: an open inline edit would otherwise compete with the composer
    // for the same narrow column.
    setEditing(null);
    setIsComposerOpen(true);
  }, []);

  const startEdit = useCallback((social: CustomerSocial) => {
    setIsComposerOpen(false);
    setEditing(social);
  }, []);

  return (
    <div className="space-y-3">
      <ContactChannelList
        customer={customer}
        socials={socials}
        isLoading={isLoading || isFetching}
        isPartial={isPartial}
        primaryKey={primaryKey}
        onSetPrimary={handleSetPrimary}
        preferredFamily={preferredFamily}
        isSettingPrimary={isSavingPrimary}
        renderSocialActions={social => (
          <div className="flex space-x-1">
            {/* Editing a PHONE/EMAIL row opens the editor on the raw record, which would put
                the real number in an input and walk straight past the mask. Unlink stays —
                removing a channel reveals nothing about it. */}
            {(canViewPii || !isPiiChannel(social.socialType)) && (
              <Button size="xs" variant="ghost" onClick={() => startEdit(social)} title={t("common.edit")}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setPendingDelete(social)}
              title={t("customer.social.unlink")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      />

      {editing && (
        <SocialAccountEditor
          initial={toDraft(editing)}
          isSubmitting={isMutating}
          lockProvider
          submitLabel={t("common.save")}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {isComposerOpen && (
        <SocialAccountEditor
          isSubmitting={isMutating}
          submitLabel={t("customer.social.link")}
          onSubmit={handleCreate}
          onCancel={() => setIsComposerOpen(false)}
        />
      )}

      {!isComposerOpen && !editing && customerId && (
        <Button size="xs" className="w-full" onClick={openComposer}>
          <Plus className="mr-1 h-4 w-4" />
          {t("customer.social.add")}
        </Button>
      )}

      <ConfirmationModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("customer.social.unlink_title")}
        description={t("customer.social.unlink_description")}
        confirmButtonText={t("customer.social.unlink")}
        confirmButtonVariant="error"
      />
    </div>
  );
};

export default SocialAccountManager;
