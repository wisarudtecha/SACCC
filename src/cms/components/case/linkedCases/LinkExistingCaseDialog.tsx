import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { Case } from "@/cms/store/api/caseApi";
import { CaseSearchPicker } from "./CaseSearchPicker";
import { useCaseReferLink } from "./useCaseReferLink";

interface LinkExistingCaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The case being viewed — becomes the parent (referCaseId) of the picked case. */
    parentCaseId: string;
    /** Ids never offered for linking: current case, its children, its parent. */
    excludeIds: string[];
    /** Called after a successful link so the parent SOP (referCaseLists) refreshes. */
    onLinked: () => Promise<unknown> | void;
}

/**
 * Pick an existing case and link it as a child of the case being viewed.
 * The link is written on the CHILD (PATCH its referCaseId) - the parent's
 * referCaseLists is server-derived and only needs a refetch afterwards.
 */
export const LinkExistingCaseDialog: React.FC<LinkExistingCaseDialogProps> = ({
    open,
    onOpenChange,
    parentCaseId,
    excludeIds,
    onLinked,
}) => {
    const { t } = useTranslation();
    const { addToast } = useToastContext();
    const { setReferCase } = useCaseReferLink();
    const [isLinking, setIsLinking] = useState<boolean>(false);

    // Guard against StrictMode/double-click firing the PATCH twice - the mutation
    // must stay outside any setState updater (see LinkingExistingCustomer).
    const handleSelect = async (caseItem: Case) => {
        if (isLinking) return;
        setIsLinking(true);
        try {
            await setReferCase(caseItem.caseId, parentCaseId);
            await onLinked();
            addToast("success", t("case.panel.link_case_success"));
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to link case:", error);
            addToast("error", t("case.panel.link_case_error"));
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-3xl w-[95vw] max-h-[85vh] flex flex-col overflow-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle>{t("case.panel.link_case")}</DialogTitle>
                </DialogHeader>
                <CaseSearchPicker onSelect={handleSelect} excludeIds={excludeIds} />
            </DialogContent>
        </Dialog>
    );
};

export default LinkExistingCaseDialog;
