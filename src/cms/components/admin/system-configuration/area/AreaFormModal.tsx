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
  type: "text" | "number" | "select" | "textarea" | "toggle";
  /** Toggle fields read "true"/"false"; every other type reads its raw text. */
  value: string;
  error?: string;
  /** Shown under the field when there is no error - units, format hints. */
  hint?: string;
  /** Required for type "select". */
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface AreaFormModalProps {
  isOpen: boolean;
  title: string;
  fields: AreaFormField[];
  /** A save is in flight. */
  loading: boolean;
  /** The record is still being fetched - fields are seeded but not yet real. */
  isLoadingRecord?: boolean;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}

const AreaFormModal: React.FC<AreaFormModalProps> = ({
  isOpen,
  title,
  fields,
  loading,
  isLoadingRecord = false,
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

      {isLoadingRecord && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 cursor-default">
          {t("crud.common.loading_records")}
        </div>
      )}

      <div className="space-y-4">
        {fields.map(field => {
          // While the record is loading the fields hold placeholder state, so
          // editing them would be edits against the wrong record.
          const disabled = field.disabled || isLoadingRecord;

          return (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {field.label}
            </label>

            {field.type === "toggle" && (
              // Deliberately a controlled checkbox rather than core's Switch:
              // Switch seeds useState(defaultChecked) and never resyncs, and these
              // modals stay mounted with `isOpen` toggling visibility, so opening a
              // second record would keep showing the first one's value. crm/Form can
              // use Switch only because its callers mount it conditionally.
              <label className="mt-1 flex items-center gap-2 cursor-pointer select-none">
                <input
                  id={field.key}
                  type="checkbox"
                  checked={field.value === "true"}
                  disabled={disabled}
                  onChange={event => field.onChange(String(event.target.checked))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {field.placeholder}
                </span>
              </label>
            )}

            {field.type === "select" && (
              <Select
                value={field.value || ""}
                onChange={value => field.onChange(value)}
                options={field.options || []}
                placeholder={field.placeholder}
                className="cursor-pointer"
                disabled={disabled}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                id={field.key}
                rows={4}
                placeholder={field.placeholder}
                value={field.value}
                disabled={disabled}
                onChange={event => field.onChange(event.target.value)}
                className="dark:bg-dark-900 h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm font-mono text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            )}

            {(field.type === "text" || field.type === "number") && (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                disabled={disabled}
                onChange={event => field.onChange(event.target.value)}
              />
            )}

            {field.error
              ? <span className="text-red-500 dark:text-red-400 text-xs">{field.error}</span>
              : field.hint && <span className="text-gray-500 dark:text-gray-400 text-xs">{field.hint}</span>}
          </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <Button onClick={onReset} variant="outline">
            {t("crud.area.action.button.reset")}
          </Button>
          <Button
            onClick={onSave}
            variant="primary"
            disabled={loading || isLoadingRecord}
            className={`${(loading || isLoadingRecord) && "cursor-not-allowed disabled"}`}
          >
            {!loading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AreaFormModal;
