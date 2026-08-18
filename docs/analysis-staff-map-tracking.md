# Analysis — "Staff Tracking Widget Overview" prompt

**Verdict up front:** this is a feature brief for the one remaining `in-development` section on
the case map (`staff-tracking`), written in the same house style as
`docs/prompt-staff-map-assign.md` and `docs/prompt-staff-map-route.md`. Roughly **40% of it is
already built** under different names, **35% is buildable today** with additive changes, and
**25% is blocked on backend data that does not exist** (no location stream, no breadcrumb
endpoint, no case boundary geometry).

Do not hand this file to an implementer as-is. Section 6 below is the rewritten scope.

---

## 1. What the prompt actually is

A third-in-series implementation brief for the ArcGIS case map staff overlay:

| # | Brief | Sections filled | Status |
|---|---|---|---|
| 1 | `prompt-staff-map-assign.md` | `contextual-workflows`, `personal-info` | shipped v0.37–0.39 |
| 2 | `prompt-staff-map-route.md` | `smart-routing`, `eta-ttl` | shipped v0.42–0.43 |
| 3 | **this prompt** | `staff-tracking` | not started |

`STAFF_PANEL_SECTIONS` in `staffPanelSections.tsx` has exactly one entry left with
`status: "in-development"`, and it is `staff-tracking`. Its label and description already exist
in all three i18n catalogues. So the prompt is aimed at the right hole — it just describes that
hole using vocabulary from a different product.

### Vocabulary mismatch — resolve before implementing

| Prompt term | Reality in this repo |
|---|---|
| "Case Assignment Page" | `src/cms/pages/Case/caseAssignment.tsx` is a **case list / kanban board with no map**. The staff map lives in `CaseDisplay.tsx` → `CaseStaffMapField`. |
| "ArcGIS Map Tile" | `ArcgisAddressMap` inside `ArcgisAddressMapField`, which mounts a **second MapView when expanded**. The staff layer is **large-map only, by design**. |
| "Unit Widget" | No such component. The nearest things are `StaffDetailPanel` (one officer) and `StaffGroupPanel` (a cluster). |
| "Live Roster List" | **Does not exist.** There is no list UI anywhere in the staff overlay. This is net-new surface, not an enhancement. |
| "staffId" | The identifier everywhere is `unitId`. `Unit` is the dispatchable entity; a `username` is the responder crewing it. |

---

## 2. Already built — do not rebuild

| Prompt asks for | Already exists | File |
|---|---|---|
| Feature reduction / clustering | Screen-space proximity grouping with count bubbles, colour-by-most-available, click-to-zoom or click-to-picker | `staffClusters.ts`, `useStaffGraphicsLayer.ts` |
| Auto-centre on a staff asset | `view.goTo({ target: point })` with interrupt-safe `.catch()` | `useStaffGraphicsLayer.ts:377, 412` |
| Heartbeat-loss detection | `STAFF_STALE_THRESHOLD_MS` = **5 min**, muted symbol alpha + amber `map_staff_stale` badge | `staffTypes.ts`, `staffSymbols.ts`, `StaffDetailPanel.tsx` |
| Ping throttling | `STAFF_REFRESH_COOLDOWN_MS` = 10 s (user refresh), `MOB_RECONCILE_DEBOUNCE_MS` = 2 s (socket-driven refetch) | `useStaffPositions.ts` |
| Status colouring | Deliberately reduced to **three** operational colours (ready / engaged / off-duty) | `staffSymbols.ts` header |
| Selection state | `selection: StaffSelection` (discriminated union: staff \| group) owned by `CaseStaffMapField` | `staffTypes.ts`, `CaseStaffMapField.tsx` |

Two direct conflicts to settle:

- **2 min vs 5 min.** The prompt's "grey out after 2 minutes" would introduce a second staleness
  threshold and a second visual language for it. `prompt-staff-map-route.md §7.3` explicitly
  forbade exactly this. Pick one number and change `STAFF_STALE_THRESHOLD_MS`, or leave it alone.
- **`featureReduction` clustering.** ArcGIS `featureReduction` only works on a `FeatureLayer`.
  The staff overlay is a `GraphicsLayer`, chosen for in-place diffing without flicker. Adopting
  `featureReduction` means replacing the whole layer and discarding `staffClusters.ts`. Not worth
  it; the existing clustering already solves the stated problem (and solves the same-exact-coords
  case, which `featureReduction` does not — see changelog 0.39.0).

---

## 3. Hard blockers — no client-side workaround

### 3.1 There is no location stream

`mobEvents.ts` documents the socket contract in its header, and it is unambiguous:

> `UNIT_SELECT` → `{ unitId, username }` · `STATUS` → `{ sttId, unitId }`
> "There is no location event and no deselect event, so a MOB event tells the map that a unit
> changed and one field of how — never where the unit now is."

Positions move **only** when `/dispatch/{caseId}/units` is refetched. This was already discovered
and honestly documented in changelog 0.39.0, which reworded `map_staff_section_tracking_desc`
specifically because the old wording overpromised live positions.

So §"Live Location Streaming" cannot be built. Not throttled, not interpolated — the data isn't
arriving. **The prerequisite is a backend `MOB` / `LOCATION` event carrying `unitId`, `locLat`,
`locLon`, `locBearing`, `locSpeed`, `locGpsTime`.** Ask for it before scoping this section.

### 3.2 ArcGIS `StreamLayer` is not available

`StreamLayer` requires an ArcGIS **GeoEvent Server stream service**. `VITE_ARCGIS_API_KEY` is
provisioned for basemaps + World Geocoding, plus routing per the route brief's Phase 0. There is
no stream service in this stack and no plan for one. Delete this option from the brief.

### 3.3 The breadcrumbs endpoint does not exist

`GET /api/v1/staff/{staffId}/breadcrumbs?minutesAgo=30` is invented. Nothing matching it exists on
the BFF, and the path shape is wrong for this repo (`/dispatch/{caseId}/units` style, `unitId` not
`staffId`).

**If it is added, this is the critical compatibility rule:** when `VITE_USE_GRAPHQL=true` there is
**no REST fallback**. A URL with no `GQL_MAP` entry is a hard, user-facing error — not a silent
degrade. So a new endpoint requires *both*:

1. an RTK Query endpoint in `src/cms/store/api/dispatch.ts` (REST-shaped `url`), and
2. a matching entry in `src/cms/store/api/graphql/dispatchQueries.ts` + `GQL_MAP`.

Convenient precedent: `GET_UNIT_DISPATCH_QUERY` selects `fields: "status msg data desc"` — `data`
is a JSON scalar, so **every `Unit` field passes through both transports identically**. A
breadcrumb query modelled the same way needs no field-by-field mapping.

### 3.4 Geofencing has no geometry to fence

A case carries `caseLat` / `caseLon` — a **point**, not a boundary. There is no case polygon
anywhere. `geometryEngine` is not currently imported in this codebase at all.

The admin boundary GeoJSON (`map/boundaries/`) is Bangkok-only province/district/sub-district data
bundled with the app — it is not "the case's assigned boundary" and using it as one would be
wrong. Either define a radius convention with the backend (`case.geofenceRadiusM`) or drop this.

---

## 4. Buildable today — the honest subset

### 4.1 Telemetry overlay ✅ genuinely easy

`Unit` (`src/cms/types/dispatch.ts`) **already carries everything the telemetry drawer needs**,
and `toStaffMarkers` throws it all away:

```
locBearing   locSpeed   locAccuracy   locAlt
locGpsTime   locSatellites   locProvider   locLastUpdateTime ✓ (kept)
```

Widening `StaffMarker` with `bearing`, `speed`, `accuracy`, `gpsTime` is purely additive, costs no
new request, and works under both transports (§3.3). This is the highest value-per-line item in
the whole brief.

**Caveat that must be honoured in the copy:** these are the values *as of the last refetch*, not
live. Label them with the same `DateStringToAgoFormat` + `map_staff_stale` treatment already used
for coordinates. Do not call the section "live".

### 4.2 Heading rotation ⚠️ possible, with judgement

`SimpleMarkerSymbol` supports `angle`, so rotation needs no CIMSymbol. But:

- Rotating the **person silhouette** (`STAFF_MARKER_PATH`) reads as a falling-over human. A
  direction indicator needs to be a *separate* graphic — a small chevron on the halo ring, like
  `createStaffHaloSymbol` already does for selection.
- `locBearing = 0` is ambiguous: due north, or no fix? Gate on `locSpeed > walking threshold` and
  treat 0/0 the way `isMappableCoordinate` treats coordinate 0/0.
- `staffSymbols.ts` is on the previous briefs' **do-not-modify** list. Adding a new symbol factory
  is fine; changing `createStaffSymbol` is a scope negotiation.

CIMSymbol with `primitiveOverrides` is overkill here and the file's own header (line ~207) already
explains why CIM was rejected once.

### 4.3 Session-local breadcrumbs ⚠️ possible, but be honest about it

Without §3.3, the only trail you can draw is positions observed *during this session, at refetch
cadence, while the layer was open* — lost on reload, sparse, and full of gaps. That may still be
useful, but it must be labelled as such. A dashed polyline that looks like a GPS track but is
actually four points half an hour apart is the misleading-dispatcher failure mode the route brief
warned about.

Implementation, if pursued: a **new, independent** `GraphicsLayer` below the staff layer, following
`useRouteGraphicsLayer.ts` exactly — add to the existing map, diff in place, non-interactive, no
hitTest participation, theme-aware symbols in a new file.

### 4.4 Roster list + search/filter ⚠️ new surface, needs a design decision

Not blocked by data, but it is a new panel competing for space with `StaffDetailPanel` /
`StaffGroupPanel` inside a map that is already large-map-only *because* of space. Worth asking
whether the roster belongs on the map at all, versus beside it in `CaseDisplay`.

If built, the filter buckets must come from the app's status model, not the prompt's:
`'ALL' | 'ACTIVE' | 'EN_ROUTE' | 'OFFLINE'` is invented. Real statuses are MDM-configured `sttId`
strings cached in `localStorage.unit_status`, and the map deliberately collapses them to three
operational buckets. Filter on **ready / engaged / off-duty**, matching `staffSymbols.ts`, or the
list and the markers will disagree on screen.

---

## 5. Repo compatibility checklist

### State — the prompt's shape is wrong here

```ts
// prompt's proposal — do not adopt as written
interface StaffTrackingState {
  trackedStaffId: string | null;          // ✗ duplicates `selection` in CaseStaffMapField
  filterStatus: 'ALL'|'ACTIVE'|'EN_ROUTE'|'OFFLINE';  // ✗ invented status model, see §4.4
  isHistoricalPathVisible: boolean;       // ✓ fine
  lastPingReceivedAt: string | null;      // ✗ re-render generator; derive from marker.gpsTime
}
```

- **`trackedStaffId` must be derived from the existing `selection`.** Two sources of truth for
  "who is selected" will desynchronise the halo, the panel and the camera.
- **Not Redux.** This repo's Redux store is RTK Query slices + `auth`/`notifications`/`realtime`/
  `ui`. All map state is plain `useState`. A tracking slice would be the first local-UI slice.
- **State goes in `CaseStaffMapField`**, above `ArcgisAddressMapField`, for the reason that file's
  header comment already spells out: anything lower resets every time the large map closes.
- **Never put the `MapView` in state.** It lives in a `useRef` in `ArcgisAddressMap`; layer hooks
  take `mapRef` / `viewRef` / `isReady`.
- **Avoid a ticking `lastPingReceivedAt`.** `useStaffPositions` goes out of its way to leave an
  idle map with zero timers. A once-per-second clock in state undoes that.

### Watch mode vs the existing camera

The prompt's `mapView.goTo(...)` on every tick collides with two existing behaviours:

1. `useStaffGraphicsLayer` re-runs its cluster sync on **every view settle**. A camera that moves
   continuously re-clusters continuously.
2. `ArcgisAddressMap` keeps a viewpoint ref so the large map reopens where it was left. Watch mode
   must not fight it.

Watch mode needs an explicit "user panned → disengage" rule, and should batch rather than `goTo`
per frame.

### Build and process

- `strict` + `noUnusedLocals` / `noUnusedParameters` — an unused variable **fails `pnpm build`**.
- No test runner exists. Do not add one; do not claim tests pass.
- Every new string needs a key in **all three** of `public/i18n/{en,th,cn}.json`, under the
  existing `case.display.map_staff_*` naming.
- `map_staff_section_tracking_desc` was deliberately reworded in 0.39.0 to stop overpromising.
  **If this feature still doesn't deliver live positions, leave that wording honest.**
- `StaffDetailPanel` already sits behind `<PermissionGate permission="case.assign">`. Do not add a
  second gate.
- Heavy `@arcgis/core` imports stay inside the lazily-loaded map chunk (`CaseDisplay` wraps it in
  `Suspense`).
- Ship a `changelog.json` entry in the established plain-language style, plus a `package.json`
  version bump.

---

## 6. Recommended scope

**Phase 0 — backend questions. Answer before writing code.**

1. Will MOB emit a location event? Fields and cadence?
2. Is there, or can there be, a unit location-history endpoint? What retention?
3. Does a case have any boundary geometry, or a radius convention, for geofencing?
4. Confirm the `sttId` mismatch flagged in 0.39.0 (`MOB.sh` example sends `S001`, unknown to the
   app's colour map) — it affects any status filter built on socket data.

**Phase 1 — ship now, no backend needed.**

- Widen `StaffMarker` with `bearing` / `speed` / `accuracy` / `gpsTime` (§4.1).
- Build the `staff-tracking` section as a **telemetry panel**: speed, heading, GPS fix age,
  accuracy — each stamped with how old it is. Flip `status` to `"available"`.
- Directional chevron on the selection halo when speed exceeds a threshold (§4.2).
- New i18n keys in all three catalogues.

**Phase 2 — after Phase 0 answers 1 and 2.**

- Live position patching in `useStaffPositions` (the socket plumbing and debounce are already
  there; only `toLivePatch` and `LiveUnitPatch` need widening).
- Breadcrumb layer, once the endpoint exists — with its `GQL_MAP` entry (§3.3).

**Phase 3 — separate brief.**

- Roster list + filtering (design question, not a data question).
- Geofencing (blocked on geometry).
- Watch mode (needs the camera-contention rules above worked out first).

**Cut entirely.**

- ArcGIS `StreamLayer` (§3.2).
- `featureReduction` clustering (§2).
- The 2-minute heartbeat threshold as a *second* staleness concept (§2).
