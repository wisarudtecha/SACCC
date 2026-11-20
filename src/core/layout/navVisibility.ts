// src/core/layout/navVisibility.ts
//
// Menu visibility rules that depend on the tenant's ENTITLEMENTS (not on RBAC -
// permission gating happens where the items are declared).
//
// Kept out of SuperSidebar.tsx for two reasons: a module that exports a component
// and a plain function loses Fast Refresh (react-refresh/only-export-components
// warns about exactly that), and the rule below decides which menus a user can
// see at all, so it is worth testing on its own.
//
// GENERIC ON PURPOSE. This rule has to guard three arrays that are maintained by hand
// and cannot see each other: `SuperSidebar`'s items, `cms`'s `AppSidebar` items and
// `SuperTopbar`'s "More" dropdown. For a long time only the first one carried the rule,
// so a locked KB/chat entry survived in the other two as a dead link - the exact
// divergence documented in the anti-regression log for the sidebar/topbar pair.
import type { EntitlementFeature } from "@/core/types/entitlement";

/**
 * The minimum shape this rule needs. Structural, so every menu's own item type can be
 * passed without importing (or widening) `NavItem`.
 */
export interface EntitlementAwareNavItem {
  feature?: EntitlementFeature;
  subItems?: readonly EntitlementAwareNavItem[];
}

/**
 * Drops every entry the tenant is not entitled to, instead of showing it locked.
 *
 * Used only when VITE_SHOW_ENTITLEMENT_UPSELL is off. A locked entry that stays in
 * the menu is a dead link (its route gate hides or redirects the page), and a lock
 * badge on it is exactly the notice that flag removes. A group whose children are
 * all locked is dropped with them, so its parent cannot open an empty submenu; that
 * is also why the check runs BEFORE `subItems` is inspected - a group carrying its
 * own `feature` represents the same purchase as its children.
 *
 * `isLocked` is an argument rather than a hook read so this stays pure: the caller
 * passes `useEntitlements().isLocked`, which is a fresh function identity each
 * render but is only ever called during that render.
 */
export const hideLockedNavItems = <T extends EntitlementAwareNavItem>(
  items: readonly T[],
  isLocked: (feature: EntitlementFeature) => boolean
): T[] =>
  items.flatMap((nav) => {
    if (nav.feature && isLocked(nav.feature)) {
      return [];
    }
    if (!nav.subItems) {
      return [nav];
    }
    const visibleSubItems = nav.subItems.filter(
      (subItem) => !(subItem.feature && isLocked(subItem.feature))
    );
    if (visibleSubItems.length === 0) {
      return [];
    }
    // Nothing was filtered: hand the SAME object back so the render tree (and any
    // downstream memo) sees no change at all.
    if (visibleSubItems.length === nav.subItems.length) {
      return [nav];
    }
    // The cast is the price of the generic item type: `subItems` here is narrowed to
    // the structural base type, while the caller's `T` keeps its own element type.
    // Every element came from `nav.subItems`, so the runtime shape is unchanged.
    return [{ ...nav, subItems: visibleSubItems } as unknown as T];
  });
