// Contact-resolution hook for the softphone workspace.
//
// Watches the active call and attempts to resolve the linked customer:
//  1. If the call carries a `customerId`, fetch by id.
//  2. Otherwise try the caller number via ANI lookup variants.
//
// Gated by mock/controls-enabled mode so it does not fire in production until
// the backend 3CX adapter lands.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLazyGetCustomerQuery,
  useLazyGetCustommerByPhoneNoQuery,
} from "@/cms/store/api/custommerApi";
import { useLazyGetListCaseByCustomerIdQuery } from "@/cms/store/api/caseApi";
import { normalizeThaiAni, aniLookupVariants } from "../../utils/ani";
import {
  extractCustomer,
  extractCaseSummaries,
  selectRecentCases,
  type CustomerSummary,
  type CaseSummary,
} from "../../utils/incomingCallPayload";
import type { CallSession } from "./softphoneCallState";
import type { ContactLookupStatus } from "./softphoneTypes";

export interface SoftphoneContactApi {
  customer: CustomerSummary | null;
  lookupStatus: ContactLookupStatus;
  recentCases: CaseSummary[];
}

/** Hook that resolves the customer for the currently active call. */
export function useSoftphoneContact(
  activeCall: CallSession | null,
  controlsEnabled: boolean
): SoftphoneContactApi {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [lookupStatus, setLookupStatus] = useState<ContactLookupStatus>("idle");
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);

  const [getCustomerById] = useLazyGetCustomerQuery();
  const [getCustomerByPhone] = useLazyGetCustommerByPhoneNoQuery();
  const [getCasesByCustomer] = useLazyGetListCaseByCustomerIdQuery();

  const resolveCases = useCallback(
    async (customerId: string, linkedCaseId?: string) => {
      try {
        const result = await getCasesByCustomer({
          customerId,
          start: 0,
          length: 10,
        }).unwrap();
        const cases = extractCaseSummaries(result);
        setRecentCases(selectRecentCases(cases, linkedCaseId, 3));
      } catch {
        setRecentCases([]);
      }
    },
    [getCasesByCustomer]
  );

  const resolveByPhone = useCallback(
    async (ani: string): Promise<CustomerSummary | null> => {
      const normalized = normalizeThaiAni(ani);
      if (!normalized) {
        return null;
      }
      for (const variant of aniLookupVariants(normalized)) {
        try {
          const envelope = await getCustomerByPhone({
            id: variant,
          }).unwrap();
          const extracted = extractCustomer(envelope);
          if (extracted) {
            return extracted;
          }
        } catch {
          // try next variant
        }
      }
      return null;
    },
    [getCustomerByPhone]
  );

  useEffect(() => {
    if (!controlsEnabled || activeCall === null) {
      setCustomer(null);
      setLookupStatus("idle");
      setRecentCases([]);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      setLookupStatus("loading");

      // 1. Try by customerId first
      if (activeCall.customerId) {
        try {
          const result = await getCustomerById(activeCall.customerId).unwrap();
          const extracted = extractCustomer(result);
          if (!cancelled) {
            if (extracted) {
              setCustomer(extracted);
              setLookupStatus("resolved");
              await resolveCases(extracted.id, activeCall.caseId);
            } else {
              setCustomer(null);
              setLookupStatus("unknown");
            }
          }
          return;
        } catch {
          // fall through to phone lookup
        }
      }

      // 2. No customerId or lookup failed — try phone variants.
      if (activeCall.ani) {
        try {
          const extracted = await resolveByPhone(activeCall.ani);
          if (!cancelled) {
            if (extracted) {
              setCustomer(extracted);
              setLookupStatus("resolved");
              await resolveCases(extracted.id, activeCall.caseId);
            } else {
              setCustomer(null);
              setLookupStatus("unknown");
            }
          }
          return;
        } catch {
          // fall through to unknown
        }
      }

      if (!cancelled) {
        setCustomer(null);
        setLookupStatus("unknown");
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [activeCall, controlsEnabled, getCustomerById, resolveCases, resolveByPhone]);

  return useMemo(
    () => ({
      customer,
      lookupStatus,
      recentCases,
    }),
    [customer, lookupStatus, recentCases]
  );
}
