import DragDropFileUpload from "@/cms/components/d&d upload/dndUpload";
import { FileItem } from "@/cms/types/case";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

interface CaseAttachmentsSectionProps extends CaseFieldSectionProps {
    /**
     * Case the uploads belong to. Omit for screens that only attach files after
     * the case exists - `DragDropFileUpload` skips its upload call when unset.
     */
    caseId?: string;
}

/** Drag & drop attachments for the case. */
export const CaseAttachmentsSection = ({
    caseState,
    onCaseChange,
    caseId,
}: CaseAttachmentsSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className="px-3 my-6">
            <h3 className="font-medium text-gray-700 dark:text-gray-200 text-sm mb-3">
                {t("case.display.attach_file")}:
            </h3>
            <DragDropFileUpload
                files={caseState?.attachFile || []}
                onFilesChange={(newFiles: FileItem[]) => onCaseChange({ attachFile: newFiles })}
                accept="image/*,.pdf,.doc,.docx,.txt"
                maxSize={1}
                className="mb-4"
                disabled={false}
                caseId={caseId}
                type="case"
            />
        </div>
    );
};
