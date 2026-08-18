// src/cms/components/customer/notes/NoteCategorySelect.tsx
import { useTranslation } from "@/core/hooks/useTranslation";
import { useNoteCategories } from "@/cms/hooks/useNoteCategories";
import { i18nNoteCategory, noteCategoryChipClass } from "@/cms/components/customer/notes/noteCategoryDisplay";
import type { NoteCategory } from "@/cms/types/customerNote";

interface NoteCategorySelectProps {
  selected: readonly NoteCategory[];
  disabled?: boolean;
  onChange: (categories: NoteCategory[]) => void;
}

/**
 * Multi-select for note categories, as toggle chips.
 *
 * A native `<select multiple>` was the obvious choice and the wrong one: it needs
 * ctrl-click to deselect, sizes badly in a ~320px rail, and can't carry the per-category
 * colours. Four preset options fit comfortably as chips, and a chip reads the same as
 * the badge the category becomes once the note is saved.
 */
export const NoteCategorySelect = ({ selected, disabled = false, onChange }: NoteCategorySelectProps) => {
  const { t } = useTranslation();
  const { categories } = useNoteCategories();

  const toggle = (category: NoteCategory) => {
    onChange(
      selected.includes(category)
        ? selected.filter(item => item !== category)
        : [...selected, category]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => {
        const isSelected = selected.includes(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => toggle(category)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${noteCategoryChipClass(category, isSelected)}`}
          >
            {i18nNoteCategory(t, category)}
          </button>
        );
      })}
    </div>
  );
};

export default NoteCategorySelect;
