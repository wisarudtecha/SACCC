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
import { isCustomerContactDefault, STD_EMAIL_TYPE, STD_PHONE_TYPE } from "@/cms/types/customerContactDefault";
import type { CustomerContactDefault, PrimaryContactType } from "@/cms/types/customerContactDefault";
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
export const PROFILE_LANDLINE_KEY = "landline";

/** The profile's own fields, as opposed to a `CustomerSocial` row. */
export type ProfileChannelKey =
  | typeof PROFILE_PHONE_KEY
  | typeof PROFILE_EMAIL_KEY
  | typeof PROFILE_LANDLINE_KEY;

/**
 * Picks the newest of a set of social rows — "newest" meaning `createdAt` descending, with
 * `id` descending as a tiebreak. The contract's samples show `createdAt` and `updatedAt`
 * identical on insert, so two rows written in the same request need a deterministic
 * tiebreak or "newest" would depend on array order rather than anything real.
 *
 * Exported because the primary-contact resolver below needs exactly this rule for the
 * "channel chosen, but no specific entry" case.
 */
export const newestOf = (candidates: readonly CustomerSocial[]): CustomerSocial | undefined =>
  [...candidates].sort((a, b) => {
    const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (byDate !== 0) {
      return byDate;
    }
    return b.id.localeCompare(a.id);
  })[0];

/** The identity a stored primary-contact record holds: a channel plus a specific entry. */
export interface PrimaryContactTarget {
  type: PrimaryContactType;
  /** Empty means "this channel, whichever entry is newest" — a state the resolver handles. */
  referId: string;
}

/**
 * What to store to make one linked account the primary.
 *
 * `socialId`, never the row's `id`: the value survives a row being re-created, and — the
 * reason it matters — a *draft* channel has one before any row exists, which is what lets the
 * create-customer form choose a primary before the customer is saved.
 */
export const primaryTargetForSocial = (
  social: Pick<CustomerSocial, "socialType" | "socialId">
): PrimaryContactTarget => ({
  type: social.socialType.trim().toUpperCase() as PrimaryContactType,
  referId: social.socialId.trim(),
});

/**
 * What to store to make one of the profile's own fields the primary.
 *
 * Landline and mobile deliberately share `STD_PHONE`: they are not differentiated as channels,
 * and `referId` — the number itself — is what tells the two rows apart on the way back.
 * Returns `undefined` when the field is empty, since a `referId` of `""` would be
 * indistinguishable from "newest entry".
 */
export const primaryTargetForProfileChannel = (
  channelKey: ProfileChannelKey,
  customer: Pick<Customer, "mobileNo" | "landline" | "email"> | undefined
): PrimaryContactTarget | undefined => {
  const value = channelKey === PROFILE_EMAIL_KEY
    ? customer?.email
    : channelKey === PROFILE_LANDLINE_KEY
      ? customer?.landline
      : customer?.mobileNo;

  const referId = value?.trim() ?? "";
  if (!referId) {
    return undefined;
  }

  return {
    type: channelKey === PROFILE_EMAIL_KEY ? STD_EMAIL_TYPE : STD_PHONE_TYPE,
    referId,
  };
};

/**
 * The row key a `type` falls back to when its channel has no entry to point at.
 */
const profileFallbackKey = (type: string): string =>
  type === STD_EMAIL_TYPE || type === "EMAIL" ? PROFILE_EMAIL_KEY : PROFILE_PHONE_KEY;

/**
 * The channel groups a `contractPreference` can name.
 *
 * `CALL` and `SMS` collapse into one: both mean "reach them on a phone number", and nothing
 * about a stored number says which of the two the customer wants. Every other preference maps
 * to exactly one provider.
 */
export type ChannelFamily = "PHONE" | "EMAIL" | "LINE" | "FACEBOOK" | "TEXTCHAT";

/** Keyed by the upper-cased `CONTRACT_PREFERENCE_OPTIONS` value (`customer/constant.ts`). */
const FAMILY_BY_PREFERENCE: Readonly<Record<string, ChannelFamily>> = Object.freeze({
  CALL: "PHONE",
  SMS: "PHONE",
  EMAIL: "EMAIL",
  LINE: "LINE",
  FACEBOOK: "FACEBOOK",
  TEXTCHAT: "TEXTCHAT",
});

/**
 * The `CustomerContactDefault.type` values each family permits. The profile's own fields
 * (`STD_*`) sit in the same family as the linked accounts of the same kind — an extra phone
 * number and the profile's own are both "a phone number".
 */
const FAMILY_TYPES: Readonly<Record<ChannelFamily, readonly string[]>> = Object.freeze({
  PHONE: [STD_PHONE_TYPE, "PHONE"],
  EMAIL: [STD_EMAIL_TYPE, "EMAIL"],
  LINE: ["LINE"],
  FACEBOOK: ["FACEBOOK"],
  TEXTCHAT: ["TEXTCHAT"],
});

/**
 * Which channel family a `contractPreference` names, or `undefined` when it names none —
 * unset, or a value this build doesn't know. An unknown preference constrains nothing, which
 * is what keeps a customer whose preference was written by another client from losing their
 * stored primary.
 */
export const preferredChannelFamily = (
  preference: string | undefined
): ChannelFamily | undefined => FAMILY_BY_PREFERENCE[preference?.trim().toUpperCase() ?? ""];

/**
 * Is this channel one the preference permits?
 *
 * `true` for an absent family, deliberately: with no preference to obey there is nothing to
 * contradict, so every row stays eligible.
 */
export const isTypeInFamily = (type: string, family: ChannelFamily | undefined): boolean =>
  family ? FAMILY_TYPES[family].includes(type.trim().toUpperCase()) : true;

/**
 * The entry a preference resolves to on its own — "the most recently added contact information
 * from that channel", which is the documented rule for a channel chosen without a specific
 * entry, and the arbitration when the stored record names a channel the preference contradicts.
 *
 * Falls through to the profile's own field when the channel has no linked rows: a customer who
 * prefers `CALL` and has no extra numbers still has a mobile (or a landline). Returns
 * `undefined` only when the preferred channel has nothing at all to point at.
 */
export const primaryTargetForPreference = (
  preference: string | undefined,
  customer: Pick<Customer, "mobileNo" | "landline" | "email"> | undefined,
  socials: readonly CustomerSocial[]
): PrimaryContactTarget | undefined => {
  const family = preferredChannelFamily(preference);
  if (!family) {
    return undefined;
  }

  const newest = newestOf(socials.filter(social => isTypeInFamily(social.socialType, family)));
  if (newest) {
    return primaryTargetForSocial(newest);
  }

  if (family === "EMAIL") {
    return primaryTargetForProfileChannel(PROFILE_EMAIL_KEY, customer);
  }

  if (family === "PHONE") {
    return primaryTargetForProfileChannel(PROFILE_PHONE_KEY, customer)
      ?? primaryTargetForProfileChannel(PROFILE_LANDLINE_KEY, customer);
  }

  // LINE / Facebook / Text Chat with nothing linked — there is no profile field to fall back on.
  return undefined;
};

/**
 * The row a `{ type, referId }` pair points at.
 *
 *   - `STD_PHONE` → the landline row when `referId` is that number, otherwise the mobile. The
 *     two are not differentiated as channels; the number itself is what tells them apart.
 *   - `STD_EMAIL` → the profile email.
 *   - a provider + `referId` → the row with exactly that `socialType`/`socialId`.
 *   - a provider whose `referId` matches nothing — it was unlinked, or another client wrote a
 *     value this customer never had → the newest row on that channel, rather than no primary
 *     at all.
 */
const keyForTarget = (
  type: string,
  referId: string,
  customer: Pick<Customer, "landline"> | undefined,
  socials: readonly CustomerSocial[]
): string => {
  if (type === STD_PHONE_TYPE) {
    const landline = customer?.landline?.trim();
    return referId && landline && referId === landline ? PROFILE_LANDLINE_KEY : PROFILE_PHONE_KEY;
  }

  if (type === STD_EMAIL_TYPE) {
    return PROFILE_EMAIL_KEY;
  }

  const onChannel = socials.filter(social => social.socialType.trim().toUpperCase() === type);

  if (referId) {
    const exact = onChannel.find(social => social.socialId.trim() === referId);
    if (exact) {
      return exact.id;
    }
  }

  return newestOf(onChannel)?.id ?? profileFallbackKey(type);
};

/**
 * Which single row carries the "Primary" badge.
 *
 * `Customer.contractPreference` outranks the stored `CustomerContactDefault`: the preference
 * says which *channel*, the stored record only which *entry* on it. So a customer who prefers
 * `LINE` while their stored record still names a phone number is primarily reachable on their
 * newest LINE account — the stored record is stale, not authoritative.
 *
 * The chain, in order:
 *
 *   1. No preference (or one this build doesn't know) → the stored record decides on its own.
 *   2. Stored record whose `type` the preference permits → it decides.
 *   3. Stored record the preference contradicts, or none at all → the newest entry on the
 *      preferred channel.
 *   4. Nothing to point at (e.g. `LINE` preferred with nothing linked) → the profile phone.
 *
 * Always returns a key, never `undefined`, so exactly one row is always marked Primary.
 *
 * `preferenceOverride` is for the customer form, where the dropdown can hold a channel the
 * saved customer record doesn't have yet — the badge should follow what the agent is looking
 * at, not what was last written.
 */
export const resolvePrimaryChannelKey = (
  customer: Pick<Customer, "contractPreference" | "mobileNo" | "landline" | "email"> | undefined,
  socials: readonly CustomerSocial[],
  contactDefault?: CustomerContactDefault,
  preferenceOverride?: string
): string => {
  const preference = preferenceOverride ?? customer?.contractPreference;
  const family = preferredChannelFamily(preference);

  // Guarded even though the parameter is typed: this value crosses an API boundary, where a
  // customer with no primary answers `data: null` and `normalizeToApiResponse` coerces that
  // to `[]` — a truthy value the declared type would happily accept.
  const stored = isCustomerContactDefault(contactDefault) ? contactDefault : undefined;
  const storedType = stored?.type?.trim().toUpperCase() ?? "";

  if (storedType && isTypeInFamily(storedType, family)) {
    return keyForTarget(storedType, stored?.referId?.trim() ?? "", customer, socials);
  }

  const target = primaryTargetForPreference(preference, customer, socials);
  return target
    ? keyForTarget(target.type, target.referId, customer, socials)
    : PROFILE_PHONE_KEY;
};

/**
 * Which customer-PII rule a social row's identifier follows, for `usePiiMasker`.
 *
 * PHONE and EMAIL rows are extra contact points on the profile — the same kind of data as
 * `mobileNo`/`email`, so they reuse those rules rather than getting their own. Every other
 * provider maps to nothing and passes through unmasked: a LINE display name is a platform
 * handle, not a contact detail, and hiding it would leave the agent unable to tell the rows
 * apart.
 */
const SOCIAL_PII_PATH: Readonly<Record<string, string>> = Object.freeze({
  PHONE: "mobileNo",
  EMAIL: "email",
});

export const socialPiiPath = (socialType: string): string =>
  SOCIAL_PII_PATH[socialType.trim().toUpperCase()] ?? "";

/** One contact value, plus the `usePiiMasker` path the caller should mask it with. */
export interface PrimaryChannelDisplay {
  /** Unmasked — masking is the caller's job, since only it knows the viewer's permissions. */
  value: string;
  /** Empty when the value is not customer PII (a platform handle, say). */
  piiPath: string;
}

/**
 * The actual phone number / address / handle behind a resolved primary row, for the surfaces
 * that show the preference as a single line rather than as a list — the preview pane, where
 * "CALL" alone doesn't tell an agent which number to dial.
 *
 * Returns `undefined` when the resolved row has no value to show (e.g. the fallback landed on
 * a profile phone the customer doesn't have), so callers can keep rendering just the label.
 */
export const resolvePrimaryChannelDisplay = (
  customer: Pick<Customer, "mobileNo" | "landline" | "email"> | undefined,
  socials: readonly CustomerSocial[],
  primaryKey: string
): PrimaryChannelDisplay | undefined => {
  if (primaryKey === PROFILE_PHONE_KEY) {
    return customer?.mobileNo ? { value: customer.mobileNo, piiPath: "mobileNo" } : undefined;
  }
  if (primaryKey === PROFILE_LANDLINE_KEY) {
    return customer?.landline ? { value: customer.landline, piiPath: "landline" } : undefined;
  }
  if (primaryKey === PROFILE_EMAIL_KEY) {
    return customer?.email ? { value: customer.email, piiPath: "email" } : undefined;
  }

  const social = socials.find(candidate => candidate.id === primaryKey);
  if (!social) {
    return undefined;
  }

  const value = social.socialName?.trim() || social.socialId?.trim() || "";
  return value ? { value, piiPath: socialPiiPath(social.socialType) } : undefined;
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
