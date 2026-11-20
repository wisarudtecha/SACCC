import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import { FormField } from "@/cms/components/interface/FormField";
import Loading from "@/core/components/common/Loading";

interface CaseDynamicFormProps {
    /** The form definition fetched for the selected case type. */
    form: FormField | undefined;
    isLoading?: boolean;
    onFormChange: (form: FormField) => void;
    /**
     * Opt-in, mirroring `DynamicForm`'s own props.
     *
     * A case type's form definition carries a `pii` marker on individual fields, and it is the
     * render site that decides whether those markers are enforced. Case surfaces pass this; a
     * surface that does not renders every marked field unmasked and editable.
     */
    maskPii?: boolean;
    /**
     * Overrides the per-field permission check.
     *
     * `true` for a case that does not exist yet: there is no stored value to withhold, and the
     * agent is the source of it, so locking would only make the form unusable. Left unset for an
     * existing case, where each marked field resolves its own class through `usePiiMasker`.
     */
    canViewPii?: boolean;
}

/** Renders the per-case-type dynamic form, or a spinner while it is being fetched. */
export const CaseDynamicForm = ({
    form,
    isLoading = false,
    onFormChange,
    maskPii = false,
    canViewPii,
}: CaseDynamicFormProps) => {
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
            maskPii={maskPii}
            canViewPii={canViewPii}
        />
    );
};
