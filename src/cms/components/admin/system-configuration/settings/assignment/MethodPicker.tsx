// Shared control for the two Assignment Rules subsections: a single-select enum
// picker (the core native <Select>) plus a static reference list of every option
// and its description, so an admin can see what each choice means before picking
// it. Mirrors the FieldRow + Select shape from map/AutoManualField.tsx and reuses
// the map subsections' SubsectionCard / FieldRow chrome.
import Select from "@/core/components/form/Select";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FieldRow, SubsectionCard } from "../map/settingsControls";

export interface MethodOption<T extends string> {
  value: T;
  labelKey: string;
  descKey: string;
}

interface MethodPickerProps<T extends string> {
  titleKey: string;
  labelKey: string;
  helpKey: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<MethodOption<T>>;
}

export function MethodPicker<T extends string>({
  titleKey,
  labelKey,
  helpKey,
  value,
  onChange,
  options,
}: MethodPickerProps<T>) {
  const { t } = useTranslation();

  return (
    <SubsectionCard titleKey={titleKey}>
      <FieldRow labelKey={labelKey} helpKey={helpKey}>
        <Select
          className="w-64"
          value={value}
          onChange={(next) => onChange(next as T)}
          options={options.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
      </FieldRow>

      <ul className="flex flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {options.map((option) => (
          <li key={option.value}>
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {t(option.labelKey)}
            </span>
            {" — "}
            {t(option.descKey)}
          </li>
        ))}
      </ul>
    </SubsectionCard>
  );
}
