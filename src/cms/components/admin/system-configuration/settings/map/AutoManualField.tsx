// The mode toggle for a staff Auto/Manual setting, plus the interval input that
// lives (separately) behind the Staff subsection's shared "Advanced" disclosure.
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AutoManualMode } from "@/core/types/organization";
import { AUTO_INTERVAL_MIN_SECONDS } from "@/cms/utils/orgMapSettings";
import { FieldRow } from "./settingsControls";

interface AutoManualFieldProps {
  labelKey: string;
  helpKey?: string;
  mode: AutoManualMode;
  onModeChange: (mode: AutoManualMode) => void;
}

/** "Manual" / "Auto" selector for one staff setting. */
export function AutoManualField({ labelKey, helpKey, mode, onModeChange }: AutoManualFieldProps) {
  const { t } = useTranslation();
  return (
    <FieldRow labelKey={labelKey} helpKey={helpKey}>
      <Select
        className="w-40"
        value={mode}
        onChange={(value) => onModeChange(value === "auto" ? "auto" : "manual")}
        options={[
          { value: "manual", label: t("settings.map.field.mode_manual") },
          { value: "auto", label: t("settings.map.field.mode_auto") },
        ]}
      />
    </FieldRow>
  );
}

interface IntervalFieldProps {
  labelKey: string;
  value: number | null;
  onChange: (value: number | null) => void;
  errorKey?: string;
  /** The interval only matters while mode = "auto"; disabled (greyed) otherwise. */
  disabled: boolean;
}

/** Numeric "auto interval (seconds)" input, rendered inside the Advanced disclosure. */
export function IntervalField({ labelKey, value, onChange, errorKey, disabled }: IntervalFieldProps) {
  return (
    <FieldRow labelKey={labelKey} errorKey={errorKey}>
      <Input
        type="number"
        className="w-40"
        min={String(AUTO_INTERVAL_MIN_SECONDS)}
        step={1}
        disabled={disabled}
        error={Boolean(errorKey)}
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value.trim();
          onChange(next === "" ? null : Number(next));
        }}
      />
    </FieldRow>
  );
}
