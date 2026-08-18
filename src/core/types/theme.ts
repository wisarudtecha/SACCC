// /src/types/theme.ts
/**
 * @fileoverview Theme Provider for Case Management System
 * @description Manages theme state, design tokens, and provides theme context
 * @author Claude Sonnet 4
 * @created 2025-08-08
 * @version 1.0.0
 */

import { 
  ThemeMode,
  ComponentSize,
  ThemeConfig,
  statusColors,
  casePriorityConfig,
  caseStatusConfig
} from "@/core/config/theme.config";

export type Theme = "light" | "dark" | "mioc" | "metthier";

export type ThemeVariant = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
};
export type ThemeContextType = {
  theme: Theme;
  variant: ThemeVariant;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isInitialized: boolean;
};

/**
 * Enhanced Theme Context Type Definition
 */
export interface EnhancedThemeContextType {
  // Base theme properties (from existing ThemeContext)
  theme: ThemeMode;
  toggleTheme: () => void;
  
  // Enhanced theme properties
  config: ThemeConfig;
  updateConfig: (updates: Partial<ThemeConfig>) => void;
  resetToDefault: () => void;
  
  // Color utilities
  getColor: (variant: ThemeVariant, shade?: string | number) => string;
  getBrandColor: (brand: "mioc" | "metthier", type: "primary" | "secondary", shade?: string | number) => string;
  getStatusColor: (status: keyof typeof statusColors, shade?: string | number) => string;
  
  // Component utilities
  getComponentClasses: (
    component: "button" | "badge",
    size?: ComponentSize,
    color?: ThemeVariant
  ) => string;
  
  // Case management utilities
  getCasePriorityClasses: (priority: 1 | 2 | 3 | 4 | 5) => typeof casePriorityConfig[keyof typeof casePriorityConfig];
  getCaseStatusClasses: (status: keyof typeof caseStatusConfig) => typeof caseStatusConfig[keyof typeof caseStatusConfig];
  
  // Theme state
  isLoading: boolean;
  isDark: boolean;
  
  // Accessibility
  prefersReducedMotion: boolean;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

/**
 * Enhanced Theme Provider Props
 */
export interface EnhancedThemeProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<ThemeConfig>;
  enablePersistence?: boolean;
  storageKey?: string;
}
