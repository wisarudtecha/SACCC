// /src/hooks/useToast.ts
import { useState } from "react";
import type { Toast } from "@/core/types/crud";

export interface UseToastResult {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string, duration?: number , isI18N?: boolean) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToast = (): UseToastResult => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    type: Toast["type"], 
    message: string, 
    duration: number = 4000,
    isI18N : boolean = false
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, message, duration ,isI18N};
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts
  };
};