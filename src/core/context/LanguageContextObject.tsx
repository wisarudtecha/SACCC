// /src/contexts/LanguageContextObject.tsx
import { createContext } from "react";
import type { I18nContextType } from "../types/i18n";

export const LanguageContext = createContext<I18nContextType | undefined>(undefined);
