// Orchestration for the incoming-call screen pop: websocket subscription,
// caller resolution, expiry, and the card actions.
//
// Everything state-shaped lives in the pure reducer
// (`incomingCallPopupState.ts`); this hook is the only place with side
// effects. Two discipline rules it follows (both documented in
// `useDispatchEventsFeed.ts`):
//
//   1. The `onMessage` subscription registers once for the component's
//      lifetime — `onMessage` is recreated on every WebSocketProvider render,
//      so depending on it would tear down and re-register constantly.
//   2. Resolution is guarded by an in-flight Set so React StrictMode's
//      double-invoked effects cannot fire the lazy lookups twice.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useLazyGetListCaseByCustomerIdQuery,
} from "@/cms/store/api/caseApi";
import {
  useLazyGetCustommerByPhoneNoQuery,
  useLazyGetCustomerQuery,
} from "@/cms/store/api/custommerApi";
import { useAnswerCallMutation } from "../../store/api/callControlApi";
import { isMockCallLifecycleActive } from "../softphone/mockCallLifecycle";
import { useAppNavigate } from "@/core/router/useAppNavigate";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useWebSocket } from "@/core/components/websocket/websocket";
import type { WebSocketMessage } from "@/core/components/websocket/websocket";
import { parseIncomingCallMessage } from "../../types/incomingCall";
import { aniLookupVariants, normalizeThaiAni } from "../../utils/ani";
import {
  extractCaseSummaries,
  extractCustomer,
  selectRecentCases,
  type CustomerSummary,
} from "../../utils/incomingCallPayload";
import {
  incomingCallPopupReducer,
  INCOMING_CALL_EXPIRY_TICK_MS,
  RECENT_CASES_SHOWN,
  type IncomingCallPopupAction,
  type IncomingCallPopupItem,
} from "./incomingCallPopupState";
import { createSeenCallIds } from "./callIdDedupe";

/**
 * Interim permission keys until the backend provisions a precise screen-pop
 * grant: the dedicated key wins once it exists, meanwhile any agent who can
 * already view cases or contacts gets the popup. Users with none of these
 * silently never see it.
 */
const SCREENPOP_PERMISSION_KEYS: readonly string[] = [
  "cc.screenpop.view",
  "case.view",
  "contact.view",
];

/** Cases fetched per customer so recent-first sorting has material. */
const CASES_FETCH_LENGTH = 10;

export interface IncomingCallPopupsApi {
  items: IncomingCallPopupItem[];
  /** Single entry point for call events — used by the WS subscription and the dev mock. */
  handleMessage: (message: WebSocketMessage) => void;
  openCase: (caseId: string) => void;
  createCase: (item: IncomingCallPopupItem) => void;
  /** Answer the ringing leg (in-app answer via the Call Control API — Q3 decision 2026-10-07). */
  answer: (callId: string) => void;
  dismiss: (callId: string) => void;
}

export function useIncomingCallPopups(): IncomingCallPopupsApi {
  const [items, setItems] = useState<IncomingCallPopupItem[]>([]);
  const { onMessage } = useWebSocket();
  const { hasPermission } = usePermissions();
  const navigate = useAppNavigate("cms");
  const [getCustomerByPhone] = useLazyGetCustommerByPhoneNoQuery();
  const [getCustomerById] = useLazyGetCustomerQuery();
  const [getCasesByCustomer] = useLazyGetListCaseByCustomerIdQuery();
  const [answerCall] = useAnswerCallMutation();

  const permissionRef = useRef(hasPermission);
  permissionRef.current = hasPermission;
  // Session-spanning callId memory — bounds redelivery-after-reconnect
  // resurrections; eviction semantics live in (and are tested by)
  // `callIdDedupe.ts`.
  const seenRef = useRef(createSeenCallIds());
  const inFlightRef = useRef<Set<string>>(new Set());

  const dispatch = useCallback((action: IncomingCallPopupAction) => {
    setItems((previous) => incomingCallPopupReducer(previous, action));
  }, []);

  const canScreenPop = useCallback(() => {
    return SCREENPOP_PERMISSION_KEYS.some((key) => permissionRef.current(key));
  }, []);

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      const event = parseIncomingCallMessage(message);
      if (!event) {
        return;
      }
      if (!canScreenPop()) {
        return;
      }
      // Dedupe spans the whole session (not just active cards) so a websocket
      // redelivery cannot resurrect a card the agent already dismissed. The
      // cap/eviction rules live in the SeenCallIds helper.
      if (seenRef.current.has(event.callId)) {
        return;
      }
      seenRef.current.add(event.callId);

      // A digit-less ANI (e.g. an "Anonymous" presentation) still deserves a
      // card; it just resolves to an unknown caller after one wasted lookup.
      const ani =
        normalizeThaiAni(event.ani) ??
        { raw: event.ani, digits: "", national: event.ani, e164: null };

      dispatch({ type: "enqueue", call: event, ani, now: Date.now() });
    },
    [canScreenPop, dispatch]
  );

  // Registered once for the component's lifetime — `onMessage` is recreated
  // on every WebSocketProvider render, so depending on it here would tear
  // down and re-register the subscriber constantly.
  useEffect(() => {
    const unsubscribe = onMessage(handleMessage);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveCustomer = useCallback(
    async (item: IncomingCallPopupItem): Promise<CustomerSummary | null> => {
      if (item.call.customerId) {
        const envelope = await getCustomerById(item.call.customerId).unwrap();
        return extractCustomer(envelope);
      }
      for (const variant of aniLookupVariants(item.ani)) {
        const envelope = await getCustomerByPhone({ id: variant }).unwrap();
        const customer = extractCustomer(envelope);
        if (customer) {
          return customer;
        }
      }
      return null;
    },
    [getCustomerById, getCustomerByPhone]
  );

  const resolveItem = useCallback(
    async (item: IncomingCallPopupItem) => {
      const callId = item.call.callId;
      inFlightRef.current.add(callId);
      dispatch({ type: "resolutionStarted", callId });
      try {
        const customer = await resolveCustomer(item);
        if (!customer) {
          dispatch({ type: "customerUnknown", callId });
          return;
        }
        dispatch({ type: "customerResolved", callId, customer });
        dispatch({ type: "casesLoading", callId });
        try {
          const caseEnvelope = await getCasesByCustomer({
            customerId: customer.id,
            start: 0,
            length: CASES_FETCH_LENGTH,
          }).unwrap();
          const cases = selectRecentCases(
            extractCaseSummaries(caseEnvelope),
            item.call.caseId,
            RECENT_CASES_SHOWN
          );
          dispatch({ type: "casesLoaded", callId, cases });
        } catch (error) {
          console.error("Incoming call screen pop: failed to load cases", error);
          dispatch({ type: "casesFailed", callId });
        }
      } catch (error) {
        // A rejected unwrap here means a conclusive business failure (the
        // hybrid base query converts a `status: "-1"` envelope into an RTK
        // error) or a transport error — either way the card shows the retry-
        // free error state. A clean miss resolves and never reaches this.
        console.error("Incoming call screen pop: caller lookup failed", error);
        dispatch({ type: "customerLookupFailed", callId });
      } finally {
        inFlightRef.current.delete(callId);
      }
    },
    [dispatch, getCasesByCustomer, resolveCustomer]
  );

  // Kicks off resolution for every card that needs it and is not already
  // in flight. Re-runs on each state change; the in-flight guard makes the
  // StrictMode double-invocation harmless.
  useEffect(() => {
    items
      .filter(
        (item) =>
          (item.lookup === "pending" || item.lookup === "resolving") &&
          !inFlightRef.current.has(item.call.callId)
      )
      .forEach((item) => {
        void resolveItem(item);
      });
  }, [items, resolveItem]);

  // Expiry sweep. The reducer returns the identical array reference when
  // nothing expired, so a quiet second does not re-render.
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: "expire", now: Date.now() });
    }, INCOMING_CALL_EXPIRY_TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [dispatch]);

  const openCase = useCallback(
    (caseId: string) => {
      navigate(`/case/${caseId}`);
    },
    [navigate]
  );

  const createCase = useCallback(
    (item: IncomingCallPopupItem) => {
      const params = new URLSearchParams();
      if (item.ani.national.length > 0) {
        params.set("phoneNo", item.ani.national);
      }
      if (item.customer?.id) {
        params.set("customerId", item.customer.id);
      }
      // Call↔case linkage: the create form captures these into its case
      // state (callLinkage) so the link to the call leg is ready when the
      // backend adapter contract adds the persistence field.
      params.set("callId", item.call.callId);
      if (item.call.ani) {
        params.set("ani", item.call.ani);
      }
      if (item.call.timestamp) {
        params.set("callTimestamp", item.call.timestamp);
      }
      const query = params.toString();
      navigate(`/case/creation${query ? `?${query}` : ""}`);
    },
    [navigate]
  );

  const dismiss = useCallback(
    (callId: string) => {
      dispatch({ type: "dismiss", callId });
    },
    [dispatch]
  );

  // Answer command for a ringing leg. A resolved command means "answer
  // accepted", not "answered": the authoritative confirmation is the
  // CALL_ANSWERED websocket lifecycle event, which the softphone's state
  // reducer upserts by callId without needing the ring — no extra plumbing.
  const answer = useCallback(
    async (callId: string) => {
      if (isMockCallLifecycleActive()) {
        // Adapter stand-in. A mock CALL_ANSWERED has no consumer (softphone
        // mock legs are a separate universe — see mockCallLifecycle.ts), so
        // the mock path only retires the card.
        dispatch({ type: "dismiss", callId });
        return;
      }
      try {
        await answerCall({ callId }).unwrap();
        dispatch({ type: "dismiss", callId });
      } catch (error) {
        // Conclusive business failure (status: "-1" envelope) or transport
        // error — keep the card so the agent can retry or dismiss.
        console.error("Incoming call screen pop: answer command failed", error);
      }
    },
    [answerCall, dispatch]
  );

  return { items, handleMessage, openCase, createCase, answer, dismiss };
}
