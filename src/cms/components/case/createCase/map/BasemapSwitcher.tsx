// "Layers" control for picking the map's basemap (street / satellite), plus a
// theme/language shortcut for while the large map is open.
//
// Deliberately a plain React control rather than an Esri widget: BasemapToggle
// and BasemapGallery are @deprecated in @arcgis/core 5.x and scheduled for
// removal, and Esri widgets render with the light Esri theme, which looks wrong
// against this app's dark mode. Building it here also lets the labels go through
// the app's own translation catalogues.
//
// This component knows nothing about ArcGIS - it just reports the chosen option.
//
// Theme and language sections read/write the SAME global contexts SuperTopbar's
// own controls use (ThemeContext, LanguageContext via useTranslation) rather
// than owning any map-scoped state. That is what the modal-covers-SuperTopbar
// problem actually needed: the expanded map's MapView already applies theme and
// language changes in place (see applyBasemap in ArcgisAddressMap and
// useAdminBoundaryLayers), so once the global state is reachable from inside
// the modal, the map catching up "for free" and staying in sync with SuperTopbar
// (in both directions) comes along with it - no separate map-local setting, no
// clearing-on-refresh logic, since it IS the same persisted preference.
import { memo, useCallback, useEffect, useState } from "react";
import { Check, Layers } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Language } from "@/core/config/i18n";
import { mapControlRevealClass } from "./mapControlStyles";
import { BASEMAP_OPTIONS, BasemapOptionId } from "./basemaps";

interface BasemapSwitcherProps {
  value: BasemapOptionId;
  onChange: (id: BasemapOptionId) => void;
  /**
   * Icon-only until hovered or focused, for the small maps where a labelled
   * control covers the map it belongs to. The label also stays out while the
   * menu is open - collapsing the trigger the moment the user clicks it would
   * shift the menu it is anchored to.
   */
  compact?: boolean;
  /**
   * Extra classes for the control. It stays a positioned element either way -
   * the option list is absolutely positioned against it.
   */
  className?: string;
}

function BasemapSwitcherBase({
  value,
  onChange,
  compact = false,
  className = ""
}: BasemapSwitcherProps) {
  const { t, language, setLanguage, languages } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  // Dropdown dismisses on outside click but not on keyboard.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = useCallback(
    (id: BasemapOptionId) => {
      onChange(id);
      setIsOpen(false);
    },
    [onChange]
  );

  // ThemeContext exposes only a toggle, not a setter - only flip it when the
  // clicked option differs from the current theme, so re-picking the active
  // one is a no-op rather than bouncing back to the other theme.
  const handleSelectTheme = useCallback(
    (nextTheme: "light" | "dark") => {
      if (nextTheme !== theme) {
        toggleTheme();
      }
      setIsOpen(false);
    },
    [theme, toggleTheme]
  );

  const handleSelectLanguage = useCallback(
    (code: Language) => {
      setLanguage(code);
      setIsOpen(false);
    },
    [setLanguage]
  );

  const label = t("case.display.map_basemap");
  const isLabelVisible = !compact || isOpen || isHovered || isFocused;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* `dropdown-toggle` is required by Dropdown's outside-click handler so
          that clicking this button toggles rather than instantly re-closing. */}
      <button
        type="button"
        onClick={toggleMenu}
        title={label}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="dropdown-toggle flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <Layers className="h-3.5 w-3.5 shrink-0" />
        {compact ? (
          <span className={mapControlRevealClass(isLabelVisible)}>{label}</span>
        ) : (
          <span className="hidden sm:inline">{label}</span>
        )}
      </button>

      {/* Opens downward: the control sits in the map's top-right toolbar row. */}
      <Dropdown isOpen={isOpen} onClose={closeMenu} className="top-full w-48 p-1">
        {BASEMAP_OPTIONS.map((option) => {
          const isActive = option.id === value;
          return (
            <DropdownItem
              key={option.id}
              tag="button"
              onItemClick={() => handleSelect(option.id)}
              // baseClassName is replaced rather than extended - DropdownItem's
              // default has no dark-mode variants and sets `display: block`,
              // which would fight the flex layout used here.
              baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span>{t(option.labelKey)}</span>
              {isActive && <Check className="h-4 w-4 shrink-0" />}
            </DropdownItem>
          );
        })}

        <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
        <div className="px-3 pb-1 pt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          {t("case.display.map_settings_theme")}
        </div>
        {(["light", "dark"] as const).map((option) => {
          const isActive = option === theme;
          return (
            <DropdownItem
              key={option}
              tag="button"
              onItemClick={() => handleSelectTheme(option)}
              baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span>
                {t(
                  option === "light"
                    ? "case.display.map_settings_theme_light"
                    : "case.display.map_settings_theme_dark"
                )}
              </span>
              {isActive && <Check className="h-4 w-4 shrink-0" />}
            </DropdownItem>
          );
        })}

        <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
        <div className="px-3 pb-1 pt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          {t("case.display.map_settings_language")}
        </div>
        {languages.map((lang) => {
          const isActive = lang.code === language;
          return (
            <DropdownItem
              key={lang.code}
              tag="button"
              onItemClick={() => handleSelectLanguage(lang.code)}
              baseClassName={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <span>{lang.nativeName}</span>
              {isActive && <Check className="h-4 w-4 shrink-0" />}
            </DropdownItem>
          );
        })}
      </Dropdown>
    </div>
  );
}

export const BasemapSwitcher = memo(BasemapSwitcherBase);
BasemapSwitcher.displayName = "BasemapSwitcher";

export default BasemapSwitcher;
