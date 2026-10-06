# Agent-State Command Contract

| Item | Detail |
| --- | --- |
| Status | **DRAFT v0.1 — pending backend sign-off** |
| Date | 2026-10-06 |
| Audience | Backend team (3CX integration adapter), FE team |
| FE reference implementation | `src/cc/types/agentStateCommand.ts` (validation source of truth); dormant endpoint `src/cc/store/api/callControlApi.ts` (`setAgentState`); selector UI `src/cc/components/softphone/AgentStateSelector.tsx` |
| Related | `docs/CALL-Lifecycle-Websocket-Event-Contract.md` (§5.2 `AGENT_STATE_CHANGED` — the confirming event, unchanged by this contract); `docs/3CX-Actual-Calling-Development-Plan.md` §3 Phase FE-1.3; `docs/3CX-Integration-Capability-Matrix.md` §2 + Decision 4; `docs/BRD-Contact-Center-Super-Apps-v1.2.md` §3.1.7 / FR-07 |

---

## 1. Purpose

Define the REST command the frontend sends when an agent changes their own telephony presence (**Ready / Not Ready / Break**, BRD FR-07), and how the backend confirms it.

The design is **command + confirm**, deliberately split across two channels:

- **Command** — a REST operation against the backend 3CX integration adapter (this contract, §2–§3).
- **Confirmation** — the existing `AGENT_STATE_CHANGED` websocket event, exactly as specified by the lifecycle contract (§5.2 there). This contract does not modify that event.

The websocket event is the **only authoritative state source**. Command responses carry no state; nothing is polled. The softphone's presence pill moves when — and only when — an `AGENT_STATE_CHANGED` event arrives.

---

## 2. Command transport

REST over the internal BFF, same proposal status and namespace as the other call-control operations in `callControlApi.ts` (`/call-control/*`):

| Aspect | Value |
| --- | --- |
| Method + path (proposed) | `POST /call-control/agent-state` |
| Content type | `application/json` |
| Authentication | Existing authenticated session (same as every other BFF call) |
| 3CX credentials | Never held by the FE — the adapter owns all 3CX specifics (capability matrix §9, Decision 4) |

The backend adapter maps this onto the 3CX Call Control API's DN/presence operations. Only the path and the 3CX mapping are open to change at sign-off — the FE consumer (`AgentStateSelector`) is unaffected by either.

---

## 3. Request / response schema

### 3.1 Request

```json
POST /call-control/agent-state
Content-Type: application/json

{
  "state": "break"
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `state` | string | **Yes** | One of the command vocabulary (§5): `ready`, `not_ready`, `break`. |

No other fields. Extra fields are ignored (forward compatible).

### 3.2 Response

The standard command envelope used by the other call-control mutations (`ApiResponse<null>`):

```json
{
  "status": "0",
  "data": null,
  "msg": "success"
}
```

- HTTP **200** with `status: "0"` → accepted; the state change itself is confirmed by the event (§4).
- HTTP **200** with `status: "-1"` → business rejection (e.g. transition not allowed, §9 Q3), human-readable `msg`.
- The response's `data` is **always null** — it never carries state, so the FE cannot shortcut the event.

---

## 4. Confirmation semantics

```text
FE selector ──POST /call-control/agent-state──►  BFF adapter ──► 3CX
                                                        │
softphone pill ◄──AGENT_STATE_CHANGED (websocket)────────┘
```

- The pill (and any other presence UI) updates **only** on the `AGENT_STATE_CHANGED` event — command success alone changes nothing on screen.
- If the event is lost (agent's socket down), the pill simply stays on the previous state until the next event; the FE does not retry or poll.
- The event's `state` is free-form per the lifecycle contract; unknown values render as-is (forward compatible).
- Delivery targeting follows the lifecycle contract §6.1: at minimum the agent themselves; supervisor/team fan-out is that contract's Q2.

---

## 5. State vocabulary & mapping

### 5.1 Command vocabulary (agent-selectable)

| Command value | UI label (BRD FR-07) | Proposed canonical event state |
| --- | --- | --- |
| `ready` | Ready | `available` |
| `not_ready` | Not Ready | `busy` |
| `break` | Break | `break` |

### 5.2 Event vocabulary (system-driven, NOT agent-selectable)

The `AGENT_STATE_CHANGED` canonical values `on_call`, `after_call_work`, `offline` are set by the platform (call answered, ACW started, agent logged out) — the FE offers no commands for them and its selector never highlights them.

### 5.3 Mapping is provisional

The command→event mapping in §5.1 is the FE's proposal. Whether the confirming event echoes the command value (`"ready"`) or the canonical value (`"available"`) is open question Q4 — the FE handles both (it labels and highlights either form). The `not_ready` → `busy` equivalence especially needs confirmation (Q2).

---

## 6. FE validation rules (normative)

Enforced by `normalizeAgentStateCommand` in `src/cc/types/agentStateCommand.ts`. A command value failing any rule is **never sent** — the selector item is not offered.

| Rule | Passes | Fails |
| --- | --- | --- |
| `state` is a string | `"break"` | `null`, number, object |
| Trimmed, lowercased value ∈ {`ready`, `not_ready`, `break`} | `" READY "` → `ready` | `""`, `"  "`, `"on_call"`, `"offline"`, `"available"`, `"hmm"` |

Rationale for normalization: the event contract's canonical values are lowercase; accepting `" READY "` keeps the demo console forgiving. System-driven states are rejected as commands on purpose (§5.2) even though they are valid event values.

---

## 7. Test vectors

Use verbatim for backend integration tests.

**Accepted — command request:**

```json
{"state": "break"}
```

**Accepted — command response:**

```json
{"status": "0", "data": null, "msg": "success"}
```

**Rejected — business rejection (transition not allowed, see Q3):**

```json
{"status": "-1", "data": null, "msg": "state change not allowed while on a call"}
```

**Confirming event (existing lifecycle contract §5.2, unchanged):**

```json
{"EVENT":"AGENT_STATE_CHANGED","additionalJson":{"agentId":"agent-101","state":"break","timestamp":"2026-10-06T09:00:00.000Z"}}
```

**Never sent — invalid command values (rejected client-side by §6):**

```json
{"state": "on_call"}
{"state": ""}
{"state": null}
```

---

## 8. Out of scope / explicitly not this contract

- **Not-ready reason codes** (why the agent is not ready) — no field exists; add later if product wants it.
- **Scheduled breaks** (auto-resume after N minutes) — backend timer concern.
- **Supervisor override** (force an agent's state) — different authorization path, not offered.
- **Per-queue readiness** — single global presence only.
- **Force-logout / `offline` commands** — `offline` is system-driven (§5.2).
- **`AGENT_STATE_CHANGED` itself** — owned by the lifecycle contract; this doc only consumes it.

---

## 9. Open questions (must be resolved at sign-off)

| # | Question | FE proposal / default |
| --- | --- | --- |
| Q1 | **Path confirmation:** is `POST /call-control/agent-state` acceptable, or does the BFF prefer a different path? | Keep the `/call-control/*` namespace shared with the other call-control operations. |
| Q2 | **Command→event mapping:** confirm §5.1 — especially `not_ready` → `busy` (vs. a distinct `not_ready` event value). | FE labels and highlights either form; it just needs the mapping documented. |
| Q3 | **Rejections in system states:** may the adapter reject commands while the agent is `on_call` / in `after_call_work` (e.g. selecting Ready mid-call)? | Yes, reject with `status "-1"`; the FE keeps the pill on the event-reported state. |
| Q4 | **Echo semantics:** does the confirming event carry the command value (`ready`) or the canonical value (`available`)? | Either — the FE treats them as equivalents (§5.1) — but it must be documented. |
| Q5 | **Idempotency:** re-sending the agent's current state — no-op success or rejection? | No-op success (`status "0"`, event re-asserted or not emitted). |
| Q6 | **Invalid state value:** HTTP 400 vs. HTTP 200 + `status "-1"` for a syntactically valid but unknown `state`? | 200 + `"-1"` envelope, consistent with other business rejections. |
| Q7 | **Permission key:** which permission guards this command (cf. `cc.screenpop.view` for the softphone route)? | A `cc.*`-scoped key provisioned with the adapter; the FE gate follows the route's existing pattern. |

---

## 10. Change process

- The FE reference implementation (`src/cc/types/agentStateCommand.ts`) and this document must be updated **together**; the code header links back here.
- Additive changes (new command values, new optional fields) are backward compatible — the FE's normalize/label layer is table-driven.
- Breaking changes (renamed command values, a different confirmation mechanism) require a contract version bump and coordinated FE/BE release.
- Questions and sign-off: reply in this document's review thread or open a ticket referencing "Agent-State command contract v0.1".

## 11. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Backend lead | | ☐ Approve / ☐ Approve with changes / ☐ Reject | |
| FE lead | | ☐ Approve | 2026-10-06 (pending BE alignment on Q1–Q7) |
| Product owner | | ☐ Approve | |
