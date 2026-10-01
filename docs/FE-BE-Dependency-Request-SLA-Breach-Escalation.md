# FE → BE Dependency Request — SLA Breach Escalation

**Source ticket:** `Claude outputs/CAD-FE-SLA-Breach-Escalation.md` (task breakdown) · FE implementation complete against mock contracts (2026-10-01)

## 1. Overview

| Field | Details |
|---|---|
| Feature | Escalation when SLA Breach — warning (pre-breach) and breach notifications to a responsible role, case-timeline escalation entries with Acknowledge, and per-SLA-policy Escalation Rules configuration |
| FE Task / BE Task | FE: **done** (mock-backed, behind `VITE_MOCK_API`) / BE: breach-detection scheduler, idempotent event emission, escalation storage + ack + rules CRUD, audit trail |
| Requester | FE Engineering |
| Priority | **P1** — BRD v1.2 marks SLA Management as MVP; without breach events the FE can only demo on mocks |
| Status | 🟡 Pending |
| Needed By | TBD — FE is unblocked (mock mode); needed before SIT integration |

**Goal:** When a case approaches (default 80% of its SLA window) or misses its SLA target, the backend emits exactly one escalation event per (caseId, level, type); the configured recipient role is notified in-app, and the escalation is stored so the case timeline shows who was notified, when, and who acknowledged — with a full audit trail.

**User story:** As a *supervisor*, I want to *receive one in-app notification when a case in my scope is about to breach (or has breached) its SLA*, so that *no breached case sits unnoticed and there is an auditable record of who was told and when*.

## 2. Blocker

**What's missing:** Nothing in the current backend detects or emits SLA breaches. The FE SLA clock is a client-side countdown (`countDownSla.tsx`); it cannot detect breaches for unattended cases and dies when the browser closes. All escalation FE surfaces run on session-scoped mocks (`mockEscalationEvents.ts`, `escalationRulesStub.ts`).

**Type:** Contract fully defined on FE / Backend not built — FE has mock stubs for every item below; only the data source swaps when the real endpoints land.

## 3. API Contract

### 3.1 Breach detection + websocket event (highest priority)

A scheduler / delayed-job evaluation of SLA clocks. At the configured warning threshold (per SLA policy, default 80% elapsed) emit a `warning` event; at 100% emit a `breach` event. **Idempotent: exactly one event per (caseId, level, type)** — `eventId` is the idempotency key the FE dedupes on. MVP is single-level (`level: 1`).

Delivered over the existing notifications socket (`/api/v1/notifications/register`), same envelope as `CASE-CREATE` / `CASE-UPDATE`:

```json
{
  "EVENT": "SLA-ESCALATION",
  "additionalJson": {
    "eventId": "ESC-9F3K2",
    "caseId": "CASE-1001",
    "caseNumber": "WO-1001",
    "level": 1,
    "type": "warning | breach",
    "targetRole": "Supervisor",
    "occurredAt": "2026-10-01T11:00:00.000Z",
    "slaDueAt": "2026-10-01T12:00:00.000Z"
  }
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| eventId | string | No | Idempotency key; unique per (caseId, level, type). FE dedupes on it |
| caseId | string | No | Routes the deep link `/case/{caseId}` |
| caseNumber | string | Yes | Display label in the notification body; FE falls back to caseId |
| level | number | No | Escalation level; always 1 in MVP |
| type | "warning" \| "breach" | No | Drives the amber (warning) / red pulsing (breach) notification tiers |
| targetRole | string | No | Role-based recipient (CAD decision 3 — roles, not named users) |
| occurredAt | ISO 8601 | No | Server clock — source of truth (client clock only animates) |
| slaDueAt | ISO 8601 | No | Server clock |

### 3.2 Escalation records per case

```http
GET /cases/{caseId}/escalations
```
**Success response** (`200 OK`) — `data: EscalationRecord[]`, oldest first:

```json
{
  "data": [
    {
      "id": "ESC-9F3K2",
      "caseId": "CASE-1001",
      "caseNumber": "WO-1001",
      "level": 1,
      "type": "breach",
      "targetRole": "Supervisor",
      "occurredAt": "2026-10-01T11:55:00.000Z",
      "slaDueAt": "2026-10-01T12:00:00.000Z",
      "status": "open | acknowledged | resolved",
      "acknowledgedBy": null,
      "acknowledgedAt": null
    }
  ]
}
```

### 3.3 Org-wide open escalations (reconnect catch-up)

```http
GET /organizations/{orgId}/escalations?status=open
```
Same `EscalationRecord[]` shape. FE calls this on websocket reconnect and replays anything missed while offline (FE-side dedupe makes replays idempotent).

### 3.4 Acknowledge

```http
POST /cases/{caseId}/escalations/{escalationId}/ack
```
**Required permission:** `sla.escalation.ack` (new — must be added to the permission catalog; enforced server-side). Returns the updated `EscalationRecord`. Every acknowledgement writes an audit-trail entry.

### 3.5 Escalation rules configuration

```http
GET   /organizations/{orgId}/escalation-rules
PATCH /organizations/{orgId}/escalation-rules
```

**PATCH body / GET response `data`:**

```json
{
  "orgId": "ORG-1",
  "rules": [
    {
      "policyId": "sla-resolution",
      "policyName": "Resolution SLA",
      "enabled": true,
      "warningThresholdPct": 80,
      "targetRole": "Supervisor"
    }
  ],
  "updatedAt": "2026-10-01T09:00:00.000Z",
  "updatedBy": "admin.user"
}
```

| Rule | Expected Behavior |
|---|---|
| `warningThresholdPct` | Integer 1–99; default 80; warn exactly at threshold, breach at 100% |
| `rules` replaced as a whole | The form submits the complete edited list; no deep merge |
| `enabled: false` | No events emitted for that policy |
| Rule changes apply to new breaches only | No retroactive re-evaluation |

### 3.6 GraphQL environments

Every `.env*` here runs `VITE_USE_GRAPHQL="true"` — **no REST fallback**. Each REST url above needs a matching entry in `src/core/store/api/graphql/*Queries.ts` and `GQL_MAP` (`src/core/utils/gqlMapper.ts`), same as the assignment-rules precedent. FE deferred these entries because the BE schema is unknown — please provide the GraphQL field names, or agree the REST-shape equivalents.

### 3.7 Errors

| Case | HTTP Status | FE Behavior |
|---|---|---|
| Validation | 400 | Rules form shows the persistent "not saved" banner, edits kept |
| Unauthorized / Forbidden | 401 / 403 | Default app behaviour; ack button hidden without `sla.escalation.ack` |
| Not Found (rules GET) | 404 | Form falls back to schema defaults (this is the expected pre-migration state) |
| Server Error | 500 | Timeline/settings sections degrade gracefully — never a broken screen |

## 4. Environment & Access

| Item | Status | Details |
|---|---|---|
| DEV/SIT URL | TBD | |
| Test account & permission | TBD | Need one user **with** and one **without** `sla.escalation.ack`; one Supervisor-role user for recipient testing |
| Test data | TBD | Cases with known, controllable SLA due times (see test procedures §2) |
| Swagger / OpenAPI link | TBD | |

## 5. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Which SLA clocks drive escalation — response, resolution, or both? (FE seeds rules for both policies) | Backend / Product | Open |
| 2 | Does "SLA breach" mean the raw clock hitting zero, or a pause-adjusted variant (pending states pause the timer per BRD §3.3)? FE assumed raw clock (CAD A5) | Backend / Product | Open |
| 3 | What clears an escalation besides acknowledge — case resolve, SLA extension? FE assumed ack-or-resolve (CAD decision 6) | Product | Open |
| 4 | What is the emitter's retry/guarantee if the socket has no active subscribers — is 3.3 the only catch-up path, or is there a persisted notification inbox? | Backend | Open |
| 5 | GraphQL schema field names for 3.2–3.5 (FE will then register the GQL_MAP entries) | Backend | Open |

## 6. Status & Next Action

**Blocker:** No breach detection, event emission, or escalation storage exists server-side; FE runs entirely on mocks until 3.1–3.5 land.
**Next action:** Backend confirms the contract (esp. Q1–Q2) and schedules 3.1 first — **Owner:** Backend — **ETA:** TBD

---

**Done when:** With `VITE_MOCK_API="false"` against SIT: (1) a case crossing 80% of its SLA emits exactly one warning event and the Supervisor gets one notification; (2) at 100% exactly one breach event; (3) the case timeline lists both events and a permitted user can acknowledge (recorded with user + timestamp in the audit trail); (4) killing and restoring the socket does not duplicate or lose alerts; (5) Escalation Rules changes persist and apply to new breaches; (6) every acceptance criterion in the integration test procedures (`docs/FE-SLA-Breach-Escalation-Integration-Test-Procedures.md`) passes.
