import Button from "@/core/components/ui/button/Button";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: React.ReactNode;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonVariant?: 'success' | 'error' | 'primary' | 'ghost' | 'outline';
    children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmButtonText,
    cancelButtonText,
    confirmButtonVariant = "primary",
    children,
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            className="p-6 w-full max-w-md m-4"
        >
            {/* The content of the confirmation dialog goes here */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <div className="text-gray-600 dark:text-gray-300 mb-4">{description}</div>

            {children}

            {/* Action buttons for confirmation */}
            <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={onClose}>
                    {cancelButtonText ? cancelButtonText : t("common.cancel")}
                </Button>
                {onConfirm && (
                    <Button variant={confirmButtonVariant} onClick={() => {
                        onConfirm()
                        onClose()
                    }
                    }>
                        {confirmButtonText ? confirmButtonText : t("common.confirm")}
                    </Button>
                )}
            </div>
        </Modal>
    );
};