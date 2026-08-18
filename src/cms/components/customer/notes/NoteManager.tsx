// src/cms/components/customer/notes/NoteManager.tsx
import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { ConfirmationModal } from "@/cms/components/case/modal/ConfirmationModal";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useCustomerNotes } from "@/cms/hooks/useCustomerNotes";
import { useNoteDraft } from "@/cms/hooks/useNoteDraft";
import { encodeNoteText } from "@/cms/utils/customerNoteTags";
import { NoteEditor } from "@/cms/components/customer/notes/NoteEditor";
import { NoteList } from "@/cms/components/customer/notes/NoteList";
import type { CustomerNote, NoteCategory } from "@/cms/types/customerNote";
import type { NoteActionResult } from "@/cms/hooks/useCustomerNotes";

interface NoteManagerProps {
  customerId: string;
}

/**
 * Internal customer notes: the stream, the composer, and the edit/delete flow.
 *
 * The only component here that touches server state, and the only one that encodes
 * categories into the stored string. Everything below it deals in decoded values,
 * which keeps two questions in one place: "did this write actually succeed?" — the one
 * the BFF makes non-obvious by answering failures with HTTP 200 — and "what does a
 * note actually look like on the wire?".
 */
export const NoteManager = ({ customerId }: NoteManagerProps) => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();
  const { state } = useAuth();

  const {
    notes,
    isLoading,
    isFetching,
    isError,
    isMutating,
    hasMore,
    loadMore,
    refresh,
    createNote,
    updateNote,
    removeNote,
    canEdit,
  } = useCustomerNotes({ customerId });

  const { initialDraft, saveDraft, clearDraft } = useNoteDraft(state.user?.username, customerId);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerNote | null>(null);

  /**
   * The server's own wording wins when it says something — it is more specific than
   * anything we can guess — and a translated string covers the case where it doesn't.
   */
  const report = useCallback(
    (result: NoteActionResult, fallbackKey: string) => {
      addToast(result.ok ? "success" : "error", result.message || t(fallbackKey));
    },
    [addToast, t]
  );

  const handleCreate = useCallback(
    async (content: string, categories: NoteCategory[]) => {
      const result = await createNote(encodeNoteText(content, categories));
      report(result, result.ok ? "customer.note.created" : "customer.note.save_failed");

      if (!result.ok) {
        // Leave the composer open with the text intact — retrying should not mean retyping.
        return;
      }

      clearDraft();
      setIsComposerOpen(false);
      refresh();
    },
    [createNote, report, clearDraft, refresh]
  );

  const handleSaveEdit = useCallback(
    async (noteId: string, content: string, categories: NoteCategory[]) => {
      const result = await updateNote(noteId, encodeNoteText(content, categories));
      report(result, result.ok ? "customer.note.updated" : "customer.note.save_failed");

      if (!result.ok) {
        return;
      }

      setEditingNoteId(null);
      refresh();
    },
    [updateNote, report, refresh]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const result = await removeNote(pendingDelete.id);
    report(result, result.ok ? "customer.note.deleted" : "customer.note.delete_failed");
    setPendingDelete(null);

    if (result.ok) {
      refresh();
    }
  }, [pendingDelete, removeNote, report, refresh]);

  const handleOpenComposer = useCallback(() => {
    // One editor at a time: an open inline edit would otherwise compete with the
    // composer for the same narrow column.
    setEditingNoteId(null);
    setIsComposerOpen(true);
  }, []);

  const handleStartEdit = useCallback((noteId: string) => {
    setIsComposerOpen(false);
    setEditingNoteId(noteId);
  }, []);

  return (
    <div className="space-y-3">
      {isComposerOpen ? (
        <NoteEditor
          initialContent={initialDraft}
          isSubmitting={isMutating}
          submitLabel={t("customer.note.save")}
          onSubmit={handleCreate}
          onCancel={() => setIsComposerOpen(false)}
          onContentChange={saveDraft}
        />
      ) : (
        <Button size="xs" className="w-full" onClick={handleOpenComposer}>
          <Plus className="mr-1 h-4 w-4" />
          {t("customer.note.add")}
        </Button>
      )}

      <NoteList
        notes={notes}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        hasMore={hasMore}
        editingNoteId={editingNoteId}
        isSubmitting={isMutating}
        canEdit={canEdit}
        onLoadMore={loadMore}
        onStartEdit={handleStartEdit}
        onCancelEdit={() => setEditingNoteId(null)}
        onSaveEdit={handleSaveEdit}
        onRequestDelete={setPendingDelete}
      />

      <ConfirmationModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("customer.note.delete_title")}
        description={t("customer.note.delete_description")}
        confirmButtonText={t("common.delete")}
        confirmButtonVariant="error"
      />
    </div>
  );
};

export default NoteManager;
