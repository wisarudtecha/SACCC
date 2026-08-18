// src/cms/components/customer/social/SocialAccountEditor.tsx
import { useMemo, useState } from "react";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import { useTranslation } from "@/core/hooks/useTranslation";
import { SocialAvatar } from "@/cms/components/customer/social/SocialAvatar";
import { SOCIAL_PROVIDERS, providerMeta } from "@/cms/utils/customerSocial.policy";
import type { DraftCustomerSocial, SocialProvider } from "@/cms/types/customerSocial";

interface SocialAccountEditorProps {
  /** Absent when adding; the existing values when editing. */
  initial?: DraftCustomerSocial;
  isSubmitting?: boolean;
  /** Locks the channel picker — the identity's provider is not an editable property. */
  lockProvider?: boolean;
  submitLabel: string;
  onSubmit: (draft: DraftCustomerSocial) => void;
  onCancel: () => void;
}

const EMPTY_DRAFT: DraftCustomerSocial = {
  socialType: "LINE",
  socialId: "",
  socialName: "",
  imgUrl: "",
  email: "",
};

/**
 * The add/edit form for a single social identity.
 *
 * Presentational: it validates only that the fields it owns are filled, and reports the
 * draft upwards. Whether the identity is already taken, and whether the write succeeded,
 * are both decided above it — see `SocialAccountManager`.
 *
 * The channel picker is locked when editing. Changing the provider of a saved row would
 * silently reinterpret its `socialId` as an identifier on a different platform, which is a
 * different person, not an edit — delete and re-add is the honest path.
 */
export const SocialAccountEditor = ({
  initial,
  isSubmitting = false,
  lockProvider = false,
  submitLabel,
  onSubmit,
  onCancel,
}: SocialAccountEditorProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftCustomerSocial>(initial ?? EMPTY_DRAFT);

  const meta = providerMeta(draft.socialType);

  const providerOptions = useMemo(
    () => SOCIAL_PROVIDERS.map(provider => ({
      value: provider.id,
      label: t(provider.labelKey),
    })),
    [t]
  );

  const nameRequired = meta?.requiresName !== false;
  const canSubmit = draft.socialId.trim() !== ""
    && (!nameRequired || draft.socialName.trim() !== "")
    && !isSubmitting;

  const patch = (updates: Partial<DraftCustomerSocial>) =>
    setDraft(previous => ({ ...previous, ...updates }));

  return (
    <div className="space-y-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <div>
        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
          {t("customer.social.channel")}
        </label>
        <Select
          options={providerOptions}
          value={draft.socialType}
          disabled={lockProvider}
          placeholder={t("customer.social.channel")}
          onChange={value => patch({ socialType: value as SocialProvider })}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
          {meta ? t(meta.idLabelKey) : t("customer.social.account_id")}
          <span className="ml-1 text-red-500">*</span>
        </label>
        <Input
          type={meta?.inputType ?? "text"}
          value={draft.socialId}
          placeholder={meta ? t(meta.idHintKey) : ""}
          onChange={event => patch({ socialId: event.target.value })}
        />
      </div>

      {/*
        Name is optional for channels like Phone/Email (`requiresName: false`) — an extra
        phone number is not a display name the way a LINE or Facebook account is, so forcing
        one here would be friction with nothing real behind it.
      */}
      <div>
        <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
          {t("customer.social.account_name")}
          {nameRequired && <span className="ml-1 text-red-500">*</span>}
        </label>
        <Input
          type="text"
          value={draft.socialName}
          onChange={event => patch({ socialName: event.target.value })}
        />
      </div>

      {/* No photo for channels like Phone/Email (`hasPhoto: false`) — there is no avatar for a phone number. */}
      {meta?.hasPhoto !== false && (
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
            {t("customer.social.photo_url")}
          </label>
          <div className="flex items-center space-x-2">
            <SocialAvatar
              socialType={draft.socialType}
              socialName={draft.socialName}
              imgUrl={draft.imgUrl}
            />
            <Input
              type="text"
              value={draft.imgUrl ?? ""}
              onChange={event => patch({ imgUrl: event.target.value })}
            />
          </div>
        </div>
      )}

      {/*
        Text Chat only. There is no email column on the social record, so this is written
        to the customer's own email — and only when that is empty. A webchat visitor id is
        anonymous and per-browser, which makes an email the one thing that actually ties
        the session to a person.
      */}
      {meta?.captureEmail && (
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
            {t("common.email")}
          </label>
          <Input
            type="email"
            value={draft.email ?? ""}
            onChange={event => patch({ email: event.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t("customer.social.email_hint")}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button size="xs" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button size="xs" onClick={() => onSubmit(draft)} disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default SocialAccountEditor;
