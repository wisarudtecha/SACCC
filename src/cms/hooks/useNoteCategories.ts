// src/cms/hooks/useNoteCategories.ts
/**
 * The categories a note can be filed under.
 *
 * A hook rather than a bare constant on purpose: it is not settled whether
 * categories stay a fixed FE list or become a backend-managed lookup like
 * `appointmentType`/`serviceType`. If they become managed, the body of this hook
 * becomes an RTK Query call (with `NOTE_CATEGORIES` as the fallback) and every
 * caller is left untouched.
 *
 * Labels are not returned. Callers translate through `t()` at render time so the
 * `public/i18n/*.json` catalogues stay the single source of display text.
 */
import { NOTE_CATEGORIES } from "@/cms/utils/customerNote.policy";
import type { NoteCategory } from "@/cms/types/customerNote";

export interface UseNoteCategoriesResult {
  categories: readonly NoteCategory[];
  isLoading: boolean;
}

export const useNoteCategories = (): UseNoteCategoriesResult => ({
  categories: NOTE_CATEGORIES,
  isLoading: false,
});
