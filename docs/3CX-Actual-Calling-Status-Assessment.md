# 3CX Actual Calling — Status Assessment (code-verified)

| Item | Detail |
| --- | --- |
| Status | UPDATED 2026-10-07 — originally a read-only T0 assessment (2026-10-06, all claims code-verified); refreshed after the 2026-10-07 product decisions and the FE-1.1 implementation. |
| Date | 2026-10-07 (original assessment 2026-10-06) |
| Scope | Completion status of the actual-calling initiative vs `docs/3CX-Actual-Calling-Development-Plan.md` §3 (Gate 0, Phase FE-1, Phase W, Phase QA); every remaining component (FE / BE / product-decision / procurement) with owner and blocker; the ordered path to live 3CX calls |
| Method | Every "done/absent" claim re-checked in code (grep/read), not taken from docs or memory. No source files modified. |
| Baseline | `pnpm test` 485/485 green (42 files); `npx tsc -b` exit 0 — both re-run on the current tree 2026-10-06 |

---

## 1. Verdict table — §3 Phase FE-1

| Item | Verdict | Code-verified evidence |
| --- | --- | --- |
| **FE-1.1** Answer control | **Done — implemented 2026-10-07** | Q3 re-decided 2026-10-07: **in-app answer via Call Control API** (supersedes the 2026-10-06 context-only decision the original assessment recorded). `IncomingCallCard.tsx` renders a green primary Answer button; `useIncomingCallPopups.ts` exposes `answer(callId)` wired to `useAnswerCallMutation` (mock stand-in dismisses the card while the adapter is absent); `IncomingCallScreenPop.tsx` plumbs `onAnswer`. Confirmation remains the `CALL_ANSWERED` event — `softphoneCallState.ts:87` upserts by callId without needing the ring. Placeholder GraphQL mappings for all 7 `/call-control/*` commands added (`src/cc/store/api/graphql/callControlQueries.ts`, registered in `GQL_MAP`); the 4 leg commands now send `body: { callId }` because a bodyless POST mutation hard-fails in GraphQL mode. |
| **FE-1.2** Dialpad + click-to-call | **Done, mock-driven** | `src/cc/components/softphone/Dialpad.tsx` (12-key pad + callId-correlated status line), `src/cc/utils/dialDestination.ts` + 14 tests, `dialpad_*` i18n keys in all 3 catalogs (`en.json:371–382`, `th`/`cn` confirmed). `makeCall` response typed `ApiResponse<MakeCallResponse>` with the leg's `callId` (`callControlApi.ts:96`). Contract `docs/Make-Call-Command-Contract.md` drafted, **Q1–Q11 open**. Q6 decision (dialpad-only) is recorded in the plan doc's FE-1.2 status note (`:66`). |
| **FE-1.3** Agent-state selector | **Done, mock-driven** | `src/cc/components/softphone/AgentStateSelector.tsx` (dropdown on softphone header), `src/cc/types/agentStateCommand.ts` + 15 tests, `state_ready` / `agent_state_command_unavailable` keys ×3 catalogs (`en.json:362,370`). Dormant `setAgentState` mutation (`callControlApi.ts:140`). Contract `docs/Agent-State-Command-Contract.md` drafted, **Q1–Q7 open**. |
| **FE-1.4** Tests & i18n & docs | **Done-by-accumulation, closed 2026-10-06** | Tests/i18n were delivered per-item with FE-1.2/1.3; the close-out updated both test docs — `CC-Integration-Dev-Test-Guide.md` header ("Current — … incl. the FE-1.2 dialpad and FE-1.3 agent-state selector", dated 2026-10-06) and `CC-ScreenPop-Softphone-Test-Walkthrough.md` (same date, ~18-min script) — plus the plan-doc cross-link. |
| Dormant call-control API | **Superseded 2026-10-07: pre-adapter, no longer fully dormant** | Still exactly **7 mutations** (`makeCall`, `answerCall`, `holdCall`, `resumeCall`, `transferCall`, `hangUpCall`, `setAgentState`) on `/call-control/*` paths. **GQL placeholder mappings now exist** (`graphql/callControlQueries.ts`, spread into `GQL_MAP` in `gqlMapper.ts`) — operation names/input types/`CallControl` root are FE proposals pending BFF sign-off; calls still fail at the BFF in GraphQL-enabled envs until it ships them. `answerCall` has a consumer (screen-pop Answer button); the other 6 remain mock-driven. Leg commands now send `body: { callId }` (bodyless POST mutations hard-fail in GraphQL mode). Banner in `callControlApi.ts` rewritten accordingly. |
| Phase W wiring | **Not started (as claimed)** | `useSoftphone.ts:107–124` — every control delegates to `mockControls`; `controlsEnabled = mockControls !== null`. No real-transport code, DORMANT banners intact. |
| Phase QA cutover | **Not started (as claimed)** | `CALL_INCOMING-Mock-Cutover-Checklist.md` exists but the plan's Phase QA.1 extension items (lifecycle + call-control scenarios) are not in it. |

## 2. Remaining components, by owner

### A. FE-repo (this repo) — all decision-unblocked, schedulable today

| # | Component | Blocked by | Can start today |
| --- | --- | --- | --- |
| A1 | Plan-doc Q3/Q7 revision — record the 2026-10-07 product decisions (Q3: in-app answer → FE-1.1 executed; Q7: Conference/Consult OUT) | Nothing | **Done 2026-10-07** |
| A2 | FE-1.1 — in-app Answer control on the screen pop (supersedes the original "close-out/verification" framing after the Q3 re-decision) | A1 | **Done 2026-10-07** |
| A3 | Conference/Consult (Q7) — ~~new contract + mock~~ | — | **Cancelled — Q7 decided OUT of scope 2026-10-07** |
| A4 | Phase W wiring — swap `useSoftphone` mocks for real hooks, GQL_MAP entries only if BFF ships GraphQL (Q4), remove DORMANT banners, wire G9 into `saveCase`, permission key `cc.screenpop.view` + uncomment `workspace.softphone` sidebar key | **Gate 0** (B) | No |
| A5 | Phase QA — extend cutover checklist for lifecycle + call-control scenarios; execute against live adapter | A4 | No |

### B. BE adapter — the critical path, entirely outside this repo

| Component | Detail |
| --- | --- |
| REST call-control endpoints | Confirm or correct the proposed `/call-control/*` paths in `callControlApi.ts` |
| 3CX Call Control WebSocket listener | Normalize 3CX events → publish `CALL_INCOMING` + six lifecycle events per the two contract docs |
| Real `endReason` / `durationSeconds` | On `CALL_ENDED` (currently mock-fabricated) |
| G9 persistence field | Case-linkage field on case creation; field name = open question Q8 |
| Security/ops | Credentials, authz, idempotency, retry, audit — all backend-side per capability-matrix §9 |
| Contract sign-offs | Four calling-critical contracts: CALL_INCOMING (Q1–Q7), Lifecycle (Q1–Q8), Agent-State (Q1–Q7), Make-Call (Q1–Q11) + path confirmation **including the placeholder GraphQL operation names / input types in `graphql/callControlQueries.ts` (added 2026-10-07)**. KPI (Q1–Q10) and invalidation (Q1–Q7) contracts also exist but gate the **dashboard track** (remaining-scope plan Phase E), not live calling itself |

### C. Product decisions

- **Decided & documented 2026-10-07** (plan doc revised same day): Q3 answer UX → **in-app answer via Call Control API** (a re-decision superseding 2026-10-06's context-only decision); Q7 Conference/Consult → **OUT of scope** (superseding 2026-10-06's "IN scope"); Q6 → dialpad-only (unchanged); Q9 → **custom screen pop only** (no 3CX CRM Integration Wizard). **QM → deferred** (remaining-scope plan Phase D).
- **Minimal adapter scope defined 2026-10-07**: inbound/outbound only — `CALL_INCOMING` publishing, answer, terminate, make call, `CALL_ANSWERED`/`CALL_ENDED` lifecycle events. Hold/resume/transfer/agent-state commands stay FE mock-only until a follow-up backend iteration.
- **Genuinely open**: Q1 (3CX license procurement) and Q2 (BE adapter owner & timing — the critical path) with business/BE management, plus the contract sign-off questions above (incl. Q4 transport, Q5 agent-state shape, Q8 linkage field).

### D. Procurement / business

- **Q1** — 3CX license (8SC+ AI for the Call Control API); blocks Gate 0.
- **Q2** — BE adapter owner & timing; **the single critical-path blocker** (plan §5).

## 3. Path to live calls (ordered, dependency-aware)

```text
                    ┌─ FE-repo track: COMPLETE 2026-10-07 (A1 plan revision done, A2 FE-1.1
                    │  implemented as in-app answer, A3 cancelled per Q7)
                    │
Gate 0.1  Q1 license procurement (procurement)  ─┐
Gate 0.2  Q2 BE adapter owner & timing assigned │ ├─► adapter BUILT ─► Phase W (A4) ─► Phase QA (A5) ─► LIVE 3CX CALLS
Gate 0.3  4 contract sign-offs + path confirm   ─┘         ▲                  │
        (sign-offs ∥ adapter build; sign-offs unblock W.1) └── regression gates per merge
```

1. **Gate 0** (all outside FE repo): license (Q1) ∥ BE adapter assignment + build (Q2 — critical path) ∥ contract sign-offs (docs exist; 32 calling-contract questions + path/GraphQL-operation-name confirmation).
2. **FE-repo track** completed 2026-10-07: A1 done, A2 implemented (in-app answer), A3 cancelled (Q7 OUT).
3. **Phase W** starts only when the adapter + confirmed paths land: wire hooks, GQL_MAP iff BFF ships GraphQL (Q4), G9 field into `saveCase` (Q8), banners/permission/sidebar.
4. **Phase QA** extends and executes the cutover checklist against the live adapter; scope = exactly what dev-guide §5 / walkthrough Part 5 say mock mode cannot cover.
5. **Live.**

**Critical path: Q2 → adapter build → Phase W → Phase QA → live.** Everything else (Q1, sign-offs, all FE-repo items) is parallel or short-horizon.

## 4. Baseline re-confirmation (current tree, 2026-10-06)

- `pnpm test`: **485/485 passed, 42 test files** — green.
- `npx tsc -b`: **exit 0, no errors** — clean.

---

## Bottom line

Phase FE-1 is complete: FE-1.1 was implemented 2026-10-07 as in-app answer per the re-decided Q3 (Answer button on the screen pop → `answerCall`, mock stand-in in dev), and placeholder GraphQL mappings for all seven call-control commands are in place ahead of the BFF (`graphql/callControlQueries.ts`). Conference/Consult is OUT and QM deferred per the 2026-10-07 product decisions, and the minimal adapter scope (inbound/outbound + answer/terminate/make) is defined. Every remaining blocker to live calls is non-FE: license procurement (Q1), the BE adapter (Q2 — critical path), and the open contract sign-offs. The FE surface is contract-first, mock-driven, pre-adapter-ready — exactly where the plan intends it to be at Gate 0.
