// src/cms/components/crud/ToastContainer.tsx
import React from "react";
import { useSuperApp } from "@/core/context/SuperAppContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CheckCircleIcon, ErrorIcon, AlertIcon, CloseIcon } from "@/core/icons";
import { SpinnerIcon } from "@/core/icons/SpinnerIcon";
import type { Toast } from "@/core/types/crud";
// import Button from "@/core/components/ui/button/Button";

export interface ToastContainerProps {
  disbleCloseButton?: boolean;
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  disbleCloseButton = false,
  toasts,
  onRemove,
}) => {
  const isSuper = useSuperApp();
  const { t } = useTranslation();
  
  const getToastIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-300" />;
      case "error":
        return <ErrorIcon className="w-5 h-5 text-red-600 dark:text-red-300" />;
      case "warning":
        return <AlertIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />;
      case "info":
        return <AlertIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />;
      case "loading":
        return <SpinnerIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" />;
      default:
        return null;
    }
  };

  const getToastClasses = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-100";
      case "error":
        return "bg-red-100 dark:bg-red-800 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100";
      case "info":
        return "bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100";
      case "loading":
        return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100";
      default:
        return "";
    }
  };

  // const getButtonClasses = (type: Toast["type"]) => {
  //   return type;
  // };

  return (
    <div className={`${isSuper ? "top-18" : " top-25"} fixed right-6 space-y-2 z-999999`}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${
            getToastClasses(toast.type)
          } duration-1000 flex gap-3 items-center p-4 rounded-lg shadow-lg transition-all`
        }>
          {getToastIcon(toast.type)}
          <span className="font-medium text-sm ">{toast.isI18N ? t(toast.message) : toast.message}</span>
          {!disbleCloseButton && 
            <button
              className="text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-gray-200 transition-colors"
              // size="xs"
              // variant={getButtonClasses(toast.type)}
              onClick={() => onRemove(toast.id)}
            >
            <CloseIcon className="h-4 w-4" />
          </button>}
        </div>
      ))}
    </div>
  );
};
