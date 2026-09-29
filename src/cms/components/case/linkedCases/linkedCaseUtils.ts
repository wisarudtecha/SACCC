import type { Case } from "@/cms/store/api/caseApi";

/**
 * Cases the agent is allowed to link as children: everything the search
 * returned, minus the current case itself, cases already linked to it, and
 * the case's own parent (linking your parent as your child would create a
 * cycle in the referCaseId chain).
 */
export const filterLinkableCases = (cases: Case[], excludeIds: string[]): Case[] => {
    const excluded = new Set(excludeIds.filter(Boolean));
    return cases.filter((caseItem) => !excluded.has(caseItem.caseId));
};
