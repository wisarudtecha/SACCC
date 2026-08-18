import { CaseEntity } from "@/cms/types/case";

export const removeCaseFromLocalStore = (caseId: string) => {
    const caseListJSON = localStorage.getItem('caseList');
    
    if (caseListJSON) {
        const caseList = JSON.parse(caseListJSON) as CaseEntity[];
        const updatedCaseList = caseList.filter((item) => item.caseId !== caseId);
        localStorage.setItem('caseList', JSON.stringify(updatedCaseList));
    }
}

export default removeCaseFromLocalStore;