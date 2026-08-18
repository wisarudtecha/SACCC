import { SpinnerIcon } from "@/core/icons/SpinnerIcon";
import DynamicForm from "../form/dynamic-form/DynamicForm";
import Button from "@/core/components/ui/button/Button";
import { useChangeFormVersionMutationMutation, useGetFormByFormIdQueryQuery } from "@/cms/store/api/formApi";
import { FormManager, versionList } from "../interface/FormField";
import { SearchableSelect } from "../SearchInput/SearchSelectInput";
import { useState } from "react";
import { Modal } from "@/core/components/ui/modal";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks";
import { useTranslation } from "@/core/hooks/useTranslation";
import { versionListToText } from "../form/dynamic-form/constant";

const FormVersionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    form: FormManager;
}> = ({ isOpen, onClose, form }) => {
    const [selectedVersion, setSelectedVersion] = useState<versionList>({ version: form.versions, publish: form.publish });
    const [changeVersion] = useChangeFormVersionMutationMutation()
    const { data: formData, isLoading: isLoadingForm, isFetching } = useGetFormByFormIdQueryQuery({
        formId: form.formId,
        version: selectedVersion.version
    });
    const { toasts, addToast, removeToast } = useToast();
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-auto custom-scrollbar"
        >
            <div className="flex mb-4 justify-between ">
                <div className="px-3 text-xl dark:text-white">{form.formName}</div>
                <SearchableSelect
                    className="w-fit rounded-full text-xs font-medium mr-20"
                    value={selectedVersion.version}
                    prefixedStringValue="v."
                    isDynamic={true}
                    options={versionListToText(
                        form.versionsInfoList?.filter(item => item.version === form.versions || item.publish === true) || [],
                        form.versions
                    ) || []}
                    // options={versionListToText(
                    //     form.versionsInfoList || [],
                    //     form.versions
                    // ) || []}
                    onChange={(value) => {
                        const found = form.versionsInfoList?.find(item => item.version === value)
                        if (found) setSelectedVersion(found)
                    }}
                    disabledRemoveButton={true}
                />
            </div>

            {isLoadingForm || isFetching ? (
                <div className="flex justify-center text-gray-500 items-center">
                    <SpinnerIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin mr-2" />
                    {t("common.loading")}
                </div>
            ) : (
                <DynamicForm
                    initialForm={formData?.data}
                    edit={false}
                    editFormData={false}
                    enableFormTitle={false}
                />
            )}

            {form.versions !== selectedVersion.version && selectedVersion.publish && !isFetching && <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => {
                    try {
                        changeVersion({ formId: form.formId, version: selectedVersion.version }).unwrap()
                        addToast("success", "Change version Success")
                        onClose()
                    } catch (error: any) {
                        addToast("error", error?.data?.msg)
                    }

                }}>
                    {t("common.change_version")}
                </Button>
            </div>}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </Modal>
    );
};

export default FormVersionsModal;