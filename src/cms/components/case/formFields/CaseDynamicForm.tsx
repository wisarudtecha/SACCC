import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import { FormField } from "@/cms/components/interface/FormField";
import Loading from "@/core/components/common/Loading";

interface CaseDynamicFormProps {
    /** The form definition fetched for the selected case type. */
    form: FormField | undefined;
    isLoading?: boolean;
    onFormChange: (form: FormField) => void;
}

/** Renders the per-case-type dynamic form, or a spinner while it is being fetched. */
export const CaseDynamicForm = ({ form, isLoading = false, onFormChange }: CaseDynamicFormProps) => {
    if (isLoading) {
        return <Loading />;
    }

    if (!form?.formFieldJson) {
        return null;
    }

    return (
        <DynamicForm
            initialForm={form}
            edit={false}
            editFormData={true}
            enableFormTitle={false}
            onFormChange={onFormChange}
        />
    );
};
