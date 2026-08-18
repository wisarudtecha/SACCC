import React from 'react';

type BadgeVariant = "light" | "solid" | "outline";
type BadgeSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
export type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "critical"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "high"
  | "medium"
  | "low"
  | "ghost"; // ✅ Added new priority variants

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className,
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  const sizeStyles = {
    xxs: "text-xxs",
    xs: "text-xs",
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      secondary: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      high: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      critical: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
      low: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      ghost: "text-gray-700 dark:text-white/80",
    },
    solid: {
      primary: "bg-brand-500 text-white dark:text-white",
      secondary: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      success: "bg-success-500 text-white dark:text-white",
      error: "bg-error-500 text-white dark:text-white",
      warning: "bg-warning-500 text-white dark:text-white",
      info: "bg-blue-light-500 text-white dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white dark:text-white",
      high: "bg-orange-600 text-white dark:text-white",
      critical: "bg-red-600 text-white dark:text-white",
      medium: "bg-yellow-500 text-white dark:text-white",
      low: "bg-blue-600 text-white dark:text-white",
      ghost: "text-white dark:text-white/80",
    },
    outline: {
      primary: "border border-brand-500 text-brand-500 dark:text-brand-400",
      secondary: "border border-gray-300 text-gray-700 dark:border-white/10 dark:text-white/70",
      success: "border border-success-500 text-success-500 dark:text-success-400",
      error: "border border-error-500 text-error-500 dark:text-error-400",
      warning: "border border-warning-500 text-warning-500 dark:text-orange-400",
      info: "border border-blue-light-500 text-blue-light-500 dark:text-blue-light-400",
      light: "border border-gray-300 text-gray-700 dark:border-white/10 dark:text-white/70",
      high: "border border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400",
      dark: "border border-gray-700 text-white dark:text-white",
      critical: "border border-red-600 text-red-600 dark:border-red-400 dark:text-red-400",
      medium: "border border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400",
      low: "border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400",
      ghost: "text-gray-700 dark:text-white/70",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles} ${className || ''}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
