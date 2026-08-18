// src/cms/hooks/useCustomerSocials.ts
/**
 * The only customer-social data surface the UI sees.
 *
 * Components never touch RTK Query directly here, and that indirection is carrying more
 * weight than usual: `GetListCustomerSocial` accepts `start`/`length` and nothing else —
 * no `custId` filter, no search. So "what are this customer's channels?" and "is this
 * LINE account already taken?" are both answered by scanning the collection and indexing
 * it client-side.
 *
 * That is a real cost, and it is contained here on purpose. When the BFF gains a `custId`
 * filter (or a `/customer_with_socials/custId/:custId` lookup, mirroring
 * `/users_with_area/username/:username`), this file and `customerSocial.ts` change and no
 * component does.
 *
 * Two rules the scan must not break:
 *
 *   - **Never claim an identity is free from an incomplete index.** If the page cap is
 *     hit, `lookupIdentity` answers `"unknown"`, not `"available"`. The backend's
 *     uniqueness constraint is the real guard; this index is a fast path, not proof.
 *   - **Never persist the index.** No `idb`/localStorage. A `socialId -> custId` mapping
 *     goes stale the moment a link moves or two profiles are merged, and a stale one
 *     silently attributes a conversation to the wrong person.
 *
 * This layer knows nothing about toasts or translation. It returns a discriminated result
 * and never throws, leaving presentation to the components.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { readDeleteOutcome, readMutationError } from "@/core/utils/apiResponseStatus";
import {
  useCreateCustomerSocialMutation,
  useCustomerSocialListQuery,
  useDeleteCustomerSocialMutation,
  useUpdateCustomerSocialMutation,
} from "@/cms/store/api/customerSocial";
import { identityKey, readSocialVerdict, socialIdentityKey } from "@/cms/utils/customerSocial.policy";
import type { CustomerSocial, DraftCustomerSocial } from "@/cms/types/customerSocial";

/**
 * Identity stability matters: a fresh `[]` literal would change `socials` on every render
 * and cascade into any effect that depends on it.
 */
const EMPTY_SOCIALS: readonly CustomerSocial[] = Object.freeze([]);

/**
 * Large enough that a typical org is one or two round-trips, small enough that the BFF is
 * unlikely to reject or truncate it. If it does truncate, the short-page check below reads
 * that as "end of collection" and the index quietly under-reports — worth confirming
 * against a real environment during the smoke test.
 */
const PAGE_SIZE = 200;

/**
 * Hard stop on the sweep, so a large collection degrades into a flagged-partial index
 * rather than an unbounded request loop that hangs the case panel.
 */
const MAX_PAGES = 25;

export type IdentityLookup =
  /** This identity already belongs to a customer. */
  | { state: "taken"; social: CustomerSocial }
  /** Positively absent from a complete index. */
  | { state: "available"; social?: undefined }
  /** The index is incomplete, so absence proves nothing. */
  | { state: "unknown"; social?: undefined };

export interface SocialActionResult {
  ok: boolean;
  /** The server's own wording when it gave any; empty otherwise. */
  message: string;
}

export interface UseCustomerSocialsOptions {
  /** Undefined until a customer is chosen — the create-case path starts this way. */
  customerId?: string;
  /**
   * Set false to hold the sweep back. Use it anywhere this hook would mount many times
   * over (a customer grid, say) — there, fetch once higher up and pass rows down instead.
   */
  enabled?: boolean;
}

export interface UseCustomerSocialsResult {
  /** This customer's channels, oldest first. Empty when no `customerId` was given. */
  socials: readonly CustomerSocial[];
  /** Every row the sweep has seen, for callers that need more than one customer. */
  allSocials: readonly CustomerSocial[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isEmpty: boolean;
  isMutating: boolean;
  /** The sweep hit `MAX_PAGES`. Reads are best-effort; absence proves nothing. */
  isPartial: boolean;
  /** Any customer's channels, from the same index. */
  socialsFor: (customerId: string) => readonly CustomerSocial[];
  lookupIdentity: (socialType: string, socialId: string) => IdentityLookup;
  addSocial: (draft: DraftCustomerSocial, customerId?: string) => Promise<SocialActionResult>;
  editSocial: (id: string, draft: DraftCustomerSocial, customerId?: string) => Promise<SocialActionResult>;
  removeSocial: (id: string) => Promise<SocialActionResult>;
  /** Discards the accumulated pages and re-sweeps from the first one. */
  refresh: () => void;
}

const dedupeById = (socials: CustomerSocial[]): CustomerSocial[] => {
  const seen = new Set<string>();
  return socials.filter(social => {
    if (seen.has(social.id)) {
      return false;
    }
    seen.add(social.id);
    return true;
  });
};

export const useCustomerSocials = (
  options: UseCustomerSocialsOptions = {}
): UseCustomerSocialsResult => {
  const { customerId, enabled = true } = options;

  const [start, setStart] = useState(0);
  const [rows, setRows] = useState<readonly CustomerSocial[]>(EMPTY_SOCIALS);
  const [isPartial, setIsPartial] = useState(false);
  const [isSweeping, setIsSweeping] = useState(true);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch: refetchQuery,
  } = useCustomerSocialListQuery({ start, length: PAGE_SIZE }, { skip: !enabled });

  const [createMutation, { isLoading: isCreating }] = useCreateCustomerSocialMutation();
  const [updateMutation, { isLoading: isUpdating }] = useUpdateCustomerSocialMutation();
  const [deleteMutation, { isLoading: isDeleting }] = useDeleteCustomerSocialMutation();

  /**
   * Pages arrive one cache entry at a time (the store's custom `serializeQueryArgs` keys
   * on the full args, so nothing merges automatically) and are accumulated here. Advancing
   * `start` re-runs the query, which is what drives the sweep forward — there is no
   * imperative loop to get wrong.
   *
   * Termination is a short page, because this operation exposes no `totalRecords` (see
   * `customerSocialQueries.ts`). Dedupe guards against a row shifting between pages when
   * one is added concurrently.
   */
  useEffect(() => {
    const page = response?.data;
    if (!Array.isArray(page)) {
      return;
    }

    setRows(previous => (start === 0 ? page : dedupeById([...previous, ...page])));

    if (page.length < PAGE_SIZE) {
      setIsSweeping(false);
      return;
    }

    if (start / PAGE_SIZE + 1 >= MAX_PAGES) {
      // Bounded rather than complete: keep what we have, but stop claiming to know
      // what isn't in it.
      setIsPartial(true);
      setIsSweeping(false);
      return;
    }

    setStart(previous => previous + PAGE_SIZE);
  }, [response, start]);

  const refresh = useCallback(() => {
    setRows(EMPTY_SOCIALS);
    setIsPartial(false);
    setIsSweeping(true);

    if (start === 0) {
      // Already on the first page, so no cache key changes — ask explicitly.
      refetchQuery();
      return;
    }
    setStart(0);
  }, [start, refetchQuery]);

  const byCustomer = useMemo(() => {
    const index = new Map<string, CustomerSocial[]>();
    rows.forEach(social => {
      const key = String(social.custId ?? "").trim();
      if (!key) {
        return;
      }
      const bucket = index.get(key);
      if (bucket) {
        bucket.push(social);
        return;
      }
      index.set(key, [social]);
    });
    return index;
  }, [rows]);

  const byIdentity = useMemo(() => {
    const index = new Map<string, CustomerSocial>();
    rows.forEach(social => {
      index.set(socialIdentityKey(social), social);
    });
    return index;
  }, [rows]);

  const socialsFor = useCallback(
    (id: string): readonly CustomerSocial[] => byCustomer.get(String(id).trim()) ?? EMPTY_SOCIALS,
    [byCustomer]
  );

  const socials = useMemo(
    () => (customerId ? socialsFor(customerId) : EMPTY_SOCIALS),
    [customerId, socialsFor]
  );

  /**
   * The whole point of the `"unknown"` arm: while the sweep is still running, or after it
   * stopped short, "not in the index" is not evidence of "free". Callers must not present
   * it as such — a wrong "available" here is how one person's chat history ends up on
   * another person's profile.
   */
  const lookupIdentity = useCallback(
    (socialType: string, socialId: string): IdentityLookup => {
      const trimmed = socialId.trim();
      if (!trimmed) {
        return { state: "unknown" };
      }

      const match = byIdentity.get(identityKey(socialType, trimmed));
      if (match) {
        return { state: "taken", social: match };
      }
      if (isPartial || isSweeping) {
        return { state: "unknown" };
      }
      return { state: "available" };
    },
    [byIdentity, isPartial, isSweeping]
  );

  const addSocial = useCallback(
    async (draft: DraftCustomerSocial, overrideCustomerId?: string): Promise<SocialActionResult> => {
      const targetId = overrideCustomerId || customerId;
      if (!targetId) {
        return { ok: false, message: "" };
      }

      try {
        const result = await createMutation({
          customerId: targetId,
          socialType: draft.socialType,
          socialId: draft.socialId.trim(),
          socialName: draft.socialName.trim(),
          imgUrl: draft.imgUrl,
        }).unwrap();

        const verdict = readSocialVerdict(result);
        return { ok: verdict.ok, message: verdict.message };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [customerId, createMutation]
  );

  const editSocial = useCallback(
    async (
      id: string,
      draft: DraftCustomerSocial,
      overrideCustomerId?: string
    ): Promise<SocialActionResult> => {
      const targetId = overrideCustomerId || customerId;
      if (!targetId) {
        return { ok: false, message: "" };
      }

      try {
        const result = await updateMutation({
          id,
          customerId: targetId,
          socialType: draft.socialType,
          socialId: draft.socialId.trim(),
          socialName: draft.socialName.trim(),
          imgUrl: draft.imgUrl,
        }).unwrap();

        const verdict = readSocialVerdict(result);
        return { ok: verdict.ok, message: verdict.message };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [customerId, updateMutation]
  );

  /**
   * A hard delete — the table has no `active` or `deletedAt` column, so unlinking is not
   * reversible and the UI must confirm before calling this.
   */
  const removeSocial = useCallback(
    async (id: string): Promise<SocialActionResult> => {
      try {
        const result = await deleteMutation({ id }).unwrap();
        return { ok: readDeleteOutcome(result), message: result?.msg || "" };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [deleteMutation]
  );

  return useMemo(
    () => ({
      socials,
      allSocials: rows,
      isLoading,
      isFetching,
      isError,
      isEmpty: socials.length === 0,
      isMutating: isCreating || isUpdating || isDeleting,
      isPartial,
      socialsFor,
      lookupIdentity,
      addSocial,
      editSocial,
      removeSocial,
      refresh,
    }),
    [
      socials, rows, isLoading, isFetching, isError,
      isCreating, isUpdating, isDeleting, isPartial,
      socialsFor, lookupIdentity, addSocial, editSocial, removeSocial, refresh,
    ]
  );
};
