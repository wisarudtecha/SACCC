// The 3-state stage control for one case sub-type: Not set / Auto / Manual.
//
// WHY NOT A <select>: three fixed options with no search and no long labels are a
// segmented choice, not a list to open. A dropdown hides two thirds of the answer and
// costs a click per cell - and this table has two cells per row.
//
// Semantics are a real radiogroup (not three toggles): exactly one option applies, so
// `role="radiogroup"` + `role="radio"` + `aria-checked` is what a screen reader needs.
// Arrow keys move the selection, Home/End jump to the ends, and only the selected
// option is in the tab order - the standard radio behaviour, which a set of
// aria-pressed buttons does not reproduce.
//
// The look follows the app's existing segmented controls (assign-officer view switch,
// map layer controls): a recessed shell with the active option raised out of it, so it
// never reads as a plain radio dot.
import type { KeyboardEvent } from "react";
import { Bot, CircleSlash, User } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AssignmentModeToken } from "@/core/types/organization";

/** `null` is the "not set" state - the absence of an entry, not a third token. */
type StageValue = AssignmentModeToken | null;

interface StageModeControlProps {
  value: StageValue;
  onChange: (value: StageValue) => void;
  /** Screen-reader context, e.g. "101-Fire Alarm - PIC". */
  ariaLabel: string;
}

const OPTIONS: ReadonlyArray<{
  value: StageValue;
  labelKey: string;
  Icon: typeof Bot;
}> = [
  {
    value: null,
    labelKey: "settings.assignment.mode_table.option_none",
    Icon: CircleSlash,
  },
  {
    value: "auto",
    labelKey: "settings.assignment.mode_table.option_auto",
    Icon: Bot,
  },
  {
    value: "manual",
    labelKey: "settings.assignment.mode_table.option_manual",
    Icon: User,
  },
];

export function StageModeControl({ value, onChange, ariaLabel }: StageModeControlProps) {
  const { t } = useTranslation();
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = OPTIONS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = selectedIndex >= lastIndex ? 0 : selectedIndex + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = selectedIndex <= 0 ? lastIndex : selectedIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    onChange(OPTIONS[nextIndex].value);
    // Move focus with the selection, which is what a radiogroup does.
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.Icon;
        const label = t(option.labelKey);

        return (
          <button
            key={option.labelKey}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Roving tabindex: the group is one tab stop, arrows move inside it.
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
