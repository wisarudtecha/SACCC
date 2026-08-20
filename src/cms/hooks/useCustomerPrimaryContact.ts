// src/cms/hooks/useCustomerPrimaryContact.ts
/**
 * The customer's primary contact channel — the only surface the UI sees.
 *
 * Two records answer one question between them, and their ranking is the thing this hook
 * exists to enforce:
 *
 *   - `Customer.contractPreference` (`CALL | SMS | Email | LINE | FACEBOOK | TEXTCHAT`) says
 *     **which channel**. It outranks everything below.
 *   - `CustomerContactDefault` (`{ type, referId }`) says **which entry** on that channel —
 *     *this* LINE account, *this* phone number. When it names a channel the preference
 *     contradicts, it is stale rather than authoritative and the newest entry on the preferred
 *     channel wins (`resolvePrimaryChannelKey`).
 *
 * So `setPrimary` never writes `contractPreference`: choosing an entry cannot re-open the
 * question of which channel. Changing the channel is the customer form's dropdown, and
 * `reconcileToPreference` is what brings the stored entry back in line afterwards.
 *
 * Reads never throw and never depend on a write having succeeded: the resolver always returns
 * a row key, so the badge is right even when the stored record points at a channel that has
 * since been unlinked.
 */
import { useCallback, useMemo } from "react";
import {
  readEnvelopeMessage,
  readEnvelopeStatus,
  readMutationError,
} from "@/core/utils/apiResponseStatus";
import {
  useGetCustomerContactDefaultQuery,
  useUpdateCustomerContactDefaultMutation,
} from "@/cms/store/api/customerContactDefault";
import {
  isTypeInFamily,
  newestOf,
  preferredChannelFamily,
  primaryTargetForPreference,
  primaryTargetForSocial,
  resolvePrimaryChannelKey,
} from "@/cms/utils/customerSocial.policy";
import { isCustomerContactDefault } from "@/cms/types/customerContactDefault";
import type { ChannelFamily, PrimaryContactTarget } from "@/cms/utils/customerSocial.policy";
import type { Customer } from "@/cms/store/api/custommerApi";
import type { CustomerSocial } from "@/cms/types/customerSocial";

export interface SetPrimaryResult {
  ok: boolean;
  /** The server's own wording when it gave any; empty otherwise. */
  message: string;
}

export interface UseCustomerPrimaryContactOptions {
  customer: Customer | undefined;
  socials: readonly CustomerSocial[];
  /**
   * The channel currently selected in the customer form's dropdown, which may not be saved
   * yet. Given, it decides the badge and which rows are eligible — the agent should be
   * looking at the consequences of the choice in front of them, not the last saved one.
   */
  preferenceOverride?: string;
  /** Set false to hold the read back (e.g. a list that would mount this many times over). */
  enabled?: boolean;
}

export interface UseCustomerPrimaryContactResult {
  /** The `ContactChannelList` row key that carries the Primary badge. Never empty. */
  primaryKey: string;
  /**
   * The channel family the preference permits, or `undefined` when it names none. Callers use
   * it to offer "set as primary" only on rows that could actually become primary.
   */
  preferredFamily: ChannelFamily | undefined;
  /** What is actually stored, or `undefined` when this customer has no primary yet. */
  storedTarget: PrimaryContactTarget | undefined;
  isLoading: boolean;
  isSaving: boolean;
  setPrimary: (target: PrimaryContactTarget) => Promise<SetPrimaryResult>;
  /**
   * Bring the stored entry back inside the preferred channel after the preference changes.
   * A no-op when the stored record already agrees, so an unchanged preference costs nothing.
   */
  reconcileToPreference: (preference: string | undefined) => Promise<void>;
  /**
   * Housekeeping after a channel is unlinked: if it was the stored primary, move the record to
   * the newest remaining entry *on the same channel*. Best-effort and silent — the badge is
   * right either way, this only stops the stored record going stale.
   */
  repointAfterRemoval: (removed: CustomerSocial) => Promise<void>;
}

export const useCustomerPrimaryContact = (
  options: UseCustomerPrimaryContactOptions
): UseCustomerPrimaryContactResult => {
  const { customer, socials, preferenceOverride, enabled = true } = options;
  const customerId = customer?.id;

  const { data: response, isLoading } = useGetCustomerContactDefaultQuery(customerId ?? "", {
    skip: !customerId || !enabled,
  });

  const [updateDefault, { isLoading: isSaving }] = useUpdateCustomerContactDefaultMutation();

  const stored = isCustomerContactDefault(response?.data) ? response?.data : undefined;
  const preference = preferenceOverride ?? customer?.contractPreference;

  const storedTarget = useMemo<PrimaryContactTarget | undefined>(
    () => (stored
      ? {
        type: stored.type.trim().toUpperCase() as PrimaryContactTarget["type"],
        referId: stored.referId.trim(),
      }
      : undefined),
    [stored]
  );

  const preferredFamily = useMemo(() => preferredChannelFamily(preference), [preference]);

  const primaryKey = useMemo(
    () => resolvePrimaryChannelKey(customer, socials, stored, preferenceOverride),
    [customer, socials, stored, preferenceOverride]
  );

  const setPrimary = useCallback(
    async (target: PrimaryContactTarget): Promise<SetPrimaryResult> => {
      if (!customerId) {
        return { ok: false, message: "" };
      }

      try {
        const result = await updateDefault({
          customerId,
          type: target.type,
          referId: target.referId,
        }).unwrap();

        // This mutation answers `{ status, msg, desc }` with no payload, so there is no entity
        // to weigh against the envelope — only a conclusive failure counts as one. The same
        // reading `readDeleteOutcome` applies to the other payload-less writes.
        return {
          ok: readEnvelopeStatus(result?.status) !== "failure",
          message: readEnvelopeMessage(result),
        };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [customerId, updateDefault]
  );

  const reconcileToPreference = useCallback(
    async (nextPreference: string | undefined): Promise<void> => {
      const family = preferredChannelFamily(nextPreference);
      if (!family) {
        // Nothing to obey — an unset preference constrains no entry, so whatever is stored
        // stays the answer.
        return;
      }

      if (storedTarget && isTypeInFamily(storedTarget.type, family)) {
        return;
      }

      const target = primaryTargetForPreference(nextPreference, customer, socials);
      if (!target) {
        // The preferred channel has nothing to point at yet. Leave the stale record rather
        // than writing a `referId` for an entry that doesn't exist; the resolver already
        // ignores it in favour of the preference.
        return;
      }

      await setPrimary(target);
    },
    [storedTarget, customer, socials, setPrimary]
  );

  const repointAfterRemoval = useCallback(
    async (removed: CustomerSocial): Promise<void> => {
      if (!storedTarget) {
        return;
      }

      const removedTarget = primaryTargetForSocial(removed);
      const wasPrimary = removedTarget.type === storedTarget.type
        && removedTarget.referId === storedTarget.referId;
      if (!wasPrimary) {
        return;
      }

      const newest = newestOf(socials.filter(
        social => social.id !== removed.id
          && social.socialType.trim().toUpperCase() === removedTarget.type
      ));

      if (!newest) {
        // Nothing left on this channel. Anything else would be a different channel, which the
        // preference — not an unlink — is what decides; leave the record and let the resolver
        // fall back.
        return;
      }

      await setPrimary(primaryTargetForSocial(newest));
    },
    [storedTarget, socials, setPrimary]
  );

  return useMemo(
    () => ({
      primaryKey,
      preferredFamily,
      storedTarget,
      isLoading,
      isSaving,
      setPrimary,
      reconcileToPreference,
      repointAfterRemoval,
    }),
    [
      primaryKey, preferredFamily, storedTarget, isLoading, isSaving,
      setPrimary, reconcileToPreference, repointAfterRemoval,
    ]
  );
};
