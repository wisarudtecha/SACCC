// Map-local theme/language override, layered on top of the app's global
// ThemeContext/LanguageContext.
//
// Picking a theme/language from the map's BasemapSwitcher should change only
// the map (basemap style, Esri/MapTiler/Longdo tile language) - not the whole
// app. Picking one from the SuperTopbar should still change the whole app, AND
// win over any active map-local override (the map goes back to following
// global).
//
// The map never writes to the global contexts itself once this hook is wired
// in (BasemapSwitcher's selection handlers call setThemeOverride/
// setLanguageOverride instead of toggleTheme/setLanguage - see
// BoundaryMapField). That makes any OBSERVED change to globalTheme/
// globalLanguage unambiguously external (topbar, or any other future global
// writer), so clearing the override on such a change is sufficient - no
// "did I just write this" ref-diffing needed.
import { useEffect, useState } from "react";
import { useTheme } from "@/core/context/ThemeContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Language } from "@/core/config/i18n";

export interface UseMapThemeOverrideResult {
  effectiveTheme: "light" | "dark";
  effectiveLanguage: Language;
  setThemeOverride: (theme: "light" | "dark") => void;
  setLanguageOverride: (language: Language) => void;
}

export function useMapThemeOverride(): UseMapThemeOverrideResult {
  const { theme: globalTheme } = useTheme();
  const { language: globalLanguage } = useTranslation();
  const [themeOverride, setThemeOverride] = useState<"light" | "dark" | null>(null);
  const [languageOverride, setLanguageOverride] = useState<Language | null>(null);

  // A global change is by definition topbar-originated (the map only ever
  // writes to the override setters above) - clear the override so the map
  // resumes following global. Without this, a stale override would never be
  // clearable from the topbar.
  useEffect(() => {
    setThemeOverride(null);
  }, [globalTheme]);

  useEffect(() => {
    setLanguageOverride(null);
  }, [globalLanguage]);

  return {
    effectiveTheme: themeOverride ?? globalTheme,
    effectiveLanguage: languageOverride ?? globalLanguage,
    setThemeOverride,
    setLanguageOverride
  };
}
