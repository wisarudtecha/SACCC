// /src/components/ui/card/Card.tsx
import { ReactNode, HTMLAttributes } from "react";
import { useTheme } from "@/core/hooks/useTheme";

type CardProps = {
  variant?: "default" | "elevated" | "interactive" | "outlined";
  size?: "sm" | "default" | "lg" | "xl";
  status?: "none" | "success" | "warning" | "error" | "info" | "critical";
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export const Card = ({ 
  variant = "default",
  size = "default",
  status = "none",
  header,
  footer,
  loading = false,
  children,
  className = "",
  ...props 
}: CardProps) => {
  const { variant: themeVariant } = useTheme();
  
  const baseStyles = "rounded-xl border transition-all duration-200";
  
  const variants = {
    default: `bg-[${themeVariant.surface}] border-[${themeVariant.border}] text-[${themeVariant.text}]`,
    elevated: `bg-[${themeVariant.surface}] border-[${themeVariant.border}] text-[${themeVariant.text}] shadow-lg hover:shadow-xl`,
    interactive: `bg-[${themeVariant.surface}] border-[${themeVariant.border}] text-[${themeVariant.text}] cursor-pointer hover:shadow-lg hover:-translate-y-1`,
    outlined: `bg-[${themeVariant.surface}] border-2 border-[${themeVariant.border}] text-[${themeVariant.text}]`,
  };
  
  const sizes = {
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
    xl: "p-10"
  };
  
  const statusStyles = {
    none: "",
    success: "border-l-4 border-l-green-500",
    warning: "border-l-4 border-l-orange-500",
    error: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-blue-500",
    critical: "border-l-4 border-l-purple-500"
  };
  
  if (loading) {
    return (
      <div className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${statusStyles[status]} ${className}`} {...props}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${statusStyles[status]} ${className}`} {...props}>
      {header && (
        <div className={`border-b border-[${themeVariant.border}] pb-4 mb-4`}>
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className={`border-t border-[${themeVariant.border}] pt-4 mt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
};
