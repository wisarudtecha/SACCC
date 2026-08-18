import { memo, ReactNode } from "react";
import { TranslationParams } from "@/core/types/i18n";
import { CaseHeader } from "./caseHeader";


interface CaseLayoutProps {
    disablePageMeta?: boolean;
    onBack?: () => void;
    title?: string;
    showBackButton?: boolean;
    showPanelButton?: boolean;
    customHeaderActions?: ReactNode;
    t: (key: string, params?: TranslationParams | undefined) => string;
    /**
     * Right-rail content. The caller owns what goes in here (e.g. <CasePanel />),
     * so this shell stays independent of any particular panel or case shape.
     * Omit it to render a single-column layout with no right rail.
     */
    panel?: ReactNode;
    isPanelOpen?: boolean;
    onPanelClose?: () => void;
    onPanelOpen?: () => void;
    children: ReactNode;
    className?: string;
}

export const CaseLayout = memo<CaseLayoutProps>(({
    disablePageMeta,
    onBack,
    title,
    showBackButton = true,
    showPanelButton = true,
    customHeaderActions,
    t,
    panel,
    isPanelOpen = false,
    onPanelClose = () => { },
    onPanelOpen = () => { },
    children,
    className = "",
}) => {
    return (
        <div className={`flex flex-col  ${className}`}>
            {/* Toast */}
            {/* Header */}
            <CaseHeader
                disablePageMeta={disablePageMeta}
                onBack={onBack}
                onOpenCustomerPanel={onPanelOpen}
                t={t}
                title={title}
                showBackButton={showBackButton}
                showPanelButton={showPanelButton && !!panel}
                customActions={customHeaderActions}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 xl:flex rounded-2xl custom-scrollbar">
                <div className="flex flex-col xl:flex-row h-full gap-1 w-full">

                    {/* Left Panel - Main Content */}
                    <div
                        // className="overflow-y-auto w-full xl:w-2/3 custom-scrollbar"
                        className="overflow-y-auto w-full custom-scrollbar"
                    >
                        <div className="pr-0">
                            <div className="px-4 mt-5 mb-5">
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    {panel && (
                        <div
                            // className={`
                            //     fixed top-0 right-0 h-full w-[90%] max-w-md z-10010
                            //     transition-transform duration-300 ease-in-out
                            //     xl:relative xl:h-auto xl:w-1/3 xl:translate-x-0 xl:z-auto
                            //     xl:border-l xl:border-gray-200 xl:dark:border-gray-800 px-1
                            //     ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                            // `}
                            className={`
                            fixed top-0 right-0 h-full w-[90%] max-w-md z-10010
                            transition-transform duration-300 ease-in-out
                            xl:relative xl:h-auto xl:w-1/3 xl:translate-x-0 xl:z-auto
                            xl:border-l xl:border-gray-200 xl:dark:border-gray-800
                            ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                        `}
                        >
                            {panel}
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for mobile */}
            {panel && isPanelOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-10000 xl:hidden"
                    onClick={onPanelClose}
                />
            )}
        </div>
    );
});

CaseLayout.displayName = 'CaseLayout';
