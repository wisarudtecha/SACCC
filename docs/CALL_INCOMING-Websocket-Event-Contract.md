# CALL_INCOMING Websocket Event Contract

| Item | Detail |
| --- | --- |
| Status | **DRAFT v0.9 — pending backend sign-off** |
| Date | 2026-10-02 |
| Audience | Backend team (3CX integration adapter), FE team |
| FE reference implementation | `src/cc/types/incomingCall.ts` (validation source of truth), `src/cc/components/incomingCall/useIncomingCallPopups.ts` (consumer) |
| Related | `docs/3CX-Integration-Capability-Matrix.md` §4 + Decision 4; `docs/BRD-Contact-Center-Super-Apps-v1.2.md` §3.1.7 (Contact Center Component) |

---

## 1. Purpose

Define the single websocket event the backend must publish so the frontend can show the **incoming-call screen pop** (caller → customer → recent cases → Create Case prefill) when a call arrives on 3CX.

Per `3CX-Integration-Capability-Matrix.md` Decision 4, the FE consumes a **normalized internal event model only** — never raw 3CX payloads. The backend's 3CX Integration Adapter owns all 3CX-specific mapping. This document is the concrete wire-level definition of that normalized event; the matrix's `CALL_ANSWERED` JSON example is conceptual, this doc supersedes it for `CALL_INCOMING`.

The FE is **already implemented and tested** against this contract (with a dev-only mock emitter standing in for the adapter). Signing off this document unblocks backend adapter implementation.

---

## 2. Transport

Rides the **existing notifications websocket** — no new socket, no new endpoint.

| Aspect | Value |
| --- | --- |
| Socket URL | `/api/v1/notifications/register` (as configured by `VITE_WEBSOCKET_BASE_URL`) |
| Handshake | FE sends `{ "EVENT": "SUBSCRIBE", orgId, username }` on open; backend confirms with `EVENT: "SUBSCRIBE-SUCCESS"` |
| Heartbeat | FE sends `{ "type": "ping" }` every 60 s |
| Envelope | Identical to the existing `CASE-CREATE` / `CASE-UPDATE` / `SLA-ESCALATION` events |

---

## 3. Wire format

One JSON message per incoming call leg, sent as a websocket text frame:

```json
{
  "type": "notification",
  "EVENT": "CALL_INCOMING",
  "additionalJson": {
    "callId": "3cx-call-8842",
    "ani": "+66811223344",
    "customerId": "42",
    "caseId": "D260708-00001",
    "agentId": "agent-101",
    "timestamp": "2026-10-02T10:30:00.000Z"
  }
}
```

- `EVENT` and `additionalJson` are **top-level keys** of the JSON message (same shape the FE already parses for CASE-* events).
- `type` is optional; the FE defaults it to `"message"` when absent. It is not used for routing.
- `additionalJson` must be a JSON **object** (not a JSON-encoded string).

---

## 4. Payload schema (`additionalJson`)

| Field | Type | Required | Constraints & meaning |
| --- | --- | --- | --- |
| `callId` | string | **Yes** | Non-empty after trim. Backend idempotency key, unique per call leg. **The FE dedupes on this** — see §5.2. |
| `ani` | string | **Yes** | Non-empty after trim. Raw caller number exactly as the trunk delivered it (E.164 `+66…`, national `08…`, `66…`, or with spaces/dashes). **Do not pre-normalize** — the FE normalizes Thai formats itself. |
| `customerId` | string | No | Backend-resolved customer id, when the adapter already matched the caller. **Omit the key when unknown.** |
| `caseId` | string | No | Backend-resolved existing (open) case id, when the adapter already linked one. **Omit the key when unknown.** |
| `agentId` | string | No | Target agent identifier. Informational only — see §5.1 before relying on it. |
| `timestamp` | string | **Yes** | ISO 8601, server clock. Used for audit/ordering, not rendering. |

### ⚠️ Sharp edges (events silently dropped when violated)

1. **Never send `null` for optional fields.** JSON `null` fails the FE type guard — only *absent key* or *string* passes. An event with `"customerId": null` is dropped entirely, with no error surfaced. Omit the key instead.
2. **`ani` must be non-empty after trim.** For anonymous/withheld callers see open question Q4 — the current FE contract has no representation for "no number".
3. **Unknown extra fields are ignored** (forward compatibility). Adding fields later does not break the FE.

---

## 5. Delivery semantics

### 5.1 Targeting

The FE **does not filter by `agentId`** — every websocket connection that receives this event shows a popup (subject to the receiving user's permissions). Therefore:

> **The backend adapter is responsible for delivering `CALL_INCOMING` only to the connection(s) of the agent whose extension is ringing** (or to the agreed agent-group members, per the business rule confirmed in Q1).

This differs from `CASE-*` events, which are org-wide broadcasts. Broadcasting `CALL_INCOMING` org-wide would pop a card on every agent's screen for every call — almost certainly not the intent. Q1 must be answered before sign-off.

### 5.2 Idempotency & duplicates

- The FE dedupes on `callId` for the whole browser session (capped memory of 100 ids), so:
  - Redelivery of the same `callId` after a socket reconnect is safe (no duplicate popup, no resurrection of a dismissed card).
  - Two different calls must never share a `callId` within a session — a reused id makes the second call invisible to that agent.
- Recommended: derive `callId` from the 3CX call leg ID (see Q2).

### 5.3 No replay on reconnect

Unlike `SLA-ESCALATION` (which replays open breaches after a socket drop), `CALL_INCOMING` is **transient by design** — the backend must NOT maintain a replay/backlog. If the agent's socket was down when the call arrived, the popup is simply not shown for that call; the call itself still exists in 3CX. This is an accepted product decision — confirm in Q6.

### 5.4 Ordering & rate

- No ordering guarantee required between events.
- The FE caps the visible stack at 4 concurrent cards; overflow events are dropped (not queued). Burst routing to a single agent beyond 4 simultaneous calls loses the 5th+ popup. Acceptable for MVP — noted for awareness.

---

## 6. FE behavior on receipt (what the backend can rely on)

Documented so both sides share the same expectations.

```text
CALL_INCOMING received
  → permission check (case.view | contact.view | cc.screenpop.view)
  → dedupe on callId → enqueue card (30 s auto-dismiss, stack cap 4)
  → caller resolution:
      customerId present ? GET /customer/{customerId}
      otherwise        : GET /customer/byPhoneNo/{variant}   ← tries, in order:
                         national form ("0811223344"),
                         E.164 ("+66811223344"),
                         raw digits ("66811223344")
  → when a customer resolved:
      GET /case/customer/{customerId} (recent 10) → card shows newest 3,
      backend-supplied caseId pinned first with a "Linked case" chip
  → agent actions: open case (/cms/case/{caseId}) · Create Case prefilled
    (/cms/case/creation?phoneNo=…&customerId=…) · dismiss
```

Consequences for the backend:

- Sending `customerId`/`caseId` is an **optimization, not a requirement** — when absent, the FE resolves them via the existing endpoints above. Both modes are fully implemented and tested.
- Only send `customerId` when it is certain: a `customerId` that fails to resolve renders the card's error state (worse UX than a clean unknown-caller card).
- `agentId` currently has no behavioral effect on the FE (see §5.1).

---

## 7. FE validation rules (normative)

The FE type guard (`isIncomingCallEvent`) enforces exactly this. A payload failing any rule is **silently dropped** — the FE never throws on malformed events:

| Rule | Passes | Fails |
| --- | --- | --- |
| Payload is a JSON object | `{…}` | `"string"`, `42`, `[…]`, `null` |
| `callId` | non-empty string (trim) | missing, `""`, `"  "`, non-string |
| `ani` | non-empty string (trim) | missing, `""`, non-string |
| `timestamp` | any string | missing, non-string |
| `customerId` / `caseId` / `agentId` | **absent key** or string | **`null`**, number, object |
| Envelope | `data.EVENT === "CALL_INCOMING"` + valid `additionalJson` | any other EVENT, missing/invalid `additionalJson` |

---

## 8. Test vectors

Use these verbatim for backend integration tests — they mirror the FE unit-test fixtures.

**Accepted — full payload:**

```json
{"EVENT":"CALL_INCOMING","additionalJson":{"callId":"call-1001","ani":"+66811223344","customerId":"42","caseId":"D260708-00001","agentId":"agent-101","timestamp":"2026-10-02T10:30:00.000Z"}}
```

**Accepted — minimal (FE resolves customer itself):**

```json
{"EVENT":"CALL_INCOMING","additionalJson":{"callId":"call-1002","ani":"081-234 5678","timestamp":"2026-10-02T10:31:00.000Z"}}
```

**Dropped — null optional field (the classic integration bug):**

```json
{"EVENT":"CALL_INCOMING","additionalJson":{"callId":"call-1003","ani":"0811223344","customerId":null,"timestamp":"2026-10-02T10:32:00.000Z"}}
```

**Dropped — missing required field:**

```json
{"EVENT":"CALL_INCOMING","additionalJson":{"ani":"0811223344","timestamp":"2026-10-02T10:33:00.000Z"}}
```

**Dropped — wrong event name:**

```json
{"EVENT":"CALL-INCOMING","additionalJson":{"callId":"call-1004","ani":"0811223344","timestamp":"2026-10-02T10:34:00.000Z"}}
```

Note the last one: the event name is `CALL_INCOMING` (underscore), matching the `SLA-ESCALATION` hyphen style is **not** used here.

---

## 9. Out of scope / future events (do not build yet)

The FE today handles **only** `CALL_INCOMING`. Planned follow-ups (capability matrix Phase 2) need additional events — listed here only so the naming convention stays consistent when the backend designs them: `CALL_ANSWERED`, `CALL_ENDED`, `CALL_TRANSFERRED` (each reusing `callId` as the correlation key and the same envelope). No FE consumer exists for them yet.

Also out of scope for this contract: call control (answer/transfer/hangup), click-to-call, recording/AI events — those are REST/adapter concerns, not notifications-socket events.

---

## 10. Open questions (must be resolved at sign-off)

| # | Question | FE proposal / default |
| --- | --- | --- |
| Q1 | **Targeting:** is `CALL_INCOMING` delivered per-agent-connection, per-agent-group, or org-wide? | Per-agent-connection (the ringing extension's user). FE does not filter — backend must target. |
| Q2 | **callId source:** does the 3CX Call Control API expose a stable call-leg id usable as the idempotency key? | Use the 3CX call leg id verbatim (prefixed, e.g. `3cx-<legId>`, to keep it visibly external). |
| Q3 | **Pre-resolution:** will the adapter populate `customerId`/`caseId`, or always leave resolution to the FE? | Hybrid (Matrix §4): send ids when the adapter matched with confidence; omit otherwise. |
| Q4 | **Anonymous callers:** what does 3CX deliver when the caller withholds the number, and should the event be sent at all? | TBD — current FE contract drops an event with empty `ani`. If a "Unknown caller" card is wanted, the FE will add an agreed sentinel value in a contract v1.1. |
| Q5 | **Multi-tab:** one event per user or per connection (user with 2 tabs open)? | Per connection is fine — each tab dedupes independently and shows one card. Confirm no server-side per-user fan-out limit breaks this. |
| Q6 | **No-replay confirmation:** confirm calls are treated as transient (no backlog replay after reconnect) — deliberate contrast with SLA-ESCALATION. | Confirmed as the FE's product decision; needs backend agreement. |
| Q7 | **Timestamp:** confirm server-clock ISO 8601 with timezone offset / Z. | `2026-10-02T10:30:00.000Z` style. |

---

## 11. Change process

- The FE reference implementation (`src/cc/types/incomingCall.ts`) and this document must be updated **together**; the code header links back here.
- Additive changes (new optional fields, new events) are backward compatible — no version bump needed.
- Breaking changes (renamed/removed required fields, semantic changes to dedupe/targeting) require a contract version bump and coordinated FE/BE release.
- Questions and sign-off: reply in this document's review thread or open a ticket referencing "CALL_INCOMING contract v0.9".

## 12. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Backend lead | | ☐ Approve / ☐ Approve with changes / ☐ Reject | |
| FE lead | | ☐ Approve | 2026-10-02 (pending BE alignment on Q1–Q7) |
| Product owner | | ☐ Approve | |
