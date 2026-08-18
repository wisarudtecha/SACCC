// /src/hooks/useLanguage.ts
import { useContext } from "react";
import { LanguageContext } from "@/core/context/LanguageContextObject";
import type { I18nContextType } from "@/core/types/i18n";

export function useLanguage(): I18nContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
