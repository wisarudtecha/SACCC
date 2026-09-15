// src/core/components/custom-dashboard/widgets/types.ts
import type React from "react";
import type { LucideIcon } from "lucide-react";
import type { Language } from "@/core/config/i18n";
import type { DashboardWidget, WidgetConfig } from "@/core/types/dashboardLayout";
import type { WidgetSourceData } from "@/core/components/custom-dashboard/sources/types";
import type { CompactTileValue } from "@/core/components/custom-dashboard/widgets/compactAdapters";

/**
 * Widgets are pure and presentational. They receive data that has already arrived and
 * been parsed — there is no loading state to handle inside a widget, because `WidgetHost`
 * gates on it. They never fetch and never invent values.
 */
export interface WidgetRenderProps {
  widget: DashboardWidget;
  data: WidgetSourceData;
}

/**
 * A widget that fetches its own data (e.g. a `cms` REST query) instead of reading the
 * shared WebSocket `WIDGET_SOURCES` pipeline. It owns its own loading/skeleton state -
 * `WidgetHost` renders it directly, with no source lookup and no skeleton gate.
 *
 * There's no parsed `WidgetSourceData` for a `compactAdapter` to work from here, so the
 * compact/detailed choice is handed down as `compact` and the component itself decides
 * what its one headline number is; `icon` is passed through so a compact tile can reuse
 * the same icon the widget is registered with, without importing it a second time.
 */
export interface SelfFetchingWidgetRenderProps {
  widget: DashboardWidget;
  compact: boolean;
  icon: LucideIcon;
}

/** Which config fields a widget exposes in its settings modal. */
export type WidgetConfigurableField = "title" | "showHeader" | "colSpan" | "rowSpan" | "monthRange" | "topN" | "displayMode";

/**
 * Domain a widget belongs to, used to section the Add-Widget library. Open by design: adding
 * "kms" or "workspace" here (plus a `groups.*` i18n key) is all a future module needs to slot
 * its widgets into the shared picker.
 */
export type WidgetGroup = "case" | "product" | "kms" | "workspace" | "dispatch";

interface WidgetDefinitionBase {
  /** Registry key. This is what a persisted widget stores as `widgetKey`. */
  key: string;
  /** Which section of the library modal this widget appears under. */
  group: WidgetGroup;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  defaultPosition: { colSpan: number; rowSpan: number };
  defaultConfig: WidgetConfig;
  configurable: WidgetConfigurableField[];
}

export interface SourcedWidgetDefinition extends WidgetDefinitionBase {
  kind: "sourced";
  /** Key into `WIDGET_SOURCES` — the binding that makes a widget's data source unforgeable. */
  sourceId: string;
  Component: React.FC<WidgetRenderProps>;
  /** Powers "compact" displayMode - the one headline number to show as a tile instead of `Component`. */
  compactAdapter?: (data: WidgetSourceData, language: Language) => CompactTileValue | null;
}

/**
 * A widget whose data doesn't come from the shared WebSocket source pipeline (e.g. it
 * reads a `cms` REST endpoint directly). Kept out of `core`'s own registry entries -
 * modules that need this register their own definitions via `registerWidgetDefinition`,
 * so `core` never has to import module-specific code to declare them (see CLAUDE.md:
 * "core -> cms is an existing tangle to work around, not a pattern to extend").
 */
export interface SelfFetchingWidgetDefinition extends WidgetDefinitionBase {
  kind: "self-fetching";
  Component: React.FC<SelfFetchingWidgetRenderProps>;
}

export type WidgetDefinition = SourcedWidgetDefinition | SelfFetchingWidgetDefinition;
