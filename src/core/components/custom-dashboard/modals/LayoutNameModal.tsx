// src/core/components/custom-dashboard/modals/LayoutNameModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "@/core/components/ui/modal";
import Button from "@/core/components/ui/button/Button";
import { useTranslation } from "@/core/hooks/useTranslation";

export type LayoutNameMode = "create" | "rename" | "duplicate";

interface LayoutNameModalProps {
  mode: LayoutNameMode | null;
  /** Prefill: the current name for rename, "<name> (copy)" for duplicate, empty for create. */
  initialName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const TITLE_KEYS: Record<LayoutNameMode, string> = {
  create: "dashboard.custom.new_layout",
  rename: "dashboard.custom.rename_layout",
  duplicate: "dashboard.custom.duplicate_layout",
};

const SUBMIT_KEYS: Record<LayoutNameMode, string> = {
  create: "dashboard.custom.create",
  rename: "dashboard.custom.rename",
  duplicate: "dashboard.custom.duplicate",
};

/** One modal for the three flows that only differ by their label and what they do with a name. */
export const LayoutNameModal: React.FC<LayoutNameModalProps> = ({
  mode,
  initialName,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [showError, setShowError] = useState(false);

  // Re-seed whenever the modal is opened in a different mode or for a different layout.
  useEffect(() => {
    if (mode) {
      setName(initialName);
      setShowError(false);
    }
  }, [mode, initialName]);

  if (!mode) {
    return null;
  }

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setShowError(true);
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="m-4 w-full max-w-md p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t(TITLE_KEYS[mode])}
      </h2>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="layout-name">
        {t("dashboard.custom.layout_name")}
      </label>
      <input
        id="layout-name"
        type="text"
        value={name}
        autoFocus
        onChange={event => {
          setName(event.target.value);
          setShowError(false);
        }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={t("dashboard.custom.layout_name_placeholder")}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      {showError && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {t("dashboard.custom.layout_name_required")}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("dashboard.custom.saving") : t(SUBMIT_KEYS[mode])}
        </Button>
      </div>
    </Modal>
  );
};
