// src/core/components/custom-dashboard/persistence/layoutSelection.ts
/**
 * Pure helpers for choosing which layout is on screen. No React, no side effects beyond the
 * two explicitly-named localStorage accessors.
 */
import { DEFAULT_LAYOUT_ID, LAST_LAYOUT_KEY } from "@/core/components/custom-dashboard/constants";
import type { DashboardLayout, DashboardLayoutSummary } from "@/core/types/dashboardLayout";

/**
 * A single frozen instance, so "no layouts" doesn't mint a new array identity on every render.
 * That churn is what previously drove the page into an unbounded update loop.
 */
export const EMPTY_LAYOUTS: readonly DashboardLayoutSummary[] = Object.freeze([]);

/** Only server-assigned ids are worth remembering; the built-in sentinel is not. */
export const isPersistableLayoutId = (layoutId: string | null | undefined): boolean =>
  typeof layoutId === "string" && layoutId !== "" && layoutId !== DEFAULT_LAYOUT_ID;

export const readStoredLayoutId = (): string | null => {
  try {
    return localStorage.getItem(LAST_LAYOUT_KEY);
  }
  catch (error) {
    console.error("🚀 ~ readStoredLayoutId ~ Failed to read last layout id:", error);
    return null;
  }
};

export const writeStoredLayoutId = (layoutId: string): void => {
  if (!isPersistableLayoutId(layoutId)) {
    return;
  }
  try {
    localStorage.setItem(LAST_LAYOUT_KEY, layoutId);
  }
  catch (error) {
    console.error("🚀 ~ writeStoredLayoutId ~ Failed to persist last layout id:", error);
  }
};

export const clearStoredLayoutId = (): void => {
  try {
    localStorage.removeItem(LAST_LAYOUT_KEY);
  }
  catch (error) {
    console.error("🚀 ~ clearStoredLayoutId ~ Failed to clear last layout id:", error);
  }
};

/**
 * Deterministic ordering for the "which one is the default" question.
 *
 * The server may or may not clear `isDefault` on the previous default when a new one is set
 * (unverified). If several claim it, prefer the most recently modified so the choice is at
 * least stable and explicable rather than dependent on list order.
 */
const pickDefault = (
  layouts: readonly DashboardLayoutSummary[]
): DashboardLayoutSummary | undefined => {
  const defaults = layouts.filter(layout => layout.isDefault);
  if (defaults.length === 0) {
    return undefined;
  }
  if (defaults.length === 1) {
    return defaults[0];
  }

  if (import.meta.env.DEV) {
    console.warn(
      `[custom-dashboard] ${defaults.length} layouts are marked isDefault; using the most recently modified.`
    );
  }

  return [...defaults].sort((a, b) => {
    const byModified = (b.lastModified ?? "").localeCompare(a.lastModified ?? "");
    return byModified !== 0 ? byModified : a.id.localeCompare(b.id);
  })[0];
};

/**
 * Resolution order: explicit id (URL) -> remembered id -> the default -> the first.
 * Returns undefined for an empty list; the caller substitutes its own stable fallback.
 * An unrecognised id is not an error — it simply falls through.
 */
export const resolveSelectedLayout = (
  layouts: readonly DashboardLayoutSummary[],
  requestedId: string | null | undefined
): DashboardLayoutSummary | undefined => {
  if (layouts.length === 0) {
    return undefined;
  }

  if (requestedId) {
    const requested = layouts.find(layout => layout.id === requestedId);
    if (requested) {
      return requested;
    }
  }

  const stored = readStoredLayoutId();
  if (stored && stored !== requestedId) {
    const remembered = layouts.find(layout => layout.id === stored);
    if (remembered) {
      return remembered;
    }
  }

  return pickDefault(layouts) ?? layouts[0];
};

/** Minimum shape of a list row: an identifiable layout, widgets not required. */
export const isDashboardLayoutSummary = (value: unknown): value is DashboardLayoutSummary => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<DashboardLayoutSummary>;
  return typeof candidate.id === "string" && candidate.id !== "";
};

/**
 * Runtime guard for anything we're about to adopt as the new baseline.
 *
 * Deliberately requires `widgets` to be an array: a mutation that reports success but returns
 * a shape we don't recognise (just `{id}`, `true`, or a widget-less list row) must NOT become
 * the user's layout, because adopting it would make an empty widget set look server-confirmed
 * and the next save would persist it. Callers re-read the detail record instead.
 */
export const isDashboardLayout = (value: unknown): value is DashboardLayout =>
  isDashboardLayoutSummary(value)
  && Array.isArray((value as Partial<DashboardLayout>).widgets);
