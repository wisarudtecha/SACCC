// /src/config/i18n.ts
// export const translationKeys = {...} as const;

export type Language = "th" | "en" | "cn";
// export type TranslationKeys = typeof translationKeys;

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "cn", name: "Chinese", nativeName: "中文" }
];

export const defaultLanguage: Language = "th";

// Translation storage
const translationCache = new Map<Language, Record<string, string>>();
let isInitialized = false;

export async function loadTranslations(language: Language): Promise<Record<string, string>> {
  if (translationCache.has(language)) {
    return translationCache.get(language) ?? {};
  }

  try {
    const response = await fetch(`/i18n/${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${language} translations`);
    }
    const translations = await response.json();
    translationCache.set(language, translations);
    return translations;
  }
  catch (error) {
    console.error(`Error loading ${language} translations:`, error);
    // Return empty object as fallback
    return {};
  }
}

// Preload all translations for smooth language switching
export async function preloadAllTranslations(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Promise.all(
      languages.map(lang => loadTranslations(lang.code))
    );
    isInitialized = true;
  }
  catch (error) {
    console.error("Error preloading translations:", error);
  }
}

// export function getTranslations(language: Language): any {
//   return translationCache.get(language) || {};
// }
export function getTranslations(language: Language): Record<string, string> {
  return translationCache.get(language) || {};
}

export function isTranslationsReady(): boolean {
  return isInitialized && languages.every(lang => translationCache.has(lang.code));
}
