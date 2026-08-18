// src/core/components/custom-dashboard/sources/DashboardSourceContext.ts
import { createContext } from "react";
import type { WidgetSourceStore } from "@/core/components/custom-dashboard/sources/types";

export interface DashboardSourceContextValue {
  store: WidgetSourceStore;
  connectionState: "connecting" | "connected" | "disconnected" | "error";
  isConnected: boolean;
}

export const DashboardSourceContext = createContext<DashboardSourceContextValue | null>(null);
