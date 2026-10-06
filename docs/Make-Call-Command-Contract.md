# Make-Call Command Contract

| Item | Detail |
| --- | --- |
| Status | **DRAFT v0.1 — pending backend sign-off** |
| Date | 2026-10-06 |
| Audience | Backend team (3CX integration adapter), FE team |
| FE reference implementation | `src/cc/store/api/callControlApi.ts` (`makeCall` — dormant endpoint, response type follows §3.2); `src/cc/utils/dialDestination.ts` (validation source of truth); dialpad UI `src/cc/components/softphone/Dialpad.tsx` |
| Related | `docs/CALL-Lifecycle-Websocket-Event-Contract.md` (the lifecycle events of the dialed leg — unchanged by this contract); `docs/Agent-State-Command-Contract.md` (the command-contract pattern this doc mirrors); `docs/3CX-Actual-Calling-Development-Plan.md` §3 Phase FE-1.2; `docs/3CX-Integration-Capability-Matrix.md` §1 + §2 + Decision 4; `docs/BRD-Contact-Center-Super-Apps-v1.2.md` §3.1.7 / FR-07 |

---

## 1. Purpose

Define the REST command the frontend sends when an agent initiates an outbound call (**click-to-call** / dialpad, BRD FR-07), and how the backend correlates that command with the dialed leg's lifecycle events.

The design follows the same **command + confirm** split as the agent-state contract, with one deliberate difference:

- **Command** — a REST operation against the backend 3CX integration adapter (this contract, §2–§3).
- **Confirmation** — the existing call-lifecycle websocket events (`CALL_ANSWERED`, `CALL_ON_HOLD`, `CALL_RESUMED`, `CALL_TRANSFERRED`, `CALL_ENDED`), exactly as specified by the lifecycle contract. This contract does **not** modify any event, and adds **no** new event type.
- **Correlation** — unlike the agent-state command (whose response carries no data), the make-call response **must carry the new leg's `callId`**: the exact key the leg's lifecycle events use. Without it the FE cannot tie a dialed leg to the command that created it.

The websocket events remain the **only authoritative state source**. The response's `callId` is a correlation key, not call state: the softphone renders the leg only when its `CALL_ANSWERED` event arrives (§4), never from the response alone.

---

## 2. Command transport

REST over the internal BFF, same proposal status and namespace as the other call-control operations in `callControlApi.ts` (`/call-control/*`):

| Aspect | Value |
| --- | --- |
| Method + path (proposed) | `POST /call-control/calls` |
| Content type | `application/json` |
| Authentication | Existing authenticated session (same as every other BFF call) |
| 3CX credentials | Never held by the FE — the adapter owns all 3CX specifics (capability matrix §9, Decision 4) |

The backend adapter maps this onto the 3CX Call Control API's make-call operation, dialing `destination` from the agent's own extension. Only the path and the 3CX mapping are open to change at sign-off — the FE consumer (`Dialpad` / `useSoftphone`) is unaffected by either.

---

## 3. Request / response schema

### 3.1 Request

```json
POST /call-control/calls
Content-Type: application/json

{
  "destination": "0811223344"
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `destination` | string | **Yes** | Non-empty after trim. The number exactly as the agent entered it (§5) — the FE never rewrites it. |

No other fields. Extra fields are ignored (forward compatible).

### 3.2 Response (proposed — open question Q2)

The standard command envelope, but with data: the correlation key.

```json
{
  "status": "0",
  "data": {
    "callId": "3cx-call-9103"
  },
  "msg": "success"
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `data.callId` | string | **Yes** | Non-empty after trim. The exact `callId` the dialed leg's lifecycle events will carry (lifecycle contract §5.1). |

- HTTP **200** with `status: "0"` → **dial accepted** (not connected — connect is the `CALL_ANSWERED` event, §4). Never `null` data.
- HTTP **200** with `status: "-1"` → business rejection (invalid destination, trunk failure, agent state — vocabulary is open question Q7), human-readable `msg`, `data: null`.
- The response does **not** mean the destination answered, and carries no call state — rendering state from it would break the events-only rule (§1).

---

## 4. Outbound leg event sequence

What the FE assumes the adapter will publish for an agent-initiated leg. Every point below rides the **existing six lifecycle events unchanged** (§8) — this section is the FE's proposal, pending BE sign-off (Q3–Q6).

```text
FE dialpad ──POST /call-control/calls──►  BFF adapter ──► 3CX dial
      ▲                                        │
      │ response: { callId } (correlation)      │ (dialing / ringing: silent — no event)
      │                                        ▼
softphone panel ◄──CALL_ANSWERED (websocket)────┘  destination picked up
                     │
                     ├─ CALL_ON_HOLD ⇄ CALL_RESUMED
                     ├─ CALL_TRANSFERRED
                     ▼
                  CALL_ENDED  (terminal)
```

- **Never `CALL_INCOMING`** for an agent-initiated leg (Q4). The ringing-phase event belongs to the screen pop / inbound flow; an outbound leg's first event is `CALL_ANSWERED`. The softphone already renders an active session from a `CALL_ANSWERED` with no prior ring (lifecycle contract §6.4), so no FE change is needed for this.
- **`CALL_ANSWERED` on connect** — when the destination party picks up (Q3), not when the dial command is accepted.
- **`CALL_ON_HOLD` / `CALL_RESUMED` / `CALL_TRANSFERRED`** apply unchanged: the dialed leg is an ordinary leg once connected, with the same toolbar semantics as an inbound leg.
- **`CALL_ENDED` is terminal** — when either party hangs up, or the dial fails / times out unanswered (Q7 maps those outcomes to `endReason`). Same sticky-terminal rule as inbound legs.
- **Ordering / race (Q5):** lifecycle events may arrive before or after the REST response resolves. Events are authoritative — the FE never waits on the response to render state, and the response's `callId` is used only for local correlation (the dialpad's "Calling… / Connected" indicator).
- **No pre-connect event exists (Q6):** the dialing and ringing phases are silent on the socket — no new event type is proposed. The FE shows a local "Calling…" indicator for that window; the leg appears in the softphone panel only on `CALL_ANSWERED`.

---

## 5. Destination format

- The FE sends `destination` **as provided by the agent, trimmed only** — it does not normalize to E.164 or national form (the same discipline as the ANI layer: rewriting numbers client-side has caused lookup drift before; see `src/cc/utils/ani.ts`).
- FE-side accepted charset (validation source of truth: `src/cc/utils/dialDestination.ts`): digits, `*`, `#`, an optional single **leading** `+`, and separator characters (space, `-`, `(`, `)`, `.`). Anything else (letters, a `+` anywhere but first) is rejected client-side and never sent (§6).
- Significant-character cap: at most 20 digits/`*`/`#` (E.164 caps numbers at 15 digits; the looser bound covers DTMF service codes such as `*121#`). The adapter is the real validator — the FE cap only guards garbage input.
- Which canonical form the adapter *requires* (E.164 vs. as-provided national/extension forms) is open question Q10.

---

## 6. FE validation rules (normative)

Enforced by `validateDialDestination` in `src/cc/utils/dialDestination.ts`. A destination failing any rule is **never sent** — the Call button is disabled.

| Rule | Passes | Fails |
| --- | --- | --- |
| Non-empty string after trim | `"0811223344"` | `""`, `"  "`, `null` |
| Only allowed characters (digits, `*`, `#`, separators, leading `+`) | `"+66 81-122-3344"`, `"*121#"` | `"0811-ABC"`, `"08+11"` |
| 1–20 significant characters (digits + `*` + `#`) | `"100"` (extension), `"0811223344"` | `"+"` (zero significant), 21 digits |
| `+` only in leading position | `"+66811223344"` | `"66+811223344"` |

Rationale for the permissive bound: internal 3-digit extensions, 4-digit Thai service short codes, and DTMF service codes are all dialable; a strict E.164 validator would block legitimate destinations the adapter could route.

---

## 7. Test vectors

Use verbatim for backend integration tests — they mirror the FE unit-test fixtures (`src/cc/utils/dialDestination.test.ts`).

**Accepted — command request:**

```json
{"destination": "0811223344"}
```

**Accepted — command response (dial accepted; call not yet connected):**

```json
{"status": "0", "data": {"callId": "3cx-call-9103"}, "msg": "success"}
```

**Rejected — business rejection (see Q7):**

```json
{"status": "-1", "data": null, "msg": "destination unreachable"}
```

**Dialed leg — connect (existing lifecycle contract wire format, unchanged):**

```json
{"EVENT":"CALL_ANSWERED","additionalJson":{"callId":"3cx-call-9103","agentId":"agent-101","timestamp":"2026-10-06T09:00:00.000Z"}}
```

**Dialed leg — terminal (no answer, one proposed Q7 outcome):**

```json
{"EVENT":"CALL_ENDED","additionalJson":{"callId":"3cx-call-9103","agentId":"agent-101","endReason":"failed","timestamp":"2026-10-06T09:00:45.000Z"}}
```

**Never sent — invalid destinations (rejected client-side by §6):**

```json
{"destination": ""}
{"destination": "0811-ABC"}
{"destination": "08+11"}
```

---

## 8. Out of scope / explicitly not this contract

- **Conference / consult calls** — dialing a second destination while a call is connected is consult/conference semantics (actual-calling plan Q7, gated on its own plan revision). The FE blocks a second dial while a leg is active; whether the adapter would accept or reject such a command is Q9, not a feature.
- **Click-to-call buttons in cms customer/contact views** — product decision Q6 (2026-10-06): dialpad-only this release, preserving the `cms → cc` import isolation.
- **New lifecycle event types for outbound legs** (e.g. a pre-connect `CALL_DIALING`) — deliberately absent; pre-connect silence is Q6's proposal. Adding an event type would be a lifecycle-contract change, not this doc's.
- **In-app answer** for the *remote* party's ring — nonsensical for outbound, and inbound answer UX was decided by Q3 (answer on handset/3CX client).
- **Speed dial / call history / destination autocomplete** — UI conveniences, no contract surface.
- **Destination → customer prefill on dial** — the screen pop resolves *inbound* callers; outbound customer resolution is a future optimization (would ride `customerId` on `CALL_ANSWERED`, which already exists in the lifecycle contract).
- **The six lifecycle events themselves** — owned by the lifecycle contract; this doc only consumes them.

---

## 9. Open questions (must be resolved at sign-off)

| # | Question | FE proposal / default |
| --- | --- | --- |
| Q1 | **Path confirmation:** is `POST /call-control/calls` acceptable, or does the BFF prefer a different path? | Keep the `/call-control/*` namespace shared with the other call-control operations. |
| Q2 | **Response shape:** confirm `data.callId` inside the standard `ApiResponse` envelope (§3.2), or relocate the correlation key? | `ApiResponse<{ callId: string }>` — one envelope pattern for every command, `callId` in `data`. |
| Q3 | **Connect event:** does the dialed leg emit `CALL_ANSWERED` when the destination party picks up (as opposed to some other connect signal, or nothing)? | Yes — `CALL_ANSWERED` is the connect event for every leg, inbound or outbound. |
| Q4 | **Never `CALL_INCOMING`:** confirm an agent-initiated leg never emits `CALL_INCOMING`. | Never — the first event for a dialed leg is `CALL_ANSWERED` (§4). |
| Q5 | **Response/event race:** may lifecycle events for the dialed leg arrive before the REST response resolves? | FE assumes yes and is race-safe: events are authoritative; the response `callId` is correlation only (§4). A guaranteed ordering would simplify but is not required. |
| Q6 | **Pre-connect silence:** confirm the dialing/ringing phases emit no event (no new event type proposed). | Silence — the FE shows a local "Calling…" indicator; the leg appears only on `CALL_ANSWERED`. |
| Q7 | **Outbound rejection & failure vocabulary:** which business rejections can the command return (invalid destination, trunk failure, agent state), and which `endReason` values describe post-acceptance failures (`failed`? `no_answer`? `busy`?) | Free-form `msg` for rejections (envelope `"-1"`); `endReason` values are free-form per the lifecycle contract — the FE renders unknown values as a generic ended state. The vocabulary must still be documented. |
| Q8 | **`durationSeconds` window for outbound legs:** the lifecycle contract's Q4 proposes ring start for inbound — an outbound leg has no `CALL_INCOMING` ring. Measured from dial acceptance? | From dial acceptance (command response), through `CALL_ENDED`. Must be documented either way. |
| Q9 | **Command while on a call:** does the adapter reject a make-call when the agent already has a connected leg (vs. treating it as consult/conference)? | Reject with `"-1"` — consult/conference is out of scope this release (Q7 in the actual-calling plan). The FE also blocks the dial client-side. |
| Q10 | **Destination canonical form:** does the adapter require E.164, or does it accept national/extension/service forms as provided? | Adapter normalizes — the FE sends as-provided (§5). If E.164 is required at the wire, that must be documented and the FE's send-side will change at Phase W. |
| Q11 | **`callId` namespace:** confirm dialed legs draw `callId`s from the same namespace/uniqueness rules as inbound legs (unique per call leg per session, lifecycle contract §5.1). | One namespace, same uniqueness rules — the FE keys all legs by `callId` in a single map. |

---

## 10. Change process

- The FE reference implementation (`src/cc/store/api/callControlApi.ts` `makeCall`, `src/cc/utils/dialDestination.ts`) and this document must be updated **together**; the code headers link back here.
- Additive changes (new optional request fields, a richer rejection vocabulary) are backward compatible — the FE's validation layer is table-driven.
- Breaking changes (relocated `callId`, a different confirmation mechanism, new required fields) require a contract version bump and coordinated FE/BE release.
- Questions and sign-off: reply in this document's review thread or open a ticket referencing "Make-Call command contract v0.1".

## 11. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Backend lead | | ☐ Approve / ☐ Approve with changes / ☐ Reject | |
| FE lead | | ☐ Approve | 2026-10-06 (pending BE alignment on Q1–Q11) |
| Product owner | | ☐ Approve | |
