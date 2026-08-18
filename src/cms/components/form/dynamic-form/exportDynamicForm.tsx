// ExportDynamicFormModal.tsx
import { Modal } from "@/core/components/ui/modal";
import { FormField } from "@/cms/components/interface/FormField";
import Button from "@/core/components/ui/button/Button";
import { DownloadIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";

interface ExportDynamicFormModal {
    currentForm: FormField;
    isOpen: boolean;
    onClose: () => void;
}

export const ExportDynamicFormModal: React.FC<ExportDynamicFormModal> = ({
    currentForm,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();

    const handleDownload = () => {
        const exportJsonText = JSON.stringify(currentForm, null, 2);
        const blob = new Blob([exportJsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentForm.formName || 'form'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {t("form_builder.export_form")}
                </h3>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t("form_builder.export_description")}
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("form_builder.form_name")}: {currentForm.formName}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4">
                <Button onClick={onClose} variant="outline">
                    {t("common.cancel")}
                </Button>
                <Button onClick={handleDownload} variant="success">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    {t("common.download")}
                </Button>
            </div>
        </Modal>
    );
};

export default ExportDynamicFormModal;