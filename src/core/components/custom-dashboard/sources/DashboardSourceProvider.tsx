// src/core/components/custom-dashboard/sources/DashboardSourceProvider.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { DashboardSourceContext } from "@/core/components/custom-dashboard/sources/DashboardSourceContext";
import { getStoredProfile } from "@/core/components/custom-dashboard/sources/profile";
import { SOURCE_BY_WS_TYPE, WIDGET_SOURCES } from "@/core/components/custom-dashboard/sources/registry";
import type { WidgetSourceStore } from "@/core/components/custom-dashboard/sources/types";
import type { JSONObject } from "@/core/types/dashboard";
import type { WebSocketMessage } from "@/core/components/websocket/websocket";

/**
 * The single WebSocket subscription for the whole dashboard.
 *
 * Widgets never call `useWebSocket`, `send`, or `onMessage` themselves — if they did,
 * N widgets would mean N subscribers and N duplicate DASHBOARD subscribe frames. They
 * read parsed data through `useWidgetSource` instead. This provider guarantees exactly
 * one subscriber and exactly one subscribe frame per connection, whatever the widget count.
 */
export const DashboardSourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connectionState, isConnected, onMessage, send } = useWebSocket();
  const [store, setStore] = useState<WidgetSourceStore>({});

  /** Guards the subscribe frame so it is sent once per connection, not once per render. */
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      const envelope = message?.data as JSONObject | undefined;
      const additionalJson = envelope?.["additionalJson"] as JSONObject | undefined;
      const wsType = additionalJson?.["type"];

      if (typeof wsType !== "string") {
        return;
      }

      const source = SOURCE_BY_WS_TYPE[wsType];
      if (!source || !envelope) {
        // Not a dashboard message (case events, heartbeats, …). Cheap to ignore.
        return;
      }

      try {
        const data = source.parse(envelope);
        setStore(previous => ({
          ...previous,
          [source.id]: { data, receivedAt: Date.now() },
        }));
      }
      catch (error) {
        console.error(`🚀 ~ DashboardSourceProvider ~ Failed to parse "${wsType}":`, error);
      }
    };

    // `onMessage` is recreated on every WebSocketProvider render (it is not memoized),
    // so depending on it here would tear down and re-register the subscriber constantly.
    // Registering once for the provider's lifetime is the correct behavior.
    const unsubscribe = onMessage(handleMessage);
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isConnected) {
      // Allow the next successful connection to re-subscribe; otherwise a reconnect
      // would leave every widget stuck on its skeleton forever.
      hasSubscribedRef.current = false;
      return;
    }

    if (hasSubscribedRef.current) {
      return;
    }

    const profile = getStoredProfile();
    send({ EVENT: "DASHBOARD", orgId: profile.orgId, username: profile.username });

    // A source may override how it subscribes; none do today.
    Object.values(WIDGET_SOURCES).forEach(source => source.subscribe?.(send, profile));

    hasSubscribedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const value = useMemo(
    () => ({ store, connectionState, isConnected }),
    [store, connectionState, isConnected]
  );

  return (
    <DashboardSourceContext.Provider value={value}>
      {children}
    </DashboardSourceContext.Provider>
  );
};
