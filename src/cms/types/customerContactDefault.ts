// src/cms/types/customerContactDefault.ts
/**
 * The customer's *primary* way of being contacted — which channel, and which specific
 * ID/phone number on that channel. Contract: `src/cms/mocks/customerContactCURL.sh`
 * (`GetCustomerContactDefault` / `UpdateCustomerContactDefault`).
 *
 * This is one record per customer, stored apart from both `Customer` and `CustomerSocial`.
 * `Customer.contractPreference` says only *what kind* of channel is preferred
 * (`CALL | SMS | Email | LINE`); it cannot say *which* LINE account or *which* phone number,
 * which is the entire reason this record exists.
 *
 * Two things about it are the client's job, not the backend's:
 *
 *   - **`type` and `referId` are free text on the wire.** Nothing server-side validates them
 *     against a channel list or against the customer's actual rows. This module defines the
 *     vocabulary that keeps them meaningful, and `customerSocial.policy.ts` does the matching.
 *   - **`STD_*` means the profile, a bare provider means a linked account.** The backend does
 *     not resolve `referId` to anything; the client has to decide whether it is looking at a
 *     field on the `Customer` record or at a `CustomerSocial` row.
 */
import type { SocialProvider } from "@/cms/types/customerSocial";

/**
 * The channel a primary contact points at.
 *
 * `STD_PHONE` / `STD_EMAIL` are the customer's own profile fields (`mobileNo`, `landline`,
 * `email`). Every other value is a `CustomerSocial.socialType`, and `referId` is then that
 * row's `socialId`.
 *
 * NOTE there is no `STD_LANDLINE`, deliberately: landline and mobile are not differentiated,
 * so both write `STD_PHONE` and `referId` — the number itself — is what tells them apart.
 */
export type PrimaryContactType = SocialProvider | "STD_PHONE" | "STD_EMAIL";

export const STD_PHONE_TYPE = "STD_PHONE";
export const STD_EMAIL_TYPE = "STD_EMAIL";

export interface CustomerContactDefault {
  id: string;
  orgId?: string;
  /**
   * The owning customer's primary key.
   *
   * Sent quoted on read (`GetIdInput`) and unquoted on write (`custId: 11111111`) in the
   * contract samples, so the API layer coerces per direction rather than pinning one type
   * here — see `toCustId` in `customerContactDefault.ts`.
   */
  custId: number | string;
  /** A `PrimaryContactType` in practice; widened for the same reason `socialType` is. */
  type: string;
  /**
   * The identifying *value*, never a row primary key: a phone number, an email address, or a
   * `CustomerSocial.socialId`.
   *
   * Using the value rather than the row id is what lets the create-customer flow set a primary
   * before any social row exists — a draft channel has a `socialId` from the moment it is
   * typed. `(type, referId)` is already this app's identity key (`identityKey()`).
   */
  referId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Everything `UpdateCustomerContactDefault` accepts. There is no `id` — see the mapper. */
export interface SetPrimaryContactInput {
  customerId: string;
  type: PrimaryContactType;
  /**
   * Optional, and the absence is meaningful: "this channel, whichever entry is newest".
   * The resolver treats a missing `referId` the same way it treats one that no longer
   * matches anything.
   */
  referId?: string;
}

/**
 * Structural check on an unknown payload.
 *
 * Needed because a customer with no primary set answers `data: null`, which
 * `normalizeToApiResponse` (`src/core/utils/gqlUtils.ts`) coerces to `[]` — a truthy value.
 * "No record" and "a record" are therefore only distinguishable by shape.
 */
export const isCustomerContactDefault = (value: unknown): value is CustomerContactDefault => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.type === "string" && typeof candidate.referId === "string";
};
