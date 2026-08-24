// /src/cms/components/admin/system-configuration/area/AreaFormModal.tsx
/**
 * One modal for all three area levels.
 *
 * Country, province and district previously had three near-identical ~75-line
 * JSX blocks that differed only in which fields they rendered. Describing the
 * fields as data instead keeps AreaManagement readable and means a new field
 * (postcode, coordinates) is one array entry rather than three copy-pastes.
 */
import React from "react";
import { CloseIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";

export interface AreaFormField {
  /** Also used as the input id, so it must be unique within one modal. */
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "select";
  value: string;
  error?: string;
  /** Required for type "select". */
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface AreaFormModalProps {
  isOpen: boolean;
  title: string;
  fields: AreaFormField[];
  loading: boolean;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}

const AreaFormModal: React.FC<AreaFormModalProps> = ({
  isOpen,
  title,
  fields,
  loading,
  onClose,
  onReset,
  onSave
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
          {title}
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {field.label}
            </label>

            {field.type === "select" ? (
              <Select
                value={field.value || ""}
                onChange={value => field.onChange(value)}
                options={field.options || []}
                placeholder={field.placeholder}
                className="cursor-pointer"
                disabled={field.disabled}
              />
            ) : (
              <Input
                id={field.key}
                placeholder={field.placeholder}
                value={field.value}
                disabled={field.disabled}
                onChange={event => field.onChange(event.target.value)}
              />
            )}

            <span className="text-red-500 dark:text-red-400 text-xs">{field.error}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <Button onClick={onReset} variant="outline">
            {t("crud.area.action.button.reset")}
          </Button>
          <Button
            onClick={onSave}
            variant="primary"
            disabled={loading}
            className={`${loading && "cursor-not-allowed disabled"}`}
          >
            {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AreaFormModal;
