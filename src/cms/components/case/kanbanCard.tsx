import { createAvatarFromString } from "../avatar/createAvatarFromString";
import { DateStringToAgoFormat } from "../date/DateToString";
import { getPriorityBorderColorClass } from "../function/Prioriy";
import { SLACountdownBadgeAssignment } from "../Sla/Sla";
import Badge from "@/core/components/ui/badge/Badge";
import { mergeCaseTypeAndSubType } from "../caseTypeSubType/mergeCaseTypeAndSubType";
import { CaseStatusInterface } from "../ui/status/status";
import { CaseEntity, CaseTypeSubType } from "@/cms/types/case";
// Ensure these types are imported or defined

export const CaseCard = ({
    caseItem,
    language,
    handleCaseClick,
    className
}: {
    caseItem: CaseEntity,
    language: string,
    handleCaseClick: (caseItem: CaseEntity) => void,
    className?: string
}) => {
    const caseTypeSupTypeData = JSON.parse(localStorage.getItem("caseTypeSubType") ?? "[]") as CaseTypeSubType[];
    const caseStatus = JSON.parse(localStorage.getItem("caseStatus") ?? "[]") as CaseStatusInterface[];

    const matchingSubTypesNames = (caseTypeId: string, caseSTypeId: string, caseTypeSupType: CaseTypeSubType[]): string => {
        const matchingSubType = caseTypeSupType.find(item => item.typeId === caseTypeId && item.sTypeId === caseSTypeId);
        return matchingSubType ? mergeCaseTypeAndSubType(matchingSubType, language) : "Unknown";
    };



    return (
        <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium"></div>
            <div
                className={`dark:bg-gray-800 bg-white rounded-lg p-4 space-y-3 border-l-4 ${getPriorityBorderColorClass(caseItem.priority)} hover:bg-gray-750 transition-colors cursor-pointer `+className}
                onClick={() => handleCaseClick(caseItem)}
            >
                <div className="flex items-start justify-between">
                    <h3 className="min-h-[40px] font-medium dark:text-gray-50 text-base leading-tight pr-2 text-gray-700">{matchingSubTypesNames(caseItem.caseTypeId, caseItem.caseSTypeId, caseTypeSupTypeData)}</h3>

                </div>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 min-h-[40px]">{caseItem.caseLocAddr}</p>
                <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
                    {caseItem.createdBy ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center dark:bg-blue-700">
                                <span className="text-white text-xs">{createAvatarFromString(caseItem.createdBy)}</span>
                            </div>
                            <span className="text-sm text-gray-800 dark:text-gray-100">{caseItem.createdBy}</span>
                        </div>
                    ) : <div></div>}
                    <SLACountdownBadgeAssignment createDate={caseItem.createdDate as string} sla={caseItem.caseSla} />
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="text-xs text-gray-500 font-medium ">{DateStringToAgoFormat(caseItem.createdDate as string, language)}</span>
                    <Badge className="flex flex-col justify-center items-center text-center truncate">
                        {language === "th" ?
                            caseStatus.find((item) => caseItem?.statusId === item.statusId)?.th :
                            caseStatus.find((item) => caseItem?.statusId === item.statusId)?.en
                        }
                    </Badge>
                </div>

            </div>
        </div>
    );
};