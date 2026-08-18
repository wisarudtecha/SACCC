// /src/contexts/LanguageContext.tsx
import
  {
    useState,
    useEffect,
    ReactNode
  }
from "react";
import {
  preloadAllTranslations,
  getTranslations,
  isTranslationsReady,
  getBrowserLanguage,
  getStoredLanguage,
  setStoredLanguage
} from "../utils/i18n";
import {
  languages,
  defaultLanguage,
  // loadTranslations,
  type Language
} from "../config/i18n";
import type { I18nContextType, TranslationKey, TranslationParams } from "../types/i18n";

import { LanguageContext } from "./LanguageContextObject";

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (initialLanguage) {
      return initialLanguage;
    }
    const stored = getStoredLanguage();
    if (stored) {
      return stored;
    }
    const browser = getBrowserLanguage();
    return browser || defaultLanguage;
  });

  // const [translations, setTranslations] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // const setLanguage = async (newLanguage: Language) => {
  //   setIsLoading(true);
  //   try {
  //     const newTranslations = await loadTranslations(newLanguage);
  //     setTranslations(newTranslations);
  //     setLanguageState(newLanguage);
  //     setStoredLanguage(newLanguage);
  //     // Update document language attribute
  //     document.documentElement.lang = newLanguage;
  //   }
  //   catch (error) {
  //     console.error('Failed to load translations:', error);
  //   }
  //   finally {
  //     setIsLoading(false);
  //   }
  // };
  
  // Smooth language switching - instant once preloaded
  // const setLanguage = (newLanguage: Language) => {
  //   if (!isTranslationsReady()) {
  //     console.warn('Translations not ready yet, please wait...');
  //     return;
  //   }
  //   setLanguageState(newLanguage);
  //   setStoredLanguage(newLanguage);
  //   // Update document language attribute
  //   document.documentElement.lang = newLanguage;
  // };
  const setLanguage = async (newLanguage: Language): Promise<void> => {
    if (!isTranslationsReady()) {
      console.warn('Translations not ready yet, please wait...');
      return;
    }

    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);

    // Update document language attribute
    document.documentElement.lang = newLanguage;
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
    return path.split('.').reduce<unknown>(
      (current, key) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj
    ) as string || path;
  };

  const interpolate = (text: string, params?: TranslationParams): string => {
    if (!params) {
      return text;
    }
    
    return Object.entries(params).reduce((result, [key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      return result.replace(regex, String(value));
    }, text);
  };

  // const t = (key: TranslationKey, params?: TranslationParams): string => {
  //   if (isLoading || !translations) {
  //     return key; // Return key as fallback while loading
  //   }
  //   const translation = getNestedValue(translations, key);
  //   return interpolate(translation, params);
  // };
  const t = (key: TranslationKey, params?: TranslationParams): string => {
    // Show loading indicator only during initial load
    if (!isInitialized) {
      return 'Loading...';
    }
    
    const translations = getTranslations(language);
    if (!translations || Object.keys(translations).length === 0) {
      return key; // Return key as fallback
    }
    
    const translation = getNestedValue(translations, key);
    return interpolate(translation, params);
  };

  // Load initial translations
  // useEffect(() => {
  //   setLanguage(language);
  // }, [language]);
  // Initialize and preload all translations
  useEffect(() => {
    let mounted = true;

    const initializeTranslations = async () => {
      try {
        setIsLoading(true);
        await preloadAllTranslations();
        
        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
          // Set initial document language after translations are ready
          document.documentElement.lang = language;
        }
      } catch (error) {
        console.error('Failed to initialize translations:', error);
        if (mounted) {
          setIsInitialized(true); // Set to true anyway to prevent infinite loading
          setIsLoading(false);
        }
      }
    };

    initializeTranslations();

    return () => {
      mounted = false;
    };
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    languages,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
