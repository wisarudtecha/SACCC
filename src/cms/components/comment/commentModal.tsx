"use client"
import React from 'react';
import { Comments } from './Comment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog";
import { useTranslation } from '@/core/hooks/useTranslation';

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string;
    caseTitle?: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
    isOpen,
    onClose,
    caseId,

}) => {
    const { t } = useTranslation();
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                aria-describedby="comment-modal-desc"
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-4xl w-[95vw] h-[85vh] flex flex-col z-999999 rounded-md"
            >
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t("case.sop_card.comment_modal_title")}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t("case.display.no")}: {caseId}
                        </p>
                    </div>
                </DialogHeader>


                {/* Content */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <ModalComments caseId={caseId} isOpen={isOpen} />
                </div>
            </DialogContent>
        </Dialog>
    );
};


const ModalComments: React.FC<{ caseId: string; isOpen: boolean }> = ({ caseId, isOpen }) => {
    return (
        <div className="h-full">
            <Comments caseId={caseId} isOpen={isOpen} isModal={true} />
        </div>
    );
};