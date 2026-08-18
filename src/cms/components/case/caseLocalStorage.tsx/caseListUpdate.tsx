// utils/caseUtils.ts
import { TodayDate } from '@/cms/components/date/DateToString';
import { idbStorage } from '@/cms/components/idb/idb';
import { store } from '@/core/store/index';
import { Case, caseApi, CreateCase } from '@/cms/store/api/caseApi';
import { CaseEntity } from '@/cms/types/case';


export const getNewCaseDataByCaseId = async (caseId: string) => {
  try {
    const result = await store.dispatch(
      caseApi.endpoints.getCaseByIdMutation.initiate({ caseId })
    );

    if (!result?.data?.data) {
      if ('error' in result) {
        console.error('Failed to fetch case data:', result.error);
      }
      return;
    }

    const newCaseData = result.data.data;
    const caseList = await idbStorage.getItem("caseList") as Case[];
    const existingCaseIndex = caseList.findIndex((item) => item.caseId === caseId);

    if (existingCaseIndex !== -1) {
      caseList[existingCaseIndex] = newCaseData;
    } else {
      caseList.push(newCaseData);
    }

    idbStorage.setItem("caseList", JSON.stringify(caseList));

  } catch (error) {
    console.error('Error in getNewCaseDataByCaseId:', error);
  }
};


export const clearCaseData = () => {
  localStorage.removeItem("caseList");
};



function getPriorityOrder(priority: number): number {
  if (priority <= 3) return 1; // High
  if (priority <= 6) return 2; // Medium
  return 3; // Low
}

export function insertCaseToLocalStorage(
  newCase: CaseEntity,
  storageKey = "caseList"
): void {
  const caseListData = localStorage.getItem(storageKey) || "[]";
  const caseList = JSON.parse(caseListData) as CaseEntity[];

  const insertIndex = caseList.findIndex((existingCase) => {
    const newCasePriorityOrder = getPriorityOrder(newCase.priority);
    const existingCasePriorityOrder = getPriorityOrder(existingCase.priority);

    // Compare by priority group (High → Medium → Low)
    if (newCasePriorityOrder < existingCasePriorityOrder) {
      return true;
    }
    if (newCasePriorityOrder > existingCasePriorityOrder) {
      return false;
    }

    // If priority groups are equal, compare by date (newer first)
    const newCaseDate = new Date(newCase.createdAt || newCase.createdDate || "");
    const existingCaseDate = new Date(
      existingCase.createdAt || existingCase.createdDate || ""
    );
    return newCaseDate > existingCaseDate;
  });

  if (insertIndex === -1) {
    caseList.push(newCase);
  } else {
    caseList.splice(insertIndex, 0, newCase);
  }

  localStorage.setItem(storageKey, JSON.stringify(caseList));
}


export function updateCaseInLocalStorage(
  updateJson: CreateCase,
  caseIdToUpdate: string,
  profile?: { username?: string },
  storageKey = "caseList"
): boolean {
  try {
    const caseListData = localStorage.getItem(storageKey);
    const caseList: CaseEntity[] = caseListData ? JSON.parse(caseListData) : [];

    if (!caseIdToUpdate) return false;

    const caseIndex = caseList.findIndex(
      (item) => item.caseId === caseIdToUpdate
    );
    if (caseIndex === -1) return false;

    const originalCase = caseList[caseIndex];
    const updatedCase: CaseEntity = {
      ...originalCase,
      ...updateJson,
      caseSla: Number(updateJson.caseSla),
      id: originalCase.id,
      caseLocAddr: updateJson.caseLocAddr,
      caseId: originalCase.caseId,
      createdAt: originalCase.createdAt,
      createdBy: originalCase.createdBy,
      updatedAt: TodayDate(),
      updatedBy: profile?.username || "",
    };

    caseList[caseIndex] = updatedCase;
    localStorage.setItem(storageKey, JSON.stringify(caseList));
    return true;
  } catch (error) {
    console.error("Error updating case in localStorage:", error);
    return false;
  }
}