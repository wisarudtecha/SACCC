// /src/cms/components/admin/system-configuration/area/AreaFormModal.tsx
/**
 * One modal for all three area levels.
 *
 * Country, province and district previously had three near-identical ~75-line
 * JSX blocks that differed only in which fields they rendered. Describing the
 * fields as data instead keeps AreaManagement readable and means a new field
 * (postcode, coordinates) is one array entry rather than three copy-pastes.
 *
 * Layout is part of that description: `group` sections the fields and `span`
 * sets a field's width, so grouping a form is an edit to its descriptors in
 * areaFormFields.ts rather than a change in here.
 */
import React, { useMemo } from "react";
import { CloseIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import Button from "@/core/components/ui/button/Button";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import BoundaryGeometryField from "@/cms/components/admin/system-configuration/geometry/BoundaryGeometryField";

export type AreaFormFieldSpan = "quarter" | "third" | "half" | "full";

/**
 * Widths as classes rather than a computed `col-span-${n}`: Tailwind scans the
 * source for literal class names, so an interpolated one is never generated.
 *
 * Two stages on purpose. The modal is ~768px at `md`, where four columns would
 * leave a country select too narrow to read, so everything below full width sits
 * two-up there and the 3- and 4-column layouts start at `lg`. Below `md` the
 * grid is a single column and every span stacks.
 */
const SPAN_CLASSES: Record<AreaFormFieldSpan, string> = {
  quarter: "md:col-span-6 lg:col-span-3",
  third: "md:col-span-6 lg:col-span-4",
  half: "md:col-span-6 lg:col-span-6",
  full: "md:col-span-12 lg:col-span-12"
};

export interface AreaFormField {
  /** Also used as the input id, so it must be unique within one modal. */
  key: string;
  label: string;
  placeholder: string;
  /**
   * "geometry" is a textarea of GeoJSON rings WITH a map to draw them on. It
   * needs no extra descriptor fields because the map is a second view of the
   * same string, not a second source of it.
   */
  type: "text" | "number" | "select" | "textarea" | "toggle" | "geometry";
  /** Toggle fields read "true"/"false"; every other type reads its raw text. */
  value: string;
  error?: string;
  /** Shown under the field when there is no error - units, format hints. */
  hint?: string;
  /** Section heading. Fields without one share an implicit leading section. */
  group?: string;
  /** Column width within the section grid. Defaults to "half". */
  span?: AreaFormFieldSpan;
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
  /**
   * Re-seeds the form from the record that was loaded into it. Passed only when
   * editing - a create has no previous state to go back to, and Reset already
   * covers "clear what I typed".
   */
  onRestore?: () => void;
  onSave: () => void;
}

/** One labelled field: the control for its type, then its messages. */
const AreaFormFieldRow: React.FC<{ field: AreaFormField; disabled: boolean }> = ({ field, disabled }) => (
  <div className={SPAN_CLASSES[field.span || "half"]}>
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

    {field.type === "geometry" && (
      <div className="mt-1">
        <BoundaryGeometryField
          id={field.key}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
          hint={field.hint}
          error={field.error}
          disabled={disabled}
        />
      </div>
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

    {/* A geometry field renders its own messages, below the textarea rather
        than below the map, so it is not given them twice. */}
    {field.type !== "geometry" && (
      field.error
        ? <span className="text-red-500 dark:text-red-400 text-xs">{field.error}</span>
        : field.hint && <span className="text-gray-500 dark:text-gray-400 text-xs">{field.hint}</span>
    )}
  </div>
);

const AreaFormModal: React.FC<AreaFormModalProps> = ({
  isOpen,
  title,
  fields,
  loading,
  isLoadingRecord = false,
  onClose,
  onReset,
  onRestore,
  onSave
}) => {
  const { t } = useTranslation();

  /**
   * Sections the fields, preserving the order they arrive in: the first field
   * carrying a group fixes where that group sits, so reordering the descriptors
   * reorders the form. Fields with no group share a leading unheaded section,
   * which is what a caller that knows nothing about groups still renders as.
   */
  const groups = useMemo(() => {
    const ordered: { title: string; fields: AreaFormField[] }[] = [];
    fields.forEach(field => {
      const title = field.group || "";
      const existing = ordered.find(group => group.title === title);
      if (existing) {
        existing.fields.push(field);
        return;
      }
      ordered.push({ title, fields: [field] });
    });
    return ordered;
  }, [fields]);

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

      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.title || "ungrouped"}>
            {group.title && (
              <h4 className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-default">
                {group.title}
              </h4>
            )}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {group.fields.map(field => (
                <AreaFormFieldRow
                  key={field.key}
                  field={field}
                  // While the record is loading the fields hold placeholder state,
                  // so editing them would be edits against the wrong record.
                  disabled={Boolean(field.disabled) || isLoadingRecord}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Leaving the form sits apart from the three buttons that act on it, and
          only the one that commits is filled - the other two are tinted outlines
          so they read as distinct without competing with it. */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose} variant="outline">
          {t("crud.common.form.action.cancel")}
        </Button>
        <div className="flex gap-3">
          {/* Reset blanks the form to create-mode defaults, which while editing
              throws the loaded record away; Restore puts it back. */}
          <Button onClick={onReset} variant="outline-warning">
            {t("crud.area.action.button.reset")}
          </Button>
          {onRestore && (
            <Button onClick={onRestore} variant="outline-info" disabled={isLoadingRecord}>
              {t("crud.area.action.button.restore")}
            </Button>
          )}
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
