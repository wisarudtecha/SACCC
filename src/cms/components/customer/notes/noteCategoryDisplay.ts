// src/cms/components/customer/notes/noteCategoryDisplay.ts
/**
 * How a note category is shown: its translated label, its badge colour, and its chip
 * styling in the selector.
 *
 * All three live here rather than inside the components so that adding or recolouring
 * a category is a single edit. Follows the same shape as `i18nUserType` in
 * `src/cms/components/customer/constant.ts`.
 */
import type { BadgeColor } from "@/core/components/ui/badge/Badge";
import type { NoteCategory } from "@/cms/types/customerNote";
import type { TranslationParams } from "@/core/types/i18n";

/**
 * Labels are never hardcoded here — the catalogues under `public/i18n/` are the
 * single source of display text, and `t()` returns the raw key path when one is
 * missing, so a gap is visible rather than silently English.
 */
export const i18nNoteCategory = (
  t: (key: string, params?: TranslationParams | undefined) => string,
  category: NoteCategory
): string => t(`customer.note.categories.${category.toLowerCase()}`);

const CATEGORY_BADGE_COLORS: Record<NoteCategory, BadgeColor> = {
  General: "light",
  Billing: "warning",
  Support: "info",
  Sales: "success",
};

export const noteCategoryColor = (category: NoteCategory): BadgeColor =>
  CATEGORY_BADGE_COLORS[category] ?? "light";

/**
 * Selector chips can't reuse `Badge` directly — they need a pressed state and a
 * visible unselected state — but they must land on the same colours, so a selected
 * chip and the badge on the saved note read as one thing.
 */
const CATEGORY_CHIP_SELECTED: Record<NoteCategory, string> = {
  General: "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white",
  Billing: "bg-warning-500 text-white dark:bg-warning-500 dark:text-white",
  Support: "bg-blue-light-500 text-white dark:bg-blue-light-500 dark:text-white",
  Sales: "bg-success-500 text-white dark:bg-success-500 dark:text-white",
};

const CHIP_UNSELECTED =
  "bg-transparent text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700";

export const noteCategoryChipClass = (category: NoteCategory, isSelected: boolean): string =>
  isSelected ? (CATEGORY_CHIP_SELECTED[category] ?? CATEGORY_CHIP_SELECTED.General) : CHIP_UNSELECTED;
