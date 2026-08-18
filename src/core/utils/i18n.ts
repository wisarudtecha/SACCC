// /src/utils/i18n.ts
// import { loadTranslations, type Language } from "../config/i18n";
import { 
  loadTranslations,
  preloadAllTranslations,
  getTranslations,
  isTranslationsReady,
  type Language
} from "@/core/config/i18n";
import type { TranslationKey, TranslationParams } from "@/core//types/i18n";

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

export function interpolate(text: string, params?: TranslationParams): string {
  if (!params) {
    return text;
  }
  
  return Object.entries(params).reduce((result, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    return result.replace(regex, String(value));
  }, text);
}

// export async function translate(
//   language: Language,
//   key: TranslationKey,
//   params?: TranslationParams
// ): Promise<string> {
//   try {
//     const translations = await loadTranslations(language);
//     const translation = getNestedValue(translations, key);
//     return interpolate(translation, params);
//   }
//   catch (error) {
//     console.error("Translation error:", error);
//     return key; // Return key as fallback
//   }
// }
export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams
): string {
  const translations = getTranslations(language);
  if (!translations || Object.keys(translations).length === 0) {
    return key; // Return key as fallback
  }
  
  const translation = getNestedValue(translations, key);
  return interpolate(translation, params);
}

export function getBrowserLanguage(): Language {
  const browserLang = navigator.language.slice(0, 2) as Language;
  return ["th", "en", "cn"].includes(browserLang) ? browserLang : "th";
}

export function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem("language") as Language;
    // return ["th", "en", "cn"].includes(stored) ? stored : null;
    return ["th", "en", "cn"].includes(stored) ? stored : "th";
  }
  catch {
    // return null;
    return "th";
  }
}

export function setStoredLanguage(language: Language): void {
  try {
    // localStorage.setItem("language", language);
    localStorage.setItem("language", language || "th");
  }
  catch {
    // Handle localStorage not available
  }
}

// Re-export from config for convenience
export {
  loadTranslations,
  preloadAllTranslations,
  getTranslations,
  isTranslationsReady,
};
