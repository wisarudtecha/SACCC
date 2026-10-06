# 3CX Actual Calling — Development Plan

| Item | Detail |
| --- | --- |
| Status | IN EXECUTION (FE-1 underway) — 2026-10-06. FE-1.2 (dialpad, dialpad-only per Q6) and FE-1.3 (agent-state selector) executed mock-driven; FE-1.4 closed 2026-10-06 (tests/i18n delivered per-item; test docs updated). FE-1.1 pending its Q3-decision scope revision. Gate 0 (BE adapter, sign-offs) not started. |
| Scope | Delivering *actual* 3CX calling (live telephony) on top of the existing mock-driven FE surface, per the agreed FE/BE responsibility split. |
| Inputs | `docs/3CX-Integration-Capability-Matrix.md` (§1, §2, §3, §4, §9, §10, Decision 1–4), `docs/BRD-Contact-Center-Super-Apps-v1.2.md` (§3.1.7, FR-07), `docs/CC-Super-App-Architectural-Artifacts-This-New-Product-Release.md` (§06 Call Center Dashboard), `docs/3CX-FE-Development-Plan-Remaining-Scope.md`, `docs/CALL_INCOMING-Websocket-Event-Contract.md`, `docs/CALL-Lifecycle-Websocket-Event-Contract.md`, `docs/CC-Dashboard-KPI-Contract.md`, code inventory of `src/cc/` dated 2026-10-05 |
| Related testing docs | `docs/CC-Integration-Dev-Test-Guide.md`, `docs/CC-ScreenPop-Softphone-Test-Walkthrough.md`, `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` |

---

## 1. Verdict

The frontend surface for 3CX calling **already exists, contract-first and mock-driven**:

- Screen pop + ANI → customer/case resolution: built and wired (`src/cc/components/incomingCall/*`, `src/cc/utils/ani.ts`).
- Normalized call event model: built (`src/cc/types/incomingCall.ts`, `src/cc/types/callEvents.ts`) with signed-contract candidates in the two websocket contract docs.
- Softphone workspace + telephony toolbar (Hold/Resume, Mute, Transfer, Hang Up): built (`/cc/softphone`, `src/cc/components/softphone/*`); commands are mock-only.
- Call-control endpoints: exist but **dormant by design** (`src/cc/store/api/callControlApi.ts`, 6 mutations, proposed `/call-control/*` paths, deliberately **no GQL_MAP entries**).
- Call ↔ case linkage via Create Case prefill: FE done; persistence blocked on a BE payload field.

Therefore "actual 3CX calling" is **not a green-field FE build — it is an integration and cutover program**: backend adapter + contract sign-offs + FE wiring + QA. There are a few genuine FE gaps left in the calling surface itself (answer control, dialpad/click-to-call, agent-state setter), which can be built now under the established mock pattern while the backend workstream proceeds.

This is consistent with the docs: BRD §3.1.7 and arch doc §06 both mark the Contact Center component "(next Phase)", and the matrix's Phase 1/Phase 2 FE items are already ahead of that schedule.

## 2. Requirement traceability (docs → current code)

| Requirement (source) | Code status (2026-10-05) |
| --- | --- |
| Screen pop, ANI → customer/case resolution (matrix §4; BRD FR-07 Contact Management) | **Built & wired** — event feed is mock-only until the adapter ships |
| Normalized events, no raw 3CX payloads to FE (matrix Decision 4) | **Built** — 7 event types + guards/parsers; contracts drafted, open questions Q1–Q7 (CALL_INCOMING) / Q1–Q8 (Lifecycle) with BE |
| Telephony toolbar: Hold/Resume, Mute, Transfer, Hang Up (BRD FR-07) | **Built** — mock-driven commands (`window.mockCall`); `callControlApi` dormant |
| Answer control (matrix §1 "Answer / Transfer / Hang Up"; BRD toolbar) | **Absent** — no answer action anywhere; screen pop owns ringing only |
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

1. **3CX licensing & configuration.** The Call Control API requires an **8SC+ AI license** (matrix §3.2); enable under Admin Console → Integrations → API. Also decide whether the basic 3CX CRM Integration Wizard (native contact pop) is wanted alongside the custom screen pop, or custom-only.
2. **BE 3CX adapter workstream** (per matrix §2 architecture — adapter isolates all 3CX specifics):
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

1. **FE-1.1 — Answer control.** Add an Answer action to the screen-pop card and/or softphone, wired to the dormant `answer` mutation. UX decision needed first (Open Question Q3: in-app answer via Call Control API vs answer on handset/3CX Web Client with the app as context only). Mock: extend `mockCallLifecycle.ts` so answering a screen-pop leg transitions it into the softphone's active call.
2. **FE-1.2 — Dialpad + click-to-call.** Dialpad on `/cc/softphone` using the already-exported `useMakeCallMutation`; outbound `CALL_*` lifecycle handling for agent-initiated legs. Click-to-call from customer/contact views is a placement decision (Open Question Q6 — dialpad-only keeps the `cms → cc` import isolation intact). *(Status 2026-10-06: contract drafted — `docs/Make-Call-Command-Contract.md`, pending sign-off Q1–Q11; dormant `makeCall` response now carries the leg's `callId`; dialpad implemented mock-driven per FE-1.2 scope, dialpad-only per the Q6 decision.)*
3. **FE-1.3 — Agent-state selector.** Ready / Not Ready / Break per BRD FR-07. First step: draft `docs/Agent-State-Command-Contract.md` (REST command + confirmation via existing `AGENT_STATE_CHANGED`; no endpoint exists even dormant today). Then selector UI on the softphone header, mock-driven. *(Status 2026-10-06: contract drafted, pending sign-off Q1–Q7; dormant `setAgentState` endpoint + header selector implemented mock-driven per FE-1.3 scope.)*
4. **FE-1.4 — Tests & i18n.** Unit tests per the existing cc patterns (`*.test.ts` node suites; jsdom harness only if a DOM test is warranted), i18n keys ×3 catalogs (`en`/`th`/`cn`), full regression gates (`pnpm test`, `npx tsc -b`, `pnpm lint`). Update the dev test guide and walkthrough with the new mock commands. *(Status 2026-10-06: done by accumulation — unit tests and i18n keys were delivered per-item with FE-1.2/FE-1.3 (485 tests green); this close-out updated both test docs with the dial/dialpad and agent-state-selector scenarios and re-ran the gates green.)*

**Explicitly out of FE-1:** no GQL_MAP entries, no real-transport code, no recording/QM/monitoring UI (remaining-scope plan), no Conference/Consult (pending Q7).

### Phase W — Wiring (starts when Gate 0's adapter + path confirmation land)

1. Confirm `/call-control/*` paths against the signed-off contract; add GQL_MAP entries **only if** the BFF ships GraphQL equivalents (unmapped URLs hard-fail under `VITE_USE_GRAPHQL=true` — never speculative).
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
| Q3 | Answer UX: in-app answer via Call Control API, or answer on handset/3CX client with app as context only? | Product + BE | FE-1.1 design |
| Q4 | Transport for call-control: REST direct vs BFF GraphQL | BE | W.1 (GQL_MAP) |
| Q5 | Agent-state command contract shape (new contract, none exists) | FE drafts → BE signs | FE-1.3 |
| Q6 | Click-to-call placement: dialpad-only (keeps `cms → cc` isolation) vs buttons inside cms customer pages (sanctioned import-rule exception) | Product + FE lead | FE-1.2 |
| Q7 | Conference / Consult: in scope this release? (BRD toolbar lists them; the capability matrix does not) | Product | FE-1 scope |
| Q8 | BE field name for persisting call linkage on case creation (G9) | BE | W.4 |
| Q9 | Is the basic 3CX CRM Integration Wizard wanted alongside the custom screen pop? | Product | Gate 0.1 |

## 6. Next steps (on approval; none executed yet)

1. Circulate this draft for Gate 0 ownership (Q1, Q2) — everything else schedules around those.
2. Draft `docs/Agent-State-Command-Contract.md` (FE-1.3's first step; the only new contract FE-1 needs).
3. Begin FE-1.1 after the Q3 answer-UX decision.
