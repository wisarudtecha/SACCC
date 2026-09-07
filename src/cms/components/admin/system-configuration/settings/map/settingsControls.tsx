// Small shared presentational pieces for the Map Settings subsections. Kept in
// one file so every group renders an identical row / card / error treatment.
import type { ReactNode } from "react";
import Switch from "@/core/components/form/switch/Switch";
import { useTranslation } from "@/core/hooks/useTranslation";

interface SubsectionCardProps {
  titleKey: string;
  children: ReactNode;
}

/** One field group (general / layers / incident / staff / assignment). */
export function SubsectionCard({ titleKey, children }: SubsectionCardProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        {t(titleKey)}
      </h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

interface FieldRowProps {
  labelKey: string;
  helpKey?: string;
  /** Extra note under the control (e.g. the showPlace "in development" line). */
  note?: ReactNode;
  errorKey?: string;
  children: ReactNode;
}

/** A labelled row: label + help text on the left, the control on the right. */
export function FieldRow({ labelKey, helpKey, note, errorKey, children }: FieldRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="sm:max-w-md">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(labelKey)}</p>
        {helpKey && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t(helpKey)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        {children}
        {note && <div className="text-xs text-gray-500 dark:text-gray-400">{note}</div>}
        {errorKey && (
          <span className="text-xs text-red-500 dark:text-red-400">{t(errorKey)}</span>
        )}
      </div>
    </div>
  );
}

interface ToggleRowProps {
  labelKey: string;
  helpKey?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  note?: ReactNode;
}

/** The common case: a labelled row whose control is a single Switch. */
export function ToggleRow({
  labelKey,
  helpKey,
  checked,
  onChange,
  disabled = false,
  note,
}: ToggleRowProps) {
  return (
    <FieldRow labelKey={labelKey} helpKey={helpKey} note={note}>
      <Switch label="" checked={checked} disabled={disabled} onChange={onChange} />
    </FieldRow>
  );
}
