// src/cms/components/customer/social/ContactChannelList.tsx
import { CircleCheckBig, Mail, MessageCircle, Phone, TriangleAlert } from "lucide-react";
import Loading from "@/core/components/common/Loading";
import Badge from "@/core/components/ui/badge/Badge";
import { useTranslation } from "@/core/hooks/useTranslation";
import { SocialAvatar } from "@/cms/components/customer/social/SocialAvatar";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import {
  PROFILE_EMAIL_KEY,
  PROFILE_PHONE_KEY,
  providerMeta,
  resolvePrimaryChannelKey,
} from "@/cms/utils/customerSocial.policy";
import type { Customer } from "@/cms/store/api/custommerApi";
import type { CustomerSocial } from "@/cms/types/customerSocial";

interface ContactChannelListProps {
  customer: Customer | undefined;
  socials: readonly CustomerSocial[];
  isLoading?: boolean;
  /** The social index stopped short, so this list may be missing rows. */
  isPartial?: boolean;
  /** Hide the section heading when the caller already provides one. */
  hideHeading?: boolean;
  /**
   * The customer form config can switch the profile's own phone and email off
   * (`CustomerFormConfigType`). Social channels are not covered by that config, so they
   * are unaffected — these two only gate the rows that come off the `Customer` record.
   */
  showPhone?: boolean;
  showEmail?: boolean;
  /**
   * Per-row controls for the surfaces that can edit (the case panel, the customer form).
   * Read-only surfaces — the preview pane, the customer card — simply omit it, which is
   * what lets one row implementation serve both instead of two that drift.
   */
  renderSocialActions?: (social: CustomerSocial) => React.ReactNode;
}

/**
 * Every way this customer can be reached, in one place: the CPM's own phone and email
 * alongside each linked social identity (including extra phone numbers and email
 * addresses, which are stored as ordinary `CustomerSocial` rows with
 * `socialType: "PHONE"`/`"EMAIL"`).
 *
 * Shared by the case side panel, the customer preview pane and the customer card so those
 * three stop drifting — before this they each hand-rolled their own contact block, and the
 * case panel's was hardcoded placeholder text with LINE and Facebook permanently "-".
 *
 * The "Primary" badge and the checkmark are both back by request, to match the design
 * documentation already released, but they carry different amounts of real data:
 *
 *   - Primary is derived from `Customer.contractPreference` via `resolvePrimaryChannelKey`
 *     — real data, but a stated interim approximation until the backend supports choosing
 *     a specific row as primary.
 *   - The checkmark has no backing column at all (`CustomerSocial` still has no `verified`
 *     field). Since this list only ever renders channels that exist, it renders on every
 *     row — decorative, not a read of anything real. Worth revisiting if `verified` ever
 *     ships.
 */
/**
 * Which customer PII rule a social row's identifier follows.
 *
 * PHONE and EMAIL rows are extra contact points on the profile — the same kind of data as
 * `mobileNo`/`email`, so they reuse those rules rather than getting their own. Every other
 * provider maps to nothing and passes through unmasked: a LINE display name is a platform
 * handle, not a contact detail, and hiding it would leave the agent unable to tell the rows
 * apart.
 */
const SOCIAL_PII_PATH: Readonly<Record<string, string>> = {
  PHONE: "mobileNo",
  EMAIL: "email",
};

export const ContactChannelList = ({
  customer,
  socials,
  isLoading = false,
  isPartial = false,
  hideHeading = false,
  showPhone = true,
  showEmail = true,
  renderSocialActions,
}: ContactChannelListProps) => {
  const { t } = useTranslation();
  const { maskValue } = usePiiMasker();

  // Masked after the emptiness filter below, never before it: masking leaves absent values
  // alone, so a customer with no landline still drops out of the list rather than showing a
  // redaction marker for a number they do not have.
  const directChannels = [
    {
      key: PROFILE_PHONE_KEY,
      label: t("common.phone_number"),
      value: showPhone ? maskValue("mobileNo", customer?.mobileNo) : undefined,
      icon: <Phone className="w-5 h-5" />,
      tone: "text-blue-800 bg-blue-200 dark:bg-blue-300",
    },
    {
      key: "landline",
      label: t("common.phone_number"),
      value: showPhone ? maskValue("landline", customer?.landline) : undefined,
      icon: <Phone className="w-5 h-5" />,
      tone: "text-blue-800 bg-blue-200 dark:bg-blue-300",
    },
    {
      key: PROFILE_EMAIL_KEY,
      label: t("common.email"),
      value: showEmail ? maskValue("email", customer?.email) : undefined,
      icon: <Mail className="w-5 h-5" />,
      tone: "text-red-800 bg-red-200 dark:bg-red-300",
    },
  ].filter(channel => Boolean(channel.value));

  const hasAnything = directChannels.length > 0 || socials.length > 0;
  const primaryKey = resolvePrimaryChannelKey(customer, socials);

  return (
    <div className="space-y-3 text-gray-900 dark:text-white">
      {!hideHeading && (
        <div className="flex space-x-3 text-sm mb-2">
          <MessageCircle className="dark:text-blue-500 text-blue-600" size={20} />
          <h3>{t("customer.social.channels")}</h3>
        </div>
      )}

      {isLoading && <Loading />}

      {!isLoading && !hasAnything && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("customer.social.empty")}</p>
      )}

      <div className="space-y-3">
        {directChannels.map(channel => (
          <div
            key={channel.key}
            className="flex w-full bg-white dark:bg-gray-800 rounded-2xl p-3 space-x-3 border border-gray-300 dark:border-gray-700"
          >
            <div className="justify-items-center self-center">
              <div className={`rounded-md p-1 ${channel.tone}`}>{channel.icon}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm">{channel.label}</h3>
                {channel.key === primaryKey && (
                  <Badge variant="solid" size="sm">{t("customer.social.primary")}</Badge>
                )}
                {/* Decorative — see the component doc comment above. */}
                <CircleCheckBig className="text-green-500 w-4 h-4 shrink-0" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{channel.value}</p>
            </div>
          </div>
        ))}

        {socials.map(social => {
          const meta = providerMeta(social.socialType);
          const piiPath = SOCIAL_PII_PATH[social.socialType] ?? "";

          return (
            <div
              key={social.id}
              className="flex w-full bg-white dark:bg-gray-800 rounded-2xl p-3 space-x-3 border border-gray-300 dark:border-gray-700"
            >
              <div className="justify-items-center self-center">
                <SocialAvatar
                  socialType={social.socialType}
                  socialName={social.socialName}
                  imgUrl={social.imgUrl}
                />
              </div>
              <div className="min-w-0 grow">
                <div className="flex items-center space-x-2">
                  {/* An unknown type still renders — as its own raw label, rather than blank. */}
                  <h3 className="text-sm">{meta ? t(meta.labelKey) : social.socialType}</h3>
                  {social.id === primaryKey && (
                    <Badge variant="solid" size="sm">{t("customer.social.primary")}</Badge>
                  )}
                  {/* Decorative — see the component doc comment above. */}
                  <CircleCheckBig className="text-green-500 w-4 h-4 shrink-0" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                  {maskValue(piiPath, social.socialName) || "-"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 break-all">
                  {maskValue(piiPath, social.socialId)}
                </p>
              </div>
              {renderSocialActions && (
                <div className="shrink-0 self-start">{renderSocialActions(social)}</div>
              )}
            </div>
          );
        })}
      </div>

      {isPartial && (
        <div className="flex items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t("customer.social.partial_index")}</span>
        </div>
      )}
    </div>
  );
};

export default ContactChannelList;
