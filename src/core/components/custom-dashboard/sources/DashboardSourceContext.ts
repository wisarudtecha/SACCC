// src/core/components/custom-dashboard/sources/DashboardSourceContext.ts
import { createContext } from "react";
import type { WidgetSourceStore } from "@/core/components/custom-dashboard/sources/types";
import type { WebSocketConnectionState } from "@/core/components/websocket/websocket";

export interface DashboardSourceContextValue {
  store: WidgetSourceStore;
  // Reuses the provider's own union instead of restating it: this context value is the
  // provider's `connectionState` verbatim, so a copy only drifts the day a new state is
  // added (it did, when "unauthorized" was introduced).
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
}

export const DashboardSourceContext = createContext<DashboardSourceContextValue | null>(null);
