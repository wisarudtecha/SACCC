# Feature Checklist Audit — Ticket (CAI) & Campaign vs. Cloud Contact Center

**Source checklist:** `Feature_Checklist_Ticket_Campaign_20261103_v1_Ticketing.xlsx`
(Ticket (CAI) sheet: 61 features, Campaign sheet: 33 features — 94 total)
**Audited codebase:** `D:\Development\Repos\Work\welcome-dcc\test\cloud-contact-center` (React 19 / TS, Vite 6)
**Date:** 2026-11-03

## Classification rule

Per the task instruction, **any feature with only a partial implementation is counted as *not implemented***. Each feature is classified into exactly one bucket:

| Class | Meaning |
| --- | --- |
| **IDENTICAL** | Function present in the codebase with the same behavior/shape as the CAI/Campaign description |
| **PRESENT-DIFFERENT** | Function is fully present but implemented in a different model, flow, or data source |
| **PARTIAL → not implemented** | Only part of the function exists (e.g. UI shell without live backend, mock-only, core concept missing) |
| **MISSING** | Nothing corresponding in the codebase |

## Summary

| | Ticket (CAI) | Campaign | Total |
| --- | ---: | ---: | ---: |
| IDENTICAL | 0 | 0 | **0** |
| PRESENT-DIFFERENT | 25 | 0 | **25** |
| PARTIAL (counted as not implemented) | 10 | 0 | **10** |
| MISSING | 26 | 33 | **59** |
| **Total** | **61** | **33** | **94** |

Headline:

- **No feature is identical** to the CAI/Campaign description — everything that exists is a different product model (case management, KMS broadcast, Jasper-embedded reports).
- **The entire Campaign system (33/33 features) is absent** from the codebase. There is no campaign module, no call-list upload, no exclusion/Do-Not-Call list, no dialer/dialing-mode concept, no FINN1/OCM integration, and no dialer reports. The only occurrence of the word "campaign" in `src` is KMS broadcast *copy text*. Genesys Administrator operations (CP-1…CP-6) are platform-side (Genesys Engage → Genesys Cloud CX 2) and have no counterpart in this app either way.
- **The ticket-side core (create / manage / close / search / assign cases, service type + SLA config, broadcast, case reports) exists but in a different shape** — cases instead of tickets, case types instead of services, role-based SLA escalation instead of per-service email escalation, KMS broadcast instead of Message Broadcast, Jasper Server report embeds instead of CAI's ASP.NET reports.
- **Banking-specific CAI features (1P customer data, ATM/Base24, verify, holiday master, greeting, agent scripts, ticket pool/transfer, complaint) have no counterpart at all** — these depend on 1P/Amque/CTAPI and Base24 integrations that the new system has not built in this frontend.

---

## Ticket (CAI) — 61 features

### CAI Inbound Care Center & ATM (IB01–IB17)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| IB01 | Receive call via softphone | **PARTIAL → not implemented** | Softphone UI exists and is substantial: `src/cc/components/softphone/Softphone.tsx`, `Dialpad.tsx`, `ActiveCallCard.tsx`, `useSoftphone.ts`, plus incoming-call screen pop `src/cc/components/incomingCall/IncomingCallScreenPop.tsx`. But all call lifecycle runs on a **dev-only mock** (`mockCallLifecycle.ts`: "stand-in until the backend 3CX adapter exists"; `VITE_MOCK_API` + `window.emitMockIncomingCall`). No live 3CX/Genesys telephony. |
| IB02 | Record contact & service result (Call Log) | **PRESENT-DIFFERENT** | Case creation records contact + service result: `src/cms/components/case/createCase/createCase.tsx`, `CaseFormFields.tsx` (case type/sub-type, priority, area, customer, attachments, dynamic form), case history `CaseHistory.tsx`, close with result `CaseDetailView.tsx`. Different model: no CAI contact-type field (grep `contactType` → 0 hits), no CUS01–CUS22 fields, no SLA day/hour capture at create. |
| IB03 | Complaint record (เรื่องร้องเรียน) | **MISSING** | No complaint entity/form anywhere in `src` (grep `complain` → 0 hits in cms). |
| IB04 | Search customer from 1P (account no / CIF / ID card / name / phone, VIP flag) | **PARTIAL → not implemented** | Local customer search exists: `CustomerSearchPicker.tsx`, `useLazyGetCustommerByPhoneNoQuery` / `useLazyGetCustomerQuery` (`src/cms/store/api/custommerApi.ts`). But it searches the app's own customer DB — **no 1P/CTAPI/Amque integration at all**, no CIF/ID-card/account-number search modes, no VIP flag. |
| IB05 | View customer detail from 1P (all account types, verify-gated) | **PARTIAL → not implemented** | Customer profile view exists: `CustomerView.tsx`, `CustomerPreview.tsx`, `CustomerCard.tsx` (with cases, notes, socials). No 1P account detail (saving/current/fixed/loan), no PIN/verify gate, no last-5-contacts view from 1P. |
| IB06 | View ATM card usage today (Base24) | **MISSING** | No ATMInfo screen, no CAF/TLF data. |
| IB07 | Block ATM card (Block Card) | **MISSING** | No card-block function anywhere. |
| IB08 | Manage main/sub service types | **PRESENT-DIFFERENT** | Service type/sub-type CRUD exists: `src/cms/components/admin/system-configuration/service/ServiceManagement.tsx`, `ServiceTypeAndSubType.tsx`, `ServiceHierarchyView.tsx` (hierarchy with en/th names, unit/skill/property binding). Different shape: no per-service SLA day/hour+Lv2/Lv3 fields on the service master itself (SLA is attached to the sub-type via `caseSla`), no To/CC email fields, no question-min fields. |
| IB09 | SLA per sub-service | **PRESENT-DIFFERENT** | Per-sub-type SLA (minutes) exists: `ServiceManagement.tsx` `caseSla` state (lines 98, 580–581, 1079–1092), shown in `ServiceHierarchyView.tsx` line 429, drives `SLACountdownBadge`/`countDownSla.tsx` on case lists. Missing CAI extras: no SLA days/hours split, no Lv2/Lv3 escalation levels. |
| IB10 | View agent working status | **PARTIAL → not implemented** | `src/cms/components/dashboard/AgentStatusDashboard.tsx` exists (route `/dashboard/agent-status`) but renders a **hardcoded static agent array** (lines 16–98) — no data source, no live status. |
| IB11 | Email Escalate per sub-service (To/CC when SLA not met) | **PARTIAL → not implemented** | SLA-breach escalation is being built: `src/cms/components/escalation/*` (websocket event contract, notification mapping `slaEscalationNotification.ts`, case-timeline entries with Acknowledge, org-level rule config `settings/escalation/EscalationRulesSection.tsx`), SLA monitor widget `SLAMonitorWidget.tsx`. But: recipients are **roles** (Supervisor/Org Admin/Dispatcher), not per-service email To/CC addresses; and the code comments state the backend breach scheduler **is not shipped yet** ("Configuration only — no escalation engine consumes these values yet… applies once the backend breach scheduler ships"; non-mock mode returns empty by design). |
| IB12 | Holiday master (for SLA date calc) | **MISSING** | No holiday management page/endpoint. `holidays: Date[]` exists only inside an unused `BusinessHours` type (`src/cms/types/index.ts:215`, `src/core/types/index.ts:214`); no UI or API consumes it (grep shows only the type declarations). |
| IB13 | Customer identity verification (verify questions, 3-of-N pass, personal questions) | **MISSING** | No verify/CIF-verify feature in cms (all `verify` hits are unrelated: code comments, identity-key utilities). |
| IB14 | ATM usage last 3 days | **MISSING** | Same as IB06. |
| IB15 | ATM card detail by card number | **MISSING** | Same as IB06. |
| IB16 | Greeting message master (per date range/type) | **MISSING** | Grep `greeting` → 0 hits. |
| IB17 | Agent Script master (topic + service-linked scripts) | **MISSING** | Grep `agentScript` → 0 hits. |
| OB01 | Outbound callback to customer | **PARTIAL → not implemented** | Outbound dial UI exists: `cc/components/softphone/Dialpad.tsx` + `MakeCallSection.tsx`, and `mockCallLifecycle.dial()` stands in for a make-call. Mock-only, no live telephony. |

### Ticketing (TK01–TK10)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| TK01 | Manage Ticket (edit/transfer workflow) | **PRESENT-DIFFERENT** | Case management covers edit/status/detail: `CaseDetailView.tsx`, `CaseDisplay.tsx`, `CasePanel.tsx`, `OverviewTab.tsx`, SOP step flow `sopStepTranForm.tsx`. Different domain (case, not ticket; no department-follow fields). |
| TK02 | Create Ticket | **PRESENT-DIFFERENT** | `createCase.tsx` full create flow with validation (`caseDataValidation`), preview-before-submit, attachments upload, customer link. |
| TK03 | Close Ticket | **PRESENT-DIFFERENT** | Close-case modal with result selection: `CaseDetailView.tsx` `handleOnChickCloseButton` (lines 516–539), `CaseResultManagement.tsx` (close-result master). No email To/CC on close. |
| TK04 | SLA-overdue ticket alert (Task List) | **PARTIAL → not implemented** | Frontend for SLA breach alerts is built against a websocket contract (`slaEscalationNotification.ts` maps events into the notification dropdown with case deep-link; `SLAMonitorWidget.tsx`; `escalationRulesStub.ts`). All of it runs on **session-scoped mock data**; the backend breach scheduler/endpoints are explicitly not shipped yet (see IB11). No CAI-style Task List page (`ddlAgent`/`chkAllSup` filter view). |
| TK05 | Transfer Ticket (to supervisor/manager) | **MISSING** | No transfer action on the case detail. |
| TK06 | Ticket Pool (central work database) | **MISSING** | No pool concept. |
| TK07 | Manage Service (type master) | **PRESENT-DIFFERENT** | Same code as IB08 — case type/sub-type management. |
| TK08 | Manage SLA per sub-service | **PRESENT-DIFFERENT** | Same code as IB09 — `caseSla` on sub-type. |
| TK09 | Assign Agent (from pool to own-dept agent) | **PRESENT-DIFFERENT** | Case assignment screen: `src/cms/pages/Case/caseAssignment.tsx` (kanban + list, advanced filters, "Unassigned" filter, `case.assign` permission, SLA countdown badges). Assignment is per-case, not pool pull with dept constraint. |
| TK10 | Search Ticketing (ID/date/phone) | **PRESENT-DIFFERENT** | Case search/filter in `caseAssignment.tsx` (search term over assignee/fields, advanced filter) and `CaseHistory.tsx` list. Different filter set (no ticket-ID/customer-name/dept-follow filters). |

### Ticket Escalator (TE01–TE07)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| TE01 | Create ticket to serve customer | **PRESENT-DIFFERENT** | Same as TK02. |
| TE02 | Close ticket (no cross-dept close) | **PRESENT-DIFFERENT** | Same as TK03. |
| TE03 | Send ticket as e-mail to non-CAI departments | **MISSING** | No e-mail send-from-case feature (grep `email` in `createCase.tsx`/`CaseDetailView.tsx` → no send action). |
| TE04 | Follow-up log (track work by date/time) | **PRESENT-DIFFERENT** | Cases support scheduled follow-up creation: route `/case/creation_schedule_date` (`src/cms/App.tsx:115`), `createCaseSchedule.tsx` (known large file), plus the case activity timeline (`activityTimeline/`) records status history. No CAI-style per-day follow-up status-log/Task List. |
| TE05 | Transfer ticket (self supervisor / other dept / back to owner) | **MISSING** | Same as TK05. |
| TE06 | View ticket detail & work history | **PRESENT-DIFFERENT** | `CaseDetailView.tsx` + `CaseHistory.tsx` + `CaseTimelineSteps.tsx` (full history/timeline). |
| TE07 | Assign agent for tickets received from other dept | **PRESENT-DIFFERENT** | Same as TK09 (assignment UI; no cross-department receive flow). |

### Message Broadcast (BC01–BC04)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| BC01 | Read announcements from supervisor (accept) | **PRESENT-DIFFERENT** | KMS Broadcast: `src/kms/broadcast/index.tsx` (list, detail), `getBroadcastPopupList` + `acceptBroadcastItems` (Accept/acknowledge) in `broadcast.service.ts`. Different module (Knowledge Management) and data model. |
| BC02 | Notify on new broadcast | **PRESENT-DIFFERENT** | KMS shows a first-visit notice / popup list (`DetailModal/index.tsx`: `useFirstVisitNotice("kb:broadcast:popup-notice", …)`, popup query). It is a passive on-visit notice, not a push alert on creation. |
| BC03 | Add announcement (date range, title, detail) | **PRESENT-DIFFERENT** | `AddBroadcast` GraphQL mutation with title/startDate/endDate/status/description (`buildAddBroadcastQuery`, `BroadcastFormModal`). No CAI "Important/Hot/New" radio categories (uses a status enum). |
| BC04 | Target group/department + mandatory acknowledgment | **PARTIAL → not implemented** | No access-group/target-group targeting for broadcasts accept exists but is not scoped/enforced per group. |

### Reports — Ticket (RP01–RP08)

The new system's reports are **Jasper Server embeds** configured in `src/cms/components/report/reportConfig.json` (page: `/report`, `cms/pages/Report/Report.tsx`), with titles in `public/i18n/*.json` under `report.*`:

- Group "รายงานเหตุ" (case): 1.1 daily service summary, 1.2 monthly service summary, 1.3 daily comparison, 1.4 monthly comparison; 2.1 service detail, 2.2 breakdown by service type, 2.3 breakdown by service result, 2.4 detail + service location.
- Group "รายงานคำสั่งซื้อ" (order): order summary/detail/top-10 sales.

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| RP01 | Service quality report (open/closed-on-time/closed-over-SLA, by service, by agent) | **PRESENT-DIFFERENT** | Jasper 1.1–1.4 + 2.2 cover service summary/detail with SLA-oriented service reports. Not the same 4-bucket quality split and no by-agent filter. |
| RP02 | Summary of work sent to related departments | **PRESENT-DIFFERENT** | Jasper 2.2 (breakdown by service type) + 2.1 detail approximate it; no dept-to-dept dimension. |
| RP03 | Account-closing result report (Anti / rate-reduction) | **MISSING** | Banking-domain report; no counterpart in the Jasper set. |
| RP04 | Service performance by employee | **MISSING** | No per-agent/per-employee report in the Jasper set or dashboards. |
| RP05 | Customer verify result report | **MISSING** | No verify feature at all (see IB13). |
| RP06 | Outbound report | **MISSING** | No outbound/call-center reporting in this frontend (outbound lives, if anywhere, in the telephony platform). |
| RP07 | Advertisement report (promo source) | **MISSING** | No advertisement data or report. |
| RP08 | Ticket Summary (by main/sub service, week/month grouping) | **PRESENT-DIFFERENT** | Jasper 1.1/1.2/1.3/1.4 (daily/monthly service summary + comparisons) are the closest match; grouping is day/month, not week. |

### Reports — CAI Report CareCenter (RC01–RC12)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| RC01 | Service Staff (per-agent service report) | **MISSING** | No per-agent report. |
| RC02 | Service Relate (Detail/Summary by service) | **PRESENT-DIFFERENT** | Jasper 2.1 (detail) + 2.2/2.3 (by service type / by result). |
| RC03 | Service Performance (per-employee quality) | **MISSING** | No per-employee quality report. |
| RC04 | Close Account (pass/fail) | **MISSING** | Banking domain. |
| RC05 | Verify Customer report | **MISSING** | No verify feature. |
| RC06 | Year Summary | **MISSING** | Jasper set has daily/monthly summaries only; no yearly aggregation. |
| RC07 | Outbound report | **MISSING** | As RP06. |
| RC08 | Advertisement report | **MISSING** | As RP07. |
| RC09 | All Service (monthly graph + summary) | **PRESENT-DIFFERENT** | Jasper 1.3/1.4 (comparison by day/month) + 1.1/1.2 (summary). |
| RC10 | Top 10 | **MISSING** | Only top-10 report in the set is sales ("ยอดขาย 10 อันดับแรก", order group) — not the service-domain Top 10. |
| RC11 | Service Stat (export xlsx) | **PRESENT-DIFFERENT** | Jasper 2.1 detail report; export is delegated to the Jasper Server viewer (the embed itself provides export; no custom xlsx export in this app). |
| RC12 | Raw Data (export xlsx) | **PRESENT-DIFFERENT** | Jasper 2.1 "รายละเอียดข้อมูลงานบริการ" is a raw-detail report; export via Jasper. |

### New-system RFP items (F01.210, F01.212)

| ID | Feature | Class | Evidence & assessment |
| --- | --- | --- | --- |
| F01.210 | Consolidated customer journey across IVR/voice/non-voice | **PARTIAL → not implemented** | Pieces exist: incoming-call screen pop links the call to a customer + recent cases and prefills case creation (`IncomingCallScreenPop.tsx`, `callLinkagePrefill.ts`), email workspace (`cc/components/workspace/Email.tsx`), but chat is a placeholder (`ChatPlaceholderPage.tsx`, `LobbyIncomingPage`/`ChatHistoryPage` are "coming soon" behind `entitlement.chat`). No cross-channel journey view. |
| F01.212 | Auto-create ticket after call (voice & non-voice) | **PARTIAL → not implemented** | Screen pop **prefills** a manual case creation (`/cms/case/creation?phoneNo=…&customerId=…`); there is no automatic ticket creation, no voice-to-text transcription, no chat-log-to-ticket. |

---

## Campaign — 33 features

**The codebase contains no campaign management module at all.** Confirmed by: grep `campaign|Campaign` across `src/**/*.{ts,tsx}` → only 2 hits, both *text copy* in `src/kms/t/broadcast.t.ts`; grep `exclusion|Exclusion|doNotCall|Blacklist` → 0 hits; grep `callList|CallList|FINN1|OCM|dialer|Dialer` → 0 hits; no `/campaign` route in `src/cms/App.tsx` or `src/cc/App.tsx`.

| ID | Feature | Class | Note |
| --- | --- | --- | --- |
| CP-1 | Dialing filter (Genesys Calling List) | **MISSING** | Genesys-Administrator (on-prem) function; platform-side. No counterpart in this app. |
| CP-2 | Viewing filter | **MISSING** | As above. |
| CP-3 | Expert Mode (config filter selection) | **MISSING** | As above. |
| CP-3.1 | Best Time To Call filter | **MISSING** | No best-time-to-call concept anywhere. |
| CP-3.2 | Order by phone type (6 permutations) | **MISSING** | No phone-type ordering. |
| CP-3.3 | Retry no answer | **MISSING** | No retry/no-answer dialing concept. |
| CP-3.4 | Retry UnContact by disposition code | **MISSING** | No disposition-code concept in `src`. |
| CP-4 | Move Campaign (agent groups) | **MISSING** | Agent-group management for campaigns does not exist. |
| CP-5 | Add Campaign to Agent | **MISSING** | As above. |
| CP-6 | Campaign Manager login (WDE) | **MISSING** | No Campaign Manager mode. |
| CP-6.1 | Outbound start/end time config + auto profile send | **MISSING** | No outbound time configuration. |
| CP-6.2 | Auto Start Campaign (group sequent, %/time triggers, Preview/Predictive/Progressive) | **MISSING** | |
| CP-7 | Manage Campaign (range/fixed mapping, ASC/DESC) | **MISSING** | No campaign↔call-list mapping. |
| CP-8 | Manage Campaign [Advance] (dated math conditions) | **MISSING** | As above. |
| CP-9 | Manage Exclusion List (upload .txt/.xlsx, date range) | **MISSING** | No exclusion list. |
| CP-10 | Manage Call List Profile (Account/Customer level, campaign priority, exclusion binding) | **MISSING** | No call-list profile. |
| CP-10.1 | Account Level behavior | **MISSING** | As above. |
| CP-10.2 | Customer Level behavior | **MISSING** | As above. |
| CP-10.3 | Campaign priority (drag-drop / up-down) | **MISSING** | As above. |
| CP-10.4 | Profile exclusion list selection | **MISSING** | As above. |
| CP-11 | Upload New Calling List (format check) | **MISSING** | No call-list upload. |
| CP-12 | Upload Call List (load, mapping result, dummy records, Send to OCM, retry data) | **MISSING** | No OCM integration of any kind. |
| CP-13 | Upload Direct to Campaign | **MISSING** | As above. |
| CP-14 | Load List Result (summary/detail CSV download) | **MISSING** | No load-list result files. |
| CR01 | Acc pending & Closing Report (collection) | **MISSING** | No collection reporting. |
| F01.214 | Dialer performance report by campaign | **MISSING** | No dialer reports in this frontend (RFP expects PureInsights / Welcome reports — neither present here). |
| F01.215 | Dialer performance report by agent | **MISSING** | As above. |
| F01.216 | Action code report by date/month/year | **MISSING** | No action-code data or report. |
| F01.217 | Dialer summary report | **MISSING** | As above. |
| F01.218 | Daily report (dialer) | **MISSING** | The only "daily" report in the Jasper set is the *service* daily summary (case domain), not a dialer report. |
| F01.219 | Bad phone report | **MISSING** | No bad-phone concept. |
| F01.220 | Call back report | **MISSING** | No call-back reporting. |
| F01.225 | Data retention parameters | **MISSING** | No data-retention configuration in the codebase. |

---

## Key structural observations

1. **Different product domain, not different feature sets.** The existing app is a field-service/CRM case platform (case types, areas, dispatch map, IoT devices, SLA countdowns, Jasper reports). The CAI checklist is a bank call-center ticket system. Overlap exists at the level of *generic capability* (record a contact, track SLA, report, broadcast), which is why several rows are PRESENT-DIFFERENT rather than MISSING.
2. **Telephony is UI-complete, integration-absent.** The `cc` module ships a full softphone/supervision/screen-pop UI, but every call event is mock-emitted (`VITE_MOCK_API` + `window.mockCall` / `window.emitMockIncomingCall`). The 3CX adapter and any Genesys Cloud CX 2 integration are not in the repo — so IB01/OB01 and the journey/auto-ticket RFP items are partial, not done.
3. **SLA machinery is half-wired.** Per-sub-type SLA values exist and drive countdown badges; the breach/escalation *notification* layer is built end-to-end against a websocket contract but explicitly runs on stubs until the backend breach scheduler ships.
4. **1P/Amque/Base24 is a zero-footprint integration family.** Nothing in the frontend references 1P, CIF, CTAPI, Amque, or Base24 — IB04–IB07 and IB13–IB17 cannot be assessed as present at any level.
5. **Reports are Jasper Server embeds** (8 case + 6 order reports), configured in `reportConfig.json` with Thai-named folders; no report definition, SQL, or export logic lives in this repo, so per-report fidelity (RP/RC rows) is assessed from report titles only.
6. **Campaign is 100% green field.** Nothing to reuse or partially map; the entire "Welcome Campaign Management" scope (call lists, profiles, exclusions, sequencing, dialer modes, dialer reports) must be built.
