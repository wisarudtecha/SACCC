# Adding a New Tenant — SKYICT Onboarding Runbook (v2)

> **Status:** Draft v0.2 — 2026-11-10. Supersedes
> [`SKYICT-Tenant-Onboarding-Runbook.md`](./SKYICT-Tenant-Onboarding-Runbook.md) (v0.1, 2026-11-04),
> which is kept as history. Evidence-based: every field name, route, permission key, endpoint and
> file path below was read out of this repository while writing it (see Appendix B). Where a claim
> could not be traced to code it is marked **UNVERIFIED**, not restated as fact.
>
> **What changed in v0.2.** (1) Part A is no longer a to-do for SKYICT — it is shipped
> (`skyict.json` exists, is registered, and is asserted by tests), so F1–F5 are re-framed as *the
> one change a new tenant needs* plus the current state of the worked example. (2) Part B gained the
> executable seeding path (`db/seed/skyict/*`, API payloads) and the per-environment build-time
> variables a tenant silently inherits. (3) Part C is rewritten as an **admin configuration guide**:
> every step now carries the route, the gate(s), the verified field list, the SKYICT working values
> (Appendix C), a verification check and the ordering trap. (4) §8 re-audits the source document at
> v3 — 17 entries, 6 of which change a v3 claim (including one that invalidates a whole column of its
> case-type table). (5) §9 limitations are refreshed: 7 of the 11 entitlement features gate nothing,
> two settings sections are frontend contracts ahead of the backend, and the workspace/supervision
> routes have no gate at all.
>
> **Scope:** what must be done — and in what order — to bring up a new tenant on this build, split
> into (a) what the backend/platform must provide, (b) the one code change this repository needs, and
> (c) the in-app configuration sequence a tenant Admin can follow without reading source code.
>
> **Reusable form:** the business-agnostic version of this document — fill-in worksheets, role matrix
> and acceptance checklist for the *next* tenant — is
> [`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md). This SKYICT
> runbook is the worked example for it: copy the template, read this document when a worksheet
> section needs to know what the product actually does.
>
> **Lineage warning.** `docs/SKYICT-Service-Center-Project-Prototype.md` (v1),
> `…-Prototype-v2.md` (v2) and `…-Prototype-v3.md` (v3, 2026-11-10) are all present, but v1/v2 both
> point at a `…-v2-Baseline.md` that **does not exist in this repository**. v3 is the first version
> that was checked against the codebase; it is still a *requirements* document, not an
> implementation reference — §8 below lists every correction this runbook had to make to it.

---

## 1. What "tenant" means in this build

| Fact | Evidence |
| --- | --- |
| There is **no tenant-creation UI or API** in this repository. `tenant` appears only in comments describing a future `GET /tenants/{orgId}/entitlements`. | `src/core/store/slices/entitlementSlice.ts:5-8,39-42`, `src/core/types/entitlement.ts:4-8`, `src/core/mocks/entitlements/index.ts:8-16` |
| Runtime tenant identity is the **`organization` string on the logged-in user**, used as the entitlement lookup key. | `src/core/hooks/useEntitlementsBootstrap.ts:20`, `src/core/store/slices/entitlementSlice.ts:29-43` |
| The login form's Organization field is **free text** with autocomplete; the suggestion list is exactly the registered entitlement fixture keys, and the field defaults to `BMA`. | `src/core/components/auth/LoginForm.tsx:28,337-347`, `src/core/components/form/form-elements/Autocomplete.tsx:36,56-63`, `src/core/mocks/entitlements/index.ts:27` |
| When the BFF omits `organization`, login backfills it from the form selection (a copy, not a mutation of the cached response). | `src/core/providers/AuthProvider.tsx:209-215` |
| `orgId` (tenant UUID) exists on the user record but is **not** used as the entitlement key yet — the fixtures are keyed by `organization`. | `src/core/mocks/entitlements/index.ts:8-22`, `src/core/store/slices/entitlementSlice.ts:5-8` |
| Three places **default to `"SKY-AI"`** when the tenant string is missing (token refresh, JWT decode, mock-user builder), and the mock builder also swaps in the system role. A new tenant's user whose payload lacks the field is silently treated as SKY-AI. | `src/core/utils/tokenManager.ts:291-293`, `src/core/utils/jwt.ts:50`, `src/core/utils/authService.ts:19,82,127` |
| The frontend never derives tenant scope itself: data calls carry the JWT (source of truth `TokenManager`) and are scoped server-side. The only place an `orgId` travels explicitly is the org-settings family (`/organizations/{orgId}/…`), read from the signed-in profile. | `src/core/utils/tokenManager.ts`, `src/cms/components/admin/system-configuration/settings/useOrgMapSettings.ts:50-51`, `src/core/store/api/organizationApi.ts`, `CLAUDE.md` ("Auth, permissions, and routing guards") |
| A tenant can only reach the app through the login payload: `organization`, `orgId`, `roleId`, `permission`. Anything missing produces a plausible-looking but wrong session (§2 G4), never an error. | `src/core/providers/AuthProvider.tsx:40-53` |

**Consequence for onboarding.** "Create the tenant" is a **backend/platform** work item (organization
record + users + roles + permission catalog). Everything a reviewer can click in the UI starts at
§5 S1.

## 2. The gates every screen passes through

Understanding these is the difference between "the tenant is created" and "the tenant can use the product".

**G1 — RBAC (`permId`).** `user.permission` is a `Record<category, string[]>` of dotted ids such as
`case.assign`, delivered by the BFF login response; `PermissionManager` flattens it and does an exact
`includes` match (`src/core/utils/permissionManager.ts:7-47`, `src/core/hooks/usePermissions.ts`).
`ProtectedRoute` with `requiredPermissions` requires **ALL** listed keys
(`src/core/components/auth/ProtectedRoute.tsx:296-334`, `PermissionManager.hasAllPermissions`
`permissionManager.ts:39-47`). Menus use `hasPermission` / `hasAnyPermission` individually.

**G2 — Entitlements (`entitlement.*`).** A second, tenant-scoped gate ("did the tenant buy this"),
resolved from `src/core/mocks/entitlements/*` today. It has **no admin bypass by design**
(`src/core/hooks/useEntitlements.ts:1-8`, `src/core/components/entitlements/EntitlementGate.tsx:21-27`).
Reality check: **only four features gate anything** —
`entitlement.kb` (`src/App.tsx:53-62`, sidebar entries), `entitlement.audit` (`src/App.tsx:64-71`),
`entitlement.chat` (`src/cc/App.tsx:41-59`), `entitlement.gis`
(`src/cms/components/case/createCase/map/AddressMap.tsx:45`,
`src/cms/components/admin/system-configuration/settings/map/MapSettingsSection.tsx:114`). The other
seven are declared, validated and displayed in the subscription panel but change no screen (§9 L2).

**G3 — System-role bypass.** Route guards skip RBAC when `profile.roleId === SYSTEM_ROLE`, a hardcoded
UUID `d6381714-8e89-47de-9d16-859131cdc5dc` (`src/core/utils/constants.ts:279`,
`src/core/utils/authService.ts:504-518`, `src/core/components/auth/ProtectedRoute.tsx:271,296-297`).
`SuperSidebar` and `SuperTopbar` — the shell a real user sees — have **no** such bypass. **Consequence:
a new tenant's Admin role gets no menu at all unless every key is granted explicitly, unless the
backend reuses that UUID for it.**

**G4 — Mock fallbacks.** If the stored profile lacks `orgId` **or** `roleId`, app bootstrap
*replaces* the user object with `AuthService.createMockUser(...)`: `organization: "SKY-AI"`,
`roleId = SYSTEM_ROLE`, and a synthetic permission list
(`src/core/providers/AuthProvider.tsx:45-53`, `src/core/utils/authService.ts:19-137`). This *looks*
healthy — the admin bypass hides the missing RBAC — but the tenant becomes SKY-AI with the wrong
permission set, so most super-app menus disappear.

**G5 — Build-time environment gates (not per tenant).** Several behaviours that read as
"configuration" are compiled in from `.env.*` and therefore differ per **environment**, not per
tenant: `VITE_MAP_PROVIDER` (+ `VITE_ARCGIS_API_KEY` / `VITE_LONGDO_API_KEY` /
`VITE_MAPTILER_API_KEY` + `VITE_ORS_API_KEY`), `VITE_BOUNDARY_SOURCE` + `VITE_BOUNDARY_MINIO_BASE_URL`
(local dataset vs MinIO objects), `VITE_JASPER_URL` / `VITE_JASPER_USERNAME` / `VITE_JASPER_PASSWORD`
/ `VITE_JASPER_CSRF_TOKEN` (report server), `VITE_ENABLE_PII_MASKING`, `VITE_MOCK_API`,
`VITE_USE_GRAPHQL` (`src/core/config/api.ts:176-219`, `src/core/components/report/openReport.ts:22-38`,
`.env.staging:52-56,68-85`). Two tenants needing different values for any of these is a product change, not
onboarding. The *map provider* is the one exception with a per-organization override
(`OrgMapGeneralSettings.mapProvider`, §5 S11).

---

## 3. Part A — Frontend change in this repository (F1–F5)

This is the **only** code change a new tenant needs in this repo. It is small and self-contained.
**For SKYICT it is already done** — this part now documents *how it was done* so the next tenant
repeats it in minutes, and records the current state.

### F1 — Decide the package (blocking)

The fixture declares a plan, and the plan determines which features can ever be unlocked.
Verified mapping (`src/core/config/entitlements/packages.ts:17-49`,
`src/core/config/entitlements/featureCatalog.ts:21-77`):

| Plan | Price / agent / month | Bundled SKUs | Adds features |
| --- | --- | --- | --- |
| `essential` | ฿1,500 | `CC-CORE`, `CC-AGENT`, `CC-KB` | `entitlement.core`, `entitlement.agent.desktop`, `entitlement.kb` |
| `professional` | ฿2,500 | + `CC-CHAT`, `CC-CHANNEL` | + `entitlement.chat`, `entitlement.channel.social` |
| `enterprise` | ฿4,000 | + `CC-GIS`, `CC-CAD`, `CC-BOT` | + `entitlement.gis`, `entitlement.cad`, `entitlement.bot` + `ENTERPRISE_EXTRA_FEATURES` (`entitlement.kb.semantic_search`, `entitlement.audit`, `entitlement.rbac.advanced`) |

Two consequences that are easy to miss:

- `entitlement.gis` gates the **case-creation address map** and the whole **Map Settings** section —
  not just a "GIS dashboard". An `essential` tenant loses the map on Create Case (it renders the lock
  panel, not a broken map).
- `entitlement.kb` gates the entire `/kms/*` module at the route level (`src/App.tsx:53-62`) plus the
  sidebar's Knowledge group. Any tenant that needs a knowledge base needs `CC-KB` → `essential` is the
  floor.

`CC-SERVICE` exists in the `SkuCode` union (`src/core/types/entitlement.ts:11-20`) but is in **no**
package preset and grants **no** feature — do not sell it as a package component without a code
change.

**Decision needed before F3.** SKYICT is `enterprise` ("nothing locked") today. Replace the numbers
in F3 with the signed commercial values; the limits/seats/dates in the fixture are illustrative.

### F2 — Confirm the login payload contract (blocking, backend)

Before creating any fixture, obtain from the BFF team the exact login/`profile` payload for the
tenant's user and confirm it carries:

| Field | Why it matters if absent |
| --- | --- |
| `organization` = the tenant key (e.g. `"SKYICT"`) | Entitlement lookup falls through to the `default` (essential) fixture. |
| `orgId` | G4 triggers on the next page load and **overwrites the profile** with the SKY-AI mock user. |
| `roleId` | Same G4 overwrite. |
| `permission` as `Record<category, string[]>`, with the **category key `"kms"` present** for KB permissions | The Knowledge group in the sidebar renders only when `permissionsByCategory.kms` is non-empty (`src/core/layout/SuperSidebar.tsx:622-633`). |

Sanity check after first login: `localStorage.profile` must show all four.

### F3 — Add the fixture file (DONE for SKYICT)

`src/core/mocks/entitlements/skyict.json` exists and matches the shape enforced at runtime by
`isTenantEntitlements` (`src/core/mocks/entitlements/index.ts:34-50`). For a new tenant, copy it to
`src/core/mocks/entitlements/<key lowercase>.json` and replace every value:

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
  (`src/core/config/entitlements/resolveEntitlements.ts:52-58`). It is *not* recomputed from `skus`, so a
  fixture whose `features` and `skus` disagree behaves according to `features`.
- The guard requires `orgId`, `plan`, `skus[]`, `features[]`, `limits.maxAgents`, `seats.used`,
  `seats.max`. A missing one makes the fixture be **rejected and silently replaced** by `default`.
- Do **not** rename or delete `default.json` — it is the fallback for unknown orgs
  (`src/core/mocks/entitlements/index.ts:24,58-67`).
- `renewedAt` / `expiresAt` are optional and only displayed; `seats.used` is **not** derived from the
  users you create — it renders whatever the fixture says (§9 L3).

### F4 — Register the fixture (DONE for SKYICT)

`src/core/mocks/entitlements/index.ts:17-22` currently reads:

```ts
export const ENTITLEMENT_FIXTURES: Record<string, TenantEntitlements> = {
  BMA: bmaFixture as TenantEntitlements,
  SIH: sihFixture as TenantEntitlements,
  "SKY-AI": skyAiFixture as TenantEntitlements,
  SKYICT: skyictFixture as TenantEntitlements,
};
```

This single edit is what makes the key appear in the login Organization dropdown
(`FIXTURE_TENANT_NAMES` is derived from the registry keys, `index.ts:26-27`).

Lookup is trim + case-insensitive (`index.ts:58-67`), so `skyict`, `SKYICT` and ` SKYICT ` all
resolve — but the resolved payload's `orgId` is stamped with the string the user actually typed
(`index.ts:63`). If a later report groups by `orgId`, standardise the casing at the login form or
teach the report to normalise; nothing in the app normalises it today.

### F5 — Extend the tests (DONE for SKYICT)

`src/core/mocks/entitlements/entitlementFixtures.test.ts` currently asserts the SKYICT rows
(`:20,:28,:49,:54`). For a new tenant add, in the same style:

```ts
expect(resolveFixture("<KEY>").plan).toBe("<tier>");
expect(resolveFixture("<key>").plan).toBe("<tier>");        // case-insensitive
expect(resolveFixture("<KEY>").features).toContain("<feature you rely on>");
expect(FIXTURE_TENANT_NAMES).toEqual(expect.arrayContaining(["<KEY>"]));
```

Run `pnpm test` (Vitest, `src/**/*.test.{ts,tsx}`) and `pnpm build` (`tsc -b` is strict with
`noUnusedLocals`). Note the suite's existing habit: it asserts **behaviour per tenant**, not just the
shape, because a shape-only test passes for a fixture that resolves to the wrong plan.

---

## 4. Part B — Backend / platform prerequisites (P1–P11)

These cannot be done from this repository. Each row states the **contract the frontend depends on**,
so the request to the backend team is unambiguous.

| # | Prerequisite | Frontend dependency (evidence) |
| --- | --- | --- |
| **P1** | Create the tenant + organization record; issue `orgId`. | No FE create path (§1). `orgId` is returned on the profile and preserved by `AuthProvider.tsx:209-215`. |
| **P2** | Ensure the **global permission catalog** (`GET /permission`) contains every `permId` the UI checks — Appendix A. | A key absent from the catalog cannot be granted in Role Privilege, so the menu/route stays invisible (`src/core/store/api/userApi.ts:312-322`, `src/core/pages/Admin/RolePrivilegeManagement.tsx`). |
| **P3** | Create the tenant's roles and `role_permission` rows. `roleName` is stored verbatim — this tenant uses snake_case `system_admin`, `admin`, `agent`, `dispatcher`, `responder`. Decide explicitly whether the tenant's `system_admin` reuses the hardcoded `SYSTEM_ROLE` UUID; if not, every key must be granted individually. | `src/core/types/role.ts:24-110`, `src/core/store/api/userApi.ts:211-306`, §2 G3, `db/seed/skyict/02-um_users.sql:42-49,107-116` |
| **P4** | Create users with the fields the UI expects: `username`, `orgId`, `roleId`, `deptId`, `commId`, `stnId`, `empId`, `email`, `mobileNo`, `title`, `firstName`, `middleName`, `lastName`, `displayName`, `userType`, `photo`, `active`, `citizenId`, `bod`, `blood`, `gender`, `address`. Password is **not** part of the create contract — set it afterwards via `POST /users/reset_password` or `PATCH /users/change_password/{id}`. | `UserFormData` — `src/core/types/user.ts:216-247`; `db/seed/skyict/api-payloads/README.md` ("Transport caveats" §3), `src/core/store/api/userApi.ts:356-374` |
| **P5** | Seed the master data that has **no create UI**: case statuses (`GET /case_status`, read-only, S000–S019), unit types (`GET /mdm/types`), unit sources (`GET /mdm/sources`), unit statuses (`GET /mdm/status`), companies (`GET /mdm/companies`), order/request statuses. | `src/cms/store/api/unitApi.ts:113-143`, `src/cms/store/api/serviceApi.ts:12-24`, `src/cms/components/ui/status/status.tsx:11-32` |
| **P6** | Seed the tenant's **area boundary data** if the tenant is expected to use the case map's Service Center auto-match: district polygons must exist per district, not just the names. | Point-in-polygon is the only matching mechanism — `src/cms/components/case/formFields/serviceCenterMatch.ts:1-22`, `useServiceCenterMatch.ts:50-74` |
| **P7** | Bind the tenant's default **order workflow** in `app_configs`. | **UNVERIFIED from this repo** — no `app_configs` reference exists anywhere in `src/`. Confirm the column, the workflow name (`SparePart - Do not Change` appears only in the source document) and the owner. |
| **P8** | Expose the GraphQL operations the frontend maps: `KBCMSServiceTypeArticle` (article ↔ case sub-type mapping, used from the sub-type form) and `UpdateRolePermissionMulti` (the GraphQL form of `POST /role_permission/add`, which has **no** GQL mapping). | `src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts`, `src/core/store/api/graphql/roleQueries.ts`, `db/seed/skyict/api-payloads/README.md` §2 |
| **P9** | Serve the report server (JasperReports) at the path the app posts to, with the report units the tenant is sold. | `src/cms/components/report/openReport.ts:22-56` (POSTs to `${VITE_JASPER_URL}jasperserver/j_spring_security_check`), `reportConfig.json` (Thai folder paths) |
| **P10** | Confirm the per-environment flags (§2 G5), especially `VITE_MOCK_API` and `VITE_USE_GRAPHQL`. Under mock mode several screens read `src/core/mocks/*.json` instead of the API, which masks a mis-provisioned tenant; under GraphQL mode a URL with no `GQL_MAP` entry is a hard failure, not a REST fallback. | `CLAUDE.md` ("Environment configuration", "Hybrid REST/GraphQL query layer") |

### P11 — Executable seeding path (organization, roles, users)

Part B above is a request to another team. This repository also carries a **runnable** version of the
same work for SKYICT — useful when the onboarding is a demo you must stand up yourself, and a good
template for the next tenant (`db/seed/skyict/`):

| Order | File | Produces | Notes |
| --- | --- | --- | --- |
| 1 | `00-diagnose-users.sql` | per-username report: `ok` / `IN OTHER ORG` / `NOT IN DB` / `ROLE DIFFERS` | Run **before** any insert; it answers "why did only 6 of 16 users appear". |
| 2 | `01-sec_org-structure.sql` | 1 department, 6 commands, 7 stations | Plain SQL, no `\set`/`\if`; ids are minted by the database (`gen_random_uuid()`), rows link by name. Prints the ids to paste into step 3. |
| 3 | `02-um_users.sql` | 16 users with role/dept/command/station | Parameters in one temp table; `§5.2` prints `ok` per user. `password` is a ready-made hash or set afterwards. |
| 4 | `api-payloads/01…06` | the same data through the product's own REST/GraphQL API | Create in the documented order; `{{PLACEHOLDERS}}` must be replaced with ids returned by the previous call. |

Hard rules the scripts encode (do not "optimise" them away):

- **Never invent an identifier the product assigns.** `deptId` / `commId` / `stnId` / role `id` /
  `grpId` / `skillId` / `propId` / `resId` / sub-type `sTypeId` are server-generated; the frontend's
  create DTOs carry only `{active, en, th}` + parent id (`src/core/types/organization.ts:25-84`,
  `src/core/types/role.ts:95-98`, `src/cms/types/case.ts:246-276`). The values you *do* supply are the
  parent references and the explicit business codes (`sTypeCode`, `countryId`/`provId`/`distId`,
  `unitId`, `deviceId`).
- **A seed that skips rows must say which rows it skipped.** `02-um_users.sql §2c` was written after a
  run inserted 6 rows and reported success while 10 usernames already existed under another tenant.
- **`username` uniqueness is not tenant-scoped in practice.** Adding a tenant creates a *second*
  account for a person or fails loudly on `UNIQUE (username)`; the second outcome is the answer, not
  an obstacle (§9 L12).

---

## 5. Part C — In-app configuration, in dependency order (S1–S14)

Follow this order; each step's output is an input to a later one. "Menu path" is what a user actually
clicks in the super-app shell (`SuperTopbar` → **More**, or `SuperSidebar`). Every gate listed is from
the code, not from the source document.

**The dependency chain at a glance** (this is the map an Admin needs):

```text
S1 Organization ─┬─> S4 Users ─┬─> S6 Units (username, dept/comm/stn)
                 │             └─> S13 Contacts (agent identity)
                 └─> S2 User Groups ─> S7 Workflow nodes (dispatch/process PIC)
S3 Roles ─> S4 Users
S5 Skills ──────────────┐
S6 Unit Properties ─────┼─> S7b Case Sub-Type (skill + property + workflow + device type)
S7 Workflows ───────────┘                  │
                                           ├─> S8 Dynamic forms (rendered per sub-type)
                                           └─> S13 KB articles (mapped back into the sub-type)
S9 Area (+ district polygons) ─> Create Case Service Center auto-match
S11 Organization settings ─> map layers / assignment rules consumed by S9-S10 surfaces
S12 CRM master data ─> orders, stock, spare parts
```

**Minimum path to a working Create Case** (demo scope, no CRM/KB): S1 → S3 → S4 → S5 → S6
(properties only) → S7 → S7b → S8 → S9 → S11 (map). Everything else can follow.

### S1 — Organization structure (Department → Command → Station)

- **Where:** More → User Management → Organization (`/organization`); gate `organization.view`
  (`src/core/pages/Admin/OrganizationManagement.tsx:55`).
- **Entities (3 levels, created in this order):**
  `Department{deptId, en, th, active}` → `Command{deptId, commId, en, th, active}` →
  `Station{deptId, commId, stnId, en, th, active}`. Create DTOs carry **only** `{active, en, th}` plus
  the parent id (`src/core/types/organization.ts:17-84`).
- **SKYICT data:** 1 department, 6 commands, 7 stations — Appendix C.1.
- **Verify:** the hierarchy view lists every row with the intended parent; `GET /department_command_stations`
  returns the flattened tree (`src/core/store/api/organizationApi.ts:183-187`).
- ⚠️ **Edit the right API module:** the live one is `src/core/store/api/organizationApi.ts`.
  `src/cms/store/api/organizationApi.ts` is an unimported stale duplicate (verified: nothing imports it).
  Do not "fix" the duplicate.
- ⚠️ **Do not** enter zones/stations under Area Management. Organization and Area are different models
  — see S9 and correction C2.

### S2 — User groups

- **Where:** More → User Management → User Group (`/user-group`); gate `usergroup.view`
  (`src/core/pages/Admin/UserGroupManagement.tsx:41`).
- **Fields:** `en`, `th`, `active` (create DTO `UserGroupCreateData`), optional free-text
  `description` on the read model. `grpId` is **server-generated**; the create form has no id field and
  no "Main Category" (`src/core/types/user.ts:296-327`, `src/core/components/admin/user-management/user-group/`).
- **Membership** is keyed by `(grpId, username)`; the UI writes single links
  (`/user_groups/{grpId}/users/add`) or replaces the whole set (`/user_groups/{grpId}/users/batch`)
  (`src/core/store/api/userApi.ts:179-205`).
- **Why it matters:** workflow `dispatch` / `process` nodes assign work to a **user group**, not to
  individuals, so groups must exist before S7.
- **SKYICT data:** 6 groups (General, Dispatch Group 1/2, Order Approval, Technical, Agent) —
  Appendix C.2. `General` is expected to be created by the backend when the tenant is created
  (source-document roadmap item, **UNVERIFIED** — check, and create it manually if absent).

### S3 — Roles and permissions (RBAC)

- **Where:** More → User Management → Role & Privilege (`/role-privilege`); gate `role.view`
  (`src/core/pages/Admin/RolePrivilegeManagement.tsx:72`).
- **What it edits:** `Role{roleName, en?, th?, active}` and the `role_permission` link rows
  (`roleId` + `permId` + `active`) (`src/core/types/role.ts:24-73`). The matrix is grouped by the
  permission's `groupName` and locks the **system role** unless the signed-in user is the system admin
  (`PrivilegeMatrixView.tsx:241`).
- **`roleName` is data, not a label.** This tenant stores snake_case: `system_admin`, `admin`,
  `agent`, `dispatcher`, `responder` (`db/seed/skyict/api-payloads/04-roles.json`). A grant script or
  a report must use the literal string; "Admin" will not match.
- **Verify:** log in as the tenant Agent and confirm no admin-only menu appears (§6) — still the single
  most reliable check that P2/P3 were done.
- ⚠️ Do not grant `package.view`: the Package menu entry is a `disabled: true` placeholder pointing at
  a route that does not exist (`src/core/layout/SuperTopbar.tsx:481-486`).

### S4 — Users

- **Where:** More → User Management → User (`/user`), create at `/user/create`; gates `user.view` for
  the list, and `user.create` **and** `user.update` together for the form
  (`src/core/pages/Admin/UserForm.tsx:804`, AND semantics per §2 G1).
- **Fields (`UserFormData`):** `active`, `address`, `blood`, `bod`, `citizenId`, `commId`, `deptId`,
  `displayName`, `email`, `empId`, `firstName`, `gender`, `lastName`, `middleName`, `mobileNo`,
  `orgId`, `password`/`confirmPassword` (change-password flow), `photo`, `roleId`, `stnId`, `title`,
  `userType`, `username` (`src/core/types/user.ts:216-247`).
- **Depends on** S1 (`deptId`/`commId`/`stnId` are selects) and S3 (`roleId`).
- **After creating the user**, the preview panel carries three more assignments that matter for routing:
  **Groups** (`UserGroupsView`), **Skills** (`SkillsMatrixView` → `POST /users_with_skills_batch/add`),
  **Area coverage** (`AreaAssignmentView` → `POST /users_with_area/{username}` with `distIds[]`)
  (`src/core/store/api/userApi.ts:478-497`, `src/core/types/user.ts:70-99`).
- **SKYICT data:** 16 users, 5 roles — Appendix C.3.
- **Note for a new tenant:** the station is the level most other screens read (`stnId` on users and
  units). Create stations even if the customer only thinks in departments.

### S5 — Skills

- **Where:** More → System Config → Skill (`/cms/skill`); gate `unit.view` (not `settings.view`) —
  the page and the menu both use it (`src/cms/pages/Admin/SkillManagement.tsx:48-55`,
  `src/core/layout/SuperTopbar.tsx:390-393`).
- **Fields:** `en`, `th`, `active`; `skillId` server-generated (`src/cms/types/skill.ts:4-14`).
- **Used by:** case sub-types (`userSkillList`) and user skill assignment (S4). Create them before
  S7b, otherwise the sub-type form's required skill select has nothing to offer.
- **SKYICT data:** 6 skills — Appendix C.4.

### S6 — Unit properties, then units

- **Where:** System Config → Property (`/cms/property`, page gate `unit.view`) and Units
  (`/cms/unit`, page gate `unit.view`; create/edit gate `unit.create` **and** `unit.update`)
  (`src/cms/pages/Admin/PropertyManagement.tsx:40`, `UnitManagement.tsx:51`, `UnitForm.tsx:177`).
- **Properties:** `en`, `th`, `active`; `propId` server-generated (`src/cms/types/unit.ts:242-307`).
  The admin assigns properties to a unit through the unit's Properties tab, which calls
  `POST /mdm/units/properties/{unitId}/bulk` with the **business** `unitId` (e.g. `UNIT-001`), not a
  UUID (`src/cms/types/unit.ts:280-288`, `src/cms/store/api/unitApi.ts:91-103`).
- **Unit record:** `unitId`, `unitName`, `unitTypeId`, `unitSourceId`, `username`, `priority`,
  `compId`, `deptId`, `commId`, `stnId`, `plateNo`, `provinceCode`, `active`
  (`src/cms/types/unit.ts:87-153`).
- **Required by the form:** only `unitId` and `unitName` (`UnitForm.tsx:103-124`). Everything else
  saves blank — fill it anyway, because `username` is what links an officer to the staff map layer and
  `deptId/commId/stnId` is what the case carries after assignment.
- **Read-only catalogues:** unit **type**, **source**, **status**, and **company** are read-only in
  the UI — they must be seeded (P5) before this screen is usable
  (`src/cms/store/api/unitApi.ts:113-143`).
- ⚠️ `compId` is a **Company** record (`/mdm/companies`), a different entity from
  `deptId` (Organization). Do not type the department name into the company field.
- **SKYICT data:** 8 properties, 7 units — Appendix C.5.

### S7 — Workflows

- **Where:** More → Workflow → Workflow Management (`/cms/workflow/list`, page gate `workflow.view`)
  and the builder (`/cms/workflow/editor/v3`, **menu** gate `workflow.create`, **page** gate
  `workflow.view`) (`src/cms/App.tsx:178-183`, `src/cms/pages/Workflow/Editor.tsx:83`,
  `src/core/layout/SuperTopbar.tsx:284-301`).
- ⚠️ **Menu/pages disagree here**: a role with `workflow.view` only can open the editor by URL while
  the menu entry stays hidden; a role with `workflow.create` but not `workflow.view` sees the menu and
  is denied. Grant both to whoever builds workflows.
- **Node types:** `start`, `process`, `dispatch`, `decision`, `sla`, `end`
  (`src/cms/types/workflow.ts:18-25`); metadata carries `totalSla` and `wfType` (`:44-50`).
  Assignment nodes pick a **user group** from S2.
- **Default shape available for reference:** `src/cms/mocks/workflowDefault.json` (title `SOP001`,
  `status: active`) — its metadata carries only `title`/`description`/`status`, so `totalSla` must be
  set per tenant (§8 C14).
- **Ordering:** create case workflows here **before** S7b, because the sub-type form requires `wfId`.
- **SKYICT data:** 5 case flows with per-status minutes — Appendix C.6. The orders flow
  (`SparePart - Do not Change`) is P7, not an in-app task.

### S7b — Case Type / Sub Type (the SLA + routing backbone)

- **Where:** System Config → Service Type (`/cms/service`); gate `service.view`
  (`src/cms/pages/Admin/ServiceManagement.tsx:70`).
- **Two entities, not one:** case **type** (`POST /casetypes/add`) and case **sub-type**
  (`POST /casesubtypes/add`), plus the combined read `/casetypes_with_subtype` used by the tree
  (`src/cms/store/api/serviceApi.ts:29-127`).
- **Type fields — and the trap:** the create form has exactly **two** inputs, EN and TH; the payload is
  `CaseTypesCreateData = {active, en, th}` (`ServiceManagement.tsx:433-452,852-876`,
  `src/cms/types/case.ts:328-332`). `typeId` is **server-assigned** and only appears afterwards as the
  row key for update/delete. **There is no "Type Code" field** — the `1001/1002/…` column in the
  source document cannot be typed in anywhere (correction C6).
- **Sub-type fields:** `typeId` (selected from the types above), `sTypeCode`, `en`, `th`, `wfId`,
  `caseSla`, `priority`, `userSkillList[]`, `unitPropLists[]`, `mDeviceType`, `mDeviceTypeName`,
  `mWorkOrderType`, `active` (`src/cms/types/case.ts:246-276`).
- **What the form actually validates:** `en`, `th`, `sTypeCode`, `typeId`, `priority`,
  `unitPropLists`, `userSkillList`, `wfId`, `mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`.
  **`caseSla` is *not* required** — a blank SLA saves as `"0"` (the validation lines are commented
  out: `ServiceManagement.tsx:333-336`, default at `:581`). Always type the SLA: it is what the SLA
  monitor compares against.
- **KB article mapping (new):** the sub-type form carries a tree multi-select that maps **published
  knowledge articles to the sub-type**; it is saved after the sub-type via the KMS GraphQL service
  `SyncServiceTypeArticles` (`ServiceManagement.tsx:778-799,1132-1142`,
  `src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts`). This creates
  an ordering cycle: articles need categories/files (S13), which need the tenant configured first.
  Practical sequence: create the sub-type without articles → build KB content (S13) → re-open the
  sub-type and map articles.
  - ⚠️ Because the mapping call runs after the sub-type save, a failing mapping call turns the whole
    action into an error toast **even though the sub-type was saved**
    (`ServiceManagement.tsx:600-644`). Confirm the row in the tree before re-saving.
- ⚠️ **Priority is ambiguous at the storage level — read L1 before filling that column.**

### S8 — Forms (dynamic case forms)

- **Where:** More → Form → Form Management (`/cms/form-management`, page gate `form.view`) and the
  builder (`/cms/dynamic-form`, gate `form.create`)
  (`src/cms/pages/Forms/FormManagement.tsx:19`, `src/cms/App.tsx:167-176`).
- **How a form reaches Create Case:** the case form is read per case **sub-type** and per workflow
  (`POST /forms/casesubtype` with `{id: sTypeId}`, `/forms/GetFormlinkWf`, `/forms/getAllFormslinkWf`)
  (`src/cms/store/api/formApi.ts:201-223,79-97`).
- ⚠️ **The form builder still exposes no "bind to sub-type" field.** In `formApi.ts` the
  `caseSubType` key is commented out and only `id` is posted (`:205-208,217-220`). How the link is
  established server-side is **UNVERIFIED here**; ask the backend owner and use
  `/forms/casesubtype?id={sTypeId}` returning the form as the acceptance check. Do not schedule an
  in-app step that does not exist.
- **SKYICT data:** 3 forms (Telephony Hardware & IT Service, Hardware Repair, Emergency Outage) —
  Appendix C.7, with the sub-type each one must resolve for.

### S9 — Area (Country → Province → District) and Area Templates

- **Where:** System Config → Area (`/cms/area`) and Area Template (`/cms/area-template`).
- **Gate mismatch to be aware of:** the **menu** entries require `settings.view`
  (`src/core/layout/SuperTopbar.tsx:401-413`) but the **pages** require `area.view`
  (`AreaManagement.tsx:46`, `AreaTemplateManagement.tsx:19`, `AreaTemplateDetail.tsx:21`,
  `AreaTemplateVersions.tsx:21`). Grant **both** or the operator sees the menu and gets "insufficient
  permissions" on click. CRUD inside the page additionally checks `area.create/update/delete`.
- **Hierarchy is exactly three levels,** each with its own business key and optional polygon:
  `Country{countryId, nameSpace, yearOfData, shapeArea, shapeLength, coordinates?}` →
  `AreaProvince{countryId, provId, coordinates?}` → `AreaDistrict{countryId, provId, distId,
  postcode?, coordinates?}` (`src/cms/types/area.ts:126-232`). It is **not** a
  Department/Command/Station hierarchy — see correction C2.
  - `nameSpace` is required by every create payload; it is the dataset's namespace (e.g. the country
    code or the template it came from).
  - `postcode` is **read-only** on districts: `AreaDistrictInput` has no such field
    (`src/cms/types/area.ts:156-159`).
  - Boundaries are drawn/edited with a live coordinate preview, and geometry must be sent as an
    explicit array — omitting the field is not the same as clearing it
    (`src/cms/types/area.ts:119-124`).
- **Why the polygons matter operationally:** Create Case resolves the **Service Center** by testing the
  incident coordinate against each **district polygon**. Exactly one containing district → that Area is
  adopted and the field locks; zero or several → the field stays manual and a fallback radius circle is
  drawn (`src/cms/components/case/formFields/serviceCenterMatch.ts:1-22`,
  `useServiceCenterMatch.ts:50-109`). Two org toggles narrow this (`autoLockOnMatch`, `showRadius` —
  §5 S11). A tenant that enters district **names** but no **geometry** therefore gets a permanently
  manual Service Center field. This is the single most common "the map does not work" cause.
- **Area Templates** are versioned, publishable geography an org adopts into its own areas
  (list → detail → versions routes: `src/cms/App.tsx:190-192`); a tenant with no templates can draw
  its own areas by hand.
- ⚠️ The retry button beside a failed auto-match ("Try Again") calls a **stub that always rejects** —
  no backend resolver exists yet (`src/cms/components/case/formFields/serviceCenterResolve.ts:1-29`,
  `useResolveServiceCenter.ts:1-14`). Treat it as decorative until the endpoint lands (§9 L5).
- **SKYICT data:** THAILAND / BANGKOK / 6 districts — Appendix C.8. The bundled datasets
  (`src/cms/mocks/TH_Bangkok_{Province,District,Subdistrict}.json`) carry 1 province, 50 district
  polygons and 180 subdistricts when the map lookup needs them — boundaries to draw or import are
  already available for Bangkok.

### S10 — Places, devices (map layer objects)

- **Where:** More → Map Management → Place (`/cms/place`) and Device (`/cms/device`); both require
  `organization_settings.manage` (`PlaceManagement.tsx:40`, `DeviceManagement.tsx:42`).
- **Place:** `en`, `th`, `category`, `latitude`, `longitude`, `active`. `category` is a **controlled
  vocabulary** — `police_station | hospital | fire_station` — not free text
  (`src/cms/types/place.ts:14-58`). Coordinates are **numbers** (the spec sends bare JSON numbers).
- **Device:** `deviceId`, `en`, `th`, `deviceType`, `model`, `firmwareVer`, `ipAddress`, `macAddress`,
  `latitude`, `longitude`, `active` (`src/cms/types/deviceIoT.tsx:33-45`). Note:
  - `deviceId` is **client-supplied and unique table-wide**, *not* per organization — agree a naming
    prefix per tenant or the second tenant's devices collide (`deviceIoT.tsx:28-32`).
  - `deviceId` is immutable after create; the PATCH body omits it (`:47-51`).
  - Coordinates are **strings** on this entity (unlike Place) — the map layer normalises either.
  - Delete is a **soft delete** (`active: false`), and the admin list hides inactive rows unless
    requested (`deviceIoT.tsx:53-63`).
- Optional for a first demo; the case-map Place/Device layers render empty without them.

### S11 — Organization settings (map, assignment, subscription)

- **Where:** More → System Config → Organization Settings (`/cms/settings/organization`), gate
  `organization_settings.manage` (`OrganizationSettingsManagement.tsx:27`).
- **Three sections are registered** (`OrganizationSettingsManagement.tsx:21-35`):
  1. **Map settings** — general (map provider override, default basemap, allow style change), layers
     (place / boundaries / search / address+coordinates / incident pin), incident (radius, show radius,
     auto-lock Service Center on match), staff (show staff, trail, routing / ETA-TTL / tracking
     auto-vs-manual intervals), assignment (workload badge, assigned-cases list, recommend ranking).
     **Locks behind `entitlement.gis`** (`MapSettingsSection.tsx:114`).
     The per-organization `mapProvider` override (`arcgis | longdo | maptiler | null = inherit`) is the
     only way two tenants can use different map backends (§2 G5).
  2. **Assignment rules** — `mode` (`automatic | manual`), routing criteria (skill / location /
     department / availability / case type with selected sub-types, combined AND or OR),
     `allocationMethod` (`round_robin | load_balance`), and advanced options per service sub-type
     (`src/core/types/organization.ts:275-331`). **Not** entitlement-gated.
  3. **Subscription & Entitlements** — display-only view of plan, seat usage, SKUs and per-feature
     state (`settings/subscription/SubscriptionEntitlementsSection.tsx:12-40`); it renders whatever
     the fixture says, which makes it the fastest place to confirm F3/F4.
- ⚠️ **Both sections are frontend contracts ahead of the backend, and the two behave differently.**
  `GET/PATCH /organizations/{orgId}/map-settings` and `/assignment-rules` are mapped in
  `src/core/store/api/graphql/organizationQueries.ts:213-221`, but the endpoints/columns do not exist
  server-side yet (`src/core/types/organization.ts:132-149,253-274`):
  - **Assignment rules** loads the real query and falls back to schema defaults on 404 / GraphQL error /
    bad shape (`useOrgAssignmentRules.ts:56`); Save resolves `{ ok: false }` and shows a persistent
    "not saved to server" banner **without discarding the edits**.
  - **Map settings** no longer calls the load endpoint at all — the query is commented out and the
    section always renders schema defaults (`useOrgMapSettings.ts:54-56,68-78`). Save still PATCHes, so
    a value can reach the server and still never render back; `isLoading` also stays `true` whenever the
    app is not in mock mode (`:112-113`). Until someone re-enables that query, treat every Map Settings
    value as **display-only** (§9 L16).
  - For a demo, verify with `VITE_MOCK_API="true"` (session stub backs both screens).
- ⚠️ **Escalation rules have a built component that is not registered in the section list, and an API
  contract but no screen.** `settings/escalation/EscalationRulesSection.tsx` is never imported, and
  `src/cms/store/api/escalationApi.ts:30-45` calls `/organizations/{orgId}/escalation-rules`. Warning
  threshold / target role / on-off cannot be configured from the UI today (§9 L4).

### S12 — CRM master data

Order matters: Brand and Category → Product / Spare part → Store → stock.

| Step | Route | Gate | Fields (verified) |
| --- | --- | --- | --- |
| Brand | `/cms/brands` | `product.view` | `en`, `th`, `type`, `active`, logo (upload first, then send the returned URL as `image`) — `src/cms/types/brand.ts:11-52` |
| Category | `/cms/categories` | `product.view` | `en`, `th`, `type`, `active` — `src/cms/types/category.ts:4-32` |
| Product | `/cms/products` | `product.view` | list page; stock views at `/cms/products/stock` (`product_stock.view`) |
| Store | `/cms/stores` | `product.view` | `en`, `th`, `discount`, `active` — **no address field** (`src/cms/types/store.ts:4-19`) |
| Spare parts | `/cms/inventory` | `sparepart.view` | inventory list; stock at `/cms/inventory/stock` (`sparepart_stock.view`) |
| Order requests | `/cms/inventory/request` | `order.view` | request list; write actions also check `order.create/update/cancel/complete/delete` |
| CRM dashboards | `/cms/products/dashboard` | `crm_dashboard.view` | see L9 before granting the sidebar entry |
| Services | `/cms/services` | `crm_service.view` | service catalogue (`src/cms/App.tsx:294-301`) |

`Brand.type` / `Category.type` are free strings used to separate the product catalogue from the
spare-part catalogue; pick one convention per tenant (`Product` / `SparePart`) and keep it.

### S13 — Contacts, appointments, knowledge base

| Step | Route | Gate |
| --- | --- | --- |
| Contact field configuration | `/cc/contacts-configurations` | `contact_config.view` |
| Customers | `/cc/contacts-list` | `contact.view` |
| Appointment types | `/cc/appointment-types` | `appointment.view` (same key as appointments — there is no separate `appointment_type.*`) |
| Appointments | `/cc/appointment` | `appointment.view` (write actions also check `appointment.create/update/delete`) |
| KB category / files / articles / banner / broadcast / source | `/kms/*` | route gate `entitlement.kb` **and** in-page `kb_*` keys |

- **Contact configuration is per-tenant field visibility**: `photo`, `displayName`, `title`,
  `firstName`, `middleName`, `lastName`, `citizenId`, `dob`, `blood`, `gender`, `mobileNo`, `email`,
  `userType`, `note`, `languagePreference`, `contractPreference`, `social?`, plus **two address blocks**
  (`address` and `currentAddress`, each with per-subfield toggles: no/room/floor/building/street/road/
  subDistrict/district/province/postalCode/country/lat/lon), plus `dynamicForm` + `dynamicFormEnable`
  (`src/cms/types/customer.ts:3-51`).
  - `social` is optional in the type on purpose — the backend may not persist it yet; every consumer
    tests `!== false`, so an absent value means "shown".
- **Appointment types are name-only:** `en`, `th`, `active`; the API keys the row on
  `appointmentTypeId` (the numeric `id` is not the key) (`src/cms/types/appointmentType.ts:1-26`,
  `src/cms/components/admin/system-configuration/appointment-type/AppointmentTypeManagement.tsx:45-95`).
  There is no category and no stay duration (correction C5).
- **KB permissions live in a different namespace**: `kb_dashboard.view`, `kb_category.{view,create,
  update,delete}`, `kb_file.{view,create,upload,delete}`, `kb_article.view`, `kb_article.comment`,
  `kb_article.mgmt.{view,create,update,delete,copy,newversion,changestatus}`, `kb_banner.{view,create,
  delete}`, `kb_broadcast.{view,create,update,delete}`, `kb_source.{view,create,update,delete}`
  (`src/kms/common/utils/enumHelper.ts:1-46`). They must be returned by the BFF under the `kms`
  category for the sidebar group to render (F2).
  - The KMS module gates **in page** with the same core `usePermissions` hook (e.g.
    `src/kms/articles/index.tsx:15-16`, `src/kms/category-manager/index.tsx:10-16`) — so a missing key
    produces a "no permission" panel inside a module that loaded fine, not a hidden menu.
- **Article lifecycle:** `draft → review → published`, with `unpublished`, `archived`,
  `wait_publish`, `wait_approve` also present in the status enum
  (`src/kms/articles/dtos/articles.dto.ts:5-15`). Approval/reject is `kb_article.mgmt.changestatus`.
- **SKYICT data:** contact config, 3 appointment types, KB categories/files/articles —
  Appendix C.9–C.11.

### S14 — Verification pass

Run §7 as a scripted walkthrough, as each role, in a fresh browser profile.

---

## 6. Role → permission matrix (mapped to the keys the code actually checks)

Role intent is taken from the source document (Admin / Agent / Dispatcher / Responder); the keys are
this repository's. "Y" means the code checks it for a surface that role should use.

| Key | Admin | Agent | Dispatcher | Responder | Gates |
| --- | :--: | :--: | :--: | :--: | --- |
| `case.view` | Y | Y | Y | Y | case history detail actions, screen-pop lookups |
| `case.view_history` | Y | Y | Y | Y | `/cms/case/history` (page-level) |
| `case.create` | Y | Y | Y | Y | `/cms/case/creation`, `/cms/case/creation_schedule_date` |
| `case.update` | Y | Y | Y | Y | case edit/save in case detail |
| `case.view_timeline` | Y | Y | Y | Y | activity timeline in case detail (`CaseDetailView.tsx:143`) |
| `case.comment` | Y | Y | Y | Y | comment/mention composer |
| `case.attach_file` | Y | Y | Y | Y | attachment section (`CaseDetailView.tsx:1279`) |
| `case.assign` | Y | – | Y | – | assignment board, assign actions, staff map layer (`CaseDetailView.tsx:162`) |
| `case.close` | Y | – | Y | – | close action inside case detail (`CaseDetailView.tsx:1331`) |
| `case.delete` | Y | – | – | – | cancel case in history |
| `dashboard.view` | Y | – | Y | – | case dashboard, `/cms/dashboard/case-summary-by-area`, `/cms/dashboard/dispatch`, `/dashboard/custom` |
| `report.view` | Y | – | Y | – | Report **menu** only — the page has no guard (L8) |
| `contact.view` | Y | Y | Y | Y | `/cc/contacts-list` |
| `contact_config.view` | Y | – | – | – | `/cc/contacts-configurations` |
| `appointment.view` | Y | Y | Y | Y | `/cc/appointment`, `/cc/appointment-types` |
| `product.view` | Y | – | Y | – | products, brands, categories, stores |
| `product_stock.view` | Y | – | Y | – | `/cms/products/stock` |
| `sparepart.view` | Y | – | Y | – | `/cms/inventory` |
| `sparepart_stock.view` | Y | – | Y | – | `/cms/inventory/stock` |
| `order.view` | Y | – | Y | – | `/cms/inventory/request` |
| `crm_dashboard.view` | Y | – | Y | – | `/cms/products/dashboard` route + topbar; the **sidebar entry is dead** (L9) |
| `crm_service.view` | Y | – | Y | – | `/cms/services` |
| `service.view` | Y | – | – | – | Service Type / Sub Type (S7b); write actions need `service.create`/`service.update` |
| `unit.view` | Y | – | – | – | Units, Properties, **Skills** (S5) |
| `unit.create`, `unit.update` | Y | – | – | – | unit create/edit form (**both** required) |
| `settings.view` | Y | – | – | – | Case Result, **Area menu**, **Area Template menu**; Case Result writes also check `settings.create`/`settings.update`/`settings.delete` (`CaseResultManagement.tsx:30-32`) |
| `area.view` | Y | – | – | – | Area and Area Template pages (L7); write actions need `area.create/update/delete` |
| `organization_settings.manage` | Y | – | – | – | Place, Device, Organization Settings |
| `form.view` | Y | – | – | – | form management |
| `form.create` | Y | – | – | – | dynamic form builder |
| `form.update` | Y | – | – | – | Form menu group visibility |
| `workflow.view` | Y | – | – | – | workflow list **and** builder page (L10) |
| `workflow.create` | Y | – | – | – | workflow builder menu entry + editing |
| `workflow.update` | Y | – | – | – | editing an existing workflow |
| `user.view` / `user.create` / `user.update` | Y | – | – | – | user list / user form (**both** create+update for the form) |
| `role.view` (+ `role.create/update/delete`) | Y | – | – | – | Role & Privilege |
| `usergroup.view` (+ `.create/.update/.delete`) | Y | – | – | – | User Group |
| `organization.view` (+ `.update`) | Y | – | – | – | Organization tree (`organization.delete` exists only in dead code — Appendix A) |
| `auditlog.view` | Y | – | – | – | Audit Log menu (also needs `entitlement.audit` at the route) |
| `package.view` | – | – | – | – | Package menu entry is a **disabled placeholder** (`SuperTopbar.tsx:481-486`) — grant nothing |
| `cc.supervision.view` | Y | – | Y | – | supervisor board (in-page check only; the route is ungated — L6) |
| `kb_dashboard.view`, `kb_category.view`, `kb_article.view`, `kb_article.mgmt.view`, `kb_file.view`, `kb_broadcast.view`, `kb_banner.view`, `kb_source.view` (+ the `.create/.update/.delete/.upload/.copy/.newversion/.changestatus` variants where the operator must write) | Y | view-only | view-only | view-only | `/kms/*`, and the Knowledge sidebar group |

Three structural rules that this table cannot express:

1. **Menu key ≠ route key.** Several surfaces need one key to *see* the menu and another to *open* the
   page (Area: `settings.view` + `area.view`; Workflow: `workflow.create` to see + `workflow.view` to
   open). Grant both.
2. **`requiredPermissions` is AND.** Where the table says "both", a role holding only one of the two
   keys sees the menu and is then denied the page.
3. **Entitlements are not permissions.** Buying a module does not grant access, and granting access
   does not unlock a module the tenant did not buy.

---

## 7. Acceptance checklist

Use a fresh browser profile (localStorage `profile` caches the tenant and role).

***Identity and package***

- [ ] Login page lists the tenant in the Organization suggestions; typing it and logging in succeeds.
- [ ] `localStorage.profile` shows the intended `organization`, a real `orgId`, a real `roleId`
      (not `d6381714-8e89-47de-9d16-859131cdc5dc`), and `permission` containing the expected keys,
      including a `kms` category if the tenant has a knowledge base.
- [ ] Organization Settings → **Subscription & Entitlements** shows the chosen plan, the SKU list and
      seat usage — this proves the fixture resolved.
- [ ] A module the tenant did not buy shows the **lock page**, not a broken page and not a 404
      (`/kms/*` for non-KB tenants is the cleanest test).

***Navigation per role***

- [ ] Each role sees exactly its menus (compare with §6): Admin all; Agent no System Config / User
      Management / CRM; Dispatcher no Form/Workflow/Config; Responder case + contact + appointment +
      KB only.
- [ ] Menu entries resolve: no click lands on the generic 404 or an "insufficient permissions" page
      for the Admin role (L7/L9/L10 list the known cases).
- [ ] A user with only `unit.view` **cannot** open `/cms/unit/create` (AND semantics still true).

***Functional***

- [ ] Organization tree lists every department/command/station with correct parents (S1).
- [ ] Each user opens and shows role, dept/command/station, groups, skills and area coverage (S4).
- [ ] Each unit opens and shows its type, source, company, dept/command/station, login user and
      properties (S6).
- [ ] Each workflow opens in the builder, publishes, and its total SLA equals the sum of its nodes (S7).
- [ ] Each case sub-type saves and renders in the tree with the intended SLA, priority label, skills,
      unit properties and workflow (S7b).
- [ ] Create Case for each sub-type: form renders → incident pin → Service Center auto-locks when the
      point falls in exactly one district polygon → case saves with the expected SLA.
- [ ] Case assignment board lists the case; assign to a unit; the unit appears in the staff map layer
      (requires `case.assign`).
- [ ] Case detail shows the timeline only with `case.view_timeline`, attachments only with
      `case.attach_file`, and close only with `case.close`.
- [ ] Contact configuration hides the fields that were disabled, including the address sub-fields.
- [ ] Knowledge Base: category → file → article publish, then map the article onto a sub-type and see
      it surface on Create Case (requires `entitlement.kb` + `kb_*` + `service.view`).
- [ ] Dashboard surfaces open with their gates: `/cms/` (case dashboard), `/cms/dashboard/dispatch`,
      `/cms/dashboard/case-summary-by-area`, `/dashboard/custom`.
- [ ] Report menu opens `/cms/report` and each report link reaches the Jasper server (P9).

---

## 8. Corrections to the source document (v3)

Each item was checked against code while writing this runbook; the code wins. v3 fixed most of v2's
errors — what follows is what is *still* wrong or newly required.

| # | Source document (v3) says | Reality (evidence) |
| --- | --- | --- |
| **C0** | Links a v2 baseline file as the origin of the tables | Still absent from the repository. v3 is a requirements document; every value in Appendix C must be re-checked against the environment it is loaded into. |
| **C1** | §1 Organization: Department → Command → Station, ids server-assigned | Correct. Add: the create DTOs carry no id at all and the levels must be created in order (`src/core/types/organization.ts:17-84`). |
| **C2** | §9 Area is Country → Province → District (correct, fixed from v2) | Correct. Add the operational reason: **district polygons** drive the Create Case Service Center auto-match; names alone leave the field manual (S9). |
| **C3** | §5 Priority: 10 labels, stored value = index inside its group | Correct. Keep the 0–9 bucketing caveat (L1) and **use one label per severity band**. |
| **C4** | §4 User Group has no "Main Category" | Correct. Its create payload is `{active, en, th}`; `description` is read-only/optional (`src/core/types/user.ts:296-327`). |
| **C5** | §13 Appointment type has no category / stay duration | Correct. The API key is `appointmentTypeId`, not `id` (`src/cms/types/appointmentType.ts:1-26`). |
| **C6** | §5 "Type Code (`typeId`)" — "business key ที่กรอกเองได้", table of 1001…1006 | **Wrong.** The case-type create form has only EN and TH; the payload is `{active, en, th}` and `typeId` is server-assigned, appearing only afterwards as the row key (`ServiceManagement.tsx:433-452,852-876`, `src/cms/types/case.ts:328-332`). The "Type Code" column cannot be entered — record those numbers in the tenant's own documentation, not in the product. |
| **C7** | §5 Sub-type: `caseSla` listed among required fields | **Wrong for the UI.** Validation for `caseSla` is commented out and a blank value saves as `"0"` (`ServiceManagement.tsx:333-336,581`). The required set is `en`, `th`, `sTypeCode`, `typeId`, `priority`, `unitPropLists`, `userSkillList`, `wfId`, `mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`. |
| **C8** | §5/§13 Service Type table re-uses "Type Code" and implies per-row control of the type code | Same as C6: only a code at **sub-type** level (`sTypeCode`) is enterable. |
| **C9** | §10 Unit list shows Company = SKYICT **and** Department = SKYICT | `compId` is a **Company** record (`GET /mdm/companies`), a different entity from `deptId` (`src/cms/types/unit.ts:87-153`, `src/cms/store/api/unitApi.ts:113-143`). Do not treat them as the same field. |
| **C10** | §10 Unit Properties include "Not Spectify" | The system stores free text, so the value is a data choice — but pick **"Not Specify"** (or one spelling) for every tenant; mixed spellings become two different properties. |
| **C11** | §11 Case Status groups: In-progress = S004–S011, S013, S015, S019 | Actual grouping: In-progress = `S004, S005, S006, S008, S010, S011, S013, S015, S019`; New = `S001, S002, S009`; Done = `S016, S012, S017`; Close `S007` / Cancel `S014` / On-Hold `S018` / Draft `S000` are hidden from the default filters (`src/cms/components/ui/status/status.tsx:11-20`). |
| **C12** | §14 Article statuses: draft → review → published (+unpublished/archived) | The enum also carries `publish`, `wait_publish`, `wait_approve`, `all`, `"-1"` (`src/kms/articles/dtos/articles.dto.ts:5-15`). Approval state is driven by `kb_article.mgmt.changestatus`. |
| **C13** | §16 (Report) lists report tables as product features | The page embeds a **JasperReports server**: URLs are relative `jasperserver/…` paths including Thai folder names, and login is a POST with `VITE_JASPER_*` credentials (`src/cms/components/report/reportConfig.json`, `openReport.ts:22-56`). A tenant's report availability is therefore a **deployment** question (P9), not a configuration step. |
| **C14** | §6 Workflow SLA table implies a fixed set of status columns (New/Assigned/Acknowledge/Inprogress/Done/Closed) | Correct as a business model, but the workflow node types are the six product ones (`start/process/dispatch/decision/sla/end`) and each node carries its own SLA; `totalSla` lives in workflow metadata (`src/cms/types/workflow.ts:18-50`). Keep the table as a worksheet, not as a screen contract. |
| **C15** | §2 role mapping: System Admin/Admin/Agent/Dispatcher/Responder | Correct for this tenant's `roleName` values. Add the gate that actually matters: only a role whose **UUID equals** `SYSTEM_ROLE` bypasses RBAC; a tenant role merely *named* `system_admin` does **not** (`src/core/utils/constants.ts:279`, `src/core/utils/authService.ts:504-518`). |
| **C16** | §3 "Dept/Command/Station" per user varies (Station 1 vs 2) | The seed assigns **one** dept/comm/stn to all 16 users (v3's own note 3 says so). If per-user stations are required, that is an extra data task — and the user form has the selects for it. |

Still correct in v3 and reused as-is: the Contact Configuration field-level enable/disable, the CRM
module inventory (product / spare part / inventory / order), the Knowledge Base lifecycle and its
approve process, the four-role intent, and the note that Priority must be recorded as a label.

---

## 9. Known limitations found while preparing this runbook

These are pre-existing, affect tenant setup or the acceptance test, and are **not** fixed here.

**L1 — Priority can be stored ambiguously.** The sub-type editor generates ten options whose values
repeat per group (`value: index`), so "Critical" and the first "High" both store `0`; readers map
`0 → Critical` and bucket the rest 0–9 (`src/cms/utils/constants.ts:245-250`,
`ServiceHierarchyView.tsx:113-124` vs `src/cms/components/function/Prioriy.tsx`). A tenant that needs
three distinct severity levels cannot express them reliably today. **Workaround:** use one label per
severity band and verify the badge on the created case actually matches the label that was picked.

**L2 — Seven of eleven entitlement features gate nothing.** Only `entitlement.kb`, `entitlement.audit`,
`entitlement.chat` and `entitlement.gis` are referenced by any gate (verified by exhaustive grep).
`entitlement.core`, `.agent.desktop`, `.bot`, `.cad`, `.channel.social`, `.kb.semantic_search`,
`.rbac.advanced` are declared, shape-validated and displayed in the subscription panel, but buying
them changes no screen. Do not promise "CAD" or "Bot" as unlockable features during a sale.

**L3 — Seat usage is a fixture value.** `seats.used` is not derived from the users you create; it
renders whatever the fixture says (`FeatureStateTable`/`SeatUsageCard` read `useEntitlements`). A
tenant with 16 users and `"used": 0` looks healthy and is wrong.

**L4 — Escalation rules have no UI path.** `settings/escalation/EscalationRulesSection.tsx` is fully
built, never imported, and not in `SETTINGS_SECTIONS` (`OrganizationSettingsManagement.tsx:21-35`);
`escalationApi.ts:30-45` has the endpoint contract. There is no screen to configure warning threshold,
target role or on/off.

**L5 — The Service Center "Try Again" resolver is a stub that always rejects.** No backend contract
exists; the button ends in `error` after a 900 ms fake call plus a 10 s cooldown
(`serviceCenterResolve.ts:1-29`, `useResolveServiceCenter.ts:14-53`). Polygon matching is the only
working mechanism.

**L6 — The CC workspace routes have no permission gate.** `/cc/softphone`, `/cc/supervision`,
`/cc/email`, `/cc/dashboard` have no route guard and the sidebar keys are commented out
(`src/core/layout/SuperSidebar.tsx:84-135`, `src/cc/App.tsx:28-39`). Any logged-in user can open them
by URL; only `cc.supervision.view` is checked *inside* the supervision board. Do not rely on these
being hidden during a demo.

**L7 — Area requires two keys.** Menu needs `settings.view`, page needs `area.view` (§5 S9). Granting
only one produces "menu visible, page denied".

**L8 — `/cms/report` has no guard at all.** Neither the route (`src/cms/App.tsx:206`) nor the page
(`src/cms/pages/Report/Report.tsx` — no permission check) enforces `report.view`; only the menu does.
Likewise `/cms/case/:caseId` has no route guard — case detail is reachable by URL, and only its
*actions* are permission-checked.

**L9 — The Product → Dashboard sidebar entry never appears.** `SuperSidebar` gates it on
`hasAnyPermission(["crm_dashboard"])` — a key with no `.view` suffix
(`src/core/layout/SuperSidebar.tsx:252-259`) — while the route and the topbar both require
`crm_dashboard.view` (`src/cms/App.tsx:267-274`, `src/core/layout/SuperTopbar.tsx:318-321`). Use the
**More → Dashboard & Analytic → Product** path; the sidebar item is dead.

**L10 — Workflow menu and page use different keys.** Menu `workflow.create`, page `workflow.view`
(§5 S7). Grant both to the builder role; a viewer role will see no menu but can open the editor by URL.

**L11 — Hard-coded tenant defaults.** Three fallbacks resolve to `"SKY-AI"`
(`tokenManager.ts:291-293`, `jwt.ts:50`, `authService.ts:127`) and the mock-user substitution swaps in
`SYSTEM_ROLE` (§2 G4). Any payload missing `organization`/`orgId`/`roleId` produces a *plausible but
wrong* session rather than an error.

**L12 — Seeding the same people into a second tenant depends on `um_users`' unique indexes, which are
not visible from this repository.** The seed now scopes its guard to `(username, orgId)`: adding a
tenant creates a **second account** for that person, and nothing is moved. Whether the database allows
that is decided by its own indexes — `UNIQUE (username)` makes the run fail loudly with
`duplicate key value violates unique constraint`; `UNIQUE (email)` does the same when the address is
reused. Those failures are the answer, not an obstacle: report them and escalate the product question
("may one person belong to two tenants?") rather than rewriting usernames or relocating accounts
between tenants. Diagnose with `db/seed/skyict/00-diagnose-users.sql`.

**L13 — Two `organizationApi` modules and one is dead.** The live module is
`src/core/store/api/organizationApi.ts` (imported by `OrganizationManagement`, tags wired, owns
`/organizations/{orgId}` plus map-settings/assignment-rules).
`src/cms/store/api/organizationApi.ts` is a near-identical copy that **no file imports**, with all
cache tags commented out. An engineer "fixing" the duplicate changes nothing.

**L14 — The legacy `AppSidebar` (non-super shell) is out of sync with routes** — e.g. its CRM group
links `/inventories` (no such route; the real one is `/inventory`). It is not rendered when the
super-app shell is active, so this only matters if the shell is switched back.

**L15 — A sub-type save can report failure after succeeding.** The KB article mapping call runs after
the sub-type write and its throw is caught by the same handler, so a mapping error shows an error toast
for a saved sub-type (`ServiceManagement.tsx:600-644`). Re-read the tree before re-saving.

**L16 — Map Settings never reads the server.** The load query is commented out and the section always
renders schema defaults; Save still PATCHes, so a saved value is written but never read back, and
`isLoading` stays `true` outside mock mode (`useOrgMapSettings.ts:54-56,68-78,112-113`). Assignment
rules have the healthy version of the same facade (`useOrgAssignmentRules.ts:56`). Do not use Map
Settings as evidence that org configuration persisted (§5 S11).

---

## 10. Open questions (owner decision required)

1. **Which package does the tenant hold?** It changes F3 and whether the case map works (F1), and
   whether any of the seven §9 L2 features are worth selling. Owner: commercial/account.
2. **Does the tenant's `system_admin` reuse `SYSTEM_ROLE` (`d6381714-…`), or get a tenant-specific
   role?** If not reused, that role needs every key in §6 granted explicitly, including the KB keys and
   the `kms` permission category. Owner: backend/platform.
3. **Is the global permission catalog already populated with every key in Appendix A?** Without it, S3
   cannot grant what the UI checks. Owner: backend/platform.
4. **`app_configs` order-workflow binding** (P7) — confirm the column, the default workflow name and who
   runs it. Owner: backend/platform. **UNVERIFIED from this repository.**
5. **When do `/organizations/{orgId}/map-settings`, `/assignment-rules` and `/escalation-rules`
   ship?** Until they do, S11 is demo-only (config lives in the browser, not the server) and L4 has no
   fix. Owner: backend/platform.
6. **Is there a backend Service Center resolver?** The "Try Again" path is a stub (L5); polygon data
   must therefore be complete before a demo. Owner: backend/platform.
7. **Will the entitlement endpoint ship before go-live?** Today the source is fixtures
   (`ENTITLEMENTS_SOURCE = "fixtures"`, `entitlementSlice.ts:14`); if `GET /tenants/{orgId}/entitlements`
   lands, F3/F4 change shape and a `GQL_MAP` entry is required under `VITE_USE_GRAPHQL="true"`
   (`entitlementSlice.ts:39-42`).
8. **Who owns the JasperReports server per environment?** Report availability is deployment, not
   tenant configuration (P9, C13). Owner: platform/ops.

---

## Appendix A — permission keys checked by this frontend (verified inventory)

Extracted from every `hasPermission` / `hasAnyPermission` / `hasAllPermissions` / `requiredPermissions`
call site. Keys appear here only if a gate reads them (commented-out checks — e.g. `workspace.*` — are
excluded on purpose, see L6).

```text
# Case
case.view  case.create  case.update  case.view_history  case.view_timeline
case.assign  case.close  case.delete  case.comment  case.attach_file

# Dashboard / report
dashboard.view  report.view

# Form / workflow
form.view  form.create  form.update
workflow.view  workflow.create  workflow.update  workflow.delete

# User administration
user.view  user.create  user.update  user.delete  user.reset_password
role.view  role.create  role.update  role.delete
usergroup.view  usergroup.create  usergroup.update  usergroup.delete
organization.view  organization.update
auditlog.view

# System configuration
service.view  service.create  service.update  service.delete
unit.view  unit.create  unit.update  unit.delete
settings.view  settings.create  settings.update  settings.delete
area.view  area.create  area.update  area.delete
organization_settings.manage
package.view                        # disabled placeholder menu — grant nothing

# CRM
product.view  product_stock.view  sparepart.view  sparepart_stock.view
order.view  order.create  order.update  order.cancel  order.complete  order.delete
crm_dashboard.view  crm_service.view

# Contact / appointment / CC
contact.view  contact_config.view
appointment.view  appointment.create  appointment.update  appointment.delete
cc.supervision.view

# Knowledge base
kb_dashboard.view
kb_category.{view,create,update,delete}
kb_article.view  kb_article.comment
kb_article.mgmt.{view,create,update,delete,copy,newversion,changestatus}
kb_file.{view,create,upload,delete}
kb_broadcast.{view,create,update,delete}
kb_banner.{view,create,delete}
kb_source.{view,create,update,delete}
```

Entitlement features (not permissions — never put these in a role):
`entitlement.core`, `entitlement.agent.desktop`, `entitlement.kb`, `entitlement.kb.semantic_search`,
`entitlement.chat`, `entitlement.bot`, `entitlement.gis`, `entitlement.cad`,
`entitlement.channel.social`, `entitlement.audit`, `entitlement.rbac.advanced`
(`src/core/types/entitlement.ts:29-40`). Which of them actually gate a screen: §2 G2, §9 L2.

**Keys that appear in the codebase but gate nothing live** — do not spend catalog entries on them
without a code change: `report.export`, `report.generate`, `report.schedule`, `report.delete`,
`organization.delete` (only the dead legacy `AppSidebar.tsx:135` and the mock permission list in
`authService.ts:38-39` reference them; the live report page checks `report.view` only — L8/L14), and
the whole `workspace.*` family (`workspace.softphone`, `.dashboard`, `.email`, `.chat.lobby`,
`.chat.history`), which is commented out in the sidebar (L6).

## Appendix B — evidence index

| Area | Files read |
| --- | --- |
| Tenant identity & entitlements | `src/core/mocks/entitlements/{index.ts,skyict.json,default.json,entitlementFixtures.test.ts}`, `src/core/types/entitlement.ts`, `src/core/store/slices/entitlementSlice.ts`, `src/core/hooks/{useEntitlements.ts,useEntitlementsBootstrap.ts}`, `src/core/components/entitlements/EntitlementGate.tsx`, `src/core/config/entitlements/{packages.ts,featureCatalog.ts}` |
| Auth & RBAC | `src/core/providers/AuthProvider.tsx`, `src/core/utils/{authService.ts,tokenManager.ts,jwt.ts,permissionManager.ts,constants.ts}`, `src/core/components/auth/{ProtectedRoute.tsx,LoginForm.tsx}`, `src/core/hooks/{usePermissions.ts,useIsSystemAdmin.ts}`, `src/core/components/form/form-elements/Autocomplete.tsx` |
| Navigation & routes | `src/App.tsx`, `src/cms/App.tsx`, `src/cc/App.tsx`, `src/kms/App.tsx`, `src/core/layout/{SuperSidebar.tsx,SuperTopbar.tsx}`, `src/cms/layout/AppSidebar.tsx` |
| Master data models | `src/core/types/{organization.ts,user.ts,role.ts,entitlement.ts}`, `src/cms/types/{area.ts,case.ts,caseResult.ts,unit.ts,skill.ts,workflow.ts,appointmentType.ts,brand.ts,category.ts,store.ts,place.ts,device.ts,deviceIoT.tsx,customer.ts,escalation.ts,dispatch.ts}` |
| Admin screens read | `src/cms/pages/Admin/{AreaManagement,AreaTemplateManagement,AreaTemplateDetail,SkillManagement,PropertyManagement,UnitManagement,ServiceManagement,DeviceManagement,PlaceManagement,CaseResultManagement,OrganizationSettingsManagement,UnitForm}.tsx`, `src/core/pages/Admin/{OrganizationManagement,UserGroupManagement,RolePrivilegeManagement,UserManagement,UserForm}.tsx`, `src/cms/components/admin/system-configuration/**` (service form, settings sections + hooks, unit form) |
| APIs | `src/core/store/api/{userApi.ts,organizationApi.ts}`, `src/cms/store/api/{unitApi.ts,serviceApi.ts,caseResultApi.ts,skillApi.ts,formApi.ts,area.ts,escalationApi.ts}`, `src/core/store/api/graphql/{organizationQueries.ts,roleQueries.ts,caseTypeQueries.ts}`, `src/core/utils/gqlMapper.ts` |
| Map / Service Center | `src/cms/components/case/createCase/map/AddressMap.tsx`, `src/cms/components/case/formFields/{serviceCenterMatch.ts,useServiceCenterMatch.ts,serviceCenterResolve.ts,useResolveServiceCenter.ts}`, `src/core/config/api.ts`, `.env.staging` (variable names only) |
| Reports | `src/cms/pages/Report/Report.tsx`, `src/cms/components/report/{reportConfig.json,openReport.ts}` |
| Knowledge base | `src/kms/common/utils/enumHelper.ts`, `src/kms/App.tsx`, `src/kms/articles/dtos/articles.dto.ts`, `src/kms/components/casetype-map-articles/**`, in-page permission checks across `src/kms/*/index.tsx` |
| Seeds | `db/seed/skyict/{00-diagnose-users.sql,01-sec_org-structure.sql,02-um_users.sql,api-payloads/*}` |
| Source documents | `docs/SKYICT-Tenant-Onboarding-Runbook.md` (v0.1), `docs/SKYICT-Service-Center-Project-Prototype-v3.md`, `docs/templates/Tenant-Onboarding-Template.md`, `CLAUDE.md` |

## Appendix C — SKYICT configuration data set (worked example)

Every table below is **data to enter**, not a claim about the product. Values come from
`docs/SKYICT-Service-Center-Project-Prototype-v3.md` and were checked against the field lists in Part C;
where the product cannot store a value it is marked. A new tenant copies this appendix and replaces
every row in the **worksheet** spirit of
[`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md) §7.

### C.1 Organization (S1) — 1 department, 6 commands, 7 stations

| # | Department (EN / TH) | Command (EN / TH) | Station (EN / TH) | Active |
| --- | --- | --- | --- | --- |
| 1 | SKYICT / SKYICT | Center Zone / โซนกลาง | Station 1 / สถานี 1 | Y |
| 2 | SKYICT / SKYICT | Center Zone / โซนกลาง | Station 2 / สถานี 2 | Y |
| 3 | SKYICT / SKYICT | North Zone / โซนเหนือ | Station 3 / สถานี 3 | Y |
| 4 | SKYICT / SKYICT | Northeast Zone / โซนอีสาน | Station 4 / สถานี 4 | Y |
| 5 | SKYICT / SKYICT | South Zone / โซนใต้ | Station 5 / สถานี 5 | Y |
| 6 | SKYICT / SKYICT | East Zone / โซนตะวันออก | Station 6 / สถานี 6 | Y |
| 7 | SKYICT / SKYICT | West Zone / โซนตะวันตก | Station 7 / สถานี 7 | Y |

The current seed duplicates the English name into `th` (`use_en_for_th = true`,
`01-sec_org-structure.sql:64-69`); fill real Thai names before a Thai-language demo.

### C.2 User groups (S2)

| Group EN | Group TH | Purpose |
| --- | --- | --- |
| General | ทั่วไป | Default group (expected to be created with the tenant) |
| Dispatch Group 1 | กลุ่มกระจายงาน 1 | Dispatch node — shift 1 |
| Dispatch Group 2 | กลุ่มกระจายงาน 2 | Dispatch node — shift 2 / standby |
| Order Approval | อนุมัติคำสั่งซื้อ | Order PIC / spare-part approval |
| Technical | สายเทคนิค | KB audience |
| Agent | นักโทรฯ | KB audience |

### C.3 Users (S4) — 16 accounts, 5 roles

| # | Username | Name | Email | Emp ID | `roleName` | Dept / Command / Station |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | watee.tha | Watee Thaiprasonk | <watee.tha@skyai.co.th> | AI680013 | `system_admin` | SKYICT / Center Zone / Station 1 |
| 2 | apiwat.rod | Apiwat Rodchuajeen | <apiwat.rod@skyai.co.th> | AI680018 | `system_admin` | SKYICT / Center Zone / Station 1 |
| 3 | wisarud.tec | Wisarud Techa | <wisarud.tec@skyai.co.th> | AI680021 | `system_admin` | SKYICT / Center Zone / Station 1 |
| 4 | agent1 | Agent 1 | <agent1@skyict.co.th> | SK699001 | `agent` | SKYICT / Center Zone / Station 1 |
| 5 | agent2 | Agent 2 | <agent2@skyict.co.th> | SK699002 | `agent` | SKYICT / Center Zone / Station 1 |
| 6 | responder1 | Responder 1 | <responder1@skyict.co.th> | SK699003 | `responder` | SKYICT / Center Zone / Station 1 |
| 7 | responder2 | Responder 2 | <responder2@skyict.co.th> | SK699004 | `responder` | SKYICT / Center Zone / Station 2 |
| 8 | generalservice | General Service 1 | <generalservice1@skyict.co.th> | SK699005 | `responder` | SKYICT / Center Zone / Station 1 |
| 9 | emergencyservice1 | Emergency Service 1 | <emergencyservice1@skyict.co.th> | SK699006 | `responder` | SKYICT / Center Zone / Station 1 |
| 10 | emergencyservice2 | Emergency Service 2 | <emergencyservice2@skyict.co.th> | SK699007 | `responder` | SKYICT / Center Zone / Station 2 |
| 11 | dispatcher1 | Dispatcher 1 | <dispatcher1@skyict.co.th> | SK699008 | `dispatcher` | SKYICT / Center Zone / Station 1 |
| 12 | dispatcher2 | Dispatcher 2 | <dispatcher2@skyict.co.th> | SK699009 | `dispatcher` | SKYICT / Center Zone / Station 1 |
| 13 | sompith.kit | Sompith Kitcharoen | <sompith.kit@skyict.co.th> | SK690394 | `admin` | SKYICT / Center Zone / Station 1 |
| 14 | chutikan.kon | Chutikan Kongton | <chutikan.kon@skyict.co.th> | SK690375 | `admin` | SKYICT / Center Zone / Station 1 |
| 15 | chatchanan.dul | Chatchanan Dulyakometh | <chatchanan.dul@skyict.co.th> | SK680123 | `admin` | SKYICT / Center Zone / Station 1 |
| 16 | chamrat.mee | Chamrat Meedam | <chamrat@skyict.co.th> | SK63035 | `admin` | SKYICT / Center Zone / Station 1 |

Two users in the source list are struck through (not seeded). The seed currently stamps the same
dept/command/station on all 16 (C16) — rows 7 and 10 are the ones that should differ if per-user
stations are adopted.

### C.4 Skills (S5)

| Skill EN | Skill TH | Example work | Sub-types that require it |
| --- | --- | --- | --- |
| Investigation | ตรวจสอบ | trace a dropped connection, read logs | 3001, 3901 |
| Repair | ซ่อมแซม | replace a screen, fix a cut LAN cable | 3002 |
| Service | บริการ | install software, stage equipment | 3003 |
| Maintenance | บำรุงรักษา | scheduled checks, backup | 3101 |
| General Support | สนับสนุนทั่วไป | password reset, how-to | 3003 |
| Outsource | ส่งต่อภายนอก | warranty claim, coordinate ISP | 3201 |

### C.5 Unit properties and units (S6)

Properties (8): `Not Specify`, `General Service`, `Emergency Response`, `Telephony`, `Network`,
`Hardware`, `Software`, `IT Service` — `propId` is server-generated, never typed.

| Unit ID | Unit name | Type | Source | Company | Dept / Command / Station | Login user |
| --- | --- | --- | --- | --- | --- | --- |
| UNIT-001 | UNIT-001 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 1 | responder1 |
| UNIT-002 | UNIT-002 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 2 | responder2 |
| UNIT-003 | UNIT-003 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 1 | generalservice |
| UNIT-004 | UNIT-004 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 1 | emergencyservice1 |
| UNIT-005 | UNIT-005 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 2 | emergencyservice2 |
| UNIT-006 | UNIT-006 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 1 | — |
| UNIT-007 | UNIT-007 | Staff | Internal | SKYICT | SKYICT / Center Zone / Station 2 | — |

`Unit type = Staff` and `Unit source = Internal/External` are **read-only catalogues** (P5).

### C.6 Case types, sub-types and workflows (S7, S7b)

| # | Type (EN / TH) | `sTypeCode` | Sub-type (EN / TH) | Priority label | Skill | Workflow | SLA (min) | Device type | Work order |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | IT Service / บริการ IT | 3001 | Telephony Hardware & IT Service / อุปกรณ์โทรศัพท์และระบบ IT | High | Investigation | SKYICT-Investigation Flow | 64 | TEL / Telephony Hardware | IT Service |
| 2 | Repair / ซ่อมแซม | 3002 | Hardware Repair / ซ่อมแซมฮาร์ดแวร์ | High | Repair | SKYICT-Repair Flow | 109 | HW / IT Hardware | Repair |
| 3 | Service / บริการทั่วไป | 3003 | General IT Service / บริการ IT ทั่วไป | High | Service | SKYICT-Service Flow | 79 | IT / General IT | Service |
| 4 | Maintenance / ซ่อมบำรุง | 3101 | Preventive Maintenance / บำรุงรักษาเชิงป้องกัน | Medium | Maintenance | SKYICT-Maintenance Flow | 269 | PM / Preventive Maintenance | Maintenance |
| 5 | Outsourced / ส่งต่อภายนอก | 3201 | Outsourced Service / งานส่งต่อหน่วยงานภายนอก | Medium | Outsource | SKYICT-Outsourced Flow | 199 | OUT / Outsourced | Outsource |
| 6 | Emergency / แจ้งเหตุฉุกเฉิน | 3901 | Emergency Outage / เหตุขัดข้องวิกฤต | Critical | Investigation | SKYICT-Investigation Flow | 64 | EMG / Emergency | Emergency |

The `typeId` values `1001…1006` in the source document are **not enterable** (C6) — only EN/TH.

| # | Workflow | New | Assigned | Acknowledge | In-progress | Done | Closed | Total SLA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SKYICT-Investigation Flow | 1 | 3 | 5 | 45 | 5 | 5 | 64 |
| 2 | SKYICT-Repair Flow | 1 | 3 | 5 | 90 | 5 | 5 | 109 |
| 3 | SKYICT-Service Flow | 1 | 3 | 5 | 60 | 5 | 5 | 79 |
| 4 | SKYICT-Maintenance Flow | 1 | 3 | 10 | 240 | 10 | 5 | 269 |
| 5 | SKYICT-Outsourced Flow | 1 | 3 | 5 | 180 | 5 | 5 | 199 |

Check before saving each sub-type: `caseSla` = the workflow's total (C7), and the priority is one
**label** per band (L1). Orders workflow SLA (Create Order 1 → Complete 5, total 3,059) belongs to the
backend `app_configs` step (P7), not to this screen.

### C.7 Dynamic forms (S8)

| Form | Sub-type it must resolve for | Minimum fields |
| --- | --- | --- |
| Telephony Hardware & IT Service Form | 3001 | reporter name (req), callback mobile, building/floor/unit (req), device (req, multi), model, serial, symptom (req, multi), notes, photo |
| Hardware Repair Form | 3002 | device to repair (req, multi), serial/asset tag (req), symptom (req, multi), parts needed (checkbox → S12), notes, photo |
| Emergency Outage Form | 3901 | affected system (req), occurrence time (req), blast radius (req), on-site callback (req), initial state (req, select) |

### C.8 Area (S9) — THAILAND / BANGKOK / service districts

| `countryId` | Country TH / EN | `provId` | Province TH / EN | `distId` | District TH / EN |
| --- | --- | --- | --- | --- | --- |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 01 | พระนคร / PHRA NAKHON |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 02 | ดุสิต / DUSIT |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 03 | หนองจอก / NONG CHOK |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 04 | บางรัก / BANG RAK |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 05 | บางเขน / BANG KHEN |
| TH | ไทย / THAILAND | 10 | กรุงเทพมหานคร / BANGKOK | 06 | บางกะปิ / BANG KAPI |

`countryId`/`provId`/`distId` here are **dataset codes**, not generated ids — they are part of the
payload (`CountryCreateData`/`AreaProvinceCreateData`/`AreaDistrictCreateData`), unlike
`deptId`/`commId`/`stnId`. Choose districts that cover the service area **and draw their polygons**,
otherwise Create Case never auto-resolves a Service Center (S9).

### C.9 Contact configuration (S13)

| Field | Show | Field | Show |
| --- | --- | --- | --- |
| displayName | Y | photo | Y |
| title | N | email | Y |
| firstName | Y | mobileNo | Y |
| middleName | N | address (home) | Y |
| lastName | Y | currentAddress | Y |
| citizenId | N | userType | Y |
| dob | N | note | Y |
| blood | N | languagePreference | N |
| gender | N | contractPreference | N |
| social (LINE/FB/etc.) | Y | dynamic form | Y |

### C.10 CRM master data (S12)

| Brand EN / TH | `type` | Category EN / TH | Key items |
| --- | --- | --- | --- |
| Grandstream / Grandstream | Product | Telephony / ระบบโทรศัพท์ | IP Phone (P-0001, ฿3,500, 24 mo), VoIP Gateway (P-0002, ฿15,900, 24 mo) |
| Cisco / Cisco | Product | Network / เครือข่าย | Network Switch (P-0003, ฿12,000, 36 mo), Access Point (P-0004, ฿8,500, 36 mo) |
| Avaya / Avaya | Product | Telephony / ระบบโทรศัพท์ | PBX Server (P-0005, ฿120,000, 36 mo) |

Spare parts (same `type` convention, separate items): Phone Cable RJ11, IP Phone Power Adapter,
SFP Transceiver, CAT6 Cable, HDMI Cable.

Stores: `HQ / ร้านค้าสำนักงานใหญ่`, `Store 1 / คลังสินค้า 1`, `Store 2 / คลังสินค้า 2`
(`discount`, `active` only — no address, C-class limitation per §8).

### C.11 Appointment types and knowledge base (S13)

Appointment types: `General / ทั่วไป`, `Consult / ปรึกษา`, `Product Advise / แนะนำสินค้า`
(name + active only).

KB categories: Operations / การแก้ไขปัญหา (level 0) → Procedures / ขั้นตอนการตรวจสอบ Server (1) →
No Audio Troubleshooting (2); User Manual / คู่มือใช้งาน (1); Emergency Procedures / การแจ้งเหตุฉุกเฉิน (1).

KB files: SKYICT (root) → Document, Training, User Manual, Emergency Contact List (1) → HandOver (2).

KB articles (3 to prove the lifecycle): *No Audio on IP Phone Troubleshooting* (→ Procedures, Draft),
*Replacing LAN Cable & SFP Module* (→ Operations, Review), *PBX Quick Start Guide*
(→ User Manual, file `User Manual`, Published). After publishing, map article 1 and 3 onto sub-types
3001 / 3901 in the sub-type form (S7b) so they surface on Create Case.

### C.12 Case results (close reasons)

`Work Completed / ปิดงานเรียบร้อย`, `Resolved Remote / แก้ปัญหาทางไกล`,
`Customer Cancelled / ลูกค้ายกเลิก`, `Transferred to Vendor / ส่งต่อผู้ขาย`,
`Duplicate Case / เคสซ้ำ` — `en`, `th`, `active` only; `resId` is generated. Case **statuses**
(S000–S019) are backend-owned and read-only (P5).
