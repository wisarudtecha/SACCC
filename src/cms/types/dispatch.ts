import { FormFieldWithNode } from "@/cms/components/interface/FormField";
import { Attachment } from "./case";

export interface Commands {
    id: string;
    deptId: string;
    orgId: string;
    commId: string;
    en: string;
    th: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface Department {
    id: string;
    deptId: string;
    orgId: string;
    en: string;
    th: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}


export interface Station {
    id: string;
    orgId: string;
    deptId: string;
    commId: string;
    stnId: string;
    en: string;
    th: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface ServiceCenter {
    department: Department
    station: Station
    command: Commands
    name: string
}

export interface CaseSopParams {
    caseId: string;
}

export interface SopNodeData {
    data: {
        description: string;
        label: string;
        config?: {
            action: string;
            formId: string;
            pic?: string;
            group?: string;
            sla: string;
            condition?: string;
        };
    };
    id: string;
    position: {
        x: number;
        y: number;
    };
    type: string;
}

export interface CurrentStage {
    caseId: string;
    nodeId: string;
    versions: string;
    type: string;
    section: string;
    data: SopNodeData;
    pic: string;
    group: string | null;
    formId: string;
}

export interface CaselocAddr {
    number: string;
    building: string;
    road: string;
    sub_district: string;
    district: string;
    province: string;
    postal_code: string;
    country: string;
}

interface SlaTimelineEntry {
    orgId: string;
    caseId: string;
    unitId: string;
    userOwner: string;
    statusId: string;
    statusTh: string;
    statusEn: string;
    createdAt: string;
    duration: number;
}


export interface CaseSop {
    id: string;
    orgId: string;
    caseId: string;
    caseVersion: string;
    referCaseId: string | null;
    caseTypeId: string;
    caseSTypeId: string;
    priority: number;
    wfId: string;
    versions: string;
    source: string;
    deviceId: string;
    phoneNo: string;
    phoneNoHide: boolean;
    caseDetail: string | null;
    extReceive: string;
    statusId: string;
    caseLat: string;
    caseLon: string;
    caseLocAddr: string | CaselocAddr;
    caseLocAddrDecs: string;
    countryId: string;
    provId: string;
    distId: string;
    caseDuration: number;
    createdDate: string;
    startedDate: string;
    commandedDate: string;
    receivedDate: string;
    arrivedDate: string;
    closedDate: string;
    usercreate: string;
    usercommand: string;
    userreceive: string;
    userarrive: string;
    userclose: string;
    resId: string;
    resDetail: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sop: any[];
    currentStage: CurrentStage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatchStage: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextStage: any;
    referCaseLists: string[];
    unitLists: CaseSopUnit[];
    formAnswer: FormFieldWithNode;
    slaTimelines: SlaTimelineEntry[];
    deviceMetaData: DeviceMetaData;
    attachments: Attachment[];
    scheduleFlag:boolean;
    scheduleDate:string;
    sop_metadata:SOPStage[];
    customerId?: number;
}

export interface SOPFile {
  id: number;
  size: number;
  fileUrl: string;
  isImage: boolean;
  originalFileName: string;
  fileTempUrl?: string;
}

export interface SOPComponent {
  type: "InsertFile" | "TextArea" | "TextInput" | "Topic" | "Radio" | string;
  label: string;
  value: string | number | SOPFile[] | null;
}

export interface SOPStage {
  stageNo: number;
  displayName: string;
  components: SOPComponent[];
}

export interface DeviceMetaData {
    device_id: string;
    device_name: string;
    device_type: string;
    device_serial_number: string;
    device_model: string;
    device_brand: string;
    device_location: {
        latitude: string;
        longitude: string;
    };
}

export interface CaseSopUnit {
    unitId: string,
    username: string,
    firstName: string,
    lastName: string,
    createdBy:string,
    statusId:string
}

export interface Unit {
    orgId: string;
    unitId: string;
    unitName: string;
    unitSourceId: string;
    unitTypeId: string;
    priority: number;
    compId: string;
    deptId: string;
    commId: string;
    stnId: string;
    plateNo: string;
    provinceCode: string;
    active: boolean;
    photo: string;
    username: string;
    isLogin: boolean;
    isFreeze: boolean;
    isOutArea: boolean;
    locLat: number;
    locLon: number;
    locAlt: number;
    locBearing: number;
    locSpeed: number;
    locProvider: number;
    locGpsTime: string;
    locSatellites: number;
    locAccuracy: number;
    locLastUpdateTime: string;
    breakDuration: number;
    healthChk: string;
    healthChkTime: string;
    sttId: string;
    createdBy: string;
    updatedBy: string;
    unitPropLists: string[];
    skillLists: {
        skillId: string
        en: string
        th: string
    }[];
    proplLists: {
        propId: string
        en: string
        th: string
    }[]
}

export interface UnitWithSop {
    unit: CaseSopUnit
    Sop: CaseSop
}

export interface PaginationParams {
    start?: number;
    length?: number;
    search?: string;
}

export interface dispatchInterface {
    caseId: string
    nodeId?: string,
    status: string,
    unitId?: string,
    resId?: string,
    resDetail?: string,
    unitUser?: string
}


export interface CancelCase {
  caseId: string;
  resDetail: string;
  resId: string;
}

export interface CancelUnit {
  caseId: string;
  resDetail?: string;
  resId?: string;
  unitId: string;
  unitUser: string;
}
