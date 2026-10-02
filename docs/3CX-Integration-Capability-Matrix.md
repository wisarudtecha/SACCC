# 3CX Integration Capability Matrix

## Purpose

This document maps the required Contact Center / CRM capabilities against what 3CX provides natively, what can be achieved through the 3CX APIs or CRM integration mechanisms, what should be implemented as custom development in the web application, and where a third-party solution may be appropriate.

The matrix is intended for technical discussion, solution design, estimation, and responsibility assignment between Frontend (FE), Backend (BE), 3CX administration, and optional third-party components.

## Scope

The assessment covers:

- Web application integration
- ANI / Caller ID and Screen Pop
- Call control and real-time call events
- Call recording, search, and playback
- Quality Management (QM)
- QM forms and scorecards
- Call-center dashboards and analytics
- FE / BE responsibility boundaries

## Delivery Modes

| Code | Meaning |
| --- | --- |
| **N — Native** | Capability is provided by the 3CX product/UI with configuration rather than custom application development. |
| **A — API / Integration** | Capability is exposed through a documented 3CX API, CRM integration, WebSocket, reporting/data integration, or similar supported integration mechanism. |
| **C — Custom Development** | Capability is implemented in the organization's own web application and backend. |
| **T — Third-party** | Capability can be provided by a separate product/platform when 3CX or the custom application does not sufficiently cover the requirement. |

> A requirement can have more than one delivery mode. For example, basic Screen Pop is available natively through 3CX CRM integration, while a richer CRM/Case screen pop is typically implemented with custom FE/BE logic.

---

## 1. Capability Matrix

| Requirement | Native 3CX | API / Integration | Custom Development | Third-party | FE Responsibility | BE Responsibility |
| --- | --- | --- | --- | --- | --- | --- |
| **Web Application Integration** | — | ✅ REST / WebSocket / CRM Integration | ✅ | Optional | Application UI, call controls, customer/case context, real-time state | 3CX adapter, authentication, orchestration, event handling, normalization, authorization |
| **ANI / Caller ID** | ✅ | ✅ CRM lookup | Optional | — | Display caller/customer information | Normalize ANI, customer lookup, matching rules, permissions |
| **Basic Screen Pop** | ✅ | ✅ CRM Integration | Optional | Optional | Link/target customer page as required by the application | Resolve caller → customer and expose secure CRM URL |
| **Custom CRM / Case Screen Pop** | Partial | ✅ | ✅ | Optional | Open/focus customer or case workspace, render relevant case context | Resolve caller → customer → active case, apply business rules, publish event |
| **Click-to-Call / Make Call** | ✅ Web Client | ✅ Call Control API | ✅ | Optional | Dial action and status UI | Authorize user, invoke 3CX API, audit/log request |
| **Answer / Transfer / Hang Up** | ✅ Web Client | ✅ Call Control API | ✅ | Optional | Call-control UI | 3CX commands, validation, authorization, state tracking |
| **Real-time Call Status** | ✅ Web Client | ✅ WebSocket | ✅ | — | Render ringing/answered/hold/transfer/end states | Consume 3CX events, map to internal event model, publish to FE |
| **Call Recording** | ✅ | Integration/Data options | Optional | Optional | Recording indicator and link from CRM/Case | Recording metadata, authorization, Case linkage, retention policy |
| **Recording Search** | ✅ 3CX reports/recording UI | ⚠️ Reporting/data integration | ✅ | Optional | Filters, result list, search UI | Search/query API, indexing/aggregation, authorization |
| **Recording Playback** | ✅ 3CX Web Client | ⚠️ Depends on chosen integration architecture | ✅ | Optional | Audio player, playback controls | Secure recording access/proxy/token handling, permissions |
| **AI Transcription** | ✅ AI Edition | ✅ Supported transcription integrations | Optional | Optional | Transcript display/search | Configure/consume transcription results, correlate with call/customer/case |
| **AI Summary / Sentiment** | ✅ AI features | ✅ | Optional | Optional | Display AI insights | Correlate AI output with call/customer/case; persistence and policy enforcement |
| **Live Call Monitoring** | ✅ Listen In / Whisper / Barge In | ✅ Call Control API | Optional | Optional | Supervisor monitoring controls | Permission checks, audit trail, 3CX commands |
| **Quality Management — Recording / Monitoring** | ✅ | ✅ | Optional | Optional | Monitoring/evaluation workspace | Business rules, permissions, audit, call-to-QM linkage |
| **QM Evaluation Forms** | ❌ No documented native configurable form builder | — | ✅ | ✅ | Form builder, evaluation UI | Templates, versioning, scoring, workflow, audit trail |
| **QM Scorecards** | ❌ | — | ✅ | ✅ | Scorecard display and entry | Scoring engine, weighted criteria, pass/fail, versioning |
| **QM Coaching Workflow** | ❌ | — | ✅ | ✅ | Feedback/coaching UI | Workflow, assignments, notifications, audit |
| **Call-center Dashboard — Basic** | ✅ Wallboard / Switchboard / Reports | ✅ | Optional | Optional | Dashboard presentation if embedded in own app | Optional aggregation/API layer |
| **Call-center Dashboard — Custom Realtime** | Partial | ✅ Call Control WebSocket | ✅ | Optional | KPI cards, tables, charts, agent state, realtime updates | Event aggregation, caching, KPI calculation, realtime delivery |
| **Historical Call Analytics** | ✅ Reports | ✅ CDR / reporting integrations | ✅ | Optional | Filters, charts, exports | Analytics API, aggregation, data model, access control |
| **Advanced BI Dashboard** | ⚠️ Native reporting + external BI path | ✅ External data sources / reporting exports | ✅ | ✅ Grafana / Power BI / other BI tools | Dashboard UI or embedded BI | ETL/data pipeline, analytics model, security, data retention |

---

## 2. Recommended Architecture

The recommended architecture is to treat **3CX as the telephony and contact-center engine**, while the organization's Super App / CRM / Case Management system owns business data and business workflows.

```text
┌───────────────────────────────────────────────────────────┐
│                     YOUR SUPER APP                        │
│                                                           │
│   CRM          Case Management       Contact Center       │
│   Customer     Case / SLA            Agent UI             │
│   Timeline     Assignment            QM                   │
│                                      Dashboard            │
└────────────────────────────┬──────────────────────────────┘
                             │
                       Internal APIs
                             │
┌────────────────────────────▼──────────────────────────────┐
│                        BACKEND                            │
│                                                           │
│  Call Service       CRM Service       Case Service       │
│  QM Service         Analytics Service                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              3CX Integration Adapter                │  │
│  │                                                     │  │
│  │  CRM REST Integration                               │  │
│  │  Call Control REST API                              │  │
│  │  Call Control WebSocket                             │  │
│  │  Reporting / CDR / Data Integration                 │  │
│  │  3CX-specific Mapping and Error Handling             │  │
│  └─────────────────────────┬───────────────────────────┘  │
└────────────────────────────┼──────────────────────────────┘
                             │
                             ▼
                          ┌──────┐
                          │ 3CX  │
                          └──────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
              Calls     Recordings     Call Data
```

### Architectural boundary

**Frontend should own:**

- User interaction
- Call-control buttons and UI state
- Caller/customer presentation
- Case context presentation
- Recording search/playback UI
- QM form and evaluation UI
- Contact-center dashboard visualization
- Realtime rendering of agent/call state

**Backend should own:**

- 3CX credentials and API authentication
- 3CX-specific integration code
- Business rules
- Authorization and access control
- ANI normalization and customer matching
- Customer → Case resolution
- Call → Customer / Case linkage
- Call event processing
- Idempotency, retries, error handling, and logging
- Recording access policy
- QM templates, scoring, evaluation workflow, and audit trail
- KPI calculation and analytics aggregation
- Publishing normalized realtime events to the FE

**3CX should own:**

- SIP / telephony
- Extensions
- IVR
- Queues
- Call routing
- Call handling
- Basic agent call controls
- Call recording
- Native contact-center monitoring/reporting
- 3CX-native AI call analysis where licensed/configured

---

## 3. Web Application Integration

3CX supports integration with external applications through multiple mechanisms.

### 3.1 CRM Integration

3CX can integrate with a CRM/helpdesk/ticketing system that exposes a REST API. The CRM Integration Wizard supports operations such as:

- Contact lookup by phone number
- Contact lookup by email
- Contact search
- Contact creation
- Call journaling
- Chat journaling

For inbound calls, 3CX can use the caller number to look up the customer, display the caller name in the 3CX Web Client, and provide a CRM contact URL.

### 3.2 Call Control API

The current 3CX Call Control API provides:

- RESTful HTTP endpoints for call operations
- WebSocket support for realtime events
- Programmatic call initiation
- Answer / transfer / terminate operations
- External call-control applications
- CRM/help-desk integration scenarios

3CX currently documents Call Control API configuration under **Admin Console → Integrations → API**. The current documentation states that Call Control access requires an **8SC+ AI license**.

### 3.3 Recommended application flow

```text
React FE
   │
   ▼
Backend API
   │
   ├── Business Rules
   ├── CRM / Case APIs
   └── 3CX Integration Adapter
              │
              ├── REST API
              └── WebSocket
                      │
                      ▼
                     3CX
```

React should not contain privileged 3CX credentials or be responsible for orchestrating business workflows between 3CX, CRM, and Case Management.

---

## 4. ANI and Screen Pop

### Basic 3CX Screen Pop flow

```text
Incoming Call
      │
      │ ANI / Caller Number
      ▼
     3CX
      │
      │ CRM lookup
      ▼
Backend / CRM API
      │
      ▼
Customer matched
      │
      ├── Customer name
      ├── Contact information
      └── CRM Contact URL
      │
      ▼
3CX Web Client
```

### Custom CRM / Case screen pop

For a richer requirement such as:

> Incoming call → find customer → find active case → open the correct Case workspace

use the custom web application flow:

```text
3CX Call Event
      │
      ▼
Backend
      │
      ├── Normalize ANI
      ├── Find Customer
      ├── Find Active Case
      ├── Apply routing/business rules
      └── Publish CALL_INCOMING
                    │
                    ▼
                 React FE
                    │
                    ▼
         Customer / Case workspace
```

This provides more control than relying only on the basic 3CX CRM contact popup.

---

## 5. Call Recording

3CX supports call recording and provides access to recordings through its client/reporting capabilities, subject to user permissions and configuration.

### Native use case

```text
3CX Web Client
      │
      ▼
Recordings
      │
      ▼
Playback
```

### CRM-integrated use case

For a custom CRM experience, expose recordings as part of the Customer / Case timeline:

```text
Case C123
  │
  ├── Call 1001 — Incoming
  │      └── ▶ Recording
  │
  ├── Call 1002 — Callback
  │      └── ▶ Recording
  │
  └── Call 1003 — Follow-up
         └── ▶ Recording
```

The integration should keep the recording system of record in 3CX or the officially supported recording/data architecture, while the CRM stores the metadata and relationship to Customer / Case.

---

## 6. AI Transcription, Summary and Sentiment

3CX currently supports AI transcription of phone calls and voicemail, together with summaries and sentiment analysis when the relevant AI capability/license is enabled.

Current 3CX documentation states that transcribed information can be accessed from **Admin → Recordings** or **Admin → Reports**, and transcription can be configured for Departments, Users, Queues, and Ring Groups.

The current V20 Update 10 documentation also describes structured AI call summaries containing:

- Summary
- Notes
- Action Items

### Recommended integration

```text
3CX Call
   │
   ├── Recording
   ├── Transcript
   ├── Summary
   └── Sentiment
          │
          ▼
       Backend
          │
          ▼
   Customer / Case Timeline
```

The CRM should store or reference the normalized result rather than embedding 3CX-specific data structures throughout the FE.

---

## 7. Quality Management (QM)

### What 3CX can cover

3CX provides contact-center monitoring capabilities such as:

- Call recording
- Listen In
- Whisper
- Barge In
- Call reporting
- AI transcription
- AI summaries
- Sentiment analysis

These are useful QM inputs, but they do not by themselves represent a complete configurable enterprise QM workflow.

### Recommended QM ownership

Implement the QM domain in the CRM / Super App or use a dedicated QM platform.

```text
                    3CX
                     │
             Recording / Call Data
                     │
                     ▼
              Integration Layer
                     │
                     ▼
                 QM Module
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
     Template     Evaluation     Coaching
     / Form        / Score        / Action
```

### QM form example

```text
QM Template: Customer Service Call

1. Greeting                         10%
2. Customer Verification            20%
3. Problem Identification            20%
4. Resolution                        30%
5. Compliance                        20%

Total Score: 91 / 100
Supervisor Comment: ...
Coaching Action: ...
```

### Recommended classification

| QM Capability | Recommended Mode |
| --- | --- |
| Call recording | **N / A** |
| Live call monitoring | **N / A** |
| Transcript | **N / A** |
| Summary / Sentiment | **N / A** |
| Evaluation form builder | **C / T** |
| Scoring engine | **C / T** |
| Coaching workflow | **C / T** |
| QM audit trail | **C / T** |
| Calibration workflow | **C / T** |

---

## 8. Call-center Dashboards

### 8.1 Native 3CX dashboard

3CX provides native reporting and contact-center monitoring, including queue and agent statistics, Switchboard/Wallboard capabilities, and scheduled reports.

Typical metrics include:

```text
CALL CENTER

Waiting Calls        12
Answered             126
Abandoned              8
Average Wait          21 sec
Average Talk        4:12
Agents Available       8
Agents Busy             5
SLA                    94%
```

### 8.2 Custom realtime dashboard

For the organization's own React dashboard:

```text
3CX
 │
 │ WebSocket Events
 ▼
Backend
 │
 ├── Normalize
 ├── Aggregate
 ├── Cache
 └── Publish
      │
      ▼
React Dashboard
```

The backend should calculate and normalize KPIs rather than making the FE understand raw 3CX event structures.

### 8.3 Historical / BI reporting

3CX provides reporting options and supports external data/reporting scenarios. 3CX documentation describes external reporting using data sources such as PostgreSQL and Google BigQuery with Grafana for custom dashboards.

A suitable enterprise pattern is:

```text
3CX
 │
 └── CDR / Reporting Data
          │
          ▼
     Analytics Storage
      (PostgreSQL / BI DS)
          │
          ├── Grafana
          ├── Power BI
          └── Custom Analytics API
                         │
                         ▼
                    React Dashboard
```

---

## 9. FE / BE Responsibility Matrix

| Area | FE | BE |
| --- | --- | --- |
| Call UI | Dialpad, call buttons, state display | Authorize and invoke 3CX operations |
| Screen Pop | Render/open customer or case workspace | ANI normalization, lookup, case resolution |
| Realtime Call State | Subscribe/render application events | Consume 3CX WebSocket and normalize events |
| Customer Context | Display customer profile | Customer lookup and matching |
| Case Context | Display open case/SLA/assignment | Case lookup and business rules |
| Call Logging | Display activity timeline | Persist call metadata and relationships |
| Recording Search | Search/filter UI | Search/index/query recording metadata |
| Recording Playback | Player UI | Secure access, permissions, token/proxy handling |
| QM Form | Form builder/evaluation UI | Template/version/scoring/workflow/audit |
| QM Score | Show score/result | Calculate and persist score |
| QM Coaching | Feedback UI | Workflow, assignment, notification, audit |
| Dashboard | Charts, cards, tables, live widgets | KPI calculation, aggregation, caching, event delivery |
| Security | UI-level visibility rules | Authoritative authorization and access control |
| Error Handling | User-facing status/error | Retry, timeout, idempotency, logging, alerting |
| 3CX Credentials | **Do not store privileged credentials** | Store/manage securely and use from backend |

---

## 10. Recommended Implementation Breakdown

### Phase 1 — Core Integration

1. Configure 3CX CRM Integration.
2. Implement Backend 3CX Integration Adapter.
3. Implement ANI → Customer lookup.
4. Implement basic Screen Pop.
5. Implement call logging to CRM/Case timeline.
6. Validate authentication, permission, error, and timeout behavior.

### Phase 2 — Call Control + Realtime

1. Configure 3CX Call Control API.
2. Implement call-control endpoints in the Backend.
3. Implement WebSocket event listener.
4. Normalize 3CX events into an internal event model.
5. Publish normalized call events to React.
6. Build FE call-state and supervisor-control UI.

### Phase 3 — Recording + AI Data

1. Define recording metadata model.
2. Link calls to Customer / Case.
3. Provide recording search UI.
4. Provide secure playback.
5. Integrate transcript / summary / sentiment where licensed and required.

### Phase 4 — QM

1. Define QM domain model.
2. Build configurable QM forms.
3. Implement scorecards and weighted scoring.
4. Implement supervisor evaluation workflow.
5. Implement coaching and audit trail.
6. Link evaluation results to call recordings and cases.

### Phase 5 — Dashboard / Analytics

1. Define operational KPIs.
2. Build realtime dashboard from normalized events.
3. Build historical analytics dataset.
4. Add BI dashboard integration where needed.
5. Add role-based dashboard access.

---

## 11. Key Design Decisions

### Decision 1 — 3CX should be the telephony engine

Keep the following in 3CX:

- SIP / telephony
- IVR
- Queues
- Routing
- Agent telephony
- Recording
- Native monitoring/reporting

### Decision 2 — Business workflows stay in the Super App

Keep the following in the organization's Backend / CRM:

- Customer master data
- Case Management
- Assignment
- SLA/business rules
- Customer → Case → Call relationships
- QM
- Audit trail
- Application-specific dashboards

### Decision 3 — Isolate 3CX with an Adapter

Use an explicit boundary:

```text
Business Domain
    │
    ▼
CallService / ContactCenterService
    │
    ▼
3CX Integration Adapter
    │
    ├── CRM Integration
    ├── Call Control REST
    ├── Call Control WebSocket
    └── Reporting / Data Integration
```

Do not spread 3CX-specific API calls throughout the application.

### Decision 4 — Normalize 3CX events

Do not expose raw 3CX event payloads directly to the React application.

Use an internal event model such as:

```json
{
  "event": "CALL_ANSWERED",
  "callId": "internal-call-id",
  "agentId": "agent-101",
  "customerId": "customer-123",
  "caseId": "case-456",
  "timestamp": "2026-10-02T10:30:00Z"
}
```

This reduces frontend coupling to the telephony vendor and makes future provider replacement easier.

---

## 12. Final Recommendation

For this requirement set, the target architecture should be:

```text
┌──────────────────────────────┐
│             3CX              │
│                              │
│ Telephony / IVR / Queue      │
│ Recording / Monitoring       │
│ Native Reporting             │
│ AI Call Analysis             │
└──────────────┬───────────────┘
               │
       API / WebSocket /
       CRM / Reporting
               │
┌──────────────▼───────────────┐
│          BACKEND             │
│                              │
│  3CX Integration Adapter     │
│  Business Rules              │
│  CRM / Case Orchestration    │
│  QM Service                  │
│  Analytics Service           │
└──────────────┬───────────────┘
               │
          Internal API /
        Realtime Events
               │
┌──────────────▼───────────────┐
│           REACT FE            │
│                              │
│ Customer / Case Workspace    │
│ Screen Pop                   │
│ Call Controls                │
│ Recording Search / Playback  │
│ QM Forms / Evaluation        │
│ Contact Center Dashboard     │
└──────────────────────────────┘
```

### Summary Classification

| Capability Group | Primary Solution |
| --- | --- |
| Telephony / PBX | **3CX Native** |
| ANI / Basic Screen Pop | **3CX CRM Integration** |
| Advanced CRM / Case Screen Pop | **API + Custom** |
| Call Control | **3CX Call Control API + Custom** |
| Realtime Call State | **WebSocket + Backend + Custom FE** |
| Recording | **3CX Native** |
| Recording Search / Playback in CRM | **API/Data Integration + Custom** |
| AI Transcription / Summary / Sentiment | **3CX AI + Integration** |
| QM Monitoring Inputs | **3CX Native / API** |
| QM Forms / Scorecards / Coaching | **Custom or Third-party** |
| Basic Call Center Dashboard | **3CX Native** |
| Custom Realtime Dashboard | **API + Custom** |
| Advanced BI | **3CX Data/Reporting + BI / Custom** |

The architectural principle is:

> **3CX = Telephony and Contact Center Engine**  
> **Backend = Integration + Business Orchestration**  
> **React = User Experience and Presentation**  
> **CRM/QM = Business Data, Evaluation, and Workflow**

---

## 13. Official 3CX References

The following references were checked against 3CX documentation available in 2026.

1. **3CX Call Control API**  
   <https://www.3cx.com/docs/call-control-api/>

2. **3CX Call Control API Endpoint Specification**  
   <https://www.3cx.com/docs/call-control-api-endpoints/>

3. **3CX CRM Integration Wizard**  
   <https://www.3cx.com/docs/crm-integration/>

4. **3CX CRM Integration Guides**  
   <https://www.3cx.com/docs/crm-integration-guides/>

5. **3CX Web Client**  
   <https://www.3cx.com/user-manual/web-client/>

6. **3CX Call Reports**  
   <https://www.3cx.com/docs/manual/call-reports/>

7. **3CX AI Transcription**  
   <https://www.3cx.com/docs/ai-transcription/>

8. **3CX Transcription Configuration**  
   <https://www.3cx.com/docs/enabling-transcription/>

9. **3CX Grafana / External Reporting**  
   <https://www.3cx.com/blog/releases/grafana-reporting/>

10. **3CX Configuration / Help Guides**  
    <https://www.3cx.com/docs/>

11. **3CX V20 Update 10 — AI Call Summaries**  
    <https://www.3cx.com/blog/releases/ai-call-summaries/>

> Product licensing, API availability, supported features, and limits can change by 3CX version, edition, and update level. Verify the target 3CX deployment version and license before final implementation or procurement decisions.
