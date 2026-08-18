import {
    Clock,
    User,
} from "lucide-react"
import Button from "@/core/components/ui/button/Button"
import Badge from "@/core/components/ui/badge/Badge"
import React, { useEffect, useMemo, useState } from "react"
import { getPriorityBorderColorClass, getTextPriority } from "../function/Prioriy"
import FormFieldValueDisplay from "./CaseDisplay"
import { CaseDetails } from "@/cms/types/case"
import { mergeCaseTypeAndSubType } from "../caseTypeSubType/mergeCaseTypeAndSubType"
import { statusIdToStatusTitle } from "../ui/status/status"
import { Modal } from "@/core/components/ui/modal"
import { useTranslation } from "@/core/hooks/useTranslation"
import { formatDate } from "@/core/utils/crud"
import AttachedFiles from "@/cms/components/Attachment/AttachmentPreviewList"


interface PreviewDataBeforeSubmitProps {
    caseData?: CaseDetails
    submitButton?: () => void
    isOpen: boolean
    isCreate?: boolean
    onClose: () => void
}

const PreviewDataBeforeSubmit: React.FC<PreviewDataBeforeSubmitProps> = ({
    caseData,
    submitButton,
    isOpen,
    isCreate = true,
    onClose
}) => {
    const profile = useMemo(
        () => JSON.parse(localStorage.getItem("profile") ?? "{}"),
        []
    )
    const { t, language } = useTranslation();
    const [disableButton, setDisableButton] = useState(false); // to make sure user cant spam on submit button
    
    useEffect(()=>{
        setDisableButton(false)
    },[isOpen]) // for make submit button can be use again

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-6xl p-8 dark:bg-gray-800! flex flex-col"
            closeButtonClassName="!bg-transparent"
        >
            {/* Scrollable content */}
            <div className=" overflow-y-auto custom-scrollbar pr-2  max-h-[90vh] ">
                <div
                    className={`mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 ${getPriorityBorderColorClass(
                        caseData?.caseType?.priority || 0
                    )}`}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
                        <div>
                            {caseData?.caseType && (
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {mergeCaseTypeAndSubType(caseData.caseType, language)}
                                </h2>
                            )}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                {!isCreate && caseData?.date && <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{t("case.sop_card.create_date")}: {formatDate(caseData?.date)}</span>
                                </div>}
                                <div className="flex items-center space-x-1">
                                    <User className="w-4 h-4" />
                                    <span>{t("case.assignment.create_by")}: {profile.username}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-center mt-3 sm:mt-0">
                            {caseData?.caseType?.priority && (
                                <Badge
                                    variant="outline"
                                    color={`${getTextPriority(caseData.caseType?.priority).color}`}
                                >
                                    {t("case.sop_card." + getTextPriority(caseData.caseType?.priority).level + " Priority")}
                                </Badge>
                            )}
                            {caseData?.status && (
                                <Badge variant="outline">
                                    {statusIdToStatusTitle(caseData?.status)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {(caseData?.attachFileResult?.length !== 0 && caseData) && (
                    <>
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                            {t("case.display.attach_file")} :
                        </span>
                        <AttachedFiles files={caseData?.attachFile} type={"case"} editFormData={true} />
                        {/* {Array.isArray(caseData.attachFile) && caseData.attachFile.length > 0 && (
                            <div className="mt-2 mb-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {caseData.attachFile.map((file: FileItem, index: number) => (
                                        <div key={file.name + index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Upload ${index + 1}`}
                                                className="w-full h-20 object-cover rounded border border-gray-600"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )} */}
                        
                    </>
                )}

                <FormFieldValueDisplay caseData={caseData} isCreate={isCreate} showMap />

                {submitButton && (
                    <div className="flex justify-end">
                        <Button 
                        disabled={disableButton}
                        onClick={()=>{
                            submitButton()
                            setDisableButton(true)
                        }}>{t("common.confirm")}</Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default PreviewDataBeforeSubmit
