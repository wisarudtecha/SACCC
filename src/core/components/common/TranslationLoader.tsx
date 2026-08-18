// /src/components/TranslationLoader.tsx
import
  // React,
  {
    ReactNode
  }
from 'react';
import { useTranslation } from '@/core/hooks/useTranslation';

interface TranslationLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TranslationLoader({ 
  children, 
  fallback = <div className="loading-translations">Loading translations...</div> 
}: TranslationLoaderProps) {
  const { isLoading } = useTranslation();
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
