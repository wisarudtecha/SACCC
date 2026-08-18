// src/core/components/custom-dashboard/widgets/productShared.ts
/**
 * Shared label + icon resolution for the product widgets, ported from
 * `src/cms/components/crm/products/ProductDashboard.tsx` so the widgets read the same way as
 * the standalone product dashboard. Backend keys are dynamic, so unrecognised keys are matched
 * by keyword and fall back to a generic icon.
 */
import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarDays,
  ClipboardList,
  Clock,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** "sparePart" -> "Spare Part". */
export const humanizeKey = (key: string): string =>
  key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, char => char.toUpperCase());

/** i18n lookup with a humanized fallback, so newly-added backend keys still render readably. */
export const translateOrHumanize = (
  t: (key: string) => string,
  key: string,
  translationKey: string
): string => {
  const translated = t(translationKey);
  return translated === translationKey ? humanizeKey(key) : translated;
};

const metricIconMap: Record<string, LucideIcon> = {
  product: Package,
  sparePart: Boxes,
  ordering: ShoppingCart,
  pending: Clock,
};

export const getMetricIcon = (key: string): LucideIcon => {
  if (metricIconMap[key]) {
    return metricIconMap[key];
  }
  const normalized = key.toLowerCase();
  if (normalized.includes("part")) return Boxes;
  if (normalized.includes("product")) return Package;
  if (normalized.includes("order")) return ShoppingCart;
  if (normalized.includes("pend") || normalized.includes("wait")) return Clock;
  if (normalized.includes("customer")) return Users;
  if (normalized.includes("appointment")) return CalendarDays;
  if (normalized.includes("cancel")) return AlertTriangle;
  if (normalized.includes("complete") || normalized.includes("grow")) return TrendingUp;
  return Tag;
};

const moduleIconMap: Record<string, LucideIcon> = {
  productStock: Activity,
  sparePartStock: ClipboardList,
  customers: Users,
  appointments: CalendarDays,
};

export const getModuleIcon = (key: string): LucideIcon => {
  if (moduleIconMap[key]) {
    return moduleIconMap[key];
  }
  const normalized = key.toLowerCase();
  if (normalized.includes("product")) return Package;
  if (normalized.includes("part")) return Boxes;
  if (normalized.includes("stock")) return Activity;
  if (normalized.includes("customer")) return Users;
  if (normalized.includes("appointment")) return CalendarDays;
  if (normalized.includes("order")) return ShoppingCart;
  if (normalized.includes("pend") || normalized.includes("wait")) return Clock;
  return Tag;
};
