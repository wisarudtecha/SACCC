// src/cms/types/customerSocial.ts
/**
 * A customer's social identities — the LINE / Facebook / Text Chat accounts that
 * resolve to one centralised customer profile. Contract: `src/cms/mocks/customerSocialCURL.sh`.
 *
 * This is a child collection, not columns on `Customer`, which is what lets one person
 * hold several accounts on the same platform and lets a new channel be added as data
 * rather than a schema change.
 *
 * Three absences in the backing table shape the code that reads this type, so they are
 * recorded here rather than rediscovered:
 *
 *   - No `verified` and no `isPrimary`. The channel list therefore shows neither. The
 *     placeholder UI it replaces (`CasePanel.tsx`) rendered both as literals.
 *   - No `active` / `deletedAt`. Unlinking is a hard delete.
 *   - No `email`. The optional Text Chat email is written to `Customer.email` instead,
 *     and only when that field is blank — see `SocialAccountManager`.
 */

/**
 * The channels this app knows how to render.
 *
 * These strings ARE the stored `socialType` values, per the GET responses in the
 * contract. `CustomerSocial.socialType` is deliberately widened to `string` so a value
 * written by another client (or a channel added backend-first) can still be read and
 * displayed; `isSocialProvider` narrows it at the point of use.
 */
export type SocialProvider = "LINE" | "FACEBOOK" | "TEXTCHAT" | "PHONE" | "EMAIL";

export interface CustomerSocial {
  id: string;
  orgId?: string;
  /**
   * The owning customer's primary key, as a string.
   *
   * NOTE the divergence from `CustomerNote.custId`, which the same BFF sends as a
   * number. Do not copy `toCustId` from `customerNote.ts` — the samples here are
   * quoted (`"custId": "1"`) on both read and write, and coercing would send an `Int`
   * where the schema wants a `String`.
   */
  custId: string;
  /** A `SocialProvider` in practice; see the note on that type for why it is not typed as one. */
  socialType: string;
  /**
   * The platform's own identifier for this person — an opaque LINE `userId` or a
   * Facebook PSID, NOT the user-facing `@handle`, which is mutable and not an identity.
   */
  socialId: string;
  /** Display name on that platform. Mutable metadata, never an identity key. */
  socialName: string;
  /** Avatar URL on the provider's CDN. May rotate or expire; always render with a fallback. */
  imgUrl?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Everything the list operation accepts.
 *
 * There is no `custId` filter and no search — confirmed, not an oversight in this type.
 * `useCustomerSocials` is what turns this into a per-customer read, and it is the only
 * place that should need changing if the BFF gains filters later.
 */
export interface CustomerSocialListParams {
  start?: number;
  length?: number;
}

export interface CreateCustomerSocialInput {
  customerId: string;
  socialType: SocialProvider;
  socialId: string;
  socialName: string;
  imgUrl?: string;
}

export interface UpdateCustomerSocialInput extends CreateCustomerSocialInput {
  id: string;
}

export interface DeleteCustomerSocialInput {
  id: string;
}

/**
 * A social identity as the UI deals with it before it has been saved — no `id`, and no
 * owning customer yet. The create-customer flow collects these, then attaches them once
 * the customer exists (`CustomerSocialInput` requires a `custId`).
 */
export interface DraftCustomerSocial {
  socialType: SocialProvider;
  socialId: string;
  socialName: string;
  imgUrl?: string;
  /** Text Chat only, and not stored on this record — see the file header. */
  email?: string;
}
