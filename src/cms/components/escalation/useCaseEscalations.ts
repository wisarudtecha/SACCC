// The one surface the case timeline uses to read and acknowledge SLA
// escalations for a single case.
//
// Behind this facade sits either the real endpoints (GET
// /cases/{caseId}/escalations, POST /cases/{caseId}/escalations/{eid}/ack —
// contract in `src/cms/types/escalation.ts`) or the session-scoped stub,
// selected by VITE_MOCK_API — the timeline's code is identical either way.
// Same shape as `useUnitWorkloads`.
//
// FAILURE IS ISOLATED HERE. The real endpoints do not exist yet, so non-mock
// mode returns an empty, non-error result instead of firing a query that can
// only 404; the activity tab renders exactly as it does today. When the
// backend ships, an RTK query slots in next to the stub and only this file
// changes.
//
// KNOWN CALLER QUIRK: the CaseHistory preview defines its tab components
// inside the parent render, so this hook's consumer remounts on every parent
// render. Harmless against the deterministic session stub; when the real
// query lands, hoist those tab components to module scope first or every
// parent render becomes a refetch.
import { useCallback, useEffect, useState } from "react";
import { DEV_CONFIG } from "@/cms/utils/constants";
import type { EscalationRecord } from "@/cms/types/escalation";
import {
  acknowledgeEscalationStub,
  readCaseEscalationsStub,
} from "./mockEscalationEvents";

export interface UseCaseEscalationsResult {
  /** Escalation history for the case, oldest first. Empty while BE is absent. */
  records: EscalationRecord[];
  isLoading: boolean;
  isError: boolean;
  /** Id of the record whose acknowledge is in flight, for button loading state. */
  acknowledgingId: string | null;
  /** Acknowledge one open escalation; no-op when the ack fails (unknown id). */
  acknowledge: (escalationId: string, acknowledgedBy: string) => void;
  refetch: () => void;
}

export function useCaseEscalations(caseId: string | null | undefined): UseCaseEscalationsResult {
  const isMock = DEV_CONFIG.MOCK_API;
  const [records, setRecords] = useState<EscalationRecord[]>([]);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    if (isMock && caseId) {
      setRecords(readCaseEscalationsStub(caseId));
    } else {
      setRecords([]);
    }
  }, [isMock, caseId]);

  const acknowledge = useCallback(
    (escalationId: string, acknowledgedBy: string) => {
      if (!isMock || !caseId) {
        // Real ack endpoint is BE-pending; see the header note.
        return;
      }
      setAcknowledgingId(escalationId);
      const updated = acknowledgeEscalationStub(caseId, escalationId, acknowledgedBy);
      if (updated) {
        setRecords((previous) =>
          previous.map((record) => (record.id === updated.id ? updated : record))
        );
      }
      setAcknowledgingId(null);
    },
    [isMock, caseId]
  );

  const refetch = useCallback(() => {
    if (isMock && caseId) {
      setRecords(readCaseEscalationsStub(caseId));
    }
  }, [isMock, caseId]);

  return {
    records,
    isLoading: false,
    isError: false,
    acknowledgingId,
    acknowledge,
    refetch,
  };
}
