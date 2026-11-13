# SKYCC Pre-Config — JSON Payload Package

JSON request bodies for pre-configuring the **SKYCC** tenant (an outsourced contact-center / BPO
operator), built from
[`SKYCC-Tenant-Onboarding-Runbook.md`](./SKYCC-Tenant-Onboarding-Runbook.md) (§5 S0–S16 and
Appendix C, the SKYCC data set) and
[`SKYCC-Service-Center-Project-Prototype.md`](./SKYCC-Service-Center-Project-Prototype.md)
(the tenant-setup worksheet), and cross-referenced against this codebase so that **every payload
matches a real create contract**.

Generated: 2026-11-11. Modelled on
[`SKYICT-Pre-Config-JSON-Payloads.md`](./SKYICT-Pre-Config-JSON-Payloads.md) — same section shape,
same evidence discipline, same placeholder policy.

> **There is no `db/seed/skycc/` folder.** The SKYICT package could point at
> `db/seed/skyict/api-payloads/01`–`06` for organization, roles and users; SKYCC has no such seed,
> so this document covers the **whole** sequence, including §1–§6 (organization → users). That is
> the one structural difference from the SKYICT package.

## 0. How to read this document

- Each section = one REST endpoint (what the app calls) with the JSON body(s) to send.
  `VITE_USE_GRAPHQL="true"` in every real environment, so the same call is compiled to GraphQL by
  `gqlMapper` (`src/core/utils/gqlMapper.ts`) — each section gives the direct GraphQL call as the
  reference form, which also avoids the mapper's quirks.
- **`{{PLACEHOLDER}}` tokens** must be replaced with server-returned business keys from earlier
  steps (same policy as `db/seed/skyict/api-payloads/README.md`: never invent ids the app never
  sends).
- A payload whose body type is **inline-typed in an API file** (no named interface) or whose
  endpoint has **no `GQL_MAP` key** is flagged ⚠ and listed in
  [§25 Types / interfaces that must be added](#25-types--interfaces-that-must-be-added).
- Data values (EN/TH strings, codes, SLAs) are transcribed from the two source documents;
  see [§28 Machine verification](#28-machine-verification-of-transcribed-literals) for the
  executable proof. Where the two documents disagree, the runbook's Appendix C wins and the
  disagreement is listed in [§27](#27-corrections-and-source-discrepancies).

### Direct-call format (all REST-mapped mutations)

```json
{
  "query": "mutation ($input: <InputType>!) { <Root> { <Operation>(input: $input) { status msg data desc } } }",
  "variables": { "input": { "{{BODY_FROM_THE_SECTION}}": "" } }
}
```

KMS (§22) is an island: its operations are sent as **inline `query` documents** (mutations declared
as `query`) with literal inputs, exactly as the code builds them — shown verbatim in that section.

### Transport caveats (verified in `src/core/utils/gqlMapper.ts` and the per-feature maps)

1. **`id: "<literal>"` injection.** Where a REST path with a literal tail matches a `:id` pattern,
   the mapper merges `pathParams` into the GraphQL input. Four cases exist in this package:
   - `POST /departments/add`, `/commands/add`, `/stations/add` match `/departments/:id`,
     `/commands/:id`, `/stations/:id` (`src/core/store/api/graphql/organizationQueries.ts:183-210`)
     → `DepartmentInput { id: "add", ... }` etc.
   - `POST /role/add` matches `/role/:id` (`src/core/store/api/graphql/roleQueries.ts:56-63`)
     → `RoleInput { id: "add", ... }`.
   - `POST /skill/add` matches `/skill/:id`
     (`src/cms/store/api/graphql/skillQueries.ts:41-49`) → `SkillInput { id: "add", ... }`.

   If the BFF's input types carry no `id` field, that is a `BAD_USER_INPUT`, not a payload problem.
   **Send §1–§4 and §10 as direct calls.** Every other create here uses a literal key
   (`/users/add`, `/user_groups/add`, `/casetypes/add`, `/casesubtypes/add`, `/mdm/units/add`,
   `/customer/add`, …) or a collection POST (`/workflows`, `/forms`, `/appointment_types`,
   `/customer_form_config`) — no `id` is injected.
2. **`POST /role_permission/add` has no GraphQL mapping** — absent from `GQL_ROLE`
   (`src/core/store/api/graphql/roleQueries.ts:56-72`). Use `PATCH /role_permission/multi`
   (`UpdateRolePermissionMulti` / `RolePermissionMultiInput!`, same file `:69-71`), whose body is
   the array already shaped below (§5).
3. **`POST /customer_form_config` is the update endpoint**, not a create — the app posts the whole
   config every time (`src/cms/store/api/custommerApi.ts:241-249` → `UpdateCustomerForm` /
   `CustomerFormConfigUpdateInput!`, `src/cms/store/api/graphql/customerFormQueries.ts:57-60`).
4. **The tenant/organization record is a platform prerequisite.** No tenant-create API exists in
   this repository (`src/core/store/slices/entitlementSlice.ts:5-8` still describes it as a TODO).
   `{{ORG_ID}}` comes from the platform tenant record.
5. **`wfType` is load-bearing, not decoration.** The sub-type form loads its workflow dropdown with
   `useGetWorkflowsQuery({ wfType: "case" })` (`src/cms/pages/Admin/ServiceManagement.tsx:58`), and
   the workflow editor only renders the case-status `action` select when
   `metadata.wfType === "case"` (`src/cms/components/workflow/editor/ConfigPanel.tsx:249-269`). A
   case workflow created without `wfType: "case"` is invisible to both.

### Execution order

Order is the runbook's dependency chain (§5 S1–S15), not alphabetical — each step consumes ids
produced by an earlier one.

| # | Step | Endpoint | Rows | Output placeholder(s) |
| --- | --- | --- | --- | --- |
| 1 | Departments | `POST /departments/add` (direct call) | 4 | `{{DEPT_ID_*}}` (4) |
| 2 | Commands | `POST /commands/add` (direct call) | 7 | `{{COMM_ID_*}}` (7) |
| 3 | Stations | `POST /stations/add` (direct call) | 9 | `{{STN_ID_*}}` (9) |
| 4 | Roles | `POST /role/add` (direct call) | 7 | `{{ROLE_ID_*}}` (7) |
| 5 | Role permissions | `PATCH /role_permission/multi` | 1 call (7 role blocks) | — |
| 6 | Users | `POST /users/add` | 12 | `{{USER_ID_*}}` (12, only needed for reference) |
| 7 | Initial passwords | `POST /users/reset_password` | 12 calls | — |
| 8 | User groups | `POST /user_groups/add` | 8 | `{{GRP_ID_*}}` (8) |
| 9 | Group memberships | `POST /user_groups/{grpId}/users/batch` | 7 calls | — |
| 10 | Skills | `POST /skill/add` (direct call) | 8 | `{{SKILL_ID_*}}` (8) |
| 11 | Unit properties | `POST /mdm/properties/add` | 8 | `{{PROP_ID_*}}` (8) |
| 12 | Units (seats) | `POST /mdm/units/add` | 4 of 6 | — |
| 13 | Unit property assign | `POST /mdm/units/properties/{unitId}/bulk` | 4 calls | — |
| 14 | Workflows | `POST /workflows` | 5 | `{{WF_ID_*}}` (5) |
| 15 | Case types | `POST /casetypes/add` | 5 | `{{S_TYPE_ID_*}}` (5) |
| 16 | Case sub-types | `POST /casesubtypes/add` | 15 | `{{SUBTYPE_ID_*}}` (15, needed by §22.5) |
| 17 | User skills | `POST /users_with_skills_batch/add` | 5 calls | — |
| 18 | Contact configuration | `POST /customer_form_config` | 1 | — |
| 19 | Appointment types | `POST /appointment_types` | 4 | `{{APT_TYPE_ID_*}}` (4) |
| 20 | Dynamic forms | `POST /forms` | 4 | form ids (⚠ §25 item 7) |
| 21 | Case results | `POST /case/result/add` | 7 | — |
| 22 | Knowledge base | KMS inline queries | 10 categories + 5 folders + 3 articles + 2 status moves + 1 mapping | `{{KB_*}}` |
| 23 | Organization settings (assignment rules) ⚠ | `PATCH /organizations/{orgId}/assignment-rules` | 1 | — |

Prerequisites (platform-side, **not** in this package): the tenant/organization record
(`{{ORG_ID}}`), the permission catalog (`permId` values), the case-status catalog (`statusId`
values), the unit **type** / **source** / **company** catalogs, and the KMS numeric catalogs
(`priority` / `source` / `ownership` / `viewableGroups` / `status_id`). See §25.

## 1. Departments — `POST /departments/add` (send as direct call)

Body type: `DepartmentCreateData { active, en, th }` — `src/core/types/organization.ts:25-29`
(`deptId` is server-generated; the create type carries no id).

GQL key: the REST path matches `"/departments/:id"` (`src/core/store/api/graphql/organizationQueries.ts:195`),
so a call through the app injects `id: "add"` into `DepartmentInput`. Direct call avoids it:

```json
{
  "query": "mutation ($input: DepartmentInput!) { Department { CreateDepartment(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Telesales", "th": "ขายทางโทรศัพท์" } }
}
```

Data: runbook C.1 — the "Service-line first" model (D3 in the runbook): the department is the
**service line**, because assignment rules route by department
(`src/core/types/organization.ts:280-290`) and SKYCC has no site field. Four departments, deduped
from the nine C.1 rows:

```json
[
  { "active": true, "en": "Inbound Customer Service", "th": "บริการลูกค้าขาเข้า" },
  { "active": true, "en": "Telesales", "th": "ขายทางโทรศัพท์" },
  { "active": true, "en": "Technical Support", "th": "สนับสนุนเทคนิค" },
  { "active": true, "en": "Back Office", "th": "งานปฏิบัติการหลังบ้าน" }
]
```

One body per POST. Capture `deptId` → `{{DEPT_ID_INBOUND_CS}}`, `{{DEPT_ID_TELESALES}}`,
`{{DEPT_ID_TECH}}`, `{{DEPT_ID_BACKOFFICE}}`.

> The runbook's 4th department row (C.1 #8) reads `Back Office / งานปฏิบัติการหลังบ้าน` while C.5
> type #13 reads `Back Office / งานหลังบ้าน`. Both are transcribed verbatim in their own sections —
> they are two different entities (an org unit and a case type), so the spelling difference is kept.

## 2. Commands — `POST /commands/add` (send as direct call)

Body type: `CommandCreateData { active, deptId, en, th }` — `src/core/types/organization.ts:46-51`
(the parent `deptId` is the only id the client supplies).

GQL key: REST `"/commands/:id"` (`organizationQueries.ts:186`) → `CreateCommand` / root `Command` /
`CommandInput!` (`:26-28`). Direct call:

```json
{
  "query": "mutation ($input: CommandInput!) { Command { CreateCommand(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "en": "Client A Card Services", "th": "บริการบัตรลูกค้า A" } }
}
```

Data: runbook C.1 — seven client programs, one per unique (department, program) pair:

```json
[
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "en": "Client A Card Services", "th": "บริการบัตรลูกค้า A" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "en": "Client B Policy Service", "th": "บริการกรมธรรม์ลูกค้า B" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "en": "Client C Retail CS", "th": "บริการลูกค้าค้าปลีก C" },
  { "active": true, "deptId": "{{DEPT_ID_TELESALES}}", "en": "Client C Telesales", "th": "ขายทางโทรศัพท์ลูกค้า C" },
  { "active": true, "deptId": "{{DEPT_ID_TELESALES}}", "en": "Client D Tele-survey", "th": "สำรวจความพึงพอใจลูกค้า D" },
  { "active": true, "deptId": "{{DEPT_ID_TECH}}", "en": "Client B Tech Support", "th": "สนับสนุนเทคนิคลูกค้า B" },
  { "active": true, "deptId": "{{DEPT_ID_BACKOFFICE}}", "en": "Client A Document Processing", "th": "งานเอกสารลูกค้า A" }
]
```

Capture `commId` → `{{COMM_ID_A_CARD}}`, `{{COMM_ID_B_POLICY}}`, `{{COMM_ID_C_RETAIL}}`,
`{{COMM_ID_C_TELE}}`, `{{COMM_ID_D_SURVEY}}`, `{{COMM_ID_B_TECH}}`, `{{COMM_ID_A_DOC}}`.

`Client A…D` are placeholders for real program names (runbook C.1 note) — do not put a real client
name into a demo database without the account owner's approval.

## 3. Stations — `POST /stations/add` (send as direct call)

Body type: `StationCreateData { active, commId, deptId, en, th }` — `src/core/types/organization.ts:70-76`.

GQL key: REST `"/stations/:id"` (`organizationQueries.ts:205`) → `CreateStation` / root `Station` /
`StationInput!` (`:116-118`). Direct call:

```json
{
  "query": "mutation ($input: StationInput!) { Station { CreateStation(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}", "en": "Wave 1", "th": "เวฟ 1" } }
}
```

Data: runbook C.1 — nine team/wave rows (`Wave 1`/`Wave 2` are the only station names the data set
uses). Both parent ids are required by the type:

```json
[
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}",   "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}",   "en": "Wave 2", "th": "เวฟ 2" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_B_POLICY}}", "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_C_RETAIL}}", "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_TELESALES}}",  "commId": "{{COMM_ID_C_TELE}}",   "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_TELESALES}}",  "commId": "{{COMM_ID_D_SURVEY}}", "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_TECH}}",       "commId": "{{COMM_ID_B_TECH}}",   "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}",    "en": "Wave 1", "th": "เวฟ 1" },
  { "active": true, "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_C_RETAIL}}", "en": "Wave 2", "th": "เวฟ 2" }
]
```

Capture `stnId` in the same order → `{{STN_ID_A_CARD_W1}}`, `{{STN_ID_A_CARD_W2}}`,
`{{STN_ID_B_POLICY_W1}}`, `{{STN_ID_C_RETAIL_W1}}`, `{{STN_ID_C_TELE_W1}}`,
`{{STN_ID_D_SURVEY_W1}}`, `{{STN_ID_B_TECH_W1}}`, `{{STN_ID_A_DOC_W1}}`,
`{{STN_ID_C_RETAIL_W2}}`. `Wave 1 — SP9F`-style site suffixes are a naming option only: the product
stores no site field (runbook C.1 note).

## 4. Roles — `POST /role/add` (send as direct call)

Body type: `RoleCreateData { active, roleName }` — `src/core/types/role.ts:95-98`.
⚠ **`en`/`th` are not part of the create contract.** The read model declares them optional
(`Role`, `role.ts:24-36`) but the create/update types carry only `active` + `roleName`, and
`createUserRoles` posts exactly that (`src/core/store/api/userApi.ts:211-217`). `roleName` is stored
verbatim — the runbook's snake_case values are the correct form, and a report or grant script must
match the literal string (runbook S3).

GQL key: REST `"/role/:id"` (`roleQueries.ts:58`) → `CreateRole` / root `Role` / `RoleInput!`
(`:17-23`). Direct call:

```json
{
  "query": "mutation ($input: RoleInput!) { Role { CreateRole(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "roleName": "supervisor" } }
}
```

Data: runbook C.3 — seven roles:

```json
[
  { "active": true, "roleName": "system_admin" },
  { "active": true, "roleName": "admin" },
  { "active": true, "roleName": "supervisor" },
  { "active": true, "roleName": "agent" },
  { "active": true, "roleName": "qa_analyst" },
  { "active": true, "roleName": "trainer" },
  { "active": true, "roleName": "client_viewer" }
]
```

Capture the response's role `id` → `{{ROLE_ID_SYSTEM_ADMIN}}`, `{{ROLE_ID_ADMIN}}`,
`{{ROLE_ID_SUPERVISOR}}`, `{{ROLE_ID_AGENT}}`, `{{ROLE_ID_QA_ANALYST}}`, `{{ROLE_ID_TRAINER}}`,
`{{ROLE_ID_CLIENT_VIEWER}}`. These are what §6 `roleId` and §5 `roleId` reference.

> `system_admin` is the role the runbook's D7 says to decide about: reusing the backend's
> `SYSTEM_ROLE` UUID means the platform's own system role, while creating a new `system_admin` row
> means every permission must be granted explicitly. This package creates the row (so the payload
> set is complete) — **check `GET /role` first and skip it if the platform already made one.**

## 5. Role permissions — `PATCH /role_permission/multi`

Body type: `RolePermissionsCreateData[]` where
`RolePermissionsCreateData { roleId, permissions: PermissionCreateData[] }` and
`PermissionCreateData { permId, active }` — `src/core/types/role.ts:75-78,14-17`. The array is the
`body` of `RolesPermissionsUpdateData { body }` (`:91-93`).

GQL key: `"/role_permission/multi"` PATCH fixed path → `UpdateRolePermissionMulti` / root
`RolePermission` / `RolePermissionMultiInput!` — `roleQueries.ts:48-54,69-71`. The path is fixed
(not `:id`) so the mapper does **not** inject `id: "multi"`
(`roleQueries.ts:65-68`). `POST /role_permission/add` is unmapped and hard-errors in GraphQL mode —
use this endpoint.

Data: the runbook §6 matrix. `permId` values are **tenant-scoped catalog data** — nothing in this
repository can name them (the only permIds in code are captured examples such as
`auth.configure_2fa` in `src/core/mocks/permissionCURL.sh`). Read `GET /permission` (or the Role &
Privilege matrix) first and substitute.

Per-role key sets, transcribed from runbook §6 ("Y" cells):

| Role | Keys to grant |
| --- | --- |
| `system_admin` | everything the tenant bought (the platform system role) |
| `admin` | everything except the system-role lock |
| `supervisor` | `case.view`, `case.view_history`, `case.create`, `case.update`, `case.view_timeline`, `case.comment`, `case.attach_file`, `case.assign`, `case.close`, `dashboard.view`, `report.view`, `contact.view`, `appointment.view`, `workflow.view`, `cc.supervision.view`, `kb_dashboard.view`, `kb_category.view`, `kb_article.view`, `kb_article.mgmt.view`, `kb_file.view`, `kb_broadcast.view`, `kb_banner.view`, `kb_source.view` |
| `agent` | `case.view`, `case.view_history`, `case.create`, `case.update`, `case.view_timeline`, `case.comment`, `case.attach_file`, `contact.view`, `appointment.view`, plus the same eight `kb_*` view keys |
| `qa_analyst` | `case.view`, `case.view_history`, `case.view_timeline`, `case.comment`, `dashboard.view`, `report.view`, plus the eight `kb_*` view keys |
| `trainer` | `case.view`, `case.comment`, the eight `kb_*` view keys, and `kb_article.mgmt.create` / `.update` / `.copy` / `.newversion` / `.changestatus`, `kb_file.create` / `.upload` / `.delete`, `kb_category.create` / `.update` / `.delete` |
| `client_viewer` | `case.view`, `case.view_history`, `case.view_timeline`, `case.attach_file`, `dashboard.view`, `report.view`, `contact.view`, `appointment.view`, plus the eight `kb_*` view keys |

```json
[
  {
    "roleId": "{{ROLE_ID_AGENT}}",
    "permissions": [
      { "permId": "{{PERM_ID_CASE_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_CASE_CREATE}}", "active": true },
      { "permId": "{{PERM_ID_CASE_UPDATE}}", "active": true },
      { "permId": "{{PERM_ID_CASE_VIEW_HISTORY}}", "active": true },
      { "permId": "{{PERM_ID_CASE_VIEW_TIMELINE}}", "active": true },
      { "permId": "{{PERM_ID_CASE_COMMENT}}", "active": true },
      { "permId": "{{PERM_ID_CASE_ATTACH_FILE}}", "active": true },
      { "permId": "{{PERM_ID_CONTACT_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_APPOINTMENT_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_DASHBOARD_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_CATEGORY_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_ARTICLE_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_ARTICLE_MGMT_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_FILE_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_BROADCAST_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_BANNER_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_KB_SOURCE_VIEW}}", "active": true }
    ]
  },
  {
    "roleId": "{{ROLE_ID_SUPERVISOR}}",
    "permissions": [
      { "permId": "{{PERM_ID_CASE_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_CASE_ASSIGN}}", "active": true },
      { "permId": "{{PERM_ID_CASE_CLOSE}}", "active": true },
      { "permId": "{{PERM_ID_DASHBOARD_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_REPORT_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_WORKFLOW_VIEW}}", "active": true },
      { "permId": "{{PERM_ID_CC_SUPERVISION_VIEW}}", "active": true }
    ]
  }
]
```

> `package.view` is granted to **nobody**: the Package menu entry is a `disabled: true` placeholder
> pointing at a route that does not exist (runbook S3, `src/core/layout/SuperTopbar.tsx:482-486`).
> The two-blocks-per-role rule matters: `user.create` + `user.update`, `unit.create` + `unit.update`
> and `workflow.create` + `workflow.view` are each **AND**-checked, so granting one of the pair and
> not the other produces a visible menu with a denied page (runbook §6 rule 2).

## 6. Users — `POST /users/add`

Body type: `UserFormData` — `src/core/types/user.ts:216-247`. Fields sent here: `active`,
`address`, `blood`, `bod`, `citizenId`, `commId`, `deptId`, `displayName`, `email`, `empId`,
`firstName`, `gender` (number), `lastName`, `middleName`, `mobileNo`, `orgId`, `photo`, `roleId`,
`stnId`, `title`, `userType` (number), `username`. `gender`, `bod` (birth date), `blood`,
`citizenId`, `photo`, `address`, `title`, `mobileNo` carry no value in the SKYCC data set → `null` /
`""` (see §26).

GQL key: `"/users/add"` POST → `CreateUser` / root `User` / `CreateUserInput!` —
`src/core/store/api/graphql/userQueries.ts:41-43,123-125`.

⚠ **No password in the body.** `CreateUserInput` carries no password (the SKYICT seed's
`api-payloads/README.md`, "Password is not part of the create contract"); the initial password is
set afterwards in §7. The real staff list is HR data — these twelve are role placeholders
(runbook C.3).

Data: runbook C.3. `deptId`/`commId`/`stnId` from §1–§3, `roleId` from §4.

```json
[
  { "active": true, "orgId": "{{ORG_ID}}", "username": "skycc.system", "displayName": "SKYCC System Admin",
    "email": "skycc.system@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_SYSTEM_ADMIN}}",
    "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}", "stnId": "{{STN_ID_A_DOC_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "skycc.admin", "displayName": "SKYCC Admin",
    "email": "skycc.admin@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_ADMIN}}",
    "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}", "stnId": "{{STN_ID_A_DOC_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "sup.a.cs", "displayName": "Supervisor — Client A CS",
    "email": "sup.a.cs@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_SUPERVISOR}}",
    "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}", "stnId": "{{STN_ID_A_CARD_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "sup.c.tele", "displayName": "Supervisor — Client C Telesales",
    "email": "sup.c.tele@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_SUPERVISOR}}",
    "deptId": "{{DEPT_ID_TELESALES}}", "commId": "{{COMM_ID_C_TELE}}", "stnId": "{{STN_ID_C_TELE_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "sup.b.tech", "displayName": "Supervisor — Client B Tech",
    "email": "sup.b.tech@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_SUPERVISOR}}",
    "deptId": "{{DEPT_ID_TECH}}", "commId": "{{COMM_ID_B_TECH}}", "stnId": "{{STN_ID_B_TECH_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "wfm.analyst", "displayName": "Workforce Analyst",
    "email": "wfm.analyst@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_SUPERVISOR}}",
    "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}", "stnId": "{{STN_ID_A_DOC_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "qa.lead", "displayName": "QA Lead",
    "email": "qa.lead@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_QA_ANALYST}}",
    "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}", "stnId": "{{STN_ID_A_DOC_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "trainer.lead", "displayName": "Training Lead (CX Academy)",
    "email": "trainer.lead@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_TRAINER}}",
    "deptId": "{{DEPT_ID_BACKOFFICE}}", "commId": "{{COMM_ID_A_DOC}}", "stnId": "{{STN_ID_A_DOC_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "agent.a01", "displayName": "Agent — Client A CS",
    "email": "agent.a01@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_AGENT}}",
    "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}", "stnId": "{{STN_ID_A_CARD_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "agent.a02", "displayName": "Agent — Client A CS",
    "email": "agent.a02@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_AGENT}}",
    "deptId": "{{DEPT_ID_INBOUND_CS}}", "commId": "{{COMM_ID_A_CARD}}", "stnId": "{{STN_ID_A_CARD_W2}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "agent.c01", "displayName": "Agent — Client C Telesales",
    "email": "agent.c01@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_AGENT}}",
    "deptId": "{{DEPT_ID_TELESALES}}", "commId": "{{COMM_ID_C_TELE}}", "stnId": "{{STN_ID_C_TELE_W1}}" },
  { "active": true, "orgId": "{{ORG_ID}}", "username": "agent.b01", "displayName": "Agent — Client B Tech",
    "email": "agent.b01@skycc.co.th", "empId": "", "firstName": "", "lastName": "", "middleName": "",
    "gender": null, "bod": "", "blood": "", "citizenId": "", "mobileNo": "", "photo": "", "address": "",
    "title": "", "userType": 1, "roleId": "{{ROLE_ID_AGENT}}",
    "deptId": "{{DEPT_ID_TECH}}", "commId": "{{COMM_ID_B_TECH}}", "stnId": "{{STN_ID_B_TECH_W1}}" }
]
```

One body per POST. Capture the response's user `id` if the tenant needs it for later edits —
none of the steps below key on it (`units`, `skills`, `groups` and workflow `pic` all key on
`username`). So `{{USER_ID_*}}` is listed in the order table for completeness only.

Direct call:

```json
{
  "query": "mutation ($input: CreateUserInput!) { User { CreateUser(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the twelve bodies above" } }
}
```

**Why `email` is `<username>@skycc.co.th`.** The runbook gives no email for these twelve
placeholders, but `UserFormData.email` is a required string. The domain is taken from the prototype
document's own account list (`agent1@skycc.co.th`, …); the local part equals the username as a
**convention**, stated here so it is not mistaken for transcribed data. See §26 item 3. Do not copy
the prototype's addresses: three of them are typo'd in the source (`respinder1@`, `generalsrvice1@`)
and row 11 (`emergencyservice1`) carries row 12's address.

## 7. Initial passwords — `POST /users/reset_password`

Body type: `ResetPasswordData { email, username, newPassword }` — `src/core/types/user.ts:118-122`
(admin-only; requires `user.reset_password`).

GQL key: `"/users/reset_password"` → `ResetPassword` / root `User` / `ResetPasswordInput!` —
`userQueries.ts:75-77,128-130`. Note the target is identified by **email + username**, not by id.

```json
{ "email": "agent.a01@skycc.co.th", "username": "agent.a01", "newPassword": "{{INITIAL_PASSWORD_AGENT_A01}}" }
```

Run one call per user from §6. The prototype document records the demo tenant password as
`Skycc@123`; treat that as a demo value only and rotate it — it is a credential, not configuration,
and it must not be committed.

## 8. User groups — `POST /user_groups/add`

Body type: `UserGroupCreateData { active, en, th }` — `src/core/types/user.ts:321-325`
(`grpId` is server-generated; the create payload carries no id — same note at
`src/core/store/api/userApi.ts:135-143`). ⚠ `description` exists on the **read** model
(`UserGroup.description?`, `user.ts:304-305`) but not on the create type, so the runbook's "Purpose"
column has nowhere to go at create time (§25 item 6).

GQL key: `"/user_groups/add"` (literal, method-keyed) → `CreateUserGroup` / root `UserGroup` /
`UserGroupInsertInput!` — `src/core/store/api/graphql/userGroupQueries.ts:48-54,100-102`.

Data: runbook C.2 (8 rows, 7 program/function groups + `General`). `General` is expected to be
created with the tenant (runbook S2 calls that **UNVERIFIED**) — check `GET /user_groups/all` first
and skip it if present.

```json
[
  { "active": true, "en": "General", "th": "ทั่วไป" },
  { "active": true, "en": "Program A Delivery", "th": "ทีมให้บริการลูกค้า A" },
  { "active": true, "en": "Program B Delivery", "th": "ทีมให้บริการลูกค้า B" },
  { "active": true, "en": "Program C Delivery", "th": "ทีมให้บริการลูกค้า C" },
  { "active": true, "en": "Telesales Desk", "th": "ทีมขายทางโทรศัพท์" },
  { "active": true, "en": "QA & Compliance", "th": "ตรวจสอบคุณภาพ" },
  { "active": true, "en": "Workforce & Traffic", "th": "บริหารกำลังคน" },
  { "active": true, "en": "Training & CX Academy", "th": "ฝึกอบรม" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: UserGroupInsertInput!) { UserGroup { CreateUserGroup(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Telesales Desk", "th": "ทีมขายทางโทรศัพท์" } }
}
```

Capture `grpId` → `{{GRP_ID_GENERAL}}`, `{{GRP_ID_PROGRAM_A}}`, `{{GRP_ID_PROGRAM_B}}`,
`{{GRP_ID_PROGRAM_C}}`, `{{GRP_ID_TELESALES}}`, `{{GRP_ID_QA}}`, `{{GRP_ID_WFM}}`,
`{{GRP_ID_TRAINING}}`. Workflow nodes (§14) and the memberships below reference these.

## 9. User-group memberships — `POST /user_groups/{grpId}/users/batch`

Body type: `{ usernames: string[] }` (`AssignUserGroupBatchData { grpId, usernames }` —
`src/core/types/user.ts:357-360`; `grpId` goes in the path, the body carries only `usernames` —
`src/core/store/api/userApi.ts:188-196`). ⚠ The batch **replaces** the group's member set.

GQL key: `"/user_groups/:id/users/batch"` POST → `AssignUserGroupBatch` / root `UserGroup` /
`AssignUserGroupBatchInput!` — `userGroupQueries.ts:80-86,107-109` (the `:id` merges into the input,
so the direct call includes `id`).

Data: derived from runbook C.2 group purposes + C.3 accounts. Usernames come from §6.

| grpId placeholder | usernames |
| --- | --- |
| `{{GRP_ID_GENERAL}}` | *(leave as the tenant's default group — do not batch-replace it)* |
| `{{GRP_ID_PROGRAM_A}}` | `sup.a.cs`, `agent.a01`, `agent.a02` |
| `{{GRP_ID_PROGRAM_B}}` | `sup.b.tech`, `agent.b01` |
| `{{GRP_ID_PROGRAM_C}}` | `sup.c.tele`, `agent.c01` |
| `{{GRP_ID_TELESALES}}` | `sup.c.tele`, `agent.c01` |
| `{{GRP_ID_QA}}` | `qa.lead` |
| `{{GRP_ID_WFM}}` | `wfm.analyst` |
| `{{GRP_ID_TRAINING}}` | `trainer.lead` |

```json
{ "usernames": [ "sup.a.cs", "agent.a01", "agent.a02" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: AssignUserGroupBatchInput!) { UserGroup { AssignUserGroupBatch(input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "{{GRP_ID_PROGRAM_A}}", "usernames": [ "sup.a.cs", "agent.a01", "agent.a02" ] } }
}
```

> Single-user variant: `POST /user_groups/{grpId}/users/add` with body `{ username }`
> (`userApi.ts:179-186` → `AssignUserGroup` / `AssignUserGroupInput!`,
> `userGroupQueries.ts:72-78,104-106`).
> The matrix above is the **proposed** assignment implied by C.2's purposes — `client_viewer` is
> deliberately in no group (it is a read-only account whose scope is unsettled, runbook D4).

## 10. Skills — `POST /skill/add` (send as direct call)

Body type: `SkillCreateData { active, en, th }` — `src/cms/types/skill.ts:12-16`.

GQL key: the REST path matches `"/skill/:id"` (`skillQueries.ts:41-49`), so a call through the app
injects `id: "add"` into `SkillInput`. Direct call avoids it:

```json
{
  "query": "mutation ($input: SkillInput!) { Skill { CreateSkill(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Billing & Payment", "th": "การเรียกเก็บเงิน" } }
}
```

Data: runbook C.4 — eight capability skills. For a BPO these are the **routing vocabulary** the
product has (capability, not team — teams are §8), so they must exist before §16.

```json
[
  { "active": true, "en": "Inbound Customer Service", "th": "บริการลูกค้าขาเข้า" },
  { "active": true, "en": "Billing & Payment", "th": "การเรียกเก็บเงิน" },
  { "active": true, "en": "Complaint Handling", "th": "การจัดการข้อร้องเรียน" },
  { "active": true, "en": "Retention & Cancellation", "th": "การรักษาลูกค้า" },
  { "active": true, "en": "Telesales", "th": "ขายทางโทรศัพท์" },
  { "active": true, "en": "Technical Support", "th": "สนับสนุนเทคนิค" },
  { "active": true, "en": "Back Office Processing", "th": "งานปฏิบัติการหลังบ้าน" },
  { "active": true, "en": "English Service", "th": "บริการภาษาอังกฤษ" }
]
```

Capture `skillId` → `{{SKILL_ID_INBOUND}}`, `{{SKILL_ID_BILLING}}`, `{{SKILL_ID_COMPLAINT}}`,
`{{SKILL_ID_RETENTION}}`, `{{SKILL_ID_TELESALES}}`, `{{SKILL_ID_TECH}}`, `{{SKILL_ID_BACKOFFICE}}`,
`{{SKILL_ID_ENGLISH}}`.

> ⚠ The page that owns this data is gated by `unit.view`, not `settings.view`
> (`src/cms/pages/Admin/SkillManagement.tsx:49-50`) — grant `unit.view` to whoever maintains
> skills, or the runbook's S5 step is unreachable.

## 11. Unit properties — `POST /mdm/properties/add`

Body type: `PropertyCreateData { active, en, th }` — `src/cms/types/unit.ts:303-307`
(`propId` is server-generated).

GQL key: `"/mdm/properties/add"` (literal) → `CreateMdmProperty` / root `MdmProperty` /
`MdmPropertyInput!` — `src/cms/store/api/graphql/mdmQueries.ts:108-114,138`.

Data: runbook C.12 — eight properties. ⚠ **The runbook gives EN names only** — no Thai name exists
in either source document for `Voice Seat` … `Back Office`, so the `th` values are placeholders
(§26 item 4), unlike the unit property row the prototype document does spell out (`Not Spectify` /
`ไม่ระบุ`).

```json
[
  { "active": true, "en": "Voice Seat", "th": "{{TH_PROP_VOICE_SEAT}}" },
  { "active": true, "en": "Chat Seat", "th": "{{TH_PROP_CHAT_SEAT}}" },
  { "active": true, "en": "Email Seat", "th": "{{TH_PROP_EMAIL_SEAT}}" },
  { "active": true, "en": "Thai", "th": "{{TH_PROP_THAI}}" },
  { "active": true, "en": "English", "th": "{{TH_PROP_ENGLISH}}" },
  { "active": true, "en": "Tier 2", "th": "{{TH_PROP_TIER2}}" },
  { "active": true, "en": "Supervisor Seat", "th": "{{TH_PROP_SUPERVISOR_SEAT}}" },
  { "active": true, "en": "Back Office", "th": "{{TH_PROP_BACK_OFFICE}}" }
]
```

Capture `propId` in that order → `{{PROP_ID_VOICE_SEAT}}`, `{{PROP_ID_CHAT_SEAT}}`,
`{{PROP_ID_EMAIL_SEAT}}`, `{{PROP_ID_THAI}}`, `{{PROP_ID_ENGLISH}}`, `{{PROP_ID_TIER2}}`,
`{{PROP_ID_SUPERVISOR_SEAT}}`, `{{PROP_ID_BACK_OFFICE}}`.

Optional ninth row: the prototype document's `Not Spectify` / `ไม่ระบุ` is a **valid** transcribed
pair and is useful as the neutral fallback when a sub-type's `unitPropLists` must not imply a
channel (`PropertyCreateData` has no description field, so the prototype's `PROP-001` id column is
display-only):

```json
{ "active": true, "en": "Not Spectify", "th": "ไม่ระบุ" }
```

> `Not Spectify` is spelled exactly as in the prototype document — keep the spelling if the tenant
> adopts it, because sub-type references must point at one `propId`.

## 12. Units (seats) — `POST /mdm/units/add`

Body type: `UnitFormData` — `src/cms/types/unit.ts:121-153`. Required:
`active, commId, compId, deptId, priority, stnId, unitId, unitName, unitSourceId, unitTypeId,
username`. The catalogs behind `commId`/`stnId`/`compId`/`unitTypeId`/`unitSourceId` are
**read-only** in this repository — `GET /mdm/companies`, `/mdm/sources`, `/mdm/types`,
`/mdm/status` (`mdmQueries.ts:160-162`; only `getCompanies`, `getSources`, `getUnitStatuses`,
`getUnitTypes` exist as queries, `src/cms/store/api/unitApi.ts:105,118,131,140`):

- `{{DEPT_ID_*}}` / `{{COMM_ID_*}}` / `{{STN_ID_*}}` — from §1–§3.
- `{{COMP_ID_SKYCC}}`, `{{UNIT_TYPE_ID_*}}`, `{{UNIT_SOURCE_ID_*}}` — ⚠ BE-seeded catalogs. The
  prototype document names the default vocabulary (`Staff` / `ปฎิบัติงาน`, `Internal` /
  `หน่วยภายใน`, `External` / `หน่วยภายนอกองค์กร`) and the runbook S6 says it is field-service
  language that should be reseeded with contact-center values — there is **no create contract** in
  this repo (§25 items 1–3). Read the ids first.
- `priority` — a number. C.12 gives none; the unit form defaults to `0`.

For SKYCC a unit is a **logged-in seat** (runbook S6), not a vehicle: `locLat`/`locLon`/
`plateNo`/`provinceCode`/`breakDuration` and the telemetry fields are optional and irrelevant here.

Data: runbook C.12 — six seats. ⚠ **SEAT-005 and SEAT-006 have no login user** (`—` in the runbook),
and `username` is a required field of `UnitFormData`, so only the four user-backed seats can be
created from this contract. See §26 item 5.

```json
[
  { "active": true, "unitId": "SEAT-001", "unitName": "SEAT-001", "username": "agent.a01", "priority": 0,
    "commId": "{{COMM_ID_A_CARD}}", "stnId": "{{STN_ID_A_CARD_W1}}",
    "compId": "{{COMP_ID_SKYCC}}", "deptId": "{{DEPT_ID_INBOUND_CS}}",
    "unitTypeId": "{{UNIT_TYPE_ID_SEAT}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "SEAT-002", "unitName": "SEAT-002", "username": "agent.a02", "priority": 0,
    "commId": "{{COMM_ID_A_CARD}}", "stnId": "{{STN_ID_A_CARD_W2}}",
    "compId": "{{COMP_ID_SKYCC}}", "deptId": "{{DEPT_ID_INBOUND_CS}}",
    "unitTypeId": "{{UNIT_TYPE_ID_SEAT}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "SEAT-003", "unitName": "SEAT-003", "username": "agent.c01", "priority": 0,
    "commId": "{{COMM_ID_C_TELE}}", "stnId": "{{STN_ID_C_TELE_W1}}",
    "compId": "{{COMP_ID_SKYCC}}", "deptId": "{{DEPT_ID_TELESALES}}",
    "unitTypeId": "{{UNIT_TYPE_ID_SEAT}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" },
  { "active": true, "unitId": "SEAT-004", "unitName": "SEAT-004", "username": "agent.b01", "priority": 0,
    "commId": "{{COMM_ID_B_TECH}}", "stnId": "{{STN_ID_B_TECH_W1}}",
    "compId": "{{COMP_ID_SKYCC}}", "deptId": "{{DEPT_ID_TECH}}",
    "unitTypeId": "{{UNIT_TYPE_ID_SEAT}}", "unitSourceId": "{{UNIT_SOURCE_ID_INTERNAL}}" }
]
```

`unitName` = `unitId`, matching the runbook C.12 seat convention. Direct call:

```json
{
  "query": "mutation ($input: MmdUnitInput!) { MdmUnit { CreateMdmUnit(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the four bodies above" } }
}
```

⚠ The GraphQL input type is spelled **`MmdUnitInput`** — a real backend typo, preserved on purpose
(`mdmQueries.ts:71-80`). Do not "fix" it in a payload.

## 13. Unit property bulk assign — `POST /mdm/units/properties/{unitId}/bulk`

Body type: `UnitPropertyBulkAssignData { id, propIds }` — `src/cms/types/unit.ts:285-288`, where
`id` is the **unitId business code in the path** and the body carries only `{ propIds }`
(`src/cms/store/api/unitApi.ts:96-103`). ⚠ **The whole set is replaced per call** — an empty
`propIds` clears it; send the final set in one call per unit.

GQL key: `"/mdm/units/properties/:id/bulk"` → `BulkAssignUnitProperties` / root `MdmUnit` /
`BulkUnitPropertiesInput!` — `mdmQueries.ts:98-104,153` (the `:id` merges into the input).

Data: runbook C.12 seat/property matrix:

| unitId | propIds (placeholders) |
| --- | --- |
| SEAT-001 (`agent.a01`) | `{{PROP_ID_VOICE_SEAT}}`, `{{PROP_ID_THAI}}` |
| SEAT-002 (`agent.a02`) | `{{PROP_ID_VOICE_SEAT}}`, `{{PROP_ID_ENGLISH}}` |
| SEAT-003 (`agent.c01`) | `{{PROP_ID_VOICE_SEAT}}`, `{{PROP_ID_THAI}}` |
| SEAT-004 (`agent.b01`) | `{{PROP_ID_VOICE_SEAT}}`, `{{PROP_ID_TIER2}}` |
| SEAT-005 *(blocked — no login user)* | `{{PROP_ID_EMAIL_SEAT}}`, `{{PROP_ID_BACK_OFFICE}}` |
| SEAT-006 *(blocked — no login user)* | `{{PROP_ID_CHAT_SEAT}}`, `{{PROP_ID_THAI}}` |

```json
{ "propIds": [ "{{PROP_ID_VOICE_SEAT}}", "{{PROP_ID_THAI}}" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: BulkUnitPropertiesInput!) { MdmUnit { BulkAssignUnitProperties(input: $input) { status msg data desc } } }",
  "variables": { "input": { "id": "SEAT-001", "propIds": [ "{{PROP_ID_VOICE_SEAT}}", "{{PROP_ID_THAI}}" ] } }
}
```

## 14. Workflows — `POST /workflows`

Body type: `WorkflowData { nodes: BaseNode[], connections: Connection[], metadata }` —
`src/cms/types/workflow.ts:112-124`; `NodeType` (`start | process | dispatch | decision | sla |
end`) `:18-24`; `Status` (`draft | active | inactive | testing`) `:31-35`; `WorkflowMetadata`
carries `title, description?, status?, totalSla?, wfType?` `:44-50`.
⚠ `BaseNode.data.config` is an untyped `Record<string, unknown>` (`workflow.ts:70`) — every config
key below is the **editor's** convention, read from the components that write it (§25 item 8).

GQL key: `"/workflows"` POST (method-keyed) → `CreateWorkflow` / root `Workflow` / `WorkFlowInput!`
— `src/cms/store/api/graphql/workflowQueries.ts:17-23,47-50`.

Node config conventions (**verified in the writers, not inferred**):

| key | written by | value |
| --- | --- | --- |
| `sla` (process / dispatch) | `ConfigPanel.tsx:319-321` (writes `e.target.value`) | **string** minutes |
| `SLA` (sla node) | `ConfigPanel.tsx:227-229` | **string** minutes — note the capital letters |
| `group` | `ConfigPanel.tsx:339-341`; option values `ug.grpId` at `Editor.tsx:173-175` | **array of `grpId`** (§8) |
| `pic` | `ConfigPanel.tsx:361-363`; option values `user.username` at `Editor.tsx:168-170` | **array of usernames** (§6) |
| `action` | `ConfigPanel.tsx:255-268`, options are `caseStatus.statusId` (`Editor.tsx:153-160`) | **a case-status `statusId`** from `GET /case_status` — *not* a free string |
| `formId` | `ConfigPanel.tsx:293-295`, options are `form.formId` (`Editor.tsx:163-165`) | a form id from §20 |
| `condition` (decision) | `ConfigPanel.tsx:200-202` | free string |
| `continueFromWorkflow` / `sourceWorkflowId` (start) | `Editor.tsx:497-505` | boolean / string |
| `allowContinuation` / `nextWorkflowId` (end) | `Editor.tsx:552-560` | boolean / string |
| `escalationSla` / `escalationGroup` / `escalationPic` | `ConfigPanel.tsx:385-460` | optional per-node escalation rules |

> **`workflowDefault.json` is legacy, not the contract.** The mock at
> `src/cms/mocks/workflowDefault.json` stores `pic: "agent"` as a *string* and `form: "new"` — both
> are read only through `Array.isArray` / `typeof === "string"` fallbacks in
> `Editor.tsx:507-534`. The current editor writes `pic`/`group` as arrays and the form key as
> `formId`. This package follows the current editor.

**`totalSla` is derived, never typed.** `Editor.tsx:253` sets
`updateWorkflowMetadata({ totalSla: countSLA() })`, and `countSLA` sums `config.SLA ?? config.sla`
across **all** nodes (`Editor.tsx:193-202`). Two consequences:

1. Each total below must equal the sum of the `sla` values in that body — the runbook C.6 sums are
   used verbatim (30 / 266 / 146 / 139 / 530) and are verified by the script (§28).
2. **Do not add separate `sla` nodes** on top of per-process-node `sla`: both are counted, so the
   total doubles. `sla` on the process nodes is the shape that keeps C.6's per-node worksheet and
   the metadata total in agreement.

`dispatch` is the node type for the step a program team picks work up from (runbook C.6), and the
editor treats it identically to `process` (`Editor.tsx:507-513`), so making `Assigned` a `dispatch`
node adds the routing semantics without changing the SLA arithmetic. `decision` nodes (QA sampling /
escalation split, runbook C.6) are optional and must carry **no** `sla` value, or they inflate the
total.

**SKYCC-Voice Inquiry** (1 + 2 + 2 + 15 + 5 + 5 = 30):

```json
{
  "nodes": [
    { "id": "n1", "type": "start", "position": { "x": 20, "y": 80 },
      "data": { "label": "Start", "description": "Case opening",
        "config": { "continueFromWorkflow": false, "sourceWorkflowId": "" } } },
    { "id": "n2", "type": "process", "position": { "x": 20, "y": 200 },
      "data": { "label": "New", "description": "Agent registers the contact",
        "config": { "action": "{{CASE_STATUS_ID_NEW}}", "formId": "{{FORM_ID_VOICE_DISPOSITION}}",
          "sla": "1", "group": [ "{{GRP_ID_PROGRAM_A}}", "{{GRP_ID_PROGRAM_B}}", "{{GRP_ID_PROGRAM_C}}" ],
          "pic": [ "agent.a01", "agent.a02" ] } } },
    { "id": "n3", "type": "dispatch", "position": { "x": 20, "y": 320 },
      "data": { "label": "Assigned", "description": "Routed to the program team",
        "config": { "sla": "2",
          "group": [ "{{GRP_ID_PROGRAM_A}}", "{{GRP_ID_PROGRAM_B}}", "{{GRP_ID_PROGRAM_C}}" ],
          "pic": [ "sup.a.cs" ] } } },
    { "id": "n4", "type": "process", "position": { "x": 20, "y": 440 },
      "data": { "label": "Acknowledge", "description": "Agent owns the contact",
        "config": { "sla": "2", "group": [ "{{GRP_ID_PROGRAM_A}}" ], "pic": [ "agent.a01", "agent.a02" ] } } },
    { "id": "n5", "type": "process", "position": { "x": 20, "y": 560 },
      "data": { "label": "In-progress", "description": "Handling / talk time",
        "config": { "sla": "15", "group": [ "{{GRP_ID_PROGRAM_A}}" ], "pic": [ "agent.a01", "agent.a02" ] } } },
    { "id": "n6", "type": "process", "position": { "x": 20, "y": 680 },
      "data": { "label": "Done", "description": "Wrap-up and disposition",
        "config": { "sla": "5", "group": [ "{{GRP_ID_PROGRAM_A}}" ], "pic": [ "agent.a01", "agent.a02" ] } } },
    { "id": "n7", "type": "process", "position": { "x": 20, "y": 800 },
      "data": { "label": "Closed", "description": "Closed with a case result",
        "config": { "sla": "5", "group": [ "{{GRP_ID_PROGRAM_A}}" ], "pic": [ "agent.a01", "agent.a02" ] } } },
    { "id": "n8", "type": "end", "position": { "x": 20, "y": 920 },
      "data": { "label": "End", "description": "End of case",
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
    "title": "SKYCC-Voice Inquiry",
    "description": "Voice inquiry flow for sub-types 5001-5004",
    "status": "active",
    "wfType": "case",
    "totalSla": 30
  }
}
```

The other four reuse the same 8-node shape and connection list; only `sla` values, `group`/`pic`
rosters, title, description and `totalSla` differ. This block is the **delta per flow** in the shape
the editor stores (`metadata` plus the per-node `config` values to substitute into nodes `n2`–`n7`),
not a second wire format — each row still posts as one `WorkflowData` body:

```json
[
  { "metadata": { "title": "SKYCC-Complaint", "description": "Complaint and retention flow for sub-types 5005 and 5006", "status": "active", "wfType": "case", "totalSla": 266 },
    "nodeSla": { "n2": "1", "n3": "5", "n4": "5", "n5": "240", "n6": "10", "n7": "5" },
    "group": [ "{{GRP_ID_PROGRAM_A}}", "{{GRP_ID_PROGRAM_B}}", "{{GRP_ID_PROGRAM_C}}", "{{GRP_ID_QA}}" ],
    "pic": [ "sup.a.cs", "qa.lead" ] },
  { "metadata": { "title": "SKYCC-Lead", "description": "Tele-sales and survey flow for sub-types 5101-5103", "status": "active", "wfType": "case", "totalSla": 146 },
    "nodeSla": { "n2": "1", "n3": "5", "n4": "10", "n5": "120", "n6": "5", "n7": "5" },
    "group": [ "{{GRP_ID_TELESALES}}" ],
    "pic": [ "sup.c.tele", "agent.c01" ] },
  { "metadata": { "title": "SKYCC-Tech Support", "description": "Technical support flow for sub-types 5201-5203", "status": "active", "wfType": "case", "totalSla": 139 },
    "nodeSla": { "n2": "1", "n3": "3", "n4": "5", "n5": "120", "n6": "5", "n7": "5" },
    "group": [ "{{GRP_ID_PROGRAM_B}}" ],
    "pic": [ "sup.b.tech", "agent.b01" ] },
  { "metadata": { "title": "SKYCC-Back Office", "description": "Back-office processing flow for sub-types 5301-5303", "status": "active", "wfType": "case", "totalSla": 530 },
    "nodeSla": { "n2": "5", "n3": "10", "n4": "15", "n5": "480", "n6": "15", "n7": "5" },
    "group": [ "{{GRP_ID_PROGRAM_A}}" ],
    "pic": [] }
]
```

| title | New | Assigned | Acknowledge | In-progress | Done | Closed | totalSla | groups | pic |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SKYCC-Complaint | "1" | "5" | "5" | "240" | "10" | "5" | 266 | 3 program groups + `{{GRP_ID_QA}}` | `sup.a.cs`, `qa.lead` |
| SKYCC-Lead | "1" | "5" | "10" | "120" | "5" | "5" | 146 | `{{GRP_ID_TELESALES}}` | `sup.c.tele`, `agent.c01` |
| SKYCC-Tech Support | "1" | "3" | "5" | "120" | "5" | "5" | 139 | `{{GRP_ID_PROGRAM_B}}` | `sup.b.tech`, `agent.b01` |
| SKYCC-Back Office | "5" | "10" | "15" | "480" | "15" | "5" | 530 | `{{GRP_ID_PROGRAM_A}}` | *(none — no back-office agent account in C.3)* |

Group/roster derivation (C.2 has no technical or back-office group):

- **Voice Inquiry** serves sub-types 5001–5004, which are routed to three different client programs,
  so all three program groups are node targets.
- **Complaint** adds `QA & Compliance`, which C.2 defines as "call and case QA, compliance
  sampling".
- **Tech Support** targets `Program B Delivery` — C.2's own purpose line for that group is "client B
  work", and client B's technical program is C.1 #7.
- **Back Office** targets `Program A Delivery` (client A's document processing is the only back-office
  program in C.1). No back-office *agent* account exists in C.3, so `pic` is empty; set it per shift.

`formId` is deliberately a placeholder: forms (§20) are created **after** workflows (the sub-type
form needs `wfId` first), so either leave `formId` out and link later through the editor, or re-PATCH
the two nodes once the form ids exist. See §27 D5 and §25 item 7 for the form→sub-type link, which is
a different mechanism.

Direct call:

```json
{
  "query": "mutation ($input: WorkFlowInput!) { Workflow { CreateWorkflow(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the five bodies above" } }
}
```

Capture each response's `wfId` → `{{WF_ID_VOICE_INQUIRY}}`, `{{WF_ID_COMPLAINT}}`, `{{WF_ID_LEAD}}`,
`{{WF_ID_TECH}}`, `{{WF_ID_BACKOFFICE}}`.

> **Orders workflow is not creatable here.** The prototype document's `Order Part` flow
> (1/3/10/30/40/60/30/2,880/5 = 3,059 min) and its default name
> `SparePart - Do not Change / Delete` are orders-workflow data: the status rows come from the
> backend `OrderStatus`/`RequestStatus` catalogs and the default workflow name is a backend
> `app_configs` value. Both are **UNVERIFIED** in this repo — see §26 item 6.

## 15. Case types — `POST /casetypes/add`

Body type: `CaseTypesCreateData { active, en, th }` — `src/cms/types/case.ts:328-332`.
The create form has exactly two inputs (EN, TH); `typeId` is **server-assigned** and there is **no
"Type Code" field** anywhere (runbook S7b, C6) — the `1001…`-style codes a field-service document
shows cannot be typed in.

GQL key: `"/casetypes/add"` (literal) → `CreateCaseType` / root `CaseTypes` / `CaseTypeInput!` —
`src/cms/store/api/graphql/caseTypeQueries.ts:22-28,86`.

Data: runbook C.5 — five types, mirroring C.0's five service lines:

```json
[
  { "active": true, "en": "Customer Service", "th": "บริการลูกค้า" },
  { "active": true, "en": "Complaint & Escalation", "th": "ข้อร้องเรียน" },
  { "active": true, "en": "Telesales", "th": "ขายทางโทรศัพท์" },
  { "active": true, "en": "Technical Support", "th": "สนับสนุนเทคนิค" },
  { "active": true, "en": "Back Office", "th": "งานหลังบ้าน" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseTypeInput!) { CaseTypes { CreateCaseType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Customer Service", "th": "บริการลูกค้า" } }
}
```

Capture each response's `sTypeId` → `{{S_TYPE_ID_CS}}`, `{{S_TYPE_ID_COMPLAINT}}`,
`{{S_TYPE_ID_TELESALES}}`, `{{S_TYPE_ID_TECH}}`, `{{S_TYPE_ID_BACKOFFICE}}` (in array order).
§16 `typeId` references **these** ids, not the document's `sTypeCode` numbers.

## 16. Case sub-types — `POST /casesubtypes/add`

Body type: `CaseSubTypesCreateData { active, caseSla, en, priority, sTypeCode, th, typeId,
unitPropLists, userSkillList, wfId, mDeviceType, mDeviceTypeName, mWorkOrderType }` —
`src/cms/types/case.ts:246-260`.

GQL key: `"/casesubtypes/add"` (literal) → `CreateCaseSubType` / root `CaseSubTypes` /
`CaseSubTypeInput!` — `caseTypeQueries.ts:57-63,95`.

Field rules (code truth, in the order the form applies them):

- **Required by the form** — `en`, `th`, `sTypeCode`, `typeId`, `priority`, `unitPropLists`,
  `userSkillList`, `wfId`, `mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`
  (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:325-365`).
- **`caseSla` is NOT required** — the validation is commented out (`:333-336`) and a blank value
  saves as `"0"` (`:581`). Always type it anyway: it is what the SLA monitor compares against, and
  `gqlMapper` strips `""`, which is why the save path substitutes `"0"` explicitly.
- **`caseSla` = the workflow's `totalSla`.** Selecting a workflow fills the field from
  `workflow.metadata.totalSla` (`:142-146`), including a genuine `0`. The values below are the §14
  totals — 30 / 266 / 146 / 139 / 530 — and therefore cannot drift from the workflow.
- **`priority` is a string `"0"`…`"9"`** — the Select is literally `[0..9].map(String)`
  (`:1028-1030`). Views bucket it `0 = Critical`, `1–3 = High`, `4–6 = Medium`, `7–9 = Low`
  (`getTextPriority`, `src/cms/components/function/Prioriy.tsx:20-25`; band sizes match
  `PRIORITY_CONFIG`, `src/cms/utils/constants.ts:245-250`). The document gives labels, not tokens →
  midpoints used, §26 item 1.
- **`unitPropLists`** — `propId`s from §11; the runbook's instruction is "assign the property that
  matches the channel", i.e. one property per row.
- **`userSkillList`** — `skillId`s from §10, exactly the C.4 "sub-types that require it" column.
- **`mDeviceType` / `mDeviceTypeName` / `mWorkOrderType`** are the product's **mandatory**
  device/work-order metadata whose UI labels are "Device Type", "Device Type Name" and "Case Type"
  (runbook L26). The SKYCC convention is the channel/terminal class in the first two and the
  business work type in the third — keep one spelling per tenant, because it lands in reporting.
- **KB article mapping runs after the save.** On create the form immediately calls
  `SyncServiceTypeArticles` for the new sub-type (`ServiceManagement.tsx:605-622`), so §22.5 is only
  needed for the manual re-map — and a failing mapping call surfaces as an error toast **even
  though the sub-type was saved** (runbook L16). Verify the row in the tree before re-saving.

Data: runbook C.5 — fifteen sub-types. `sTypeCode` is the only business code the product accepts.

```json
[
  { "active": true, "sTypeCode": "5001", "en": "Product & Service Inquiry", "th": "สอบถามสินค้าและบริการ",
    "priority": "2", "caseSla": "30", "typeId": "{{S_TYPE_ID_CS}}",
    "wfId": "{{WF_ID_VOICE_INQUIRY}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_INBOUND}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Voice" },
  { "active": true, "sTypeCode": "5002", "en": "Order Status", "th": "ตรวจสอบสถานะคำสั่งซื้อ",
    "priority": "5", "caseSla": "30", "typeId": "{{S_TYPE_ID_CS}}",
    "wfId": "{{WF_ID_VOICE_INQUIRY}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_INBOUND}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Voice" },
  { "active": true, "sTypeCode": "5003", "en": "Billing & Payment", "th": "การเรียกเก็บเงิน",
    "priority": "2", "caseSla": "30", "typeId": "{{S_TYPE_ID_CS}}",
    "wfId": "{{WF_ID_VOICE_INQUIRY}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_BILLING}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Voice" },
  { "active": true, "sTypeCode": "5004", "en": "Callback Request", "th": "ขอนัดโทรกลับ",
    "priority": "8", "caseSla": "30", "typeId": "{{S_TYPE_ID_CS}}",
    "wfId": "{{WF_ID_VOICE_INQUIRY}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_INBOUND}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Voice" },
  { "active": true, "sTypeCode": "5005", "en": "Complaint & Escalation", "th": "ข้อร้องเรียนและส่งต่อ",
    "priority": "0", "caseSla": "266", "typeId": "{{S_TYPE_ID_COMPLAINT}}",
    "wfId": "{{WF_ID_COMPLAINT}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_COMPLAINT}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Complaint" },
  { "active": true, "sTypeCode": "5006", "en": "Retention & Cancellation", "th": "ยกเลิกและรักษาลูกค้า",
    "priority": "2", "caseSla": "266", "typeId": "{{S_TYPE_ID_COMPLAINT}}",
    "wfId": "{{WF_ID_COMPLAINT}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_RETENTION}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Retention" },
  { "active": true, "sTypeCode": "5101", "en": "Lead Follow-up", "th": "ติดตามผู้สนใจ",
    "priority": "2", "caseSla": "146", "typeId": "{{S_TYPE_ID_TELESALES}}",
    "wfId": "{{WF_ID_LEAD}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TELESALES}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Tele-sales" },
  { "active": true, "sTypeCode": "5102", "en": "Upsell & Cross-sell", "th": "เสนอขายเพิ่ม",
    "priority": "5", "caseSla": "146", "typeId": "{{S_TYPE_ID_TELESALES}}",
    "wfId": "{{WF_ID_LEAD}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TELESALES}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Tele-sales" },
  { "active": true, "sTypeCode": "5103", "en": "Tele-survey", "th": "สำรวจความพึงพอใจ",
    "priority": "8", "caseSla": "146", "typeId": "{{S_TYPE_ID_TELESALES}}",
    "wfId": "{{WF_ID_LEAD}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TELESALES}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Survey" },
  { "active": true, "sTypeCode": "5201", "en": "Service Down / Outage", "th": "ระบบขัดข้อง",
    "priority": "0", "caseSla": "139", "typeId": "{{S_TYPE_ID_TECH}}",
    "wfId": "{{WF_ID_TECH}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TECH}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Incident" },
  { "active": true, "sTypeCode": "5202", "en": "App & Web Issue", "th": "ปัญหาแอปและเว็บ",
    "priority": "2", "caseSla": "139", "typeId": "{{S_TYPE_ID_TECH}}",
    "wfId": "{{WF_ID_TECH}}", "unitPropLists": [ "{{PROP_ID_CHAT_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TECH}}" ],
    "mDeviceType": "CHAT", "mDeviceTypeName": "Chat", "mWorkOrderType": "Incident" },
  { "active": true, "sTypeCode": "5203", "en": "Device & Network Setup", "th": "ตั้งค่าอุปกรณ์และเครือข่าย",
    "priority": "5", "caseSla": "139", "typeId": "{{S_TYPE_ID_TECH}}",
    "wfId": "{{WF_ID_TECH}}", "unitPropLists": [ "{{PROP_ID_VOICE_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_TECH}}" ],
    "mDeviceType": "VOICE", "mDeviceTypeName": "Voice", "mWorkOrderType": "Incident" },
  { "active": true, "sTypeCode": "5301", "en": "Email Response", "th": "ตอบกลับทางอีเมล",
    "priority": "2", "caseSla": "530", "typeId": "{{S_TYPE_ID_BACKOFFICE}}",
    "wfId": "{{WF_ID_BACKOFFICE}}", "unitPropLists": [ "{{PROP_ID_EMAIL_SEAT}}" ],
    "userSkillList": [ "{{SKILL_ID_BACKOFFICE}}" ],
    "mDeviceType": "EMAIL", "mDeviceTypeName": "Email", "mWorkOrderType": "Back office" },
  { "active": true, "sTypeCode": "5302", "en": "Document Processing", "th": "งานเอกสาร",
    "priority": "5", "caseSla": "530", "typeId": "{{S_TYPE_ID_BACKOFFICE}}",
    "wfId": "{{WF_ID_BACKOFFICE}}", "unitPropLists": [ "{{PROP_ID_BACK_OFFICE}}" ],
    "userSkillList": [ "{{SKILL_ID_BACKOFFICE}}" ],
    "mDeviceType": "BACKOFFICE", "mDeviceTypeName": "Back office", "mWorkOrderType": "Back office" },
  { "active": true, "sTypeCode": "5303", "en": "Data Verification", "th": "ตรวจสอบข้อมูล",
    "priority": "5", "caseSla": "530", "typeId": "{{S_TYPE_ID_BACKOFFICE}}",
    "wfId": "{{WF_ID_BACKOFFICE}}", "unitPropLists": [ "{{PROP_ID_BACK_OFFICE}}" ],
    "userSkillList": [ "{{SKILL_ID_BACKOFFICE}}" ],
    "mDeviceType": "BACKOFFICE", "mDeviceTypeName": "Back office", "mWorkOrderType": "Back office" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseSubTypeInput!) { CaseSubTypes { CreateCaseSubType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the fifteen bodies above" } }
}
```

Capture each response's `sTypeId` → `{{SUBTYPE_ID_5001}}` … `{{SUBTYPE_ID_5303}}` (needed by
§22.5, which keys on `cmsServiceTypeId`).

Channel→property mapping used above: `VOICE` → `Voice Seat`, `CHAT` → `Chat Seat`,
`EMAIL` → `Email Seat`, `BACKOFFICE` → `Back Office` (C.12 property names). The language properties
(`Thai`, `English`), `Tier 2` and `Supervisor Seat` describe the **seat**, and are assigned in §13 —
not on the sub-type.

## 17. User skills — `POST /users_with_skills_batch/add`

Body type: `UserWithSkillsBatchUpdateData { active, skillIds, userName }` —
`src/core/types/user.ts:45-49`. (The operation is a *set* — one call per user, replacing that
user's skill list.)

GQL key: `"/users_with_skills_batch/add"` (literal) → `UpdateUserSkillBatch` / root `UserSkill` /
`UserSkillBatchInput!` — `src/core/store/api/graphql/userQueries.ts:95-97,146-148`.

Data: derived from C.4's routing meanings plus the sub-type `userSkillList` already fixed in §16.
The four agent accounts are the only users who take cases; supervisors/QA/trainer/WFM are
assigned by role, not by skill.

| userName | skillIds (placeholders) |
| --- | --- |
| `agent.a01` | `{{SKILL_ID_INBOUND}}`, `{{SKILL_ID_BILLING}}`, `{{SKILL_ID_ENGLISH}}` |
| `agent.a02` | `{{SKILL_ID_INBOUND}}`, `{{SKILL_ID_ENGLISH}}` |
| `agent.c01` | `{{SKILL_ID_TELESALES}}`, `{{SKILL_ID_RETENTION}}` |
| `agent.b01` | `{{SKILL_ID_TECH}}`, `{{SKILL_ID_BACKOFFICE}}` |
| `sup.a.cs` | `{{SKILL_ID_COMPLAINT}}` |

```json
{ "active": true, "userName": "agent.a01",
  "skillIds": [ "{{SKILL_ID_INBOUND}}", "{{SKILL_ID_BILLING}}", "{{SKILL_ID_ENGLISH}}" ] }
```

Direct call:

```json
{
  "query": "mutation ($input: UserSkillBatchInput!) { UserSkill { UpdateUserSkillBatch(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "userName": "agent.a01", "skillIds": [ "{{SKILL_ID_INBOUND}}" ] } }
}
```

> The matrix is derived, not transcribed — C.4 says which **sub-type** needs which skill and that
> `English Service` is "any sub-type, as a second skill". Confirm the roster before running (§26
> item 7).

## 18. Contact configuration — `POST /customer_form_config`

Body type: `CustomerFormConfigType` — `src/cms/types/customer.ts:22-51`: flat booleans, `address`
and `currentAddress` (each an `AddressConfig` with 13 sub-flags, `customer.ts:3-17`), plus optional
`social`, `dynamicForm`, `dynamicFormEnable`.

GQL key: `"/customer_form_config"` POST → `UpdateCustomerForm` / root `CustomerForm` /
`CustomerFormConfigUpdateInput!` — `src/cms/store/api/graphql/customerFormQueries.ts:39-45,57-60`
(the app posts the whole config, `src/cms/store/api/custommerApi.ts:241-249`).

Data: runbook C.8 — "voice-first BPO: minimise what the agent sees, maximise what routing needs".
Show Y: `displayName`, `firstName`, `lastName`, `mobileNo`, `email`, `userType`, `note`,
`languagePreference`, `contractPreference`, `social`, dynamic form. Show N: `title`, `middleName`,
`citizenId`, `dob`, `blood`, `gender`, `photo`, **and both address blocks entirely off**.

```json
{
  "displayName": true, "title": false, "firstName": true, "middleName": false,
  "lastName": true, "citizenId": false, "dob": false, "blood": false, "gender": false,
  "mobileNo": true,
  "address": {
    "building": false, "country": false, "district": false, "floor": false, "lat": false,
    "lon": false, "no": false, "postalCode": false, "province": false, "road": false,
    "room": false, "street": false, "subDistrict": false
  },
  "photo": false, "email": true, "userType": true, "note": true,
  "languagePreference": true, "contractPreference": true,
  "social": true,
  "currentAddress": {
    "building": false, "country": false, "district": false, "floor": false, "lat": false,
    "lon": false, "no": false, "postalCode": false, "province": false, "road": false,
    "room": false, "street": false, "subDistrict": false
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

`dynamicForm` (the embedded form object) is left to the server default — C.8 marks the *feature*
enabled, not a specific form. `social` is optional in the type on purpose and every consumer tests
`!== false`, so an absent value means "shown"; it is sent explicitly here so the stored config says
so.

## 19. Appointment types — callbacks — `POST /appointment_types`

Body type: `AppointmentTypeInsert { appointmentTypeId?, en, th, active }` —
`src/cms/types/appointmentType.ts:14-19` (`appointmentTypeId` optional; the API keys the row on it,
not on the numeric `id`).

GQL key: `"/appointment_types"` POST (method-keyed — a bare key would compile POST into the list
query) → `CreateAppointmentType` / root `AppointmentType` / `AppointmentTypeInput!` —
`src/cms/store/api/graphql/appointmentTypeQueries.ts:16-22,43-47`.

Data: runbook C.9 — four callback windows, name + `active` only:

```json
[
  { "en": "Callback 15 min", "th": "โทรกลับภายใน 15 นาที", "active": true },
  { "en": "Callback 1 hour", "th": "โทรกลับภายใน 1 ชั่วโมง", "active": true },
  { "en": "Follow-up Call", "th": "โทรติดตามผล", "active": true },
  { "en": "Escalation Callback", "th": "โทรกลับกรณีเร่งด่วน", "active": true }
]
```

Direct call:

```json
{
  "query": "mutation ($input: AppointmentTypeInput!) { AppointmentType { CreateAppointmentType(input: $input) { status msg data desc } } }",
  "variables": { "input": { "en": "Callback 15 min", "th": "โทรกลับภายใน 15 นาที", "active": true } }
}
```

Capture `appointmentTypeId` → `{{APT_TYPE_ID_CALLBACK_15M}}`,
`{{APT_TYPE_ID_CALLBACK_1H}}`, `{{APT_TYPE_ID_FOLLOWUP}}`, `{{APT_TYPE_ID_ESCALATION}}`.

⚠ **Check `GET /appointment_types` first.** The prototype document's roadmap says the backend
creates three defaults with the tenant (`General`, `Consult`, `Product Advise`) — those are the
SKYICT-era defaults, not the C.9 callback set, and creating both would leave agents choosing between
two vocabularies. See §27 D8.

The product does not dial: the callback is still made on the PBX (runbook S0).

## 20. Dynamic forms — `POST /forms`

Body type: ⚠ **inline-typed** — `createForm` accepts
`{ active, formColSpan: number, formFieldJson: IndividualFormField[], formName, locks, publish,
formType }` (`src/cms/store/api/formApi.ts:159-182`); no named `FormCreateData` interface exists
(§25 item 7). `formType` is `"case" | "customer"` (`formTypeOption`,
`src/cms/utils/constants.ts:333-336`).

`IndividualFormField` (`src/cms/components/interface/FormField.tsx:4-27`): `id`, `label`, `type`,
`value`, `required`, optional `showLabel`, `colSpan`, `isChild`, `options` (**`any[]`**), `placeholder`,
`enableSearch`, `GroupColSpan`, `DynamicFieldColSpan`, `formRule` (`FormRule` validation only,
`:29-45`), `pii`. Field `type` vocabulary from the builder's own registry
(`src/cms/components/form/dynamic-form/constant.tsx:42-64`): `textInput`, `Integer`,
`textAreaInput`, `emailInput`, `option`, `select`, `image`, `dndImage`, `multiImage`, `dndMultiImage`,
`dateInput`, `dateLocal`, `radio`, `InputGroup`, `dynamicField`.

GQL key: `"/forms"` POST (method-keyed) → `CreateForms` / root `Forms` / `FormInput!` —
`src/cms/store/api/graphql/formQueries.ts:30-36,56-59`.

Data: runbook C.7 — four forms, one per case **type** (the runbook's binding intent). The runbook
gives field *purposes* and requiredness, not option values, so option lists are placeholders.

Mapping used below (C.7 vocabulary → builder widget): `select` → `select`; `text` → `textInput`;
`checkbox` → `option`; `multi` → `option`; `date` → `dateInput`; `notes` → `textAreaInput`. The one
exception is `escalation owner (req, group)` in the Complaint form — **there is no group/user picker
field type** in the builder (§25 item 5); it is modelled here as a `select` over the C.2 group names
with a flag.

**Form 1 — Voice Disposition Form** (sub-types 5001–5004, 5101–5103):

```json
{
  "formName": "Voice Disposition Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "Contact outcome", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_CONTACT_OUTCOME}}" ], "formRule": {} },
    { "id": "f2", "label": "Customer identity check", "type": "option", "value": [], "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_IDENTITY_VERIFIED}}", "{{OPT_IDENTITY_FAILED}}" ], "formRule": {} },
    { "id": "f3", "label": "Intent", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_INTENT}}" ], "formRule": {} },
    { "id": "f4", "label": "Resolution offered", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f5", "label": "Call-back needed", "type": "option", "value": [], "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "options": [ "{{OPT_YES}}", "{{OPT_NO}}" ], "formRule": {} },
    { "id": "f6", "label": "Call-back time", "type": "dateLocal", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f7", "label": "Notes", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f8", "label": "Complaint flag", "type": "option", "value": [], "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "options": [ "{{OPT_YES}}", "{{OPT_NO}}" ], "formRule": {} }
  ]
}
```

**Form 2 — Complaint & Retention Form** (sub-types 5005, 5006):

```json
{
  "formName": "Complaint & Retention Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "Complaint category", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_COMPLAINT_CATEGORY}}" ], "formRule": {} },
    { "id": "f2", "label": "Severity", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_SEVERITY}}" ], "formRule": {} },
    { "id": "f3", "label": "What was promised", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f4", "label": "Remediation", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_REMEDIATION}}" ], "formRule": {} },
    { "id": "f5", "label": "Escalation owner", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "Program A Delivery", "Program B Delivery", "Program C Delivery", "QA & Compliance", "Workforce & Traffic", "Training & CX Academy" ], "formRule": {} },
    { "id": "f6", "label": "SLA breach flag", "type": "option", "value": [], "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "options": [ "{{OPT_YES}}", "{{OPT_NO}}" ], "formRule": {} },
    { "id": "f7", "label": "Notes", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} }
  ]
}
```

**Form 3 — Technical Support Form** (sub-types 5201, 5202, 5203):

```json
{
  "formName": "Technical Support Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "Affected system", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f2", "label": "First-occurrence time", "type": "dateLocal", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f3", "label": "Scope / blast radius", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_BLAST_RADIUS}}" ], "formRule": {} },
    { "id": "f4", "label": "Steps already tried", "type": "option", "value": [], "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "options": [ "{{OPT_STEPS_TRIED}}" ], "formRule": {} },
    { "id": "f5", "label": "Workaround given", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f6", "label": "Incident reference", "type": "textInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f7", "label": "Notes", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} }
  ]
}
```

**Form 4 — Back Office Case Form** (sub-types 5301, 5302, 5303):

```json
{
  "formName": "Back Office Case Form",
  "formType": "case",
  "formColSpan": 2,
  "active": true,
  "publish": true,
  "locks": false,
  "formFieldJson": [
    { "id": "f1", "label": "Document type", "type": "textInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f2", "label": "Received channel", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_RECEIVED_CHANNEL}}" ], "formRule": {} },
    { "id": "f3", "label": "Verification result", "type": "select", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "options": [ "{{OPT_VERIFICATION_RESULT}}" ], "formRule": {} },
    { "id": "f4", "label": "Discrepancy detail", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f5", "label": "Target completion date", "type": "dateInput", "value": "", "showLabel": true, "required": true, "colSpan": 2, "isChild": false, "formRule": {} },
    { "id": "f6", "label": "Notes", "type": "textAreaInput", "value": "", "showLabel": true, "required": false, "colSpan": 2, "isChild": false, "formRule": {} }
  ]
}
```

Direct call:

```json
{
  "query": "mutation ($input: FormInput!) { Forms { CreateForms(input: $input) { status msg data desc } } }",
  "variables": { "input": { "...": "one of the four bodies above" } }
}
```

Notes that the payload cannot express:

- **Labels are single-language.** `IndividualFormField.label` is one string, and C.7 gives English
  field purposes only — the four forms above are EN. A TH tenant needs the labels translated before
  creating (§26 item 8).
- **No form→sub-type field.** The builder posts only `id` to `/forms/casesubtype`, with the
  `caseSubType` key commented out (`src/cms/store/api/formApi.ts:201-209`); the read side is
  `POST /forms/casesubtype` with `{ id: sTypeId }` (`:213-219`). How the link is stored is
  **UNVERIFIED** (runbook S8, §26 item 9). The acceptance check is that
  `/forms/casesubtype?id={sTypeId}` returns the form.
- **C.7's "one form per case type"** is therefore an intent, not a payload field: the four forms
  above correspond to the five types (§15) with CS and Complaint split out and Telesales grouped
  with Voice — matching C.7's own sub-type column, not the type boundaries.

## 21. Case results (close reasons) — `POST /case/result/add`

Body type: `CaseResultCreateData { active, en, th }` — `src/cms/types/caseResult.ts:29-33`
(`resId` is server-generated).

GQL key: `"/case/result/add"` (literal) → `CreateCaseResult` / root `CaseResult` /
`CaseResultInput!` — `src/cms/store/api/graphql/caseResultQueries.ts:28-34,56`.

Data: runbook C.11 — seven reasons, modelled on what SKYCC must report to its clients (resolved /
deferred / handed to client / escalated / lost contact):

```json
[
  { "active": true, "en": "Resolved on Call", "th": "แก้ไขจบในสาย" },
  { "active": true, "en": "Callback Scheduled", "th": "นัดโทรกลับ" },
  { "active": true, "en": "Transferred to Client", "th": "ส่งต่อให้ลูกค้า" },
  { "active": true, "en": "Transferred to Tier 2", "th": "ส่งต่อทีมเทคนิค" },
  { "active": true, "en": "Customer Disconnected", "th": "ลูกค้าวางสาย" },
  { "active": true, "en": "Duplicate Contact", "th": "ติดต่อซ้ำ" },
  { "active": true, "en": "No Action Required", "th": "ไม่ต้องดำเนินการ" }
]
```

Direct call:

```json
{
  "query": "mutation ($input: CaseResultInput!) { CaseResult { CreateCaseResult(input: $input) { status msg data desc } } }",
  "variables": { "input": { "active": true, "en": "Resolved on Call", "th": "แก้ไขจบในสาย" } }
}
```

> C.11 writes the third row's Thai as `ส่งต่อให้ลูกค้า (client brand)`; the parenthetical is the
> document's annotation, not part of the reason string, so it is dropped here. Seed this **before**
> the pilot: the close-case dialog forces a reason and an empty list pushes agents to whatever
> generic option exists, which destroys the reporting value (runbook S15).
> Case **statuses** (S000–S019) are a backend catalog, read-only `GET /case_status`
> (`src/cms/store/api/serviceApi.ts:13-24`) — no create contract exists (§25 item 4).

## 22. Knowledge base (KMS) — inline GraphQL documents

The KMS is an architectural island: its own `graphqlRequest` helper, **inline string queries**
(mutations declared as `query`), no RTK Query, and no typed input interfaces for category/file
operations. The documents below are exactly the shapes the code builds
(`src/kms/articles/service/category.service.ts`, `src/kms/files/service/files.service.ts`,
`src/kms/articles-create-update/service/article-form.service.ts`). ⚠ No typed TS input interface
exists for any KMS create operation (§25 items 11–12).

### 22.1 KB categories — `KBCategory.AddCategory`

Built at `category.service.ts:103-112` — inputs `{ name_th, name_en, parentId: number|null, seq }`.
Create parents before children; `parentId` is the **numeric** category id, so capture each returned
`data` before creating its children.

Data: runbook C.10 — ten categories, three levels:

```graphql
# level 0
query { KBCategory { AddCategory(input: { name_th: "การปฏิบัติงาน", name_en: "Operations", parentId: null, seq: 1 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "สรุปโครงการลูกค้า", name_en: "Program Briefs", parentId: null, seq: 2 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "การปฏิบัติตามกฎ", name_en: "Compliance", parentId: null, seq: 3 }) { statusCode success message data } } }

# level 1 — under Operations
query { KBCategory { AddCategory(input: { name_th: "บทพูดของเจ้าหน้าที่", name_en: "Agent Scripts", parentId: {{KB_ID_OPERATIONS}}, seq: 1 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "การส่งต่อ", name_en: "Escalation", parentId: {{KB_ID_OPERATIONS}}, seq: 2 }) { statusCode success message data } } }

# level 2 — under Agent Scripts / Escalation
query { KBCategory { AddCategory(input: { name_th: "การทักทายและยืนยันตัวตน", name_en: "Greeting & Verification", parentId: {{KB_ID_AGENT_SCRIPTS}}, seq: 1 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "ตารางส่งต่อ", name_en: "Tier 2 & Supervisor Matrix", parentId: {{KB_ID_ESCALATION}}, seq: 1 }) { statusCode success message data } } }

# level 1 — under Program Briefs
query { KBCategory { AddCategory(input: { name_th: "ลูกค้า A", name_en: "Client A", parentId: {{KB_ID_PROGRAM_BRIEFS}}, seq: 1 }) { statusCode success message data } } }
query { KBCategory { AddCategory(input: { name_th: "ลูกค้า C", name_en: "Client C Telesales", parentId: {{KB_ID_PROGRAM_BRIEFS}}, seq: 2 }) { statusCode success message data } } }

# level 1 — under Compliance
query { KBCategory { AddCategory(input: { name_th: "ข้อห้ามและ PDPA", name_en: "Do-Not-Say & PDPA", parentId: {{KB_ID_COMPLIANCE}}, seq: 1 }) { statusCode success message data } } }
```

Capture: `{{KB_ID_OPERATIONS}}`, `{{KB_ID_PROGRAM_BRIEFS}}`, `{{KB_ID_COMPLIANCE}}`,
`{{KB_ID_AGENT_SCRIPTS}}`, `{{KB_ID_ESCALATION}}`, `{{KB_ID_GREETING}}`,
`{{KB_ID_TIER2_MATRIX}}`, `{{KB_ID_CLIENT_A}}`, `{{KB_ID_CLIENT_C}}`, `{{KB_ID_PDPA}}`.

### 22.2 KB file folders — `KBArticlefile.CreateFolder`

Built at `files.service.ts:224-233` — inputs `{ folder, folderName }` where `folder` is the **parent
path with a trailing slash** (`""` for a root-level folder) and `folderName` is the last segment; the
helper derives both from one path string.

Data: runbook C.10 files — root `SKYCC`, four level-1 folders, one level-2 folder:

```graphql
# level 1 — under the SKYCC root
query { KBArticlefile { CreateFolder(input: { folder: "SKYCC/", folderName: "Scripts" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYCC/", folderName: "Program Briefs" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYCC/", folderName: "Training" }) { statusCode success message } } }
query { KBArticlefile { CreateFolder(input: { folder: "SKYCC/", folderName: "Escalation Contacts" }) { statusCode success message } } }

# level 2 — under Training
query { KBArticlefile { CreateFolder(input: { folder: "SKYCC/Training/", folderName: "Wave Handover" }) { statusCode success message } } }
```

The runbook names `SKYCC` as the **root** folder (`Files: root SKYCC → Scripts, …`). Creating the
root itself is `{ folder: "", folderName: "SKYCC" }` if the tenant has no root yet — run that first,
check `GET` the folder tree, and then the five above.

File uploads have **no simple create mutation** — the pipeline is
`InitiateMultipart` → `PresignPart` → XHR PUT → `CompleteMultipart` (`files.service.ts:332-376`).
⚠ No typed create-file contract exists (§25 item 11).

### 22.3 KB articles — `KBArticles.CreateArticle`

Query document at `article-form.service.ts:140-150`; variables built at `:158-176` from
`ArticleFormInput` (`src/kms/articles-create-update/dtos/article-form.dto.ts:5-24`):
`title, version, description, priority: number|null, source: number|null, reserveDate,
ownership: number|null, relatedArticles: number[], categoryKey, attachments, content, startDate,
endDate, viewableGroups: number[], keywords: { id?, title }[]`.

⚠ The numeric catalog ids (`priority`, `source`, `ownership`, `viewableGroups`) are tenant data and
are not given in C.10 → `null` / `[]` placeholders (§26 items 10–11).
`categoryKey` = the category id from §22.1. `{{CONTENT_*}}` = the article body, which C.10 does not
provide.

```graphql
query CreateArticle($input: ArticleCreateInput) {
  KBArticles { CreateArticle(input: $input) { success message data } }
}
```

```json
[
  {
    "title": "Greeting & Identity Verification Script", "version": "1.0",
    "description": "Agent Scripts > Greeting & Verification",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_ID_GREETING}}",
    "attachments": [], "content": "{{CONTENT_GREETING_SCRIPT}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "greeting" }, { "title": "verification" }, { "title": "script" } ]
  },
  {
    "title": "Client A Card Services — Program Brief", "version": "1.0",
    "description": "Program Briefs > Client A",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_ID_CLIENT_A}}",
    "attachments": [], "content": "{{CONTENT_CLIENT_A_BRIEF}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "client A" }, { "title": "program brief" } ]
  },
  {
    "title": "Escalation Matrix Tier 2", "version": "1.0",
    "description": "Operations > Escalation",
    "priority": null, "source": null, "reserveDate": "", "ownership": null,
    "relatedArticles": [], "categoryKey": "{{KB_ID_ESCALATION}}",
    "attachments": [], "content": "{{CONTENT_ESCALATION_MATRIX}}",
    "startDate": "", "endDate": "", "viewableGroups": [],
    "keywords": [ { "title": "escalation" }, { "title": "tier 2" } ]
  }
]
```

Note the second article's `categoryKey` is the **L1** `Client A` category, matching C.10's arrow
(`→ Client A`), and the third's is `Escalation`, not the `Tier 2 & Supervisor Matrix` L2 — C.10 maps
the article to `Escalation`. Keep that exactly: pointing it at the L2 category would leave C.10's
stated parent empty.

### 22.4 Article status transitions — `KBArticles.UpdateArticleStatus`

Query document at `article-form.service.ts:218-228`; inputs `{ id, comment, status_id }` where
`id` and `status_id` are **numbers** (`ArticleStatusInput`,
`src/kms/articles-create-update/dtos/article-form.dto.ts:54-59`).

⚠ The numeric `status_id` values for draft / review / published are backend catalog rows — the code
carries only the string enum (`ArticleStatus`,
`src/kms/articles/dtos/articles.dto.ts:5-15`) and each article's allowed transitions arrive as
`nextstatus: { id, value, seq, action_name_th, action_name_en, next_status_id }[]`
(`articles.dto.ts:138-146`). Read them from the article before sending.

```graphql
query UpdateArticle($input: ArticleUpdateStatusInput) {
  KBArticles { UpdateArticleStatus(input: $input) { success message data } }
}
```

```json
[
  { "id": {{KB_ART_GREETING}}, "comment": "Publish", "status_id": {{KB_STATUS_ID_PUBLISHED}} },
  { "id": {{KB_ART_CLIENT_A}}, "comment": "Move to review", "status_id": {{KB_STATUS_ID_REVIEW}} }
]
```

No call for the third article: C.10 leaves it in **Draft**, which is the state it is created in.

### 22.5 Map articles to case sub-types — `KBCMSServiceTypeArticle.SyncServiceTypeArticles`

Built at `src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts:38-56`
— `SyncServiceTypeArticleInput { cmsServiceTypeId: string, artId: number[] }`. Note `artId` is a
**number array**: send the numeric article id, not the `{{...}}`-quoted string form.

```graphql
query SyncServiceTypeArticles($input: SyncServiceTypeArticleInput) {
  KBCMSServiceTypeArticle { SyncServiceTypeArticles(input: $input) { success message data } }
}
```

```json
[
  { "cmsServiceTypeId": "{{SUBTYPE_ID_5001}}", "artId": [ {{KB_ART_GREETING}} ] },
  { "cmsServiceTypeId": "{{SUBTYPE_ID_5005}}", "artId": [ {{KB_ART_TIER2_MATRIX}} ] }
]
```

C.10 says "after the first two are published, map them onto sub-types 5001/5005". Read literally,
that is self-contradictory — the mapping tree lists **published** articles, and C.10's own status
targets are article 1 Published, article 2 Review, article 3 Draft. This package therefore maps
what is definitely published-at-this-point (the greeting script → 5001) and lists the Tier 2 matrix
as the 5005 candidate **conditional on publishing it first**. See §27 D10.

> Re-running is safe and expected: the sub-type save already calls this operation for its own
> `sTypeId` (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:605-622`),
> and a failing mapping call after a successful save produces a misleading error toast (runbook L16).

## 23. Organization settings — assignment rules ⚠

Body type: `OrgAssignmentRulesUpdateData { mode?, routingModes?: Partial<RoutingModes>,
allocationMethod?, advancedOptions?: Partial<AdvancedAssignmentOptions> }` —
`src/core/types/organization.ts:310-316`; `RoutingModes` `:280-290`; `AdvancedAssignmentOptions`
`:302-308`.

GQL key: `"/organizations/:id/assignment-rules"` PATCH → `UpdateOrgAssignmentRules` /
root `Organization` / `OrgAssignmentRulesInput!` — `src/core/store/api/graphql/organizationQueries.ts:167-183`
(the REST call is `src/core/store/api/organizationApi.ts:254-255`).

⚠ **This is a frontend contract ahead of the backend.** The load query falls back to schema defaults
on any error and **Save resolves `{ ok: false }`**, showing a persistent "not saved to server" banner
without discarding the edits (runbook S14; `src/core/types/organization.ts:265-274`). Until the
backend lands, treat the payload below as the **intent record** for the tenant, and configure the
same values through the UI so the banner is the evidence.

Data: runbook C.13:

```json
{
  "mode": "automatic",
  "routingModes": {
    "skillBased": true,
    "locationBased": false,
    "department": true,
    "availability": true,
    "caseType": true,
    "caseTypeSubTypes": [
      "{{SUBTYPE_ID_5001}}", "{{SUBTYPE_ID_5002}}", "{{SUBTYPE_ID_5003}}", "{{SUBTYPE_ID_5004}}",
      "{{SUBTYPE_ID_5005}}", "{{SUBTYPE_ID_5006}}", "{{SUBTYPE_ID_5101}}", "{{SUBTYPE_ID_5102}}",
      "{{SUBTYPE_ID_5103}}", "{{SUBTYPE_ID_5201}}", "{{SUBTYPE_ID_5202}}", "{{SUBTYPE_ID_5203}}",
      "{{SUBTYPE_ID_5301}}", "{{SUBTYPE_ID_5302}}", "{{SUBTYPE_ID_5303}}"
    ],
    "combineWithAnd": true
  },
  "allocationMethod": "load_balance",
  "advancedOptions": {
    "autoRequireAllSkills": true,
    "autoRespectShiftSchedule": false
  }
}
```

⚠ `advancedOptions.serviceSubType` (`"general" | "emergency" | "maintenance" | "inspection"`,
`organization.ts:299`) is a **required** field of the interface but has no SKYCC equivalent — it is
a field-service vocabulary. The payload above omits it, which only works while the field stays
optional on the record (`Partial<AdvancedAssignmentOptions>`); expressing `autoRequireAllSkills`
per SKYCC case type is not possible today (§25 item 13).

Runbook C.13 also covers the **package** (`essential` → `professional` → `enterprise`) and
`limits.maxAgents`. Neither is a payload: entitlements are resolved from fixtures, not an API
(`ENTITLEMENTS_SOURCE = "fixtures"`, `src/core/store/slices/entitlementSlice.ts:14`), and the
registry keys on the organization **string**, not `orgId`
(`src/core/mocks/entitlements/index.ts:18-24`). `SKYCC` is currently registered but aliases
SKYICT's file (`:5-6`) — a **frontend** change (runbook F3–F5), not a JSON payload. See §24.

## 24. What this package intentionally does NOT cover

- **Tenant / organization creation** — platform-side, no API in this repository (runbook §1).
- **Entitlements / package / seat limits** — fixture-driven, keyed by the organization string
  (`src/core/mocks/entitlements/index.ts:18-24`); `SKYCC` currently aliases SKYICT's fixture.
  Runbook F3–F5 (create `skycc.json`, register it, extend the tests) is a code change, not
  configuration data.
- **Permission catalog** — tenant-scoped platform data; §5 can only reference `permId` values that
  are read from the tenant.
- **Case statuses (S000–S019)** — backend catalog, read-only from the frontend
  (`src/cms/store/api/serviceApi.ts:13-24`). Also why §14 `action` values are placeholders.
- **Unit type / source / status / company catalogs** — read-only in this repo (`mdmQueries.ts:160-162`).
- **Area / Places / Devices (S11)** — runbook C.14 says **skip** for SKYCC: no field dispatch, no
  GIS. The prototype document's `Service Area List` (§9, `SKYCC` → `Central Zone` → `Station 1/2`
  with codes `11`/`1101`) is SKYICT's service-area table carried over, and the product's area model
  is Country → Province → District anyway (`src/cms/types/area.ts`) — it is not part of this
  package. See §27 D6.
- **CRM master data (S12)** — conditional: only for a program that sells goods. The prototype
  document's store rows (`HQ` / `Store 1` / `Store 2`) and its empty brand/category/product tables
  describe backend defaults, not SKYCC's catalogue. If a program needs it, the payload shapes are
  unchanged from `SKYICT-Pre-Config-JSON-Payloads.md` §11–§17 (brands → categories → products /
  spare parts → stores → stock).
- **Campaigns, lead lists, dialer, ACD queues, IVR, shift roster** — no such module exists in
  `src/` (runbook S0, L24). A campaign is modelled as a case type + workflow + KB brief, and
  call-backs are appointments (§19).
- **Customers and their product/service links** — C.0's tenant record fields have no place in the
  product, and the runbook's minimum paths do not require demo customers. The prototype document's
  customer table (Watee / Wisarud / Apiwat) is the SKYICT demo set; if demo customers are wanted,
  `AddCustomer` (`src/cms/types/customer.ts:54-104`) → `POST /customer/add` → `CreateCustomer` /
  `CustomerInput!` (`src/cms/store/api/graphql/customerQueries.ts:25-27,50-52`) is the contract.

## 25. Types / interfaces that must be added

Surfaces where the codebase has **no create contract** (or an incomplete one) for data the two
documents require. Each is either a new frontend type + endpoint, or a backend seed that must land
before this package can run end-to-end.

| # | Missing surface | What exists today | Needed for |
| --- | --- | --- | --- |
| 1 | `UnitTypeCreateData` + create endpoint | `/mdm/types` is GET-only (`src/cms/store/api/graphql/mdmQueries.ts:162`; only `getUnitTypes` at `src/cms/store/api/unitApi.ts:140-147`) | §12 `unitTypeId` — the CC seat/softphone vocabulary must be BE-seeded; today's is `Staff` |
| 2 | `SourceCreateData` + create endpoint | `/mdm/sources` is GET-only (`mdmQueries.ts:161`; `unitApi.ts:118-129`) | §12 `unitSourceId` — `Internal` / `External` must be BE-seeded |
| 3 | `CompanyCreateData` + create endpoint | `/mdm/companies` is GET-only (`mdmQueries.ts:160`; `unitApi.ts:105-116`), although `POST /mdm/companies/add` exists in the captured contract (`src/cms/mocks/mdmCURL.sh:524`) with **no TS type and no RTK endpoint** | §12 `compId` — the SKYCC company record must be BE-seeded |
| 4 | Case-status create/update contract | `GET /case_status` read-only (`serviceApi.ts:13-24`); `CaseStatus { statusId, th, en, color, active }` (`src/cms/types/case.ts:93-99`) | §14 node `action` values; any adjustment of S000–S019 |
| 5 | A form field type for a **user group / user reference** | `IndividualFormField.type` vocabulary has no group or user picker (`src/cms/components/form/dynamic-form/constant.tsx:42-64`) | §20 Form 2 `Escalation owner (req, group)` — modelled as a `select` over the C.2 group names |
| 6 | `description` on `UserGroupCreateData` | `UserGroup.description?` exists on the read model (`src/core/types/user.ts:304-305`) but the create/update types are `{ active, en, th }` (`:321-327`) | §8 — C.2's "Purpose" column has no create field |
| 7 | Named `FormCreateData` interface | `createForm` body is inline-typed (`src/cms/store/api/formApi.ts:159-182`) | §20 — no compile-time contract for a seeded form |
| 8 | Per-node `WorkflowNodeConfig` interface | `BaseNode.data.config` is `Record<string, unknown>` (`src/cms/types/workflow.ts:70`); the keys (`sla`, `SLA`, `group`, `pic`, `action`, `formId`, `condition`, `escalation*`) live only in `ConfigPanel.tsx` / `Editor.tsx` | §14 — config keys are editor convention, not a contract |
| 9 | Form → case sub-type link (create side) | `/forms/casesubtype` posts only `{ id }` with `caseSubType` commented out (`formApi.ts:201-219`); GQL key is POST-only (`formQueries.ts:60-62`) | §20 — C.7's "one form per case type" cannot be expressed in the create body |
| 10 | `RoleCreateData.en` / `.th` | Create/update types are `{ active, roleName }` (`src/core/types/role.ts:95-103`) although `Role.en?`/`Role.th?` exist on the read model (`:24-36`) | §4 — a bilingual role label cannot be set at create time |
| 11 | Typed `KBCategoryAddInput` / folder-create contract | Inline string queries only (`category.service.ts:103-112`; `files.service.ts:224-233`), mutations declared as `query`; the file upload pipeline is a 4-step protocol (`files.service.ts:332-376`) | §22.1/§22.2 — no typed input, no simple "create file" mutation |
| 12 | Typed GQL input for `ArticleCreateInput` | Variables are built ad hoc from the form DTO `ArticleFormInput` (`article-form.dto.ts:5-24`) in `article-form.service.ts:158-176`; `status_id` / `priority` / `source` / `ownership` are backend catalog numbers | §22.3/§22.4 — no TS type for the GQL input; numeric catalogs unlisted |
| 13 | Per-case-type advanced assignment options | `AdvancedAssignmentOptions` requires `serviceSubType: "general" \| "emergency" \| "maintenance" \| "inspection"` (`src/core/types/organization.ts:299-308`) — field-service vocabulary with no SKYCC mapping, and one option block per that enum only | §23 — `autoRequireAllSkills` cannot be expressed per SKYCC case type |
| 14 | Assignment-rules **write** contract (FE-ahead) | `PATCH /organizations/{orgId}/assignment-rules` is mapped (`organizationQueries.ts:167-183`) but Save resolves `{ ok: false }` (runbook S14; `organization.ts:265-274`) | §23 — the payload is an intent record until the backend lands |
| 15 | Tenant/organization + entitlement provisioning | No create API; entitlements are fixtures keyed by the organization **string**, and `SKYCC` aliases `skyict.json` (`src/core/mocks/entitlements/index.ts:5-6,18-24`) | §24 — must be done platform-side, plus runbook F3–F5 |

## 26. Unverified values

Values that could not be confirmed against code, or that need an org decision before the package is
final:

1. **`priority` token per sub-type (§16):** `0` / `2` / `5` / `8` are the midpoints of the
   `getTextPriority` buckets for Critical / High / Medium / Low (`Prioriy.tsx:20-25`). The
   label→token mapping is a product decision that exists nowhere in code (item 4 of §25 is the
   neighbouring gap for statuses, not priorities).
2. **Unit `priority: 0` (§12):** C.12 is silent; `0` is the unit form's default.
3. **`email` derivation (§6):** `<username>@skycc.co.th`. The domain is taken from the prototype
   document's account list; the local part is a stated convention, not transcribed data. Expect
   `empId`, `firstName`, `lastName` to be filled from HR before go-live — they are `""` here
   because C.3 gives only `username` + `displayName`.
4. **Property Thai names (§11):** C.12 lists the eight properties in English only. The eight
   `{{TH_PROP_*}}` placeholders must be filled by the tenant. `Not Spectify` / `ไม่ระบุ` is the one
   property pair both documents spell out.
5. **SEAT-005 / SEAT-006 (§12):** C.12 gives `—` as the login user. `UnitFormData.username` is
   required, so these two seats cannot be created until a back-office login is designated — either
   a new account in §6 or an existing one deliberately mapped to a second seat.
6. **Orders workflow (§14):** the prototype's `Order Part` flow (3,059 min) and the default name
   `SparePart - Do not Change / Delete` are backend `app_configs` / order-status catalog data.
   **UNVERIFIED** in this repository; do not attempt to create them through `POST /workflows`.
7. **Skill and group rosters (§9, §16, §17):** derived from C.2's purposes, C.4's routing column and
   C.3's accounts. The data set does not draw the user→skill and user→group matrices explicitly,
   so confirm both with the tenant before running.
8. **Form labels (§20):** C.7 gives English field purposes only; `IndividualFormField.label` is a
   single string, so a Thai tenant must translate the four forms' labels before creating them.
9. **Form → sub-type binding (§20):** how the link is stored server-side is **UNVERIFIED** (runbook
   S8). Acceptance check: `/forms/casesubtype?id={sTypeId}` returns the form.
10. **KMS numeric catalogs (§22.3 / §22.4):** `priority`, `source`, `ownership`, `viewableGroups`,
    `status_id` are backend rows; read each article's `nextstatus` before sending a status move.
11. **Article bodies (§22.3):** C.10 gives titles, category and status only — `{{CONTENT_*}}` must be
    authored.
12. **Option values on the four forms (§20):** C.7 names the fields and their requiredness, not the
    option lists — every `{{OPT_*}}` placeholder needs the tenant's disposition vocabulary.
13. **`advancedOptions.serviceSubType` (§23):** omitted deliberately (no SKYCC equivalent); confirm
    the BFF accepts the partial object.

## 27. Corrections and source discrepancies

Corrections to the input documents (the code wins), then disagreements between the two documents
(the runbook's Appendix C wins).

**Code-vs-document corrections:**

| # | Claim in a document / earlier package | What the code does | Evidence |
| --- | --- | --- | --- |
| C1 | Workflow node `action` is a free string (`new`, `assign`, …) | It is a **case-status `statusId`** picked from the status catalog | `ConfigPanel.tsx:249-269`, options `Editor.tsx:153-160` |
| C2 | The form link is the node config key `form` | The current editor writes **`formId`**; `form`/`formId` string fallbacks are legacy reads only | `ConfigPanel.tsx:293-295`, `Editor.tsx:507-534` |
| C3 | `pic` may be a string; `group` may be a string | Both are **arrays** in the current editor (`pic` = usernames, `group` = `grpId`s); strings are legacy `workflowDefault.json` data | `ConfigPanel.tsx:338-363`, `Editor.tsx:168-175` |
| C4 | `totalSla` is a value you type | It is **derived** by summing `config.SLA ?? config.sla` over all nodes | `Editor.tsx:193-202,253` |
| C5 | A `sla` node "enforces" the band, so add one per band | A `sla` node contributes to the same sum, so adding one **doubles** `totalSla` | `Editor.tsx:193-202` |
| C6 | Workflow metadata needs `title/description/status/totalSla` | `wfType: "case"` is also load-bearing: it gates the case-action select and is the filter the sub-type form queries with | `ConfigPanel.tsx:249-269`, `src/cms/pages/Admin/ServiceManagement.tsx:58` |
| C7 | Role create can carry bilingual labels | `RoleCreateData` is `{ active, roleName }` only | `src/core/types/role.ts:95-98` |
| C8 | `SyncServiceTypeArticles.artId` is a string array | The interface says `artId: number[]` | `casetype-map-articles.service.ts:50-53` |
| C9 | Unit-property assign can be additive | The bulk call **replaces** the whole set | `src/cms/types/unit.ts:280-288`, `unitApi.ts:96-103` |

**Document-vs-document discrepancies (runbook Appendix C wins):**

- **D1 — roles.** Prototype §2 proposes `Admin / Supervisor / Agent / Content / Publisher` (plus the
  field-service `Dispatcher` / `Responder` rows). Runbook C.3 proposes
  `system_admin / admin / supervisor / agent / qa_analyst / trainer / client_viewer`. This package
  follows C.3: it is the SKYCC-native set, and `Dispatcher`/`Responder` describe dispatching a field
  unit to a location, which SKYCC does not do.
- **D2 — user groups.** Prototype §4's table carries a **`Main Category`** column (`CAD` / `ORDER` /
  `KB`); no such field exists (`UserGroupCreateData` is `{ active, en, th }`,
  `src/core/types/user.ts:321-325`). Its group names are also SKYICT's. Runbook C.2's eight SKYCC
  groups are used.
- **D3 — users.** Prototype §3 lists `agent1/agent2/responder1/responder2/generalservice/
  emergencyservice1/emergencyservice2/dispatcher1/dispatcher2` plus SKYICT's staff. Runbook C.3's
  twelve SKYCC placeholder accounts are used. The prototype's addresses also contain typos
  (`respinder1@`, `generalsrvice1@`) and one duplicate, so none of them are reused.
- **D4 — priority scale.** Prototype §5 writes "CRITICAL: 0 - NONCLITICAL: 9". The product stores a
  string `"0"`–`"9"` with four labels bucketed `0 / 1-3 / 4-6 / 7-9` (`Prioriy.tsx:20-25`) — there
  are four labels, not a linear ten-step urgency scale.
- **D5 — workflow names in the form list.** Prototype §7's `Form Management List` binds "Form 1" to
  `SKYCC-Investigation Flow` / `SKYCC-Repair Flow` / `SKYCC-Service Flow` / `SKYCC-Maintenance Flow` /
  `SKYCC-Outsourced Flow` — SKYICT's workflow names carried over. SKYCC's five flows are C.6's, and
  no form→sub-type field exists to bind them anyway (C9/§25 item 9).
- **D6 — area.** Prototype §9's `Service Area List` (`SKYCC` → `Central Zone` → `Station 1/2`, codes
  `11` / `1101`) is SKYICT's field-service area table, and the product's area model is
  Country → Province → District (`src/cms/types/area.ts`). Runbook C.14 says skip S11 for SKYCC, so
  no area payload is included.
- **D7 — units.** Prototype §10 lists eight `UNIT-00N` seats (field-service naming, including
  `generalservice1/2` and `emergencyservice1/2`) whose only property is `Not Spectify`. Runbook
  C.12 supersedes it with six `SEAT-00N` seats and the eight CC properties. `Not Spectify` survives
  as the optional ninth property.
- **D8 — appointment types and store.** Prototype §12/§13 describe **backend defaults** created with
  the tenant (`General`, `Consult`, `Product Advise`; store `HQ`). C.9 proposes four callback
  windows instead. Check `GET /appointment_types` before creating, or the tenant ends up with two
  vocabularies for the same feature.
- **D9 — knowledge base.** Prototype §14's category and file tables (`การแก้ไขปัญหา` / `Operations`,
  `ขั้นตอนการตรวจสอบ Server` / `Procedures`, files `Document` / `Training` / `User Manual` /
  `HandOver`) are SKYICT's. Runbook C.10's tree is used.
- **D10 — KB mapping order.** C.10 says "after the first two are published, map them onto sub-types
  5001/5005", but it also sets article 2 to **Review** and article 3 to **Draft**, and the mapping
  tree lists published articles. §22.5 resolves this by mapping only the article that is definitely
  published and treating the 5005 link as conditional on publishing the Tier 2 matrix first.

## 28. Machine verification of transcribed literals

The EN/TH strings, codes, SLA figures, payload syntax and line-free contract claims in this
document were machine-checked (not eyeballed) by
[`verify-skycc-preconfig.ps1`](./verify-skycc-preconfig.ps1), which runs these checks over this file
and the two source documents:

1. **Coverage** — every data literal transcribed from
   `SKYCC-Tenant-Onboarding-Runbook.md` (Appendix C) and
   `SKYCC-Service-Center-Project-Prototype.md` must be found **in a source document first**, and only
   then in this file: the nine C.1 org rows' names, the eight C.2 groups, the seven C.3 `roleName`s,
   the twelve C.3 usernames, the eight C.4 skills, the five C.5 types and fifteen sub-types with
   their `sTypeCode`s, the five C.6 workflow titles and totals, the four C.9 appointment types, the
   ten C.10 categories, five file folders and three article titles, the seven C.11 case results, the
   six C.12 seat ids, and the `Not Spectify` property pair. Checking the source first is what turns a
   transposed literal into a reported failure instead of a coincidental match.
2. **Pair coverage** — the C.2 table is read out of the source row by row and both its EN and TH
   cells must appear in this file, so the Thai side is verified **without re-typing Thai into the
   script** (a hard-typed Thai literal in the script would carry the same transposition risk it is
   meant to catch).
3. **Faithfulness** — every Thai string in this file must be a substring of one of the two source
   documents, so nothing Thai was invented. Where a value is genuinely missing from the sources the
   document uses a `{{TH_*}}` placeholder instead of a plausible-looking translation (§26 item 4).
4. **Closed vocabularies** — the reverse of check 1: every `sTypeCode`-shaped token (15 in C.5) and
   every `SEAT-\d{3}` id (6 in C.12) that appears **here** must be one of the source's tokens. This is
   what catches a plausible invented code sitting next to the correct ones, which a presence-only
   coverage check cannot see. (No example token is written here on purpose: any `5xxx` literal must
   itself be a real C.5 code, so quoting a fake one would re-fail this check — the same self-reference
   that governs §26.)
5. **Code contracts** — the 27 create-type names this package claims to be shaped for
   (`CaseSubTypesCreateData`, `UnitFormData`, …) must be named here. Honest limit: this proves the
   naming is present somewhere, **not** that every section kept its own citation — that stays a review
   responsibility.
6. **Arithmetic and syntax** — the C.6 workflow table is re-summed from its own per-node minute cells
   and compared with its printed total, then each title/total pair must appear here; and every
   ```` ```json ```` block that starts with `{` or `[` must parse.
7. **Cross-reference integrity** — every `§N` in this file must resolve to an existing `## N.`
   heading. References into another document are marked (`Prototype §9`,
   `SKYICT-Pre-Config… §11`) and excluded. This is the check that catches the failure this document
   itself hit while being written: sections renumbered mid-authoring while 31 `§N` references kept
   their old numbers — all 31 were wrong and are now fixed.

Result of the run recorded below — this block is the script's actual stdout on the committed
version of this file:

```text
$ pwsh -File docs/verify-skycc-preconfig.ps1
artifact : SKYCC-Pre-Config-JSON-Payloads.md
sources  : SKYCC-Tenant-Onboarding-Runbook.md + SKYCC-Service-Center-Project-Prototype.md

A  coverage        : 129/129 literals present in both source and artifact
A  code contracts  : 27/27 create types named in the artifact
A2 pair coverage   : 8 C.2 group rows verified EN+TH
B  faithfulness    : 66/66 Thai strings traceable to a source document
B2 vocabularies    : 15 sTypeCodes + 6 seat ids, all from the source
C  workflow sums   : 5/5 C.6 totals re-summed and matched in the artifact
C  json blocks     : 47 parsed, 2 skipped (unquoted numeric placeholder)
D  cross-references: 124 §N references resolve to an existing section

RESULT: PASS -- 0 mismatches
```

The script was also run against a deliberately corrupted copy (one invented Thai suffix appended to a
skill's Thai name, and `totalSla: 30` changed to `31`) to prove it can fail. It reported a
`NOT-FAITHFUL` line naming the invented string and a
`MISMATCH artifact carries no totalSla 30 for 'SKYCC-Voice Inquiry'` line, exit code 1. A guard that
has never been seen to fail is not evidence. (The corrupted string is deliberately **not** reproduced
here: any Thai literal in this file must itself be traceable to a source, so quoting the fake one
would re-fail the check — the reason the fabricated values in §26 are placeholders, not examples.)

Two blocks are excluded from the JSON check on purpose: §22.4 and §22.5 carry **unquoted**
`{{...}}` placeholders because `ArticleStatusInput.id` / `status_id` are `number` and
`SyncServiceTypeArticleInput.artId` is `number[]` — quoting them would misrepresent the wire type.
The script counts and reports them rather than ignoring them.

Deliberate deviations from the sources — all flagged in §26 — are: priority tokens (§26.1), unit
`priority: 0` (§26.2), the `@skycc.co.th` email convention (§26.3), the eight `{{TH_PROP_*}}`
placeholders (§26.4), the two uncreatable seats (§26.5), derived rosters (§26.7), EN-only form
labels (§26.8) and placeholder option lists (§26.12).
