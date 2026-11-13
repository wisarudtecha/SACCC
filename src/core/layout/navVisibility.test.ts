// src/core/layout/navVisibility.test.ts
//
// The sidebar rule behind VITE_SHOW_ENTITLEMENT_UPSELL="false": an entry the tenant
// cannot use is REMOVED, not shown locked. Getting this wrong in either direction is
// user-visible:
//
//   too eager   -> a menu the tenant actually bought disappears (no error anywhere)
//   too lax     -> a locked entry stays as a dead link that only bounces off the
//                  route gate, which is the notice the flag is meant to remove
//
// Node environment: this is pure list filtering, no DOM.
import { describe, expect, it } from "vitest";
import { hideLockedNavItems } from "./navVisibility";
import type { NavItem } from "./SuperSidebar";
import type { EntitlementFeature } from "@/core/types/entitlement";

const LOCKED = new Set<EntitlementFeature>(["entitlement.chat", "entitlement.kb"]);
const isLocked = (feature: EntitlementFeature) => LOCKED.has(feature);

const link = (name: string, feature?: EntitlementFeature): NavItem => ({
  name,
  icon: null,
  path: `/${name.toLowerCase()}`,
  ...(feature ? { feature } : {}),
});

const group = (
  name: string,
  subItems: NonNullable<NavItem["subItems"]>,
  feature?: EntitlementFeature,
): NavItem => ({
  name,
  icon: null,
  subItems,
  ...(feature ? { feature } : {}),
});

const names = (items: NavItem[]) => items.map((item) => item.name);

describe("hideLockedNavItems", () => {
  it("drops a locked link and keeps the entitled one", () => {
    const items = [link("Chat", "entitlement.chat"), link("Cases")];

    expect(names(hideLockedNavItems(items, isLocked))).toEqual(["Cases"]);
  });

  it("removes an entitled link only when it is actually locked", () => {
    const items = [link("Knowledge", "entitlement.kb"), link("Cases")];

    expect(names(hideLockedNavItems(items, isLocked))).toEqual(["Cases"]);
    // Same input, nothing locked: everything survives.
    expect(names(hideLockedNavItems(items, () => false))).toEqual([
      "Knowledge",
      "Cases",
    ]);
  });

  it("filters locked sub-items but keeps the group when some remain", () => {
    const items = [
      group("Chat", [
        { name: "Lobby", icon: null, path: "/lobby", feature: "entitlement.chat" },
        { name: "History", icon: null, path: "/history", feature: "entitlement.chat" },
        { name: "Settings", icon: null, path: "/settings" },
      ]),
    ];

    const result = hideLockedNavItems(items, isLocked);

    expect(result).toHaveLength(1);
    expect(result[0].subItems?.map((sub) => sub.name)).toEqual(["Settings"]);
  });

  it("drops a group whose every sub-item is locked", () => {
    const items = [
      group("Chat", [
        { name: "Lobby", icon: null, path: "/lobby", feature: "entitlement.chat" },
        { name: "History", icon: null, path: "/history", feature: "entitlement.chat" },
      ]),
      link("Cases"),
    ];

    // Not an empty group left behind - the parent must not open a blank submenu.
    expect(names(hideLockedNavItems(items, isLocked))).toEqual(["Cases"]);
  });

  it("drops a group carrying its own locked feature, even with entitled children", () => {
    const items = [
      group(
        "Knowledge",
        [{ name: "Articles", icon: null, path: "/articles" }],
        "entitlement.kb",
      ),
    ];

    expect(hideLockedNavItems(items, isLocked)).toEqual([]);
  });

  it("keeps a group with no entitlement flags at all", () => {
    const items = [group("Cases", [{ name: "List", icon: null, path: "/list" }])];

    expect(hideLockedNavItems(items, isLocked)).toEqual(items);
  });

  it("returns the same object identity when nothing was filtered out", () => {
    // Nothing changed, so the render tree (and any memo below it) sees no change.
    const items = [
      link("Cases"),
      group("Knowledge", [{ name: "Articles", icon: null, path: "/articles" }]),
    ];

    const result = hideLockedNavItems(items, isLocked);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(items[0]);
    expect(result[1]).toBe(items[1]);
  });
});
