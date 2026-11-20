import { validateDynamicFormInput } from "@/cms/components/form/dynamic-form/validateDynamicForm";
import { CaseDetails } from "@/cms/types/case";

export interface CaseValidationOptions {
    /**
     * Whether the viewer may edit the case's phone number — see `canEditCasePhoneNo` in
     * `src/core/security/piiFields.ts`.
     *
     * The format check below validates a value the **user typed**. Once the backend redacts the
     * number for a viewer without the permission, form state holds the redaction (`******5678`),
     * which fails the pattern — and the field is locked, so the viewer cannot correct it. Every
     * save would then be blocked by a value they were never allowed to change. Skipping the check
     * is correct rather than a loophole: it is not their input.
     *
     * Defaults to `true`, so a caller that has not been wired up keeps validating exactly as
     * before.
     */
    canViewPhoneNo?: boolean;
}


export const validateCaseForSubmission = (
    caseState: CaseDetails | undefined,
    { canViewPhoneNo = true }: CaseValidationOptions = {}
): string => {
    if (!caseState) {
        return "Case data is not available.";
    }
    if (!caseState.caseType?.caseType) {
        return "Please select a Case Type.";
    }
    if (!caseState.description?.trim()) {
        return "Please enter Case Details.";
    }
    if (!caseState.source?.name?.trim()) {
        return "Please select a Contact Method.";
    }
    if (!caseState.area) {
        return "Please select a Response Area";
    }
    if(caseState?.caseType?.formField && !validateDynamicFormInput(caseState?.caseType?.formField)){
        return "Please Enter value in dynamic Form.";
    }if (canViewPhoneNo && caseState.customerData?.mobileNo && !/^\+?[0-9]{8,15}$/.test(caseState.customerData.mobileNo)) {
        return "Invalid Phone Number.";
    }
    return "";
};


export const validateCaseForDraft = (caseState: CaseDetails | undefined): string => {
    if (!caseState?.caseType?.caseType) {
        return "Please select a Service Type to save a draft.";
    }
    return "";
};
