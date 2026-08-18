import Button from "@/core/components/ui/button/Button";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { RefreshCcw } from "lucide-react";
import React from "react";

interface RetryButtonProps {
    refetch: () => Promise<any>;   // <<< Type for refetch
}

const RetryButton: React.FC<RetryButtonProps> = ({ refetch }) => {
    const [disabled, setDisabled] = React.useState(false);
    const [seconds, setSeconds] = React.useState(0);
    const { t } = useTranslation();
    const { addToast } = useToast();
    const handleRetry = async () => {
        try {
            setDisabled(true);
            await refetch();
        } catch (error) {
            addToast("error","common.error")
        }

        setSeconds(5);

        const interval = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <Button
            className="flex items-center"
            size="sm"
            onClick={handleRetry}
            disabled={disabled}
        >
            <RefreshCcw className="w-4 h-4 mr-2" />
            <span>
                {disabled ? `${t("common.retry")} (${seconds})` : t("common.retry")}
            </span>
        </Button>
    );
};

export default RetryButton;
