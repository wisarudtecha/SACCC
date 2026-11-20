// Which registered widgets a tenant may actually add or see.
//
// The rule is one line, and it lives here rather than inline in the two call sites
// (the library modal and the dashboard grid) so the two cannot disagree: a widget that
// declares a `feature` is available only when that feature is granted. Unknown widgets
// are left alone - `WidgetHost` already renders them as `UnknownWidget`, which is a
// different problem from an entitlement.
import type { EntitlementFeature } from "@/core/types/entitlement";
import type { WidgetDefinition } from "@/core/components/custom-dashboard/widgets/types";

/**
 * @param definition         the registry entry, if the key resolves
 * @param hasFeature         `useEntitlements().hasFeature` - deliberately the fail-closed
 *                           read, so a widget cannot flash in before entitlements resolve
 *                           and then disappear
 */
export function isWidgetAvailable(
  definition: WidgetDefinition | undefined,
  hasFeature: (feature: EntitlementFeature) => boolean
): boolean {
  if (!definition) {
    return true;
  }
  return !definition.feature || hasFeature(definition.feature);
}
