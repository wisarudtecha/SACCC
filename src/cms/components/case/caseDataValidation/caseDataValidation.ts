import { validateDynamicFormInput } from "@/cms/components/form/dynamic-form/validateDynamicForm";
import { CaseDetails } from "@/cms/types/case";


export const validateCaseForSubmission = (caseState: CaseDetails | undefined): string => {
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
    }if (caseState.customerData?.mobileNo && !/^\+?[0-9]{8,15}$/.test(caseState.customerData.mobileNo)) {
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
