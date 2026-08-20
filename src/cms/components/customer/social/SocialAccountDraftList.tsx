// src/cms/components/customer/social/SocialAccountDraftList.tsx
import { useCallback, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import Badge from "@/core/components/ui/badge/Badge";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { SocialAccountEditor } from "@/cms/components/customer/social/SocialAccountEditor";
import { SocialAvatar } from "@/cms/components/customer/social/SocialAvatar";
import {
  identityKey,
  isTypeInFamily,
  preferredChannelFamily,
  providerMeta,
} from "@/cms/utils/customerSocial.policy";
import type { IdentityLookup } from "@/cms/hooks/useCustomerSocials";
import type { DraftCustomerSocial } from "@/cms/types/customerSocial";

interface SocialAccountDraftListProps {
  drafts: DraftCustomerSocial[];
  onChange: (drafts: DraftCustomerSocial[]) => void;
  /** Conflict check against accounts already linked to *other* customers. */
  lookupIdentity: (socialType: string, socialId: string) => IdentityLookup;
  /**
   * The `identityKey` of the draft marked primary, or empty for none.
   *
   * Identity rather than list position because a draft can be removed from the middle, and an
   * index would then silently promote whichever draft slid into that slot.
   */
  primaryKey?: string;
  /**
   * Called with the draft to mark primary, or `undefined` to clear the mark — the latter when
   * the primary draft is removed, since a customer created with a primary pointing at a
   * channel that was never linked would be a dangling record from birth.
   */
  onSetPrimary?: (draft: DraftCustomerSocial | undefined) => void;
  /**
   * The contact channel selected in the form's preference dropdown. Only drafts on that
   * channel can be marked primary — the preference decides the channel, and the mark only
   * refines which entry on it.
   */
  preference?: string;
}

/**
 * Social identities collected before the customer they belong to exists.
 *
 * `CustomerSocialInput` requires a `custId`, so nothing can be written during the create
 * form — these are held locally and attached once the customer has an id (see
 * `CustomerCreate.handleSubmit`). That is the only reason this is separate from
 * `SocialAccountManager`, which talks to the server directly.
 *
 * Conflicts are still checked here rather than at attach time: telling an agent that a
 * LINE account belongs to someone else *before* they fill in a whole customer form is the
 * difference between a correction and a duplicate profile.
 */
export const SocialAccountDraftList = ({
  drafts,
  onChange,
  lookupIdentity,
  primaryKey = "",
  onSetPrimary,
  preference,
}: SocialAccountDraftListProps) => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();
  const preferredFamily = preferredChannelFamily(preference);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const isAcceptable = useCallback(
    (draft: DraftCustomerSocial, ignoreIndex?: number): boolean => {
      const channelMeta = providerMeta(draft.socialType);
      const channel = channelMeta ? t(channelMeta.labelKey) : draft.socialType;
      const key = identityKey(draft.socialType, draft.socialId);

      const clashesWithDraft = drafts.some(
        (existing, index) =>
          index !== ignoreIndex && identityKey(existing.socialType, existing.socialId) === key
      );
      if (clashesWithDraft) {
        addToast("error", t("customer.social.already_in_list", { channel }));
        return false;
      }

      // "unknown" proceeds: an incomplete index cannot prove the identity is free, and the
      // backend constraint is the real guard.
      if (lookupIdentity(draft.socialType, draft.socialId).state === "taken") {
        addToast("error", t("customer.social.already_linked_other", { channel }));
        return false;
      }

      return true;
    },
    [drafts, lookupIdentity, addToast, t]
  );

  const handleAdd = useCallback(
    (draft: DraftCustomerSocial) => {
      if (!isAcceptable(draft)) {
        return;
      }
      onChange([...drafts, draft]);
      setIsComposerOpen(false);
    },
    [drafts, isAcceptable, onChange]
  );

  const handleSaveEdit = useCallback(
    (draft: DraftCustomerSocial) => {
      if (editingIndex === null || !isAcceptable(draft, editingIndex)) {
        return;
      }

      // Editing the identifier changes the draft's identity key, so a primary mark held
      // against the old one has to move with it rather than silently detaching.
      const previous = drafts[editingIndex];
      const wasPrimary = identityKey(previous.socialType, previous.socialId) === primaryKey;

      onChange(drafts.map((existing, index) => (index === editingIndex ? draft : existing)));
      setEditingIndex(null);

      if (wasPrimary) {
        onSetPrimary?.(draft);
      }
    },
    [drafts, editingIndex, isAcceptable, onChange, primaryKey, onSetPrimary]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const removed = drafts[index];
      onChange(drafts.filter((_, position) => position !== index));

      if (identityKey(removed.socialType, removed.socialId) === primaryKey) {
        onSetPrimary?.(undefined);
      }
    },
    [drafts, onChange, primaryKey, onSetPrimary]
  );

  return (
    <div className="space-y-3">
      {drafts.length === 0 && !isComposerOpen && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("customer.social.empty")}</p>
      )}

      {drafts.map((draft, index) => {
        const meta = providerMeta(draft.socialType);

        return editingIndex === index ? (
          <SocialAccountEditor
            key={`editor-${identityKey(draft.socialType, draft.socialId)}`}
            initial={draft}
            lockProvider
            submitLabel={t("common.save")}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingIndex(null)}
          />
        ) : (
          <div
            key={identityKey(draft.socialType, draft.socialId)}
            className="flex w-full items-start space-x-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
          >
            <div className="self-center">
              <SocialAvatar
                socialType={draft.socialType}
                socialName={draft.socialName}
                imgUrl={draft.imgUrl}
              />
            </div>
            <div className="min-w-0 grow">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm">{meta ? t(meta.labelKey) : draft.socialType}</h3>
                {identityKey(draft.socialType, draft.socialId) === primaryKey ? (
                  <Badge variant="solid" size="sm">{t("customer.social.primary")}</Badge>
                ) : onSetPrimary && isTypeInFamily(draft.socialType, preferredFamily) && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(draft)}
                    title={t("customer.social.set_primary")}
                    aria-label={t("customer.social.set_primary")}
                    className="shrink-0 text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{draft.socialName}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 break-all">{draft.socialId}</p>
            </div>
            <div className="flex shrink-0 space-x-1">
              <Button
                size="xs"
                variant="ghost"
                title={t("common.edit")}
                onClick={() => {
                  setIsComposerOpen(false);
                  setEditingIndex(index);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                title={t("common.delete")}
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {isComposerOpen ? (
        <SocialAccountEditor
          submitLabel={t("common.add")}
          onSubmit={handleAdd}
          onCancel={() => setIsComposerOpen(false)}
        />
      ) : (
        editingIndex === null && (
          <Button
            size="xs"
            className="w-full"
            onClick={() => {
              setEditingIndex(null);
              setIsComposerOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("customer.social.add")}
          </Button>
        )
      )}
    </div>
  );
};

export default SocialAccountDraftList;
