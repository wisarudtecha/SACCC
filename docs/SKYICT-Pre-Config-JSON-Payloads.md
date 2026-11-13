# SKYICT Pre-Config — JSON Payload Package

JSON request bodies for pre-configuring the SKYICT tenant, built from
[`SKYICT-Tenant-Onboarding-Runbook-v2.md`](./SKYICT-Tenant-Onboarding-Runbook-v2.md) (Appendix C, S1–S12)
and [`SKYICT-Service-Center-Project-Prototype-v3.md`](./SKYICT-Service-Center-Project-Prototype-v3.md) (§4–§14),
and cross-referenced against the codebase so that **every payload matches a real create contract**.

Generated: 2026-11-10. Companion to [`db/seed/skyict/api-payloads/`](../db/seed/skyict/api-payloads/README.md)
(org structure, roles, users — files `01`–`06`). This document covers everything the runbook lists
**after** users exist: user groups, skills, area, service catalog (case types / sub-types /
workflows / case results), units + properties, CRM master data (brands / categories / stores /
products / spare parts / stock), contact config + customers, appointment types, knowledge base,
and the optional map-layer objects.

## 0. How to read this document

- Each section = one REST endpoint (what the app calls) with the JSON body(s) to send.
  `VITE_USE_GRAPHQL="true"` in every real environment, so the same call is compiled to GraphQL by
  `gqlMapper` (`src/core/utils/gqlMapper.ts`) — each section gives the direct GraphQL call as the
  reference form (operation / root / input), which also avoids the mapper's quirks.
- **`{{PLACEHOLDER}}` tokens** must be replaced with the server-returned business keys from
  earlier steps (same policy as `api-payloads/README.md` — never invent ids the app never sends).
- A payload whose body type is **inline-typed in an API file** (no named interface) or whose
  endpoint has **no `GQL_MAP` key** is flagged ⚠ and listed in
  [§31 Types / interfaces that must be added](#31-types--interfaces-that-must-be-added).
- Data values (EN/TH strings, codes, SLAs) are verbatim from the two source documents;
  see [§33 Machine verification](#33-machine-verification-of-transcribed-literals).

### Direct-call format (all REST-mapped mutations)

```json
{
  "query": "mutation ($input: <InputType>!) { <Root> { <Operation>(input: $input) { status msg data desc } } }",
  "variables": { "input": { ...body... } }
}
```

KMS (§27) is an island: its operations are sent as **inline `query` documents** (mutations declared
as `query`) with literal inputs, exactly as the code builds them — shown verbatim in that section.

### Transport caveats (verified in `src/core/utils/gqlMapper.ts` and the per-feature maps)

1. **`id: "add"` injection.** Where a literal REST path matches a `:id` pattern, the mapper merges
   `pathParams` into the GraphQL input. One case exists in this package: `POST /skill/add`
   matches `"/skill/:id"` (`src/cms/store/api/graphql/skillQueries.ts:41-48`), so a call through
   the app sends `SkillInput { id: "add", ... }`. **Send skills by direct call (§2).** Every other
   create in this package uses a literal key (`/user_groups/add`, `/casetypes/add`,
   `/casesubtypes/add`, `/countries/add`, `/mdm/units/add`, …) or a collection POST
   (`/workflows`, `/brand`, `/product`, …) — no `id` is injected.
2. **`POST /customer_service/add` has no `GQL_MAP` entry** — hard error in GraphQL mode.
   Workaround: direct call to the BFF (`CreateCustomerService` / `CustomerService` /
   `CustomerServiceInput!`, `src/cms/store/api/graphql/customerServiceQueries.ts:16-22`). ⚠ §21.
3. **`PATCH /role_permission/multi`** is the only GraphQL-reachable permission write
   (`UpdateRolePermissionMulti` / `RolePermissionMultiInput!`, `src/core/store/api/graphql/roleQueries.ts:56-72`).
   `POST /role_permission/add` has no mapping — use the body array in
   `db/seed/skyict/api-payloads/05-role-permissions.json` as-is (§29).
4. **The tenant/organization record is a platform prerequisite** — no create API exists in this
   repo. `{{ORG_ID}}`, `{{DEPT_ID_SKYICT}}`, `{{COMM_ID_CTR}}`, `{{STN_ID_01}}`/`{{STN_ID_02}}`
   come from the platform tenant + `api-payloads/01`–`03` (Thai names: โซนกลาง / สถานี 1 /
   สถานี 2 per runbook C.1).

### Execution order

| # | Step | Endpoint | Rows | Output placeholder(s) |
| --- | --- | --- | --- | --- |
| 1 | User groups | `POST /user_groups/add` | 8 | `{{GRP_ID_*}}` (8) |
| 2 | Skills | `POST /skill/add` (direct call) | 6 | `{{SKILL_ID_*}}` (6) |
| 3 | Area: country / province / districts | `POST /countries/add`, `/provinces/add`, `/districts/add` | 1 / 1 / 6 | — (codes are dataset codes) |
| 4 | Case types | `POST /casetypes/add` | 6 | `{{S_TYPE_ID_*}}` (6) |
| 5 | Workflows | `POST /workflows` | 5 | `{{WF_ID_*}}` (5) |
| 6 | Case sub-types | `POST /casesubtypes/add` | 6 | — (auto-syncs articles) |
| 7 | Case results | `POST /case/result/add` | 5 | — |
| 8 | Unit properties | `POST /mdm/properties/add` | 8 | `{{PROP_ID_*}}` (8) |
| 9 | Units | `POST /mdm/units/add` | 5 | — |
| 10 | Unit property bulk assign | `POST /mdm/units/properties/{unitId}/bulk` | 5 calls | — |
| 11 | Brands | `POST /brand` | 3 (all `product`) | `{{BRAND_ID_*}}` (3) |
| 12 | Categories | `POST /category` | 5 (2 `product` + 3 `part`) | `{{CATEGORY_ID_*}}` (5) |
| 13 | Stores | `POST /store` | 3 | `{{STORE_ID_HQ}}`, `{{STORE_ID_1}}`, `{{STORE_ID_2}}` |
| 14 | Products | `POST /product` | 5 | `{{PRODUCT_ID_*}}` (5) |
| 15 | Spare parts | `POST /spare_part` | 5 | `{{PART_ID_*}}` (5) |
| 16 | Product stock | `POST /product_stock/add` | 5 | — |
| 17 | Spare-part stock | `POST /spare_part_stock/add` | 5 | — |
| 18 | Customer form config | `POST /customer_form_config` | 1 | — |
| 19 | Customers | `POST /customer/add` | 3 | `{{CUSTOMER_ID_*}}` (3) |
| 20 | Customer product links | `POST /customer_product/add` | 3 | — |
| 21 | Customer service links ⚠ | `POST /customer_service/add` (direct call) | 3 | — |
| 22 | Dynamic case forms | `POST /forms` | 3 | form ids (binding via backend, ⚠) |
| 23 | Appointment types | `POST /appointment_types` | 3 | `{{APT_TYPE_ID_*}}` (3) |
| 24 | User-group memberships | `POST /user_groups/{grpId}/users/batch` | 7 calls | — |
| 25 | User skills | `POST /users_with_skills_batch/add` | 5 calls | — |
| 26 | User areas (optional) | `PATCH /users_with_area/{id}` | ≤5 calls | — |
| 27 | Knowledge base | KMS inline queries | 5 categories + 5 folders + 3 articles + 2 status moves + 2 mappings | `{{KB_*}}` |
| 28 | Places / devices (optional) | `POST /places`, `POST /devices` | 0 (templates) | |
| 29 | Role permissions (reference) | `PATCH /role_permission/multi` | 1 call | — |

Prerequisites (already covered by `api-payloads/01`–`06`): department SKYICT, 6 commands,
7 stations, 5 roles + permissions, 16 users, initial passwords via `POST /users/reset_password`
(`ResetPasswordInput = { email, username, newPassword }`, `src/core/types/user.ts:118-122`).

## 1. User groups — `POST /user_groups/add`

Body type: `UserGroupCreateData { active, en, th }` — `src/core/types/user.ts:321-325`
(`grpId` is server-generated; the create payload carries no id — same note at
`src/core/store/api/userApi.ts:136-144`).

GQL key: `"/user_groups/add"` (literal) → `CreateUserGroup` / `UserGroup` /
`UserGroupInsertInput!` — `src/core/store/api/graphql/userGroupQueries.ts:48-54,100-102`.

Data: v3 §4 (8 rows) = runbook C.2 (6 rows) plus `Dispatcher / ผู้กระจายงาน` and
`Operation / การปฏิบัติการ` from the v3 table. ⚠ **Source discrepancy (D2):** the runbook
Appendix C.2 lists only the first six groups and omits the last two that the v3 §4 table
carries — this package follows v3 (the data document) and keeps all eight; the two extra rows
are harmless KB-audience groups if the runbook set is kept instead.
`General / ทั่วไป` is expected to be created with the tenant (runbook C.2 note) — verify with
`GET /user_groups/all` first and skip it if present.

```json
[
  { "active": true, "en": "General", "th": "ทั่วไป" },
  { "active": true, "en": "Dispatch Group 1", "th": "กลุ่มกระจายงาน 1" },
  { "active": true, "en": "Dispatch Group 2", "th": "กลุ่มกระจายงาน 2" },
  { "active": true, "en": "Order Approval", "th": "อนุมัติคำสั่งซื้อ" },
  { "active": true, "en": "Technical", "th": "สายเทคนิค" },
  { "active": true, "en": "Agent", "th": "นักโทรฯ" },
  { "active": true, "en": "Dispatcher", "th": "ผู้กระจายงาน" },
  { "active": true, "en": "Operation", "th": "การปฏิบัติการ" }
]
```

One body per POST. Direct call:

```json
{
  "query": "mutation ($input: UserGroupInsertInput!) { UserGroup { CreateUserGroup(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Dispatch Group 1", "th": "กลุ่มกระจายงาน 1" } }
}
```

Capture each response's `grpId` → `{{GRP_ID_GENERAL}}`, `{{GRP_ID_DISPATCH_1}}`,
`{{GRP_ID_DISPATCH_2}}`, `{{GRP_ID_ORDER_APPROVAL}}`, `{{GRP_ID_TECHNICAL}}`, `{{GRP_ID_AGENT}}`,
`{{GRP_ID_DISPATCHER}}`, `{{GRP_ID_OPERATION}}`. The workflow node `group` config (§5) and the
member assignments (§24) reference these.

## 2. Skills — `POST /skill/add` (send as direct call)

Body type: `SkillCreateData { active, en, th }` — `src/cms/types/skill.ts:12-16`.

GQL key: the REST path matches `"/skill/:id"` (registered map
`src/cms/store/api/graphql/skillQueries.ts:41-49`, POST on `:45`), so a call through the app injects
`id: "add"` into `SkillInput`. Direct call avoids it:

```json
{
  "query": "mutation ($input: SkillInput!) { Skill { CreateSkill(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Investigation", "th": "การตรวจสอบ" } }
}
```

Data: v3 §8 / runbook C.4 — six business skills (used by sub-types in §6 and user assignments in
§25). ⚠ **Source discrepancy (D3):** the runbook C.4 gives the skills' **TH names**
(ตรวจสอบ / ซ่อมแซม / บริการ / บำรุงรักษา / สนับสนุนทั่วไป / ส่งต่อภายนอก), while the v3 §8
skill table has **EN names only** (no TH column). Thai is required by `SkillCreateData`, so the
runbook values are used; the v3-only definition text is shown in the second column for
reference. ⚠ **D4:** the v3 §8 *skill matrix* additionally lists `Emergency Response` as a
skill row (for `emergencyservice1/2`), but no `Emergency Response` skill appears in the v3 §5
sub-type `Skill` column or in runbook C.4 — it is therefore **not** part of the six required
skills; add it as a seventh only if the emergency responders are routed by skill.

| en | th (runbook C.4) | v3 §8 definition (reference) |
| --- | --- | --- |
| Investigation | ตรวจสอบ | ตรวจสอบหาสาเหตุ |
| Repair | ซ่อมแซม | ซ่อมแซมระบบที่พัง |
| Service | บริการ | บริการตามคำขอ |
| Maintenance | บำรุงรักษา | ซ่อมบำรุงเชิงป้องกัน |
| General Support | สนับสนุนทั่วไป | สนับสนุนทั่วไป |
| Outsource | ส่งต่อภายนอก | ส่งต่อหน่วยงานภายนอก |

```json
[
  { "active": true, "en": "Investigation", "th": "ตรวจสอบ" },
  { "active": true, "en": "Repair", "th": "ซ่อมแซม" },
  { "active": true, "en": "Service", "th": "บริการ" },
  { "active": true, "en": "Maintenance", "th": "บำรุงรักษา" },
  { "active": true, "en": "General Support", "th": "สนับสนุนทั่วไป" },
  { "active": true, "en": "Outsource", "th": "ส่งต่อภายนอก" }
]
```

Capture each response's `skillId` → `{{SKILL_ID_INVESTIGATION}}`, `{{SKILL_ID_REPAIR}}`,
`{{SKILL_ID_SERVICE}}`, `{{SKILL_ID_MAINTENANCE}}`, `{{SKILL_ID_GENERAL_SUPPORT}}`,
`{{SKILL_ID_OUTSOURCE}}`.

## 3. Area — `POST /countries/add` / `POST /provinces/add` / `POST /districts/add`

Body types — `src/cms/types/area.ts:126-136` (`CountryCreateData`), `:142-150`
(`AreaProvinceCreateData`), `:160-169` (`AreaDistrictCreateData`):
`active`, business code (`countryId`/`provId`/`distId`), `en`, `th`, `nameSpace`, optional
`coordinates`. `nameSpace: ""` for new records (`src/cms/components/admin/system-configuration/area/AreaManagement.tsx:107,119,132`).
The business codes are **client-supplied dataset codes** (the only ids the create types carry).

GQL keys (literal) — `src/cms/store/api/graphql/areaQueries.ts:220,227,234` →
`CreateCountry` / `CreateProvince` / `CreateDistrict`, root `Area`, inputs
`AreaCountryInput!` / `AreaProvinceInput!` / `AreaDistrictInput!`
(`areaQueries.ts:109-111,135-137,161-163`).

Data: v3 §9 / runbook C.8 (TH → 10 กรุงเทพมหานคร → 6 districts).

```json
// POST /countries/add
{ "active": true, "countryId": "TH", "en": "THAILAND", "th": "ไทย", "nameSpace": "" }
```

```json
// POST /provinces/add
{ "active": true, "countryId": "TH", "provId": "10", "en": "BANGKOK", "th": "กรุงเทพมหานคร", "nameSpace": "" }
```

```json
// POST /districts/add — six bodies, one per POST
[
  { "active": true, "countryId": "TH", "provId": "10", "distId": "01", "en": "PHRA NAKHON", "th": "พระนคร", "nameSpace": "" },
  { "active": true, "countryId": "TH", "provId": "10", "distId": "02", "en": "DUSIT", "th": "ดุสิต", "nameSpace": "" },
  { "active": true, "countryId": "TH", "provId": "10", "distId": "03", "en": "NONG CHOK", "th": "หนองจอก", "nameSpace": "" },
  { "active": true, "countryId": "TH", "provId": "10", "distId": "04", "en": "BANG RAK", "th": "บางรัก", "nameSpace": "" },
  { "active": true, "countryId": "TH", "provId": "10", "distId": "05", "en": "BANG KHEN", "th": "บางเขน", "nameSpace": "" },
  { "active": true, "countryId": "TH", "provId": "10", "distId": "06", "en": "BANG KAPI", "th": "บางกะปิ", "nameSpace": "" }
]
```

Direct call (district example):

```json
{
  "query": "mutation ($input: AreaDistrictInput!) { Area { CreateDistrict(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "countryId": "TH", "provId": "10", "distId": "01", "en": "PHRA NAKHON", "th": "พระนคร", "nameSpace": "" } }
}
```

No capture needed — `distId` is the dataset code and is what §26 user-area assignment references.

## 4. Case types — `POST /casetypes/add`

Body type: `CaseTypesCreateData { active, en, th }` — `src/cms/types/case.ts:328-332`.
⚠ **Correction vs runbook S7**: the runbook's field list mentions `typeId` on case-type create,
but the actual form sends only `{ active: true, th, en }`
(`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:433-437`); `typeId`
is server-generated (the response's `sTypeId` is what sub-types reference in §6).

GQL key: `"/casetypes/add"` (literal) → `CreateCaseType` / `CaseTypes` / `CaseTypeInput!` —
`src/cms/store/api/graphql/caseTypeQueries.ts:22-28,86`.

Data: v3 §5 / runbook C.6 (6 case types, codes 1001–1006). The codes are display labels in the
docs — the API generates `typeId`/`sTypeId`; capture them, don't send the codes.

```json
[
  { "active": true, "en": "IT Service", "th": "บริการ IT" },
  { "active": true, "en": "Repair", "th": "ซ่อมแซม" },
  { "active": true, "en": "Service", "th": "บริการทั่วไป" },
  { "active": true, "en": "Maintenance", "th": "ซ่อมบำรุง" },
  { "active": true, "en": "Outsourced", "th": "ส่งต่อภายนอก" },
  { "active": true, "en": "Emergency", "th": "แจ้งเหตุฉุกเฉิน" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseTypeInput!) { CaseTypes { CreateCaseType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "IT Service", "th": "บริการ IT" } }
}
```

Capture each response's `sTypeId` → `{{S_TYPE_ID_1001}}` … `{{S_TYPE_ID_1006}}` (in the order of
the array above: 1001 IT Service, 1002 Repair, 1003 Service, 1004 Maintenance, 1005 Outsourced,
1006 Emergency).

## 5. Workflows — `POST /workflows`

Body type: `WorkflowData { nodes: BaseNode[], connections: Connection[],
metadata: { title, description, status, totalSla? } }` — `src/cms/types/workflow.ts:112-124`;
`NodeType` `:18-24`; `Status` `:31-35`. ⚠ `BaseNode.data.config` is an untyped
`Record<string, unknown>` (`workflow.ts:70`) — the config keys below are the editor's own
convention (`src/cms/components/workflow/editor/ConfigPanel.tsx:305-371` for `sla`/`group`/`pic`,
`src/cms/mocks/workflowDefault.json:21-55` for `action`/`form`). No typed per-node config
interface exists → [§31 item 7](#31-types--interfaces-that-must-be-added).

GQL key: `"/workflows"` (collection) → `CreateWorkflow` / `Workflow` / `WorkFlowInput!` —
`src/cms/store/api/graphql/workflowQueries.ts:17-23,47-50`.

Node config conventions (from `workflowDefault.json` + `ConfigPanel.tsx`):

- `sla` — **string** minutes (the editor writes `e.target.value`, `ConfigPanel.tsx:319-321`).
- `group` — **array of `grpId`** from §1 (`Editor.tsx:173-175`).
- `pic` — **array of usernames** from `api-payloads/06-users.json` (`Editor.tsx:168-170`).
- `action`/`form` — free strings the SOP layer reads (`sopStepTranForm.tsx:226`).
- `start` node: `config: { continueFromWorkflow: false, sourceWorkflowId: "" }`;
  `end` node: `config: { allowContinuation: false, nextWorkflowId: "" }`
  (`workflowDefault.json:13-17,150-154`).

Data: v3 §6 / runbook C.6 — five case workflows, linear `Start → New → Assigned → Acknowledge →
Inprogress → Done → Closed → End` per the SLA table (totals 64/109/79/269/199 match the table's
`Total SLA` column). PIC groups: New = Agent group; Assigned/Acknowledge/Inprogress = the
dispatch + responder mix the v3 §6 checklist says to assign per node (dispatch groups for the
dispatching leg, responder users for the field leg) — use the group ids below; adjust `pic`
usernames per shift.

**SKYICT-Investigation Flow** (total 64 min):

```json
{
  "nodes": [
    { "id": "n1", "type": "start", "position": { "x": 20, "y": 80 },
      "data": { "label": "Start", "description": "Start case opening",
        "config": { "continueFromWorkflow": false, "sourceWorkflowId": "" } } },
    { "id": "n2", "type": "process", "position": { "x": 20, "y": 200 },
      "data": { "label": "New", "description": "Create new case",
        "config": { "action": "new", "form": "new", "sla": "1",
          "group": [ "{{GRP_ID_AGENT}}" ], "pic": [ "agent1", "agent2" ] } } },
    { "id": "n3", "type": "process", "position": { "x": 20, "y": 320 },
      "data": { "label": "Assigned", "description": "Dispatcher assigns case",
        "config": { "action": "assign", "form": "assign", "sla": "3",
          "group": [ "{{GRP_ID_DISPATCH_1}}", "{{GRP_ID_DISPATCH_2}}" ], "pic": [ "dispatcher1", "dispatcher2" ] } } },
    { "id": "n4", "type": "process", "position": { "x": 20, "y": 440 },
      "data": { "label": "Acknowledge", "description": "Responder acknowledges case",
        "config": { "action": "accept", "form": "accept", "sla": "5",
          "group": [ "{{GRP_ID_DISPATCHER}}" ], "pic": [ "responder1", "responder2" ] } } },
    { "id": "n5", "type": "process", "position": { "x": 20, "y": 560 },
      "data": { "label": "Inprogress", "description": "Responder works the case",
        "config": { "action": "resolve", "form": "resolve", "sla": "45",
          "group": [ "{{GRP_ID_OPERATION}}" ], "pic": [ "responder1", "responder2", "generalservice" ] } } },
    { "id": "n6", "type": "process", "position": { "x": 20, "y": 680 },
      "data": { "label": "Done", "description": "Dispatcher confirms completion",
        "config": { "action": "complete", "form": "complete", "sla": "5",
          "group": [ "{{GRP_ID_DISPATCH_1}}" ], "pic": [ "dispatcher1", "dispatcher2" ] } } },
    { "id": "n7", "type": "process", "position": { "x": 20, "y": 800 },
      "data": { "label": "Closed", "description": "Close case",
        "config": { "action": "close", "form": "close", "sla": "5",
          "group": [ "{{GRP_ID_AGENT}}" ], "pic": [ "agent1", "agent2" ] } } },
    { "id": "n8", "type": "end", "position": { "x": 20, "y": 920 },
      "data": { "label": "End", "description": "End case",
        "config": { "allowContinuation": false, "nextWorkflowId": "" } } }
  ],
  "connections": [
    { "id": "c1", "source": "n1", "target": "n2" },
    { "id": "c2", "source": "n2", "target": "n3" },
    { "id": "c3", "source": "n3", "target": "n4" },
    { "id": "c4", "source": "n4", "target": "n5" },
    { "id": "c5", "source": "n5", "target": "n6" },
    { "id": "c6", "source": "n6", "target": "n7" },
    { "id": "c7", "source": "n7", "target": "n8" }
  ],
  "metadata": {
    "title": "SKYICT-Investigation Flow",
    "description": "Investigation workflow for sub-types 3001 and 3901",
    "status": "active",
    "totalSla": 64
  }
}
```

The other four reuse the same 8-node shape; only `sla` values, title, description and `totalSla`
differ:

| title | New | Assigned | Acknowledge | Inprogress | Done | Closed | totalSla |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SKYICT-Repair Flow | "1" | "3" | "5" | "90" | "5" | "5" | 109 |
| SKYICT-Service Flow | "1" | "3" | "5" | "60" | "5" | "5" | 79 |
| SKYICT-Maintenance Flow | "1" | "3" | "10" | "240" | "10" | "5" | 269 |
| SKYICT-Outsourced Flow | "1" | "3" | "5" | "180" | "5" | "5" | 199 |

> **Orders workflow** (`Order Part`, 1/3/10/30/40/60/30/2880/5 = 3,059 min, v3 §6) is not
> creatable from the frontend: its status rows (`Create Order`, `Request`, …) come from the
> backend `OrderStatus`/`RequestStatus` catalogs, and the default orders workflow
> `SparePart - Do not Change / Delete` is a backend `app_configs` value — **UNVERIFIED** in this
> repo. Flagged in [§32](#32-unverified-values).

Direct call:

```json
{
  "query": "mutation ($input: WorkFlowInput!) { Workflow { CreateWorkflow(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the five bodies above" } }
}
```

Capture each response's `wfId` → `{{WF_ID_INVESTIGATION}}`, `{{WF_ID_REPAIR}}`, `{{WF_ID_SERVICE}}`,
`{{WF_ID_MAINTENANCE}}`, `{{WF_ID_OUTSOURCED}}`.

## 6. Case sub-types — `POST /casesubtypes/add`

Body type: `CaseSubTypesCreateData { active, caseSla, en, priority, sTypeCode, th, typeId,
unitPropLists, userSkillList, wfId, mDeviceType, mDeviceTypeName, mWorkOrderType }` —
`src/cms/types/case.ts:246-260`.

GQL key: `"/casesubtypes/add"` (literal) → `CreateCaseSubType` / `CaseSubTypes` /
`CaseSubTypeInput!` — `src/cms/store/api/graphql/caseTypeQueries.ts:57-63,95`.

Field notes (code-truth):

- `typeId` = the parent case type's **server-returned `sTypeId`** from §4 —
  `ServiceManagement.tsx:586,614` writes the selected type's `sTypeId`. ⚠ **Correction vs
  runbook**: it is *not* the document's code `1001`.
- `caseSla` — non-empty string; the form sends `caseSla.trim() || "0"` (`ServiceManagement.tsx:581`).
- `priority` — **string**; the UI Select is `"0"`…`"9"` (`ServiceManagement.tsx:1025-1033`).
  Views bucket it: 0 = Critical, 1–3 = High, 4–6 = Medium, 7–9 = Low
  (`PRIORITY_CONFIG`, `src/cms/utils/constants.ts:245-250`; `getTextPriority`,
  `src/cms/components/function/Prioriy.tsx:20-25`). The v3 label→token mapping (High → ?) is not
  stated anywhere in code → ⚠ UNVERIFIED, [§32 item 12](#32-unverified-values). The values below
  pick the midpoint of each label's bucket: High = `"2"`, Medium = `"5"`, Critical = `"0"` —
  adjust to taste; the bucket (and therefore the SLA view coloring) is what the label implies.
- `unitPropLists` — array of `propId` from §8; `userSkillList` — array of `skillId` from §2;
  `wfId` — from §5.
- On create the form automatically calls `SyncServiceTypeArticles` for the new sub-type
  (`ServiceManagement.tsx:605-622`) — the KB mapping step §27.5 is only needed for the
  pre-existing sub-types 3001/3901.

Data: v3 §5 sub-type table + §6 SLA totals (caseSla) + §8 skills. Six bodies:

```json
[
  {
    "active": true, "caseSla": "64", "en": "Telephony Hardware & IT Service", "th": "อุปกรณ์โทรศัพท์และระบบ IT",
    "priority": "2", "sTypeCode": "3001", "typeId": "{{S_TYPE_ID_1001}}",
    "unitPropLists": [ "{{PROP_ID_TELEPHONY}}" ], "userSkillList": [ "{{SKILL_ID_INVESTIGATION}}" ],
    "wfId": "{{WF_ID_INVESTIGATION}}",
    "mDeviceType": "TEL", "mDeviceTypeName": "Telephony Hardware", "mWorkOrderType": "IT Service"
  },
  {
    "active": true, "caseSla": "109", "en": "Hardware Repair", "th": "ซ่อมแซมฮาร์ดแวร์",
    "priority": "2", "sTypeCode": "3002", "typeId": "{{S_TYPE_ID_1002}}",
    "unitPropLists": [ "{{PROP_ID_HARDWARE}}" ], "userSkillList": [ "{{SKILL_ID_REPAIR}}" ],
    "wfId": "{{WF_ID_REPAIR}}",
    "mDeviceType": "HW", "mDeviceTypeName": "IT Hardware", "mWorkOrderType": "Repair"
  },
  {
    "active": true, "caseSla": "79", "en": "General IT Service", "th": "บริการ IT ทั่วไป (ติดตั้ง/จัดเตรียม)",
    "priority": "2", "sTypeCode": "3003", "typeId": "{{S_TYPE_ID_1003}}",
    "unitPropLists": [ "{{PROP_ID_IT_SERVICE}}" ], "userSkillList": [ "{{SKILL_ID_SERVICE}}" ],
    "wfId": "{{WF_ID_SERVICE}}",
    "mDeviceType": "IT", "mDeviceTypeName": "General IT", "mWorkOrderType": "Service"
  },
  {
    "active": true, "caseSla": "269", "en": "Preventive Maintenance", "th": "บำรุงรักษาเชิงป้องกัน",
    "priority": "5", "sTypeCode": "3101", "typeId": "{{S_TYPE_ID_1004}}",
    "unitPropLists": [ "{{PROP_ID_GENERAL_SERVICE}}" ], "userSkillList": [ "{{SKILL_ID_MAINTENANCE}}" ],
    "wfId": "{{WF_ID_MAINTENANCE}}",
    "mDeviceType": "PM", "mDeviceTypeName": "Preventive Maintenance", "mWorkOrderType": "Maintenance"
  },
  {
    "active": true, "caseSla": "199", "en": "Outsourced Service", "th": "งานส่งต่อหน่วยงานภายนอก",
    "priority": "5", "sTypeCode": "3201", "typeId": "{{S_TYPE_ID_1005}}",
    "unitPropLists": [ "{{PROP_ID_NOT_SPECIFY}}" ], "userSkillList": [ "{{SKILL_ID_OUTSOURCE}}" ],
    "wfId": "{{WF_ID_OUTSOURCED}}",
    "mDeviceType": "OUT", "mDeviceTypeName": "Outsourced", "mWorkOrderType": "Outsource"
  },
  {
    "active": true, "caseSla": "64", "en": "Emergency Outage", "th": "เหตุขัดข้องวิกฤต",
    "priority": "0", "sTypeCode": "3901", "typeId": "{{S_TYPE_ID_1006}}",
    "unitPropLists": [ "{{PROP_ID_EMERGENCY_RESPONSE}}" ], "userSkillList": [ "{{SKILL_ID_INVESTIGATION}}" ],
    "wfId": "{{WF_ID_INVESTIGATION}}",
    "mDeviceType": "EMG", "mDeviceTypeName": "Emergency", "mWorkOrderType": "Emergency"
  }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseSubTypeInput!) { CaseSubTypes { CreateCaseSubType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the six bodies above" } }
}
```

`unitPropLists` mapping note: the v3 §5 table column is `unitPropLists (Unit Properties)` —
Telephony / Hardware / IT Service / General Service / Not Spectify / Emergency Response, which
are exactly the §8 property names (see §8 for the id mapping).

## 7. Case results — `POST /case/result/add`

Body type: `CaseResultCreateData { active, en, th }` — `src/cms/types/caseResult.ts:29-33`
(`resId` is server-generated).

GQL key: `"/case/result/add"` (literal) → `CreateCaseResult` / `CaseResult` / `CaseResultInput!`
— `src/cms/store/api/graphql/caseResultQueries.ts:29-35,56`.

Data: v3 §11 / runbook C.12 (5 rows).

```json
[
  { "active": true, "en": "Work Completed", "th": "ปิดงานเรียบร้อย" },
  { "active": true, "en": "Resolved Remote", "th": "แก้ปัญหาทางไกล" },
  { "active": true, "en": "Customer Cancelled", "th": "ลูกค้ายกเลิก" },
  { "active": true, "en": "Transferred to Vendor", "th": "ส่งต่อผู้ขาย/ผู้ผลิต" },
  { "active": true, "en": "Duplicate Case", "th": "เคสซ้ำ" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseResultInput!) { CaseResult { CreateCaseResult(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Work Completed", "th": "ปิดงานเรียบร้อย" } }
}
```

> Case **statuses** (S001–S019) are a backend catalog, read-only `GET /case_status` — no create
> contract exists in this repo → [§31 item 4](#31-types--interfaces-that-must-be-added).

## 8. Unit properties — `POST /mdm/properties/add`

Body type: `PropertyCreateData { active, en, th }` — `src/cms/types/unit.ts:303-307`
(`propId` is server-generated).

GQL key: `"/mdm/properties/add"` (literal) → `CreateMdmProperty` / `MdmProperty` /
`MdmPropertyInput!` — `src/cms/store/api/graphql/mdmQueries.ts:108-114,138`.

Data: v3 §10 / runbook C.5 (8 rows). One body per POST; capture `propId` in the order below:
`{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_GENERAL_SERVICE}}`, `{{PROP_ID_EMERGENCY_RESPONSE}}`,
`{{PROP_ID_TELEPHONY}}`, `{{PROP_ID_NETWORK}}`, `{{PROP_ID_HARDWARE}}`, `{{PROP_ID_SOFTWARE}}`,
`{{PROP_ID_IT_SERVICE}}`.

```json
[
  { "active": true, "en": "Not Spectify", "th": "ไม่ระบุ" },
  { "active": true, "en": "General Service", "th": "งานบริการทั่วไป" },
  { "active": true, "en": "Emergency Response", "th": "ตอบเหตุฉุกเฉิน" },
  { "active": true, "en": "Telephony", "th": "ระบบโทรศัพท์" },
  { "active": true, "en": "Network", "th": "ระบบเครือข่าย" },
  { "active": true, "en": "Hardware", "th": "ฮาร์ดแวร์" },
  { "active": true, "en": "Software", "th": "ซอฟต์แวร์" },
  { "active": true, "en": "IT Service", "th": "บริการ IT" }
]
```

> Note: the EN name `Not Spectify` is spelled exactly as in the source document (v3 §10 table) —
> keep it consistent with the sub-type table §5, which references the same spelling.

Direct call:

```json
{
  "query": "mutation ($input: MdmPropertyInput!) { MdmProperty { CreateMdmProperty(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Telephony", "th": "ระบบโทรศัพท์" } }
}
```

## 9. Units — `POST /mdm/units/add`

Body type: `UnitFormData` — `src/cms/types/unit.ts:121-153`. Required:
`active, commId, compId, deptId, priority, stnId, unitId, unitName, unitSourceId, unitTypeId,
username`. The catalogs behind `commId`/`stnId`/`compId`/`unitTypeId`/`unitSourceId` are
**read-only** in this repo (`/mdm/types`, `/mdm/sources`, `/mdm/status`, `/mdm/companies` are GET
only — `src/cms/store/api/graphql/mdmQueries.ts:144-162`):

- `{{COMM_ID_CTR}}` (Center Zone) + `{{STN_ID_01}}` / `{{STN_ID_02}}` (Station 1/2) — from
  `api-payloads/02`/`03` (Thai โซนกลาง/สถานี 1/สถานี 2, runbook C.1).
- `{{COMP_ID_SKYICT}}`, `{{UNIT_TYPE_ID_STAFF}}`, `{{UNIT_SOURCE_ID_INTERNAL}}` — ⚠ BE-seeded
  catalogs; v3 §10 says Unit Type `Staff (ปฎิบัติงาน)`, Source `Internal (หน่วยภายใน)`; there is
  no create contract in this repo → [§31 items 1–3](#31-types--interfaces-that-must-be-added).
  Read the ids via `GET /mdm/companies`, `GET /mdm/types`, `GET /mdm/sources` first.
- `priority: 0` — v3 is silent; the unit form's default is `0`
  (`src/cms/components/admin/system-configuration/unit/UnitForm.tsx:39`) → ⚠ flag, [§32 item 2](#32-unverified-values).

GQL key: `"/mdm/units/add"` (literal) → `CreateMdmUnit` / `MdmUnit` / `MmdUnitInput!`
(the input name's doubled `m` is a real backend typo — `mdmQueries.ts:72-80,147`).

Data: v3 §10 / runbook C.5 — the table lists 7 rows, but UNIT-006/007 have **no username**
(reserved for future field units; a unit's `username` is required in the create contract, so
only the 5 user-backed units are created here; `unitName` = the Unit Name column, which the
v3 table sets equal to the Unit ID). The two documents agree on all 5 rows
(`responder1 / responder2 / generalservice / emergencyservice1 / emergencyservice2` at
Center Zone, Station 1 / 2 / 1 / 1 / 2 respectively). ⚠ **D5:** the runbook C.5 writes the
first property as `Not Specify` (spelled "Specify") while v3 §10 writes `Not Spectify` — the
sub-type table (v3 §5 / runbook C.6) also uses `Not Spectify`; the property is created once
with one spelling and both references must point to the same `propId`.
This package follows v3 and uses `Not Spectify`.

```json
[
  { "active": true, "unitId": "UNIT-001", "unitName": "UNIT-001", "username": "responder1",
    "priority": 0, "commId": "{{COMM_ID_CTR}}", "stnId": "{{STN_ID_01}}",
    "compId": "{{COMP_ID_SKYICT}}", "deptId": "{{DEPT_ID_SKYICT}}",
    "unitTypeId": "{{UNIT_TYPE_ID_STAFF}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "UNIT-002", "unitName": "UNIT-002", "username": "responder2",
    "priority": 0, "commId": "{{COMM_ID_CTR}}", "stnId": "{{STN_ID_02}}",
    "compId": "{{COMP_ID_SKYICT}}", "deptId": "{{DEPT_ID_SKYICT}}",
    "unitTypeId": "{{UNIT_TYPE_ID_STAFF}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "UNIT-003", "unitName": "UNIT-003", "username": "generalservice",
    "priority": 0, "commId": "{{COMM_ID_CTR}}", "stnId": "{{STN_ID_01}}",
    "compId": "{{COMP_ID_SKYICT}}", "deptId": "{{DEPT_ID_SKYICT}}",
    "unitTypeId": "{{UNIT_TYPE_ID_STAFF}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "UNIT-004", "unitName": "UNIT-004", "username": "emergencyservice1",
    "priority": 0, "commId": "{{COMM_ID_CTR}}", "stnId": "{{STN_ID_01}}",
    "compId": "{{COMP_ID_SKYICT}}", "deptId": "{{DEPT_ID_SKYICT}}",
    "unitTypeId": "{{UNIT_TYPE_ID_STAFF}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "UNIT-005", "unitName": "UNIT-005", "username": "emergencyservice2",
    "priority": 0, "commId": "{{COMM_ID_CTR}}", "stnId": "{{STN_ID_02}}",
    "compId": "{{COMP_ID_SKYICT}}", "deptId": "{{DEPT_ID_SKYICT}}",
    "unitTypeId": "{{UNIT_TYPE_ID_STAFF}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: MmdUnitInput!) { MdmUnit { CreateMdmUnit(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the five bodies above" } }
}
```

## 10. Unit property bulk assign — `POST /mdm/units/properties/{unitId}/bulk`

Body type: `UnitPropertyBulkAssignData { id, propIds }` — `src/cms/types/unit.ts:285-288`, where
`id` is the **unitId business code in the path** and the body carries only `{ propIds }`
(`src/cms/store/api/unitApi.ts:96-103`). ⚠ **The whole set is replaced per call** — an empty
`propIds` clears it; send the final set in one call per unit.

GQL key: `"/mdm/units/properties/:id/bulk"` → `BulkAssignUnitProperties` / `MdmUnit` /
`BulkUnitPropertiesInput!` — `src/cms/store/api/graphql/mdmQueries.ts:98-104,153` (the `:id`
merges into the input, so the direct call below includes `id`).

Data: v3 §10 unit-property matrix (each unit carries its specialty + the default
`Not Spectify`):

| unitId | propIds (placeholders) |
| --- | --- |
| UNIT-001 (responder1) | `{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_TELEPHONY}}`, `{{PROP_ID_NETWORK}}` |
| UNIT-002 (responder2) | `{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_HARDWARE}}`, `{{PROP_ID_SOFTWARE}}` |
| UNIT-003 (generalservice) | `{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_GENERAL_SERVICE}}`, `{{PROP_ID_IT_SERVICE}}` |
| UNIT-004 (emergencyservice1) | `{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_EMERGENCY_RESPONSE}}`, `{{PROP_ID_TELEPHONY}}` |
| UNIT-005 (emergencyservice2) | `{{PROP_ID_NOT_SPECIFY}}`, `{{PROP_ID_EMERGENCY_RESPONSE}}`, `{{PROP_ID_NETWORK}}` |

One body per call:

```json
{ "propIds": [ "{{PROP_ID_NOT_SPECIFY}}", "{{PROP_ID_TELEPHONY}}", "{{PROP_ID_NETWORK}}" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: BulkUnitPropertiesInput!) { MdmUnit { BulkAssignUnitProperties(input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "UNIT-001", "propIds": [ "{{PROP_ID_NOT_SPECIFY}}", "{{PROP_ID_TELEPHONY}}", "{{PROP_ID_NETWORK}}" ] } }
}
```

> The matrix above is the v3 §10 assignment intent made explicit; the document lists the
> property rows and the unit rows but does not draw the per-unit assignment table — treat the
> mapping as the proposed pre-config and adjust to the final org decision.

## 11. Brands — `POST /brand`

Body type: `BrandCreateData { en, th, active, type, image? }` — `src/cms/types/brand.ts:22-32`.
`type` is the product/part discriminator: the frontend constants are the **lowercase** strings
`["product", "part"]` (ProductView reads `"product"`, InventoryView reads `"part"` —
`src/cms/components/crm/product/BrandView.tsx:25`). ⚠ v3 §12's suggested convention
`Product`/`SparePart` is not what the code reads — use the lowercase tokens. `image` is a URL:
upload the logo to `/upload/brand` first and put the returned `attUrl` in `image`
(`brand.ts:27-32`); omit `image` if no logo file is prepared.

GQL key: `"/brand"` (collection) → `CreateBrand` / `Brand` / `BrandInput!` —
`src/cms/store/api/graphql/brandQueries.ts:21-27,49-52`.

Data: v3 §12 Brand-and-Category table (Grandstream, Cisco, Avaya — all product brands).
⚠ The v3 document suggests a `type` convention of `Product`/`SparePart`, but the frontend
constants are the **lowercase** strings `["product", "part"]` (BrandView reads `"product"`,
InventoryView reads `"part"` — `src/cms/components/crm/product/BrandView.tsx:25`,
`CategoryView.tsx:25`) — the code wins. The v3 spare-part table reuses the same brands
(Grandstream / Cisco) rather than defining new ones, so **3 brand rows total** (all
`"product"`); the "Belong to" column is an internal annotation with no system field →
[§31 item 11](#31-types--interfaces-that-must-be-added).

```json
[
  { "en": "Grandstream", "th": "Grandstream", "active": true, "type": "product", "image": "{{BRAND_IMG_GRANDSTREAM}}" },
  { "en": "Cisco", "th": "Cisco", "active": true, "type": "product", "image": "{{BRAND_IMG_CISCO}}" },
  { "en": "Avaya", "th": "Avaya", "active": true, "type": "product", "image": "{{BRAND_IMG_AVAYA}}" }
]
```

Capture `brandId` → `{{BRAND_ID_GRANDSTREAM}}`, `{{BRAND_ID_CISCO}}`, `{{BRAND_ID_AVAYA}}`
(products in §14 and spare parts in §15 reference these).

Direct call:

```json
{
  "query": "mutation ($input: BrandInput!) { Brand { CreateBrand(input: $input) { status msg data desc } } }",
  "variables": { "input": { "en": "Grandstream", "th": "Grandstream", "active": true, "type": "product" } }
}
```

## 12. Categories — `POST /category`

Body type: `CategoryCreateData { en, th, active, type }` — `src/cms/types/category.ts:14-19`
(same lowercase `"product" | "part"` tokens as brands — `CategoryView.tsx:25`).

GQL key: `"/category"` (collection) → `CreateCategory` / `Category` / `CategoryInput!` —
`src/cms/store/api/graphql/categoryQueries.ts:21-27,49-52`.

Data: v3 §12 — product categories from the main table (`Telephony`, `Network`); spare-part
categories from the "Spare Part Category" use-group table: `Telephony`, `Network`, and
`IT Hardware` (the third use-group). ⚠ `IT Hardware` has no TH name in the document →
placeholder below, [§32 item 16](#32-unverified-values).

```json
[
  { "en": "Telephony", "th": "ระบบโทรศัพท์", "active": true, "type": "product" },
  { "en": "Network", "th": "เครือข่าย", "active": true, "type": "product" }
]
```

```json
[
  { "en": "Telephony", "th": "ระบบโทรศัพท์", "active": true, "type": "part" },
  { "en": "Network", "th": "เครือข่าย", "active": true, "type": "part" },
  { "en": "IT Hardware", "th": "{{TH_NAME_IT_HARDWARE_CATEGORY}}", "active": true, "type": "part" }
]
```

Part-side TH names reuse the main category table's values (`Telephony = ระบบโทรศัพท์`,
`Network = เครือข่าย`, v3 §12 Brand-and-Category table) — the spare-part use-group table
itself carries no TH names. ⚠ `IT Hardware` has no TH name in the document → placeholder
below, [§32 item 16](#32-unverified-values).

Capture `categoryId` → `{{CATEGORY_ID_TELEPHONY_P}}`, `{{CATEGORY_ID_NETWORK_P}}`,
`{{CATEGORY_ID_TELEPHONY_S}}`, `{{CATEGORY_ID_NETWORK_S}}`, `{{CATEGORY_ID_IT_HARDWARE_S}}`.

Direct call:

```json
{
  "query": "mutation ($input: CategoryInput!) { Category { CreateCategory(input: $input) { status msg data desc } } }",
  "variables": { "input": { "en": "Telephony", "th": "ระบบโทรศัพท์", "active": true, "type": "product" } }
}
```

## 13. Stores — `POST /store`

Body type: `StoreCreateData { active, discount, en, th }` — `src/cms/types/store.ts:14-19`.
`discount` is required; v3's store table has no discount value → `0` (no discount) — ⚠ flag,
[§32 item 13](#32-unverified-values).

GQL key: `"/store"` (collection) → `CreateStore` / `Store` / `StoreInput!` —
`src/cms/store/api/graphql/storeQueries.ts:20-26,48-52`.

Data: v3 §12 (3 rows; the description column is an internal note only — the entity has no
description field, v3 Correction Note 12):

```json
[
  { "active": true, "discount": 0, "en": "HQ", "th": "ร้านค้าสำนักงานใหญ่" },
  { "active": true, "discount": 0, "en": "Store 1", "th": "คลังสินค้า 1" },
  { "active": true, "discount": 0, "en": "Store 2", "th": "คลังสินค้า 2" }
]
```

Capture `storeId` → `{{STORE_ID_HQ}}`, `{{STORE_ID_1}}`, `{{STORE_ID_2}}` (stock in §16/§17
and customer products in §20 reference these).

Direct call:

```json
{
  "query": "mutation ($input: StoreInput!) { Store { CreateStore(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "discount": 0, "en": "HQ", "th": "ร้านค้าสำนักงานใหญ่" } }
}
```

## 14. Products — `POST /product`

Body type: `ProductCreateData` (all fields optional) — `src/cms/types/product.ts:63-74`:
`active, brandId, categoryId, en, image?, mfd, price, productCode, th, warranty`.

GQL key: `"/product"` (collection) → `CreateProduct` / `Product` / `ProductInput!` —
`src/cms/store/api/graphql/productQueries.ts:18-24,43-46`.

Data: v3 §12 product table (5 rows; prices/warranty verbatim; `mfd` year 2025). `image` is a URL
like brands' (`product.ts:68`) — upload first or omit.

```json
[
  { "active": true, "en": "IP Phone", "th": "โทรศัพท์ IP", "productCode": "P-0001",
    "brandId": "{{BRAND_ID_GRANDSTREAM}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_P}}",
    "price": 3500, "mfd": 2025, "warranty": 24 },
  { "active": true, "en": "VoIP Gateway", "th": "VoIP Gateway", "productCode": "P-0002",
    "brandId": "{{BRAND_ID_GRANDSTREAM}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_P}}",
    "price": 15900, "mfd": 2025, "warranty": 24 },
  { "active": true, "en": "Network Switch", "th": "Network Switch", "productCode": "P-0003",
    "brandId": "{{BRAND_ID_CISCO}}", "categoryId": "{{CATEGORY_ID_NETWORK_P}}",
    "price": 12000, "mfd": 2025, "warranty": 36 },
  { "active": true, "en": "Access Point", "th": "Access Point", "productCode": "P-0004",
    "brandId": "{{BRAND_ID_CISCO}}", "categoryId": "{{CATEGORY_ID_NETWORK_P}}",
    "price": 8500, "mfd": 2025, "warranty": 36 },
  { "active": true, "en": "PBX Server", "th": "PBX Server", "productCode": "P-0005",
    "brandId": "{{BRAND_ID_AVAYA}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_P}}",
    "price": 120000, "mfd": 2025, "warranty": 36 }
]
```

Capture `productId` → `{{PRODUCT_ID_P0001}}` … `{{PRODUCT_ID_P0005}}`.

Direct call:

```json
{
  "query": "mutation ($input: ProductInput!) { Product { CreateProduct(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "IP Phone", "th": "โทรศัพท์ IP", "productCode": "P-0001", "brandId": "{{BRAND_ID_GRANDSTREAM}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_P}}", "price": 3500, "mfd": 2025, "warranty": 24 } }
}
```

## 15. Spare parts — `POST /spare_part`

Body type: `InventoryCreateData` (all optional) — `src/cms/types/inventory.ts:21-32`:
`active, brandId, categoryId, en, image?, mfd, price, productId?, th, warranty`.

GQL key: `"/spare_part"` (collection) → `CreateSparepart` / `Sparepart` / `SparePartInput!` —
`src/cms/store/api/graphql/inventoryQueries.ts:18-24,43-46`.

Data: v3 §12 spare-part table (5 rows; year 2025, warranty 12 months). Brands from the table's
Brand column (Grandstream / Cisco reuse the §11 brand rows); the HDMI cable's brand is `—` in
the document → `brandId` omitted there. ⚠ The "Belong to" column is an internal note with no
system field ([§31 item 11](#31-types--interfaces-that-must-be-added)); `productId` (optional,
links a part to a product row) is not given in the document → omitted.

```json
[
  { "active": true, "en": "Phone Cable RJ11", "th": "สายโทรศัพท์ RJ11",
    "brandId": "{{BRAND_ID_GRANDSTREAM}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_S}}",
    "mfd": 2025, "price": 150, "warranty": 12 },
  { "active": true, "en": "IP Phone Power Adapter", "th": "อะแดปเตอร์ไฟ IP Phone",
    "brandId": "{{BRAND_ID_GRANDSTREAM}}", "categoryId": "{{CATEGORY_ID_TELEPHONY_S}}",
    "mfd": 2025, "price": 250, "warranty": 12 },
  { "active": true, "en": "SFP Transceiver", "th": "โมดูล SFP",
    "brandId": "{{BRAND_ID_CISCO}}", "categoryId": "{{CATEGORY_ID_NETWORK_S}}",
    "mfd": 2025, "price": 2500, "warranty": 12 },
  { "active": true, "en": "CAT6 Cable", "th": "สาย LAN Cat6",
    "brandId": "{{BRAND_ID_CISCO}}", "categoryId": "{{CATEGORY_ID_NETWORK_S}}",
    "mfd": 2025, "price": 60, "warranty": 12 },
  { "active": true, "en": "HDMI Cable", "th": "สาย HDMI",
    "categoryId": "{{CATEGORY_ID_IT_HARDWARE_S}}", "mfd": 2025, "price": 200, "warranty": 12 }
]
```

Capture `partId` → `{{PART_ID_RJ11}}`, `{{PART_ID_ADAPTER}}`, `{{PART_ID_SFP}}`,
`{{PART_ID_CAT6}}`, `{{PART_ID_HDMI}}`.

Direct call:

```json
{
  "query": "mutation ($input: SparePartInput!) { Sparepart { CreateSparepart(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Phone Cable RJ11", "th": "สายโทรศัพท์ RJ11", "categoryId": "{{CATEGORY_ID_TELEPHONY_S}}", "price": 150, "warranty": 12 } }
}
```

## 16. Product stock — `POST /product_stock/add`

Body type: `ProductStockCreateData { Item: [{serialNumber}], active, productId, registerDate,
mfw, storeId }` — `src/cms/types/productStock.ts:63-70` (serials live in the `Item` array).

GQL key: `"/product_stock/add"` (literal) → `CreateProductStock` / `ProductStock` /
`ProductStockInput!` — `src/cms/store/api/graphql/productStockQueries.ts:25-31,55-57`.

Data: ⚠ **neither source document states product stock quantities or serial numbers** — the
v3 §12 product table carries price / year / warranty only. `{{QTY_P000X}}` / `{{SERIAL_P000X_*}}`
are placeholders to be filled from the org's procurement data; one call per product, all at HQ
(the v3 store table designates HQ the default store). `registerDate` = date the stock is
registered, `mfw` = the product's mfd date (the product rows use year 2025) — both are
free-text dates, use the actual registration date.

```json
[
  { "active": true, "productId": "{{PRODUCT_ID_P0001}}", "storeId": "{{STORE_ID_HQ}}",
    "registerDate": "{{REGISTER_DATE_P0001}}", "mfw": "2025-01-01",
    "Item": [ { "serialNumber": "{{SERIAL_P0001_01}}" }, "... {{QTY_P0001}} serials total" ] },
  { "active": true, "productId": "{{PRODUCT_ID_P0002}}", "storeId": "{{STORE_ID_HQ}}",
    "registerDate": "{{REGISTER_DATE_P0002}}", "mfw": "2025-01-01",
    "Item": [ { "serialNumber": "{{SERIAL_P0002_01}}" }, "... {{QTY_P0002}} serials total" ] },
  { "active": true, "productId": "{{PRODUCT_ID_P0003}}", "storeId": "{{STORE_ID_HQ}}",
    "registerDate": "{{REGISTER_DATE_P0003}}", "mfw": "2025-01-01",
    "Item": [ { "serialNumber": "{{SERIAL_P0003_01}}" }, "... {{QTY_P0003}} serials total" ] },
  { "active": true, "productId": "{{PRODUCT_ID_P0004}}", "storeId": "{{STORE_ID_HQ}}",
    "registerDate": "{{REGISTER_DATE_P0004}}", "mfw": "2025-01-01",
    "Item": [ { "serialNumber": "{{SERIAL_P0004_01}}" }, "... {{QTY_P0004}} serials total" ] },
  { "active": true, "productId": "{{PRODUCT_ID_P0005}}", "storeId": "{{STORE_ID_HQ}}",
    "registerDate": "{{REGISTER_DATE_P0005}}", "mfw": "2025-01-01",
    "Item": [ { "serialNumber": "{{SERIAL_P0005_01}}" }, "... {{QTY_P0005}} serials total" ] }
]
```

Direct call:

```json
{
  "query": "mutation ($input: ProductStockInput!) { ProductStock { CreateProductStock(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "productId": "{{PRODUCT_ID_P0001}}", "storeId": "{{STORE_ID_HQ}}", "registerDate": "2025-01-01", "mfw": "2025-01-01", "Item": [ { "serialNumber": "SK-IP-0001-0001" } ] } }
}
```

## 17. Spare-part stock — `POST /spare_part_stock/add`

Body type: `InventoryStockCreateData { partId, serialNumber: string[], storeId }` —
`src/cms/types/inventoryStock.ts:34-38` (flat serial-number array, one call per part per store).

GQL key: `"/spare_part_stock/add"` (literal) → `CreateSparepartStock` / `SparepartStock` /
`SparepartStockInput!` — `src/cms/store/api/graphql/inventoryStockQueries.ts:25-31,57-59`.

Data: ⚠ v3 §12 gives no spare-part quantities → placeholders, one call per part, all at HQ:

```json
[
  { "partId": "{{PART_ID_RJ11}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "{{SERIAL_RJ11_01}}" ] },
  { "partId": "{{PART_ID_ADAPTER}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "{{SERIAL_ADAPTER_01}}" ] },
  { "partId": "{{PART_ID_SFP}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "{{SERIAL_SFP_01}}" ] },
  { "partId": "{{PART_ID_CAT6}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "{{SERIAL_CAT6_01}}" ] },
  { "partId": "{{PART_ID_HDMI}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "{{SERIAL_HDMI_01}}" ] }
]
```

Direct call:

```json
{
  "query": "mutation ($input: SparepartStockInput!) { SparepartStock { CreateSparepartStock(input: $input) { status msg data desc } } }",
  "variables": { "input": { "partId": "{{PART_ID_SFP}}", "storeId": "{{STORE_ID_HQ}}", "serialNumber": [ "SK-SFP-0001" ] } }
}
```

## 18. Customer form config — `POST /customer_form_config`

Body type: `CustomerFormConfigType` — `src/cms/types/customer.ts:22-51`: flat booleans +
`address` / `currentAddress` (each an `AddressConfig` with 13 sub-flags, `customer.ts:3-17`) +
optional `social`, `dynamicForm`, `dynamicFormEnable`.

GQL key: `"/customer_form_config"` (collection) → `UpdateCustomerForm` / `CustomerForm` /
`CustomerFormConfigUpdateInput!` — `src/cms/store/api/graphql/customerFormQueries.ts:39-45,57-60`
(the app posts the config to this URL, `src/cms/store/api/custommerApi.ts:241-249`).

Data: v3 §13 default matrix — Y: `displayName`, `firstName`, `lastName`, `mobileNo`, `photo`,
`email`, both addresses (all 13 sub-fields), `userType`, `note`, `social`, `dynamicForm`;
N: `title`, `middleName`, `citizenId`, `dob`, `blood`, `gender`, `languagePreference`,
`contractPreference`.

```json
{
  "displayName": true, "title": false, "firstName": true, "middleName": false,
  "lastName": true, "citizenId": false, "dob": false, "blood": false, "gender": false,
  "mobileNo": true,
  "address": {
    "building": true, "country": true, "district": true, "floor": true, "lat": true,
    "lon": true, "no": true, "postalCode": true, "province": true, "road": true,
    "room": true, "street": true, "subDistrict": true
  },
  "photo": true, "email": true, "userType": true, "note": true,
  "languagePreference": false, "contractPreference": false,
  "social": true,
  "currentAddress": {
    "building": true, "country": true, "district": true, "floor": true, "lat": true,
    "lon": true, "no": true, "postalCode": true, "province": true, "road": true,
    "room": true, "street": true, "subDistrict": true
  },
  "dynamicFormEnable": true
}
```

Direct call:

```json
{
  "query": "mutation ($input: CustomerFormConfigUpdateInput!) { CustomerForm { UpdateCustomerForm(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "the body above" } }
}
```

`dynamicForm` (the embedded form object) is left to the server default — the v3 matrix marks the
*feature* enabled, not a specific form.

## 19. Customers — `POST /customer/add`

Body type: `AddCustomer` — `src/cms/types/customer.ts:54-104`. Required: `active`, `citizenId`,
`displayName`, `dob`, `email`, `gender`, `mobileNo`, `photo`, `title`, `userType`, `address`,
`currentAddress` (all sub-fields optional strings); optional: `firstName`, `lastName`,
`middleName`, `blood`, `landline`, `note`, `languagePreference`, `contractPreference`.

GQL key: `"/customer/add"` (literal) → `CreateCustomer` / `Customer` / `CustomerInput!` —
`src/cms/store/api/graphql/customerQueries.ts:25-31,50-52`.

Data: v3 §13 customer table (3 rows). ⚠ The document gives no title / DOB / gender / photo /
address values for the demo customers → `""` / `null` / `{{...}}` placeholders per the
`api-payloads/README.md` convention; fill from the demo data source.

```json
[
  {
    "active": true, "displayName": "Watee Thaiprasonk", "firstName": "Watee", "lastName": "Thaiprasonk",
    "email": "watee.tha@skyai.co.th", "mobileNo": "{{MOBILE_WATEE}}",
    "citizenId": "AI680013", "title": "", "dob": null, "gender": null,
    "photo": "{{PHOTO_WATEE}}", "userType": "{{USER_TYPE_WATEE}}",
    "address": { "country": "TH", "province": "กรุงเทพมหานคร" },
    "currentAddress": { "country": "TH", "province": "กรุงเทพมหานคร" }
  },
  {
    "active": true, "displayName": "Wisarud Techa", "firstName": "Wisarud", "lastName": "Techa",
    "email": "wisarud.tec@skyai.co.th", "mobileNo": "{{MOBILE_WISARUD}}",
    "citizenId": "AI680021", "title": "", "dob": null, "gender": null,
    "photo": "{{PHOTO_WISARUD}}", "userType": "{{USER_TYPE_WISARUD}}",
    "address": { "country": "TH", "province": "กรุงเทพมหานคร" },
    "currentAddress": { "country": "TH", "province": "กรุงเทพมหานคร" }
  },
  {
    "active": true, "displayName": "Apiwat Rodchuajeen", "firstName": "Apiwat", "lastName": "Rodchuajeen",
    "email": "apiwat.rod@skyai.co.th", "mobileNo": "{{MOBILE_APIWAT}}",
    "citizenId": "AI680018", "title": "", "dob": null, "gender": null,
    "photo": "{{PHOTO_APIWAT}}", "userType": "{{USER_TYPE_APIWAT}}",
    "address": { "country": "TH", "province": "กรุงเทพมหานคร" },
    "currentAddress": { "country": "TH", "province": "กรุงเทพมหานคร" }
  }
]
```

> Note: v3 §13 shows the employee ids (AI680013 / AI680021 / AI680018) — the API has no
> `empId` field on the customer contract, so they are stored here in `citizenId` to keep the
> mapping; adjust if the org uses a different PII convention.

Capture `customerId` → `{{CUSTOMER_ID_WATEE}}`, `{{CUSTOMER_ID_WISARUD}}`, `{{CUSTOMER_ID_APIWAT}}`.

Direct call:

```json
{
  "query": "mutation ($input: CustomerInput!) { Customer { CreateCustomer(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the three bodies above" } }
}
```

## 20. Customer product links — `POST /customer_product/add`

Body type: `AddProductData & { customerId }` — `src/cms/store/api/customerProduct.ts:14-19,64-71`
(`productId`, `purchaseDate`, `serialNumber`, optional `storeId`, + `customerId`).

GQL key: `"/customer_product/add"` (literal) → `CreateCustomerProduct` / `CustomerProduct` /
`CustomerProductInput!` — `src/cms/store/api/graphql/customerProductQueries.ts:17-23,42-44`.

Data: v3 §13 "customer → product → case" rows. The serial numbers must match §16 stock serials
(owned stock) — placeholders here:

```json
[
  { "productId": "{{PRODUCT_ID_P0001}}", "purchaseDate": "2025-06-01",
    "serialNumber": "{{SERIAL_P0001_WATEE}}", "storeId": "{{STORE_ID_HQ}}",
    "customerId": "{{CUSTOMER_ID_WATEE}}" },
  { "productId": "{{PRODUCT_ID_P0003}}", "purchaseDate": "2025-06-01",
    "serialNumber": "{{SERIAL_P0003_WISARUD}}", "storeId": "{{STORE_ID_HQ}}",
    "customerId": "{{CUSTOMER_ID_WISARUD}}" },
  { "productId": "{{PRODUCT_ID_P0002}}", "purchaseDate": "2025-06-01",
    "serialNumber": "{{SERIAL_P0002_APIWAT}}", "storeId": "{{STORE_ID_HQ}}",
    "customerId": "{{CUSTOMER_ID_APIWAT}}" }
]
```

> The case references in v3 §13 (Watee → IP Phone case 3001, Wisarud → Network Switch case 3001,
> Apiwat → VoIP Gateway case 3101) describe demo **cases to create manually after go-live**, not
> pre-config rows — no case-create payload belongs in this package.

Direct call:

```json
{
  "query": "mutation ($input: CustomerProductInput!) { CustomerProduct { CreateCustomerProduct(input: $input) { status msg data desc } } }",
  "variables": { "input": { "productId": "{{PRODUCT_ID_P0001}}", "purchaseDate": "2025-06-01", "serialNumber": "SK-IP-0001-0001", "storeId": "{{STORE_ID_HQ}}", "customerId": "{{CUSTOMER_ID_WATEE}}" } }
}
```

## 21. Customer service links ⚠ — `POST /customer_service/add` (direct call only)

Body: **inline-typed** `{ serviceId, customerId, serviceDate }` —
`src/cms/store/api/customerService.ts:24-31`. ⚠ No named interface ([§31 item 9](#31-types--interfaces-that-must-be-added)).

GQL key: ⚠ **missing** — `GQL_CUSTOMER_SERVICE` has only `/customer_service` (GET) and
`/customer_service/:id` (`customerServiceQueries.ts:40-48`), so a call through the app
**hard-errors under `VITE_USE_GRAPHQL=true`**. The BFF operation does exist
(`CreateCustomerService` / `CustomerService` / `CustomerServiceInput!`, `:16-22`) — call it
directly. Flagged as a `GQL_MAP` gap, [§31 item 10](#31-types--interfaces-that-must-be-added).

Data: ⚠ v3 §13's "Service Type" table maps customers to **case sub-types**, not to `ServiceType`
master rows — the repo's `ServiceType` create contract (`ServiceInsert { serviceId?, en, th,
priority, active, price, image? }`, `src/cms/types/serviceType.ts:21-29` →
`CreateServiceType` / `ServiceType` / `ServiceTypeInput!`,
`src/cms/store/api/graphql/serviceTypeQueries.ts:17-23,44-47`) has no concrete rows in either
document. If service links are needed, create `ServiceType` rows first (proposed, one per
customer use-case) and then:

```json
// proposed ServiceType rows (only if the org wants service master data)
[
  { "en": "IT Service", "th": "บริการ IT", "priority": "1", "active": true, "price": 0 },
  { "en": "Repair", "th": "ซ่อมแซม", "priority": "1", "active": true, "price": 0 }
]
```

```json
[
  { "serviceId": "{{SERVICE_ID_IT}}", "customerId": "{{CUSTOMER_ID_WATEE}}", "serviceDate": "2025-06-01" },
  { "serviceId": "{{SERVICE_ID_IT}}", "customerId": "{{CUSTOMER_ID_WISARUD}}", "serviceDate": "2025-06-01" },
  { "serviceId": "{{SERVICE_ID_REPAIR}}", "customerId": "{{CUSTOMER_ID_APIWAT}}", "serviceDate": "2025-06-01" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CustomerServiceInput!) { CustomerService { CreateCustomerService(input: $input) { status msg data desc } } }",
  "variables": { "input": { "serviceId": "{{SERVICE_ID_IT}}", "customerId": "{{CUSTOMER_ID_WATEE}}", "serviceDate": "2025-06-01" } }
}
```

## 22. Dynamic case forms — `POST /forms`

Body type: ⚠ **inline-typed** — `createForm` accepts
`{ active, formColSpan: number, formFieldJson: IndividualFormField[], formName, locks, publish,
formType }` (`src/cms/store/api/formApi.ts:159-182`); no named `FormCreateData` interface exists
([§31 item 9](#31-types--interfaces-that-must-be-added)). `formType` is `"case" | "customer"`
(`src/cms/utils/constants.ts:333-336`). Field shape per `IndividualFormField`
(`src/cms/components/interface/FormField.tsx:4-27`): `id` (the builder generates a UUID —
sequential ids work in the payload), `label`, `type`, `value` (default per type),
`showLabel`, `required`, `colSpan`, `isChild`, optional `options: string[]` (for
`option`/`select`/`radio`), `formRule` (validation rules only — `maxLength`, `maxSelections`,
…). The builder's own default factory confirms the shape
(`src/cms/components/form/dynamic-form/function.ts:71-143`: option-type `value` = `[]`,
text-type `value` = `""`, `formRule: {}`, `options` top-level). Field `type` vocabulary from
`src/cms/components/form/dynamic-form/constant.tsx:43-63` — `textInput`, `Integer`,
`textAreaInput`, `emailInput`, `option`, `select`, `radio`, `dateInput`, `dateLocal`, `image`,
`dndImage`, `multiImage`, `InputGroup`, `dynamicField`. ⚠ v3 §7's field types (Phone /
Multi-select / Datetime / Checkbox / Attachment) map to: Phone → `textInput` (no phone widget),
Multi-select → `option`, single Select → `select`, Datetime → `dateLocal`, Checkbox → `option`,
Attachment → `image` (closest available widget) — the mapping is a pre-config decision, not a
code contract.

GQL key: `"/forms"` (collection) → `CreateForms` / `Forms` / `FormInput!` —
`src/cms/store/api/graphql/formQueries.ts:31-37,56-59`.

Data: v3 §7 (3 forms; the Form Management List binds Form 1 to the Investigation/Service/
Maintenance/Outsourced flows, Form 2 to Repair, Form 3 to Investigation — the builder has no
"bind to sub-type" field, so binding happens server-side, ⚠ UNVERIFIED, [§32](#32-unverified-values)):

**Form 1 — Telephony Hardware & IT Service Form** (sub-type 3001):

```json
{
  "formName": "Telephony Hardware & IT Service Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "ชื่อผู้แจ้งปัญหา / บุคลากร", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f2", "label": "เบอร์มือถือติดต่อกลับ", "type": "textInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f3", "label": "อาคาร / ชั้น / หน่วยงาน", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{BUILDING_OPTIONS}}" ], "formRule": {} },
    { "id": "f4", "label": "อุปกรณ์ที่มีปัญหา", "type": "option", "value": [], "showLabel": true, "required": true, "colSpan": 2, "isChild": false,
      "options": [ "IP Phone", "Softphone", "VoIP Gateway", "Switch", "Router", "Access Point", "คอมพิวเตอร์", "อื่น ๆ" ], "formRule": {} },
    { "id": "f5", "label": "รุ่นอุปกรณ์ (Model)", "type": "textInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f6", "label": "Serial Number / Asset Tag", "type": "textInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f7", "label": "อาการเสีย", "type": "option", "value": [], "showLabel": true, "required": true, "colSpan": 2, "isChild": false,
      "options": [ "ไม่มีเสียง", "เสียงแตก", "สายหลุด", "เชื่อมต่อไม่ได้", "ไม่มีไฟ", "อื่น ๆ" ], "formRule": {} },
    { "id": "f8", "label": "รายละเอียดอาการเพิ่มเติม / หมายเหตุ", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f9", "label": "แนบรูปถ่ายอุปกรณ์ / จุดเกิดเหตุ", "type": "image", "value": null, "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} }
  ]
}
```

**Form 2 — Hardware Repair Form** (sub-type 3002):

```json
{
  "formName": "Hardware Repair Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "อุปกรณ์ที่ต้องการซ่อม", "type": "option", "value": [], "showLabel": true, "required": true, "colSpan": 2, "isChild": false,
      "options": [ "เครื่องคอมพิวเตอร์", "จอภาพ", "เครื่องพิมพ์", "อุปกรณ์ต่อพ่วง", "อื่น ๆ" ], "formRule": {} },
    { "id": "f2", "label": "Serial Number / Asset Tag", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f3", "label": "อาการ/ความเสียหาย", "type": "option", "value": [], "showLabel": true, "required": true, "colSpan": 2, "isChild": false,
      "options": [ "ไม่เปิดเครื่อง", "หน้าจอแตก", "ดิสก์เสีย", "สายขาด", "อื่น ๆ" ], "formRule": {} },
    { "id": "f4", "label": "ต้องการเปลี่ยนอะไหล่", "type": "option", "value": [], "showLabel": true, "required": false, "colSpan": 2, "isChild": false,
      "options": [ "{{CHECKBOX_OPTION_YES}}", "{{CHECKBOX_OPTION_NO}}" ], "formRule": {} },
    { "id": "f5", "label": "รายละเอียดเพิ่มเติม", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f6", "label": "แนบรูปถ่าย", "type": "image", "value": null, "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} }
  ]
}
```

**Form 3 — Emergency Outage Form** (sub-type 3901):

```json
{
  "formName": "Emergency Outage Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "ระบบ/บริการที่หยุดทำงาน", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f2", "label": "ช่วงเวลาที่เกิดเหตุ", "type": "dateLocal", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f3", "label": "ขอบเขตผลกระทบ (จำนวนผู้ใช้งาน/หน่วยงาน)", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f4", "label": "เบอร์ติดต่อกลับ onsite", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f5", "label": "สถานะเบื้องต้น ณ ตอนแจ้ง", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false,
      "options": [ "ล่มทั้งหมด", "ล่มบางส่วน", "ช้าผิดปกติ" ], "formRule": {} }
  ]
}
```

> v3 §7 field 2 of Form 2 reads `พิมพ์` — a truncation of `เครื่องพิมพ์` (printer) in the source
> table; the full word is used above. ⚠ The Form 2 "ต้องการเปลี่ยนอะไหล่" checkbox option
> values are not in the document → placeholders. ⚠ Form 1's "Form Management List" row shows the form
> shared by four workflows — a form-to-sub-type link is resolved at runtime via
> `GET /forms/casesubtype?id={sTypeId}` (`formApi.ts:202-209`), so no link field exists in the
> create body; the server-side link must be confirmed with the backend team.

## 23. Appointment types — `POST /appointment_types`

Body type: `AppointmentTypeInsert { appointmentTypeId?, en, th, active }` —
`src/cms/types/appointmentType.ts:14-19` (`appointmentTypeId` optional; the document gives none).

GQL key: `"/appointment_types"` (collection) → `CreateAppointmentType` / `AppointmentType` /
`AppointmentTypeInput!` — `src/cms/store/api/graphql/appointmentTypeQueries.ts:17-23,44-47`.

Data: v3 §13 / runbook C.11 (3 rows). The v3 "Stay Duration" column is a scheduling hint, not a
stored field ([§31 item 11](#31-types--interfaces-that-must-be-added) — no such field exists).

```json
[
  { "en": "General", "th": "ทั่วไป", "active": true },
  { "en": "Consult", "th": "ปรึกษา", "active": true },
  { "en": "Product Advise", "th": "แนะนำสินค้า", "active": true }
]
```

Capture `appointmentTypeId` → `{{APT_TYPE_ID_GENERAL}}`, `{{APT_TYPE_ID_CONSULT}}`,
`{{APT_TYPE_ID_PRODUCT_ADVISE}}` (needed only if appointments are seeded — the document defines
no demo appointments).

Direct call:

```json
{
  "query": "mutation ($input: AppointmentTypeInput!) { AppointmentType { CreateAppointmentType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "en": "General", "th": "ทั่วไป", "active": true } }
}
```

## 24. User-group memberships — `POST /user_groups/{grpId}/users/batch`

Body type: `{ usernames: string[] }` — `src/core/store/api/userApi.ts:189-196`
(`grpId` in the path; the batch **replaces** the group's member set).

GQL key: `"/user_groups/:id/users/batch"` → `AssignUserGroupBatch` / `UserGroup` /
`AssignUserGroupBatchInput!` — `src/core/store/api/graphql/userGroupQueries.ts:80-86,107-109`.

Data: derived from v3 §4 (group purposes) + §8 skill matrix + runbook C.3 users:

| grpId placeholder | usernames |
| --- | --- |
| `{{GRP_ID_GENERAL}}` | *(leave as seeded — default group)* |
| `{{GRP_ID_DISPATCH_1}}` | `dispatcher1`, `sompith.kit`, `chutikan.kon` |
| `{{GRP_ID_DISPATCH_2}}` | `dispatcher2`, `responder1` |
| `{{GRP_ID_ORDER_APPROVAL}}` | `sompith.kit`, `chutikan.kon` |
| `{{GRP_ID_TECHNICAL}}` | `responder1`, `responder2`, `generalservice` |
| `{{GRP_ID_AGENT}}` | `watee.tha`, `apiwat.rod`, `wisarud.tec`, `agent1`, `agent2` |
| `{{GRP_ID_DISPATCHER}}` | `dispatcher1`, `dispatcher2` |
| `{{GRP_ID_OPERATION}}` | `responder1`, `responder2`, `generalservice`, `emergencyservice1`, `emergencyservice2` |

```json
{ "usernames": [ "watee.tha", "apiwat.rod", "wisarud.tec", "agent1", "agent2" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: AssignUserGroupBatchInput!) { UserGroup { AssignUserGroupBatch(input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "{{GRP_ID_AGENT}}", "usernames": [ "watee.tha", "apiwat.rod", "wisarud.tec", "agent1", "agent2" ] } }
}
```

> Single-user variant: `POST /user_groups/{grpId}/users/add` with body `{ username }`
> (`userApi.ts:179-186` → `AssignUserGroup` / `AssignUserGroupInput!`,
> `userGroupQueries.ts:72-78,104-106`).
> The matrix above is the proposed assignment implied by the v3 group purposes; confirm the
> roster before running — usernames come from `api-payloads/06-users.json` (16 accounts).

## 25. User skills — `POST /users_with_skills_batch/add`

Body type: `UserWithSkillsBatchUpdateData { active, skillIds, userName }` —
`src/core/types/user.ts:45-49`.

GQL key: `"/users_with_skills_batch/add"` (literal) → `UpdateUserSkillBatch` / `UserSkill` /
`UserSkillBatchInput!` — `src/core/store/api/graphql/userQueries.ts:94-100,146-148`.
(The op is a *set* — one call per user.)

Data: derived from the v3 §8 skill matrix (responder1/responder2 → Investigation + Repair +
Service; generalservice → Service + Maintenance; emergencyservice1/2 → Investigation;
dispatcher1 → none needed, skill rows are for responders) + the sub-type `userSkillList`
already in §6:

| userName | skillIds (placeholders) |
| --- | --- |
| `responder1` | `{{SKILL_ID_INVESTIGATION}}`, `{{SKILL_ID_REPAIR}}`, `{{SKILL_ID_SERVICE}}` |
| `responder2` | `{{SKILL_ID_INVESTIGATION}}`, `{{SKILL_ID_REPAIR}}`, `{{SKILL_ID_SERVICE}}` |
| `generalservice` | `{{SKILL_ID_SERVICE}}`, `{{SKILL_ID_MAINTENANCE}}`, `{{SKILL_ID_GENERAL_SUPPORT}}` |
| `emergencyservice1` | `{{SKILL_ID_INVESTIGATION}}`, `{{SKILL_ID_GENERAL_SUPPORT}}` |
| `emergencyservice2` | `{{SKILL_ID_INVESTIGATION}}`, `{{SKILL_ID_GENERAL_SUPPORT}}` |

```json
{ "active": true, "userName": "responder1",
  "skillIds": [ "{{SKILL_ID_INVESTIGATION}}", "{{SKILL_ID_REPAIR}}", "{{SKILL_ID_SERVICE}}" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: UserSkillBatchInput!) { UserSkill { UpdateUserSkillBatch(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "userName": "responder1", "skillIds": [ "{{SKILL_ID_INVESTIGATION}}" ] } }
}
```

## 26. User areas (optional) — `PATCH /users_with_area/{id}`

Body type: `UserAreaUpdateData { id, distIds }` — `src/core/types/user.ts:96-99`, where `id`
is the **username in the path** and the body carries `{ distIds }`.

GQL key: `"/users_with_area/:id"` → `UpdateUserArea` / `UserArea` / `UserAreaInput!` —
`src/core/store/api/graphql/userQueries.ts:111-117,150-152`.

Data: ⚠ not specified in either document — the v3 §9 districts exist to scope responders.
Suggested: assign the six Bangkok districts to the field users (all of them, so routing has
coverage):

```json
{ "distIds": [ "01", "02", "03", "04", "05", "06" ] }
```

for `responder1`, `responder2`, `generalservice`, `emergencyservice1`, `emergencyservice2`
(`distId` = the dataset code from §3).

Direct call:

```json
{
  "query": "mutation ($input: UserAreaInput!) { UserArea { UpdateUserArea(input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "responder1", "distIds": [ "01", "02", "03", "04", "05", "06" ] } }
}
```

## 27. Knowledge base (KMS) — inline GraphQL documents

The KMS is an architectural island: its own `graphqlRequest` helper, **inline string queries**
(mutations declared as `query`), no RTK Query, no typed input interfaces for category/file
operations. The documents below are exactly the shapes the code builds
(`src/kms/articles/service/category.service.ts`, `src/kms/files/service/files.service.ts`,
`src/kms/articles-create-update/service/article-form.service.ts`). ⚠ No typed TS input
interface exists for any KMS create operation → [§31 items 5–6](#31-types--interfaces-that-must-be-added).

### 27.1 KB categories — `KBCategory.AddCategory`

Built at `category.service.ts:103-112` — inputs `{ name_th, name_en, parentId: number|null,
seq }`. Create parents before children; capture each returned category **key** (numeric id) —
`parentId` references the numeric id, and `categoryKey` on articles references the key.

Data: v3 §14 / runbook C.11 (5 categories, 3 levels):

```graphql
# root (Operations)
query { KBCategory { AddCategory(input: { name_th: "การแก้ไขปัญหา", name_en: "Operations", parentId: null, seq: 1 }) { statusCode success message data } } }
# L1 under Operations
query { KBCategory { AddCategory(input: { name_th: "ขั้นตอนการตรวจสอบ Server", name_en: "Procedures", parentId: {{KB_ID_OPERATIONS}}, seq: 1 }) { statusCode success message data } } }
# L2 under Procedures
query { KBCategory { AddCategory(input: { name_th: "ขั้นตอนการแก้ไขปัญหาโทรศัพท์ไม่มีเสียง", name_en: "No Audio Troubleshooting", parentId: {{KB_ID_PROCEDURES}}, seq: 1 }) { statusCode success message data } } }
# L1 under Operations
query { KBCategory { AddCategory(input: { name_th: "คู่มือใช้งาน", name_en: "User Manual", parentId: {{KB_ID_OPERATIONS}}, seq: 2 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "การแจ้งเหตุฉุกเฉิน", name_en: "Emergency Procedures", parentId: {{KB_ID_OPERATIONS}}, seq: 3 }) { statusCode success message data } } }
```

Capture: `{{KB_ID_OPERATIONS}}`, `{{KB_ID_PROCEDURES}}`, `{{KB_ID_NO_AUDIO}}`,
`{{KB_ID_USER_MANUAL}}`, `{{KB_ID_EMERGENCY}}`.

### 27.2 KB file folders — `KBArticlefile.CreateFolder`

Built at `files.service.ts:224-233` — inputs `{ folder: "<parent path with trailing />",
folderName }` (root folder = `""`). Data: v3 §14 File List — row 1 `SKYICT` (level 0) **is the root folder itself**; the five rows
created against it are Document, Training, User Manual, Emergency Contact List (level 1, under
SKYICT) and HandOver (level 2, under Training). The code's own helper derives exactly this
parent/child split from a path (`files.service.ts:224-233` — `folder` = parent path with
trailing `/`, `folderName` = last segment):

```graphql
# level 1, under the SKYICT root:
query { KBArticlefile { CreateFolder(input: { folder: "SKYICT", folderName: "Document" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYICT", folderName: "Training" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYICT", folderName: "User Manual" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYICT", folderName: "Emergency Contact List" }) { statusCode success message } } }
# level 2, under Training:
query { KBArticlefile { CreateFolder(input: { folder: "SKYICT/Training/", folderName: "HandOver" }) { statusCode success message } } }
```

File uploads have **no simple create mutation** — the pipeline is
`InitiateMultipart` → `PresignPart` → XHR PUT → `CompleteMultipart`
(`files.service.ts:323-384`). ⚠ No typed create-file contract exists → [§31 item 5](#31-types--interfaces-that-must-be-added).

### 27.3 KB articles — `KBArticles.CreateArticle`

Built at `article-form.service.ts:140-182`; variables type `ArticleCreateInput`, fields from
`ArticleFormInput` (`src/kms/articles-create-update/dtos/article-form.dto.ts:5-24`):
`title, version, description, priority: number|null, source: number|null, reserveDate,
ownership: number|null, relatedArticles: number[], categoryKey, attachments, content,
startDate, endDate, viewableGroups: number[], keywords: { id?, title }[]`.

⚠ The numeric catalog ids (`priority`, `source`, `ownership`, `viewableGroups`) are not given in
v3 §14 → `null` / `[]` placeholders, [§32 item 14](#32-unverified-values). `categoryKey` = the
category key from §27.1; `keywords` titles come from v3 §14.

```graphql
mutation ($input: ArticleCreateInput) {
  KBArticles { CreateArticle(input: $input) { success message data } }
}
```

```json
[
  {
    "title": "No Audio on IP Phone Troubleshooting", "version": "1.0",
    "description": "ขั้นตอนการแก้ไขปัญหาโทรศัพท์ไม่มีเสียง",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_KEY_PROCEDURES}}",
    "attachments": [], "content": "{{CONTENT_NO_AUDIO}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "โทรศัพท์" }, { "title": "ไม่มีเสียง" }, { "title": "VoIP" } ]
  },
  {
    "title": "Replacing LAN Cable & SFP Module", "version": "1.0",
    "description": "การเปลี่ยนสาย LAN / โมดูล SFP",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_KEY_OPERATIONS}}",
    "attachments": [], "content": "{{CONTENT_SFP}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "LAN" }, { "title": "SFP" }, { "title": "Switch" } ]
  },
  {
    "title": "PBX Quick Start Guide", "version": "1.0",
    "description": "คู่มือ PBX เบื้องต้น",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_KEY_USER_MANUAL}}",
    "attachments": [], "content": "{{CONTENT_PBX}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "PBX" }, { "title": "VoIP" }, { "title": "คู่มือ" } ]
  }
]
```

### 27.4 Article status transitions — `KBArticles.UpdateArticleStatus`

Built at `article-form.service.ts:218-248` — inputs `{ id, comment, status_id: number }`
(`ArticleStatusInput`, `article-form.dto.ts:54-59`). ⚠ The numeric `status_id` values for
`draft` / `review` / `published` are backend catalog rows (the code only carries the string
enum `draft|review|published|…`, `src/kms/articles/dtos/articles.dto.ts:5-15`) → read them from
the article's `nextstatus` list first, [§32 item 14](#32-unverified-values).

```graphql
mutation ($input: ArticleUpdateStatusInput) {
  KBArticles { UpdateArticleStatus(input: $input) { success message data } }
}
```

```json
[
  { "id": "{{KB_ART_NO_AUDIO}}", "comment": "Move to review", "status_id": "{{KB_STATUS_ID_REVIEW}}" },
  { "id": "{{KB_ART_SFP}}", "comment": "Move to review", "status_id": "{{KB_STATUS_ID_REVIEW}}" },
  { "id": "{{KB_ART_PBX}}", "comment": "Publish", "status_id": "{{KB_STATUS_ID_PUBLISHED}}" }
]
```

(Target states per v3 §14: article 1 → Draft (created in draft, no move), article 2 → Review,
article 3 → Published.)

### 27.5 Map articles to case sub-types — `KBCMSServiceTypeArticle.SyncServiceTypeArticles`

Built at `src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts:38-53`
— inputs `SyncServiceTypeArticleInput { cmsServiceTypeId: string, artId: number[] }`.
`cmsServiceTypeId` = the sub-type's service id (3001 / 3901 from §6). Runbook C.11: map article
1 → 3001, article 3 → 3901 (article 1 is also auto-synced by the §6 sub-type create for 3001,
`ServiceManagement.tsx:605-622` — re-running is idempotent by design of the UI).

```graphql
query ($input: SyncServiceTypeArticleInput) {
  KBCMSServiceTypeArticle { SyncServiceTypeArticles(input: $input) { success message data } }
}
```

```json
[
  { "cmsServiceTypeId": "{{CMS_SERVICE_TYPE_ID_3001}}", "artId": [ "{{KB_ART_NO_AUDIO}}" ] },
  { "cmsServiceTypeId": "{{CMS_SERVICE_TYPE_ID_3901}}", "artId": [ "{{KB_ART_PBX}}" ] }
]
```

## 28. Places & devices (optional map-layer objects)

Neither document lists concrete place/device rows for SKYICT — the runbook (S10) marks the
section optional for a first demo. Contracts, for when values are agreed:

- **Place** — `PlaceCreateData { en, th, category, latitude: number, longitude: number,
  active? }` (`src/cms/types/place.ts:50-58`; `category` is the controlled vocabulary
  `police_station | hospital | fire_station`, `place.ts:14`; coordinates are **numbers**).
  GQL key `"/places"` (collection) → `CreatePlace` / `Place` / `PlaceInput!`
  (`src/cms/store/api/graphql/placeQueries.ts:35-41,59-63`).

  ```json
  { "en": "SKYICT HQ", "th": "สำนักงานใหญ่ SKYICT", "category": "police_station", "latitude": "{{LAT_HQ}}", "longitude": "{{LNG_HQ}}", "active": true }
  ```

- **Device** — `DeviceCreateData { deviceId, en, th, deviceType, model, firmwareVer, ipAddress,
  macAddress, latitude: string, longitude: string, active }`
  (`src/cms/types/deviceIoT.tsx:33-45`). ⚠ `deviceId` is client-supplied and **unique
  table-wide (not per org)** — prefix per tenant (`SKYICT-…`); coordinates are **strings** here
  (unlike Place). GQL key `"/devices"` (collection) → `InsertDeviceIoT` / `Device` /
  `DeviceIoTInput!` (`src/cms/store/api/graphql/deviceIoTQueries.ts:45-51,68-72`).

  ```json
  { "deviceId": "SKYICT-CAM-001", "en": "CAM 001", "th": "กล้องวงจรปิด 001", "deviceType": "camera", "model": "{{MODEL}}", "firmwareVer": "{{FW}}", "ipAddress": "{{IP}}", "macAddress": "{{MAC}}", "latitude": "{{LAT_CAM}}", "longitude": "{{LNG_CAM}}", "active": true }
  ```

## 29. Role permissions (reference) — `PATCH /role_permission/multi`

Not new data — the 5 roles' permission rows are already shaped for this endpoint in
`db/seed/skyict/api-payloads/05-role-permissions.json` (body = array of
`RolePermissionsCreateData` rows → `UpdateRolePermissionMulti` /
`RolePermissionMultiInput!`, `src/core/store/api/graphql/roleQueries.ts:56-72`). The v3 §2
permission matrix (12 function rows × 4 roles) is the checklist that file's rows were derived
from; re-derive only if the matrix changes. `permId` values must come from the tenant's own
permission catalog (runbook §5 S3).

## 30. What this package intentionally does NOT cover

- **Tenant / organization creation** — platform-side, no API in this repo (runbook §1).
- **Organization structure, roles, users** — `db/seed/skyict/api-payloads/01`–`06`.
- **Case statuses** (S001–S019) and **order/request statuses** — backend catalogs, read-only
  from the frontend.
- **Demo cases / appointments / orders** — runtime data, created by users after go-live; the
  v3 §13 customer→case rows are a demo script, not pre-config.
- **Map settings / assignment rules / escalation rules** (runbook S11) — frontend contracts
  ahead of the backend (FE-ahead, [§31 item 8](#31-types--interfaces-that-must-be-added));
  assignment-rules Save reports "not saved to server", map settings render defaults only.

## 31. Types / interfaces that must be added

Surfaces where the codebase has **no create contract** (or an incomplete one) for data the two
documents require. Each is needed either as a new frontend type + endpoint, or must be seeded
backend-side before this package can run end-to-end.

| # | Missing surface | What exists today | Needed for |
| --- | --- | --- | --- |
| 1 | `UnitTypeCreateData` + create endpoint | `/mdm/types` is GET-only (`mdmQueries.ts:162`) | §9 `unitTypeId` — `Staff (ปฎิบัติงาน)` must be BE-seeded |
| 2 | `SourceCreateData` + create endpoint | `/mdm/sources` is GET-only (`mdmQueries.ts:161`) | §9 `unitSourceId` — `Internal (หน่วยภายใน)` / `External (หน่วยภายนอกองค์กร)` must be BE-seeded |
| 3 | `CompanyCreateData` + create endpoint | `/mdm/companies` is GET-only (`mdmQueries.ts:160`) | §9 `compId` — company `SKYICT` must be BE-seeded |
| 4 | Case Status create/update contract | `GET /case_status` read-only (`serviceApi.ts:13-21`, `status.tsx:11-32`) | S001–S019 catalog adjustments, if any |
| 5 | Typed `KBCategoryAddInput` / file-create contract | Inline string queries only (`category.service.ts:103-112`; upload pipeline `files.service.ts:323-384`), mutations declared as `query` | §27.1/§27.2 — no typed input, no simple "create file" mutation |
| 6 | Typed `ArticleCreateInput` / `ArticleUpdateStatusInput` interfaces | Variables built from `ArticleFormInput` (`article-form.service.ts:140-182`); status ids are backend catalog numbers | §27.3/§27.4 — numeric catalog ids untyped/unlisted |
| 7 | Per-node `WorkflowNodeConfig` interface | `BaseNode.data.config` is `Record<string, unknown>` (`workflow.ts:70`); keys (`action`, `form`, `sla`, `group`, `pic`) live only in editor components + the mock JSON | §5 — config keys are convention, not contract |
| 8 | Org Settings / Map Settings / Assignment Rules **write** contract (FE-ahead) | `GET/PATCH /organizations/{orgId}/map-settings` + `/assignment-rules` mapped (`organizationQueries.ts:213-221`) but backend endpoints/columns missing (`organization.ts:132-149,253-274`); escalation rules have no registered section | Runbook S11 — map settings display-only, assignment Save shows "not saved" banner |
| 9 | Named interfaces for inline-typed create bodies | `createForm` body inline (`formApi.ts:159-174`); `addCustomerService` body inline (`customerService.ts:24-31`) | §21 — extract `CreateCustomerServiceData { serviceId, customerId, serviceDate }` (and `FormCreateData` if forms are seeded) |
| 10 | `GQL_MAP` literal key for `POST /customer_service/add` | Only `/customer_service` (GET) + `/customer_service/:id` (`customerServiceQueries.ts:40-48`) | §21 — app call hard-errors in GraphQL mode; workaround = direct call |
| 11 | Spare-part "Belong to" field; appointment "Stay Duration" field; KB numeric catalogs (`priority`/`source`/`ownership`/`viewableGroups` ids) | v3 §12 marks "Belong to" as internal note only; v3 §13 stay-duration is a hint; KMS catalogs are backend data | Optional — no system field exists for any of them |
| 12 | Exact `priority` token per label (High/Medium/Critical) | UI is a raw `"0"`…`"9"` Select (`ServiceManagement.tsx:1025-1033`); view buckets 0=Critical, 1–3=High, 4–6=Medium, 7–9=Low (`constants.ts:245-250`, `Prioriy.tsx:20-25`) | §6 — label→token mapping is a product decision, not in code |
| 13 | `StoreCreateData.discount` value | Required number (`store.ts:14-19`); v3 store table has no discount column | §13 — use `0`, confirm with the org |
| 14 | KB article content (`content`) + numeric catalog ids | v3 §14 lists titles/keywords/category/status only, no body text | §27.3/§27.4 — `{{CONTENT_*}}` and `{{KB_STATUS_ID_*}}` placeholders |
| 15 | Default orders workflow `SparePart - Do not Change / Delete` | No such string in frontend code; v3 marks it **UNVERIFIED** (backend `app_configs`) | Orders demo — confirm with backend team |
| 16 | `IT Hardware` spare-part category TH name | v3 §12 spare-part table gives EN only | §12 — placeholder `{{TH_NAME_IT_HARDWARE_CATEGORY}}` |
| 17 | Concrete `ServiceType` master rows for customer-service links | v3 §13 maps customers to *case sub-types*, not to `ServiceType` rows | §21 — proposed rows only, org decision |

## 32. Unverified values

Values that could not be confirmed against code or that require an org decision before the
package is final:

1. `priority` token per sub-type (§6): `2`/`5`/`0` chosen as bucket midpoints — label→token is
   not documented anywhere (item 12 above).
2. Unit `priority: 0` (§9): v3 silent; form default used (`UnitForm.tsx:39`).
3. Store `discount: 0` (§13): v3 silent; required field.
4. `IT Hardware` category TH name (§12): not in v3 → placeholder.
5. KB numeric ids — `priority`/`source`/`ownership`/`viewableGroups`/`status_id` (§27): backend
   catalog rows; read them from the live KMS before sending.
6. Default orders workflow `SparePart - Do not Change / Delete`: **UNVERIFIED** (v3 Correction
   Note 11), backend `app_configs`.
7. Customer PII values (title/DOB/gender/photo/address/mobility) (§19): not in the documents →
   placeholders.
8. Product & spare-part serial numbers + stock quantities (§16/§17): **absent from both
   documents** (the v3 §12 product table carries price/year/warranty only; no stock column)
   → `{{QTY_*}}`/`{{SERIAL_*}}` placeholders.
9. Workflow node `pic` rosters & `action`/`form` strings (§5): conventions from
   `workflowDefault.json`; node→group→user mapping is the proposed assignment.
10. Group membership matrix (§24) & user-skill matrix (§25): derived from v3 group purposes +
    skill matrix — confirm the roster.
11. User-area district assignment (§26): proposed, not in the documents.
12. `type` convention `"product"`/`"part"` for brands/categories: verified in frontend code, but
    v3 §12's note suggests `Product`/`SparePart` — the code wins (lowercase), re-verify against
    the tenant's existing rows (`GET /brand`) before first use.
13. Form → sub-type/workflow binding (§22): the builder has no link field (v3 §7 note;
    `formApi.ts:202-209`); the runtime lookup is `GET /forms/casesubtype?id={sTypeId}` — confirm
    with the backend how the link is stored/created.

## 33. Machine verification of transcribed literals

The en/th strings, codes and numeric values in this document were machine-checked (not
eyeballed) by [`verify-skyict-preconfig.ps1`](./verify-skyict-preconfig.ps1), which runs two
checks:

1. **Coverage** — 227 data literals transcribed from the source documents (group/skill/case-type
   en+th names, business codes `3001`…`3901` / `P-0001`…`P-0005` / `UNIT-001`… /
   `TH`·`10`·`01`–`06`, workflow titles + SLA figures 1/3/5/10/45/60/90/180/240 and totals
   64/109/79/269/199/3,059, prices 3500/15900/12000/8500/120000 + 150/250/2500/60/200,
   emails, employee ids, KB categories/folders/article titles + keywords) must appear verbatim
   in this file.
2. **Faithfulness** — every Thai (non-ASCII, Thai-letter) string in this file (123 unique) must
   be a substring of `SKYICT-Service-Center-Project-Prototype-v3.md` or
   `SKYICT-Tenant-Onboarding-Runbook-v2.md`, so no Thai literal was invented. Two deliberate
   expansions are allow-listed in the script: `เครื่องพิมพ์` (v3 §7's truncated `พิมพ์`) and the
   device-template example `กล้องวงจรปิด`.

Result (2026-11-10): **PASS — 0 mismatches**. The only other deliberate deviations from the
sources are the flagged ones: priority tokens (§32.1), `discount: 0` (§32.3), the
`Not Spectify` spelling choice (D5), lowercase `type` tokens (§32.12), `nameSpace: ""`, and
placeholder values for data absent from both documents (§32).

Re-run after any edit: `pwsh -File docs/verify-skyict-preconfig.ps1` (exit code 1 on failure).
