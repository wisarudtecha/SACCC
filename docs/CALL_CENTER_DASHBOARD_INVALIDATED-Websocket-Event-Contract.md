# CALL_CENTER_DASHBOARD_INVALIDATED Websocket Event Contract

| Item | Detail |
| --- | --- |
| Status | **DRAFT v0.1 — pending backend sign-off** |
| Date | 2026-10-05 |
| Audience | Backend team (BFF / analytics aggregation service), FE team |
| FE consumer | `/cc/dashboard` (`src/cc/pages/Dashboard/CallCenterDashboard.tsx`) via `useCallCenterDashboard`; cache tag `CallCenterDashboard` in `src/cc/store/api/callCenterDashboardApi.ts` |
| Related | `docs/CC-Dashboard-KPI-Contract.md` §7 + Q9 (this doc expands §7 into a standalone normative spec — sign-off here resolves that contract's Q9); `docs/CALL-Lifecycle-Websocket-Event-Contract.md` (transport conventions); `docs/3CX-FE-Development-Plan-Remaining-Scope.md` Phase E item E5; arch doc §06 "Real-time refresh … uses WebSocket to update the data in real-time" |

---

## 1. Purpose

Define the websocket event that tells the frontend **the call-center dashboard's aggregated KPIs for a period have changed**, so `/cc/dashboard` can refetch and render fresh numbers without a manual reload. This is plan item E5 — the only remaining piece of dashboard Phase E — and the last FE buildable item not blocked on the 3CX adapter.

**Design choice — invalidation ping, not data push.** The event carries *no KPI values*. All aggregation math and all payload schema live exclusively on the REST endpoint (`GET /call-center/dashboard`, KPI contract §3–§4). Pushing values on the socket would duplicate that schema across two transports and allow them to diverge. An invalidation ping keeps one source of truth, reuses the FE's existing RTK Query cache machinery (`CallCenterDashboard` tag), and bounds refetch cost via server-side throttling. This satisfies arch doc §06's "real-time refresh" requirement in the near-real-time sense (staleness bounded by the throttle window, §7).

---

## 2. Transport

Rides the **existing notifications websocket** — same as `CALL_INCOMING` and the lifecycle events. No new socket, no new endpoint, no new handshake.

| Aspect | Value |
| --- | --- |
| Socket URL | `/api/v1/notifications/register` (as configured by `VITE_WEBSOCKET_BASE_URL`) |
| Handshake | FE sends `{ "EVENT": "SUBSCRIBE", orgId, username }` on open; backend confirms with `EVENT: "SUBSCRIBE-SUCCESS"` |
| Credential | The same `SUBSCRIBE` frame carries a flat `access_token` field — see §2.1 |
| Heartbeat | FE sends `{ "type": "ping" }` every 60 s |
| Envelope | Identical to `CALL_INCOMING` / lifecycle events: top-level `data.EVENT` + `data.additionalJson` (**JSON object, not a JSON-encoded string**) |

### 2.1 Credential on the register frame

Implemented on the FE 2026-11-17; **server validation still pending**.

The browser cannot set an `Authorization` header on a WebSocket upgrade (`new WebSocket(url, protocols)` takes no header parameter), so the access token travels in-band:

```json
{ "EVENT": "SUBSCRIBE", "orgId": "…", "username": "…", "access_token": "<jwt>" }
```

- **Carrier:** in-band only, as `access_token`; never the query string (JWT in a URL → access logs).
- **FE behaviour now:** no token → socket never opened (`connectionState: "unauthorized"`); `4401`/`4403` → one refresh then one reconnect, then terminal. The dashboard's `{ EVENT: "DASHBOARD", orgId, username }` request frames stay token-free.
- **Backend still owes:** validate `access_token` (proposed `4401` / `unauthorized`; 10 s grace for an unregistered socket). This event carries no KPI values, so an unvalidated subscriber leaks only *the fact that aggregates changed for a period* — the REST endpoint remains the data source and stays permission-checked.

Reasoning and evidence: [`WEBSOCKET-Auth-Token-Implementation-Plan.md`](./WEBSOCKET-Auth-Token-Implementation-Plan.md).

**Routing note:** the FE's `WebSocketProvider` (`src/core/components/websocket/websocket.tsx`) routes only `EVENT` values containing the substring `CASE` into the case-list side-effect handler; everything else reaches feature subscribers only. `CALL_CENTER_DASHBOARD_INVALIDATED` contains no `CASE` substring, so the event has no side effects outside the dashboard subscriber.

**Naming style:** underscore (`CALL_*` family, like `CALL_INCOMING` / `CALL_ANSWERED`), **not** the hyphen style of the legacy `CASE-CREATE` / `CASE-UPDATE` events. A hyphenated variant (`CALL-CENTER-DASHBOARD-INVALIDATED`) is silently dropped by the FE.

---

## 3. Event semantics

| Property | Value |
| --- | --- |
| `EVENT` | `CALL_CENTER_DASHBOARD_INVALIDATED` |
| Meaning | "The server-side aggregates for `period` have changed since they were last computed. Any dashboard view of `period` is stale — refetch." |
| Payload | Identification only (`period` + `timestamp`). **No KPI values, no partial data, no deltas.** |
| Direction | Backend → FE only. The FE never sends this event. |
| Scope | Per period (`YYYY-MM`), matching the REST endpoint's filter. |

The intended trigger is **completion of the backend's aggregation refresh** for a period (e.g. CDR data landed, the aggregation job re-ran) — not individual call events. The FE does not want a ping per call; per-call fan-out is what the throttle (§7) exists to prevent.

---

## 4. Wire format

One JSON message per event, as a websocket text frame — same envelope as `CALL_INCOMING`:

```json
{
  "type": "notification",
  "EVENT": "CALL_CENTER_DASHBOARD_INVALIDATED",
  "additionalJson": {
    "period": "2026-10",
    "timestamp": "2026-10-05T09:00:00.000Z"
  }
}
```

- `EVENT` and `additionalJson` are **top-level keys** of the parsed frame.
- `type` is optional and not used for routing.
- `additionalJson` must be a JSON **object** (not a JSON-encoded string) — a string payload is dropped.

---

## 5. Payload schema (`additionalJson`)

| Field | Type | Required | Constraints & meaning |
| --- | --- | --- | --- |
| `period` | string | **Yes** | `YYYY-MM`, strictly `^\d{4}-(0[1-9]\|1[0-2])$`. The aggregation period that changed — same value space as the REST endpoint's `period` param (KPI contract §3). |
| `timestamp` | string | **Yes** | ISO 8601, server clock (same rule as lifecycle contract Q8). Time the invalidation was **generated** — informational/debug only; the FE does not display or compare it. |

### ⚠️ Sharp edges (event silently dropped when violated)

1. **`period` must be a well-formed `YYYY-MM` string.** Not `null`, not `""`, not `2026-1`, not `2026/10`, not a number.
2. **Never send `null` for any field.** Same rule as `CALL_INCOMING` / lifecycle: JSON `null` fails the FE type guard and the whole event is silently dropped. Omit the key if genuinely absent — but both keys are required here, so an absent key is also a drop.
3. **`additionalJson` must be a JSON object.** A JSON-encoded string payload is dropped.
4. **Extra fields are ignored** (forward compatibility) — but the backend must not rely on the FE ever reading them. In particular: **do not attach KPI values**; the FE will neither render nor cache them.

---

## 6. Delivery semantics

### 6.1 Targeting

The FE does not filter by role. The backend must deliver the event only to connections of users **entitled to the dashboard** (Admin, Manager, Supervisor, Agent — arch doc §06 role list), per the same principle as the KPI contract §9: authorization is authoritative server-side.

Whether the backend targets *all entitled connections* or only those *currently viewing the dashboard* is open question Q2 — the FE tolerates either (receipt is idempotent and cheap; §6.2).

### 6.2 Idempotency & duplicates

Invalidation is naturally idempotent: N duplicate pings for the same period cause at most refetches of the same fresh data. The FE applies no dedupe (unlike `CALL_INCOMING`, where a duplicate would spawn a second popup). The backend's throttle (§7) is a cost optimization, not a correctness requirement.

### 6.3 Period scoping

The FE **ignores pings whose `period` differs from the period currently being viewed** on `/cc/dashboard` (one period is mounted at a time; the month picker changes it). A ping for a month the user is not looking at causes no refetch. The backend may therefore emit for any period without concern for client state — e.g. late-arriving CDR backfill for a prior month.

A period-less "invalidate everything" variant is **not part of v1** (see Q3).

### 6.4 No replay on reconnect

The event is **transient — no backlog replay**. If the socket was down when an invalidation fired, the dashboard may be stale. This is made safe by the FE's reconnect rule (§8): on websocket reconnection the dashboard refetches once unconditionally. The backend needs no replay buffer, no last-event-id tracking, and no per-connection bookkeeping.

---

## 7. Throttling

**Server-side, mandatory:** at least **60 seconds between emissions per `period`**. If the aggregation for `2026-10` changes ten times inside a minute, the backend emits at most one ping.

- Rationale: each accepted ping triggers one REST refetch per viewing client; the throttle bounds that cost and satisfies arch doc §06's near-real-time intent.
- The FE **does not throttle** — it trusts the backend's cadence and is harmless under any cadence (§6.2). Exact window confirmation is Q1.
- Throttling is per period, so a backfill ping for a prior month never suppresses the current month's ping.

---

## 8. FE behavior on receipt (planned E5 implementation — what the backend can rely on)

```text
ws frame received
  → parse & validate (planned guard in src/cc/types/callCenterDashboard.ts,
    colocated with the snapshot types it invalidates) — malformed → silent drop
  → is EVENT === "CALL_CENTER_DASHBOARD_INVALIDATED" && period === viewed period?
       no  → ignore
       yes → dispatch cache invalidation:
             callCenterDashboardApi.util.invalidateTags(["CallCenterDashboard"])
  → RTK Query refetches the mounted useReadCallCenterDashboardQuery subscriber
  → useCallCenterDashboard surfaces the refresh via its existing `isFetching`
    flag (background refetch — the page shows current data, not a loading state)
```

Consequences and commitments:

1. **One refetch per ping per viewing client** — no polling, no debouncing on the FE. Cache invalidation touches only the `CallCenterDashboard` tag (deliberately distinct from the layout-CRUD `Dashboard` tag, per `callCenterDashboardApi.ts`), so no other cache refetches.
2. **Unmounted pages don't refetch.** RTK Query invalidation only affects mounted subscribers — leaving `/cc/dashboard` unsubscribes; the hook's `onMessage` registration follows the component's lifetime (established pattern from `useIncomingCallPopups.ts`).
3. **Reconnect = refetch.** On `isConnected` transitioning `false → true`, the dashboard invalidates the tag once — covering any ping missed while the socket was down (§6.4).
4. **Mock mode is unaffected.** Behind `VITE_MOCK_API` the REST query is skipped, so an invalidation dispatch is a no-op.
5. **Dev demo path.** A dev-only mock emitter (same pattern as `mockCallLifecycle.ts` / `window.mockCall`, tree-shaken from production builds) will let the refresh cycle be demoed before the backend exists. Contract test vectors (§9) are its fixtures.

---

## 9. FE validation rules (normative)

The FE guard (planned, `src/cc/types/callCenterDashboard.ts`) enforces exactly this. A payload failing any rule is **silently dropped** — the FE never throws on malformed events.

| Rule | Passes | Fails |
| --- | --- | --- |
| Envelope | `data.EVENT === "CALL_CENTER_DASHBOARD_INVALIDATED"` + `additionalJson` present and an object | any other EVENT value, missing/`additionalJson` that is a string, number, array, or `null` |
| `period` | string matching `^\d{4}-(0[1-9]\|1[0-2])$` | missing, `null`, `""`, `"2026-1"`, `"2026/10"`, `202610`, non-string |
| `timestamp` | any string | missing, `null`, non-string |
| Extra fields | ignored (but never interpreted) | — |

---

## 10. Test vectors

Use these verbatim for backend integration tests — they mirror the fixtures the FE guard's unit tests will use.

**Accepted — canonical:**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":{"period":"2026-10","timestamp":"2026-10-05T09:00:00.000Z"}}
```

**Accepted — extra fields present (ignored by FE, tolerated by guard):**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":{"period":"2026-10","timestamp":"2026-10-05T09:00:00.000Z","reason":"cdr_backfill"}}
```

**Dropped — malformed period (single-digit month):**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":{"period":"2026-1","timestamp":"2026-10-05T09:00:00.000Z"}}
```

**Dropped — null field (the classic integration bug):**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":{"period":null,"timestamp":"2026-10-05T09:00:00.000Z"}}
```

**Dropped — missing required field (`timestamp`):**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":{"period":"2026-10"}}
```

**Dropped — wrong event name (hyphen style is not this family):**

```json
{"EVENT":"CALL-CENTER-DASHBOARD-INVALIDATED","additionalJson":{"period":"2026-10","timestamp":"2026-10-05T09:00:00.000Z"}}
```

**Dropped — `additionalJson` is a JSON-encoded string:**

```json
{"EVENT":"CALL_CENTER_DASHBOARD_INVALIDATED","additionalJson":"{\"period\":\"2026-10\"}"}
```

**Ignored by FE (valid event, wrong period for the viewer):** a ping for `2025-09` while the dashboard displays `2026-10` — parsed successfully, causes no refetch (§6.3).

---

## 11. Out of scope / explicitly not this contract

- **Full snapshot push** — rejected alternative (KPI contract Q9); values never ride the socket.
- **Period-less "invalidate all"** — not in v1; may be added as a compatible extension (Q3).
- **Other dashboards** (dispatch, case, custom layouts) — no realtime requirement in arch doc §06 for them; the `CallCenterDashboard` tag is deliberately isolated so this event cannot leak into them.
- **Queue / wallboard realtime statistics** (waiting calls, SLA %, agent availability — matrix §8.1) — separate future contract.
- **The REST endpoint itself** — owned by `docs/CC-Dashboard-KPI-Contract.md`; this doc changes nothing in its schema.
- **Mobile push notifications** — the notifications socket serves the web app only.

---

## 12. Open questions (must be resolved at sign-off)

| # | Question | FE proposal / default |
| --- | --- | --- |
| Q1 | **Throttle window:** confirm ≥ 60 s per period (KPI contract Q9 proposal). Per-org or per-period granularity? | ≥ 60 s **per period** — backfill pings for other months must not suppress the current month's. |
| Q2 | **Targeting breadth:** all entitled connections (org-wide role broadcast) or only connections currently viewing the dashboard? | Broadcast to all entitled connections — simpler; FE handles surplus pings idempotently. Viewing-state targeting requires per-connection UI state the backend shouldn't own. |
| Q3 | **"Invalidate all" variant:** if an aggregation rebuild touches many periods, does the backend need a period-less ping meaning "refetch whatever you're viewing"? | Not in v1. One ping per affected period (throttled per period). If rebuilds are frequent, add `period` omitted = all, as a backward-compatible extension. |
| Q4 | **Emission trigger:** fire on every aggregation refresh completion, only on material change, or on manual/administrative action? | Aggregation refresh completion; the FE has no preference (idempotent) but pings with no data change cause pointless refetches. |
| Q5 | **Backfill:** confirm pings fire for *prior* periods when late CDR data lands (the FE's period guard already handles this). | Yes — backfill is precisely the stale-data case this event exists for. |
| Q6 | **Reconnect-refetch in lieu of replay:** acceptable that the FE refetches once on socket reconnection instead of the backend replaying missed pings? | Yes — §6.4/§8.3; avoids per-connection event bookkeeping on the backend. |
| Q7 | **`timestamp` semantics:** generation time or aggregation computation time? | Generation time; informational only — the FE never displays or compares it. |

---

## 13. Change process

- This document, the FE guard in `src/cc/types/callCenterDashboard.ts`, and the E5 subscriber hook must be updated **together**; the code links back here.
- `docs/CC-Dashboard-KPI-Contract.md` §7 defers to this document — on sign-off, mark its Q9 resolved and point §7 here. The two docs must not drift apart.
- Additive changes (new optional `additionalJson` fields, the §12 Q3 extension) are backward compatible.
- Breaking changes (renamed event, changed `period` semantics, payload carrying data) require a version bump and coordinated release.
- Questions and sign-off: reply in this document's review thread or open a ticket referencing "dashboard invalidation contract v0.1".

## 14. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Backend lead | | ☐ Approve / ☐ Approve with changes / ☐ Reject | |
| FE lead | | ☐ Approve | 2026-10-05 (pending BE alignment on Q1–Q7) |
| Product owner | | ☐ Approve | |
