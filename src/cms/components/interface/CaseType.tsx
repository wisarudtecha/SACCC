
export interface CaseType {
    id: string;
    typeId: string;
    orgId: string;
    en: string;
    th: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}


export interface CaseSubType {
    id: string;
    typeId: string;
    sTypeId: string;
    sTypeCode: string;
    orgId: string;
    en: string;
    th: string;
    wfId: string;
    caseSla: string;
    priority: string;
    userSkillList: string[];
    unitPropLists: string[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}





export interface CaseTypeSubType {
  typeId: string;
  orgId: string;
  en: string;
  th: string;
  active: boolean;
  sTypeId: string;
  sTypeCode: string;
  subTypeEn: string;
  subTypeTh: string;
  wfId: string;
  caseSla: string;
  priority: number;
  userSkillList: string[];
  unitPropLists: string[];
  subTypeActive: boolean;
}