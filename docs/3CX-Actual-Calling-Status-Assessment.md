# 3CX Actual Calling — Status Assessment (code-verified)

| Item | Detail |
| --- | --- |
| Status | COMPLETE — read-only T0 assessment, all claims verified against the current tree |
| Date | 2026-10-06 |
| Scope | Completion status of the actual-calling initiative vs `docs/3CX-Actual-Calling-Development-Plan.md` §3 (Gate 0, Phase FE-1, Phase W, Phase QA); every remaining component (FE / BE / product-decision / procurement) with owner and blocker; the ordered path to live 3CX calls |
| Method | Every "done/absent" claim re-checked in code (grep/read), not taken from docs or memory. No source files modified. |
| Baseline | `pnpm test` 485/485 green (42 files); `npx tsc -b` exit 0 — both re-run on the current tree 2026-10-06 |

---

## 1. Verdict table — §3 Phase FE-1

| Item | Verdict | Code-verified evidence |
| --- | --- | --- |
| **FE-1.1** Answer control | **Pending-revision** (not blocked on code) | `answerCall` mutation exists dormant (`src/cc/store/api/callControlApi.ts:104`) and `useAnswerCallMutation` is exported (`:157`) — repo-wide grep confirms **zero consumers**; no answer action in the screen pop or softphone. Plan doc `:65` still says "UX decision needed first (Open Question Q3…)" — but Q3 was decided 2026-10-06 (answer on handset/3CX client, app context-only). The doc is stale vs. the decision. Note: the shrunk scope — "reflect answered state from lifecycle events" — is **already implemented** by the `CALL_ANSWERED` handling in `softphoneCallState.ts:87`, so the revised FE-1.1 is likely a close-out/verification task, not new UI. |
| **FE-1.2** Dialpad + click-to-call | **Done, mock-driven** | `src/cc/components/softphone/Dialpad.tsx` (12-key pad + callId-correlated status line), `src/cc/utils/dialDestination.ts` + 14 tests, `dialpad_*` i18n keys in all 3 catalogs (`en.json:371–382`, `th`/`cn` confirmed). `makeCall` response typed `ApiResponse<MakeCallResponse>` with the leg's `callId` (`callControlApi.ts:96`). Contract `docs/Make-Call-Command-Contract.md` drafted, **Q1–Q11 open**. Q6 decision (dialpad-only) is recorded in the plan doc's FE-1.2 status note (`:66`). |
| **FE-1.3** Agent-state selector | **Done, mock-driven** | `src/cc/components/softphone/AgentStateSelector.tsx` (dropdown on softphone header), `src/cc/types/agentStateCommand.ts` + 15 tests, `state_ready` / `agent_state_command_unavailable` keys ×3 catalogs (`en.json:362,370`). Dormant `setAgentState` mutation (`callControlApi.ts:140`). Contract `docs/Agent-State-Command-Contract.md` drafted, **Q1–Q7 open**. |
| **FE-1.4** Tests & i18n & docs | **Done-by-accumulation, closed 2026-10-06** | Tests/i18n were delivered per-item with FE-1.2/1.3; the close-out updated both test docs — `CC-Integration-Dev-Test-Guide.md` header ("Current — … incl. the FE-1.2 dialpad and FE-1.3 agent-state selector", dated 2026-10-06) and `CC-ScreenPop-Softphone-Test-Walkthrough.md` (same date, ~18-min script) — plus the plan-doc cross-link. |
| Dormant call-control API | **Confirmed as claimed** | Exactly **7 mutations** (`makeCall`, `answerCall`, `holdCall`, `resumeCall`, `transferCall`, `hangUpCall`, `setAgentState`) on `/call-control/*` paths. **No GQL_MAP entries**, three ways verified: `GQL_MAP` composition in `src/core/utils/gqlMapper.ts:59–111` contains no call-control/cc spreads; no `graphql/callControlQueries.ts` exists anywhere; repo-wide grep for `call-control` hits only `cc` comments + `changelog.json`. Dormant banner documents the wiring preconditions (`callControlApi.ts:50–55`). |
| Phase W wiring | **Not started (as claimed)** | `useSoftphone.ts:107–124` — every control delegates to `mockControls`; `controlsEnabled = mockControls !== null`. No real-transport code, DORMANT banners intact. |
| Phase QA cutover | **Not started (as claimed)** | `CALL_INCOMING-Mock-Cutover-Checklist.md` exists but the plan's Phase QA.1 extension items (lifecycle + call-control scenarios) are not in it. |

## 2. Remaining components, by owner

### A. FE-repo (this repo) — all decision-unblocked, schedulable today

| # | Component | Blocked by | Can start today |
| --- | --- | --- | --- |
| A1 | Plan-doc Q3/Q7 revision — record the 2026-10-06 product decisions (Q3: context-only answer → FE-1.1 shrinks; Q7: Conference/Consult IN scope, currently "explicitly out of FE-1" at plan `:70`) | Nothing — deliberately deferred as scope expansion | **Yes** |
| A2 | FE-1.1 close-out after A1 — verify/certify that lifecycle events already cover the shrunk scope; retire or keep `answerCall` dormant accordingly | A1 | Yes (after A1) |
| A3 | Conference/Consult (Q7) — new contract + mock + possibly new dormant mutations; needs sequencing within the revised plan | A1 (scope/scheduling decision) | Contract drafting yes (mock pattern needs no backend) |
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
| Contract sign-offs | Four calling-critical contracts: CALL_INCOMING (Q1–Q7), Lifecycle (Q1–Q8), Agent-State (Q1–Q7), Make-Call (Q1–Q11) + path confirmation. KPI (Q1–Q10) and invalidation (Q1–Q7) contracts also exist but gate the **dashboard track** (remaining-scope plan Phase E), not live calling itself |

### C. Product decisions

- **Decided but undocumented** (decided 2026-10-06, plan doc not yet revised): Q3 (answer UX → context-only), Q7 (Conference/Consult IN scope). Q6 (dialpad-only) *is* documented in the FE-1.2 status note.
- **Genuinely open**: Q9 (basic 3CX CRM Integration Wizard alongside the custom screen pop — gates Gate 0.1).

### D. Procurement / business

- **Q1** — 3CX license (8SC+ AI for the Call Control API); blocks Gate 0.
- **Q2** — BE adapter owner & timing; **the single critical-path blocker** (plan §5).

## 3. Path to live calls (ordered, dependency-aware)

```text
                    ┌─ FE-repo track (parallel, unblocked): A1 plan revision → A2 FE-1.1 close-out
                    │  → A3 Conference/Consult contract+mock
                    │
Gate 0.1  Q1 license procurement (procurement)  ─┐
Gate 0.2  Q2 BE adapter owner & timing assigned │ ├─► adapter BUILT ─► Phase W (A4) ─► Phase QA (A5) ─► LIVE 3CX CALLS
Gate 0.3  4 contract sign-offs + path confirm   ─┘         ▲                  │
        (sign-offs ∥ adapter build; sign-offs unblock W.1) └── regression gates per merge
```

1. **Gate 0** (all outside FE repo): license (Q1) ∥ BE adapter assignment + build (Q2 — critical path) ∥ contract sign-offs (docs exist; 32 calling-contract questions + path confirmation).
2. **FE-repo track runs in parallel** the whole time (A1→A2→A3 need no Gate 0 input).
3. **Phase W** starts only when the adapter + confirmed paths land: wire hooks, GQL_MAP iff BFF ships GraphQL (Q4), G9 field into `saveCase` (Q8), banners/permission/sidebar.
4. **Phase QA** extends and executes the cutover checklist against the live adapter; scope = exactly what dev-guide §5 / walkthrough Part 5 say mock mode cannot cover.
5. **Live.**

**Critical path: Q2 → adapter build → Phase W → Phase QA → live.** Everything else (Q1, sign-offs, all FE-repo items) is parallel or short-horizon.

## 4. Baseline re-confirmation (current tree, 2026-10-06)

- `pnpm test`: **485/485 passed, 42 test files** — green.
- `npx tsc -b`: **exit 0, no errors** — clean.

---

## Bottom line

Phase FE-1 is effectively complete except FE-1.1, which is not a code gap — the Q3 product decision shrank it to a close-out of behavior the lifecycle reducer already implements (`softphoneCallState.ts:87`), and the plan doc just hasn't been revised to say so. Every remaining blocker to live calls is non-FE: license procurement (Q1), the BE adapter (Q2 — critical path), and ~32 open questions across the four calling contracts. The FE surface is contract-first, mock-driven, dormant-endpoint-ready — exactly where the plan intended it to be at Gate 0.
