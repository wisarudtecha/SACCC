// /src/config/theme.config.ts
/**
 * @fileoverview Enhanced Theme Configuration for Case Management System
 * 
 * @description
 * Comprehensive theme configuration that integrates CSS custom properties 
 * with TailwindCSS and extends the existing ThemeContext system.
 * Provides type-safe theme tokens and design system foundation.
 * 
 * @author Claude Sonnet 4
 * @version 1.0.0
 * @created 2025-08-08
 */

export type ThemeMode = "light" | "dark";
export type ThemeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "light" | "dark";
export type ComponentSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
export type ComponentVariant = "solid" | "outline" | "ghost";
export type ComponentColor = "primary" | "success" | "warning" | "error" | "info";

/**
 * Brand Colors - Maps to CSS custom properties from _variables.css
 */
export const brandColors = {
  mioc: {
    primary: {
      0: "var(--brand-mioc-primary-0)", // #0bcfce
      100: "var(--brand-mioc-primary-100)", // #00fff7
      200: "var(--brand-mioc-primary-200)", // #cbfffd
    },
    secondary: {
      0: "var(--brand-mioc-secondary-0)", // #3bada9
      100: "var(--brand-mioc-secondary-100)", // #114a50
    },
  },
  metthier: {
    primary: {
      0: "var(--brand-metthier-primary-0)", // #fd6e2b
      100: "var(--brand-metthier-primary-100)", // #ff8311
      200: "var(--brand-metthier-primary-200)", // #ff5709
    },
    secondary: {
      0: "var(--brand-metthier-secondary-0)", // #473366
      100: "var(--brand-metthier-secondary-100)", // #6762c0
    },
  },
} as const;

/**
 * Status Colors for Case Management
 */
export const statusColors = {
  success: {
    0: "var(--status-success-0)", // #5dd597
    100: "var(--status-success-100)", // #22aa79
  },
  warning: {
    0: "var(--status-warning-0)", // #ffa857
    100: "var(--status-warning-100)", // #c17732
  },
  error: {
    0: "var(--status-error-0)", // #fa4e52
    100: "var(--status-error-100)", // #9d3b47
  },
  high: {
    0: "var(--status-high-0)", // #ff7c44
    100: "var(--status-high-100)", // #d35d2a
  },
  critical: {
    0: "var(--status-critical-0)", // #7d4eff
    100: "var(--status-critical-100)", // #6233e3
  },
  info: {
    0: "var(--status-info-0)", // #47bdff
    100: "var(--status-info-100)", // #1c445d
  },
  correct: {
    0: "var(--status-correct-0)", // #4fce66
  },
  disabled: {
    0: "var(--status-disabled-0)", // #8b9db3
  },
  vip: "var(--status-vip)", // #e1ab5a
} as const;

/**
 * Typography System
 */
export const typography = {
  fontFamilies: {
    primary: "var(--font-families-sf-thonburi)",
  },
  fontSizes: {
    0: "var(--font-size-0)", // 16px
    1: "var(--font-size-1)", // 16px  
    2: "var(--font-size-2)", // 14px
    3: "var(--font-size-3)", // 14px
  },
  fontWeights: {
    regular: "var(--font-weights-sf-thonburi-0)",
    bold: "var(--font-weights-sf-thonburi-1)",
  },
  lineHeights: {
    0: "var(--line-heights-0)", // 22
    1: "var(--line-heights-1)", // 22
    2: "var(--line-heights-2)", // 18
    3: "var(--line-heights-3)", // 18
  },
} as const;

/**
 * Component Size Mappings
 */
export const componentSizes = {
  xs: {
    padding: "px-2 py-1",
    text: "text-xs",
    height: "h-6",
  },
  sm: {
    padding: "px-3 py-1.5",
    text: "text-sm",
    height: "h-8",
  },
  md: {
    padding: "px-4 py-2",
    text: "text-base",
    height: "h-10",
  },
  lg: {
    padding: "px-6 py-3",
    text: "text-lg",
    height: "h-12",
  },
  xl: {
    padding: "px-8 py-4",
    text: "text-xl",
    height: "h-14",
  },
} as const;

/**
 * Shadow System
 */
export const shadows = {
  xs: "var(--shadow-theme-xs)",
  sm: "var(--shadow-theme-sm)",
  md: "var(--shadow-theme-md)",
  lg: "var(--shadow-theme-lg)",
  xl: "var(--shadow-theme-xl)",
  button: {
    primary: "var(--shadow-button-primary)",
    secondary: "var(--shadow-button-secondary)",
    active: "var(--shadow-button-active)",
    success: "var(--shadow-button-success)",
  },
  focus: "var(--shadow-focus-ring)",
} as const;

/**
 * Spacing System
 */
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem",  // 8px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  "2xl": "3rem", // 48px
} as const;

/**
 * Border Radius System  
 */
export const borderRadius = {
  none: "0",
  sm: "0.125rem",   // 2px
  md: "0.25rem",    // 4px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  full: "9999px",
} as const;

/**
 * Case Priority Colors and Mappings
 */
export const casePriorityConfig = {
  1: { 
    label: "Critical", 
    color: statusColors.critical[0],
    bgColor: "bg-critical-500/10",
    textColor: "text-critical-500",
    borderColor: "border-critical-500",
  },
  2: { 
    label: "High", 
    color: statusColors.high[0],
    bgColor: "bg-high-500/10",
    textColor: "text-high-500",
    borderColor: "border-high-500",
  },
  3: { 
    label: "Medium", 
    color: statusColors.warning[0],
    bgColor: "bg-warning-500/10",
    textColor: "text-warning-500",
    borderColor: "border-warning-500",
  },
  4: { 
    label: "Low", 
    color: statusColors.info[0],
    bgColor: "bg-info-500/10",
    textColor: "text-info-500",
    borderColor: "border-info-500",
  },
  5: { 
    label: "Minimal", 
    color: statusColors.disabled[0],
    bgColor: "bg-disabled-500/10",
    textColor: "text-disabled-500",
    borderColor: "border-disabled-500",
  },
} as const;

/**
 * Case Status Configuration
 */
export const caseStatusConfig = {
  open: {
    label: "Open",
    color: statusColors.info[0],
    bgColor: "bg-info-500/10",
    textColor: "text-info-500",
  },
  in_progress: {
    label: "In Progress",
    color: statusColors.warning[0],
    bgColor: "bg-warning-500/10",
    textColor: "text-warning-500",
  },
  under_review: {
    label: "Under Review",
    color: brandColors.mioc.primary[0],
    bgColor: "bg-primary-500/10",
    textColor: "text-primary-500",
  },
  resolved: {
    label: "Resolved",
    color: statusColors.success[0],
    bgColor: "bg-success-500/10",
    textColor: "text-success-500",
  },
  closed: {
    label: "Closed",
    color: statusColors.disabled[0],
    bgColor: "bg-disabled-500/10",
    textColor: "text-disabled-500",
  },
  escalated: {
    label: "Escalated",
    color: statusColors.critical[0],
    bgColor: "bg-critical-500/10",
    textColor: "text-critical-500",
  },
} as const;

/**
 * Animation Presets
 */
export const animations = {
  transition: {
    fast: "transition-all duration-150 ease-in-out",
    normal: "transition-all duration-200 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
  },
  hover: {
    scale: "hover:scale-105",
    lift: "hover:-translate-y-1",
    glow: "hover:shadow-lg",
  },
  focus: {
    ring: "focus:ring-2 focus:ring-primary-500/20",
    outline: "focus:outline-none focus:ring-2 focus:ring-offset-2",
  },
} as const;

/**
 * Component Variant Configurations
 */
export const componentVariants = {
  button: {
    solid: "bg-primary-500 text-white hover:bg-primary-600",
    outline: "border border-primary-500 text-primary-500 hover:bg-primary-50",
    ghost: "text-primary-500 hover:bg-primary-50",
    light: "bg-primary-50 text-primary-700 hover:bg-primary-100",
    gradient: "bg-gradient-to-r from-primary-500 to-secondary-500 text-white",
  },
  card: {
    solid: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    outline: "border-2 border-primary-200 bg-transparent",
    ghost: "bg-gray-50/50 dark:bg-gray-800/50",
    light: "bg-primary-50/30 border border-primary-100",
    gradient: "bg-gradient-to-br from-primary-50 to-secondary-50",
  },
  badge: {
    solid: "bg-primary-500 text-white",
    outline: "border border-primary-500 text-primary-500 bg-transparent",
    ghost: "text-primary-600 bg-transparent",
    light: "bg-primary-100 text-primary-700",
    gradient: "bg-gradient-to-r from-primary-500 to-secondary-500 text-white",
  },
} as const;

/**
 * Utility function to get theme-aware classes
 */
export const getThemeClasses = (
  variant: ThemeVariant,
  component: keyof typeof componentVariants,
  style: ComponentVariant
): string => {
  const baseClasses = componentVariants[component][style];
  return baseClasses.replace(/primary/g, variant);
};

/**
 * Utility function to get case priority styling
 */
export const getCasePriorityClasses = (priority: keyof typeof casePriorityConfig) => {
  return casePriorityConfig[priority] || casePriorityConfig[3];
};

/**
 * Utility function to get case status styling
 */
export const getCaseStatusClasses = (status: keyof typeof caseStatusConfig) => {
  return caseStatusConfig[status] || caseStatusConfig.open;
};

/**
 * Default theme configuration
 */
export const defaultTheme = {
  mode: "light" as ThemeMode,
  primaryColor: brandColors.mioc.primary[0],
  secondaryColor: brandColors.mioc.secondary[0],
  accentColor: brandColors.metthier.primary[0],
  borderRadius: borderRadius.lg,
  spacing: spacing.md,
  shadows: shadows.md,
  typography: typography,
} as const;

export type ThemeConfig = typeof defaultTheme;
