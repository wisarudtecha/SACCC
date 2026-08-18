// src/cms/components/customer/social/LinkSocialAccount.tsx
import { useCallback, useState } from "react";
import { TriangleAlert } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { providerMeta } from "@/cms/utils/customerSocial.policy";
import { CustomerSearchPicker } from "@/cms/components/customer/CustomerSearchPicker";
import { SocialAccountEditor } from "@/cms/components/customer/social/SocialAccountEditor";
import { useLazyGetCustomerQuery } from "@/cms/store/api/custommerApi";
import type { CustomerProduct } from "@/cms/store/api/custommerApi";
import type { DraftCustomerSocial } from "@/cms/types/customerSocial";

interface LinkSocialAccountProps {
  /** Prefill when the identity is already known (e.g. from an inbound conversation). */
  initialIdentity?: DraftCustomerSocial;
  onLinked?: (customerId: string) => void;
  onClose?: () => void;
}

/**
 * Attach a social identity to an existing customer profile — identity first, owner unknown.
 *
 * The mirror image of `SocialAccountManager`, which starts from a chosen customer and adds
 * a channel to them. This one starts from an account that has just messaged in and asks
 * who it belongs to, which is the direction an inbound LINE or Facebook conversation
 * actually arrives in.
 *
 * Note this is NOT `LinkingExistingCustomer`, despite the similar name and shared search:
 * that attaches a customer to a *case*. Conflating the two would make "unlink" ambiguous.
 */
export const LinkSocialAccount = ({
  initialIdentity,
  onLinked,
  onClose,
}: LinkSocialAccountProps) => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();

  const { lookupIdentity, addSocial, refresh, isMutating } = useCustomerSocials();
  const [fetchCustomer] = useLazyGetCustomerQuery();

  const [identity, setIdentity] = useState<DraftCustomerSocial | undefined>(initialIdentity);
  const [isLinking, setIsLinking] = useState(false);

  const lookup = identity
    ? lookupIdentity(identity.socialType, identity.socialId)
    : undefined;

  const channelLabel = identity
    ? providerMeta(identity.socialType)?.labelKey
    : undefined;

  const describeOwner = useCallback(
    async (ownerId: string): Promise<string> => {
      try {
        const response = await fetchCustomer(ownerId).unwrap();
        const owner = response?.data;
        return owner?.displayName
          || [owner?.firstName, owner?.lastName].filter(Boolean).join(" ")
          || ownerId;
      }
      catch {
        return ownerId;
      }
    },
    [fetchCustomer]
  );

  const handleSelectCustomer = useCallback(
    async (customer: CustomerProduct) => {
      // Guarded rather than merely disabled: the picker's rows are clickable and a double
      // tap would otherwise fire two creates. Same lesson as `LinkingExistingCustomer` —
      // await the mutation here, never inside a state updater.
      if (!identity || isLinking) {
        return;
      }

      setIsLinking(true);
      try {
        const result = await addSocial(identity, customer.id);
        if (!result.ok) {
          addToast("error", result.message || t("customer.social.save_failed"));
          return;
        }

        addToast("success", result.message || t("customer.social.linked"));
        refresh();
        onLinked?.(customer.id);
        onClose?.();
      }
      finally {
        setIsLinking(false);
      }
    },
    [identity, isLinking, addSocial, addToast, t, refresh, onLinked, onClose]
  );

  const handleShowConflictOwner = useCallback(async () => {
    if (lookup?.state !== "taken") {
      return;
    }
    const owner = await describeOwner(String(lookup.social.custId));
    addToast("info", t("customer.social.conflict_owner", { owner }));
  }, [lookup, describeOwner, addToast, t]);

  if (!identity) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t("customer.social.identity_required")}
        </p>
        <SocialAccountEditor
          submitLabel={t("common.next")}
          onSubmit={setIdentity}
          onCancel={() => onClose?.()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <div className="min-w-0">
          <h3 className="text-sm">
            {channelLabel ? t(channelLabel) : identity.socialType}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{identity.socialName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 break-all">{identity.socialId}</p>
        </div>
        <Button size="xs" variant="ghost" onClick={() => setIdentity(undefined)}>
          {t("common.edit")}
        </Button>
      </div>

      {/*
        A conflict is shown but does not hard-block: the backend's uniqueness constraint is
        the authority, and this index can be incomplete. What it must never do is stay
        silent — an agent who can't see that the account belongs to someone else will link
        it to a duplicate profile instead.
      */}
      {lookup?.state === "taken" && (
        <div className="flex items-start space-x-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p>{t("customer.social.already_linked_other", {
              channel: channelLabel ? t(channelLabel) : identity.socialType,
            })}</p>
            <Button size="xs" variant="ghost" onClick={handleShowConflictOwner}>
              {t("common.view")}
            </Button>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("customer.social.search_owner")}
        </p>
        <CustomerSearchPicker onSelect={handleSelectCustomer} />
      </div>

      {(isLinking || isMutating) && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      )}
    </div>
  );
};

export default LinkSocialAccount;
