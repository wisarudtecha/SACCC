// /src/hooks/useTranslation.ts
import { useLanguage } from "./useLanguage";
import type { TranslationKey, TranslationParams } from "../types/i18n";

export function useTranslation() {
	const { t, language, setLanguage, languages, isLoading } = useLanguage();

  const translate = (key: TranslationKey, params?: TranslationParams): string => {
    return t(key, params);
  };

  return {
    t: translate,
    language,
    setLanguage,
    languages,
		isLoading,
    isRTL: false, // Add RTL support if needed
  };
}

// Alternative shorter hook name
export const useT = useTranslation;
