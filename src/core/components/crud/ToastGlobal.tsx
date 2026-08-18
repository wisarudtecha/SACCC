import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/core/hooks";
import { ToastContainer } from "./ToastContainer";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Toast } from "@/core/types/crud";

interface ToastContextType {
    addToast: (type: Toast["type"], message: string, duration?: number, isI18N?: boolean) => void;
    removeToast: (id: string) => void;
    isCaseLoading: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToastContext must be used within ToastProvider");
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const { toasts, addToast, removeToast } = useToast();
    const loadingToastIdRef = useRef<string | null>(null);
    const { t } = useTranslation();
    const [isCaseLoading, setIsCaseLoading] = useState(false);
    useEffect(() => {
        const handleLoadingStart = () => {
            setIsCaseLoading(true);
            if (loadingToastIdRef.current) {
                removeToast(loadingToastIdRef.current);
            }
            loadingToastIdRef.current = addToast("loading", "case.display.toast.loading_case", 0, true);
        };

        const handleLoadingEnd = () => {
            setIsCaseLoading(false);
            if (loadingToastIdRef.current) {
                removeToast(loadingToastIdRef.current);
                loadingToastIdRef.current = null;
            }
            addToast("success", "case.display.toast.loading_case_success", 3000, true);
        };

        const handleLoadingFail = () => {
            setIsCaseLoading(false);
            if (loadingToastIdRef.current) {
                removeToast(loadingToastIdRef.current);
                loadingToastIdRef.current = null;
            }
            addToast("error", "case.display.toast.loading_case_fail", 3000, true);
        };


        const handleLoadingProgress = (e: Event) => {
            const customEvent = e as CustomEvent<{ current: number; total: number }>;
            const { current, total } = customEvent.detail;
            if (loadingToastIdRef.current) {
                removeToast(loadingToastIdRef.current);
            }
            loadingToastIdRef.current = addToast(
                "loading",
                t(`common.loadingPercentage`).replace(
                    "_percentage_",
                    `(${Math.floor((current * 100) / total)}%)`
                ),
                0
            );
        };

        window.addEventListener('caseLoadingStart', handleLoadingStart);
        window.addEventListener('caseLoadingEnd', handleLoadingEnd);
        window.addEventListener('caseLoadingProgress', handleLoadingProgress);
        window.addEventListener('caseLoadingFail', handleLoadingFail);
        return () => {
            window.removeEventListener('caseLoadingStart', handleLoadingStart);
            window.removeEventListener('caseLoadingEnd', handleLoadingEnd);
            window.removeEventListener('caseLoadingProgress', handleLoadingProgress);
            window.removeEventListener('caseLoadingFail', handleLoadingFail);
        };
    }, [addToast, removeToast, t]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, isCaseLoading }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} disbleCloseButton={true} />
        </ToastContext.Provider>
    );
};