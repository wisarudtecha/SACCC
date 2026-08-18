// /src/types/device.ts
export interface BaseProperty {
  id: string;
  propId: string;
  orgId: string;
  en: string;
  th: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PropertyAnalytics {
  totalProperties: number;
  activeProperties: number;
  expiringSoon: number;
  complianceRate: number;
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  usageStats: {
    propertyId: string;
    unitCount: number;
  }[];
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "regex" | "custom";
  value: string | number;
  message: string;
}

export interface PropertyDependency {
  propertyId: string;
  condition: "requires" | "conflicts" | "enhances";
  value?: string;
}

export interface PropertyDefinition extends BaseProperty {
  propertyCode: string;
  category: "equipment" | "capability" | "certification" | "resource" | "skill";
  dataType: "string" | "number" | "boolean" | "date" | "select" | "multiselect";
  description?: string;
  validationRules: ValidationRule[];
  dependencies: PropertyDependency[];
  lifecycle: {
    expirationPeriod?: number; // months
    renewalRequired: boolean;
    maintenanceSchedule?: "monthly" | "quarterly" | "annually";
    verificationLevel: "self-reported" | "supervisor-verified" | "certified";
  };
  metadata: {
    priority: "low" | "medium" | "high" | "critical";
    costImpact: number;
    trainingRequired: boolean;
    certificationBody?: string;
  };
}

export interface UnitProperty {
  id: string;
  unitId: string;
  propertyId: string;
  value: string | number | boolean;
  status: "active" | "inactive" | "maintenance" | "expired" | "pending";
  verificationDate?: string;
  expirationDate?: string;
  verifiedBy?: string;
  evidence: string[];
  notes?: string;
}
