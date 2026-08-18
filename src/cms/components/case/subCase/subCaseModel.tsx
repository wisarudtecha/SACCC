import { Dialog, DialogContent, DialogFooter } from "@/core/components/ui/dialog/dialog"
import CaseDetailView from "../CaseDetailView"
import { CaseEntity } from "@/cms/types/case"
import {  genWordOrderID } from "@/cms/components/genCaseId/genCaseId"


interface CreateSubCaseModel {
    open: boolean
    caseData?: CaseEntity
    onOpenChange: (isOpen: boolean) => void
}
export default function CreateSubCaseModel({
    caseData,
    open,
    onOpenChange,
}: CreateSubCaseModel) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] h-[85vh] flex flex-col z-99999 overflow-auto custom-scrollbar">

                <CaseDetailView disablePageMeta={true} caseData={{
                    caseId: genWordOrderID(),
                    referCaseId: caseData?.caseId,
                } as CaseEntity} isSubCase={true}/>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}