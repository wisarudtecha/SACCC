// /src/components/header/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from '@/core/hooks/useTranslation';

interface LanguageSwitcherProps {
  className?: string;
  showNative?: boolean;
}

export function LanguageSwitcher({ className = '', showNative = true }: LanguageSwitcherProps) {
  const { language, setLanguage, languages } = useTranslation();

  return (
    <select
      value={language}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as typeof language)}
      className={`language-switcher ${className}`}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {showNative ? lang.nativeName : lang.name}
        </option>
      ))}
    </select>
  );
}
