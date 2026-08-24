// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateForkModal.tsx
/**
 * Forking a published template opens a new draft version of the same lineage.
 * The API takes a name for it (`en`), so this asks rather than inventing one -
 * versions are otherwise indistinguishable in a list beyond their number.
 */
import React, { useEffect, useState } from "react";
import { CloseIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { TemplateCountry } from "@/cms/types/areaTemplate";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";

interface AreaTemplateForkModalProps {
  /** null closes the dialog; a template opens it for that lineage. */
  template: TemplateCountry | null;
  loading: boolean;
  onClose: () => void;
  onFork: (template: TemplateCountry, name: string) => void | Promise<void>;
}

const AreaTemplateForkModal: React.FC<AreaTemplateForkModalProps> = ({
  template,
  loading,
  onClose,
  onFork
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.en || "");
      setError("");
    }
  }, [template]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t("crud.areaTemplate.fork.name_required"));
      return;
    }
    setError("");
    if (template) {
      onFork(template, name.trim());
    }
  };

  return (
    <Modal
      isOpen={Boolean(template)}
      onClose={onClose}
      className="max-w-xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
          {t("crud.areaTemplate.fork.title")}
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 cursor-default">
        {t("crud.areaTemplate.fork.description").replace("_VERSION_", `v${template?.version ?? ""}`)}
      </p>

      <div>
        <label htmlFor="forkName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t("crud.areaTemplate.fork.name.label")}
        </label>
        <Input
          id="forkName"
          value={name}
          placeholder={t("crud.areaTemplate.fork.name.placeholder")}
          onChange={event => setName(event.target.value)}
        />
        <span className="text-red-500 dark:text-red-400 text-xs">{error}</span>
      </div>

      <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline">
            {t("crud.common.form.action.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={loading}
            className={`${loading && "cursor-not-allowed disabled"}`}
          >
            {!loading && t("crud.areaTemplate.action.fork") || t("crud.area.confirm.button.saving")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AreaTemplateForkModal;
