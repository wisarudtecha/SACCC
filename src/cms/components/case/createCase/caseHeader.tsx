import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { TranslationParams } from "@/core/types/i18n";

interface CaseHeaderProps {
    disablePageMeta?: boolean;
    onBack?: () => void;
    onOpenCustomerPanel: () => void;
    t: (key: string, params?: TranslationParams | undefined) => string;
    title?: string;
    showBackButton?: boolean;
    showPanelButton?: boolean;
    customActions?: React.ReactNode;
}

export const CaseHeader = memo<CaseHeaderProps>(({ 
    disablePageMeta, 
    onBack, 
    onOpenCustomerPanel, 
    t,
    title,
    showBackButton = true,
    showPanelButton = true,
    customActions
}) => (
    <div className="flex-shrink-0">
        <div className="">
            <div className="flex items-center justify-between">
                {!disablePageMeta && (
                    <div className="flex items-center space-x-4">
                        {onBack && showBackButton && (
                            <Button variant="ghost" size="sm" onClick={onBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t("case.back")}
                            </Button>
                        )}
                        {title && (
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {title}
                            </h1>
                        )}
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    {customActions}
                    {showPanelButton && (
                        <div className="xl:hidden">
                            <Button
                                className="mb-2"
                                variant="outline"
                                size="sm"
                                onClick={onOpenCustomerPanel}
                            >
                                {t("case.panel.details_panel")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
));

CaseHeader.displayName = 'CaseHeader';