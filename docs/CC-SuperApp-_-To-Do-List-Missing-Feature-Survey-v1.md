# CC SuperApp : To\-Do List  Missing Feature Survey

# Overview

|Date|Nov 12\. \(Today, Nov 12, 2026, 09:30 \- 12:00 \(GMT\+7\)\)|
|---|---|
|Participants|> Enter @ to insert names of the participants<br>> <br>> |
|Required readings|<br>BRD\-Contact Center Super Apps\_v1\.4<br>CC\-SuperApp\-\_\-To\-Do\-List\-Discussion\-Meeting\-Notes\-v2<br>|

# Agenda

> Describe the agenda\.
> 
> 

1. Overview CC Super App

2. Baseline for this survey\. 

    - Codebase snapshot
    - BRD v1.4

3. Feature coverage by module

    - Contact Management
    - CRM \& Customer 360 View
    - Case management 
    - Configuration 
    - CAD/ GIS
    - Contact center  
    - Knowledge Base
    - Product / Package \& Service / Order
    - Campaign Management 

- Product Issue 

# Discussion

> Take notes and @ the suggestion giver
> 
> 

- Purpose of this document : survey every feature required by the BRD that is **not usable end\-to\-end** in the current codebase, so the list can be assigned and estimated\.

- Definition of "Missing" used here
    - A BRD capability with **no** implementation in the codebase → Missing\.
    - A BRD capability whose UI exists but is backed by a **mock fixture / stub / commented\-out endpoint / empty tab / placeholder page** → counted as **Missing** \(per instruction "พัฒนาแต่ยังไม่เสร็จก็นับว่ายังไม่มี"\)\.
    - A BRD capability whose frontend is complete and whose backend contract is explicitly marked pending \(BFF, 3CX adapter\) → counted as Missing, with the dependency named in the Appendix\.

- Baseline compared

    - Source of requirement : [BRD\-Contact Center Super Apps\_v1\.4](docs/BRD-Contact-Center-Super-Apps-v1.4.md) \(revised 2026\-10\-29\)
    - Source of evidence : repository `cloud-contact-center` \(frontend\) — route tables, page/component tree, RTK Query API slices, feature flags and in\-code status banners
    - Codebase areas read : `src/App.tsx`, `src/cms/App.tsx`, `src/cc/App.tsx`, `src/kms/App.tsx`, `src/ai/App.tsx`, `src/cms/components/**`, `src/cc/**`, `src/kms/**`, `src/core/store/api/**`, `src/core/types/**`

- Headline result

    |        **Module**|        **BRD Ref**|        **Implemented in Codebase**|        **Missing \(counted\)**|
    |---|---|---|---|
    |        Case Management \(CMS\)|        FR\-01|        Case create/assign/history, SOP workflow builder, form builder, comments \& mentions, linked sub\-cases, SLA countdown, escalation rules, audit log, all admin masters|        11|
    |        CAD / GIS|        FR\-02|        Map engine \(ArcGIS / MapTiler / Longdo\), boundary \+ place \+ device \+ staff \+ cluster \+ sketch \+ incident radius layers, place/device admin, dispatch dashboard, staff drag assign, single route \+ ETA|        13|
    |        CRM \& Customer 360|        FR\-03|        Customer profile, contact channels \(phone / e\-mail / LINE / Facebook / TextChat\), internal notes, owned products, owned services, appointments, PII masking|        3|
    |        Product / Package \& Service / Order|        FR\-04, FR\-05, FR\-06|        Product, spare part, brand, category, store, stock in/out, barcode, serial, requisition order \(spare part\)|        14|
    |        Contact Center|        FR\-07|        Softphone toolbar UI, incoming\-call screen pop, agent state, supervisor live roster UI, call center dashboard UI, e\-mail workspace UI, quick actions to CMS|        17|
    |        Knowledge Base|        FR\-08|        Articles, categories, review/approve, broadcast, banner, file manager, source, KB dashboard, case type→article mapping, KB tab in case panel|        8|
    |        Reporting \& Analytics|        FR\-12|        Case reports \(8\) and Order reports \(6\) via JasperServer, service/dispatch/case\-by\-area dashboards, custom dashboard|        5|
    |        AI \& Automation|        FR\-14|        — \(module mounted, renders 404 only\)|        4|
    |        Cross\-System Integration|        FR\-11|        CMS↔CAD, CMS↔CRM, CMS↔KB, websocket realtime|        3|
    |        Campaign Management|        §10 Road Map|        —|        1|

- Reading key for the Appendix
    - "Exact\-Match Search" style capabilities such as **Version Control** are listed as Missing because only the data field exists, not the user\-facing function\.
    - Items the BRD itself marks **\(Next Phase\)** are kept in the list \(the survey is a gap list, not a release plan\) and are grouped in P6–P9 so they can be deferred without re\-sorting\.
    - Cancelled scope is **not** listed : FR\-09 Chatbot Intent \(Adaptor\) is struck through in BRD v1.4, and BRD §9 places Workforce Management functions, Marketing Automation, Loyalty, Billing and ERP out of scope\.

- Reference : full detail \(current state, what is missing, codebase evidence\) is in **Appendix A**\.

# Conclusion

> Write down your conclusions
> 
> 

- 79 missing features were identified across 10 modules \(Appendix A, groups A\.1 – A\.10\)\.

- Priority order follows the release plan in the discussion notes, not BRD section order :
    - P1 = CAD/GIS \(planned Sep–Oct 2026 — already past, still has the largest single block of gaps\)
    - P2 = Contact Center \(planned Nov–Dec 2026\)
    - P3 – P5 = CMS, CRM, Product/Package/Order \(product scope already sold\)
    - P6 – P7 = Knowledge Base, Reporting \(supporting scope\)
    - P8 – P9 = AI, Integration, Campaign \(BRD §10 Road Map "Next Phase"\)

- The most expensive block is **not** a missing screen : the Contact Center features \(P2\) and the CAD auto\-assign features \(P1\) are blocked on backend work \(3CX adapter, BFF KPI aggregation, assignment engine, settings APIs\), not on frontend\. The UI already exists for most of them\.

- Owner and estimate date are intentionally left blank in Action items, so the list can be assigned in the next planning session\.

- Next Action
    - Assign owner \+ estimate date per feature in the Action items list\.
    - Confirm scope calls with Product : FR\-11 "WFM Integration" vs BRD §9 "Workforce Management Functions — out of scope" \(Appendix A\.9\)\.
    - Decide whether P6–P9 stay in this release plan or move to the Next Phase backlog\.

- Issue
    - Several P2 items show a working screen that is fed by a fixture, which reads as "done" in a demo but is not usable on STG/QA\. The Appendix names the fixture or stub for each, so demos can be labelled accordingly\.

- Note
    - Knowledge Base is no longer a separate QA track : articles, review/approve, broadcast, banner and file manager are built, and KB is already embedded in the Case Panel \(`KB` tab\)\. The KB gaps are versioning, search and engagement features, listed in P6\.

# Action items

## P1\.  First priority

* [ ] CAD Auto Assign using Case Type

* [ ] CAD Auto Assign Round Robin

* [ ] CAD Auto Assign Load Balance

* [ ] CAD Auto Assign by Availability

* [ ] CAD Auto Assign by Department

* [ ] CAD GIS/MAP Configuration – Backend Integration

* [ ] CAD Assignment Rules – Backend Integration

* [ ] CAD On-Call Shift \& Roster Management

* [ ] CAD Route Optimization \& Drive-Time Analysis

* [ ] CAD Street View \(360° Panorama\)

* [ ] CAD Google Maps Provider

* [ ] CAD Queue Distribution Strategy Selector

* [ ] CAD Batch Dispatch \(Server-side\)

## P2\.  Second priority

* [ ] 3CX Call Control Adapter

* [ ] Supervisor Call Monitoring Backend \(Listen / Whisper / Barge-in\)

* [ ] Genesys Cloud CX Integration

* [ ] SIP Switch \(Freeswitch\) Integration

* [ ] Live Chat \(Web / LINE / WeChat\)

* [ ] Queue Management \(ACD\)

* [ ] Queue Performance Screen

* [ ] Call Detail Record \(CDR\) \& Call Recording

* [ ] Contact Center Dashboard KPI API

* [ ] Inbound / Outbound Trend Reports

* [ ] Inbound Email to Ticket

* [ ] Social Channel Ingestion \(Facebook / Instagram / X / Pantip / LinkedIn\)

* [ ] Video Call \(WebRTC\)

* [ ] Telephony Conference \& Consult Call

* [ ] Agent Workspace – Unified Chat \+ Voice Desktop

* [ ] Agent Workspace – Linked Assets / Services / Appointments

* [ ] CSAT / Post-Call Survey

## P3\.  Third priority 

* [ ] Multi-channel Case Intake \(Email / Social / Mobile\)

* [ ] Automatic Case Creation \(IoT / Monitoring Trigger\)

* [ ] Self-Service Portal

* [ ] Customer Case View \(External Status Tracking\)

* [ ] Duplicate Case Detection \& Linking

* [ ] Case Pause / Resume with SLA Suspension

* [ ] Case Reopen Workflow

* [ ] Workflow Multi-stage Approval

* [ ] Workflow Subtask Generation

* [ ] Workflow Dependency Handling

* [ ] Notification Channels \(Email / SMS / Web Push / Mobile Push\)

## P4 Fourth priority

* [ ] Customer Communication History \(Omnichannel Interaction Logs\)

* [ ] Customer Preferences \(Contact Window / Product Interests\)

* [ ] Customer Service Contracts \& Entitlements

## P5 Fifth priority

* [ ] Package Management

* [ ] Package \& Service Pricing

* [ ] Package–Service Bundle Mapping

* [ ] Service Entitlement \& SLA Validation

* [ ] Reorder Point / Minimum Stock Alerts

* [ ] Batch / Lot Tracking

* [ ] Sales Order Management

* [ ] Order Approval Workflow

* [ ] Inventory Allocation on Order Approval

* [ ] Pick List \& Packing Slip

* [ ] Delivery Tracking

* [ ] Proof of Delivery \(POD\)

* [ ] Orders Performance Dashboard

* [ ] Order ↔ Case / CAD Status Linkage

## P6 Sixth priority

* [ ] Article Version Control \& Rollback

* [ ] Semantic / Vector Search

* [ ] Article Comments \& Rating

* [ ] Knowledge Type Mapping \(Internal / External\)

* [ ] Helpful Index \& Automated Flagging

* [ ] Dashboard – Most Favorited \& Latest Comments

* [ ] KMS Search Analytics

* [ ] Knowledge API for AI Consumption

## P7 Seventh priority

* [ ] Contact Center Performance Reports

* [ ] Knowledge Base Reports

* [ ] SLA Dashboard \& Report

* [ ] Chat Performance Report

* [ ] Audit Report \(Exportable\)

## P8 Eighth priority

* [ ] AI Module \(/ai\)

* [ ] AI Copilot – Case Panel

* [ ] AI Copilot – Email Workspace

* [ ] AI-Assisted Classification \& Next Best Action

* [ ] API Gateway Integration

* [ ] Email Integration Service

* [ ] WFM Integration \(Scope TBC\)

## P9 Ninth priority

* [ ] Campaign Management

# Appendix

## A\.  Missing feature detail

### A\.1  CAD / GIS \(FR\-02\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        CAD Auto Assign using Case Type|        FR\-02 §2\.4 Case Type Routing|        Admin can select "Case Type" routing criterion and pick case types/sub\-types, plus AND/OR combine|        No engine consumes the setting; no server API stores it \(falls back to schema defaults\)|        `settings/assignment/SmartRoutingSettings.tsx:5` "Configuration only; no engine consumes the choice"; `settings/useOrgAssignmentRules.ts`|
|        CAD Auto Assign Round Robin|        FR\-02 §2\.5|        `allocationMethod: "round_robin"` exists as a type and default|        No round\-robin execution, no queue/rotation state, no audit of who is next|        `core/types/organization.ts:277`; `cms/utils/orgAssignmentRules.ts:50`|
|        CAD Auto Assign Load Balance|        FR\-02 §2\.5|        `allocationMethod: "load_balance"` exists as an enum value; unit workload query exists|        No load\-balance engine that picks the least\-loaded officer automatically|        `core/types/organization.ts:277`; `components/assignOfficer/workload/*`|
|        CAD Auto Assign by Availability|        FR\-02 §2\.4 Availability Routing|        Availability criterion is selectable in settings; agent state exists only inside the softphone|        Officer availability is not read by any assignment flow; no presence feed into CAD|        `SmartRoutingSettings.tsx:31`; `cc/types/agentStateCommand.ts`|
|        CAD Auto Assign by Department|        FR\-02 §2\.4 Department Routing|        Department criterion is selectable in settings|        No department\-based assignment execution|        `SmartRoutingSettings.tsx:30`|
|        CAD GIS/MAP Configuration – Backend Integration|        FR\-02 §2\.7 GIS/MAP Config|        Full Map Settings form \(basemap, layers, staff, incident, assignment\)|        Persists to a session stub only; GET/PATCH map\-settings endpoint not wired|        `settings/useOrgMapSettings.ts`; `settings/orgMapSettingsStub.ts:1-8`|
|        CAD Assignment Rules – Backend Integration|        FR\-02 §2\.7 / §3 Routing \& Assignment Rule|        Automatic/Manual mode, criteria, allocation method, AND/OR combine|        Same as above : stub storage, no server contract in use|        `settings/orgAssignmentRulesStub.ts:3-11`|
|        CAD On-Call Shift \& Roster Management|        FR\-02 §2\.7 / §3\.1\.2\-4|        Supervisor live\-call roster only \(who is on a call now\)|        No shift/roster administration \(primary/secondary on\-call, rotation calendar\)|        only `cc/components/supervision/RosterRow.tsx`; no roster admin route|
|        CAD Route Optimization \& Drive-Time Analysis|        FR\-02 §2\.3|        Single origin→destination route per officer with travel time and ETA/TTL|        No multi\-stop optimization \(VRP\) and no isochrone / drive\-time polygon analysis|        `map/staff/StaffSmartRoutingSection.tsx`; no `isochrone` / route\-optimization code in `src`|
|        CAD Street View \(360° Panorama\)|        FR\-02 §2\.2|        "Street" basemap style only|        360° street\-level imagery viewer \(BRD "Street View"\) is not implemented|        `map/basemaps.ts:14` \(basemap styles are "street" / "satellite" only\); no panorama code|
|        CAD Google Maps Provider|        FR\-02 §2\.2 Map Configuration|        Three providers : ArcGIS, MapTiler, Longdo|        Google Maps as a base/reference layer|        `core/config/api.ts:61` `MapProviderId = "arcgis" / "longdo" / "maptiler"`|
|        CAD Queue Distribution Strategy Selector|        FR\-02 §3\.1\.2\-4|        Allocation method picker exists in Assignment Rules|        No queue concept, so the queue distribution strategy has nothing to switch|        no queue/ACD module in `src`|
|        CAD Batch Dispatch \(Server-side\)|        FR\-02 §3\.1\.2\-4 Mass Allocation|        Batch selection of officers in the map staff panel \(cluster mode\)|        No bulk assignment endpoint / server\-side mass allocation job|        `assignOfficer/batchAssignSelection.ts:1-6`; `map/staff/StaffGroupPanel.tsx:321`|

### A\.2  Contact Center \(FR\-07\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        3CX Call Control Adapter|        FR\-07 §2\.2, FR07\-13|        Full toolbar UI; every call\-control endpoint declared \(make / answer / hold / resume / transfer / hang\-up\)|        Commands are stubbed : they only emit mock lifecycle events until the 3CX adapter exists|        `cc/components/softphone/useSoftphone.ts:11-13`; `cc/store/api/callControlApi.ts:113-155`|
|        Supervisor Call Monitoring Backend \(Listen / Whisper / Barge-in\)|        FR\-07 §2\.3, FR\-10 §2\.3|        Supervision board UI; listen / whisper / barge\-in / stop\-monitor endpoints declared|        No backend adapter, so monitoring cannot start on a live call|        `cc/store/api/callControlApi.ts:170-196`; `cc/components/supervision/*`|
|        Genesys Cloud CX Integration|        FR07\-12|        —|        Entire integration \(status sync, routing rules, interaction pull\)|        no `genesys` code in `src`; only `docs/genesys-integration.md`|
|        SIP Switch \(Freeswitch\) Integration|        FR07\-14|        —|        Entire integration \(ESL / SIP trunk control\)|        no `freeswitch` / SIP code in `src`|
|        Live Chat \(Web / LINE / WeChat\)|        FR\-10, FR07\-03|        Two routes exist behind the chat entitlement|        Chat service, agent chat UI, transcript — pages are placeholders|        `cc/App.tsx:41-59` comment "placeholder pages until the chat functionality ships"; `cc/pages/Workspace/LobbyIncoming.tsx`, `ChatHistory.tsx`|
|        Queue Management \(ACD\)|        FR07\-24|        Abandoned/missed counters are shown on the dashboard chart|        Queue model, distribution rules, waiting/priority handling, agent pickup|        no queue/ACD code in `src` \(only incoming\-call popup queue\)|
|        Queue Performance Screen|        FR07\-26|        —|        Real\-time waiting count, longest wait, abandon rate screen|        no queue screen; `reportConfig.json` has case \+ order groups only|
|        Call Detail Record \(CDR\) \& Call Recording|        FR07\-29|        Call events carry duration and end reason|        CDR list/detail, recording storage, playback, quality review|        no `CDR` / `recording` code in `src`|
|        Contact Center Dashboard KPI API|        FR07\-25, FR\-12|        Dashboard page with KPI cards, daily volume, call types, agent performance|        Endpoint does not exist yet — page renders a static fixture \(file banner: DORMANT BY DESIGN\)|        `cc/store/api/callCenterDashboardApi.ts:4-34`; `cc/components/dashboard/useCallCenterDashboard.ts:58,69`|
|        Inbound / Outbound Trend Reports|        FR07\-27, FR07\-28|        Daily call volume chart inside the dashboard \(fixture\)|        Period/trend reports per channel; outbound success\-rate reporting|        `cc/types/callCenterDashboard.ts:45-50` \(daily volume only\); no outbound report|
|        Inbound Email to Ticket|        FR07\-06|        E\-mail workspace \(inbox, reading pane, composer, AI copilot panel\)|        Automatic conversion of inbound e\-mail into a case/ticket; all data is fixture\-backed|        `cc/components/workspace/useEmailData.ts:6`; no ticket\-creation call in `cc/components/workspace/*`|
|        Social Channel Ingestion \(Facebook / Instagram / X / Pantip / LinkedIn\)|        FR07\-04, 05, 07, 08, 09, 10, 11|        Customer can store LINE / Facebook / TextChat identities; case source list ready to extend|        No message ingestion for any social channel; `caseSourceId` still unassigned, so the channels are not selectable as case sources|        `cms/utils/customerSocial.policy.ts:89-150` \("PENDING BACKEND" on `caseSourceId`\)|
|        Video Call \(WebRTC\)|        FR07\-02|        —|        Entire video call capability|        no `videoCall` / `WebRTC` code in `src`|
|        Telephony Conference \& Consult Call|        FR07\-16|        Mute / hold / transfer / hang\-up controls|        Mute is local component state \(no command\); no conference or consult/attended transfer|        `cc/components/softphone/CallControls.tsx:28`; no mute/conference endpoint in `callControlApi.ts`|
|        Agent Workspace – Unified Chat \+ Voice Desktop|        FR07\-17|        Softphone page \(voice only\) and separate e\-mail page|        One desktop where chat and voice coexist|        `cc/App.tsx:32-39`; `cc/pages/Workspace/ChatHistory.tsx` placeholder|
|        Agent Workspace – Linked Assets / Services / Appointments|        FR07\-19 … FR07\-23|        Contact detail shows customer profile \+ recent cases|        Owned products, service contracts, appointments not surfaced in the agent workspace \(they exist only in CMS customer view\)|        `cc/components/softphone/ContactDetail.tsx:22` \(`recentCases` only\)|
|        CSAT / Post-Call Survey|        FR07\-25|        `satisfactionPct` field reserved on the dashboard contract|        No capture mechanism, no survey screen|        `cc/types/callCenterDashboard.ts:38` "OMITTED while no CSAT capture mechanism exists"|

### A\.3  Case Management \(FR\-01\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Multi-channel Case Intake \(Email / Social / Mobile\)|        FR\-01 §2\.1|        Manually selectable case source \(CALL / METTLINK / METTRIQ / IOT-Alert / Other\)|        Real intake from e\-mail, social and mobile; social sources are appended only when backend assigns source ids|        `case/constants/caseConstants.tsx:32-47`; `customerSocial.policy.ts:170`|
|        Automatic Case Creation \(IoT / Monitoring Trigger\)|        FR\-01 §2\.1|        "IOT\-Alert" exists as a manual source option|        No automatic creation on IoT/monitoring trigger|        no `automaticCase` / auto\-create code in `src`|
|        Self-Service Portal|        FR\-01 §2\.6|        —|        Customer\-facing portal \(report a case, track status, search KB\)|        no portal module or route \(`src` contains `core`, `cms`, `cc`, `kms`, `ai` only\)|
|        Customer Case View \(External Status Tracking\)|        FR\-01 §2\.6|        Internal case detail/history screens only|        External view of case status and history for the reporter/customer|        same as above — no public route|
|        Duplicate Case Detection \& Linking|        FR\-01 §2\.4 Case Relationship|        Parent/child \(sub\-case\) linking works|        Duplicate\-case pairing / detection is absent|        no duplicate\-case code in `src`; child\-case only \(`case/linkedCases`, `SubCaseTab`\)|
|        Case Pause / Resume with SLA Suspension|        FR\-01 §2\.3 / §3\.1\.1 Status \& State Transition \(Next Phase\)|        Case status control exists|        Paused state with cached origin state and SLA timer suspension / resume|        no pause/resume case transition in `src`|
|        Case Reopen Workflow|        FR\-01 §2\.3 / §3\.1\.1 Status \& State Transition \(Next Phase\)|        Closed/cancelled states exist|        Reopen from Closed/Canceled back to New Case with result reset|        no reopen transition in `src`|
|        Workflow Multi-stage Approval|        FR\-01 §2\.3, §3\.1\.1 Approval Process|        SOP workflow builder with start / process / dispatch / decision / SLA / end nodes|        Approval node \(multi\-stage, parallel, amount condition\) is not part of the node model|        `cms/types/workflow.ts:17-24`|
|        Workflow Subtask Generation|        FR\-01 §3\.1\.1 Subtask Generation|        —|        Auto\-splitting one case into parallel subtasks|        same node model; no subtask generation code|
|        Workflow Dependency Handling|        FR\-01 §3\.1\.1 Dependency Handling|        Sequential connections exist in the builder|        Dependency gate \(task B opens only after task A is approved/closed\)|        same node model; no dependency guard in editor|
|        Notification Channels \(Email / SMS / Web Push / Mobile Push\)|        FR\-01 §2\.6 \(Next Phase\)|        In\-app notification center with realtime push over websocket|        The four external channels|        `core/store/api/notificationApi.ts`; `core/components/header/NotificationDropdown.tsx`; no SMS/push/email transport|

### A\.4  CRM \& Customer 360 \(FR\-03\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Customer Communication History \(Omnichannel Interaction Logs\)|        FR\-03 §2\.2|        Case history, internal notes, contact channels, appointment history|        Omnichannel interaction log \(call / e\-mail / SMS / chat entries against the customer\)|        `CustomerView.tsx` tabs = customer / appointment / product / service / contact channels / internal note; no interaction log|
|        Customer Preferences \(Contact Window / Product Interests\)|        FR\-03 §2\.1|        Preferred contact **channel** only \(`contractPreference`\)|        Preferred contact window and product interests|        `customerSocial.policy.ts` `FAMILY_BY_PREFERENCE` \(channel only\)|
|        Customer Service Contracts \& Entitlements|        FR\-03 §2\.3|        Customer can be linked to services \(add\-service tab, service tab in case panel\)|        Contract term / package / SLA entitlement attached to the customer|        `cms/store/api/customerService.ts`; no package or contract model \(see A\.5\)|

### A\.5  Product / Package \& Service / Order \(FR\-04, FR\-05, FR\-06\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Package Management|        FR\-05 §2\.1 \(Next Phase\)|        Services catalog only|        Package master data, package CRUD screens|        no package route/page/type in `src`|
|        Package \& Service Pricing|        FR\-05 §2\.2|        Products, spare parts and orders carry a `price`|        Pricing on packages and services \(flat / hourly / recurring\)|        `types/product.ts:56`, `types/inventory.ts:15`, `types/order.ts:124`; no price on service types|
|        Package–Service Bundle Mapping|        FR\-05 §2\.3|        —|        Bundle/dependency mapping between packages and services|        no package model in `src`|
|        Service Entitlement \& SLA Validation|        FR\-05 §2\.4|        Tenant\-level subscription entitlements exist \(module gating\)|        Per\-customer entitlement verification at case intake, and SLA chosen from the service contract|        `core/components/entitlements/*` is tenant\-level only; no entitlement check in create\-case flow|
|        Reorder Point / Minimum Stock Alerts|        FR\-04 §2\.3|        Stock levels, stock in/out, stock summary|        Minimum/safety stock thresholds and alerting|        no `reorderPoint` / `safetyStock` code in `src`|
|        Batch / Lot Tracking|        FR\-04 §2\.3|        Serial number tracking on inventory stock|        Lot/batch number grouping and expiry|        `crm/inventory/InventoryStock.tsx:80` \(serial only\); no batch/lot field|
|        Sales Order Management|        FR\-06 §2\.1|        Order API \(create / info / control / cancel / items\) used only by spare\-part requisition screens|        Sales\-order screens; no order list/detail route outside inventory request|        `cms/store/api/order.ts`; consumed by `crm/request/*` only; no order route in `cms/App.tsx`|
|        Order Approval Workflow|        FR\-06 §2\.1|        Order status control through a workflow|        Approval step/endpoint — `approveInventoryRequest` is commented out|        `cms/store/api/inventoryRequestApi.ts:78-80,133`|
|        Inventory Allocation on Order Approval|        FR\-06 §2\.2|        Stock in/out is manual|        Automatic reservation/cut of stock when an order is approved|        no allocation code in `src`|
|        Pick List \& Packing Slip|        FR\-06 §2\.3|        —|        Printable pick list / packing slip documents|        no `pickList` / `packingSlip` code in `src`|
|        Delivery Tracking|        FR\-06 §2\.3|        Order carries ship\-to / ship\-by addresses|        Carrier, tracking number, delivery status timeline|        no `trackingNumber` / carrier field anywhere in `src`|
|        Proof of Delivery \(POD\)|        FR\-06 §2\.4|        —|        Delivery photo, GPS point, e\-signature capture|        no POD code in `src`|
|        Orders Performance Dashboard|        FR\-06 §2\.6|        Order reports exist in the Jasper report page|        Dashboard for order volume/performance|        `components/report/reportConfig.json` \(order group = reports only\); no order dashboard page|
|        Order ↔ Case / CAD Status Linkage|        FR\-06 §2\.5|        Inventory request is its own module|        Spare\-part status pushed back to the case and to the dispatcher|        no case/CAD linkage in `crm/request/*`|

### A\.6  Knowledge Base \(FR\-08\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Article Version Control \& Rollback|        FR\-08 §2\.1|        Article DTO carries a `version` field|        Version history list, diff view, rollback to a previous version|        `kms/articles/dtos/articles.dto.ts:41`; no version\-history UI|
|        Semantic / Vector Search|        FR\-08 §2\.3 \(Next Phase\)|        Keyword/parameter search on the article list|        Semantic search / intent search|        no `semantic` / `vector` / `embedding` code in `src/kms`|
|        Article Comments \& Rating|        FR\-08 §2\.3 / §3\.1\.8 Comment \& Feedback|        Comment/rating DTOs and `getArticleComments` service call exist|        Not wired to the UI — the hook import is commented out|        `kms/articles/service/articles.service.ts:662`; `kms/articles/hook/useArticlesData.ts:8` \(commented\)|
|        Knowledge Type Mapping \(Internal / External\)|        FR\-08 §2\.4|        —|        Audience/target mapping per article or knowledge type|        no `knowledgeType` / `audience` mapping in `src/kms`|
|        Helpful Index \& Automated Flagging|        FR\-08 §2\.3, §3\.1\.8|        Dashboard text mentions "articles with below\-average ratings — flagged"|        Helpful\-index calculation and automatic flagging rules|        `kms/components/dashboard/KbActivityBlock/index.tsx:37` \(copy only\)|
|        Dashboard – Most Favorited \& Latest Comments|        FR\-08 §2\.3|        Dashboard has hero, metrics, trend, categories, articles, activity blocks|        Most\-favorited articles and latest\-comments widgets \(BRD marks both Next Phase\)|        `kms/dashboard/index.tsx`; no favorites widget, no comments widget|
|        KMS Search Analytics|        FR\-08 §2\.3|        Search\-analytics block exists in the code|        Disabled — the import is commented out of the dashboard|        `kms/dashboard/index.tsx:9` \(`// import KbSearchesBlock`\)|
|        Knowledge API for AI Consumption|        FR\-08 §2\.5|        KB is consumable inside the Case Panel \(`KB` tab\) and via case\-type→article mapping|        API surface for AI/Chatbot to pull knowledge|        no knowledge\-API client in `src`; chatbot scope cancelled \(FR\-09\)|

### A\.7  Reporting \& Analytics \(FR\-12\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Contact Center Performance Reports|        FR\-12 Agent / Queue Performance Report|        Call center dashboard UI \(fixture\-backed\)|        Report set for agent and queue performance|        `components/report/reportConfig.json` = case \+ order groups only|
|        Knowledge Base Reports|        FR\-12 Knowledge Dashboard|        KB dashboard widgets \(in\-app\)|        Report/export of KB usage|        same report config; no KB group|
|        SLA Dashboard \& Report|        FR\-12 SLA Dashboard, FR\-02 §2\.6|        SLA countdown per case, escalation rules, SLA breaching widgets on the service dashboard|        Standalone SLA dashboard/report across modules|        `core/components/widgets/*`, `cms/components/widgets/SLAMonitorWidget.tsx`; no SLA report entry|
|        Chat Performance Report|        FR\-12 Chat Performance, FR\-10 §2\.5|        —|        Entire chat reporting set \(no chat service yet, see A\.2\)|        no chat report in `reportConfig.json`|
|        Audit Report \(Exportable\)|        FR\-12 Audit Report|        Audit log page with filters, paging and per\-row action icons|        Consolidated audit report with export|        `core/pages/Admin/AuditLog.tsx` \(viewer only\)|

### A\.8  AI \& Automation \(FR\-14\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        AI Module \(/ai\)|        FR\-14|        Route mounted under the Super App shell|        Every page — renders 404 only|        `src/ai/App.tsx` \(single catch\-all `NotFound` route\)|
|        AI Copilot – Case Panel|        FR\-14, FR\-01 §2\.7|        A `Copilot` tab exists in the case panel|        Tab content is empty; no assistant service|        `cms/components/case/CasePanel.tsx:1222` \(`content: <></>`\)|
|        AI Copilot – Email Workspace|        FR\-14, §10 AI Copilot|        Copilot panel with suggestions / AI chat / SOP tabs|        No AI service; suggestions come from the e\-mail fixture|        `cc/components/workspace/EmailAiCopilot.tsx`; `cc/components/workspace/useEmailData.ts:6`|
|        AI-Assisted Classification \& Next Best Action|        FR\-01 §2\.7|        —|        Auto case classification, case summarization, next\-best\-action|        no AI client anywhere in `src/cms` \(`@/ai` is never imported\)|

### A\.9  Cross\-System Integration \(FR\-11\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        API Gateway Integration|        FR\-11|        All traffic goes through the BFF / GraphQL hybrid query layer|        Declared external gateway integration \(no client, no contract in repo\)|        `core/store/api/hybridBaseQuery.ts`, `core/utils/gqlMapper.ts` \(BFF only\)|
|        Email Integration Service|        FR\-11 Email Integration|        E\-mail workspace UI with its own API slice|        Service that actually receives/sends organisational e\-mail|        `cc/store/api/emailApi.ts`; UI is fixture\-backed \(`useEmailData.ts:6`\)|
|        WFM Integration \(Scope TBC\)|        FR\-11 WFM Integration — **conflicts with §9 Out of Scope \(Workforce Management Functions\)**|        —|        Entire integration; **confirm scope before estimating**|        no `WFM` code in `src`; BRD §9 line 5608|

### A\.10  Campaign Management \(§10 Road Map\)

|        **Feature**|        **BRD Ref**|        **Current state in codebase**|        **What is missing**|        **Codebase evidence**|
|---|---|---|---|---|
|        Campaign Management|        §10 Road Map — Campaign Management \(Next Phase\)|        —|        Entire module : campaign definition, target list, outbound dialing, campaign reporting|        no campaign code in `src`; only `docs/Campaign-Outbound-Technical-Discussion.md`|

## B\.  Features that are implemented \(not in the Action items\)

Listed so the survey is auditable — these were checked and deliberately **excluded**.

|        **Area**|        **Implemented capability**|        **Evidence**|
|---|---|---|
|        CMS|        Case create / assign / history / detail, SOP workflow builder, form builder, comments \+ @mentions, attachments, linked sub\-cases, SLA countdown, escalation rules, case results, calendar scheduling|        `cms/pages/Case/*`, `cms/pages/Workflow/*`, `cms/components/case/**`, `cms/components/escalation/*`|
|        CMS Admin|        Area, area template \+ versions, skill, unit, property, place, device, service type, case result, organization settings|        `cms/pages/Admin/*` routes in `cms/App.tsx:186-203`|
|        CAD/GIS|        3 map providers, boundary \(country/province/district\), place, device \(camera/hydrant/AED\), staff markers, clustering, filter, connector, trails, sketch, incident radius, legend, drag assign \+ undo, single route \+ ETA/TTL, dispatch dashboard, case summary by area heatmap|        `cms/components/case/createCase/map/**`, `cms/components/dashboard/dispatch/*`, `cms/pages/Dashboard/*`|
|        CRM|        Customer profile, contact channels, PII masking, internal notes, owned products, owned services, appointments \+ appointment types, customer form configuration|        `cms/components/customer/**`, `cms/pages/Customer/*`, `cms/pages/Appointment/*`|
|        Product / Inventory|        Product, spare part, brand, category, store, stock in/out with barcode, serial tracking, product dashboard, requisition order with workflow status|        `cms/pages/Crm/**`, `cms/components/crm/**`|
|        Contact Center|        Softphone toolbar UI, dialpad, incoming\-call screen pop, agent state, quick actions \(create case / call note / follow\-up / wrap\-up\), supervisor live roster, call center dashboard UI, e\-mail workspace UI|        `cc/components/softphone/**`, `cc/components/incomingCall/**`, `cc/components/supervision/**`, `cc/components/dashboard/**`|
|        Knowledge Base|        Articles \+ rich editor, categories \+ category manager, review/approve workflow, broadcast \+ log, banner management, file manager, source, KB dashboard, case type→article mapping, KB tab in case panel|        `kms/**`, `cms/components/case/CasePanel.tsx:1226-1237`|
|        Platform|        RBAC \+ permissions, tenant entitlements/subscription gating, audit log, notification center, websocket realtime, offline IndexedDB cache, i18n \(en/th/cn\), dashboard widget library, custom dashboard|        `core/components/**`, `core/store/**`, `core/providers/**`|

## C\.  How this list was verified

- Requirement side : BRD v1.4 headings and "Functional Capabilities" lists for §3\.1, FR\-01 … FR\-14, §5–§11 were extracted and read; every feature named in Appendix A carries the BRD section it comes from\.
- Code side : for each feature, the route tables \(`src/App.tsx`, `src/{cms,cc,kms,ai}/App.tsx`\), the page/component tree, and the RTK Query slices were inspected, plus a targeted search for the feature's identifiers\.
- "Missing" was only recorded when the search returned **no implementation**, or when the code itself states the limitation \(in\-code banners such as `DORMANT BY DESIGN`, `PENDING BACKEND`, `Used ONLY when VITE_MOCK_API`, `Configuration only; no engine consumes the choice`, commented\-out endpoints, or an empty tab\)\. Each such statement is quoted in Appendix A\.
- Backend items \(BFF / 3CX / SIP / Genesys\) are identified as such, because this repository is the frontend; where the backend is a separate codebase the gap is recorded as a dependency, not as a missing screen\.
- Paths in the "Codebase evidence" column are relative to `src/` unless they already start with `src/` or `docs/`\.
- This list covers capability gaps only\. Template/menu cleanup \(leftover TailAdmin demo pages in the sidebar\) is out of scope for this document\.
