// /src/types/audit.ts
export interface AuditLog {
  id: number;
  orgId: string;
  username: string;
  txId: string;
  uniqueId: string;
  mainFunc: string;
  subFunc: string;
  nameFunc: string;
  action: string;
  status: number;
  duration: number;
  newData: Record<string, unknown>;
  oldData: Record<string, unknown>;
  resData: Record<string, unknown>;
  message: string;
  createdAt: string;
}

// The API sends newData/oldData/resData as JSON strings, not objects; they only
// match AuditLog's shape after processAuditLog parses them.
export type RawAuditLog = Omit<AuditLog, "newData" | "oldData" | "resData"> & {
  newData?: string | Record<string, unknown>;
  oldData?: string | Record<string, unknown>;
  resData?: string | Record<string, unknown>;
};

export interface AuditFilter {
  dateRange: {
    start: string;
    end: string;
  };
  mainFunc: string;
  subFunc: string;
  action: string;
  status: string;
  search: string;
}
