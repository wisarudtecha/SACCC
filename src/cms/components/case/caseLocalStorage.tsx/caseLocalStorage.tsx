import { CaseEntity } from "@/cms/types/case";
import { dispatchInterface } from "@/cms/types/dispatch";


export const dispatchUpdateLocate = (dispatch: dispatchInterface) => {
    const caseListJSON = localStorage.getItem('caseList');
    const caseList = caseListJSON ? JSON.parse(caseListJSON) as CaseEntity[] : [];

    if (caseListJSON) {
        const updateCaseList = caseList.map((items) => {
            if (items.caseId === dispatch.caseId) {
                return { ...items, statusId: dispatch.status };
            }
            return items; 
        });
        
        localStorage.setItem('caseList', JSON.stringify(updateCaseList));
    }
}

export default dispatchUpdateLocate;