import { ReactNode } from "react";
import { Variant } from "@/cms/types";

interface ButtonProps {
  children: ReactNode; // Button text or content
  // size?: "sm" | "md" ; // Button size
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl"; // Button size
  // variant?: "primary" | "outline" | "ghost"; // Button variant
  variant?: Variant; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Disabled state
  title?: string; // Button title
  role?: string; // Button role
  priority?: string;
  endIconClass?:string
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  title = "",
  role = "",
  priority = "normal",
  endIconClass = ""
}) => {
  // Size Classes
  const sizeClasses = {
    xxs: "px-3 py-1.5 text-xs",
    xs: "px-3 py-2.5 text-xs",
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-md",
    lg: "px-6 py-4 text-lg",
    xl: "px-7 py-4.5 text-xl",
  };

  const isIconOnlyChild = typeof children !== "string" && !startIcon && !endIcon;
  
  // Variant Classes
  const variantClasses = {
    primary:
      // "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
      "shadow-theme-xs bg-brand-500 text-white dark:text-white hover:bg-brand-600 disabled:bg-brand-300",
    success:
      "shadow-theme-xs bg-success-500 text-white dark:text-white hover:bg-success-600 disabled:bg-success-300",
    error:
      "shadow-theme-xs bg-error-500 text-white dark:text-white hover:bg-error-600 disabled:bg-error-300",
    warning:
      "shadow-theme-xs bg-warning-500 text-white dark:text-white hover:bg-warning-600 disabled:bg-warning-300",
    info:
      "shadow-theme-xs bg-blue-light-500 text-white dark:text-white hover:bg-blue-light-600 disabled:bg-blue-light-300",
    light:
      "shadow-theme-xs bg-gray-400 dark:bg-white/5 text-white dark:text-white/80 hover:bg-gray-500 dark:hover:bg-gray-300 disabled:bg-gray-100",
    dark:
      "shadow-theme-xs bg-gray-700 dark:bg-gray-700 text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-800 disabled:bg-gray-500",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    "outline-primary":
      "bg-white text-blue-700 ring-1 ring-inset ring-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:ring-blue-700 dark:hover:bg-white/[0.03] dark:hover:text-blue-300",
    "outline-no-transparent":
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300",
    "outline-success":
      "bg-white text-green-700 ring-1 ring-inset ring-green-300 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:ring-green-700 dark:hover:bg-white/[0.03] dark:hover:text-green-300",
    "outline-error":
      "bg-white text-red-700 ring-1 ring-inset ring-red-300 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:ring-red-700 dark:hover:bg-white/[0.03] dark:hover:text-red-300",
    "outline-warning":
      "bg-white text-yellow-700 ring-1 ring-inset ring-yellow-300 hover:bg-yellow-50 dark:bg-gray-800 dark:text-yellow-400 dark:ring-yellow-700 dark:hover:bg-white/[0.03] dark:hover:text-yellow-300",
    "outline-info":
      "bg-white text-blue-light-700 ring-1 ring-inset ring-blue-light-300 hover:bg-blue-light-50 dark:bg-gray-800 dark:text-blue-light-400 dark:ring-blue-light-700 dark:hover:bg-white/[0.03] dark:hover:text-blue-light-300",
    ghost:
      // "hover:bg-transparent bg-transparent",
      "hover:bg-transparent bg-transparent text-gray-400 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-500",
    "ghost-primary":
      "hover:bg-transparent bg-transparent text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-500",
    "ghost-success":
      "hover:bg-transparent bg-transparent text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-500",
    "ghost-error":
      "hover:bg-transparent bg-transparent text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500",
    "ghost-warning":
      "hover:bg-transparent bg-transparent text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500",
    "ghost-info":
      "hover:bg-transparent bg-transparent text-blue-light-500 dark:text-blue-light-400 hover:text-blue-light-600 dark:hover:text-blue-light-500",
    secondary:
      "shadow-theme-xs bg-gray-400 dark:bg-white/5 text-white dark:text-white/80 hover:bg-gray-500 dark:hover:bg-gray-300 disabled:bg-gray-100",
    emergency:
      "bg-red-500 dark:bg-red-400 text-white dark:text-gray-900 hover:bg-red-600 dark:hover:bg-red-300 focus:ring-red-500 dark:focus:ring-red-400",
  };

  const priorityStyles = {
    normal: "",
    high: "ring-2 ring-orange-400 ring-opacity-50",
    critical: "ring-2 ring-red-500 ring-opacity-50 animate-pulse"
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${priorityStyles[priority as keyof typeof priorityStyles]}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      role={role}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
       {isIconOnlyChild ? <span className="flex items-center">{children}</span> : children}
      {endIcon && <span className={`flex items-center ${endIconClass}`}>{endIcon}</span>}
    </button>
  );
};

export default Button;
