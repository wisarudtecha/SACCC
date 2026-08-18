// One collapsible level inside the boundary picker: search, select all / clear,
// and the checkbox list itself.
//
// Split out of BoundaryPickerPanel because the list has real behaviour of its
// own (filtering, counts, swatches) and the panel is otherwise just a shell with
// a footer. It also keeps both files inside the repo's file-size guidance.
//
// The search box is not decoration. Bangkok alone has 180 sub-districts, and the
// country-wide dataset the BFF will serve has ~7,255 - scrolling is not a viable
// way to find one.
import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { boundarySwatchCss } from "./boundaryColors";
import { boundaryOptionName, type AdminLevel, type BoundaryOption } from "./boundaryTypes";

interface BoundaryLevelSectionProps {
  level: AdminLevel;
  labelKey: string;
  options: readonly BoundaryOption[];
  selectedCodes: readonly string[];
  onToggleCode: (level: AdminLevel, code: string) => void;
  onSetCodes: (level: AdminLevel, codes: readonly string[]) => void;
  isDarkTheme: boolean;
  /** Only one section starts open, so the panel is not a wall of checkboxes. */
  defaultOpen?: boolean;
}

/** Show the filter box only once the list is long enough to need one. */
const SEARCH_THRESHOLD = 12;

function BoundaryLevelSectionBase({
  level,
  labelKey,
  options,
  selectedCodes,
  onToggleCode,
  onSetCodes,
  isDarkTheme,
  defaultOpen = false
}: BoundaryLevelSectionProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [term, setTerm] = useState("");

  const selected = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  // Match on the displayed name and on the code, so a user who knows the area
  // code can type it directly.
  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) => {
      const name = boundaryOptionName(option, language).toLowerCase();
      return name.includes(needle) || option.code.includes(needle);
    });
  }, [options, term, language]);

  const allCodes = useMemo(() => options.map((option) => option.code), [options]);
  const label = t(labelKey);

  return (
    <div className="border-b border-gray-200 last:border-b-0 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-1.5 text-left text-xs font-medium text-gray-800 dark:text-gray-100"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{label}</span>
          <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
            {selectedCodes.length}/{options.length}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onSetCodes(level, allCodes)}
            disabled={options.length === 0 || selectedCodes.length === options.length}
            className="rounded px-1.5 py-0.5 text-[10px] text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {t("case.display.map_boundary_select_all")}
          </button>
          <button
            type="button"
            onClick={() => onSetCodes(level, [])}
            disabled={selectedCodes.length === 0}
            className="rounded px-1.5 py-0.5 text-[10px] text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {t("case.display.map_boundary_clear")}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-2">
          {options.length > SEARCH_THRESHOLD && (
            <div className="relative mb-1.5">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t("case.display.map_boundary_search")}
                className="w-full rounded border border-gray-200 bg-white py-1 pl-7 pr-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          {/* Bounded height so a 180-item list cannot push the footer's Apply
              button off the bottom of the map. */}
          <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
            {visible.length === 0 && (
              <p className="py-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
                {options.length === 0
                  ? t("case.display.map_boundary_no_parent")
                  : t("case.display.map_boundary_no_match")}
              </p>
            )}

            {visible.map((option) => {
              const isChecked = selected.has(option.code);
              return (
                <label
                  key={option.code}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleCode(level, option.code)}
                    className="h-3.5 w-3.5 shrink-0 accent-blue-600"
                  />
                  {/* Matches the polygon's fill on the map, so the list and the
                      map can be read against each other. */}
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: boundarySwatchCss(option.color, isDarkTheme) }}
                  />
                  <span className="truncate">{boundaryOptionName(option, language)}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const BoundaryLevelSection = memo(BoundaryLevelSectionBase);
BoundaryLevelSection.displayName = "BoundaryLevelSection";

export default BoundaryLevelSection;
