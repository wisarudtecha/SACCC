// src/cms/components/dashboard/dispatch/useDispatchEventsFeed.ts
//
// Seeds from the most recent cases, then refetches (debounced) whenever a case
// lifecycle message arrives over the websocket - the same "a signal triggers a
// re-read of the authoritative source" shape WebSocketCaseEvent already uses for
// the case list (see websocket.tsx), rather than hand-patching a partial
// CASE-* payload into this feed's rows.
import { useEffect, useMemo, useRef } from "react";
import { useGetListCaseQuery } from "@/cms/store/api/caseApi";
import type { Case } from "@/cms/store/api/caseApi";
import { useWebSocket } from "@/core/components/websocket/websocket";

export const DISPATCH_EVENTS_FEED_LENGTH = 50;
const CASE_LIFECYCLE_EVENTS = new Set(["CASE-CREATE", "CASE-UPDATE", "CASE-STATUS-UPDATE"]);
const REFETCH_DEBOUNCE_MS = 1500;

export interface DispatchEventsFeedState {
  events: Case[];
  isLoading: boolean;
}

export const useDispatchEventsFeed = (): DispatchEventsFeedState => {
  const { data, isLoading, refetch } = useGetListCaseQuery({
    start: 0,
    length: DISPATCH_EVENTS_FEED_LENGTH,
    orderBy: "receivedDate",
    direction: "desc",
  });
  const { onMessage } = useWebSocket();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onMessage(message => {
      const event = message?.data?.EVENT;
      if (typeof event !== "string" || !CASE_LIFECYCLE_EVENTS.has(event)) {
        return;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        refetchRef.current();
      }, REFETCH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // Registered once for the component's lifetime, matching
    // DashboardSourceProvider's onMessage registration - `onMessage` is
    // recreated on every WebSocketProvider render, so depending on it here
    // would tear down and re-register the subscriber constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events = useMemo(() => data?.data ?? [], [data]);

  return { events, isLoading };
};
