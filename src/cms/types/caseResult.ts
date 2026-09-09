// src/cms/types/caseResult.ts
// Types for the Case Result entity: an org-curated, bilingual close-reason code
// (e.g. "Work Closed" / "ปิดงานเรียบร้อย") picked when an agent closes or cancels
// a case. The `resId` is what the close/cancel dispatch payload carries
// (see src/cms/components/case/CaseDetailView.tsx).
//
// Canonical home for the entity going forward. The legacy `caseResults` interface
// in src/cms/types/case.ts is still read by CaseDetailView from a localStorage
// snapshot; new code should import from here.

/**
 * One admin-curated case result. Mirrors the flat `Skill` shape
 * (src/cms/types/skill.ts): a business key + org + bilingual name + `active` +
 * audit fields.
 */
export interface CaseResult {
  id: string;
  orgId: string;
  resId: string;
  en: string;
  th: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CaseResultCreateData {
  active: boolean;
  en: string;
  th: string;
}

export interface CaseResultUpdateData {
  active: boolean;
  en: string;
  th: string;
}

export interface CaseResultQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface CaseResultManagementProps {
  caseResults?: CaseResult[];
  isLoading?: boolean;
  isError?: boolean;
  /** Re-run the list query (RTK Query `refetch`) - used by the container's retry. */
  onRefresh?: () => void;
}

export interface CaseResultMetrics {
  totalCaseResults: number | string;
  activeCaseResults: number | string;
  inactiveCaseResults: number | string;
}
