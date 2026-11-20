// src/cms/hooks/useCustomerContacts.ts
/**
 * The customer's contact records, swept page by page.
 *
 * `GetListCustomerContact` takes only `start`/`length` — the contract defines no `custId`
 * filter and no total — so "this customer's contacts" can only be answered by walking pages and
 * filtering client-side. That is the same shape `useCustomerSocials` takes for the same reason.
 *
 * Two consequences worth keeping in mind before "simplifying" this:
 *
 *   - **A single page is a partial answer.** Stopping at page one would silently drop contacts
 *     for any customer whose rows land beyond it, with no error and no visual cue.
 *   - **`currentData`, not `data`.** RTK Query's `data` is the last result *this hook ever saw*,
 *     regardless of the argument, so on a page advance it still holds the previous page until
 *     the new one succeeds — the sweep would then re-append and re-advance from stale rows.
 *     `currentData` is scoped to the current `start` and is `undefined` until it resolves.
 */
import { useCallback, useEffect, useState } from "react";
import {
  useGetCustomerContactListQuery,
  useUpdateCustomerContactMutation,
} from "@/cms/store/api/customerContact";
import { isCustomerContact } from "@/cms/types/customerContact";
import type { CustomerContact, UpdateCustomerContactInput } from "@/cms/types/customerContact";

/** Rows per request. The contract has no page-size limit of its own. */
const PAGE_SIZE = 50;

/**
 * How far the sweep will go before it stops claiming to be complete.
 *
 * 5 x 50 = 250 contacts for one customer is far beyond any real account; the cap exists so a
 * misbehaving backend cannot spin this hook forever. Hitting it sets `isPartial`, and the caller
 * is expected to say so rather than present the list as complete.
 */
const MAX_PAGES = 5;

export interface UseCustomerContactsResult {
  /** Rows belonging to `customerId`, in the order the backend returned them. */
  contacts: readonly CustomerContact[];
  /** True until the sweep has finished (or is skipped because there is no customer). */
  isLoading: boolean;
  isFetching: boolean;
  /** The sweep hit `MAX_PAGES` — the list is bounded, not complete. */
  isPartial: boolean;
  isError: boolean;
  /** Resolves `true` on success. Never throws — the caller decides what to show. */
  updateContact: (input: UpdateCustomerContactInput) => Promise<boolean>;
  /** Discards the accumulated pages and re-sweeps from the first one. */
  refresh: () => void;
}

const EMPTY: readonly CustomerContact[] = [];

/** Pages can overlap when a row is inserted concurrently; the id is the identity. */
const dedupeById = (contacts: readonly CustomerContact[]): readonly CustomerContact[] => {
  const seen = new Set<string>();
  return contacts.filter(contact => {
    const key = String(contact.id);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const useCustomerContacts = (customerId: string | undefined): UseCustomerContactsResult => {
  const [start, setStart] = useState(0);
  const [rows, setRows] = useState<readonly CustomerContact[]>(EMPTY);
  const [isPartial, setIsPartial] = useState(false);
  const [isSweeping, setIsSweeping] = useState(true);

  const enabled = Boolean(customerId);

  const {
    currentData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCustomerContactListQuery({ start, length: PAGE_SIZE }, { skip: !enabled });

  const [updateMutation, { isLoading: isUpdating }] = useUpdateCustomerContactMutation();

  // A different customer is a different list: drop everything and start from page one.
  useEffect(() => {
    setStart(0);
    setRows(EMPTY);
    setIsPartial(false);
    setIsSweeping(true);
  }, [customerId]);

  useEffect(() => {
    const page = currentData?.data;

    if (!Array.isArray(page)) {
      return;
    }

    // A payload that is not shaped like a contact is not a contact — `normalizeToApiResponse`
    // turns an absent `data` into `[]`, and an unknown row must not reach the table.
    const valid = page.filter(isCustomerContact);

    setRows(previous => (start === 0 ? valid : dedupeById([...previous, ...valid])));

    if (page.length < PAGE_SIZE) {
      setIsSweeping(false);
      return;
    }

    if (start / PAGE_SIZE + 1 >= MAX_PAGES) {
      setIsPartial(true);
      setIsSweeping(false);
      return;
    }

    setStart(previous => previous + PAGE_SIZE);
  }, [currentData, start]);

  const updateContact = useCallback(
    async (input: UpdateCustomerContactInput): Promise<boolean> => {
      try {
        await updateMutation(input).unwrap();
        return true;
      } catch (error) {
        console.error("Failed to update customer contact:", error);
        return false;
      }
    },
    [updateMutation]
  );

  const refresh = useCallback(() => {
    setRows(EMPTY);
    setIsPartial(false);
    setIsSweeping(true);

    if (start === 0) {
      // Already on the first page, so no cache key changes — ask explicitly.
      refetch();
      return;
    }

    setStart(0);
  }, [start, refetch]);

  const contacts = enabled
    ? rows.filter(contact => String(contact.custId) === String(customerId))
    : EMPTY;

  return {
    contacts,
    isLoading: enabled && (isLoading || isSweeping),
    isFetching: isFetching || isUpdating,
    isPartial,
    isError,
    updateContact,
    refresh,
  };
};
