// ImportDynamicFormModal.tsx
import { FormFieldWithChildren } from "@/cms/components/interface/FormField";
import Button from "@/core/components/ui/button/Button";
import { Modal } from "@/core/components/ui/modal";
import { useState, useCallback, useRef } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";

import { isFormFieldWithChildren } from "./function";
import { useTranslation } from "@/core/hooks/useTranslation";
import { UploadIcon } from "lucide-react";

interface ImportDynamicFormModal {
    setCurrentForm: React.Dispatch<React.SetStateAction<FormFieldWithChildren>>;
    isImport: boolean;
    setImport: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ImportDynamicFormModal: React.FC<ImportDynamicFormModal> = ({
    setCurrentForm,
    isImport,
    setImport,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { toasts, addToast, removeToast } = useToast();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/json') {
                addToast("error", t("form_builder.invalid_file_type"));
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleFormImport = useCallback(() => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedJson = JSON.parse(content);

                if (isFormFieldWithChildren(parsedJson)) {
                    setCurrentForm((prev) => ({
                        ...parsedJson,
                        formName: prev.formName,
                        formId: prev.formId,
                        formType: prev.formType
                    }));
                    addToast("success", t("form_builder.import_success"));
                    setImport(false);
                    setSelectedFile(null);
                } else {
                    addToast("error", t("form_builder.invalid_import_data"));
                }
            } catch (error) {
                addToast("error", t("form_builder.import_error"));
            }
        };
        reader.readAsText(selectedFile);
    }, [selectedFile, setCurrentForm, setImport, addToast, t]);

    const handleClose = () => {
        setImport(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (isImport)
        return (
            <Modal isOpen={isImport} onClose={handleClose} className="max-w-md p-6">
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t("form_builder.import_form")}
                    </h3>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {t("form_builder.import_description")}
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t("form_builder.select_file")}
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    {selectedFile && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("form_builder.selected_file")}: {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t("form_builder.file_size")}: {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end gap-2 p-4">
                    <Button onClick={handleClose} variant="error">
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleFormImport}
                        disabled={!selectedFile}
                        variant={!selectedFile ? 'outline' : 'success'}
                    >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        {t("common.upload")}
                    </Button>
                </div>
            </Modal>
        );
};

export default ImportDynamicFormModal;