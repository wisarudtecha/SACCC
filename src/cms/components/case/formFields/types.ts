import { CaseDetails } from "@/cms/types/case";

/**
 * Every case form section reads the case and emits a patch. Sections never own
 * the case, so any screen can compose them regardless of how it stores state.
 */
export interface CaseFieldSectionProps {
    caseState: CaseDetails;
    onCaseChange: (updates: Partial<CaseDetails>) => void;
}
