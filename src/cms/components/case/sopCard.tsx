// sopCard.tsx

import Button from "@/core/components/ui/button/Button";
import {
    Clock,
    User as User_Icon,
    MessageSquare,
    Paperclip,
    ChevronDown,
    ChevronUp,
    Maximize2,

} from "lucide-react"

import { useMemo, useRef, useState } from "react";
import { mergeCaseTypeAndSubType } from "../caseTypeSubType/mergeCaseTypeAndSubType";
import Badge from "@/core/components/ui/badge/Badge";
import { findCaseTypeSubTypeByTypeIdSubTypeId } from "../caseTypeSubType/findCaseTypeSubTypeByMergeName";
import { Comments } from "../comment/Comment";
import { getPriorityBorderColorClass, getTextPriority } from "../function/Prioriy";
import { CaseTypeSubType } from "../interface/CaseType";
import ProgressStepPreview from "./activityTimeline/caseActivityTimeline";
import { cancelAndCloseStatus, CaseStatusInterface } from "../ui/status/status";
import { CaseDetails, FileItem } from "@/cms/types/case";
import { mapSopToOrderedProgress } from "./sopStepTranForm";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CommentModal } from "../comment/commentModal";
import { formatDate } from "@/core/utils/crud";
import { usePermissions } from "@/core/hooks/usePermissions";
import { CaseSop } from "@/cms/types/dispatch";
import { usePostUploadFileMutationMutation } from "@/core/store/api/file";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { validateFile } from "@/cms/components/Attachment/AttachmentConv";

interface CaseCardProps {
    onAddSubCase?: () => void;
    onAssignClick?: () => void;
    onEditClick?: () => void;
    setCaseData?: React.Dispatch<React.SetStateAction<CaseDetails | undefined>>;
    caseData: CaseSop;
    editFormData: boolean;
    showCommentButton?: boolean;
    showAttachButton?: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({
    onAssignClick,
    onEditClick,
    caseData,
    editFormData,
    setCaseData,
    showCommentButton = true,
    showAttachButton = true,
}) => {
    const [showComment, setShowComment] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // **NEW**: Modal state
    const permissions = usePermissions();
    const caseTypeSupTypeData = useMemo(() =>
        JSON.parse(localStorage.getItem("caseTypeSubType") ?? "[]") as CaseTypeSubType[], []
    );
    const caseStatus = JSON.parse(localStorage.getItem("caseStatus") ?? "[]") as CaseStatusInterface[]
    const [postUploadFile] = usePostUploadFileMutationMutation();
    const { toasts, addToast, removeToast } = useToast();
    const handleCommentToggle = () => {
        setShowComment(!showComment);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const { t, language } = useTranslation();

    const defaultProgressSteps = [
        { id: "1", title: "Received", completed: true },
        { id: "2", title: "Assigned", completed: true },
        { id: "3", title: "Acknowledged", completed: false, current: true },
        { id: "4", title: "En Route", completed: false },
        { id: "5", title: "On Site", completed: false },
        { id: "6", title: "Completed", completed: false }
    ];

    // Use the simpler ordered progress approach
    const progressSteps = useMemo(() => {
        return mapSopToOrderedProgress(caseData, language);
    }, [caseData]);

    // Use dynamic steps if available, otherwise use default
    const stepsToDisplay = progressSteps.length > 0 ? progressSteps : defaultProgressSteps;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!files || files.length === 0) {
            return;
        }
        setIsUploading(true);
        const newFilesArray = Array.from(files);
        const uploadedFiles: FileItem[] = [];

        try {
            for (const file of newFilesArray) {
                try {
                    if (!validateFile(file)) {
                        addToast("error", `File "${file.name}" is too large.`)
                        continue
                    }
                    const result = await postUploadFile({
                        path: "case",
                        file: file,
                        caseId: caseData.caseId
                    }).unwrap();

                    if (result.data) {
                        uploadedFiles.push(result.data);
                        console.log(`✅ Uploaded ${file.name}`);
                    } else {
                        console.error(`❌ Failed to upload ${file.name}`);
                        addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Error uploading ${file.name}:`, error);
                    addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                }
            }

            if (uploadedFiles.length > 0) {
                setCaseData?.((prev) => {
                    if (!prev) return prev;

                    const currentFiles = prev.attachFile ?? [];
                    return {
                        ...prev,
                        attachFile: [...currentFiles, ...uploadedFiles],
                    };
                });

                // addToast?.("success", t("case.display.toast.upload_file_success"));
            }
        } catch (error) {
            console.error("Error during file upload process:", error);
            addToast?.("error", t("case.display.toast.upload_file_fail"));
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className={`mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 ${getPriorityBorderColorClass(caseData.priority)}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{
                        mergeCaseTypeAndSubType(
                            findCaseTypeSubTypeByTypeIdSubTypeId(
                                caseTypeSupTypeData,
                                caseData?.caseTypeId || "",
                                caseData?.caseSTypeId || ""
                            ) ?? ({} as CaseTypeSubType), language

                        )
                    }</h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{t("case.sop_card.create_date")}: {formatDate(caseData.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <User_Icon className="w-4 h-4" />
                            <span>{t("case.sop_card.created")}: {caseData.createdBy}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-center mt-3 sm:mt-0">
                    <Badge variant="outline" color={`${getTextPriority(caseData.priority).color}`}>
                        {t(`case.sop_card.${getTextPriority(caseData.priority).level} Priority`)}
                    </Badge>
                    <Badge variant="outline">
                        {
                            language === "th" ? caseStatus.find((item) => caseData?.statusId === item.statusId)?.th :
                                caseStatus.find((item) => caseData?.statusId === item.statusId)?.en
                        }
                    </Badge>
                </div>
            </div>
            {permissions.hasPermission("case.view_timeline") && caseData.caseVersion === "draft" ? undefined :
                <ProgressStepPreview progressSteps={stepsToDisplay} />
            }

            {/* START: Responsive Button Grid Container */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                {permissions.hasPermission("case.comment") && showCommentButton && <Button onClick={handleCommentToggle} size="sm" variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                    {showComment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("case.sop_card.comment")}
                </Button>}
                {!cancelAndCloseStatus.includes(caseData.statusId) && <>
                    {permissions.hasPermission("case.update") && onEditClick && <Button onClick={onEditClick} size="sm" variant="outline" className="border-blue-500 dark:border-blue-600 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900">
                        {editFormData ? t("case.sop_card.cancel_edit") : t("case.sop_card.edit")}
                    </Button>}

                    {permissions.hasPermission("case.attach_file") && showAttachButton && <div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-full"
                            onClick={handleButtonClick}
                        >
                            <Paperclip className="w-4 h-4 mr-2" />
                            {t("case.sop_card.attach_file")}
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            multiple
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                            disabled={isUploading}
                        />
                    </div>}</>
                }
                <div className="flex items-center justify-center space-x-1 sm:ml-auto">
                    {/* <Button onClick={undefined} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white space-x-1 sm:ml-auto">
                        <CalendarRange className="w-4 h-4" />
                        <span>{t("case.sop_card.request_spare_part")}</span>
                    </Button> */}
                    {/* A case can carry more than one officer, so this stays available
                        after the first assignment - the modal filters out whoever is
                        already on the case (unitLists), and revoking is no longer a
                        prerequisite for assigning someone else. */}
                    {permissions.hasPermission("case.assign") && caseData.caseVersion !== "draft" && onAssignClick && !cancelAndCloseStatus.includes(caseData.statusId) &&
                        <Button onClick={onAssignClick} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ">
                            <User_Icon className="w-4 h-4" />
                            <span>{t("case.sop_card.assign_officer")}</span>
                        </Button>}
                </div>
            </div>

            {showComment && <div className="relative">
                <Maximize2
                    className="absolute right-0 m-3 rounded-md opacity-70 hover:cursor-pointer hover:opacity-100 transition-opacity z-10 bg-white dark:bg-gray-900 dark:text-white p-1 shadow-sm"
                    onClick={handleOpenModal}
                    size={24}
                />
                <Comments caseId={caseData.caseId} isOpen={showComment} />
            </div>}

            <CommentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                caseId={caseData.caseId}
                caseTitle={mergeCaseTypeAndSubType(
                    findCaseTypeSubTypeByTypeIdSubTypeId(
                        caseTypeSupTypeData,
                        caseData?.caseTypeId || "",
                        caseData?.caseSTypeId || ""
                    ) ?? ({} as CaseTypeSubType), language
                )}
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};