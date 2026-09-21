// The staff layer's filter: which officers the map shows.
//
// A small icon button that opens a two-item list - the same two modes, and the
// same labels, as the assign-officer modal's view switch ("Recommend By Skills" /
// "All Officers"). Icon-only in both map sizes: it sits beside the Staff toggle,
// and a labelled second button would double the width of a control the inline map
// has almost no room for.
//
// A list rather than a two-button switch so the label can be read in full: the
// mode names are long, and this is the one place they are shown.
import { memo, useCallback, useState } from "react";
import { Check, ListFilter } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { StaffFilterMode } from "./staffFilter";

interface StaffFilterMenuProps {
  mode: StaffFilterMode;
  onChange: (mode: StaffFilterMode) => void;
}

const MODES: readonly { value: StaffFilterMode; labelKey: string }[] = [
  { value: "recommend", labelKey: "case.assign_officer_modal.recommend_button" },
  { value: "all", labelKey: "case.assign_officer_modal.allofficer_button" }
];

function StaffFilterMenuBase({ mode, onChange }: StaffFilterMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  const label = t("case.display.map_staff_filter");

  return (
    <div className="relative flex flex-col items-end">
      {/* `dropdown-toggle` is required by Dropdown's outside-click handler: without
          it the press that opens the list is also read as an outside click. */}
      <button
        type="button"
        onClick={toggleMenu}
        title={label}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="dropdown-toggle flex items-center rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <ListFilter className="h-3.5 w-3.5 shrink-0" />
      </button>

      <Dropdown isOpen={isOpen} onClose={closeMenu} className="top-full w-52 p-1">
        {MODES.map(({ value, labelKey }) => {
          const isSelected = value === mode;
          return (
            <DropdownItem
              key={value}
              tag="button"
              onItemClick={() => {
                onChange(value);
                closeMenu();
              }}
              baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span>{t(labelKey)}</span>
              {isSelected && <Check className="h-4 w-4 shrink-0" />}
            </DropdownItem>
          );
        })}
      </Dropdown>
    </div>
  );
}

export const StaffFilterMenu = memo(StaffFilterMenuBase);
StaffFilterMenu.displayName = "StaffFilterMenu";

export default StaffFilterMenu;
