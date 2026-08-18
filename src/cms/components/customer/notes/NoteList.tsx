// src/cms/components/customer/notes/NoteList.tsx
import { NotebookPen } from "lucide-react";
import Loading from "@/core/components/common/Loading";
import { useTranslation } from "@/core/hooks/useTranslation";
import { NoteCard } from "@/cms/components/customer/notes/NoteCard";
import type { CustomerNote, NoteCategory } from "@/cms/types/customerNote";

/** Same trigger distance the other scroll-paginated lists in the case panel use. */
const SCROLL_THRESHOLD_PX = 50;

interface NoteListProps {
  notes: readonly CustomerNote[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasMore: boolean;
  editingNoteId: string | null;
  isSubmitting: boolean;
  canEdit: (note: Pick<CustomerNote, "createdBy">) => boolean;
  onLoadMore: () => void;
  onStartEdit: (noteId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (noteId: string, content: string, categories: NoteCategory[]) => void;
  onRequestDelete: (note: CustomerNote) => void;
}

/**
 * The note stream, newest first, with scroll-to-load paging.
 *
 * Owns only presentation state; paging is requested through `onLoadMore` and the
 * caller decides whether there is anything left to fetch.
 */
export const NoteList = ({
  notes,
  isLoading,
  isFetching,
  isError,
  hasMore,
  editingNoteId,
  isSubmitting,
  canEdit,
  onLoadMore,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
}: NoteListProps) => {
  const { t } = useTranslation();

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD_PX && hasMore && !isFetching) {
      onLoadMore();
    }
  };

  if (isLoading) {
    return <Loading className="py-6" />;
  }

  if (isError) {
    return (
      <div className="py-6 text-center text-sm text-red-500 dark:text-red-400">
        {t("customer.note.load_failed")}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="py-8 text-center">
        <NotebookPen className="mx-auto mb-2 h-7 w-7 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {t("customer.note.empty")}
        </p>
      </div>
    );
  }

  return (
    <div
      className="custom-scrollbar max-h-[55vh] space-y-3 overflow-y-auto pr-1"
      onScroll={handleScroll}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          canEdit={canEdit(note)}
          isEditing={editingNoteId === note.id}
          isSubmitting={isSubmitting}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
      {isFetching && <Loading className="py-2" />}
    </div>
  );
};

export default NoteList;
