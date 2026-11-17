# Backend Dependency Requests

> Generated from frontend codebase audit (`src/`) and BRD v1.3.  
> Each request identifies an endpoint, field, event, or permission the frontend needs but the backend (`welcome-case`) does not yet provide.

---

## BDR-01 — Mention User Search & Notification API

| Field | Value |
|-------|-------|
| **Feature** | Collaboration – `@Mention` |
| **Requesting Frontend Task(s)** | FE-01 |
| **BRD Reference** | §Collaboration & Visibility → Case Comment, `@Mention` |
| **Priority** | High |

### What is Needed

**Endpoint 1 — User search for mentions**
- **Method:** `GET`
- **Path:** `/api/v1/users/search`
- **Query params:** `query` (string, min 2 chars), `limit` (number, default 10), `type=mention`
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": [
      { "id": "uuid", "username": "jdoe", "displayName": "John Doe", "avatarUrl": "…" }
    ]
  }
  ```

**Endpoint 2 — Persist mention on comment**
- Extend existing `POST /cases/{caseId}/comments` (or create if absent) to accept:
  - `mentionedUserIds: string[]` (UUIDs of mentioned users)

**Event — Mention notification**
- **Event name:** `MENTION`
- **Payload:** `{ caseId, commentId, mentionedByUserId, mentionedUserId, timestamp }`
- **Delivery:** websocket broadcast to the mentioned user's session, or in-app notification

### Evidence That Current Backend Does Not Cover It
- Zero mention-related code in `src/` (no components, no API files, no types).
- No mention-related entries in any `*Api.ts`, `*Queries.ts`, or `GQL_MAP`.
- BRD explicitly lists `@Mention` but no backend contract file exists for it.

---

## BDR-02 — Location Based Routing Engine

| Field | Value |
|-------|-------|
| **Feature** | Routing – Location Based |
| **Requesting Frontend Task(s)** | FE-02 |
| **BRD Reference** | §3.1 Routing Methods → Location-Based Routing; §4.2 Smart Routing & Assignment Rules System Config |
| **Priority** | High |

### What is Needed

**Endpoint — Execute location-based routing**
- **Method:** `POST`
- **Path:** `/api/v1/routing/location-based`
- **Request body:**
  ```json
  {
    "incidentLat": 13.7563,
    "incidentLon": 100.5018,
    "caseType": "breakdown",
    "priority": "P2",
    "departmentId": "opt"
  }
  ```
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "candidates": [
        {
          "officerId": "uuid",
          "officerName": "Sgt. Smith",
          "distanceMeters": 1250,
          "estimatedArrivalMin": 8,
          "currentWorkload": 3,
          "availability": "available"
        }
      ],
      "ruleApplied": "location_based"
    }
  }
  ```

**Permission:** `routing:execute` (or reuse existing admin permission if available).

### Evidence That Current Backend Does Not Cover It
- `src/core/store/api/organizationApi.ts:246` defines `GET /organizations/{orgId}/assignment-rules` for **config only**; comment states: *"FE contract ahead of the backend: neither route exists server-side yet."*
- `src/cms/components/admin/system-configuration/settings/assignment/SmartRoutingSettings.tsx` header comment: *"Configuration only — no automatic routing runs yet; dispatchers still assign every case by hand."*
- No runtime routing engine endpoint exists anywhere in the frontend API layer.

---

## BDR-03 — Case Type Based Routing Engine

| Field | Value |
|-------|-------|
| **Feature** | Routing – Case Type Based |
| **Requesting Frontend Task(s)** | FE-03 |
| **BRD Reference** | §3.1 Routing Methods → Case Type Routing; §4.2 Smart Routing & Assignment Rules System Config |
| **Priority** | High |

### What is Needed

**Endpoint 1 — Execute case-type routing**
- **Method:** `POST`
- **Path:** `/api/v1/routing/case-type`
- **Request body:**
  ```json
  {
    "caseType": "breakdown",
    "subCategory": "engine_failure",
    "severity": "high"
  }
  ```
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "matchedTeamId": "uuid",
      "matchedTeamName": "Engineering Response",
      "ruleId": "rule-uuid",
      "officerPool": [ { "officerId": "…", "name": "…" } ]
    }
  }
  ```

**Endpoint 2 — CRUD case-type routing rules**
- `GET /api/v1/routing/case-type-rules` — list rules
- `POST /api/v1/routing/case-type-rules` — create rule
- `PATCH /api/v1/routing/case-type-rules/{id}` — update rule
- `DELETE /api/v1/routing/case-type-rules/{id}` — delete rule
- Rule shape:
  ```json
  {
    "id": "uuid",
    "caseType": "breakdown",
    "subCategory": "*",
    "severity": "high",
    "targetTeamId": "uuid",
    "priority": 1,
    "active": true
  }
  ```

### Evidence That Current Backend Does Not Cover It
- Same as BDR-02: assignment-rules endpoints are config-only stubs with no runtime engine.
- No `case-type-rules` or equivalent endpoint exists in any frontend API file.

---

## BDR-04 — Round Robin Assignment Engine

| Field | Value |
|-------|-------|
| **Feature** | Assignment – Round Robin |
| **Requesting Frontend Task(s)** | FE-04 |
| **BRD Reference** | §3.2 Assignment Methods → Round Robin Assignment; §4.3 Workload & Resource Allocation System Config |
| **Priority** | High |

### What is Needed

**Endpoint 1 — Execute round-robin assignment**
- **Method:** `POST`
- **Path:** `/api/v1/assignment/round-robin`
- **Request body:**
  ```json
  {
    "candidateOfficerIds": ["uuid1", "uuid2", "uuid3"],
    "teamId": "uuid"
  }
  ```
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "assignedOfficerId": "uuid2",
      "nextCursorOfficerId": "uuid3",
      "rotationOrder": ["uuid1", "uuid2", "uuid3"]
    }
  }
  ```

**Endpoint 2 — Read rotation state**
- **Method:** `GET`
- **Path:** `/api/v1/teams/{teamId}/round-robin-state`
- **Response fields:** `{ cursorOfficerId, rotationOrder[], lastUpdated }`

### Evidence That Current Backend Does Not Cover It
- `src/cms/components/admin/system-configuration/settings/assignment/WorkloadAllocationSettings.tsx` header: *"Configuration only; no engine consumes the choice."*
- `src/core/types/organization.ts:257` defines the `AllocationMethod` type but the consuming engine is absent.
- No assignment-engine endpoint exists in any frontend API file.

---

## BDR-05 — Load Balance Assignment Engine

| Field | Value |
|-------|-------|
| **Feature** | Assignment – Load Balance |
| **Requesting Frontend Task(s)** | FE-05 |
| **BRD Reference** | §3.2 Assignment Methods → Load Balance Assignment; §4.3 Workload & Resource Allocation System Config |
| **Priority** | High |

### What is Needed

**Endpoint 1 — Execute load-balance assignment**
- **Method:** `POST`
- **Path:** `/api/v1/assignment/load-balance`
- **Request body:**
  ```json
  {
    "candidateOfficerIds": ["uuid1", "uuid2", "uuid3"],
    "teamId": "uuid"
  }
  ```
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "assignedOfficerId": "uuid1",
      "ranking": [
        { "officerId": "uuid1", "activeCaseCount": 2, "lastAssignedAt": "…" },
        { "officerId": "uuid2", "activeCaseCount": 5, "lastAssignedAt": "…" }
      ]
    }
  }
  ```

**Endpoint 2 — Real-time workload read**
- **Method:** `GET`
- **Path:** `/api/v1/officers/{officerId}/workload`
- **Response fields:** `{ activeCaseCount, activeCaseIds[], estimatedCapacity }`

### Evidence That Current Backend Does Not Cover It
- Same as BDR-04: config UI exists but no backend engine.
- Existing `useUnitWorkloads.ts` and `OfficerWorkloadCell.tsx` display workload data but the source is stubbed (`unitWorkloadStub.ts`) or isolated from the org-level `allocationMethod` setting.

---

## BDR-06 — Escalation Rules Endpoint + Breach Scheduler

| Field | Value |
|-------|-------|
| **Feature** | SLA – Escalation |
| **Requesting Frontend Task(s)** | FE-06a, FE-06b |
| **BRD Reference** | §3.3 SLA Management → Escalation Rules, Automatic Escalation, Alert Notification |
| **Priority** | Critical |

### What is Needed

**Endpoint 1 — Org escalation rules**
- **Method:** `GET`
- **Path:** `/api/v1/organizations/{orgId}/escalation-rules`
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "orgId": "uuid",
      "rules": [
        {
          "policyId": "sla-policy-uuid",
          "enabled": true,
          "warningThresholdPercent": 75,
          "recipientRole": "team_lead"
        }
      ],
      "updatedAt": "2026-10-08T12:00:00Z"
    }
  }
  ```

**Endpoint 2 — Update org escalation rules**
- **Method:** `PATCH`
- **Path:** `/api/v1/organizations/{orgId}/escalation-rules`
- **Request body:** `{ rules: [{ policyId, enabled, warningThresholdPercent, recipientRole }] }`

**Endpoint 3 — Case escalation history**
- **Method:** `GET`
- **Path:** `/api/v1/cases/{caseId}/escalations`
- **Response fields:** Array of `EscalationRecord` (`src/cms/types/escalation.ts`)

**Endpoint 4 — Acknowledge escalation**
- **Method:** `POST`
- **Path:** `/api/v1/cases/{caseId}/escalations/{escalationId}/ack`
- **Request body:** `{ acknowledgedBy: "userId" }`

**Event — SLA escalation**
- **Event name:** `SLA-ESCALATION`
- **Payload:** `{ caseId, escalationId, policyId, triggeredAt, severity, message }`
- **Delivery:** websocket broadcast to concerned users (case owner, team lead, admin).

**Background service — Breach scheduler**
- A background worker/process that evaluates active case SLA deadlines every configurable interval (e.g. 30s).
- On threshold breach: creates `EscalationRecord`, updates case priority/owner, emits `SLA-ESCALATION` event.

### Evidence That Current Backend Does Not Cover It
- `src/cms/store/api/escalationApi.ts:5` header: *"FE contract ahead of the backend (CAD-FE-SLA-Breach-Escalation): neither route exists server-side yet."*
- `src/cms/components/escalation/useCaseEscalations.ts` header: *"The real endpoints do not exist yet, so non-mock mode returns an empty, non-error result."*
- `EscalationRulesSection.tsx` header: *"Configuration only — no escalation engine consumes these values yet."*

---

## BDR-07 — Area Response Auto-Assignment + Alert Dispatch

| Field | Value |
|-------|-------|
| **Feature** | Area Response – Assign to Specific Service Response Team |
| **Requesting Frontend Task(s)** | FE-07a, FE-07b |
| **BRD Reference** | §2.3 Real-Time Routing & Optimization → Spatial Routing & Automation; §3.4 Area Response |
| **Priority** | High |

### What is Needed

**Endpoint 1 — Auto-assign by polygon match**
- **Method:** `POST`
- **Path:** `/api/v1/area-response/assign`
- **Request body:** `{ "caseId": "uuid", "lat": 13.7563, "lon": 100.5018 }`
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "matched": true,
      "serviceCenterId": "uuid",
      "serviceCenterName": "Bangkok Central",
      "teamId": "uuid",
      "teamName": "Response Team A",
      "autoAssigned": true
    }
  }
  ```

**Endpoint 2 — Dispatch alert to team**
- **Method:** `POST`
- **Path:** `/api/v1/area-response/alerts`
- **Request body:** `{ "caseId": "uuid", "teamId": "uuid", "channels": ["push", "sms", "in_app"] }`
- **Response fields:** `{ alertId, dispatchedAt, channelResults: [{ channel, status }] }`

**Endpoint 3 — Alert status**
- **Method:** `GET`
- **Path:** `/api/v1/area-response/alerts/{alertId}/status`
- **Response fields:** `{ alertId, deliveredAt, acknowledgedAt, acknowledgedBy, failedReason }`

**Permission:** `area_response:dispatch_alert`

### Evidence That Current Backend Does Not Cover It
- `src/cms/components/case/formFields/serviceCenterMatch.ts` header: *"Nothing here is persisted with the case."* The polygon check is a pure frontend decision aid.
- `src/cms/components/admin/system-configuration/settings/map/AssignmentMapSettings.tsx` only controls map visualization and workload display toggles; no auto-assignment or alert dispatch setting exists.
- BRD §2.3 marks the full auto-route + alert feature as *(Next Phase)*.
- No `area-response` or equivalent endpoint exists in any frontend API file.

---

## BDR-08 — Batch Workload Allocation + Dispatch

| Field | Value |
|-------|-------|
| **Feature** | Map – Workload and Resource Allocation |
| **Requesting Frontend Task(s)** | FE-08 |
| **BRD Reference** | §3.2 Assignment Methods; §4.3 Workload & Resource Allocation System Config |
| **Priority** | Medium |

### What is Needed

**Endpoint — Batch assignment**
- **Method:** `POST`
- **Path:** `/api/v1/assignment/batch`
- **Request body:**
  ```json
  {
    "caseIds": ["uuid1", "uuid2", "uuid3"],
    "officerPoolIds": ["uuidA", "uuidB", "uuidC"],
    "allocationMethod": "round_robin" | "load_balance"
  }
  ```
- **Response fields:**
  ```json
  {
    "status": "0",
    "data": {
      "results": [
        { "caseId": "uuid1", "assignedOfficerId": "uuidA", "status": "success" },
        { "caseId": "uuid2", "assignedOfficerId": "uuidB", "status": "success" },
        { "caseId": "uuid3", "status": "failed", "reason": "officer_unavailable" }
      ],
      "failedCaseIds": ["uuid3"]
    }
  }
  ```

### Evidence That Current Backend Does Not Cover It
- Same as BDR-04/BDR-05: no assignment engine endpoint exists.
- No batch-assignment concept exists in any frontend API file.
- The map picker (`singleAssignOfficer.tsx`, `AssignOfficerModel.tsx`) only supports one-case-at-a-time assignment.

---

## BDR-09 — Email Channel Integration API

| Field | Value |
|-------|-------|
| **Feature** | Customer Contact Channel – Email |
| **Requesting Frontend Task(s)** | FE-10 (functional mode) |
| **BRD Reference** | §Contact Center Operations → Email |
| **Priority** | Medium |

### What is Needed

**Endpoint 1 — Inbox list**
- **Method:** `GET`
- **Path:** `/api/v1/email/inbox`
- **Query params:** `start`, `length`, `folder` (`inbox` | `sent` | `archive`), `search`
- **Response fields:** Array of thread summaries `{ id, from, subject, preview, time, unread, attachmentCount }`

**Endpoint 2 — Read email**
- **Method:** `GET`
- **Path:** `/api/v1/email/{id}`
- **Response fields:** Full email with `body`, `headers`, `attachments: [{ name, mimeType, url }]`, `threadId`

**Endpoint 3 — Send / Reply / Forward**
- **Method:** `POST`
- **Paths:**
  - `/api/v1/email/send`
  - `/api/v1/email/{id}/reply`
  - `/api/v1/email/{id}/forward`
- **Request body:** `{ to[], cc[], bcc[], subject, body, attachments[], inReplyTo? }`

**Endpoint 4 — AI suggestion**
- **Method:** `POST`
- **Path:** `/api/v1/email/ai-suggest`
- **Request body:** `{ emailBody, threadContext, tone? }`
- **Response fields:** `{ suggestion: string, citations? }`

### Evidence That Current Backend Does Not Cover It
- `src/cc/components/workspace/Email.tsx` uses entirely hardcoded mock data (`useState` with literal array); no API hooks are imported.
- No email-related endpoint exists in `src/cc/store/api/` beyond the placeholder `Email.tsx` page component.
- BRD §Contact Center Operations lists Email as a channel but the frontend implementation is stub-level.

---

## BDR-10 — Authenticate the notifications WebSocket

| Field | Value |
|-------|-------|
| **Feature** | Real-time notifications (case, mention, call, dashboard) |
| **Requesting Frontend Task(s)** | WebSocket access-token carrier (plan: `docs/WEBSOCKET-Auth-Token-Implementation-Plan.md`) |
| **BRD Reference** | §Real-time / Notifications |
| **Priority** | High (authorization gap, not a performance issue) |

### What is Needed

**Endpoint:** the existing `GET /api/v1/notifications/register` upgrade. No new endpoint, no new route.

**Change 1 — read and validate the credential the FE sends.** The first text frame after the upgrade is:

```json
{ "EVENT": "SUBSCRIBE", "orgId": "…", "username": "…", "access_token": "<jwt>" }
```

`access_token` is a **flat field on the frame** (decided 2026-11-17 — not a nested `headers` object, and
not a request header). Reject the frame — and close the socket — when `access_token` is missing,
malformed, expired, fails signature verification, or does **not** match the `orgId`/`username` claimed in
the same frame. Binding the claimed identity to the verified token is the point: without it a client can
subscribe as any user.

**Change 2 — close codes and timeout.**
- Close code `4401`, reason `unauthorized`, on any of the failures above. The FE treats `4401`/`4403` as an auth decision (one refresh, then terminal) and every other code as transient (bounded retry), so the distinction is load-bearing.
- Close a socket that has not sent a valid `SUBSCRIBE` within **10 s** of the upgrade. Today such a socket is held open forever with no identity attached.

**Note — no request header is possible.** `Authorization` cannot be set on a WebSocket upgrade from a
browser (`new WebSocket(url, protocols)` has no header parameter). The only header-shaped option,
`Sec-WebSocket-Protocol`, was implemented and verified on the FE and then dropped: it aborts the
handshake unless the server echoes the protocol back, and it cannot be named `Authorization`. The frame
field above needs no handshake work at all, so it is the agreed contract.

Still open: does the server validate **per frame** or once per connection? The answer received is
"per connection", and the FE sends the credential once, on `SUBSCRIBE`. If frame-level validation is
needed, one flag (`STAMP_EVERY_OUTGOING_FRAME`) attaches `access_token` to every outgoing frame.

### Evidence That Current Backend Does Not Cover It
- The register endpoint currently trusts the `orgId` and `username` in the frame (confirmed by the backend owner, 2026-11-17). Anything reaching the socket can therefore subscribe as any user and receive that user's `CASE-*`, `MENTION`, `CALL_*` and dashboard events.
- The FE side shipped 2026-11-17: `buildRegisterFrame` sends a flat `access_token` on `SUBSCRIBE`, the socket is never opened without a token, and `4401`/`4403` trigger a single refresh-then-retry (`src/core/components/websocket/websocketAuth.ts`, provider wiring in `src/core/components/websocket/websocket.tsx`, covered by `websocketAuth.test.ts` and `websocketProvider.test.tsx`).
- Until the server validates, the FE work changes what the client **sends**, not what the server **accepts** — no client-side change can close this gap.

---

## Cross-Cutting Dependency: GraphQL Mapper Registration

Every new backend endpoint above that is exposed via REST **must** also be registered in the frontend `GQL_MAP` (`src/core/utils/gqlMapper.ts`) if the BFF serves it over GraphQL, because:

> *"There is no REST fallback once GraphQL is enabled (`VITE_USE_GRAPHQL === "true"`): a URL with no `GQL_MAP` entry … is logged via `console.error` and returned to the caller as a hard error."* — `hybridBaseQuery.ts` / `gqlMapper.ts`

**Action for Backend Team:** Provide the GraphQL operation names and input types for each new endpoint so the frontend can add the matching `GQL_*` entries before deployment.

---

## Summary Table

| ID | Feature | Priority | Blocking FE Tasks |
|----|---------|----------|-------------------|
| BDR-01 | Mention API | High | FE-01 |
| BDR-02 | Location Based Routing | High | FE-02 |
| BDR-03 | Case Type Based Routing | High | FE-03 |
| BDR-04 | Round Robin Assignment | High | FE-04 |
| BDR-05 | Load Balance Assignment | High | FE-05 |
| BDR-06 | Escalation Rules + Breach Scheduler | Critical | FE-06a, FE-06b |
| BDR-07 | Area Response Auto-Assign + Alerts | High | FE-07a, FE-07b |
| BDR-08 | Batch Workload Allocation | Medium | FE-08 |
| BDR-09 | Email Integration API | Medium | FE-10 (functional) |
| BDR-10 | Notifications WebSocket authentication | High | WebSocket token carrier (FE done 2026-11-17) |
