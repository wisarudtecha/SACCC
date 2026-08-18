// /src/types/i18n.ts
// import type { TranslationKeys, Language } from "../config/i18n";
import type { Language } from '../config/i18n';

// export type NestedKeyOf<ObjectType extends object> = {
//   [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
//     ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
//     : `${Key}`;
// }[keyof ObjectType & (string | number)];

// export type TranslationKey = NestedKeyOf<TranslationKeys>;

// Flexible translation key type - allows any string
export type TranslationKey = string;

export interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  languages: { code: Language; name: string; nativeName: string }[];
  isLoading: boolean;
}

export interface TranslationParams {
  [key: string]: string | number;
}
