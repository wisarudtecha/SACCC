import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//import { useTranslation } from "react-i18next";
import { useTranslation } from "@/core/hooks/useTranslation";

import PageMeta from "@/kms/components/common/PageMeta";
import BroadcastFormModal from "@/kms/components/broadcast/BroadcastFormModal";
import BroadcastHero from "@/kms/components/broadcast/BroadcastHero";
import BroadcastListBlock from "@/kms/components/broadcast/BroadcastListBlock";
import BroadcastStatusBlock from "@/kms/components/broadcast/BroadcastStatusBlock";
import BroadcastToastStack from "@/kms/components/broadcast/BroadcastToastStack";
import ConfirmModal from "@/kms/components/shared/ConfirmModal";

import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";

import type {
  BroadcastItem,
  BroadcastMutationInput,
  BroadcastStatus,
} from "@/kms/broadcast/dtos/broadcast.dto";
import {
  createBroadcastItem,
  deleteBroadcastItem,
  updateBroadcastItem,
} from "@/kms/broadcast/service/broadcast.service";

type ToastTone = "success" | "error";

interface BroadcastToast {
  id: number;
  tone: ToastTone;
  message: string;
}

const BroadcastPage = () => {
   const { t } = useTranslation();

  const permissions = usePermissions();
  if(!permissions.hasPermission(KbPermission.KB_BROADCAST_VIEW)){
        return <NotFound />;
  }

  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BroadcastStatus>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BroadcastItem | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<BroadcastItem | null>(null);
  const [toasts, setToasts] = useState<BroadcastToast[]>([]);

  const pushToast = (tone: ToastTone, message: string) => {
    const nextToast: BroadcastToast = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tone,
      message,
    };

    setToasts((current) => [...current, nextToast]);

    window.setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== nextToast.id),
      );
    }, 3200);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const invalidateBroadcastQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["kb-broadcast-block"] }),
      queryClient.invalidateQueries({ queryKey: ["kb-broadcast-list"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (input: BroadcastMutationInput) => createBroadcastItem(input),
    onSuccess: async () => {
      await invalidateBroadcastQueries();
      setIsModalOpen(false);
      pushToast("success", t("knowledge.broadcast.toast.createSuccess"));
    },
    onError: () => {
      pushToast("error", t("knowledge.broadcast.toast.createError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: BroadcastMutationInput;
    }) => updateBroadcastItem(id, input),
    onSuccess: async () => {
      await invalidateBroadcastQueries();
      setIsModalOpen(false);
      setEditingItem(null);
      pushToast("success", t("knowledge.broadcast.toast.updateSuccess"));
    },
    onError: () => {
      pushToast("error", t("knowledge.broadcast.toast.updateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBroadcastItem(id),
    onSuccess: async () => {
      await invalidateBroadcastQueries();
      setPendingDeleteItem(null);
      pushToast("success", t("knowledge.broadcast.toast.deleteSuccess"));
    },
    onError: () => {
      setPendingDeleteItem(null);
      pushToast("error", t("knowledge.broadcast.toast.deleteError"));
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: BroadcastItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (input: BroadcastMutationInput) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, input });
      return;
    }

    await createMutation.mutateAsync(input);
  };

  const handleDelete = (item: BroadcastItem) => {
    setPendingDeleteItem(item);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteItem) return;
    void deleteMutation.mutateAsync(pendingDeleteItem.id);
  };

  return (
    <>
      <PageMeta
        title={t("knowledge.broadcast.page.metaTitle")}
        description={t("knowledge.broadcast.page.metaDescription")}
      />

      <div className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
        <BroadcastHero />

        <section className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <BroadcastStatusBlock value={status} onChange={setStatus} />
          <BroadcastListBlock
            status={status}
            onCreate={openCreateModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        </section>
      </div>

      <BroadcastFormModal
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

      <BroadcastToastStack toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        isOpen={!!pendingDeleteItem}
        title={t("knowledge.broadcast.confirm.delete", { title: pendingDeleteItem?.title ?? "" })}
        description={t("knowledge.broadcast.confirm.deleteDescription")}
        confirmLabel={t("knowledge.broadcast.buttons.delete")}
        cancelLabel={t("knowledge.broadcast.buttons.cancel")}
        isLoading={deleteMutation.isPending}
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </>
  );
};

export default BroadcastPage;
