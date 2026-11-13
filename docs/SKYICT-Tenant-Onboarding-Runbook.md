# Adding a New Tenant — SKYICT Onboarding Runbook

> **Status:** Draft v0.1 — 2026-11-04. Evidence-based: every field name, route, permission key and
> file path below was read out of this repository while writing it (see Appendix B). Where a claim
> could not be traced to code it is marked **UNVERIFIED**, not restated as fact.
>
> **Scope:** what must be done — and in what order — to bring up a new tenant named **SKYICT** on
> this build, split into (a) what the backend/platform must provide, (b) the one code change this
> repository needs, and (c) the in-app configuration sequence.
>
> **Reusable form:** the business-agnostic version of this document — with fill-in worksheets, role
> matrix and acceptance checklist for the *next* tenant — is
> [`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md). This
> SKYICT runbook is the worked example for it.
>
> **Lineage warning.** `docs/SKYICT-Service-Center-Project-Prototype.md` (v1) and
> `docs/SKYICT-Service-Center-Project-Prototype-v2.md` (v2) both point at
> codebase". **That file does not exist in this repository** (no `*Baseline*` file anywhere under
> `docs/`). Neither surviving copy is authoritative on field names; §8 below lists every correction
> this runbook had to make.

---

## 1. What "tenant" means in this build

| Fact | Evidence |
| --- | --- |
| There is **no tenant-creation UI or API** in this repository. The only mentions of `tenant` are comments describing a future `GET /tenants/{orgId}/entitlements`. | `src/core/store/slices/entitlementSlice.ts:39`, `src/core/types/entitlement.ts:6`, `src/core/mocks/entitlements/index.ts:11` |
| Runtime tenant identity is the **`organization` string on the logged-in user**, used as the entitlement lookup key. | `src/core/hooks/useEntitlementsBootstrap.ts:20`, `src/core/mocks/entitlements/index.ts:8-19` |
| The login form's Organization field is **free text** with autocomplete; the suggestion list is exactly the registered entitlement fixture keys. | `src/core/components/auth/LoginForm.tsx:337-348`, `src/core/components/form/form-elements/Autocomplete.tsx:36,138-141`, `src/core/mocks/entitlements/index.ts:25` |
| When the BFF omits `organization`, login backfills it from the form selection (a copy, not a mutation of the cached response). | `src/core/providers/AuthProvider.tsx:209-215` |
| `orgId` (tenant UUID) exists on the user record but is **not** used as the entitlement key yet — the fixtures are keyed by `organization`. | `src/core/mocks/entitlements/index.ts:11`, `src/core/store/slices/entitlementSlice.ts:5-8` |
| Three places **default to `"SKY-AI"`** when the tenant string is missing (token refresh, JWT decode, mock-user builder). A SKYICT user whose payload lacks the field is silently treated as SKY-AI. | `src/core/utils/tokenManager.ts:291`, `src/core/utils/jwt.ts:50`, `src/core/utils/authService.ts:127` |

## 2. The four gates every screen passes through

Understanding these is the difference between "the tenant is created" and "the tenant can use the product".

**G1 — RBAC (`permId`).** `user.permission` is a `Record<category, string[]>` of dotted ids such as
`case.assign`, delivered by the BFF login response; `PermissionManager` flattens it and does an exact
`includes` match (`src/core/utils/permissionManager.ts:6-47`, `src/core/hooks/usePermissions.ts:9`).
`ProtectedRoute` with `requiredPermissions` requires **ALL** listed keys (`hasAllPermissions`), not any
of them (`src/core/components/auth/ProtectedRoute.tsx:296-297`). Menus use `hasPermission` /
`hasAnyPermission` individually.

**G2 — Entitlements (`entitlement.*`).** A second, tenant-scoped gate ("did the tenant buy this"),
resolved from `src/core/mocks/entitlements/*` today. It has **no admin bypass by design**
(`src/core/hooks/useEntitlements.ts:6-8`, `src/core/components/auth/ProtectedRoute.tsx:374-391`).

**G3 — System-role bypass.** Route guards and the legacy `AppSidebar` skip RBAC when
`profile.roleId === SYSTEM_ROLE`, a hardcoded UUID
`d6381714-8e89-47de-9d16-859131cdc5dc` (`src/core/utils/constants.ts:279`,
`src/core/utils/authService.ts:504-518`, `src/core/components/auth/ProtectedRoute.tsx:271,296`).
`SuperSidebar` and `SuperTopbar` — the shell a real user sees — have **no** such bypass
(`src/core/layout/SuperSidebar.tsx`, `src/core/layout/SuperTopbar.tsx`). **Consequence: a new
tenant's Admin role gets no menu at all unless every key is granted explicitly, unless the backend
reuses that UUID for it.**

**G4 — Mock fallbacks.** If the stored profile lacks `orgId` **or** `roleId`, app bootstrap
*replaces* the user object with `AuthService.createMockUser(...)`: `organization: "SKY-AI"`,
`roleId = SYSTEM_ROLE`, and a synthetic permission list (dispatch/user/report/workflow/dashboard/
settings only) (`src/core/providers/AuthProvider.tsx:45-53`, `src/core/utils/authService.ts:24-60,
77-137`). This *looks* healthy — the admin bypass hides the missing RBAC — but the tenant becomes
SKY-AI with the wrong permission set, so most super-app menus disappear.

---

## 3. Part A — Frontend change in this repository (F1–F5)

This is the **only** code change a new tenant needs in this repo. It is small and self-contained.

### F1 — Decide the package (blocking)

The fixture declares a plan, and the plan determines which features can ever be unlocked.
Verified mapping (`src/core/config/entitlements/packages.ts:17-49`,
`src/core/config/entitlements/featureCatalog.ts:21-77`):

| Plan | Bundled SKUs | Adds features |
| --- | --- | --- |
| `essential` | `CC-CORE`, `CC-AGENT`, `CC-KB` | `entitlement.core`, `entitlement.agent.desktop`, `entitlement.kb` |
| `professional` | + `CC-CHAT`, `CC-CHANNEL` | + `entitlement.chat`, `entitlement.channel.social` |
| `enterprise` | + `CC-GIS`, `CC-CAD`, `CC-BOT` | + `entitlement.gis`, `entitlement.cad`, `entitlement.bot`, `entitlement.audit`, `entitlement.rbac.advanced`, `entitlement.kb.semantic_search` |

**Decision needed before F3.** Two consequences that are easy to miss:

- `entitlement.gis` gates the **case-creation address map** and the whole **Map Settings** section —
  not just a "GIS dashboard" (`src/cms/components/case/createCase/map/AddressMap.tsx:42-52`,
  `src/cms/components/admin/system-configuration/settings/map/MapSettingsSection.tsx:112-114`).
  An `essential` SKYICT tenant loses the map on Create Case.
- `entitlement.kb` gates the entire `/kms/*` module at the route level
  (`src/App.tsx:53-62`). The v2 document lists Knowledge Base as required for every role →
  `CC-KB` → `essential` is the minimum.

**Recommendation for the SKYICT demo:** `enterprise` (nothing locked). Replace the numbers in F3 with
the signed commercial values; the limits/seats/dates in the fixture are illustrative placeholders.

### F2 — Confirm the login payload contract (blocking, backend)

Before creating any fixture, obtain from the BFF team the exact login/`profile` payload for a
SKYICT user and confirm it carries:

| Field | Why it matters if absent |
| --- | --- |
| `organization` = `"SKYICT"` | Entitlement lookup falls through to the `default` (essential) fixture. |
| `orgId` | G4 triggers on the next page load and **overwrites the profile** with the SKY-AI mock user. |
| `roleId` | Same G4 overwrite. |
| `permission` as `Record<category, string[]>`, with the **category key `"kms"` present** for KB permissions | The Knowledge group in the sidebar is rendered only when `permissionsByCategory.kms` is non-empty (`src/core/layout/SuperSidebar.tsx:622-633`). |

### F3 — Add the fixture file

Create `src/core/mocks/entitlements/skyict.json`. The shape is enforced at runtime by
`isTenantEntitlements` (`src/core/mocks/entitlements/index.ts:32-48`), so every one of these keys is
required:

```json
{
  "orgId": "SKYICT",
  "plan": "enterprise",
  "skus": [
    "CC-CORE", "CC-AGENT", "CC-KB", "CC-CHAT",
    "CC-CHANNEL", "CC-GIS", "CC-CAD", "CC-BOT"
  ],
  "features": [
    "entitlement.core",
    "entitlement.agent.desktop",
    "entitlement.kb",
    "entitlement.kb.semantic_search",
    "entitlement.chat",
    "entitlement.channel.social",
    "entitlement.gis",
    "entitlement.cad",
    "entitlement.bot",
    "entitlement.audit",
    "entitlement.rbac.advanced"
  ],
  "limits": {
    "maxAgents": 50,
    "maxStorageGB": 25,
    "maxCasesPerMonth": 10000,
    "maxAPICallsPerDay": 20000
  },
  "seats": { "used": 0, "max": 50 },
  "renewedAt": "2026-11-01T00:00:00Z",
  "expiresAt": "2027-11-01T00:00:00Z"
}
```

Notes that are easy to get wrong:

- **`features` is what actually gates** — `hasFeature` reads the array literally
  (`src/core/config/entitlements/resolveEntitlements.ts:52-58`). It is *not* recomputed from `skus`
  at runtime, so a fixture whose `features` and `skus` disagree will behave according to
  `features`. Keep them consistent with `PACKAGE_PRESETS` + `ENTERPRISE_EXTRA_FEATURES`.
- `limits`, `seats`, `plan` are all validated by the shape guard; a missing `limits.maxAgents` or
  `seats.used` makes the fixture be rejected and silently fall back to the `default` fixture.
- Do **not** rename or delete `default.json` — it is the fallback for unknown orgs
  (`src/core/mocks/entitlements/index.ts:22,56-65`).

### F4 — Register the fixture

`src/core/mocks/entitlements/index.ts`:

```ts
import skyictFixture from "./skyict.json";

export const ENTITLEMENT_FIXTURES: Record<string, TenantEntitlements> = {
  BMA: bmaFixture as TenantEntitlements,
  SIH: sihFixture as TenantEntitlements,
  "SKY-AI": skyAiFixture as TenantEntitlements,
  SKYICT: skyictFixture as TenantEntitlements,
};
```

This single edit is what makes `"SKYICT"` appear in the login Organization dropdown
(`FIXTURE_TENANT_NAMES` is derived from the registry keys, `index.ts:25`).

Lookup is trim + case-insensitive (`index.ts:56-65`), so `skyict`, `SKYICT` and ` SKYICT ` all
resolve — but the resolved payload's `orgId` is stamped with the string the user actually typed
(`index.ts:61`). If any later report groups by `orgId`, standardise the casing at the login form or
teach the report to normalise; nothing in the app normalises it today.

### F5 — Extend the tests

`src/core/mocks/entitlements/entitlementFixtures.test.ts` uses `arrayContaining`, so it will not
fail on the new entry — which means it will not *prove* anything either. Add explicit assertions
following the existing style (file lines 16-20, 49-53):

```ts
expect(resolveFixture("SKYICT").plan).toBe("enterprise");
expect(resolveFixture("skyict").plan).toBe("enterprise");
expect(resolveFixture("SKYICT").features).toContain("entitlement.gis");
expect(FIXTURE_TENANT_NAMES).toEqual(expect.arrayContaining(["SKYICT"]));
```

Run `pnpm test` (Vitest, `src/**/*.test.{ts,tsx}`) and `pnpm build` (`tsc -b` is strict with
`noUnusedLocals`).

---

## 4. Part B — Backend / platform prerequisites (P1–P6)

These cannot be done from this repository. Each row states the **contract the frontend depends on**,
so the request to the backend team is unambiguous.

| # | Prerequisite | Frontend dependency (evidence) |
| --- | --- | --- |
| **P1** | Create the tenant + organization records; issue `orgId`. | Signature/route plumbing only; no FE create path (`§1`). |
| **P2** | Ensure the **global permission catalog** (`GET /permission`) contains every `permId` the UI checks — Appendix A. | A key missing from the catalog cannot be granted in Role Privilege, so the corresponding menu/route stays invisible (`src/core/store/api/userApi.ts:312-322`, `src/core/pages/Admin/RolePrivilegeManagement.tsx:40`). |
| **P3** | Create the SKYICT roles and their `role_permission` rows (RBAC links). Decide explicitly whether SKYICT's Admin role reuses `SYSTEM_ROLE` = `d6381714-…`; if not, every key must be granted individually. | `src/core/types/role.ts:2-103`, `src/core/store/api/userApi.ts:219-306`, §2 G3. |
| **P4** | Create SKYICT users with the fields the UI expects: `username`, `orgId`, `roleId`, `deptId`, `commId`, `stnId`, `empId`, `email`, `mobileNo`, `title`, `firstName`, `lastName`, `displayName`, `userType`, `active`. | `UserFormData` — `src/core/types/user.ts:216-247`. |
| **P5** | Seed the data that has **no create UI in the frontend**: case statuses (read-only `GET /case_status`), unit types (`GET /mdm/types`), unit sources (`GET /mdm/sources`), unit statuses (`GET /mdm/status`). | `src/cms/store/api/serviceApi.ts:21`, `src/cms/store/api/unitApi.ts:118-143` — those files expose only GETs for these entities. |
| **P6** | Bind the tenant's default order workflow in `app_configs` (as the v2 document instructs). | **UNVERIFIED from this repo** — no `app_configs` reference exists anywhere in `src/`. Treat as a backend-only step and ask the backend owner to confirm the column and the default workflow name. |

Optional but recommended for a demo: confirm whether `VITE_MOCK_API="true"` is set in the target
environment. Under mock mode several screens read `src/core/mocks/*.json` (roles, users,
permissions) instead of the API, which would mask a mis-provisioned tenant
(`CLAUDE.md`, "Environment configuration").

---

## 5. Part C — In-app configuration, in dependency order (S1–S14)

Follow this order; each step's output is an input to a later one. "Menu path" is what a user
actually clicks in the super-app shell (`SuperTopbar` → **More**, or `SuperSidebar`).
Every gate listed is from the code, not from the v2 document.

### S1 — Organization structure (Department → Command → Station)

- **Where:** More → User Management → Organization (`/organization`); gate `organization.view`
  (`src/core/pages/Admin/OrganizationManagement.tsx:55`).
- **Entities:** `Department{deptId, en, th, active}`, `Command{commId, deptId, en, th, active}`,
  `Station{stnId, deptId, commId, en, th, active}` — three levels only, created in that order
  (`src/core/types/organization.ts:17-84`, `src/core/store/api/organizationApi.ts:22-180`).
- **For the v2 example** (`SKYICT / Center Zone / Station 1`, 7 rows): create 1 department
  `SKYICT`, then the 6 zones as Commands, then the stations as Stations.
- **Verify:** `GET /department_command_stations` returns the flattened tree
  (`src/core/store/api/organizationApi.ts:183-186`); the hierarchy view lists all 7 rows.
- ⚠️ **Edit the right API module:** the live one is `src/core/store/api/organizationApi.ts`.
  `src/cms/store/api/organizationApi.ts` is an unimported stale duplicate whose cache tags are all
  commented out — see L8. Do not "fix" the duplicate.
- ⚠️ **Do not** enter the zones under Area Management. Organization and Area are different models —
  see S9 and correction C2.

### S2 — User groups

- **Where:** More → User Management → User Group (`/user-group`); gate `usergroup.view`
  (`src/core/pages/Admin/UserGroupManagement.tsx:41`).
- **Fields:** `en`, `th`, `active` only. `grpId` is **server-generated**; there is no description
  field (`src/core/types/user.ts:298-360`, `src/core/components/admin/user-management/user-group/UserGroupManagement.tsx:34`).
- **Membership** is keyed by `(grpId, username)` (`src/core/store/api/userApi.ts:178-201`).
- **Why it matters:** workflow nodes assign work to a **user group**, not to individuals — the node
  config stores a `grpId` (`src/cms/components/workflow/editor/Editor.tsx:174,519-523`) — so groups
  must exist before S7.
- v2's "Main Category CAD / ORDER / KB" column does **not exist** on this entity (correction C4).

### S3 — Roles and permissions (RBAC)

- **Where:** More → User Management → Role & Privilege (`/role-privilege`); gate `role.view`
  (`src/core/pages/Admin/RolePrivilegeManagement.tsx:72`).
- **What it edits:** `Role{roleName, active}` and the `role_permission` link rows
  (`permId` + `active`) (`src/core/types/role.ts:24-103`).
- The privilege matrix is grouped by the permission's `groupName` and locks the system role
  (`PrivilegeMatrixView.tsx:241`).
- **Verify:** log in as a SKYICT Agent and confirm no admin-only menu appears (Appendix A) — this is
  the single most reliable check that P2/P3 were done.

### S4 — Users

- **Where:** More → User Management → User (`/user`), create at `/user/create`; gates `user.view`
  for the list, and `user.create` **and** `user.update` for the form (all of them — `ProtectedRoute`
  requires every listed key: `src/core/pages/Admin/UserForm.tsx:804`,
  `src/core/components/auth/ProtectedRoute.tsx:296-297`).
- **Fields:** S4 depends on S1 (`deptId`/`commId`/`stnId` are selects) and S3 (`roleId`).
- Groups are attached from the user preview's Groups tab (`UserGroupsView.tsx`).

### S5 — Skills

- **Where:** More → System Config → Skill (`/cms/skill`); gate `unit.view` (not `settings.view`)
  (`src/cms/pages/Admin/SkillManagement.tsx:49-50`).
- **Fields:** `en`, `th`, `active` (`src/cms/types/skill.ts:4-10`). Skills are attached to case
  sub-types via `userSkillList`, so they are most useful once S7b exists — but they can be created
  first.

### S6 — Unit properties, unit types/sources, then units

- **Where:** System Config → Property (`/cms/property`, gate `unit.view`), Units
  (`/cms/unit`, gate `unit.view`), unit create/edit (`/cms/unit/create`, gates `unit.create`
  **and** `unit.update`).
- **Properties:** `en`, `th`, `active`, CRUD from the UI (`src/cms/types/unit.ts:242-313`).
- **Unit types / sources:** **read-only in the UI** — must be seeded by the backend (P5)
  (`src/cms/store/api/unitApi.ts:118-143`).
- **Unit record:** `unitId`, `unitName`, `unitTypeId`, `unitSourceId`, `username`, `priority`,
  `compId`, `deptId`, `commId`, `stnId`, `active` (`src/cms/types/unit.ts:87-153`).
- **Unit ↔ property assignment** uses `POST /mdm/units/properties/{unitId}/bulk` where the path id
  is the **business** `unitId` (e.g. `UNIT-001`), not a UUID (`src/cms/types/unit.ts:280-288`).

### S7 — Workflows

- **Where:** More → Workflow → Workflow Management (`/cms/workflow/list`, gate `workflow.view`) and
  the builder (`/cms/workflow/editor/v2`, gate `workflow.create` for the entry; editing controls
  inside require `workflow.create`/`workflow.update`).
- **Node types:** `start`, `process`, `dispatch`, `decision`, `sla`, `end`
  (`src/cms/types/workflow.ts:18-24`); metadata carries `totalSla` and `wfType` (`:44-50`).
- **Dispatch nodes** assign to a user group from S2.
- **Ordering:** create the case workflows here **before** S7b, because the sub-type form requires a
  `wfId`.

### S7b — Case Type / Sub Type (the SLA + routing backbone)

- **Where:** System Config → Service Type (`/cms/service`), gate `service.view`.
- **Two entities, not one:** case **type** (`GET /casetypes…`, `POST /casetypes/add`) and case
  **sub-type** (`GET /casesubtypes`, `POST /casesubtypes/add`), plus a combined read
  `/casetypes_with_subtype` used by the tree
  (`src/cms/store/api/serviceApi.ts:29-127`, `src/cms/store/api/caseApi.ts:223,256`).
- **Type fields:** `typeId` (business key, free text — there is **no** separate "type code"),
  `en`, `th`, `active` (`src/cms/types/case.ts:300-311`).
- **Sub-type fields (the full list, from `CaseSubTypesCreateData`):** `typeId`, `sTypeCode`, `en`,
  `th`, `wfId`, `caseSla`, `priority`, `userSkillList[]`, `unitPropLists[]`, `mDeviceType`,
  `mDeviceTypeName`, `mWorkOrderType`, `active` (`src/cms/types/case.ts:246-276`).
- So the v2 table's "Type Code 1001 / Sub Type Code 3001 / Priority / Skill / Workflow / SLA (min)"
  maps to: `typeId` (type), `sTypeCode` (sub-type), `priority`, `userSkillList`, `wfId`, `caseSla`.
- ⚠️ **Priority is ambiguous at the storage level — read L1 in §9 before filling that column.**

### S8 — Forms (dynamic case forms)

- **Where:** More → Form → Form Management (`/cms/form-management`, gate `form.view`) and the builder
  (`/cms/dynamic-form`, gate `form.create`).
- **How a form reaches Create Case:** the case form is *read* per case **sub-type**
  (`GET /forms/casesubtype?id={sTypeId}`, `src/cms/store/api/formApi.ts:202-209`) and per workflow
  (`/forms/GetFormlinkWf`, `/forms/getAllFormslinkWf`, `formApi.ts:79-97`). So create the form and
  the sub-type, then confirm the sub-type actually resolves a form.
- ⚠️ **The form builder exposes no "bind to sub-type" field** in the frontend — nothing under
  `src/cms/components/form/dynamic-form` writes a sub-type id. How the link is established is
  **UNVERIFIED here**; ask the backend owner whether it is set on the form record
  (`caseSubType`) or elsewhere, and use `/forms/casesubtype` as the acceptance check.

### S9 — Area (Country → Province → District) and Area Templates

- **Where:** System Config → Area (`/cms/area`) and Area Template (`/cms/area-template`).
- **Gate mismatch to be aware of:** the **menu** entries require `settings.view`
  (`src/core/layout/SuperTopbar.tsx:405,411`) but the **pages** require `area.view`
  (`src/cms/pages/Admin/AreaManagement.tsx:46`, `AreaTemplateManagement.tsx:19`,
  `AreaTemplateDetail.tsx:21`, `AreaTemplateVersions.tsx:21`). Grant **both** or the operator sees
  the menu and gets "insufficient permissions" on click.
- **Hierarchy is exactly three levels:** `Country{countryId}` → `AreaProvince{countryId}` →
  `AreaDistrict{countryId, …}` (`src/cms/types/area.ts:191-224`). It is **not** a
  Department/Command/Station hierarchy — see correction C2.
- **Area Templates** are versioned, publishable geography an org adopts into its own areas
  (`src/cms/App.tsx:187-192`); a new tenant with no templates can still draw its own areas.

### S10 — Places, devices (map layer objects)

- **Where:** More → Map Management → Place (`/cms/place`) and Device (`/cms/device`); both require
  `organization_settings.manage` (`PlaceManagement.tsx:40`, `DeviceManagement.tsx:42`).
- Optional for a first demo; the case-map Place/Device layers render empty without them.

### S11 — Organization settings (map, assignment, subscription)

- **Where:** More → System Config → Organization Settings (`/cms/settings/organization`), gate
  `organization_settings.manage`.
- **Three sections are registered** (`OrganizationSettingsManagement.tsx:21-35`):
  1. **Map settings** — general/layers/incident radius/staff/assignment; **locks behind
     `entitlement.gis`** (see F1).
  2. **Assignment rules** — routing mode (auto/manual), criteria, combine and/or.
  3. **Subscription & Entitlements** — display-only view of plan, seat usage, SKUs and per-feature
     state (`settings/subscription/SubscriptionEntitlementsSection.tsx:12-40`); it renders whatever
     the fixture says, which makes it the fastest place to confirm F3/F4.
- ⚠️ **Escalation rules have a built component that is not registered in the section list**
  (`settings/escalation/EscalationRulesSection.tsx` exists; `OrganizationSettingsManagement.tsx:21-35`
  does not import it) — there is no UI path to configure them today. See L4.

### S12 — CRM master data

Order matters: Brand and Category → Product → Store → stock.

| Step | Route | Gate | Fields (verified) |
| --- | --- | --- | --- |
| Brand | `/cms/brands` | `product.view` | `en`, `th`, `type`, `active`, logo via `/upload/brand` then `image` URL (`src/cms/types/brand.ts:11-30`) |
| Category | `/cms/categories` | `product.view` | `en`, `th`, `type`, `active` (`src/cms/types/category.ts:4-19`) |
| Product | `/cms/products` | `product.view` | product list page; stock views at `/cms/products/stock` (`product_stock.view`) |
| Store | `/cms/stores` | `product.view` | `en`, `th`, `discount`, `active` — **no address field** (`src/cms/types/store.ts:4-19`) |
| Spare parts | `/cms/inventory` | `sparepart.view` | — |
| Order requests | `/cms/inventory/request` | `order.view` | — |
| CRM dashboards | `/cms/products/dashboard` | `crm_dashboard.view` | — |

`Brand.type` / `Category.type` are free strings used to separate product vs spare-part catalogs;
keep one convention per tenant.

### S13 — Contacts, appointments, knowledge base

| Step | Route | Gate |
| --- | --- | --- |
| Contact field configuration | `/cc/contacts-configurations` | `contact_config.view` |
| Customers | `/cc/contacts-list` | `contact.view` |
| Appointment types | `/cc/appointment-types` | `appointment.view` |
| Appointments | `/cc/appointment` | `appointment.view` |
| KB category / files / articles / banner / broadcast / source | `/kms/*` | `kb_*` keys **and** `entitlement.kb` |

- **Contact configuration is per-tenant field visibility**: `photo`, `displayName`, `title`,
  `firstName`, `middleName`, `lastName`, `citizenId`, `dob`, `blood`, `gender`, `userType`,
  `languagePreference`, `contractPreference`, `social`, `note`, plus a binding to one dynamic form
  (`src/cms/components/customer/CustomerFormConfig.tsx:211-229,349-372`).
- **Appointment types are name-only:** `en`, `th`, `active` (`src/cms/types/appointmentType.ts:1-26`).
  There is no category and no stay duration (correction C5).
- **KB permissions live in a different namespace**: `kb_category.view`, `kb_article.view`,
  `kb_article.mgmt.*`, `kb_file.*`, `kb_banner.*`, `kb_broadcast.*`, `kb_source.*`,
  `kb_dashboard.view` (`src/kms/common/utils/enumHelper.ts:1-46`). They must be returned by the BFF
  under the `kms` category for the sidebar group to render (§3 F2).

### S14 — Verification pass

Run §7 as a scripted walkthrough, as each role.

---

## 6. Role → permission matrix (mapped to the keys the code actually checks)

Role intent is taken from the v2 document (Admin / Agent / Dispatcher / Responder); the keys are
this repository's. "Y" means the code checks it for a surface that role should use.

| Key | Admin | Agent | Dispatcher | Responder | Gates |
| --- | :--: | :--: | :--: | :--: | --- |
| `case.view` | Y | Y | Y | Y | case history detail actions, screen-pop lookups |
| `case.create` | Y | Y | Y | Y | `/cms/case/creation`, `/cms/case/creation_schedule_date` |
| `case.view_history` | Y | Y | Y | Y | `/cms/case/history` |
| `case.assign` | Y | – | Y | – | assignment board, assign actions, staff map layer |
| `case.close` | Y | – | Y | – | close action inside case detail |
| `case.delete` | Y | – | – | – | cancel case in history |
| `dashboard.view` | Y | – | Y | – | case dashboard, case-summary-by-area, dispatch dashboard, `/dashboard/custom` |
| `report.view` | Y | – | Y | – | Report menu (`/cms/report` page itself is ungated — see L5) |
| `contact.view` | Y | Y | Y | Y | `/cc/contacts-list` |
| `contact_config.view` | Y | – | – | – | `/cc/contacts-configurations` |
| `appointment.view` | Y | Y | Y | Y | `/cc/appointment`, `/cc/appointment-types` |
| `product.view` | Y | – | Y | – | products, brands, categories, stores |
| `product_stock.view` | Y | – | Y | – | `/cms/products/stock` |
| `sparepart.view` | Y | – | Y | – | `/cms/inventory` |
| `sparepart_stock.view` | Y | – | Y | – | `/cms/inventory/stock` |
| `order.view` | Y | – | Y | – | `/cms/inventory/request` |
| `crm_dashboard.view` | Y | – | Y | – | `/cms/products/dashboard` (see L2) |
| `crm_service.view` | Y | – | Y | – | `/cms/services` |
| `service.view` | Y | – | – | – | Service Type / Sub Type (S7b) |
| `unit.view` | Y | – | – | – | Units, Properties, **Skills** (S5) |
| `unit.create`, `unit.update` | Y | – | – | – | unit create/edit form (**both** required) |
| `settings.view` | Y | – | – | – | Case Result, **Area menu**, **Area Template menu** |
| `area.view` | Y | – | – | – | Area and Area Template pages (see L3) |
| `organization_settings.manage` | Y | – | – | – | Place, Device, Organization Settings |
| `form.view` | Y | – | – | – | form management |
| `form.create` | Y | – | – | – | dynamic form builder |
| `form.update` | Y | – | – | – | Form menu group visibility |
| `workflow.view` | Y | – | – | – | workflow list/editor route |
| `workflow.create` | Y | – | – | – | workflow builder entry + editing |
| `workflow.update` | Y | – | – | – | editing an existing workflow |
| `user.view` / `user.create` / `user.update` | Y | – | – | – | user list / user form (**both** create+update for the form) |
| `role.view` | Y | – | – | – | Role & Privilege |
| `usergroup.view` | Y | – | – | – | User Group |
| `organization.view` | Y | – | – | – | Organization tree |
| `auditlog.view` | Y | – | – | – | Audit Log menu (also needs `entitlement.audit`) |
| `package.view` | – | – | – | – | Package menu entry is a **disabled placeholder** (`SuperTopbar.tsx:485`) — grant nothing |
| `cc.supervision.view` | Y | – | Y | – | supervisor board (in-page check) |
| `kb_dashboard.view`, `kb_category.view`, `kb_article.view`, `kb_article.mgmt.view`, `kb_file.view`, `kb_broadcast.view`, `kb_banner.view`, `kb_source.view` (+ the `.create/.update/.delete` variants where the operator must write) | Y | view-only | view-only | view-only | `/kms/*`, and the Knowledge sidebar group |

Two structural rules that this table cannot express:

1. **Menu key ≠ route key.** Several surfaces need one key to *see* the menu and another to *open*
   the page (Area: `settings.view` + `area.view`). Grant both.
2. **`requiredPermissions` is AND.** Where the table says "both", a role holding only one of the two
   keys sees the menu and is then denied the page.

---

## 7. Acceptance checklist

Use a fresh browser profile (localStorage `profile` caches the tenant and role).

- [ ] Login page lists **SKYICT** in the Organization suggestions; typing it and logging in succeeds.
- [ ] `localStorage.profile` shows `organization: "SKYICT"`, a real `orgId`, a real `roleId`
      (not `d6381714-8e89-47de-9d16-859131cdc5dc`), and `permission` containing the expected keys.
- [ ] Organization Settings → **Subscription & Entitlements** shows `enterprise` (or the chosen
      plan), the SKU list and seat usage — this proves the fixture resolved
      (`src/cms/components/admin/system-configuration/settings/subscription/SubscriptionEntitlementsSection.tsx`).
- [ ] With `essential`/`professional`: `/kms/*` enabled, Create Case map shows the **lock panel**.
      With `enterprise`: the map renders.
- [ ] Each role sees exactly its menus (compare with §6): Admin all; Agent no System Config / User
      Management / CRM; Dispatcher no Form/Workflow/Config; Responder case + contact + appointment
      + KB only.
- [ ] Create Case end-to-end: type → sub-type → form renders → case saved with the expected SLA.
- [ ] Case assignment board lists the case; assign to a unit; unit appears in the staff map layer
      (requires `case.assign`).
- [ ] Contact configuration hides the fields that were disabled.
- [ ] Knowledge Base: category → file → article publish (requires `entitlement.kb` + `kb_*`).
- [ ] Menu entries resolve: no click lands on the generic 404 or an "insufficient permissions" page
      for the Admin role (see L3/L5 for the two known cases).

---

## 8. Corrections to the v2 document

Each item was checked against code while writing this runbook; the code wins.

| # | v2 says | Reality (evidence) |
| --- | --- | --- |
| **C0** | Links `SKYICT-Service-Center-Project-Prototype-v2-Baseline.md` as the baseline | That file does not exist in the repository. Neither v1 nor v2 is a reliable field reference. |
| **C1** | §1 Organization: "Level 1 / Level 2 / Level 3" labelled Organization/Department, Command, Station | Correct in substance — the model **is** Department → Command → Station (`src/core/types/organization.ts:17-84`) — but the levels must be created in that order and each row carries `deptId`/`commId`/`stnId`. |
| **C2** | §9 Area Management uses the same `SKYICT / Central Zone / Station 1` triple as the organization | Wrong model. Area is **Country → Province → District** (`src/cms/types/area.ts:191-224`). The zone/station naming belongs to Organization (S1), not Area (S9). |
| **C3** | §5 Priority "CRITICAL: 0 – NONCRITICAL: 9" | There are **10 selectable labels** (critical ×1, high ×3, medium ×3, low ×3) and the stored `priority` value is the **index inside its own group** (0; 0,1,2; 0,1,2; 0,1,2), while every reader buckets a single 0–9 scale (`src/cms/utils/constants.ts:245-250`, `src/cms/components/admin/system-configuration/service/ServiceHierarchyView.tsx:113-124`, `src/cms/components/function/Prioriy.tsx:20-25`). See L1. |
| **C4** | §4 User Group has a `Main Category` column (CAD / ORDER / KB) | `UserGroup` is `grpId`, `en`, `th`, `description?`, `active` — and the create form even notes there is no description field (`src/core/types/user.ts:298-320`, `UserGroupManagement.tsx:34`). "Main Category" does not exist. |
| **C5** | §13 Appointment type has `Appointment Category` and `Stay Duration` | Appointment type is `en`, `th`, `active` only (`src/cms/types/appointmentType.ts:1-26`). |
| **C6** | §5 "Type Code 1001" per case type | Case **type** has only `typeId` (a free-text business key), `en`, `th`, `active`; only the **sub-type** has a separate `sTypeCode` (`src/cms/types/case.ts:300-311`, `246-260`). |
| **C7** | §12 "Store" implies a full store record | `Store` is `en`, `th`, `discount`, `active` — no address, no branch info (`src/cms/types/store.ts:4-19`). |
| **C8** | §1 "Create `Tenant` for `Organization`" as a checklist item | No such screen or endpoint exists in the frontend. Tenant creation is backend/platform work (§4 P1) — do not schedule it as an in-app task. |
| **C9** | §2 lists the roles as `Admin`, `Agent`, `Dispatcher`, `Responder` | Those are the business labels, not the stored `"roleName"`. This tenant's role table stores all five in snake_case — **`system_admin`, `admin`, `agent`, `dispatcher`, `responder`** (confirmed 2026-11-05) — so an RBAC grant, a seed script or a report must use the literal `"roleName"`; a display label will not match. `db/seed/skyict/01-um_users.sql` keeps the mapping in one place (`_role_map`) and fails loudly on a name the tenant's table does not use. |

Still correct in v2 and reused as-is: the Contact Configuration field-level enable/disable (§13),
the CRM module inventory (product / spare part / inventory / order), the Knowledge Base lifecycle
(category / files / articles / approve), and the four-role intent of §2.

---

## 9. Known limitations found while preparing this runbook

These are pre-existing, affect tenant setup or the acceptance test, and are **not** fixed here.

**L1 — Priority can be stored ambiguously.** The sub-type editor generates ten options whose values
repeat per group (`value: index`), so "Critical" and the first "High" both store `0`; readers map
`0 → Critical` (`ServiceHierarchyView.tsx:113-124` vs `Prioriy.tsx:20-25`). A tenant that needs three
distinct severity levels cannot express them reliably today. **Workaround for the SKYICT demo:** use
one label per severity band and verify the badge on the created case actually matches the label that
was picked.

**L2 — The Product → Dashboard sidebar entry never appears.** `SuperSidebar` gates it on
`hasAnyPermission(["crm_dashboard"])` — a key with no `.view` suffix
(`src/core/layout/SuperSidebar.tsx:256-258`) — while the route and the topbar both require
`crm_dashboard.view` (`src/cms/App.tsx:270`, `src/core/layout/SuperTopbar.tsx:308,321`). Use the
**More → Dashboard & Analytic → Product** path; the sidebar item is dead.

**L3 — Area requires two keys.** Menu needs `settings.view`, page needs `area.view` (§5 S9). Granting
only one produces "menu visible, page denied".

**L4 — Escalation rules have no UI path.** `settings/escalation/EscalationRulesSection.tsx` is fully
built but not registered in `SETTINGS_SECTIONS`
(`src/cms/components/admin/system-configuration/settings/OrganizationSettingsManagement.tsx:21-35`).

**L5 — `/cms/report` has no route guard**, only a menu gate (`report.view`); the page is reachable by
direct URL without the permission (`src/cms/App.tsx:206`).

**L6 — Hard-coded tenant defaults.** Three fallbacks resolve to `"SKY-AI"`
(`tokenManager.ts:291`, `jwt.ts:50`, `authService.ts:127`) and the mock-user substitution swaps in
`SYSTEM_ROLE` (§2 G4). Any payload missing `organization`/`orgId`/`roleId` therefore produces a
*plausible but wrong* session rather than an error.

**L7 — Legacy `AppSidebar` (non-super shell) is out of sync with routes** — e.g. its CRM group links
`/inventories` (no such route; the real one is `/inventory`) and has no `permission` on the whole
group (`src/cms/layout/AppSidebar.tsx:265-290`). It is not rendered when the super-app shell is
active (`AppSidebar.tsx:739-741`), so this only matters if the shell is switched back.

**L8 — There are two `organizationApi` modules and one is dead.** The live module is
`src/core/store/api/organizationApi.ts` (imported by `OrganizationManagement.tsx:33`, tags wired,
also owns `/organizations/{orgId}` and map-settings/assignment-rules). `src/cms/store/api/organizationApi.ts`
is a near-identical copy that **no file imports** and whose `providesTags`/`invalidatesTags` are all
commented out. An engineer "fixing" the duplicate would change nothing; the guidance in
`.agents/skills/anti-regression/SKILL.md` ("a page reload is not a cache invalidation") is satisfied
only in the core copy.

**L9 — Seeding the same people into a second tenant depends on `um_users`' unique indexes, which are
not visible from this repository.** An earlier version of `01-um_users.sql` guarded its INSERT by
username alone, so a person who already had an account under another `orgId` was skipped without a
word — that produced "only 6 of 16 users were created" while the script reported success. The guard is
now scoped to `(username, orgId)`: adding a tenant creates a **second account** for that person, and
nothing is moved. Whether the database allows that is decided by its own indexes —
`UNIQUE (username)` makes the run fail loudly with `duplicate key value violates unique constraint`;
`UNIQUE (email)` does the same when the person's address is reused. Those failures are the answer, not
an obstacle: report them and escalate the product question ("may one person belong to two tenants?")
rather than working around it by rewriting usernames or emails, or by relocating accounts between
tenants (which takes them away from the tenant that owns them and carries no groups, units or case
history across). Diagnose with `db/seed/skyict/00-diagnose-users.sql`.

---

## 10. Open questions (owner decision required)

1. **Which package does SKYICT hold?** It changes F3 and whether the case map works (F1).
   Owner: commercial/account.
2. **Does SKYICT reuse `SYSTEM_ROLE` (`d6381714-…`) for its Admin role, or get a tenant-specific
   role?** If not reused, the Admin role needs every key in §6 granted explicitly.
   Owner: backend/platform.
3. **Is the global permission catalog already populated with every key in Appendix A?** Without it,
   S3 cannot grant what the UI checks. Owner: backend/platform.
4. **`app_configs` order-workflow binding** (P6) — confirm the column, the default workflow name and
   who runs it. Owner: backend/platform. **UNVERIFIED from this repository.**
5. **Will the entitlement endpoint ship before the demo?** Today the source is fixtures
   (`ENTITLEMENTS_SOURCE = "fixtures"`, `src/core/store/slices/entitlementSlice.ts:14`); if
   `GET /tenants/{orgId}/entitlements` lands, F3/F4 change shape (and a `GQL_MAP` entry is required
   under `VITE_USE_GRAPHQL="true"` — see the TODO at `entitlementSlice.ts:39-41`).

---

## Appendix A — permission keys checked by this frontend (verified inventory)

```text
case.view  case.create  case.assign  case.view_history  case.close  case.delete
dashboard.view  report.view
form.view  form.create  form.update
workflow.view  workflow.create  workflow.update
user.view  user.create  user.update
role.view  usergroup.view  organization.view  auditlog.view
service.view  unit.view  unit.create  unit.update  settings.view  area.view
organization_settings.manage
product.view  product_stock.view  sparepart.view  sparepart_stock.view
order.view  crm_dashboard.view  crm_service.view  package.view
contact.view  contact_config.view  appointment.view  cc.supervision.view
kb_dashboard.view  kb_category.{view,create,update,delete}
kb_article.view  kb_article.comment
kb_article.mgmt.{view,create,update,delete,copy,newversion,changestatus}
kb_file.{view,create,upload,delete}
kb_broadcast.{view,create,update,delete}
kb_banner.{view,create,delete}
kb_source.{view,create,update,delete}
```

Entitlement features (not permissions): `entitlement.core`, `entitlement.agent.desktop`,
`entitlement.kb`, `entitlement.kb.semantic_search`, `entitlement.chat`, `entitlement.bot`,
`entitlement.gis`, `entitlement.cad`, `entitlement.channel.social`, `entitlement.audit`,
`entitlement.rbac.advanced` (`src/core/types/entitlement.ts:29-40`).

## Appendix B — evidence index

| Area | Files read |
| --- | --- |
| Tenant identity & entitlements | `src/core/mocks/entitlements/{index.ts,sky-ai.json,entitlementFixtures.test.ts}`, `src/core/types/entitlement.ts`, `src/core/store/slices/entitlementSlice.ts`, `src/core/hooks/{useEntitlements.ts,useEntitlementsBootstrap.ts}`, `src/core/config/entitlements/{packages.ts,featureCatalog.ts,resolveEntitlements.ts}` |
| Auth & RBAC | `src/core/providers/AuthProvider.tsx`, `src/core/utils/{authService.ts,tokenManager.ts,jwt.ts,permissionManager.ts,constants.ts}`, `src/core/components/auth/{ProtectedRoute.tsx,LoginForm.tsx}`, `src/core/hooks/{usePermissions.ts,useIsSystemAdmin.ts}`, `src/core/components/form/form-elements/Autocomplete.tsx` |
| Navigation & routes | `src/App.tsx`, `src/cms/App.tsx`, `src/cc/App.tsx`, `src/core/layout/{SuperSidebar.tsx,SuperTopbar.tsx}`, `src/cms/layout/AppSidebar.tsx` |
| Master data models | `src/core/types/{organization.ts,user.ts,role.ts}`, `src/cms/types/{area.ts,case.ts,unit.ts,skill.ts,serviceType.ts,caseResult.ts,appointmentType.ts,brand.ts,category.ts,store.ts,workflow.ts,customerContactDefault.ts}` |
| APIs | `src/core/store/api/{userApi.ts,organizationApi.ts}`, `src/cms/store/api/{unitApi.ts,serviceApi.ts,caseApi.ts,caseResultApi.ts,appointmentType.ts,skillApi.ts,propertyApi.ts,formApi.ts,escalationApi.ts}` |
| Settings & KB | `src/cms/components/admin/system-configuration/**`, `src/cms/components/case/createCase/map/AddressMap.tsx`, `src/cms/components/customer/CustomerFormConfig.tsx`, `src/kms/common/utils/enumHelper.ts` |
| Source documents | `docs/SKYICT-Service-Center-Project-Prototype.md` (v1), `docs/SKYICT-Service-Center-Project-Prototype-v2.md`, `docs/task-evidence/TASK-2026-CORE-0001-tenant-entitlements-subscription-gating.md` |
