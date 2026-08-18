// src/cms/components/customer/notes/NoteCard.tsx
import { Pencil, Trash2, UserRound } from "lucide-react";
import { formatDate } from "@/core/utils/crud";
import { useTranslation } from "@/core/hooks/useTranslation";
import { isNoteEdited } from "@/cms/utils/customerNote.policy";
import { decodeNoteText } from "@/cms/utils/customerNoteTags";
import { NoteCategoryTag } from "@/cms/components/customer/notes/NoteCategoryTag";
import { NoteEditor } from "@/cms/components/customer/notes/NoteEditor";
import type { CustomerNote, NoteCategory } from "@/cms/types/customerNote";

interface NoteCardProps {
  note: CustomerNote;
  /** Whether the current user may edit or delete. Decided by the caller's policy. */
  canEdit: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  onStartEdit: (noteId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (noteId: string, content: string, categories: NoteCategory[]) => void;
  onRequestDelete: (note: CustomerNote) => void;
}

/**
 * A single note in the stream. When it is the note being edited it swaps its body for
 * an inline `NoteEditor` rather than opening a modal, so the surrounding context stays
 * visible in the narrow panel.
 *
 * The stored string carries its categories as trailing hashtags; decoding here means
 * the body shows the message alone and the tags render as badges.
 */
export const NoteCard = ({
  note,
  canEdit,
  isEditing,
  isSubmitting,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
}: NoteCardProps) => {
  const { t } = useTranslation();
  const { text, categories } = decodeNoteText(note.note);

  if (isEditing) {
    return (
      <NoteEditor
        initialContent={text}
        initialCategories={categories}
        isSubmitting={isSubmitting}
        submitLabel={t("common.save")}
        onSubmit={(content, selected) => onSaveEdit(note.id, content, selected)}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <NoteCategoryTag key={category} category={category} />
          ))}
        </div>

        {/* Actions are absent, not disabled, when the user has no rights to them —
            a greyed-out button reads as "temporarily unavailable". */}
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              title={t("common.edit")}
              onClick={() => onStartEdit(note.id)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-blue-400"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={t("common.delete")}
              onClick={() => onRequestDelete(note)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words text-gray-700 dark:text-gray-200">
        {text}
      </p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <UserRound className="h-3 w-3" />
          {note.createdBy || "-"}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(note.createdAt)}</span>
        {isNoteEdited(note) && (
          <>
            <span aria-hidden="true">·</span>
            <span className="italic">{t("customer.note.edited")}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
