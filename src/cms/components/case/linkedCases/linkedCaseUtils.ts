import type { Case } from "@/cms/store/api/caseApi";
import type { ApiResponse } from "@/cms/types";
import type { CaseSop } from "@/cms/types/dispatch";

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

/** The subset of a case record the linked-cases list actually renders. */
export interface LinkedCaseSummary {
    caseId: string;
    caseDetail: string | null;
    statusId: string;
    priority: number;
    createdDate: string;
    createdBy: string;
}

export const caseSopToSummary = (sop: CaseSop): LinkedCaseSummary => ({
    caseId: sop.caseId,
    caseDetail: sop.caseDetail,
    statusId: sop.statusId,
    priority: sop.priority,
    createdDate: sop.createdDate,
    createdBy: sop.createdBy,
});

export interface LinkedCasePartition {
    /** Cases whose details loaded, in the same order as their ids. */
    loaded: LinkedCaseSummary[];
    /** Ids whose fetch failed or returned no data - still linked, still must be shown. */
    failedIds: string[];
}

/**
 * Split settled per-id fetches into renderable cases and ids that could not be
 * loaded. A linked case must NEVER vanish from the list because its detail fetch
 * failed (e.g. a cancelled/closed case the lookup endpoint won't serve) - the id
 * is the server's own referCaseLists entry, so the link exists whether or not
 * the details could be retrieved.
 */
export const partitionLinkedCaseResults = (
    ids: string[],
    results: PromiseSettledResult<ApiResponse<CaseSop>>[]
): LinkedCasePartition => {
    const loaded: LinkedCaseSummary[] = [];
    const failedIds: string[] = [];
    results.forEach((result, index) => {
        const sop = result.status === "fulfilled" ? result.value.data : undefined;
        if (sop) {
            loaded.push(caseSopToSummary(sop));
        } else {
            failedIds.push(ids[index]);
        }
    });
    return { loaded, failedIds };
};
