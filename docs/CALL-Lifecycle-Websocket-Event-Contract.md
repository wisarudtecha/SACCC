# CALL Lifecycle Websocket Event Contract

| Item | Detail |
| --- | --- |
| Status | **DRAFT v0.2 — pending backend sign-off** (v0.2 adds the `CALL_MONITOR_*` supervisor-monitoring events, 2026-10-12 — additive, per §12 no version-breaking change) |
| Date | 2026-10-05 (v0.1) · 2026-10-12 (monitoring extension) |
| Audience | Backend team (3CX integration adapter), FE team |
| FE reference implementation | `src/cc/types/callEvents.ts` (validation source of truth, incl. the monitoring events); softphone consumer `src/cc/components/softphone/`; supervisor roster consumer `src/cc/pages/Supervision/` (planned) |
| Related | `docs/CALL_INCOMING-Websocket-Event-Contract.md` (ringing phase — this doc extends it, superseding its §9 follow-up list); `docs/Supervisor-Call-Control-Command-Contract.md` (the commands whose confirmation these monitoring events are); `docs/supervisor-call-control-plan.md`; `docs/3CX-Integration-Capability-Matrix.md` §10 Phase 2 + Decision 4; `docs/BRD-Contact-Center-Super-Apps-v1.2.md` §3.1.7 |

---

## 1. Purpose

Define the websocket events the backend must publish so the frontend can render the **post-ring call lifecycle** (answered → hold/resume → transferred → ended) and **agent telephony presence** in the softphone (`/cc/softphone`, FE side pending).

`CALL_INCOMING` (existing, signed-off-pending contract) announces a ringing leg and drives the screen pop. This contract defines what happens **after** the ring, using the same normalized internal event model (capability matrix Decision 4): the backend's 3CX Integration Adapter owns all 3CX-specific mapping; the FE never sees raw 3CX payloads.

The FE types and validation for these events are **already implemented and tested** (`src/cc/types/callEvents.ts`, dev-only mock emitter to follow). Signing off this document unblocks backend adapter implementation.

---

## 2. Transport

Rides the **existing notifications websocket** — same as `CALL_INCOMING`. No new socket, no new endpoint.

| Aspect | Value |
| --- | --- |
| Socket URL | `/api/v1/notifications/register` (as configured by `VITE_WEBSOCKET_BASE_URL`) |
| Handshake | FE sends `{ "EVENT": "SUBSCRIBE", orgId, username }` on open; backend confirms with `EVENT: "SUBSCRIBE-SUCCESS"` |
| Credential | The same `SUBSCRIBE` frame carries a flat `access_token` field — see §2.1 |
| Heartbeat | FE sends `{ "type": "ping" }` every 60 s |
| Envelope | Identical to `CALL_INCOMING` / `CASE-CREATE` / `CASE-UPDATE`: `data.EVENT` + `data.additionalJson` (JSON object, not a JSON-encoded string) |

### 2.1 Credential on the register frame

Implemented on the FE 2026-11-17; **server validation still pending**, so the socket is not yet authenticated end to end.

A browser cannot set an `Authorization` header on a WebSocket upgrade — `new WebSocket(url, protocols)` accepts no header parameter — so the access token travels in-band, on the frame that establishes the connection:

```json
{ "EVENT": "SUBSCRIBE", "orgId": "…", "username": "…", "access_token": "<jwt>" }
```

- **Carrier:** in-band on this frame only, as `access_token`. The upgrade request carries no credential — a browser cannot set a header on it, and the `Sec-WebSocket-Protocol` workaround was dropped (it aborts the handshake unless the server echoes the protocol).
- **FE behaviour now:** no access token → the socket is never opened (`connectionState: "unauthorized"`); close `4401`/`4403` → one refresh (`POST /auth/refresh`) and one reconnect, then terminal. Heartbeat and `DASHBOARD` frames do not carry it.
- **What the backend still owes:** validate `access_token` — proposed close `4401` / reason `unauthorized` when it is missing, malformed, expired, or does not match the claimed `orgId`/`username`; close an unregistered socket within 10 s. Lifecycle events are per-agent, so an unvalidated identity here means one agent's `CALL_*` events can be received by whoever claims that username.

Reasoning and evidence: [`WEBSOCKET-Auth-Token-Implementation-Plan.md`](./WEBSOCKET-Auth-Token-Implementation-Plan.md).

---

## 3. Event catalog & state machine

| Event | Meaning | Terminal? |
| --- | --- | --- |
| `CALL_ANSWERED` | The ringing leg was picked up | No |
| `CALL_ON_HOLD` | The active leg was placed on hold | No |
| `CALL_RESUMED` | A held leg was taken off hold | No |
| `CALL_TRANSFERRED` | The leg moved to another agent | No (see Q8) |
| `CALL_ENDED` | The leg is over | **Yes** |
| `AGENT_STATE_CHANGED` | Telephony presence for one agent (not call-scoped) | n/a |
| `CALL_MONITOR_STARTED` | A supervisor began / escalated monitoring the leg (mode: listen / whisper / barge) | No |
| `CALL_MONITOR_ENDED` | A supervisor's monitor session on the leg ended | No (see §6.5) |

```text
CALL_INCOMING  ← existing contract (screen pop)
      │
      ▼
CALL_ANSWERED ──────────────┐
      │                     │ CALL_TRANSFERRED
CALL_ON_HOLD ⇄ CALL_RESUMED │ (leg continues under toAgentId;
      │                     │  see Q8 for terminal semantics)
      ▼                     ▼
   CALL_ENDED  (terminal, per agent involvement)

   CALL_MONITOR_STARTED ⇄ CALL_MONITOR_ENDED   (supervisor monitor sessions
      │                                         ride alongside the leg — §6.5)
      └─ CALL_ENDED implies CALL_MONITOR_ENDED (no zombie sessions)
```

`callId` correlates every lifecycle event with the `CALL_INCOMING` event that announced the leg — same value, same uniqueness rules (unique per call leg per session). The monitor events reuse the same `callId` namespace: a monitor session always references a live agent leg's id.

---

## 4. Wire format

Same envelope as `CALL_INCOMING`; one JSON message per event as a websocket text frame:

```json
{
  "type": "notification",
  "EVENT": "CALL_ANSWERED",
  "additionalJson": {
    "callId": "3cx-call-8842",
    "agentId": "agent-101",
    "customerId": "42",
    "caseId": "D260708-00001",
    "timestamp": "2026-10-05T09:00:00.000Z"
  }
}
```

- `EVENT` and `additionalJson` are **top-level keys** of `data` (same shape the FE already parses).
- `type` is optional and not used for routing.
- `additionalJson` must be a JSON **object** (not a JSON-encoded string) — a string payload is dropped.

---

## 5. Payload schemas (`additionalJson`)

### 5.1 Shared base (all call-scoped events)

| Field | Type | Required | Constraints & meaning |
| --- | --- | --- | --- |
| `callId` | string | **Yes** | Non-empty after trim. Correlates with `CALL_INCOMING`. |
| `agentId` | string | No | Agent the event concerns. Informational — see §6.1. **Omit when unknown.** |
| `timestamp` | string | **Yes** | ISO 8601, server clock (same as CALL_INCOMING Q7). |

### 5.2 Per-event additional fields

| Event | Field | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| `CALL_ANSWERED` | `customerId` | string | No | Backend-resolved customer id (same semantics as on CALL_INCOMING — optimization, not requirement). |
| | `caseId` | string | No | Backend-resolved linked case id. |
| `CALL_ON_HOLD` | — | — | — | Base fields only. |
| `CALL_RESUMED` | — | — | — | Base fields only. |
| `CALL_TRANSFERRED` | `fromAgentId` | string | No | Agent the leg was transferred away from. |
| | `toAgentId` | string | No | Agent the leg was transferred to. |
| `CALL_ENDED` | `endReason` | string | **Yes** | Non-empty, free-form. Canonical values the FE renders explicitly: `completed`, `abandoned`, `missed`, `failed`, `transferred`. Unknown values fall back to a generic ended state (forward compatible). |
| | `durationSeconds` | number | No | Finite. Whole seconds of the leg (measurement window — see Q4). |
| `AGENT_STATE_CHANGED` | `agentId` | string | **Yes** | Agent whose state changed. |
| | `state` | string | **Yes** | Non-empty, free-form. Canonical values: `available`, `on_call`, `busy`, `break`, `after_call_work`, `offline`. Unknown values render as-is. |
| | `timestamp` | string | **Yes** | ISO 8601, server clock. |
| `CALL_MONITOR_STARTED` | `supervisorId` | string | **Yes** | Non-empty. The monitoring supervisor's user id — the FE keys monitor sessions by (`callId`, `supervisorId`). |
| | `mode` | string | **Yes** | Non-empty, free-form. Canonical values: `listen`, `whisper`, `barge`. Unknown values render a generic monitoring badge (forward compatible). |
| `CALL_MONITOR_ENDED` | `supervisorId` | string | **Yes** | Non-empty. Same semantics as STARTED — identifies which supervisor's session ended. |
| | `mode` | string | **Yes** | Non-empty. The mode the session was in when it ended (the FE re-renders the prior badge state from STARTED events, so this is informational). |
| | `reason` | string | No | Non-empty when present, free-form. Canonical values: `stopped` (stop-monitor command), `escalated` (superseded by a STARTED in a new mode — always emitted as an ENDED+STARTED pair), `call_ended` (leg ended; optional — see §6.5). |

### ⚠️ Sharp edges (events silently dropped when violated)

1. **Never send `null` for optional fields.** Same rule as `CALL_INCOMING`: JSON `null` fails the FE type guard and the whole event is silently dropped. Omit the key instead.
2. **`endReason` / `state` must be non-empty after trim.**
3. **`durationSeconds` must be a finite number** when present (`Infinity`/`NaN` drop the event).
4. **Unknown extra fields are ignored** (forward compatibility).
5. `AGENT_STATE_CHANGED` has **no `callId`** — it is agent-scoped, and its guard deliberately does not require the base fields.
6. `CALL_MONITOR_*` events **must not carry `null` `reason`** — omit the key when there is no reason. Same classic-bug rule as #1.

---

## 6. Delivery semantics

### 6.1 Targeting

Same principle as `CALL_INCOMING` (its §5.1): the FE does not filter by `agentId` — the backend must deliver each event only to the connection(s) of the agent it concerns:

- `CALL_ANSWERED` / `CALL_ON_HOLD` / `CALL_RESUMED` / `CALL_ENDED` → the agent currently involved in the leg.
- `CALL_TRANSFERRED` → **both** `fromAgentId` and `toAgentId` connections (see Q1).
- `AGENT_STATE_CHANGED` → at minimum the agent themselves; supervisor/team fan-out is an open question (Q2).
- `CALL_MONITOR_STARTED` / `CALL_MONITOR_ENDED` → **both** the monitored agent's connection(s) (drives the softphone's "Supervisor monitoring" badge) **and** the supervisor's connection(s) (drives the supervisor's session strip) — dual targeting, same principle as transfers.

Broadcasting these org-wide would drive every connected user's softphone state — must not happen. The one contested exception is the **supervisor roster feed** (org-scoped lifecycle events delivered to a supervisor role audience) — that is open question Q-S7, *not* a license to broadcast.

### 6.2 Idempotency & duplicates

Unlike `CALL_INCOMING` (where a duplicate would show a second popup), lifecycle events describe **state transitions that are safe to re-apply** — redelivery of the same event after a socket reconnect simply re-asserts the same state. The FE does not need to dedupe them, but:

- Two *different* legs must never share a `callId` (same rule as CALL_INCOMING).
- The FE applies events per `callId` idempotently; a repeated `CALL_ON_HOLD` is a no-op if already held.

### 6.3 No replay on reconnect

Same as `CALL_INCOMING`: lifecycle events are **transient, no backlog replay**. If the agent's socket was down mid-call, the softphone state for that call may be stale or absent until the next event arrives. Accepted product decision (confirm at sign-off, Q6 in the CALL_INCOMING doc applies here too).

### 6.4 Ordering tolerance

The FE assumes **no ordering guarantee** and reconciles defensively:

- Events are applied per `callId`, last-received-wins — except `CALL_ENDED`, which is **sticky**: a terminal state is never overridden by a late hold/resume/answer for the same `callId`.
- A `CALL_ANSWERED` arriving with no prior `CALL_INCOMING` (e.g. popup dismissed, socket was down during ring) must still render an active-call state in the softphone — the softphone must not depend on having seen the ring.

### 6.5 Monitor-session semantics (`CALL_MONITOR_*`)

Monitor events describe **supervisor sessions riding alongside a leg**, not the leg itself:

- **Session identity** is (`callId`, `supervisorId`) — the FE keys sessions that way (command contract Q-S2: no session id on the wire).
- **Escalation is a discrete event pair**: Listen → Whisper emits `CALL_MONITOR_ENDED` (`reason: "escalated"`) **followed by** `CALL_MONITOR_STARTED` (`mode: "whisper"`) for the same (`callId`, `supervisorId`). Each mode transition is its own replay-safe pair — never an in-place "mode changed" event.
- **`CALL_ENDED` implies `CALL_MONITOR_ENDED`** for every monitor session on that leg (sticky-terminal discipline): when the leg ends, the FE clears monitor state authoritatively — the backend **may** also emit an explicit `CALL_MONITOR_ENDED` (`reason: "call_ended"`), and the FE must tolerate both. A `CALL_MONITOR_*` event arriving **after** the leg's `CALL_ENDED` is ignored (no zombie sessions, no resurrection).
- **Monitor events never change leg status** — a monitored leg does not become "on hold" because a supervisor joined; the two state machines are orthogonal.

---

## 7. FE behavior on receipt (what the backend can rely on)

Documented so both sides share the same expectations. The softphone consumer is planned (capability-matrix Phase 2 Track B); the validation layer it will be built on is implemented and tested.

```text
lifecycle event received
  → parse & validate (src/cc/types/callEvents.ts) — malformed events silently dropped
  → permission check (softphone view — cc module, planned)
  → per-callId state machine:
       ANSWERED  → active call (customerId/caseId shown when present)
       ON_HOLD / RESUMED → toggle hold indicator
       TRANSFERRED → for fromAgent: call leaves their panel;
                     for toAgent: call enters their panel (active)
       ENDED      → terminal card (reason label), then cleared
  → AGENT_STATE_CHANGED → agent presence indicator
  → per-(callId, supervisorId) monitor state (§6.5):
       MONITOR_STARTED → agent-side "Supervisor monitoring" badge (mode label);
                         supervisor-side session strip (mode + escalation controls)
       MONITOR_ENDED   → badge/strip removed (reason display-only)
       (CALL_ENDED clears monitor state implicitly — sticky-terminal)
```

Consequences for the backend:

- `customerId`/`caseId` on `CALL_ANSWERED` are an **optimization** — the screen pop already resolves the caller on `CALL_INCOMING`; repeating them only helps when the softphone renders a call the screen pop never saw.
- `endReason` is display-only; the FE's state machine treats every value identically (terminal).

---

## 8. FE validation rules (normative)

The FE type guards in `src/cc/types/callEvents.ts` enforce exactly this. A payload failing any rule is **silently dropped** — the FE never throws on malformed events.

| Rule | Passes | Fails |
| --- | --- | --- |
| Payload is a JSON object | `{…}` | `"string"`, `42`, `[…]`, `null` |
| `callId` (call events) | non-empty string (trim) | missing, `""`, non-string |
| `timestamp` | any string | missing, non-string |
| `agentId` / `customerId` / `caseId` / `fromAgentId` / `toAgentId` | **absent key** or string | **`null`**, number, object |
| `endReason` / `state` | non-empty string (trim) | missing, `""`, non-string |
| `durationSeconds` | absent key or finite number | `null`, `Infinity`, `NaN`, string |
| `supervisorId` / `mode` (monitor events) | non-empty string (trim) | missing, `""`, non-string |
| `reason` (monitor ended) | **absent key** or non-empty string (trim) | **`null`**, `""`, number, object |
| Envelope | `data.EVENT` ∈ {`CALL_ANSWERED`, `CALL_ON_HOLD`, `CALL_RESUMED`, `CALL_TRANSFERRED`, `CALL_ENDED`, `AGENT_STATE_CHANGED`, `CALL_MONITOR_STARTED`, `CALL_MONITOR_ENDED`} + valid `additionalJson` | any other EVENT (incl. `CALL_INCOMING` — owned by the screen-pop parser), missing/invalid `additionalJson` |

---

## 9. Test vectors

Use these verbatim for backend integration tests — they mirror the FE unit-test fixtures (`src/cc/types/callEvents.test.ts`).

**Accepted — full `CALL_ANSWERED`:**

```json
{"EVENT":"CALL_ANSWERED","additionalJson":{"callId":"call-1001","agentId":"agent-101","customerId":"42","caseId":"D260708-00001","timestamp":"2026-10-05T09:00:00.000Z"}}
```

**Accepted — minimal `CALL_ANSWERED`:**

```json
{"EVENT":"CALL_ANSWERED","additionalJson":{"callId":"call-1002","timestamp":"2026-10-05T09:01:00.000Z"}}
```

**Accepted — `CALL_ENDED` with duration:**

```json
{"EVENT":"CALL_ENDED","additionalJson":{"callId":"call-1001","agentId":"agent-101","endReason":"completed","durationSeconds":245,"timestamp":"2026-10-05T09:08:00.000Z"}}
```

**Accepted — `AGENT_STATE_CHANGED`:**

```json
{"EVENT":"AGENT_STATE_CHANGED","additionalJson":{"agentId":"agent-101","state":"on_call","timestamp":"2026-10-05T09:12:00.000Z"}}
```

**Accepted — `CALL_MONITOR_STARTED` (full):**

```json
{"EVENT":"CALL_MONITOR_STARTED","additionalJson":{"callId":"call-1001","agentId":"agent-101","supervisorId":"user-9","mode":"listen","timestamp":"2026-10-12T09:00:00.000Z"}}
```

**Accepted — `CALL_MONITOR_STARTED` (minimal — agentId is optional base field):**

```json
{"EVENT":"CALL_MONITOR_STARTED","additionalJson":{"callId":"call-1001","supervisorId":"user-9","mode":"barge","timestamp":"2026-10-12T09:01:00.000Z"}}
```

**Accepted — `CALL_MONITOR_ENDED` with escalation reason:**

```json
{"EVENT":"CALL_MONITOR_ENDED","additionalJson":{"callId":"call-1001","supervisorId":"user-9","mode":"listen","reason":"escalated","timestamp":"2026-10-12T09:00:30.000Z"}}
```

**Accepted — unknown `mode` (forward compatible — FE renders a generic badge):**

```json
{"EVENT":"CALL_MONITOR_STARTED","additionalJson":{"callId":"call-1001","supervisorId":"user-9","mode":"some-future-3cx-mode","timestamp":"2026-10-12T09:02:00.000Z"}}
```

**Dropped — null optional field (the classic integration bug):**

```json
{"EVENT":"CALL_ANSWERED","additionalJson":{"callId":"call-1003","customerId":null,"timestamp":"2026-10-05T09:02:00.000Z"}}
```

**Dropped — missing required field (`endReason`):**

```json
{"EVENT":"CALL_ENDED","additionalJson":{"callId":"call-1001","timestamp":"2026-10-05T09:10:00.000Z"}}
```

**Dropped — wrong event name (hyphen style is not used):**

```json
{"EVENT":"CALL-ANSWERED","additionalJson":{"callId":"call-1004","timestamp":"2026-10-05T09:15:00.000Z"}}
```

**Dropped — monitor event with null `reason`:**

```json
{"EVENT":"CALL_MONITOR_ENDED","additionalJson":{"callId":"call-1001","supervisorId":"user-9","mode":"listen","reason":null,"timestamp":"2026-10-12T09:03:00.000Z"}}
```

**Dropped — monitor event missing `supervisorId`:**

```json
{"EVENT":"CALL_MONITOR_STARTED","additionalJson":{"callId":"call-1001","mode":"listen","timestamp":"2026-10-12T09:04:00.000Z"}}
```

---

## 10. Out of scope / explicitly not this contract

- **Call control** (answer / hang up / hold / transfer *commands*): these are REST operations against the backend adapter, not notifications-socket events. FE endpoint stubs are tracked separately (capability-matrix Phase 2). The **supervisor monitoring commands** (listen / whisper / barge-in / stop-monitor) are likewise REST — see `docs/Supervisor-Call-Control-Command-Contract.md`; only their *confirmation events* live here.
- **Recording / AI events** (transcript, summary, sentiment): Phase 3 of the matrix; no contract yet.
- **Queue / wallboard statistics events**: Phase 5; the dashboard consumes aggregated KPIs, not per-call events.
- `CALL_INCOMING` itself: unchanged, still owned by `docs/CALL_INCOMING-Websocket-Event-Contract.md`.

---

## 11. Open questions (must be resolved at sign-off)

| # | Question | FE proposal / default |
| --- | --- | --- |
| Q1 | **Transfer targeting:** is `CALL_TRANSFERRED` delivered to both `fromAgentId` and `toAgentId` connections? | Yes — the from-agent needs to drop the call from their panel, the to-agent needs to gain it. |
| Q2 | **Agent-state audience:** is `AGENT_STATE_CHANGED` delivered only to the agent, or also to supervisors/teams for presence dashboards? | Agent + supervisor role connections; FE does not filter. |
| Q3 | **`endReason` vocabulary:** confirm the canonical values (`completed`, `abandoned`, `missed`, `failed`, `transferred`) and whether the adapter may emit others. | Free-form string; FE renders unknown values as a generic ended state. |
| Q4 | **`durationSeconds` window:** measured from ring start (`CALL_INCOMING`) or answer (`CALL_ANSWERED`)? | Ring start (matches 3CX CDR "call duration" conventions) — must be documented either way. |
| Q5 | **Ordering:** can the adapter guarantee per-`callId` ordering? | FE assumes **no** and reconciles (§6.4). A guarantee would simplify but is not required. |
| Q6 | **Hold/resume cadence:** one event per hold action, or periodic hold refresh? | One per action; no periodic re-send needed (idempotent anyway). |
| Q7 | **Terminal semantics after transfer:** does each involved agent receive their own `CALL_ENDED` (with `endReason: "transferred"`) when their involvement ends, or is `CALL_TRANSFERRED` itself terminal for the from-agent? | FE treats `CALL_TRANSFERRED` as non-terminal; each agent's involvement ends with a `CALL_ENDED`. Needs explicit backend confirmation. |
| Q8 | **Timestamp:** same rule as CALL_INCOMING Q7 — server-clock ISO 8601 with timezone offset / Z. | `2026-10-05T09:00:00.000Z` style. |
| Q-S7 | **Supervisor roster feed (monitoring extension):** how does a supervisor discover which agents are on live calls — (a) org-scoped lifecycle events delivered to a supervisor role audience, or (b) a polled `GET /call-control/live-calls` query? | (a) Events — realtime-first, consistent with this contract's transport; polling only as fallback. Overlaps Q2 (supervisor audiences) — decide jointly. If (a), the org-scoped delivery must be restricted to supervisor-role connections (§6.1), never a broadcast. |

---

## 12. Change process

- The FE reference implementation (`src/cc/types/callEvents.ts`) and this document must be updated **together**; the code header links back here.
- Additive changes (new optional fields, new events) are backward compatible — no version bump needed. The v0.2 monitoring extension (`CALL_MONITOR_STARTED` / `CALL_MONITOR_ENDED`) is exactly such an additive change.
- Breaking changes (renamed/removed required fields, semantic changes to targeting/terminal rules) require a contract version bump and coordinated FE/BE release.
- Questions and sign-off: reply in this document's review thread or open a ticket referencing "CALL lifecycle contract v0.2".

## 13. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Backend lead | | ☐ Approve / ☐ Approve with changes / ☐ Reject | |
| FE lead | | ☐ Approve | 2026-10-05 (pending BE alignment on Q1–Q8) · 2026-10-12 (monitoring extension, pending Q-S7) |
| Product owner | | ☐ Approve | |
