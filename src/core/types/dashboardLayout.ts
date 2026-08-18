// src/core/types/dashboardLayout.ts
/**
 * Persisted dashboard layout DTOs for the customizable dashboard.
 *
 * These are deliberately separate from `src/core/types/dashboard.ts`, which
 * belongs to the older (unmounted) dashboard and models widgets differently:
 * it stores runtime `data` inside the persisted widget and binds data sources
 * through a free-form `dataSource?: string` that nothing reads.
 *
 * Here a layout is pure configuration. A widget binds to its data through
 * `widgetKey`, which is the key of the widget registry; the registry entry
 * carries the `sourceId` of the WebSocket source that feeds it. There is no
 * code path that renders a widget without resolving that binding.
 */

/** Placement within the dashboard grid. Order-based, not coordinate-based. */
export interface GridPosition {
  /** Ascending sort key. Re-stamped from the array index after a drag. */
  order: number;
  /** Columns occupied in the 4-column grid. */
  colSpan: number;
  /** Rows occupied. */
  rowSpan: number;
}

/** Per-widget display options. Only fields listed in a widget's registry entry are editable. */
export interface WidgetConfig {
  showHeader?: boolean;
  /** Number of trailing months a monthly-series widget should show. */
  monthRange?: number;
}

export interface DashboardWidget {
  id: string;
  /**
   * Key into the widget registry (`WIDGET_DEFINITIONS`). Kept as `string` rather
   * than a union so a layout saved by a newer build — carrying a widget this build
   * doesn't know — degrades to `UnknownWidget` instead of failing to parse.
   */
  widgetKey: string;
  /** Overrides the widget's default title. Falls back to the source payload's own title. */
  title?: string;
  position: GridPosition;
  config: WidgetConfig;
}

/**
 * `/api/v1/layout_configurations` is a shared table keyed by `type` (see
 * layoutConfigCURL.sh) — presumably other UI surfaces persist their own layout
 * kind through the same endpoint. This API only ever reads/writes `"dashboard"`
 * rows; the constant is intentionally not part of the public DTOs below so that
 * callers of `dashboardLayoutApi` never need to know or supply it — the API file
 * bakes it into every request itself.
 */
export const DASHBOARD_LAYOUT_TYPE = "dashboard";

/**
 * What `GetListLayout` returns: layout metadata, WITHOUT `widgets`.
 *
 * This is not a convenience subset — it is the actual wire shape of the list endpoint,
 * verified against a live response. Modelling it separately is what stops a list row from
 * being handed to the draft, which previously threw `widgets is not iterable` and, had it
 * been "fixed" by coercing to `[]`, would have let the next save overwrite real widgets
 * with an empty array.
 */
export interface DashboardLayoutSummary {
  id: string;
  /** Always `"dashboard"` for rows this API returns; the table is shared across layout kinds. */
  type?: string;
  name: string;
  isShared: boolean;
  isDefault: boolean;
  orgId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: string;
  /** ISO 8601 string, not a `Date` — this crosses a JSON wire. */
  lastModified: string;
}

/**
 * A complete layout. Only `GetLayoutById` (and the mock store) can produce one, because
 * only it returns `widgets`. This is the sole shape the editable draft may be seeded from.
 */
export interface DashboardLayout extends DashboardLayoutSummary {
  widgets: DashboardWidget[];
}

/** `orgId` and `createdBy` are server-derived and must not be sent by the client. */
export interface DashboardLayoutCreateData {
  name: string;
  isShared: boolean;
  isDefault: boolean;
  widgets: DashboardWidget[];
}

export type DashboardLayoutUpdateData = Partial<DashboardLayoutCreateData>;

/** Matches `LayoutListInput!` in layoutConfigCURL.sh, minus `type` (see above). */
export interface DashboardLayoutQueryParams {
  isShared?: boolean;
  isDefault?: boolean;
  /** Pagination offset. Defaults to 0 inside the API layer when omitted. */
  start?: number;
  /** Pagination page size. Defaults to 100 inside the API layer when omitted. */
  length?: number;
}
