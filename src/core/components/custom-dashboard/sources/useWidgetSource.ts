// src/core/components/custom-dashboard/sources/useWidgetSource.ts
import { useContext } from "react";
import { DashboardSourceContext } from "@/core/components/custom-dashboard/sources/DashboardSourceContext";
import type { DashboardSourceContextValue } from "@/core/components/custom-dashboard/sources/DashboardSourceContext";
import type { WidgetSourceData } from "@/core/components/custom-dashboard/sources/types";

export const useDashboardSources = (): DashboardSourceContextValue => {
  const context = useContext(DashboardSourceContext);
  if (!context) {
    throw new Error("useDashboardSources must be used within a DashboardSourceProvider");
  }
  return context;
};

export interface WidgetSourceState {
  data: WidgetSourceData | undefined;
  /** False until the first message for this source arrives — drives the skeleton gate. */
  hasData: boolean;
}

/**
 * The only way a widget reads data. Widgets never touch the WebSocket directly.
 */
export const useWidgetSource = (sourceId: string): WidgetSourceState => {
  const { store } = useDashboardSources();
  const entry = store[sourceId];

  return {
    data: entry?.data,
    hasData: entry !== undefined,
  };
};
