# Integration Test Procedures — SLA Breach Escalation (FE ↔ BE)

**Scope:** Verify the frontend SLA breach escalation MVP works end-to-end against the real backend (no mocks). Companion to `docs/FE-BE-Dependency-Request-SLA-Breach-Escalation.md`.
**FE build under test:** branch containing `src/cms/types/escalation.ts` + `src/cms/components/escalation/*` (2026-10-01).
**Environments:** SIT. Browsers: Chrome + one WebKit/Firefox pass for the notification flows.

---

## 1. Pre-Integration Checklist (one-time)

| # | Item | How to verify |
|---|---|---|
| P1 | `VITE_MOCK_API` is **unset / not `"true"`** in the SIT env file | `grep VITE_MOCK_API .env.sit` — mock stubs must be inactive |
| P2 | BE endpoints 3.2–3.5 of the dependency request are deployed | `curl` each: `GET /cases/{id}/escalations`, `GET /organizations/{orgId}/escalations?status=open`, `GET /organizations/{orgId}/escalation-rules` (200 or 404-with-contract), `POST .../ack` (401/403 without auth) |
| P3 | GraphQL envs: `GQL_MAP` entries registered for the four REST urls and returning the contract shape | Run one GET per entity in a GraphQL env; compare against contract JSON |
| P4 | Permission `sla.escalation.ack` exists in the catalog | Permission Manager UI lists it; can be granted to a test role |
| P5 | Breach scheduler is running in SIT and can be time-controlled (short SLA windows) | BE confirms a case with a 5-minute SLA breaches ~5 minutes after creation |
| P6 | Test users provisioned: **U-SUP** (Supervisor role, has `sla.escalation.ack`), **U-AGENT** (no ack permission), **U-ADMIN** (org admin) | Login works for all three |

## 2. Test Data Requirements

| Data | Setup |
|---|---|
| TD-1 | Case type whose SLA resolution window can be set short (e.g. 5–10 min) so breach happens in-session |
| TD-2 | Case type with a long SLA (≥ 24h) for "normal" state checks |
| TD-3 | Escalation rule enabled for TD-1's policy: threshold 80%, recipient Supervisor |
| TD-4 | Escalation rule **disabled** for one policy (negative control) |

---

## 3. Test Cases

### A. SLA visual states (countdown, case list, kanban, widget)

| ID | Steps | Expected |
|---|---|---|
| A1 | Create a TD-1 case; open Case Assignment list immediately | SLA badge absent or neutral (< 80% elapsed); no warning badge |
| A2 | Wait until 80% of the SLA window elapsed; refresh | Amber outline "Time remaining" badge on the case row (assignment list + kanban card) |
| A3 | Wait past 100%; refresh | Red pulsing "Overdue by …" badge on the same surfaces |
| A4 | Open the case's SOP step timeline (`ProgressStepPreview` / officer timeline) and an `inventoryViewRequest` using the same case | Legacy env-based thresholds (2h/1h) still govern these surfaces — unchanged behavior |
| A5 | Create a TD-2 (long SLA) case | No warning badge appears within the session |
| A6 | SLA Monitor widget on the dashboard | Warning/Breach figures reflect the open-escalation list (A2/A3 counted) — not the old static placeholders |
| A7 | Boundary check with BE-controlled clock: case exactly at 80% | Warning shows at exactly the configured threshold (off-by-one minute is a BE scheduler finding, not FE) |

### B. Escalation notifications (websocket)

| ID | Steps | Expected |
|---|---|---|
| B1 | Login as **U-SUP**; create TD-1 case (rule TD-3); wait for 80% | Exactly one notification, "SLA Escalation" type, **amber gradient** badge, message "{case} is approaching its SLA target" (or th/cn equivalent) |
| B2 | Wait for 100% | Exactly one more notification, **red pulsing gradient** badge, "has breached its SLA target" |
| B3 | Click either notification | Deep-links to `/case/{caseId}` (Case Detail View opens for the right case); notification marked read |
| B4 | Repeat B1 with the TD-4 (disabled rule) policy | No notifications arrive |
| B5 | Duplicate delivery: force BE to re-emit the same event (or replay via BE tooling) | No second notification — dedupe by eventId |
| B6 | Open a **second browser tab** logged in as U-SUP before breach | Each tab alerts at most once per (caseId, level, type); no alert storm |
| B7 | Notification preferences: disable popups / sound | No popup/sound, but the dropdown still lists the escalation and the badge count increments |
| B8 | Filter dropdown by type | "SLA Escalation" appears in the type filter and filters correctly |
| B9 | Recipient scope: login as a user **not** in the target role | No escalation notification for that user |

### C. Reconnect / offline resilience

| ID | Steps | Expected |
|---|---|---|
| C1 | Login U-SUP, block the websocket (devtools offline or BE socket kill), breach TD-1 during the outage, then restore | On reconnect the missed warning+breach notifications appear exactly once (open-escalation refetch replay), with correct occurredAt timestamps |
| C2 | Reconnect when nothing was missed | No duplicate notifications for already-seen events |
| C3 | Socket down at login (BE socket service stopped) | Bell shows disconnected (red dot — pre-existing indicator); no broken screen; notifications arrive after service restore |

### D. Case timeline + Acknowledge

| ID | Steps | Expected |
|---|---|---|
| D1 | Open the breached case (B2) → Case History preview → Activity tab | "SLA Escalations (2)" section above comments: amber "SLA warning — notified Supervisor" entry and red "SLA breached — notified Supervisor" entry, each with occurred timestamp and SLA due time |
| D2 | Case with no escalations | No escalation section; activity tab renders exactly as before |
| D3 | As **U-SUP**: click **Acknowledge** on the open breach entry | Button shows in-flight state, then entry updates to "acknowledged by {user} at {time}"; button disappears; section count unchanged |
| D4 | Reload the case | Acknowledged state persists (read back from BE, not session state) |
| D5 | As **U-AGENT** (no `sla.escalation.ack`) | Entries are visible but **no** Acknowledge button; direct `POST .../ack` via API tool returns 403 |
| D6 | Audit trail | BE audit record exists for both the escalation and the acknowledgement (who, when) — verify with BE |
| D7 | SLA Monitor widget after D3 | Open-breach count decreases accordingly |

### E. Escalation Rules settings (Org Settings → Escalation Rules)

| ID | Steps | Expected |
|---|---|---|
| E1 | First visit (no stored record — 404 path) | Form shows schema defaults: Response SLA + Resolution SLA, both disabled, 80%, Supervisor — no error state |
| E2 | Enable Resolution SLA, set threshold 70, role Supervisor → Save | Success toast; reload shows persisted values (`updatedAt`/`updatedBy` set) |
| E3 | Threshold validation: type 0, 100, 150, clear the field | On blur: clamps to 1–99; empty reverts to the saved value; never crashes, never NaN |
| E4 | Disable the rule → Save → repeat B1 | No warning/notification for new cases under that policy |
| E5 | Threshold change applies to **new** breaches only (per contract) — create a fresh case after E2 | New case warns at 70%, not 80% |
| E6 | Simulate BE failure on PATCH (BE returns 500 / stop service) | Persistent yellow "Not saved to the server" banner; edits retained; banner dismissible |
| E7 | GraphQL env (`VITE_USE_GRAPHQL="true"`) | GET/PATCH work identically (P3 registered); failure degrades to defaults + banner, never a crash |
| E8 | Rapid double-click Save | One PATCH in flight; inputs frozen during save |

### F. i18n (en / th / cn)

| ID | Steps | Expected |
|---|---|---|
| F1 | Switch language to Thai: warning+breach a case | Notification body, timeline entries ("คำเตือน SLA"/"เกิน SLA", "แจ้งเตือน {role}", "รับทราบ"), settings section ("กฎการยกระดับเคส") all Thai — no raw keys like `sla.breached` visible |
| F2 | Switch to Chinese | Same coverage in Chinese ("SLA 预警"/"SLA 超时", "确认") |
| F3 | Switch back to English mid-session | New notifications after the switch render in English (earlier ones keep their event-time language — accepted behavior) |

### G. Error / empty / degraded states

| ID | Steps | Expected |
|---|---|---|
| G1 | `GET /cases/{id}/escalations` returns 500 | Activity tab renders without the escalation section — no broken panel |
| G2 | Malformed escalation websocket payload (missing `eventId`/`slaDueAt`) | Silently ignored (`isSlaEscalationEvent` guard); no console crash, no phantom notification |
| G3 | Case with `caseSla = null`/0 | Countdown badges render nothing (no false breach) |
| G4 | Slow network (throttle 3G) on settings page | Loading skeleton shows, then form; no layout jump |

### H. Regression (existing surfaces)

| ID | Steps | Expected |
|---|---|---|
| H1 | Case Assignment list + kanban: badges now use the 80% rule instead of `VITE_CASE_ASSIGNMENT_WARING_SLA`/`ALERT_SLA` (2h/1h) | **Intentional change (CAD decision 4)** — the old red last-hour outline tier no longer appears on these two surfaces; confirm with Product this is accepted |
| H2 | SOP step countdowns (`ProgressStepPreview`, officer timeline), `inventoryViewRequest` | Unchanged — they use the legacy env thresholds (no `warningThresholdPct` passed) |
| H3 | Case create/edit/close flows, dispatch, notifications of other types (CASE-CREATE etc.) | Unchanged |
| H4 | Full unit suite + build in CI | `pnpm test` 285+ passing; `pnpm build` green |

---

## 4. Sign-off Matrix

| Area | Owner | Result | Date |
|---|---|---|---|
| A. Visual states | QA | ☐ | |
| B. Notifications | QA | ☐ | |
| C. Reconnect resilience | QA + BE | ☐ | |
| D. Timeline + Ack | QA | ☐ | |
| E. Rules settings | QA | ☐ | |
| F. i18n | QA | ☐ | |
| G. Degraded states | QA | ☐ | |
| H. Regression | QA + FE | ☐ | |
| Scheduler accuracy (80%/100% timing) | BE | ☐ | |
| Audit-trail correctness | BE | ☐ | |

**Known accepted limitations (documented, not bugs):** SLA Monitor widget counts refresh on mount/navigation only (live refresh arrives with the real query hook); CaseHistory preview tabs remount on parent render (harmless with the stub, scheduled for hoisting when the real RTK query lands); escalation notification copy is frozen at event time (no retroactive re-translation).
