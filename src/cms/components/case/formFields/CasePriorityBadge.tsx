import { getPriorityColorClass } from "@/cms/components/function/Prioriy";
import { useTranslation } from "@/core/hooks/useTranslation";

interface CasePriorityBadgeProps {
    priority: number;
}

/** Right-aligned colour swatch showing the priority of the selected case type. */
export const CasePriorityBadge = ({ priority }: CasePriorityBadgeProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex items-end justify-end">
            <span className="mr-2 text-gray-900 dark:text-gray-400">{t("case.assignment.piority")}</span>
            <div className={`w-5 h-5 mx-1 p-3 ${getPriorityColorClass(priority)} rounded-lg`} />
        </div>
    );
};
