// src/cms/hooks/useCustomerNotes.ts
/**
 * The only customer-note data surface the UI sees.
 *
 * Components never touch RTK Query directly, which keeps two awkward facts in one
 * place: pages have to be accumulated by hand, and a write that "succeeded" may not
 * have. Both are handled here so the components can stay presentational.
 *
 * This layer knows nothing about toasts or translation. It returns a discriminated
 * result and never throws, leaving presentation to the components.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { readMutationError } from "@/core/utils/apiResponseStatus";
import {
  useCreateCustomerNoteMutation,
  useCustomerNoteListQuery,
  useDeleteCustomerNoteMutation,
  useUpdateCustomerNoteMutation,
} from "@/cms/store/api/customerNote";
import {
  canEditNote,
  readDeleteOutcome,
  readNoteVerdict,
} from "@/cms/utils/customerNote.policy";
import type { CustomerNote } from "@/cms/types/customerNote";

/**
 * Identity stability matters: a fresh `[]` literal would change `notes` on every
 * render and cascade into any effect that depends on it.
 */
const EMPTY_NOTES: readonly CustomerNote[] = Object.freeze([]);

/** Matches the page size used by the other paginated lists in the case panel. */
const DEFAULT_PAGE_SIZE = 10;

export type NoteActionResult =
  | { ok: true; note?: CustomerNote; message: string }
  | { ok: false; note?: undefined; message: string };

export interface UseCustomerNotesOptions {
  /** Undefined until a customer is linked — the Create-case path starts this way. */
  customerId?: string;
  pageSize?: number;
}

export interface UseCustomerNotesResult {
  notes: readonly CustomerNote[];
  isLoading: boolean;
  isFetching: boolean;
  /** The list request failed outright (transport or GraphQL errors). */
  isError: boolean;
  /** The request succeeded but this customer has no notes yet. */
  isEmpty: boolean;
  isMutating: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** Discards the accumulated pages and re-reads from the first one. */
  refresh: () => void;
  /** `note` must already be encoded — see `customerNoteTags.ts`. */
  createNote: (note: string) => Promise<NoteActionResult>;
  updateNote: (noteId: string, note: string) => Promise<NoteActionResult>;
  removeNote: (noteId: string) => Promise<NoteActionResult>;
  /** Whether the current user may edit or delete this note. UX gating only. */
  canEdit: (note: Pick<CustomerNote, "createdBy">) => boolean;
}

const dedupeById = (notes: CustomerNote[]): CustomerNote[] => {
  const seen = new Set<string>();
  return notes.filter(note => {
    if (seen.has(note.id)) {
      return false;
    }
    seen.add(note.id);
    return true;
  });
};

export const useCustomerNotes = (options: UseCustomerNotesOptions = {}): UseCustomerNotesResult => {
  const { customerId, pageSize = DEFAULT_PAGE_SIZE } = options;

  const { state } = useAuth();
  const isSystemAdmin = useIsSystemAdmin();

  const [start, setStart] = useState(0);
  const [notes, setNotes] = useState<readonly CustomerNote[]>(EMPTY_NOTES);
  const [hasMore, setHasMore] = useState(true);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch: refetchQuery,
  } = useCustomerNoteListQuery(
    { customerId: customerId || "", start, length: pageSize },
    { skip: !customerId }
  );

  const [createMutation, { isLoading: isCreating }] = useCreateCustomerNoteMutation();
  const [updateMutation, { isLoading: isUpdating }] = useUpdateCustomerNoteMutation();
  const [deleteMutation, { isLoading: isDeleting }] = useDeleteCustomerNoteMutation();

  /**
   * A changed customer invalidates every accumulated page, not just the current one —
   * reset to the first page rather than appending onto another customer's list.
   */
  useEffect(() => {
    setStart(0);
    setNotes(EMPTY_NOTES);
    setHasMore(true);
  }, [customerId, pageSize]);

  /**
   * Pages arrive one cache entry at a time (the store's custom `serializeQueryArgs`
   * keys on the full args, so nothing merges automatically) and are accumulated here.
   * Dedupe guards against a note shifting between pages when one is added concurrently.
   */
  useEffect(() => {
    const page = response?.data;
    if (!Array.isArray(page)) {
      return;
    }

    setNotes(previous => (start === 0 ? page : dedupeById([...previous, ...page])));
    setHasMore(page.length >= pageSize);
  }, [response, start, pageSize]);

  const loadMore = useCallback(() => {
    if (!hasMore || isFetching) {
      return;
    }
    setStart(previous => previous + pageSize);
  }, [hasMore, isFetching, pageSize]);

  /**
   * After a write, the accumulated pages beyond the current one are stale: RTK Query
   * only refetches the entry still subscribed. Dropping back to page one is the
   * honest way to resynchronise.
   */
  const refresh = useCallback(() => {
    setNotes(EMPTY_NOTES);
    setHasMore(true);

    if (start === 0) {
      // Already on the first page, so no cache key changes — ask explicitly.
      refetchQuery();
      return;
    }
    setStart(0);
  }, [start, refetchQuery]);

  const createNote = useCallback(
    async (note: string): Promise<NoteActionResult> => {
      if (!customerId) {
        return { ok: false, message: "" };
      }

      try {
        const result = await createMutation({ customerId, note }).unwrap();
        const verdict = readNoteVerdict(result);
        if (!verdict.ok) {
          return { ok: false, message: verdict.message };
        }
        // The backend sends no payload on write, so `verdict.entity` is always
        // undefined here; the invalidated tag is what brings the new note back.
        return { ok: true, note: verdict.entity, message: verdict.message };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [customerId, createMutation]
  );

  const updateNote = useCallback(
    async (noteId: string, note: string): Promise<NoteActionResult> => {
      if (!customerId) {
        return { ok: false, message: "" };
      }

      try {
        const result = await updateMutation({ customerId, id: noteId, note }).unwrap();
        const verdict = readNoteVerdict(result);
        return verdict.ok
          ? { ok: true, note: verdict.entity, message: verdict.message }
          : { ok: false, message: verdict.message };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [customerId, updateMutation]
  );

  /**
   * Delete has no entity to inspect — `data` is coerced to `[]` either way — so the
   * envelope status is the only signal, and an inconclusive one is read as success
   * (many operations here omit the field entirely).
   */
  const removeNote = useCallback(
    async (noteId: string): Promise<NoteActionResult> => {
      try {
        const result = await deleteMutation({ id: noteId }).unwrap();
        return { ok: readDeleteOutcome(result), message: result?.msg || "" };
      }
      catch (error) {
        return { ok: false, message: readMutationError(error) };
      }
    },
    [deleteMutation]
  );

  const canEdit = useCallback(
    (note: Pick<CustomerNote, "createdBy">) => canEditNote(note, state.user, isSystemAdmin),
    [state.user, isSystemAdmin]
  );

  return useMemo(
    () => ({
      notes,
      isLoading,
      isFetching,
      isError,
      isEmpty: notes.length === 0,
      isMutating: isCreating || isUpdating || isDeleting,
      hasMore,
      loadMore,
      refresh,
      createNote,
      updateNote,
      removeNote,
      canEdit,
    }),
    [
      notes, isLoading, isFetching, isError,
      isCreating, isUpdating, isDeleting, hasMore,
      loadMore, refresh, createNote, updateNote, removeNote, canEdit,
    ]
  );
};
