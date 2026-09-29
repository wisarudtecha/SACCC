import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Badge from "@/core/components/ui/badge/Badge";
import { Case } from "@/cms/store/api/caseApi";
import { getPriorityBorderColorClass, getPriorityColorClass } from "@/cms/components/function/Prioriy";
import { statusIdToStatusTitle } from "@/cms/components/ui/status/status";
import { useTranslation } from "@/core/hooks/useTranslation";

interface LinkedCaseCardProps {
    caseItem: Case;
    /** When provided, an unlink action is rendered. Caller owns the confirm + PATCH. */
    onUnlink?: (caseItem: Case) => void;
}

/**
 * One linked case row: priority stripe, id, date, detail, status. Click-through
 * navigates to the case. Extracted from the old SubCaseTab so the parent row and
 * the children list render identically.
 */
export const LinkedCaseCard: React.FC<LinkedCaseCardProps> = ({ caseItem, onUnlink }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/cms/case/${caseItem.caseId}`)}
            className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer border-l-4 ${getPriorityBorderColorClass(caseItem.priority)} group`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-2 h-2 ${getPriorityColorClass(caseItem.priority)} rounded-full shrink-0`}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-500 font-mono">#{caseItem.caseId}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-500">
                            {caseItem.createdDate ? new Date(caseItem.createdDate).toLocaleDateString() : ""}
                        </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                        {caseItem.caseDetail || "No details available"}
                    </h4>
                    <div className="flex items-center justify-between">
                        <Badge>
                            {statusIdToStatusTitle(caseItem.statusId)}
                        </Badge>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {caseItem.createdBy}
                        </span>
                    </div>
                </div>
                {onUnlink && (
                    <button
                        type="button"
                        title={t("common.unlink")}
                        onClick={(event) => {
                            event.stopPropagation();
                            onUnlink(caseItem);
                        }}
                        className="ml-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LinkedCaseCard;
