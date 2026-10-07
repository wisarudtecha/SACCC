# 3CX Actual Calling — Development Plan

| Item | Detail |
| --- | --- |
| Status | IN EXECUTION — 2026-10-07. **Phase FE-1 complete**: FE-1.2 (dialpad, dialpad-only per Q6) and FE-1.3 (agent-state selector) executed mock-driven 2026-10-06; FE-1.4 closed 2026-10-06; FE-1.1 executed 2026-10-07 — Answer button on the incoming-call screen pop, wired to the `answerCall` mutation (mock stand-in while the adapter is absent) per the re-decided Q3 (in-app answer), with placeholder GraphQL mappings for all `/call-control/*` commands added ahead of the BFF (`src/cc/store/api/graphql/callControlQueries.ts`). Product decisions 2026-10-07: Q3 in-app answer, Q7 Conference/Consult OUT, Q9 custom screen pop only, QM deferred. Gate 0 (BE adapter, sign-offs) not started; minimal adapter scope defined (inbound/outbound + answer/terminate/make; hold/resume/transfer/agent-state follow-up iteration). |
| Scope | Delivering *actual* 3CX calling (live telephony) on top of the existing mock-driven FE surface, per the agreed FE/BE responsibility split. |
| Inputs | `docs/3CX-Integration-Capability-Matrix.md` (§1, §2, §3, §4, §9, §10, Decision 1–4), `docs/BRD-Contact-Center-Super-Apps-v1.2.md` (§3.1.7, FR-07), `docs/CC-Super-App-Architectural-Artifacts-This-New-Product-Release.md` (§06 Call Center Dashboard), `docs/3CX-FE-Development-Plan-Remaining-Scope.md`, `docs/CALL_INCOMING-Websocket-Event-Contract.md`, `docs/CALL-Lifecycle-Websocket-Event-Contract.md`, `docs/CC-Dashboard-KPI-Contract.md`, code inventory of `src/cc/` dated 2026-10-05 |
| Related testing docs | `docs/CC-Integration-Dev-Test-Guide.md`, `docs/CC-ScreenPop-Softphone-Test-Walkthrough.md`, `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` |

---

## 1. Verdict

The frontend surface for 3CX calling **already exists, contract-first and mock-driven**:

- Screen pop + ANI → customer/case resolution: built and wired (`src/cc/components/incomingCall/*`, `src/cc/utils/ani.ts`).
- Normalized call event model: built (`src/cc/types/incomingCall.ts`, `src/cc/types/callEvents.ts`) with signed-contract candidates in the two websocket contract docs.
- Softphone workspace + telephony toolbar (Hold/Resume, Mute, Transfer, Hang Up): built (`/cc/softphone`, `src/cc/components/softphone/*`); commands are mock-only.
- Call-control endpoints: exist but **pre-adapter by design** (`src/cc/store/api/callControlApi.ts`, 7 mutations, proposed `/call-control/*` paths); placeholder GraphQL mappings were added 2026-10-07 (`graphql/callControlQueries.ts`, registered in `GQL_MAP`) ahead of the BFF operations they await.
- Call ↔ case linkage via Create Case prefill: FE done; persistence blocked on a BE payload field.

Therefore "actual 3CX calling" is **not a green-field FE build — it is an integration and cutover program**: backend adapter + contract sign-offs + FE wiring + QA. The genuine FE gaps that remained in the calling surface (answer control, dialpad/click-to-call, agent-state setter) were all closed under the established mock pattern by 2026-10-07 (Phase FE-1 complete); the remaining work is backend, wiring, and QA.

This is consistent with the docs: BRD §3.1.7 and arch doc §06 both mark the Contact Center component "(next Phase)", and the matrix's Phase 1/Phase 2 FE items are already ahead of that schedule.

## 2. Requirement traceability (docs → current code)

| Requirement (source) | Code status (2026-10-05) |
| --- | --- |
| Screen pop, ANI → customer/case resolution (matrix §4; BRD FR-07 Contact Management) | **Built & wired** — event feed is mock-only until the adapter ships |
| Normalized events, no raw 3CX payloads to FE (matrix Decision 4) | **Built** — 7 event types + guards/parsers; contracts drafted, open questions Q1–Q7 (CALL_INCOMING) / Q1–Q8 (Lifecycle) with BE |
| Telephony toolbar: Hold/Resume, Mute, Transfer, Hang Up (BRD FR-07) | **Built** — mock-driven commands (`window.mockCall`); `callControlApi` dormant |
| Answer control (matrix §1 "Answer / Transfer / Hang Up"; BRD toolbar) | **Built & wired (2026-10-07)** — Answer button on the incoming-call card → `answerCall` mutation (mock stand-in in dev); confirmation via the `CALL_ANSWERED` lifecycle event |
| Click-to-Call / Make Call (matrix §1; BRD FR-07) | **Absent UI** — `useMakeCallMutation` exported but never called; no dialpad |
| Agent state Ready / Not Ready / Break (BRD toolbar) | **Half-built** — `AGENT_STATE_CHANGED` consumed (header pill); no setter UI and no command endpoint |
| Conference / Consult (BRD toolbar) | **Absent** — also absent from the capability matrix; scope decision required (Open Question Q7) |
| Call ↔ case linkage (matrix §4, §5) | **FE done** — `callId`/`ani`/`callTimestamp` prefill params; linkage held client-side pending BE persistence field (remaining-scope G9) |
| Call Center Dashboard (arch doc §06; matrix Ph5) | E1–E4 **done**; E5 realtime drafted, unsigned (separate track — see `docs/3CX-FE-Development-Plan-Remaining-Scope.md`) |
| Recording, QM, live monitoring, AI insights (matrix Ph3/4/6) | **Absent** — all BE/product-gated; tracked in the remaining-scope plan, not this one |
| BE: 3CX adapter, credentials, event normalization, authorization (matrix §2, §9) | **Absent entirely** — the critical path |

## 3. Plan

### Gate 0 — Enabling prerequisites (business/BE; blocks live calling)

Everything in this gate is outside the FE repo. Nothing in Phases W/QA can start before it lands; Phase FE-1 can.

1. **3CX licensing & configuration.** The Call Control API requires an **8SC+ AI license** (matrix §3.2); enable under Admin Console → Integrations → API. Whether the basic 3CX CRM Integration Wizard (native contact pop) is wanted alongside the custom screen pop is settled: **custom-only (Q9, decided 2026-10-07)**.
2. **BE 3CX adapter workstream** (per matrix §2 architecture — adapter isolates all 3CX specifics). **Minimal adapter scope (defined 2026-10-07): inbound/outbound only** — (a) publishing `CALL_INCOMING`; (b) answer; (c) terminate/hang-up; (d) make call; (e) publishing `CALL_ANSWERED` + `CALL_ENDED` lifecycle events. Hold, resume, transfer, and agent-state commands remain FE mock-only until a follow-up backend iteration. Within that scope:
   - REST call-control endpoints confirming (or correcting) the proposed `/call-control/*` paths in `callControlApi.ts`: make, answer, hold, resume, transfer, terminate.
   - A listener on the 3CX Call Control WebSocket that normalizes 3CX events and publishes `CALL_INCOMING` + the six lifecycle events on the existing notifications socket, exactly per the two contract docs (envelope `data.EVENT` + `data.additionalJson`, optionals omitted-not-null, per-agent targeting).
   - Real `endReason` / `durationSeconds` values on `CALL_ENDED`.
   - A case-linkage persistence field on case creation (G9) — field name to be agreed.
   - All 3CX credentials, authentication, authorization, idempotency, retry, and audit stay backend-side (matrix §9 — FE never holds privileged 3CX credentials).
3. **Contract sign-offs** (documents exist; questions open):
   - `CALL_INCOMING` Q1–Q7, Lifecycle Q1–Q8.
   - Call-control path confirmation (restating the `callControlApi` URLs as normative, or issuing corrected ones).
   - Agent-state command contract (new — see FE-1.3).
   - (Dashboard KPI Q1–Q10 and invalidation Q1–Q7 remain tracked under the remaining-scope plan's Phase E.)

### Phase FE-1 — Complete the calling UI (can start now; contract-first + mocks)

Follows the established pattern: contract/proposal first, mock-driven UI behind `VITE_MOCK_API`, dormant REST-shaped endpoints with **no GQL_MAP entries**, all inside the `cc` module.

1. **FE-1.1 — Answer control.** ✅ Done 2026-10-07. Q3 decided — **in-app answer via Call Control API** (re-decided 2026-10-07, superseding the 2026-10-06 context-only decision): the incoming-call card carries a green primary Answer button wired to `useAnswerCallMutation` via `useIncomingCallPopups.answer(callId)`. A resolved command means "answer accepted", never "answered" — the `CALL_ANSWERED` websocket event remains the state source, and the softphone reducer upserts it by callId without needing the ring (no extra plumbing). Mock: the dev stand-in retires the card (a mock `CALL_ANSWERED` has no consumer — softphone mock legs are a separate universe per `mockCallLifecycle.ts`); routing a mock answer into the softphone was assessed and dropped as out of scope. Placeholder GraphQL mappings for all seven `/call-control/*` commands were added in `src/cc/store/api/graphql/callControlQueries.ts` (registered in `GQL_MAP`; operation names pending BFF sign-off), and the four leg commands now send an explicit `body: { callId }` — a bodyless POST mutation hard-fails in GraphQL mode (no REST fallback).
2. **FE-1.2 — Dialpad + click-to-call.** Dialpad on `/cc/softphone` using the already-exported `useMakeCallMutation`; outbound `CALL_*` lifecycle handling for agent-initiated legs. Click-to-call from customer/contact views is a placement decision (Open Question Q6 — dialpad-only keeps the `cms → cc` import isolation intact). *(Status 2026-10-06: contract drafted — `docs/Make-Call-Command-Contract.md`, pending sign-off Q1–Q11; dormant `makeCall` response now carries the leg's `callId`; dialpad implemented mock-driven per FE-1.2 scope, dialpad-only per the Q6 decision.)*
3. **FE-1.3 — Agent-state selector.** Ready / Not Ready / Break per BRD FR-07. First step: draft `docs/Agent-State-Command-Contract.md` (REST command + confirmation via existing `AGENT_STATE_CHANGED`; no endpoint exists even dormant today). Then selector UI on the softphone header, mock-driven. *(Status 2026-10-06: contract drafted, pending sign-off Q1–Q7; dormant `setAgentState` endpoint + header selector implemented mock-driven per FE-1.3 scope.)*
4. **FE-1.4 — Tests & i18n.** Unit tests per the existing cc patterns (`*.test.ts` node suites; jsdom harness only if a DOM test is warranted), i18n keys ×3 catalogs (`en`/`th`/`cn`), full regression gates (`pnpm test`, `npx tsc -b`, `pnpm lint`). Update the dev test guide and walkthrough with the new mock commands. *(Status 2026-10-06: done by accumulation — unit tests and i18n keys were delivered per-item with FE-1.2/FE-1.3 (485 tests green); this close-out updated both test docs with the dial/dialpad and agent-state-selector scenarios and re-ran the gates green.)*

**Explicitly out of FE-1:** no GQL_MAP entries, no real-transport code, no recording/QM/monitoring UI (remaining-scope plan), no Conference/Consult (pending Q7).

### Phase W — Wiring (starts when Gate 0's adapter + path confirmation land)

1. Confirm `/call-control/*` paths AND the placeholder GraphQL operation names / input types in `graphql/callControlQueries.ts` (added 2026-10-07, ahead of the BFF) against the signed-off contract — the BFF serves them or the entries are corrected; unmapped or unserved URLs hard-fail under `VITE_USE_GRAPHQL=true`.
2. Swap `useSoftphone` mock calls for the real `callControlApi` hooks; keep the mock path for dev demos (`VITE_MOCK_API`).
3. Remove the DORMANT banners; BE provisions the `cc.screenpop.view` permission key and the sidebar's `workspace.softphone` i18n key is uncommented.
4. Wire the case-linkage persistence (G9) into `saveCase`'s payload once the BE field exists.

### Phase QA — Cutover

1. Execute `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` (11 scenarios, rollback plan) and **extend it** for lifecycle + call-control: disconnect/reconnect redelivery, per-agent targeting (mock events are self-emitted), the >100-call dedupe cap, real `endReason`/`durationSeconds` values, and each toolbar command against the live adapter.
2. Dev-guide §5 and walkthrough Part 5 list exactly what mock mode cannot cover — those items are the cutover's core scope.
3. Regression gates on every merge: `pnpm test`, `npx tsc -b`, `pnpm lint`.

### Deferred (unchanged, tracked elsewhere)

- Recording UI (matrix Ph3) — `docs/3CX-FE-Development-Plan-Remaining-Scope.md` Phase C.
- QM (matrix Ph4) — product decision required; absent from BRD/arch doc.
- Dashboard realtime E5 — build-ready, gated on invalidation-contract sign-off.
- BRD FR-07 multi-channel surface (video, social, email-to-ticket, ACD) — separate initiative per BRD "(Next Phase)".

## 4. Sequencing summary

```text
FE-1.1–1.4 (now, mock-driven) ──┐
                                ├─► Phase W (wiring) ──► Phase QA (cutover) ──► live 3CX calling
Gate 0: license + BE adapter ───┘        ▲                      │
        + contract sign-offs ────────────┘                      └── future: recording / QM / monitoring
```

FE-1 and Gate 0 run in parallel; W and QA are strictly serial after both.

## 5. Open questions (decisions needed)

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| Q1 | 3CX license procurement status (8SC+ AI for Call Control API) | Business | Gate 0 |
| Q2 | BE adapter owner & timing — the single critical-path blocker | BE management | Gate 0, W |
| Q3 | **DECIDED 2026-10-07 — in-app answer via Call Control API** (re-decision, superseding the 2026-10-06 context-only decision). Executed as FE-1.1. | Decided | — |
| Q4 | Transport for call-control: REST direct vs BFF GraphQL | BE | W.1 (GQL_MAP) |
| Q5 | Agent-state command contract shape (new contract, none exists) | FE drafts → BE signs | FE-1.3 |
| Q6 | **DECIDED — dialpad-only click-to-call** (keeps `cms → cc` isolation). Executed in FE-1.2. | Decided | — |
| Q7 | **DECIDED 2026-10-07 — Conference / Consult OUT of scope** (supersedes the 2026-10-06 "IN scope" note; the BRD toolbar lists them but the capability matrix does not). | Decided | — |
| Q8 | BE field name for persisting call linkage on case creation (G9) | BE | W.4 |
| Q9 | **DECIDED 2026-10-07 — custom screen pop only**; the basic 3CX CRM Integration Wizard is not wanted alongside it. | Decided | — |

## 6. Next steps (on approval)

1. Circulate for Gate 0 ownership (Q1, Q2) — everything else schedules around those.
2. Sign off the four calling contracts (CALL_INCOMING Q1–Q7, Lifecycle Q1–Q8, Agent-State Q1–Q7, Make-Call Q1–Q11), including confirmation of the call-control paths and the placeholder GraphQL operation names in `graphql/callControlQueries.ts`.
3. Phase W wiring when the adapter lands: swap the remaining softphone mocks (hold/resume/transfer, dialpad, agent state) for the real hooks; keep the mock path for dev demos. Answer is already wired.
