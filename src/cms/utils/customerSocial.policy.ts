// src/cms/utils/customerSocial.policy.ts
/**
 * The decisions about customer social accounts that don't belong to any one component:
 * which channels exist, what identifies one, and whether a write actually succeeded.
 *
 * Grouped here deliberately. Each is a point where the backend contract is thin or still
 * unconfirmed, so keeping them in one small module means "the backend answered" is a
 * local edit rather than a hunt through the component tree.
 */
import { readEntityVerdict } from "@/core/utils/apiResponseStatus";
import type { EntityVerdict, EnvelopeLike } from "@/core/utils/apiResponseStatus";
import type { Customer } from "@/cms/store/api/custommerApi";
import type { CustomerSocial, SocialProvider } from "@/cms/types/customerSocial";

/**
 * What the UI needs to know about one channel.
 *
 * Adding a provider — WhatsApp, WeChat, Instagram — should be one entry here plus three
 * i18n keys, and nothing else. Both the customer's social form and the case contact-method
 * list derive from this array, which is what keeps them from drifting.
 *
 * Labels are NOT stored here: they go through `t()` at render time so the three i18n
 * catalogues stay authoritative. Icons are likewise a render-time concern — this module is
 * plain data and stays free of JSX.
 */
export interface SocialProviderMeta {
  /** The value written to `CustomerSocial.socialType`. */
  id: SocialProvider;
  /** i18n key for the channel's name, e.g. "LINE". */
  labelKey: string;
  /** i18n key for what its identifier is called, e.g. "LINE User ID" vs "Facebook PSID". */
  idLabelKey: string;
  /** i18n key for the identifier field's placeholder/help text. */
  idHintKey: string;
  /**
   * Whether this channel offers the optional email field.
   *
   * `CustomerSocialInput` has no email column, so the value is written to the customer's
   * own `email` when that is blank. Text Chat only: a webchat visitor id is anonymous and
   * ephemeral, so an email is the one signal that actually correlates to a person.
   */
  captureEmail: boolean;
  /**
   * Whether an added account of this channel has its own photo.
   *
   * False for PHONE/EMAIL — an extra phone number has no avatar of its own, so the editor
   * hides that field entirely rather than showing it disabled or asking for a URL nobody
   * has.
   */
  hasPhoto: boolean;
  /**
   * Whether a display name is mandatory when adding an account on this channel.
   *
   * False for PHONE/EMAIL: forcing a label like "Work" on every extra phone number is
   * friction the other three channels don't have (their `socialName` is the platform's own
   * display name, not a user-chosen label).
   */
  requiresName: boolean;
  /** The `<Input type=...>` the editor's identifier field should use. */
  inputType: "text" | "tel" | "email";
  /**
   * The case `source` code to file a case under when it arrives on this channel.
   *
   * PENDING BACKEND. `source` is persisted on every case and feeds reporting, so the id
   * space is backend-owned — see the hardcoded list in `case/constants/caseConstants.tsx`,
   * whose missing `03` implies it mirrors a table we don't control. Until the real codes
   * are assigned these stay `undefined`, and `socialCaseSources()` returns nothing, so the
   * contact-method dropdown is unchanged. Filling in three values turns the channels on.
   *
   * PHONE/EMAIL never get one — they are extra contact points on a profile, not a way a
   * case can arrive.
   */
  caseSourceId?: string;
  /**
   * The label this channel shows in the case contact-method list.
   *
   * A plain string, not an i18n key, on purpose: every other entry in that list
   * (`CALL`, `METTLINK`, `IOT-Alert`, ...) is a raw untranslated name, and the value ends
   * up stored on the case and re-displayed from there by `CaseDisplay`. Introducing a key
   * only for these three would surface the raw key path on those screens.
   *
   * Optional because PHONE/EMAIL are never case sources (see `caseSourceId`).
   */
  caseSourceLabel?: string;
}

export const SOCIAL_PROVIDERS: readonly SocialProviderMeta[] = Object.freeze([
  {
    id: "LINE",
    labelKey: "customer.social.provider.line",
    idLabelKey: "customer.social.idLabel.line",
    idHintKey: "customer.social.idHint.line",
    captureEmail: false,
    hasPhoto: true,
    requiresName: true,
    inputType: "text",
    caseSourceLabel: "LINE",
  },
  {
    id: "FACEBOOK",
    labelKey: "customer.social.provider.facebook",
    idLabelKey: "customer.social.idLabel.facebook",
    idHintKey: "customer.social.idHint.facebook",
    captureEmail: false,
    hasPhoto: true,
    requiresName: true,
    inputType: "text",
    caseSourceLabel: "Facebook",
  },
  {
    id: "TEXTCHAT",
    labelKey: "customer.social.provider.textchat",
    idLabelKey: "customer.social.idLabel.textchat",
    idHintKey: "customer.social.idHint.textchat",
    captureEmail: true,
    hasPhoto: true,
    requiresName: true,
    inputType: "text",
    caseSourceLabel: "Text Chat",
  },
  /**
   * Not a messaging platform — an additional way to reach the customer beyond the profile's
   * own `mobileNo`/`email`. Stored the same way (a `CustomerSocial` row with
   * `socialType: "PHONE"`), which is what lets a customer have more than one number without
   * a schema change. No photo, no mandatory display name, and never a case source: these
   * two are contact points on a profile, not something a case can arrive on.
   */
  {
    id: "PHONE",
    labelKey: "customer.social.provider.phone",
    idLabelKey: "customer.social.idLabel.phone",
    idHintKey: "customer.social.idHint.phone",
    captureEmail: false,
    hasPhoto: false,
    requiresName: false,
    inputType: "tel",
  },
  {
    id: "EMAIL",
    labelKey: "customer.social.provider.email",
    idLabelKey: "customer.social.idLabel.email",
    idHintKey: "customer.social.idHint.email",
    captureEmail: false,
    hasPhoto: false,
    requiresName: false,
    inputType: "email",
  },
]);

const PROVIDER_BY_ID: Readonly<Record<string, SocialProviderMeta>> = Object.freeze(
  Object.fromEntries(SOCIAL_PROVIDERS.map(provider => [provider.id, provider]))
);

export const isSocialProvider = (value: unknown): value is SocialProvider =>
  typeof value === "string" && value in PROVIDER_BY_ID;

/**
 * Metadata for a stored `socialType`, or `undefined` when it is one this build doesn't
 * know about. Unknown types are possible — a channel can be added backend-first, or by
 * another client — and must still render rather than crash, so callers fall back to
 * showing the raw type as its own label.
 */
export const providerMeta = (socialType: string): SocialProviderMeta | undefined =>
  PROVIDER_BY_ID[socialType];

/** The providers wired into the case contact-method list. Empty until ids are assigned. */
export const socialCaseSources = (): SocialProviderMeta[] =>
  SOCIAL_PROVIDERS.filter(provider => Boolean(provider.caseSourceId));

/** The provider a case `source` code belongs to, if it is a social channel at all. */
export const providerForCaseSource = (sourceId: string | undefined): SocialProviderMeta | undefined =>
  sourceId
    ? SOCIAL_PROVIDERS.find(provider => provider.caseSourceId === sourceId)
    : undefined;

/**
 * The key an identity is indexed and de-duplicated by.
 *
 * Type is upper-cased because it is a closed enum and case is not meaningful; the id is
 * only trimmed, never case-folded — LINE user ids and Facebook PSIDs are case-sensitive,
 * and lower-casing them would merge two genuinely different people.
 */
export const identityKey = (socialType: string, socialId: string): string =>
  `${socialType.trim().toUpperCase()}:${socialId.trim()}`;

export const socialIdentityKey = (social: Pick<CustomerSocial, "socialType" | "socialId">): string =>
  identityKey(social.socialType, social.socialId);

/**
 * Row keys `ContactChannelList` uses for the two fields that come straight off the
 * `Customer` record rather than the `CustomerSocial` collection. Shared here so the
 * resolver below and the component agree on them without one importing the other's JSX.
 */
export const PROFILE_PHONE_KEY = "phone";
export const PROFILE_EMAIL_KEY = "email";

/**
 * Picks the newest of a set of social rows — "newest" meaning `createdAt` descending, with
 * `id` descending as a tiebreak. The contract's samples show `createdAt` and `updatedAt`
 * identical on insert, so two rows written in the same request need a deterministic
 * tiebreak or "newest" would depend on array order rather than anything real.
 */
const newestOf = (candidates: readonly CustomerSocial[]): CustomerSocial | undefined =>
  [...candidates].sort((a, b) => {
    const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (byDate !== 0) {
      return byDate;
    }
    return b.id.localeCompare(a.id);
  })[0];

/**
 * Which single row should carry the "Primary" badge, derived from
 * `Customer.contractPreference` (`CALL | SMS | Email | LINE`, from `GetCustomerById`).
 *
 * This is a stated interim rule, not a real preference model: the backend has no per-row
 * `isPrimary` and no way to say "this channel's phone number, specifically" — so CALL/SMS
 * are approximated against phone-shaped rows and LINE against the newest LINE row. When the
 * backend gains a real primary-selection mechanism, this function is the only place that
 * needs to change.
 *
 * Always returns a key, never `undefined` — confirmed behaviour: an unset or unrecognised
 * preference, or a preference whose channel has no matching row (e.g. `LINE` with nothing
 * linked), falls back to the profile phone, so exactly one row is always marked Primary.
 */
export const resolvePrimaryChannelKey = (
  customer: Pick<Customer, "contractPreference"> | undefined,
  socials: readonly CustomerSocial[]
): string => {
  // "Email" is the one mixed-case value among CONTRACT_PREFERENCE_OPTIONS
  // (customer/constant.ts) — normalise before comparing or it silently never matches.
  const preference = customer?.contractPreference?.trim().toUpperCase();

  if (preference === "EMAIL") {
    return PROFILE_EMAIL_KEY;
  }

  if (preference === "SMS") {
    const newestPhone = newestOf(socials.filter(social => social.socialType === "PHONE"));
    return newestPhone?.id ?? PROFILE_PHONE_KEY;
  }

  if (preference === "LINE") {
    const newestLine = newestOf(socials.filter(social => social.socialType === "LINE"));
    return newestLine?.id ?? PROFILE_PHONE_KEY;
  }

  // CALL, unset, or anything unrecognised.
  return PROFILE_PHONE_KEY;
};

/**
 * Structural check on an unknown payload.
 *
 * Used as the evidence half of `readSocialVerdict`: `normalizeToApiResponse`
 * (`src/core/utils/gqlUtils.ts`) coerces a null/absent payload to `[]`, so a value that
 * satisfies this guard can only have come from the server actually returning a record.
 */
export const isCustomerSocial = (value: unknown): value is CustomerSocial => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && typeof candidate.custId === "string"
    && typeof candidate.socialType === "string"
    && typeof candidate.socialId === "string";
};

/**
 * Did this write actually succeed?
 *
 * Not rhetorical. The hybrid base query only turns transport and GraphQL-schema failures
 * into RTK errors, so a *business* failure — HTTP 200 with `{ status: false, data: null }`
 * — arrives FULFILLED and `.unwrap()` resolves. That matters more here than almost
 * anywhere else in the app: the uniqueness constraint that stops two customer profiles
 * claiming the same LINE account is enforced backend-side, and its rejection arrives
 * through exactly this path. A caller that reads a resolved promise as success will tell
 * the agent the account was linked when it was not.
 *
 * OPEN QUESTION (backend): the contract documents no conflict response, so the specific
 * shape of a duplicate-identity rejection is unknown. Until it is, callers surface the
 * server's own `msg`/`desc` verbatim rather than mapping it to a translated string.
 */
export const readSocialVerdict = (
  response: EnvelopeLike | null | undefined
): EntityVerdict<CustomerSocial> => readEntityVerdict(response, isCustomerSocial);
