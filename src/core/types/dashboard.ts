// src/core/types/dashboard.ts
export type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
export type JSONArray = Array<JSONValue>;
export type JSONObject = { [key: string]: JSONValue };
export type ViewMode = "monthly" | "daily";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: GridPosition;
  data?: unknown;
  isLoading?: boolean;
  error?: string;
  // Updated: [07-07-2025] v0.1.1
  rowHeight?: number;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  refreshInterval?: number;
  dataSource?: string;
  chartType?: string;
  filters?: unknown[];
  customSettings?: Record<string, unknown>;
  // Updated: [07-07-2025] v0.1.1
  showHeader?: boolean;
  headerColor?: string;
  backgroundColor?: string;
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'map'
  | 'timeline'
  | 'kanban'
  | 'activity'
  // Updated: [07-07-2025] v0.1.1
  | 'circular-progress'
  | 'area-chart'
  | 'world-map'
  | 'case-status'
  | 'sla-monitor'
  | 'case-assignment'
  | 'workflow-status';

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isShared: boolean;
  createdBy: string;
  lastModified: Date;
  // Updated: [07-07-2025] v0.1.1
  rowHeight: number;
}
