# Implementation Prompt — Smart Routing Engine + ETA/TTL on the ArcGIS Case Map

> **How to use this file:** paste it into Claude Code as the task brief, or run
> `claude "follow docs/prompt-staff-map-route.md"` from the repo root.
> Read `docs/prompt-staff-map-assign.md` first — this feature extends the same panel and
> follows the same ownership rules.

---

## 1. Task

Draw the **driving route from the selected staff member to the open case**, and show its
**drive time and distance**, from the staff card on the ArcGIS case map.

This fills in two sections that `staffPanelSections.tsx` has **already declared** as
`in-development`, with labels and descriptions already present in all three i18n catalogues:

| Section id | Existing label | Existing description (already shipped) |
|---|---|---|
| `smart-routing` | Smart Routing Engine | *"Calculates and draws the best driving route from the responding unit to the incident."* |
| `eta-ttl` | ETA / TTL Dashboard | *"Live estimated time of arrival and time to arrive for the responding unit, adjusted for traffic."* |

Your job is to write those two `render` functions, flip `status` to `"available"`, and add one
route polyline layer to the map. **Nothing else.**

**One officer, one case, two stops.** This is *not* a multi-stop route builder. See §10.

---

## 2. ⚠️ Phase 0 — spike before writing any feature code

Two things can invalidate this entire feature. Verify both first and **report back before
continuing**:

1. **Routing entitlement.** `VITE_ARCGIS_API_KEY` is currently provisioned for basemaps and the
   World Geocoding Service. The World Route service is a **separate, credit-consuming premium
   operation** and needs routing privileges on the key. Confirm in the ArcGIS portal, then prove it
   with one live `route.solve` call.
2. **Thailand route quality.** The app centres on Bangkok and defaults to `th`. Esri's street
   network and live-traffic coverage outside North America / Europe is materially weaker. Solve a
   handful of real Bangkok origin/destination pairs and sanity-check the drive times against
   reality. **A confidently wrong ETA is worse than no ETA** — a dispatcher will send the wrong
   unit. If quality is poor, stop and say so.

Also confirm whether traffic-aware travel modes are available on the key. If they are not, the
`eta-ttl` description's *"adjusted for traffic"* wording must change with the feature — don't ship
a label that overstates what the number is.

---

## 3. Read these files before writing any code

| File | Why |
|---|---|
| `src/cms/components/case/createCase/map/staff/staffPanelSections.tsx` | The registry you are filling in — its header comment describes this exact task |
| `src/cms/components/case/createCase/map/staff/StaffDetailPanel.tsx` | Renders the accordion; lines ~190–220 show how `render` is called |
| `src/cms/components/case/createCase/map/staff/CaseStaffMapField.tsx` | Owns layer state; the header explains **why state must live above `ArcgisAddressMapField`** |
| `src/cms/components/case/createCase/map/staff/useStaffGraphicsLayer.ts` | The pattern your route layer must copy — in-place diffing, view-settle sync, hitTest ordering |
| `src/cms/components/case/createCase/map/staff/staffTypes.ts` | `StaffMarker`, `isMappableCoordinate`, `isStaleLocation` |
| `src/cms/components/case/createCase/map/ArcgisAddressMap.tsx` | Owns the MapView; see how `staff` / `showStaff` are threaded in |
| `src/cms/components/case/createCase/map/BoundaryMapField.tsx` + `ArcgisAddressMapField.tsx` | The pass-through chain your new props follow |
| `src/cms/components/case/createCase/map/arcgisSetup.ts` | `initArcgis()` — sets `esriConfig.apiKey`, which `route.solve` picks up automatically |
| `src/core/config/api.ts` | Where `ARCGIS_ROUTE_URL` goes, next to `ARCGIS_GEOCODE_URL` |
| `CLAUDE.md` | Repo conventions — follow them |

---

## 4. Hard constraints

### Do not modify

- `useStaffGraphicsLayer.ts`, `staffClusters.ts`, `staffSymbols.ts` — the staff layer is correct.
  Add a **second, independent** layer; do not extend the staff one.
- `ArcgisAddressMap`'s click handler / `hitTest` ordering. The route polyline must be
  **non-interactive**: clicking it does nothing and must not swallow the reverse-geocode click.
- The existing assign / cancel flow (`prompt-staff-map-assign.md`). Untouched.

### Do not invent

- **No new REST endpoints and no new RTK Query endpoints.** Everything needed is already on the
  client: the officer's position is on `StaffMarker`, the case position is `caseData.caseLat` /
  `caseLon`. Because there is no new endpoint, there is **no `GQL_MAP` entry to add** — keep it
  that way. (If a `GQL_MAP` change ever becomes necessary, remember there is **no REST fallback**
  when `VITE_USE_GRAPHQL=true`; a missing entry is a hard user-facing failure.)
- **No turn-by-turn directions.** Set `returnDirections: false`. Directions are extra cost and
  there is nowhere to render them.
- **No route optimisation / `findBestSequence`.** Two stops have one order.
- **No polling or auto re-solve loop.** See §6.

### Follow repo conventions

- Avoid `any`. `strict` + `noUnusedLocals` / `noUnusedParameters` — an unused variable
  **fails `pnpm build`**, not just lint.
- Keep components small. Two new section components, one hook, one symbols file — not one big file.
- Do not delete commented-out code you did not write.
- Every new string needs a key in **all three** catalogues (`public/i18n/{en,th,cn}.json`).
- Heavy `@arcgis/core` imports stay inside the lazily-loaded map chunk. `CaseDisplay` already wraps
  the map in `Suspense` — do not import `route` / `RouteParameters` from anything eagerly loaded.

---

## 5. Architecture — who owns what

```
CaseDetailView.tsx          unchanged
  ▼
CaseDisplay.tsx             unchanged (pure pass-through)
  ▼
CaseStaffMapField.tsx       + owns: routeState  ◀── NEW state lives HERE
  │                         + passes caseLocation down
  ├── BoundaryMapField ─▶ ArcgisAddressMapField ─▶ ArcgisAddressMap
  │        (adds `route` / `showRoute` to the existing pass-through chain)
  │                                    └── useRouteGraphicsLayer   ◀── NEW
  └── StaffDetailPanel
         ├── StaffSmartRoutingSection   ◀── NEW  (section id `smart-routing`)
         └── StaffEtaTtlSection         ◀── NEW  (section id `eta-ttl`)
```

### State — read this twice

`ArcgisAddressMapField` renders a **second MapView when expanded**. Route state placed at or below
it resets every time the large map closes. Put it in `CaseStaffMapField`, alongside
`isStaffVisible` / `selection`, for exactly the reason that file's header comment already gives.

Add **one** piece of state:

```ts
const [routeState, setRouteState] = useState<RouteState>({ status: "idle" });
```

```ts
export type RouteState =
  | { status: "idle" }
  | { status: "solving" }
  | { status: "ready"; result: RouteResult }
  | { status: "error"; reason: RouteErrorReason };
```

Do **not** store the `MapView` in React state — the repo deliberately holds it in a `useRef` inside
`ArcgisAddressMap` so a re-render never rebuilds the view. Your layer hook takes `mapRef` / `viewRef`
/ `isReady`, exactly like `useStaffGraphicsLayer`.

**Clear the route** (`setRouteState({ status: "idle" })`) whenever:

- `selection` changes to a different officer or to a group,
- the panel is closed,
- the staff layer is toggled off.

A polyline left over from the previously selected officer is the single worst bug this feature can
ship.

---

## 6. Solving — on demand, never automatically

**Each solve costs ArcGIS credits.** Do not solve on selection, and do not solve on a timer.

- Trigger the solve when the user **expands the `smart-routing` section** (or presses an explicit
  "Calculate route" button inside it — pick one and be consistent).
- **Cache the result** keyed by `unitId` + rounded officer coords + case coords. Re-expanding the
  same section for the same officer at the same position must **not** re-solve.
- Offer a manual "recalculate" affordance, rate-limited the same way `useStaffPositions` limits
  refresh (`STAFF_REFRESH_COOLDOWN_MS`, 10s).

### The call

```ts
import * as route from "@arcgis/core/rest/route.js";
import RouteParameters from "@arcgis/core/rest/support/RouteParameters.js";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js";
import Stop from "@arcgis/core/rest/support/Stop.js";
```

`initArcgis()` has already set `esriConfig.apiKey`, so `route.solve` authenticates with no extra
wiring. Read the result from `routeResults[0].route`: geometry is the polyline, and
`attributes.Total_TravelTime` (minutes) / `attributes.Total_Kilometers` are the metrics. **Guard
both** — treat a missing or non-finite attribute as an error state, not as zero.

### Service URL — configurable, not hardcoded

Add to `API_CONFIG` in `src/core/config/api.ts`, directly below `ARCGIS_GEOCODE_URL`:

```ts
ARCGIS_ROUTE_URL:
  import.meta.env.VITE_ARCGIS_ROUTE_URL ||
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
```

Add `VITE_ARCGIS_ROUTE_URL` to **every** `.env.*` file. These files carry real credentials — do not
paste their contents anywhere.

> **Note for review, not for this task:** solving from the browser means the API key in the bundle
> can be used to burn credits by anyone who extracts it. The geocoding key already has this
> exposure, but geocoding is cheaper. Proxying routing through the BFF (like `/api`) is the correct
> long-term fix. Flag it; don't build it here.

---

## 7. Preconditions — refuse to solve rather than guess

Check in this order and surface the specific reason. Each maps to its own i18n key.

| # | Condition | Behaviour |
|---|---|---|
| 1 | Case has no mappable coordinate (`isMappableCoordinate(caseLat, caseLon)` false) | Section shows "no case location"; no solve |
| 2 | Officer has no mappable position | Section shows "no staff position"; no solve |
| 3 | `isStaleLocation(marker)` is true (>5 min old) | **Solve, but label the result as based on an outdated position.** Reuse the existing `case.display.map_staff_stale` treatment — do not invent a second visual language for staleness |
| 4 | Solve fails / times out | Error state with a retry affordance. Never fall back to a straight-line estimate |

**No haversine fallback.** A crow-flies distance presented next to a drive time is the failure mode
that misleads a dispatcher into sending the wrong unit.

---

## 8. The route layer

New file: `src/cms/components/case/createCase/map/staff/useRouteGraphicsLayer.ts`.

Copy the discipline of `useStaffGraphicsLayer`, not its content:

1. **Add to the existing map.** Never rebuild the MapView — that discards the user's pan/zoom and
   the case marker.
2. **Update in place.** Reassign the single graphic's geometry rather than `removeAll()` + re-add.
   There is only one route graphic, so this is trivial; do it anyway for consistency.
3. **Draw beneath the markers.** The polyline must not cover the case pin or the staff symbols.
4. **Non-interactive.** No hitTest participation, no click handling.
5. Symbols go in a new `routeSymbols.ts` and must read from the theme the way `staffSymbols.ts` and
   `basemaps.ts` do — the map has a dark mode.

Optionally `goTo` the route extent when it first resolves, with padding. If you do, respect the
existing viewpoint-ref behaviour in `ArcgisAddressMap` and don't fight it.

---

## 9. UI and i18n

### Sections

- `smart-routing`: the calculate/recalculate control, the solve state, distance, and the staleness
  caveat when §7.3 applies.
- `eta-ttl`: drive time, and ETA as a wall-clock time (`now + travel time`) formatted through the
  existing date helpers in `src/cms/components/date/`. Both sections render against the same cached
  result — they must never disagree, so derive them from one `RouteState`, not two solves.

Both are inside `StaffDetailPanel`, which already sits behind
`<PermissionGate permission="case.assign">`. **Do not add a second gate.**

### i18n

Already present, reuse as-is — do **not** re-add:

```
case.display.map_staff_section_routing
case.display.map_staff_section_routing_desc
case.display.map_staff_section_eta_ttl
case.display.map_staff_section_eta_ttl_desc
case.display.map_staff_stale
```

New keys needed in `en`, `th` **and** `cn` (follow the existing `case.display.map_staff_*` naming):

- calculate / recalculate button labels
- solving, and the cooldown label (mirror `map_staff_refresh_wait`'s `{{seconds}}` interpolation)
- distance, drive time, ETA field labels
- the four §7 failure messages
- the "based on an outdated position" caveat

If §2 shows traffic-aware modes are unavailable, **update `..._eta_ttl_desc` in all three
catalogues** so the description stops promising traffic adjustment.

---

## 10. Out of scope — and why

### 10.1 ⚠️ Multi-stop routing — blocked, no data

A dispatcher-builds-a-route-across-many-open-cases flow (agent → N cases, optimised order, "Finalize
Route & Assign") **cannot be built today**:

- There is no query anywhere for *open cases with coordinates*. `useGetUnitQuery` is per-case
  (`/dispatch/{caseId}/units`) — the data model is **one case → many units**, the exact inverse of
  what multi-stop needs.
- There is no endpoint that accepts an ordered multi-case assignment. `/dispatch/event` assigns one
  unit to one case, and the SOP `unitLists` model has no representation for a sequence.
- There is no Case Assignment *page* to host a route-builder sidebar. The map is embedded read-only
  in `CaseDisplay.tsx` and the staff layer is expanded-map-only by design.

Do not stub any of it. Do not add an `assignedCaseIds` array, "add to route" checkboxes, or a route
metrics footer. Multi-stop needs a backend spec first and gets its own document.

### 10.2 Also out of scope

- `staff-tracking` (Real-Time Staff Tracking) — stays `in-development`.
- Live traffic re-solve loops, service areas / drive-time polygons, nearest-unit ranking across the
  roster.
- Any change to assign / cancel behaviour.

---

## 11. Implementation order

1. §2 spike. **Stop and report back.**
2. `ARCGIS_ROUTE_URL` in `API_CONFIG` + `VITE_ARCGIS_ROUTE_URL` in every `.env.*`.
3. `routeTypes.ts` — `RouteState`, `RouteResult`, `RouteErrorReason`.
4. `useCaseRoute.ts` — the solve, the cache, the cooldown, the §7 preconditions. No React tree
   changes yet; verify with a temporary log.
5. `useRouteGraphicsLayer.ts` + `routeSymbols.ts`; thread `route` / `showRoute` through
   `BoundaryMapField` → `ArcgisAddressMapField` → `ArcgisAddressMap` the way `staff` is threaded.
6. `routeState` in `CaseStaffMapField`, including every clear-on-change case in §5.
7. `StaffSmartRoutingSection` + `StaffEtaTtlSection`; flip both registry entries to `"available"`.
8. i18n keys in all three catalogues.
9. `pnpm lint && pnpm build`.

---

## 12. Definition of done

### Automated

- `pnpm lint` clean.
- `pnpm build` clean (remember: unused vars fail the build).
- There is **no test runner in this repo** — do not add one, and do not claim tests pass.

### Manual

- Expand the large map, show staff, select an officer, expand Smart Routing → route draws, distance
  and drive time appear, ETA matches drive time.
- Collapsing and re-expanding the section does **not** re-solve (verify in the network tab).
- Selecting a different officer clears the old polyline **before** anything new is drawn.
- Closing and reopening the large map preserves the staff toggle and selection (existing behaviour
  must not regress) and does not leave an orphaned polyline on either MapView.
- The polyline does not block reverse-geocode clicks or cover the case pin.
- Dark mode and all three languages render correctly.
- Both `VITE_USE_GRAPHQL=true` and `false` behave identically (they should — no new endpoint).
- Stale-position officer shows the caveat; a case with no coordinate shows the refusal, not a spinner.

### Report back

- The §2 spike findings, explicitly: entitlement yes/no, traffic-aware modes yes/no, and an honest
  read on Bangkok route quality.
- Estimated credits per solve and where the cache prevents repeats.
- Any place you had to deviate from this brief, and why.
