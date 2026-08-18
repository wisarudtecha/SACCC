import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/core/hooks/useTranslation";
import PageMeta from "@/kms/components/common/PageMeta";
import ConfirmModal from "@/kms/components/shared/ConfirmModal";
import SourceFormModal from "@/kms/components/source/SourceFormModal";
import SourceHero from "@/kms/components/source/SourceHero";
import SourceTable from "@/kms/components/source/SourceTable";
import SourceToastStack from "@/kms/components/source/SourceToastStack";
import type { SourceItem, SourceMutationInput } from "@/kms/source/dtos/source.dto";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
import {
  createSourceItem,
  deleteSourceItem,
  updateSourceItem,
} from "@/kms/source/service/source.service";

type ToastTone = "success" | "error";

interface SourceToast {
  id: number;
  tone: ToastTone;
  message: string;
}

const SourcePage = () => {

    const permissions = usePermissions();
  if (!permissions.hasPermission(KbPermission.KB_SOURCE_VIEW)) {
    return <NotFound />;
  }
  const isCreate = permissions.hasPermission(KbPermission.KB_SOURCE_CREATE)
  const isUpdate = permissions.hasPermission(KbPermission.KB_SOURCE_UPDATE)
  const isDelete = permissions.hasPermission(KbPermission.KB_SOURCE_DELETE)

  const { t, language } = useTranslation();
  const i18n={
    language:language
  }
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SourceItem | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<SourceItem | null>(null);
  const [toasts, setToasts] = useState<SourceToast[]>([]);

  const pushToast = (tone: ToastTone, message: string) => {
    const next: SourceToast = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tone,
      message,
    };
    setToasts((current) => [...current, next]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== next.id));
    }, 3200);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["kb-source-list"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: SourceMutationInput) => createSourceItem(input),
    onSuccess: async () => {
      await invalidate();
      setIsModalOpen(false);
      pushToast("success", t("knowledge.source.toast.createSuccess"));
    },
    onError: () => { pushToast("error", t("knowledge.source.toast.createError")); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SourceMutationInput }) =>
      updateSourceItem(id, input),
    onSuccess: async () => {
      await invalidate();
      setIsModalOpen(false);
      setEditingItem(null);
      pushToast("success", t("knowledge.source.toast.updateSuccess"));
    },
    onError: () => { pushToast("error", t("knowledge.source.toast.updateError")); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSourceItem(id),
    onSuccess: async () => {
      await invalidate();
      setPendingDeleteItem(null);
      pushToast("success", t("knowledge.source.toast.deleteSuccess"));
    },
    onError: () => {
      setPendingDeleteItem(null);
      pushToast("error", t("knowledge.source.toast.deleteError"));
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: SourceItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (input: SourceMutationInput) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, input });
      return;
    }
    await createMutation.mutateAsync(input);
  };

  const handleDelete = (item: SourceItem) => {
    setPendingDeleteItem(item);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteItem) return;
    void deleteMutation.mutateAsync(pendingDeleteItem.id);
  };

  return (
    <>
      <PageMeta
        title={t("knowledge.source.page.metaTitle")}
        description={t("knowledge.source.page.metaDescription")}
      />

      <div className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
        <SourceHero />
        <SourceTable
          onCreate={openCreateModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
          isCreate={isCreate}
          isUpdate={isUpdate}
          isDelete={isDelete}
        />
      </div>

      <SourceFormModal
        isOpen={isModalOpen}
        item={editingItem}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={
          (createMutation.error as Error | null)?.message ??
          (updateMutation.error as Error | null)?.message ??
          null
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        isOpen={!!pendingDeleteItem}
        title={t("knowledge.source.confirm.delete", {
            name: i18n.language === "th"
              ? (pendingDeleteItem?.name_th || pendingDeleteItem?.name_en || "")
              : (pendingDeleteItem?.name_en || pendingDeleteItem?.name_th || ""),
          })}
        description={t("knowledge.source.confirm.deleteDescription")}
        confirmLabel={t("knowledge.source.buttons.deleteConfirm")}
        cancelLabel={t("knowledge.source.buttons.cancel")}
        isLoading={deleteMutation.isPending}
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteItem(null)}
      />

      <SourceToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default SourcePage;
