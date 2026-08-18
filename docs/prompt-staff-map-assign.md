# Implementation Prompt — Assign / Cancel Assignment from the Staff Panel on the ArcGIS Case Map

> **How to use this file:** paste it into Claude Code as the task brief, or run
> `claude "follow docs/prompt-staff-map-assign.md"` from the repo root.
> A clickable UI reference lives at `docs/mockup-staff-map-assign.html`.

---

## 1. Task

Let a dispatcher **assign** a staff member to the open case, or **remove** them from it, directly
from the staff card on the ArcGIS map — without opening the existing assign modal.

This is an **extension of code that already exists**, not a new widget. Roughly 70% of the surface
(map layer, staff markers, hit-testing, `goTo`, the detail card, the section registry, and the i18n
catalogue entries) is already implemented and waiting for exactly this feature. Your job is to fill
in the declared extension points and wire the two mutations that are already defined.

**One staff member at a time.** Selection happens by clicking a marker on the map. There is no
roster list, no multi-select, and no checkbox UI anywhere in this feature.

---

## 2. Read these files before writing any code

Do not skip this step. Several decisions below only make sense once you have seen the existing
comments, which document intent that is not obvious from the code alone.

| File | Why |
|---|---|
| `src/cms/components/case/createCase/map/staff/CaseStaffMapField.tsx` | Owns the layer state; the header comment explains why state lives above `ArcgisAddressMapField` |
| `src/cms/components/case/createCase/map/staff/StaffDetailPanel.tsx` | The card you are extending |
| `src/cms/components/case/createCase/map/staff/staffPanelSections.tsx` | The section registry — read the header comment, it describes this exact task |
| `src/cms/components/case/createCase/map/staff/useStaffPositions.ts` | Fetch/refresh/websocket strategy and its throttling rationale |
| `src/cms/components/case/createCase/map/staff/staffTypes.ts` | `StaffMarker` view-model and the mappable-coordinate rule |
| `src/cms/components/case/CaseDetailView.tsx` | Lines ~250–1170: SOP data, `handleDispatch`, `handleConfirmCancelUnit`, `staffOverlay`, `ConfirmationModal` |
| `src/cms/components/case/CaseDisplay.tsx` | Lines ~160–195: where the map is mounted |
| `src/cms/store/api/dispatch.ts` | All dispatch endpoints |
| `src/cms/types/dispatch.ts` | `Unit`, `CaseSopUnit`, `UnitWithSop`, `dispatchInterface`, `CancelUnit` |
| `src/core/store/api/hybridBaseQuery.ts` + `src/cms/store/api/graphql/dispatchQueries.ts` | The REST-shaped-but-maybe-GraphQL transport |
| `CLAUDE.md` | Repo conventions — follow them |

---

## 3. Hard constraints

### Do not modify

- `AssignOfficerModel.tsx`, `singleAssignOfficer.tsx` — the existing modal must keep working
  unchanged. This feature is an additional shortcut, not a replacement.
- `ArcgisAddressMap.tsx`, `useStaffGraphicsLayer.ts` — `hitTest`, `goTo`, and the `GraphicsLayer`
  are already correct. Do not re-implement them.
- `caseAssignment.tsx` — out of scope entirely.

### Do not invent

- **No new REST endpoints.** Every call this feature needs already exists (§5).
- **No new payload fields.** Copy the exact payload shapes from the existing handlers.
  In particular, do **not** add a `reason` / `resId` / `resDetail` field to the cancel payload —
  see the warning in §5.3.
- **No optimistic UI updates.** See §9 for why.
- **No hardcoded SOP stage names or node IDs.** They come from the SOP response at runtime.

### Follow repo conventions

- Avoid `any`. TypeScript is `strict` with `noUnusedLocals` / `noUnusedParameters` — an unused
  variable **fails `pnpm build`**, not just lint.
- Keep components small; extract rather than growing `StaffDetailPanel`.
- Do not delete commented-out code you did not write.
- Every new user-facing string needs a key in **all three** catalogues (`en`, `th`, `cn`).

---

## 4. Architecture — who owns what

```
CaseDetailView.tsx          owns: mutations, SOP data, toasts, ConfirmationModal
  │  staffOverlay={{ caseId, assignedUnitIds, canAssign, canCancel,
  │                  submittingUnitId, onRequestAssign, onRequestCancel }}
  ▼
CaseDisplay.tsx             pure pass-through (presentational)
  ▼
CaseStaffMapField.tsx       owns: isStaffVisible, selectedStaffId
  ├── ArcgisAddressMapField → ArcgisAddressMap   (hitTest, goTo, GraphicsLayer)
  ├── StaffMapControls                            (toggle / refresh / notice)
  └── StaffDetailPanel                            (action bar + accordion sections)
```

**Rule:** all business logic — payload construction, SOP stage lookup, toasts, refetch — lives in
`CaseDetailView`. The map layer only knows *"is this button enabled"* and *"what do I call when it
is pressed"*. This preserves the existing invariant documented in `CaseStaffMapField.tsx`:
*"ArcgisAddressMapField / ArcgisAddressMap stay generic."*

### State

Do **not** introduce a `viewMode` enum. Three independent axes already have homes:

| Axis | Existing state | Location |
|---|---|---|
| Widget collapsed / expanded | `isStaffVisible: boolean` | `CaseStaffMapField` |
| Which staff member is selected | `selectedStaffId: string \| null` | `CaseStaffMapField` |
| Which section is open | `openSectionId: string \| null` | `StaffDetailPanel` |

Add exactly one new piece of state, in `CaseDetailView`:

```ts
const [submittingUnitId, setSubmittingUnitId] = useState<string | null>(null);
```

Scope it per-unit rather than a widget-wide `isSubmitting: boolean`, so an in-flight request
disables only the affected card instead of freezing the whole map.

---

## 5. API contract — use what exists

### 5.1 Reads

| Need | Hook | REST url |
|---|---|---|
| Staff positions | `useGetUnitQuery({ caseId })` | `GET /dispatch/{caseId}/units` |
| Who is already assigned | `useGetCaseSopQuery({ caseId })` → `data.data.unitLists` | `GET /dispatch/{caseId}/SOP` |

`sopData.data.unitLists: CaseSopUnit[]` is the **single source of truth** for whether a unit is
assigned. This is the same logic `AssignOfficerModel.tsx` uses to compute `availableOfficers`.

```ts
// CaseDetailView.tsx
const assignedUnitIds = useMemo(
  () => new Set((sopData?.data?.unitLists ?? []).map((u) => u.unitId)),
  [sopData?.data?.unitLists]
);
```

### 5.2 Assign — `POST /dispatch/event`

Hook: `usePostDispacthMutationMutation()`. Payload type: `dispatchInterface`.
**Reuse the existing `handleDispatch` callback** in `CaseDetailView` — do not write a second one.
It already builds the payload, guards it, toasts, calls `dispatchUpdateLocate`, updates
`caseState.status`, and refetches.

```ts
const dispatchJson = {
  caseId:   initialCaseData!.caseId,
  unitId:   officer.unitId,
  unitUser: officer.username,
  nodeId:   sopData?.data?.dispatchStage?.nodeId,
  status:   sopData?.data?.dispatchStage?.data?.data?.config?.action,
};
// existing guard: all four must be present, otherwise throw
```

`handleDispatch` takes a `Unit`, but the map gives you a `StaffMarker`. Add a small adapter in
`CaseDetailView` rather than changing `handleDispatch`'s signature (the modal path depends on it):

```ts
const handleAssignFromMap = useCallback(async (unitId: string, username: string) => {
  setSubmittingUnitId(unitId);
  try {
    await handleDispatch({ unitId, username } as Unit);
  } finally {
    setSubmittingUnitId(null);
  }
}, [handleDispatch]);
```

> Only `unitId` and `username` are read from the `Unit` inside `handleDispatch`. Verify this is
> still true when you read the file; if it reads more fields, look the full `Unit` up from
> `useGetUnitQuery`'s cached data instead of casting.

### 5.3 Cancel — `POST /dispatch/cancel/unit`

Hook: `usePostCancelUnitMutationMutation()`. Payload type: `CancelUnit`.
Reuse the existing `handleConfirmCancelUnit` in `CaseDetailView`.

```ts
const cancelUnitJson = {
  caseId:   caseState?.workOrderNummber,
  unitId:   unit.unitId,
  unitUser: unit.username,
} as CancelUnit;
```

> ⚠️ **`CancelUnit` declares `resId` and `resDetail` as required, but the existing code does not
> send them** — they are commented out and the object is cast. **Send exactly what the existing
> code sends.** Do not invent a `resId`; that field comes from `closeCaseOption` and means *case
> closure reason*, which is a different concept from *why a unit was withdrawn*. If the BFF turns
> out to require it, stop and raise it with the backend team rather than guessing a value.

### 5.4 GraphQL transport — no changes required

`createHybridBaseQuery` rewrites these REST calls into GraphQL when `VITE_USE_GRAPHQL === "true"`,
using `GQL_MAP`. All four URLs this feature touches are already registered in
`src/cms/store/api/graphql/dispatchQueries.ts`:

```
"/dispatch/:id/units"    → GetUnitDispatch
"/dispatch/:id/SOP"      → SOPCase
"/dispatch/event"        → Event         (mutation)
"/dispatch/cancel/unit"  → CancelUnit    (mutation)
```

**There is no REST fallback.** If you ever add an endpoint, you must add a `GQL_MAP` entry in the
same change, or that call becomes a hard user-facing error in GraphQL environments.

### 5.5 Fix: missing cache invalidation

`getUnit` and `getCaseSop` declare `providesTags: ["Dispatch"]`, but neither mutation declares
`invalidatesTags`, so every caller refetches by hand today.

```ts
// src/cms/store/api/dispatch.ts
postDispacthMutation: builder.mutation<ApiResponse<null>, dispatchInterface>({
  query: (params) => ({ url: `/dispatch/event`, method: "POST", body: params }),
  invalidatesTags: ["Dispatch"],          // add
}),
postCancelUnitMutation: builder.mutation<ApiResponse<null>, CancelUnit>({
  query: (params) => ({ url: `/dispatch/cancel/unit`, method: "POST", body: params }),
  invalidatesTags: ["Dispatch"],          // add
}),
```

> **Verify before moving on:** existing flows (`AssignOfficerModal`, `AssignedOfficers`) already
> call `refetch()` manually, so they will now issue one extra request. That is acceptable, but
> confirm in the network tab that it does not produce a refetch loop. If it does, revert this change
> and have `CaseDetailView` call `triggerRefetchUnit()` after each mutation instead.

---

## 6. Data freshness — WebSocket primary, 10s polling fallback

### 6.1 WebSocket

The path is already written in `useStaffPositions.ts` and switched off:

```ts
const STAFF_WS_ENABLED: boolean = false;      // flip on when the BFF emits the event
const STAFF_WS_EVENT = "UNIT-LOCATION-UPDATE";
```

**Leave this flag `false`.** The backend does not emit the event yet, and turning it on would make
the panel display "Source: WebSocket (live)" while showing stale data.

For *assignment* changes (as opposed to positions) nothing new is needed: `CaseDetailView` already
subscribes to `CASE-UPDATE` and `CASE-STATUS-UPDATE` and calls `refetch()`, which refreshes
`unitLists` and therefore flips the buttons automatically.

### 6.2 Polling

```ts
// useStaffPositions.ts
// The refresh button's cooldown is driven by `isFetching`, so a poll faster than
// STAFF_REFRESH_COOLDOWN_MS would keep restarting that cooldown and leave the button
// permanently disabled. Any polling interval here must stay >= STAFF_REFRESH_COOLDOWN_MS.
const shouldPoll = enabled && !!caseId && !(STAFF_WS_ENABLED && isConnected);

const { data, isFetching, isError, refetch } = useGetUnitQuery(
  { caseId },
  {
    skip: !enabled || !caseId,
    pollingInterval: shouldPoll ? STAFF_REFRESH_COOLDOWN_MS : 0,   // 10_000
  }
);
```

Three conditions, in priority order:

1. **Layer closed → no polling.** Preserves the existing intent: *"an operator who never opens the
   layer should not pay for it."*
2. **WebSocket connected → no polling.** Do not duplicate what the socket already delivers.
3. **Same constant as the cooldown.** Keep the comment above; it is the whole reason the interval
   cannot be lowered.

`useStaffPositions` already returns `source: "graphql" | "websocket"` and the panel already
displays it. No change needed there.

---

## 7. UI

### 7.1 Card layout — three zones

```
┌─────────────────────────────┐
│ (SC) Somchai Jaidee     [X] │  Zone 1: identity      (fixed)
│      ● Available            │
├─────────────────────────────┤
│ [ + Assign to this case   ] │  Zone 2: primary action (fixed)  ★ NEW
├─────────────────────────────┤
│ 📍 Coordinates 13.7367,...  │  Zone 3: details        (scrolls)
│ ▼ 📋 Assigned cases     (3) │
│ ▶ 👤 Personal information   │
│ ▼ ➕ Assign to case         │
│ ▶ 🛣 Routing                │
│ ▶ 🧭 Tracking               │
└─────────────────────────────┘
```

**Zone 2 is new.** It sits between the header and the scrollable body, outside the scroll area, so
the primary action is always visible and clickable regardless of which section is open or how far
the user has scrolled. Full width, solid fill, subtle shadow.

The same action **also stays inside its accordion section**, where it is accompanied by contextual
copy (which SOP stage will run / what removal does). This serves both users: the one in a hurry
presses the header button, the one who wants context reads the section first.

Both buttons must call the same handler and open the same confirmation dialog, and both must derive
their disabled/spinner state from the same `submittingUnitId`, so they can never disagree.

| State | Header button | Style |
|---|---|---|
| Not assigned | `+ Assign to this case` | solid blue, shadow |
| Assigned | `− Remove from this case` | red outline on white |
| SOP disallows | disabled + amber explanation line below | dimmed |
| Request in flight | spinner + "Sending command…" | disabled |

### 7.2 Accordion, not tabs — and it adapts to height

**Decision: accordion.** Do not convert the panel to tabs. Reasons, in order of weight:

1. **The section count is not constant.** `assign` and `cancel-assign` swap based on state. A tab
   bar whose tab count changes after a button press shifts every other tab's position — a
   mis-click risk in time-pressured dispatch work. An accordion collapses and expands in place.
2. **Not enough width.** The card is 288px (`w-72`). Six sections means ~48px per tab, which fits
   an icon and nothing else; Thai labels overflow into horizontal scrolling, hiding the last
   sections entirely.
3. **Tabs force content to stay open,** consuming fixed height. At the default `height={320}` map,
   the panel has ~240px (`max-h-[calc(100%-5rem)]`). A fully collapsed accordion needs ~32px per
   row — the whole table of contents is visible without scrolling.
4. **Three of six sections are still "in development."** The accordion shows that badge on the
   collapsed row; a tab only reveals its emptiness after you click it.
5. **No rewrite.** `StaffDetailPanel` is already an accordion.

**Height-adaptive behaviour** — measure the panel element with a `ResizeObserver` (not a media
query: expanding the map grows the container, it does not change the viewport):

| Panel height | Behaviour |
|---|---|
| `< 420px` (default 320px map) | one section open at a time — existing `openSectionId` behaviour |
| `>= 420px` (expanded / fullscreen map) | keep `assigned-case` expanded permanently, plus one other section open at the same time |

```ts
// StaffDetailPanel.tsx
export const STAFF_PANEL_TALL_PX = 420;

const [isTall, setIsTall] = useState(false);
// ResizeObserver on the card element → setIsTall(entry.contentRect.height >= STAFF_PANEL_TALL_PX)

const isSectionOpen = (id: string) =>
  isTall ? id === openSectionId || id === "assigned-case" : id === openSectionId;
```

`ArcgisAddressMapField` mounts a second `MapView` when expanded, so the panel remounts and `isTall`
recomputes on its own. No cross-view state syncing is required.

### 7.3 Extend the section registry

```ts
// staffPanelSections.tsx
export interface StaffSectionContext {
  isAssigned: boolean;
  canAssign: boolean;
  canCancel: boolean;
  isSubmitting: boolean;
  onRequestAssign: () => void;
  onRequestCancel: () => void;
}

export interface StaffPanelSection {
  // ...existing fields
  render?: (marker: StaffMarker, ctx: StaffSectionContext) => ReactNode;
  /** Whether this section applies to the current marker/context. Omitted = always shown. */
  isVisible?: (marker: StaffMarker, ctx: StaffSectionContext) => boolean;
}
```

`isVisible` lets `assign` and `cancel-assign` swap without adding conditionals to
`StaffDetailPanel`, preserving the registry's stated contract: *"no changes to the panel itself."*

| Section id | This phase | Content |
|---|---|---|
| `assigned-case` | ✅ | case list with the current case highlighted (§7.4) |
| `assign` | ✅ | SOP context + assign button · `isVisible: (_, c) => !c.isAssigned` |
| `cancel-assign` | ✅ | consequence copy + cancel button · `isVisible: (_, c) => c.isAssigned` |
| `personal-info` | ❌ | leave as `in-development` |
| `routing` | ❌ | leave as `in-development` |
| `tracking` | ❌ | leave as `in-development` |

Flip `status` to `"available"` for the three you implement.

### 7.4 "Assigned cases" section — highlight the current case

```
┌──────────────────────────────┐
│▌CS-2026-0814 [This case] 42m │ ← 3px blue left border + light blue fill
│ En route · assigned 12m ago  │
└──────────────────────────────┘
  Other active cases (2)
┌──────────────────────────────┐
│ CS-2026-0799                 │ ← opacity .72, no accent border
│ In progress · Power outage   │
└──────────────────────────────┘
```

Use **four independent signals** so the distinction does not rely on colour alone:

1. 3px solid blue left border
2. Light blue background (`bg-blue-50` / `dark:bg-blue-500/[.13]`)
3. A literal `This case` badge
4. Grouping — the current case is always first, above an "Other active cases (n)" heading

When the staff member is **not** assigned to the current case, still show the current-case row in
the same position, but with a **dashed left border, neutral background, and grey badge**, plus the
line "Not assigned to this case yet." That way the difference between *the case being viewed* and
*cases actually held* is visible in one place.

> **Data availability — read §10.1 before implementing this section.** Only the current case can be
> sourced today.

### 7.5 Button gating, in decision order

```
no `case.assign` permission  → section not rendered (PermissionGate already wraps the layer)
request in flight            → disabled + spinner
canAssign / canCancel false  → disabled + amber explanation of the SOP restriction
otherwise                    → enabled
```

- `canAssign` ← `sopData?.data?.dispatchStage?.data ? true : false` (the modal's `canDispatch`)
- `canCancel` ← the existing `canCancelUnit` in `CaseDetailView`

### 7.6 Confirmation dialog

Both actions must be confirmed. Reuse the `ConfirmationModal` that `CaseDetailView` already renders,
and **render it in `CaseDetailView`, not inside the map**. The map container is `overflow-hidden`,
which would clip a dialog rendered inside it, and the app has an existing dialog stack to respect.

`CaseStaffMapField` only calls `onRequestAssign(marker)` / `onRequestCancel(marker)` upward;
`CaseDetailView` opens the dialog and performs the mutation on confirm.

---

## 8. Permissions and i18n

### Permissions

`STAFF_LAYER_PERMISSION = "case.assign"` already wraps the entire staff layer via `PermissionGate`
in `CaseStaffMapField`. The new buttons live inside that gate. **Do not add a nested
`PermissionGate`.**

### i18n

All 27 existing `map_staff_*` keys are present in `en` / `th` / `cn`. Add these to **all three**
files under `public/i18n/` — the catalogue loader has no cross-language fallback:

| Key (under `case.display.`) | en | th | cn |
|---|---|---|---|
| `map_staff_assign_button` | Assign to this case | สั่งการเข้าเคสนี้ | 指派至此案件 |
| `map_staff_assign_section_button` | Assign this staff member | สั่งการเจ้าหน้าที่คนนี้ | 指派此人员 |
| `map_staff_cancel_button` | Remove from this case | ถอนออกจากเคสนี้ | 从此案件移除 |
| `map_staff_cancel_section_button` | Cancel assignment | ยกเลิกการสั่งการ | 取消指派 |
| `map_staff_assign_confirm_title` | Confirm assignment | ยืนยันการสั่งการ | 确认指派 |
| `map_staff_assign_confirm_message` | Assign {{name}} to case {{caseId}}? | สั่งการ {{name}} เข้าเคส {{caseId}} ใช่หรือไม่? | 确定将 {{name}} 指派至案件 {{caseId}}？ |
| `map_staff_cancel_confirm_title` | Confirm removal | ยืนยันการยกเลิกการสั่งการ | 确认取消指派 |
| `map_staff_cancel_confirm_message` | Remove {{name}} from case {{caseId}}? They return to the available pool. | ถอน {{name}} ออกจากเคส {{caseId}} ใช่หรือไม่? เจ้าหน้าที่จะกลับสู่กลุ่มพร้อมปฏิบัติงาน | 确定将 {{name}} 从案件 {{caseId}} 移除？该人员将回到可派遣状态。 |
| `map_staff_assign_description` | Dispatch this staff member to the open case using the SOP dispatch stage. | ส่งเจ้าหน้าที่คนนี้เข้าเคสที่เปิดอยู่ตามขั้นตอน SOP | 依据 SOP 派遣阶段将此人员指派至当前案件。 |
| `map_staff_cancel_description` | Withdraw this staff member from the open case. | ถอนเจ้าหน้าที่คนนี้ออกจากเคสที่เปิดอยู่ | 将此人员从当前案件中撤回。 |
| `map_staff_badge_current_case` | This case | เคสนี้ | 本案件 |
| `map_staff_not_assigned_here` | Not assigned to this case yet | ยังไม่ได้สั่งการเจ้าหน้าที่คนนี้ | 尚未指派此人员 |
| `map_staff_other_cases` | Other active cases ({{count}}) | เคสอื่นที่ถืออยู่ ({{count}}) | 其他进行中案件 ({{count}}) |
| `map_staff_other_cases_pending` | Other cases are not available yet | ยังไม่รองรับการแสดงเคสอื่น | 暂不支持显示其他案件 |
| `map_staff_blocked_assign` | The current SOP stage does not allow dispatching | สถานะ SOP ปัจจุบันยังไม่อยู่ในขั้นสั่งการ | 当前 SOP 阶段不允许派遣 |
| `map_staff_blocked_cancel` | The current SOP stage does not allow removal | สถานะ SOP ปัจจุบันไม่อนุญาตให้ยกเลิกการสั่งการ | 当前 SOP 阶段不允许取消指派 |
| `map_staff_submitting` | Sending command… | กำลังส่งคำสั่ง... | 正在发送指令… |

Interpolation uses the existing `{{name}}` style — see `map_staff_refresh_wait`.

Reuse existing toasts: `case.display.toast.dispatch_success`,
`case.display.toast.cancel_unit_success`, `case.display.toast.cancel_unit_fail`.

---

## 9. Error handling

### No optimistic updates

Whether a unit is assigned is decided by the SOP workflow on the backend (`dispatchStage` →
`nextStage`), not by the frontend. Flipping the UI ahead of the response risks showing a stage that
the refetched `unitLists` then contradicts, producing a visible flicker — worse than a one-second
spinner.

**Instead:** disable the button and show a spinner → await the mutation → toast → refetch → let the
UI update from real data. This mirrors `handleDispatch` and `handleConfirmCancelUnit` exactly.

### Failure path

1. Treat `payload.msg?.toLowerCase() !== "success"` as a failure — the BFF returns HTTP 200 with an
   error message. This is existing behaviour; preserve it.
2. Show the error toast with the message.
3. Always clear `submittingUnitId` in a `finally` block.
4. **Do not close `StaffDetailPanel`** on failure — the user must be able to retry immediately.

### Edge cases to handle

| Case | Expected behaviour |
|---|---|
| Another dispatcher assigns the same unit first | `CASE-UPDATE` over WS → refetch → button flips to "Remove" on its own. If the click races, the BFF rejects and a toast is shown. |
| Selected unit disappears from `/dispatch/units` | `selectedMarker` resolves to `null`, closing the panel — already handled in `CaseStaffMapField` |
| Unit has no position (0/0) | No marker to click; use the existing modal. Already counted in `map_staff_unmappable`. |
| Position older than `STAFF_STALE_THRESHOLD_MS` | Marker dimmed + "Outdated" badge (existing). **Assignment is still allowed** — do not block it. |
| SOP has no `dispatchStage` | `canAssign = false` → disabled button + `map_staff_blocked_assign` |
| Panel too short to show the action bar | Action bar is outside the scroll area and never collapses; verify at `height={320}` |

---

## 10. Blocked / out of scope

### 10.1 ⚠️ "Other cases held by this staff member" — no endpoint exists

§7.4 wants every case a unit currently holds, but all dispatch endpoints are **per-case**
(`/dispatch/{caseId}/units`, `/dispatch/{caseId}/SOP/unit/{unitId}`). Nothing returns
"which cases does this unit hold." This needs a new BFF endpoint, e.g.:

```
GET /dispatch/unit/{unitId}/cases
    → { caseId, statusId, caseTypeId, slaDeadline, createdAt }[]
```

**Until that exists, implement option 1:**

1. ✅ **Render only the current-case row.** Below it, show the `map_staff_other_cases_pending`
   line. Structure the component so adding the list later is a data change, not a rewrite.
2. Defer the whole `assigned-case` section to phase 2.
3. ❌ **Never** fetch all cases and filter client-side — expensive, and permission-scoped data
   would be incomplete.

The mockup shows the full list purely to illustrate the target layout. Do not treat it as a
licence to fabricate the data source.

### 10.2 Also out of scope

- `geometryEngine` proximity buffer — belongs in the `routing` section later, and must use
  **kilometres**, not miles.
- Dashed leader line from case to staff — same, part of `routing`.
- Multi-unit assignment — the existing modal covers it.
- Flipping `STAFF_WS_ENABLED` — blocked on the BFF emitting `UNIT-LOCATION-UPDATE`.

---

## 11. Implementation order

Work in this order and keep each step compiling before moving on.

1. `src/cms/store/api/dispatch.ts` — add `invalidatesTags` to both mutations; check the network tab
   for refetch loops before continuing.
2. `useStaffPositions.ts` — add `pollingInterval` plus the comment explaining the 10s floor.
3. `staffPanelSections.tsx` — extend the `render` signature, add `isVisible`.
4. `StaffDetailPanel.tsx` — pass `ctx` into `render`, honour `isVisible`, add the fixed action bar
   and the `ResizeObserver` height adaptation.
5. `CaseStaffMapField.tsx` — accept the new props, forward them into the panel.
6. `CaseDisplay.tsx` — widen the `staffOverlay` prop type and forward it.
7. `CaseDetailView.tsx` — build the `staffOverlay` object, add the confirmation wiring, reuse
   `handleDispatch` / `handleConfirmCancelUnit`, own `submittingUnitId`.
8. `public/i18n/{en,th,cn}.json` — add all keys from §8.
9. Write the three section `render` functions and flip their `status` to `"available"`.

---

## 12. Definition of done

### Automated

There is **no test runner in this repo** — no `test` script, no test files under `src`. Do not
invent one for this task. Verification is:

- `pnpm lint` passes.
- `pnpm build` passes (`tsc -b` then `vite build`). Remember `noUnusedLocals` /
  `noUnusedParameters` turn stray variables into build failures.

### Manual

Walk through each of these and report the result:

- [ ] Click a marker → panel opens with that staff member; clicking another switches to them
- [ ] Unassigned staff → header shows a solid blue "Assign to this case"; the `cancel-assign`
      section is absent
- [ ] Assign → confirmation dialog → success toast → button becomes "Remove from this case",
      `assigned-case` shows the highlighted current-case row
- [ ] Cancel → confirmation dialog → success toast → button returns to "Assign"
- [ ] During a request, both the header and section buttons show a spinner and are disabled;
      other markers remain clickable
- [ ] With no SOP `dispatchStage`, the button is disabled and the amber reason line appears
- [ ] Map at `height={320}`: one section open at a time, action bar always visible without scrolling
- [ ] Map expanded: `assigned-case` stays open and a second section can be opened alongside it
- [ ] Dark mode is correct in every state above
- [ ] Works with both `VITE_USE_GRAPHQL=true` and `false`
- [ ] Two browser tabs on the same case: assigning in one flips the button in the other after
      refetch
- [ ] `AssignOfficerModal` and the `AssignedOfficers` list still behave exactly as before
- [ ] All new strings render correctly in `en`, `th`, and `cn`

### Report back

When you finish, summarise: files changed, anything that deviated from this brief and why, and
anything you found that needs a backend change (in addition to §10.1).
