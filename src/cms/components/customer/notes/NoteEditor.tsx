// src/cms/components/customer/notes/NoteEditor.tsx
import { useState } from "react";
import Button from "@/core/components/ui/button/Button";
import TextAreaWithCounter from "@/core/components/form/input/TextAreaWithCounter";
import { useTranslation } from "@/core/hooks/useTranslation";
import { NoteCategorySelect } from "@/cms/components/customer/notes/NoteCategorySelect";
import type { NoteCategory } from "@/cms/types/customerNote";

/** Long enough for a real handover note, short enough to stay scannable in the rail. */
const MAX_LENGTH = 1000;

interface NoteEditorProps {
  /** Message text only — tags are passed separately via `initialCategories`. */
  initialContent?: string;
  initialCategories?: readonly NoteCategory[];
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (content: string, categories: NoteCategory[]) => void;
  onCancel: () => void;
  /** Called on every keystroke — used by the composer to persist a draft. */
  onContentChange?: (content: string) => void;
}

/**
 * The note form, used for BOTH creating and inline-editing a note. One component so
 * the character limit and the empty-content rule cannot drift between the two.
 *
 * Deals only in decoded values: message text in one field, categories in another. The
 * caller re-encodes them into the single string the backend stores — see
 * `src/cms/utils/customerNoteTags.ts`.
 */
export const NoteEditor = ({
  initialContent = "",
  initialCategories = [],
  isSubmitting = false,
  submitLabel,
  onSubmit,
  onCancel,
  onContentChange,
}: NoteEditorProps) => {
  const { t } = useTranslation();

  const [content, setContent] = useState(initialContent);
  const [categories, setCategories] = useState<NoteCategory[]>([...initialCategories]);

  const isEmpty = content.trim() === "";
  // Disabling while a write is in flight is the double-post guard: the panel is
  // narrow and the button sits under the thumb, so a double tap is easy.
  const isSubmitDisabled = isEmpty || isSubmitting;

  const handleContentChange = (value: string) => {
    setContent(value);
    onContentChange?.(value);
  };

  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return;
    }
    onSubmit(content.trim(), categories);
  };

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <TextAreaWithCounter
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        disable={isSubmitting}
        placeholder={t("customer.note.placeholder")}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-white/30"
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("customer.note.category")}
        </label>
        <NoteCategorySelect
          selected={categories}
          disabled={isSubmitting}
          onChange={setCategories}
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="xs"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? t("customer.note.saving") : submitLabel}
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
};

export default NoteEditor;
