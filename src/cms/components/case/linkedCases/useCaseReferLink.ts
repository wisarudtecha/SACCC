import { CreateCase, usePatchUpdateCaseMutation } from "@/cms/store/api/caseApi";
import { useLazyGetCaseSopQuery } from "@/cms/store/api/dispatch";
import { updateCaseInLocalStorage } from "@/cms/components/case/caseLocalStorage.tsx/caseListUpdate";

/**
 * Link or unlink a child case by PATCHing its referCaseId.
 *
 * Shared by the link dialog (set a parent) and the linked-cases list (clear it),
 * so both flows build the update body the same way the case-detail save does:
 * spread the child's current SOP payload, override only referCaseId, mirror the
 * localStorage caseList cache afterwards.
 */
export const useCaseReferLink = () => {
    const [updateCase] = usePatchUpdateCaseMutation();
    const [fetchCaseSop] = useLazyGetCaseSopQuery();

    /** Set the child's parent (`parentCaseId`), or clear the link with "". */
    const setReferCase = async (childCaseId: string, parentCaseId: string): Promise<void> => {
        const childSop = await fetchCaseSop({ caseId: childCaseId }).unwrap();
        if (!childSop.data) {
            throw new Error(`Case ${childCaseId} not found`);
        }
        // Mirror the case-detail save: full SOP payload back, with formAnswer
        // re-exposed under the formData key the BFF expects. Fields CaseSop does
        // not carry (caseSla, deptId/commId/stnId, nodeId) are left absent -
        // never invent values for them. CaseSop is not cast-compatible with
        // CreateCase, hence the double cast.
        const updateJson = {
            ...childSop.data,
            caseId: childCaseId,
            referCaseId: parentCaseId,
            formData: childSop.data.formAnswer,
        } as unknown as CreateCase;
        await updateCase({ caseId: childCaseId, updateCase: updateJson }).unwrap();
        updateCaseInLocalStorage(updateJson, childCaseId);
    };

    return { setReferCase };
};
