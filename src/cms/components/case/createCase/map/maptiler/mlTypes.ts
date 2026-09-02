// Narrow helpers for the handful of MapLibre call sites that take a raw style
// expression, filter, or layer object.
//
// maplibre-gl's method signatures reference `FilterSpecification`,
// `AllPaintProperties`, `AddLayerObject` and friends, but does not re-export
// those names from its entry point - and reaching into
// `@maplibre/maplibre-gl-style-spec` (a transitive dep) for them is fragile
// under pnpm's strict layout. Deriving the parameter types from the method
// signatures themselves keeps everything resolvable with no extra import, and
// keeps the casts confined to one place instead of scattered `as` at every call.
import type { Map as MlMap } from "maplibre-gl";

type FilterValue = Parameters<MlMap["setFilter"]>[1];
type LayerObject = Parameters<MlMap["addLayer"]>[0];

/** Tag a hand-built expression array as a layer filter. */
export const asFilter = (value: unknown): FilterValue => value as FilterValue;

/** Tag a hand-built layer definition object. */
export const asLayer = (value: unknown): LayerObject => value as LayerObject;

/**
 * `setPaintProperty` with a loosened value type.
 *
 * The typed overload is generic per property name (`fill-color` wants a colour
 * spec, `line-width` a number spec, ...), and a hand-built `["match", ...]`
 * colour expression is a plain array that matches none of them without the
 * exact `DataDrivenPropertyValueSpecification` type - which maplibre-gl does not
 * re-export. This confines that one loosening to a single call.
 */
export function setPaintExpr(
  map: MlMap,
  layerId: string,
  name: string,
  value: unknown
): void {
  (map.setPaintProperty as unknown as (l: string, n: string, v: unknown) => void)(
    layerId,
    name,
    value
  );
}
