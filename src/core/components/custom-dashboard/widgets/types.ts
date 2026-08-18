// src/core/components/custom-dashboard/widgets/types.ts
import type React from "react";
import type { LucideIcon } from "lucide-react";
import type { DashboardWidget, WidgetConfig } from "@/core/types/dashboardLayout";
import type { WidgetSourceData } from "@/core/components/custom-dashboard/sources/types";

/**
 * Widgets are pure and presentational. They receive data that has already arrived and
 * been parsed — there is no loading state to handle inside a widget, because `WidgetHost`
 * gates on it. They never fetch and never invent values.
 */
export interface WidgetRenderProps {
  widget: DashboardWidget;
  data: WidgetSourceData;
}

/** Which config fields a widget exposes in its settings modal. */
export type WidgetConfigurableField = "title" | "showHeader" | "colSpan" | "rowSpan" | "monthRange";

/**
 * Domain a widget belongs to, used to section the Add-Widget library. Open by design: adding
 * "kms" or "workspace" here (plus a `groups.*` i18n key) is all a future module needs to slot
 * its widgets into the shared picker.
 */
export type WidgetGroup = "case" | "product" | "kms" | "workspace";

export interface WidgetDefinition {
  /** Registry key. This is what a persisted widget stores as `widgetKey`. */
  key: string;
  /** Which section of the library modal this widget appears under. */
  group: WidgetGroup;
  /** Key into `WIDGET_SOURCES` — the binding that makes a widget's data source unforgeable. */
  sourceId: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  Component: React.FC<WidgetRenderProps>;
  defaultPosition: { colSpan: number; rowSpan: number };
  defaultConfig: WidgetConfig;
  configurable: WidgetConfigurableField[];
}
