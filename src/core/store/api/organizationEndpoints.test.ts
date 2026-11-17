// @vitest-environment node
//
// Regression test for a duplicate endpoint-name collision (fixed 2026-11-16).
//
// `baseApi` names endpoints GLOBALLY: RTK Query keeps exactly one definition per name, and a
// later `injectEndpoints` only replaces an existing one when `overrideExisting === true` — which
// every api slice here sets to `import.meta.env.DEV`. The winner therefore depends on module
// evaluation order, and it flips between dev and a production build.
//
// The Organization admin page (`core/components/admin/user-management/organization/`) deletes via
// `deleteCommands` / `deleteStations` / `deleteDepartments`, which invalidate the "Organization"
// tag. A second definition of `getCommands` / `getStations` in `cms/store/api/dispatch.ts`
// (`providesTags: ["Dispatch"]`) and of `getDepartments` in `core/store/api/userApi.ts`
// (no tags at all) used to shadow those queries, so the invalidation matched nothing and the
// deleted row stayed on screen until a full browser reload.
//
// The import order below is the assertion mechanism: the owner module is imported FIRST and the
// two former shadowers AFTER it, exactly the order in which a shadowing definition wins under
// `overrideExisting: true` (dev/test). If any of those names is redefined in a shadower, the
// captured definition is the shadower's and the expectation fails.
import { describe, expect, it } from "vitest";
import { baseApi } from "@/core/store/api/baseApi";
import "@/core/store/api/organizationApi";
import "@/core/store/api/userApi";
import "@/cms/store/api/dispatch";

type Captured = { providesTags?: unknown; query?: unknown };

/**
 * Reads the LIVE endpoint definitions out of `baseApi`.
 *
 * `endpointDefinitions` is not part of the public surface, but `enhanceEndpoints` hands the
 * stored definition object of a named endpoint to the callback it is given, which is the only
 * supported way to inspect what any given name currently resolves to.
 */
const captureLiveDefinitions = (names: string[]): Record<string, Captured> => {
  const captured: Record<string, Captured> = {};
  baseApi.enhanceEndpoints({
    endpoints: Object.fromEntries(
      names.map(name => [name, (definition: Captured) => { captured[name] = definition; }])
    ),
  });
  return captured;
};

const ORGANIZATION_LIST_ENDPOINTS = ["getDepartments", "getCommands", "getStations"];

describe("organization list endpoints", () => {
  it("runs in a mode where a duplicately-named definition would override, not be ignored", () => {
    // Guards the test itself: with `overrideExisting === false` the first registration always
    // wins, so a re-introduced duplicate would go unnoticed and these tests would pass for the
    // wrong reason.
    expect(import.meta.env.DEV).toBe(true);
  });

  it.each(ORGANIZATION_LIST_ENDPOINTS)(
    "%s is served by one definition that provides the Organization tag",
    (endpointName) => {
      const [definition] = [captureLiveDefinitions([endpointName])[endpointName]];

      expect(definition).toBeDefined();
      expect(definition.providesTags).toEqual(["Organization"]);
    }
  );

  it("keeps the pagination params the admin pages pass", () => {
    const { getCommands } = captureLiveDefinitions(["getCommands"]);

    // The dispatch copy sent `params` straight through; the organization copy builds the query
    // string itself. Either shape is fine as long as the args reach the request URL, so assert
    // on behaviour rather than on the implementation: asking for a slice of the list must
    // produce a URL carrying start/length.
    const prepared = (getCommands.query as (arg: { start: number; length: number }) => unknown)({
      start: 0,
      length: 1000,
    });

    expect(String(prepared)).toContain("length=1000");
  });
});
