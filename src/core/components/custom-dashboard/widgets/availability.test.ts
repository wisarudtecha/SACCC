import { describe, expect, it } from "vitest";
import { isWidgetAvailable } from "./availability";
import type { WidgetDefinition } from "./types";

const definitionWithFeature = (feature?: WidgetDefinition["feature"]) =>
  ({ key: "w", feature } as WidgetDefinition);

const hasNothing = () => false;
const hasEverything = () => true;

describe("isWidgetAvailable", () => {
  it("keeps a widget with no declared feature regardless of entitlements", () => {
    expect(isWidgetAvailable(definitionWithFeature(), hasNothing)).toBe(true);
    expect(isWidgetAvailable(undefined, hasNothing)).toBe(true);
  });

  it("hides a widget whose feature the tenant does not own", () => {
    expect(isWidgetAvailable(definitionWithFeature("entitlement.gis"), hasNothing)).toBe(false);
  });

  it("shows a widget whose feature the tenant owns", () => {
    expect(isWidgetAvailable(definitionWithFeature("entitlement.gis"), hasEverything)).toBe(true);
  });
});
