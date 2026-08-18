export interface AppointmentType {
  id: string;
  appointmentTypeId: string;
  orgId: string;
  en: string | null;
  th: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AppointmentTypeInsert {
  appointmentTypeId: string;
  en: string | null;
  th: string | null;
  active: boolean;
}

export interface AppointmentTypeUpdate {
  appointmentTypeId: string;
  en: string | null;
  th: string | null;
  active: boolean;
}