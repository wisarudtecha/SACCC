export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentId: string;
  caseId: string;
  note:string;
  appointmentType: {
    id: string
    th: string
    en: string
    appointmentTypeId: string
  }
  done:boolean,
  customerPhoto:string,
  serviceType: {
    id: string
    th: string
    en: string
    serviceId: string
    priority:number
  }
  customerMobileNo:string,
  customerNumber: string,
  orgId: string;
  en: string | null;
  th: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  customerName:string
  status:{
    th: string
    en: string
    statusId:string
  }
  nextStatus:{
    th: string
    en: string
    statusId:string
  } | null
}

export interface AppointmentInsert {
  appointmentDate: string;
  appointmentTypeId: string;
  serviceId?: string;
  note:string;
  customerId: string,
  caseId?: string
  units?: {
    unitId:string,
    userOwner:string
  }[]
}

export interface AppointmentUpdate {
  appointmentDate: string;
  appointmentId: string;
  appointmentTypeId: string;
  serviceId?: string;
  note:string;
  done:boolean,
  customerId: string,
  en: string | null;
  th: string | null;
}

export interface AppointmentStatusCount {
  statusId: string;
  count: number;
}