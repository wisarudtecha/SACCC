# Tenant Onboarding — Document Template

> **How to use this file.** Copy it to `docs/<TENANT>-tenant-onboarding.md`, then replace every
> `<PLACEHOLDER>`. Delete this block and every `> FILL:` hint before the document is issued.
> Sections marked **[FIXED]** describe how the product works and must **not** be edited per tenant
> (if one stops being true, that is a product change — fix this template in the same commit).
> Sections marked **[FILL]** are tenant-specific data.
>
> **คำแนะนำภาษาไทย (สำหรับผู้จัดทำ):** คัดลอกไฟล์นี้เป็น `docs/<TENANT>-tenant-onboarding.md`
> แล้วแทนที่ทุก `<PLACEHOLDER>` — หัวข้อที่กำกับ **[FIXED]** ห้ามแก้ราย tenant (ถ้าไม่จริงแล้ว
> แปลว่าผลิตภัณฑ์เปลี่ยน ต้องแก้ template พร้อมกัน) ส่วน **[FILL]** คือข้อมูลของลูกค้ารายนั้น
> ทุกช่องในเอกสารนี้ต้องอ้างอิงได้ว่า "อ่านมาจากไฟล์ไหน บรรทัดไหน" — ดู §11 กติกาการอ้างอิงหลักฐาน
>
> **Worked example:** [`../SKYICT-Tenant-Onboarding-Runbook.md`](../SKYICT-Tenant-Onboarding-Runbook.md)
> — a completed instance of this template, useful for judging how much detail each section expects.
>
> **Scaling to the engagement.** This template is written for a full onboarding. For a
> demo-scoped onboarding you may mark steps/worksheets "deferred" — but each deferral must be
> recorded with a reason in §5 or §9. A silently skipped worksheet is indistinguishable from a
> forgotten one.

---

## 0. Document control

| Field | Value |
|---|---|
| Tenant name (display) | `<TENANT_NAME>` |
| Organization key used at login | `<ORG_KEY>` — must match what the BFF returns in `user.organization` |
| Environment(s) covered | `<DEV / QA / SIT / STAGING / PROD>` |
| Package tier | `<essential / professional / enterprise>` |
| Document version / status | `v0.1 / DRAFT` → `v1.0 / APPROVED` |
| Author / reviewers | `<NAME (role)>` |
| Created / last updated | `<YYYY-MM-DD>` / `<YYYY-MM-DD>` |
| Target go-live | `<YYYY-MM-DD>` |
| Source requirement document | `<path or ticket>` |

**Change log**

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | `<YYYY-MM-DD>` | `<NAME>` | Initial draft |

---

## 1. Tenant scope **[FILL]**

> FILL: keep this short. It exists so the configuration steps in §5 have a business reason, and so
> reviewers can judge whether the master data is complete. Do not restate the product brochure.

| Item | Value |
|---|---|
| Business / customer | `<CUSTOMER>` |
| Industry / operating model | `<e.g. field service, contact centre, utilities…>` |
| Modules in scope | `<try: Case, CRM, Contact, Workflow, Forms, Config, Report, Knowledge, Chat, GIS…>` |
| Modules explicitly **out** of scope | `<…>` |
| Languages required in master data | `<EN / TH / other>` |
| Go-live demo vs production | `<DEMO / PRODUCTION>` |
| Success definition | `<one sentence>` |

**Key users**

| Role in project | Name | Responsibility |
|---|---|---|
| Business owner (`<CUSTOMER>`) | `<NAME>` | signs off master data |
| Backend/platform owner | `<NAME>` | prerequisites in §3 |
| Frontend owner | `<NAME>` | §4 |
| Operations / demo owner | `<NAME>` | runs §5 in the environment |

---

## 2. Tenant identity contract **[FIXED]** + **[FILL]** values

The product has **no tenant-creation screen or API**; a tenant exists once its organization records
and users exist in the backend and the login response carries the fields below. Fill the right-hand
column for this tenant.

| Field | Product behaviour if it is wrong | Value for this tenant |
|---|---|---|
| `user.organization` (string) | Entitlement lookup falls through to the `default` fixture, so the tenant silently gets the baseline package | `<ORG_KEY>` |
| `user.orgId` (UUID) | App bootstrap replaces the profile with a demo user (wrong tenant, wrong permissions) | `<UUID>` |
| `user.roleId` (UUID) | Same replacement as above | `<UUID>` |
| `user.permission` (`Record<category, string[]>`) | Menus/route guards deny everything not listed; the knowledge-base group additionally needs a `kms` category key to exist | `<filled by BE>` |
| Admin role identity | **There is no admin bypass in the main navigation.** Route guards only bypass for the hardcoded system-role UUID; the sidebar and topbar never bypass | `<reuse system role / tenant-specific role>` |

> WHY: `useEntitlementsBootstrap`, `entitlementSlice` and `AuthProvider` read these fields directly.
> Cite the exact lines in §11 evidence when this document is filled in.

**Two independent gates — do not conflate them**

| Gate | Answers | Where it comes from | Blocking effect |
|---|---|---|---|
| RBAC (`module.action` ids, e.g. `case.assign`) | "may this **user** do X" | backend role/permission data | menu hidden, route denied |
| Entitlements (`entitlement.*` ids, e.g. `entitlement.kb`) | "did this **tenant** buy X" | entitlement source (see §4) | route renders a lock page instead of the module |
| System role | "is this the platform admin role" | hardcoded UUID comparison | bypasses RBAC on routes, **never** bypasses entitlements |

---

## 3. Backend / platform prerequisites **[FILL]**

> FILL: one row per prerequisite. "Frontend depends on" must name the screen or field that breaks —
> not a general statement. Anything the backend team cannot confirm today goes to §10 as an open
> question, **not** into this table as an assumption.

| # | Prerequisite | Owner | Due | Status | Frontend depends on (screen/field) |
|---|---|---|---|---|---|
| P1 | Tenant + organization records created; `orgId` issued | `<BE>` | `<date>` | `<Not started / In progress / Done / Blocked>` | §2 identity contract |
| P2 | Global permission catalog contains every id the UI checks (§Appendix B) | `<BE>` | `<date>` | | Role & Privilege cannot grant a missing id → feature stays invisible |
| P3 | Roles created + `role_permission` rows assigned (§6) | `<BE>` / `<Ops>` | `<date>` | | all gated routes |
| P4 | Users created with the required fields (§7.5) | `<BE>` | `<date>` | | login, assignment, unit ownership |
| P5 | Master data with no create UI seeded: `<e.g. case status list, unit types, unit sources, unit statuses>` | `<BE>` | `<date>` | | New/Edit forms show empty selects |
| P6 | `<tenant-scoped configuration that lives in the DB, e.g. default order workflow binding>` | `<BE>` | `<date>` | | `<screen>` — mark **UNVERIFIED** if it cannot be traced to code |
| P7 | `<environment feature flags, e.g. mock-API flag, GraphQL flag>` confirmed for this environment | `<Ops>` | `<date>` | | a mock flag can hide a mis-provisioned tenant |

---

## 4. Frontend change **[FIXED pattern]** + **[FILL] values**

> FIXED: adding a tenant requires exactly one frontend change — registering its entitlement data —
> and it is small and self-contained. If the entitlement source has moved to an API by the time this
> document is used, replace F2 with the API registration step and record the change in §9.

**F1 — Confirm package tier.** Package determines which features can ever unlock. State the
tier→feature mapping from the product's package catalog (cite it), and list the consequences the
customer will actually notice.

| Tier | Included SKUs | Unlocks | Customer-visible consequence |
|---|---|---|---|
| `<essential>` | `<SKUs>` | `<features>` | `<…>` |
| `<professional>` | `<SKUs>` | `<features>` | `<…>` |
| `<enterprise>` | `<SKUs>` | `<features>` | `<…>` |

Chosen for this tenant: **`<tier>`** because `<reason>`. Approved by `<NAME>` on `<date>`.

**F2 — Add the entitlement record for `<ORG_KEY>`**

| Item | Value |
|---|---|
| File to create | `src/core/mocks/entitlements/<org_key_lowercase>.json` |
| Registry to edit | `src/core/mocks/entitlements/index.ts` → `ENTITLEMENT_FIXTURES` |
| Plan | `<tier>` |
| SKUs | `<list>` |
| Features | `<list — must be consistent with the plan's SKUs + tier extras>` |
| Limits | `<maxAgents, maxStorageGB, maxCasesPerMonth, maxAPICallsPerDay>` |
| Seats | `<used / max>` — use the signed commercial values, not placeholders |
| Validity | `<renewedAt / expiresAt>` |
| Tests to extend | `src/core/mocks/entitlements/entitlementFixtures.test.ts` |

Rules that cost time when missed:

- The feature **array is what gates**; it is not recomputed from SKUs at load time. Keep the two
  consistent or the record will behave contrary to the plan.
- The record is validated by a runtime shape guard; a missing limit or seat field makes it fall back
  to the default package **silently**.
- Do not rename or delete the default record — it is the fallback for unknown organizations.
- Registering the record is also what makes `<ORG_KEY>` appear in the login organization dropdown.

**F3 — Verify.** `pnpm test` and `pnpm build`. Then log in as `<ORG_KEY>` and confirm the
subscription panel in organization settings shows the chosen plan, SKUs and seats.

---

## 5. Configuration runbook **[FILL status, FIXED order]**

> FIXED: the order below is a dependency chain, not a preference — later steps read data created by
> earlier ones. Fill Owner/Status/Target and tick Definition of Done.
> Each step's "Where" is a real screen; each "Gate" is a real permission id. If a gate here
> disagrees with the code, the code wins — record it in §9.

| # | Step | Where (route) | Gate(s) | Owner | Status | Definition of Done |
|---|---|---|---|---|---|---|
| S1 | Organization structure: department → command → station | `/organization` | `organization.view` | | | all rows listed in the hierarchy view, correct parent-child links |
| S2 | User groups | `/user-group` | `usergroup.view` | | | every group referenced by a workflow exists; membership set |
| S3 | Roles & permissions | `/role-privilege` | `role.view` | | | §6 matrix granted; a test login per role shows exactly the intended menus |
| S4 | Users | `/user`, `/user/create` | `user.view`; form needs `user.create` **and** `user.update` | | | each user has role + org unit (+ groups); can log in |
| S5 | Skills | `<skill route>` | `<gate>` | | | list matches §7.4 |
| S6 | Properties / unit types / unit sources / units | `<routes>` | `<gates>` | | | units resolve their type, source, org unit and properties |
| S7 | Workflows (+ per-status SLA) | `<workflow routes>` | `<gates>` | | | each workflow publishes with total SLA = §7.3 sum |
| S7b | Case type / sub-type (SLA, priority, skills, unit properties, workflow) | `<service route>` | `<gate>` | | | each sub-type saves and renders in the tree with the intended SLA |
| S8 | Dynamic forms + binding to sub-types | `<form routes>` | `<gates>` | | | creating a case for each sub-type renders its form |
| S9 | Area hierarchy + (optional) area templates | `<area routes>` | menu and page gates may differ — grant both | | | districts listed; boundary drawn/imported where required |
| S10 | Places / devices (map objects) | `<routes>` | `<gate>` | | | layers populate on the case map |
| S11 | Organization settings (map, assignment rules, `<other sections>`) | `<settings route>` | `<gate>` + `<entitlement gate>` | | | settings save and reload unchanged |
| S12 | CRM master data (brand, category, product/spare part, store, stock) | `<routes>` | `<gates>` | | | a product can be added to a case/order |
| S13 | Contacts (field configuration), appointments, knowledge base | `<routes>` | `<gates>` + `<entitlement gate>` | | | configured fields hidden/shown as intended; one article published |
| S14 | Acceptance pass | — | — | | | §8 fully ticked |

**Per-step template** (copy into any step that needs more than the table row)

```text
S<n> — <step name>
Owner:            <name / role>
Target date:      <YYYY-MM-DD>
Where:            <menu path> → <route>
Gate(s):          <permission id>[, <permission id>]
Entitlement:      <entitlement id, or "n/a">
Inputs:           <worksheet section(s) in §7, or "none">
Fields:           <exact field names, verified against the model type>
Behaviour notes:  <ordering constraints, read-only fields, known limitations>
Definition of done:
  - <observable check 1>
  - <observable check 2>
Notes / blockers: <link to §10 item>
```

---

## 6. Role → permission matrix **[FILL]**

> FILL: copy the product's verified permission inventory (§Appendix B) into the first column, then
> decide Y/N per role. Keep the "Gates" column — it is what makes the matrix reviewable.
> Delete rows for packages this tenant did not buy, but **keep** them if a reviewer needs to see what
> was deliberately excluded.

| Permission id | `<ROLE_1>` | `<ROLE_2>` | `<ROLE_3>` | `<ROLE_4>` | Which screen(s) it gates |
|---|:--:|:--:|:--:|:--:|---|
| `<key>` | `<Y/N>` | | | | `<route / menu label>` |

**Rules to state explicitly in every filled document**

1. `requiredPermissions` on a route is **AND**: a role must hold every id listed, not any of them.
2. A menu id and a page id can differ; where they do, grant both.
3. A role that holds a menu id but not the page id sees the menu and is then denied the page — that
   looks like a bug to the customer, so verify by clicking, not by reading the matrix.
4. Entitlements are not permissions: buying a module does not grant access, and granting access does
   not unlock a module the tenant did not buy.

---

## 7. Data collection worksheets **[FILL]**

> FILL: these are the intake forms. Collect them from the customer, then execute §5. Every worksheet
> has a "source of truth" note — if a value is not in a verified source, mark it and ask.

### 7.1 Organization levels

| # | Level 1 `<department>` EN / TH | Level 2 `<command>` EN / TH | Level 3 `<station>` EN / TH | Active |
|---|---|---|---|---|
| 1 | `<…>` | `<…>` | `<…>` | Y |

Source of truth: `<email / spreadsheet / meeting minute, dated>`. Note the product's level count and
whether each level is mandatory before accepting the sheet.

### 7.2 User groups

| # | Group name EN | Group name TH | Purpose (which workflow nodes use it) | Members |
|---|---|---|---|---|
| 1 | `<…>` | `<…>` | `<…>` | `<usernames>` |

Note: group ids are server-generated; the document records names only.

### 7.3 Workflows and SLA

| # | Workflow name | Purpose | Status 1 (min) | Status 2 (min) | … | Total SLA (min) | Assigned group per node |
|---|---|---|---|---|---|---|---|
| 1 | `<…>` | | | | | | |

Check: total = sum of per-status minutes. Record the status **names as the backend defines them**,
not the customer's synonyms.

### 7.4 Skills

| # | Skill EN | Skill TH | Definition | Example work | Active |
|---|---|---|---|---|---|
| 1 | | | | | Y |

### 7.5 Users

| # | Username | Title | First name | Last name | Email | Employee id | Mobile | Role | Department | Command | Station | Groups | Unit (if any) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | | | |

Check per row: role exists (§6), org unit exists (§7.1), groups exist (§7.2).

### 7.6 Units

| # | Unit id | Unit name | Type | Source | Login username | Department | Command | Station | Properties |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | |

Note: unit type and unit source are **not creatable in the UI** — confirm with the backend that the
required values exist before this sheet is executed.

### 7.7 Case types and sub-types

| # | Type id | Type EN | Type TH | Sub-type code | Sub-type EN | Sub-type TH | Workflow | SLA (min) | Priority label | Skills | Unit properties | Form |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | | |

Check: every workflow / skill / unit property / form named here exists in the earlier steps.
For the priority column, record the **label the customer chose from the product's list**, not a
numeric level — the stored value cannot always represent a numeric scale (see §Appendix A).

### 7.8 Area hierarchy

| # | Level 1 `<country>` | Level 2 `<province>` | Level 3 `<district>` | Boundary needed? | Data source |
|---|---|---|---|---|---|
| 1 | | | | `<Y/N>` | `<drawn / imported / none>` |

### 7.9 CRM master data

| # | Brand EN/TH | Category EN/TH | Type (product / spare part) | Item code | Item EN/TH | Price | Warranty | Belongs to (spare parts) |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |

| # | Store EN/TH | Discount | Purpose |
|---|---|---|---|
| 1 | | | |

### 7.10 Contact configuration and appointments

| Contact field | Display to agents? | Mandatory? | Note |
|---|:--:|:--:|---|
| `<field name>` | `<Y/N>` | `<Y/N>` | |

| # | Appointment type EN | Appointment type TH | Active |
|---|---|---|---|
| 1 | | | |

### 7.11 Knowledge base

| # | Category EN/TH | Parent category | Level |
|---|---|---|---|
| 1 | | | |

| # | Folder EN/TH | Parent folder | Level |
|---|---|---|---|
| 1 | | | |

| # | Article EN/TH | Category | Keywords | Files | Target status |
|---|---|---|---|---|---|
| 1 | | | | | |

Plus, if in scope: banners, broadcasts, sources.

---

## 8. Acceptance checklist **[FILL tenant-specific expectations]**

> FILL: every line must be observable by a person in the UI, and must name the role used for the
> check. Do not accept "the API returns 200" as evidence for a screen.

**Identity and package**

- [ ] Login accepts `<ORG_KEY>` and the organization appears in the login suggestions.
- [ ] Stored profile shows the intended `organization`, a real `orgId`, a real `roleId`, and the
      expected permission ids.
- [ ] Organization settings → subscription shows `<tier>`, the SKU list and seat usage.
- [ ] A module outside the purchased tier shows the lock page, not a broken page and not a 404.

**Navigation per role**

- [ ] Each role of §6 sees exactly its intended menus — checked by clicking, not by reading code.
- [ ] No menu entry for any role lands on the generic 404 or an "insufficient permissions" page.

**Functional**

- [ ] Case created end-to-end for each sub-type: correct form, correct SLA, correct priority badge.
- [ ] Assignment works; the assigned unit appears where the map/staff layer expects it.
- [ ] Contact fields hidden/required per §7.10.
- [ ] CRM item can be attached to a case/order and stock reflects the movement.
- [ ] Knowledge base: category → file → article published (only if the tier includes it).
- [ ] Reports/dashboards named in §1 open and return this tenant's data only.

**Data hygiene**

- [ ] No placeholder or demo records left behind (`<list the ones you created>`).
- [ ] Every worksheet row in §7 is either configured or explicitly deferred with a reason.

---

## 9. Deviations and corrections log **[FILL]**

> FILL: every time the source requirement document disagrees with the code, record it here instead
> of quietly configuring around it. "The code wins" is the rule; this table is the audit trail.
> An empty table is a claim that the source document was fully accurate — verify before leaving it
> empty.

| # | Source document says | Product actually does | Evidence (file:line) | Resolution |
|---|---|---|---|---|
| D1 | | | | `<configured as / escalated as PRODUCT CHANGE / deferred>` |

---

## 10. Decisions and open questions **[FILL]**

| # | Question / decision | Why it blocks | Owner | Due | Status | Answer |
|---|---|---|---|---|---|---|
| Q1 | `<…>` | | | | `<Open / Answered / Closed>` | |

Guidance: anything that cannot be traced to code belongs here, marked **UNVERIFIED**, never in the
body text as an assumption. Include at minimum: which package was bought, whether the tenant reuses
the platform admin role, whether the permission catalog is complete, and every database-level
configuration step whose owner is outside the frontend team.

---

## 11. Evidence rules and sign-off **[FIXED]**

### Evidence rules

1. **Every proper noun is a claim.** Field name, permission id, route, status value, menu label,
   level name — each one must cite where it was read from (file and line, or a dated message from
   the owner).
2. **Do not carry values forward from an earlier tenant document.** A previous document is not
   evidence. Re-read the model/route/menu for this tenant even when the answer "should be the same".
3. **Code beats documents.** When they disagree, configure per the code and log the difference in §9.
4. **Unknown is a valid value.** Mark **UNVERIFIED** and open a §10 item. Do not fill the gap with a
   plausible-sounding value — a wrong field name in a setup worksheet is executed by someone.
5. **Verify by observing the product**, not by reading the diff or the type: log in as the role,
   click the menu, save the record, re-read the list.

### Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| Business owner (`<CUSTOMER>`) | | `<approved / rejected>` | |
| Backend/platform owner | | | |
| Frontend owner | | | |
| Delivery / project owner | | | |

---

## Appendix A — product constraints worth restating in every document **[FIXED]**

> FIXED: these are current behaviours that surprise people during setup. Re-check them when the
> template is reused; if one is fixed, remove it here and note the fix in the tenant document's §9.

| # | Constraint | Practical consequence |
|---|---|---|
| A1 | The main navigation has **no admin bypass**; only route guards honour the hardcoded system role | A tenant admin without explicitly granted ids sees an empty navigation |
| A2 | Route `requiredPermissions` is **AND**, not OR | "Grant one of them" leaves the page inaccessible |
| A3 | Menu gate and page gate are sometimes different ids | Grant both, or the user sees a menu they cannot open |
| A4 | Entitlement gates have no admin bypass | A tenant admin cannot demo an unbought module |
| A5 | A payload missing the org/role identifiers is silently replaced by a demo profile rather than erroring | Always inspect the stored profile after first login |
| A6 | The priority selector's stored value repeats per severity band while readers bucket one flat scale | Record the chosen **label**, and verify the badge on the created record |
| A7 | Some master data has no create UI and must be seeded by the backend | Ask for it in §3, do not schedule an in-app task |
| A8 | Some configuration that looks tenant-specific is actually a build-time `VITE_*` variable (map provider and its API keys, boundary source, case page size) | It varies per **environment**, not per tenant; if two tenants need different values, that is a product change, not configuration |
| A9 | Duplicate/legacy API modules exist for some entities; only one is imported | Confirm which module is live before asking for a change |
| A10 | A page reload is not a cache invalidation; some admin writes rely on RTK Query tags | If a list looks stale after a write, it is a tagging bug — log it, do not build a reload workaround |

## Appendix B — permission inventory **[FIXED]**

> FIXED: the verified set of ids this frontend checks, grouped by area. Use it as the checklist for
> §3 P2 (catalog completeness) and as the row source for §6.
> When the product adds a new gated screen, add the id here in the same commit.

| Area | Permission ids |
|---|---|
| Case | `<ids>` |
| Dashboard / report | `<ids>` |
| Form | `<ids>` |
| Workflow | `<ids>` |
| User administration | `<ids>` |
| System configuration | `<ids>` |
| CRM | `<ids>` |
| Contact / appointment | `<ids>` |
| Knowledge base | `<ids>` |
| Entitlement features (not permissions) | `<ids>` |

## Appendix C — evidence index **[FILL]**

> FILL: list the files/sources actually read for this tenant's document. A reader must be able to
> re-verify the document without re-doing the survey.

| Area | Sources read (file:line or dated message) |
|---|---|
| Tenant identity / entitlements | `<…>` |
| Auth and RBAC | `<…>` |
| Navigation and routes | `<…>` |
| Data models used in §5/§7 | `<…>` |
| APIs used in §5/§7 | `<…>` |
| Customer-provided data | `<…>` |
