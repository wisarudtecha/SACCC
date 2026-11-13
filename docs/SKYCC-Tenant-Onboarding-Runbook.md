# Adding a New Tenant — SKYCC Onboarding Runbook (v0.1)

> **Status:** Draft v0.1 — 2026-11-11. Derived from
> [`SKYICT-Tenant-Onboarding-Runbook-v2.md`](./SKYICT-Tenant-Onboarding-Runbook-v2.md) (structure,
> gate model and evidence discipline), re-checked against this repository on the date above, and
> re-based on **SKYCC's business** (an outsourced contact-center / BPO operator — a different business
> from SKYICT, in the same group) instead of a field-service organisation.
>
> **What is different from the SKYICT runbook** (the reason this document is not a copy):
>
> 1. **Tenancy is a decision, not a given.** SKYCC serves many client brands; §1.2 lays out
>    one-tenant-vs-per-client with the product's actual constraints.
> 2. **The contact-center surfaces are the product's weakest part.** §2 G6 states, surface by surface,
>    what is real, what is mock-only and what is a placeholder — verified in code, not from a roadmap.
> 3. **The "one code change" is not done for SKYCC.** `SKYCC` is already in the fixture registry but
>    **aliases SKYICT's file** (`src/core/mocks/entitlements/index.ts:6,23`), so today SKYCC silently
>    reads SKYICT's Enterprise plan. F3/F4/F5 below are open, unlike the SKYICT equivalents.
> 4. **New verified product constraints** that matter to a CC tenant: the case contact-method list is
>    hardcoded with **no EMAIL** entry (L22), every case sub-type **requires** device/work-order text
>    (L26), and three call-center dashboards exist ungated with fixture data (L23).
> 5. **SKYCC data set (Appendix C) is built from the real business model** (voice + non-voice, three
>    service centres, client programs, telesales, BPM), not from a service-center worksheet.
>
> **Scope:** what must be done — and in what order — to bring up a tenant on this build: (a) what the
> backend/platform must provide, (b) the one frontend change this repository needs, (c) the in-app
> configuration sequence a tenant **Admin** can follow without reading source code, plus the SKYCC
> worked data set.
>
> **Evidence rules used in this document.** Every claim about the *product* cites a file in this
> repository (`path:line` where the lines were actually read, `path` alone otherwise). Every claim
> about *SKYCC's business* is marked **[SITE]** and comes from <https://www.skycc.co.th>, fetched
> 2026-11-11 — marketing content, not a specification. Every SKYCC configuration value that is a
> **proposal** rather than a signed-off fact is marked **[PROPOSED]**. Anything that could not be
> traced is marked **UNVERIFIED** rather than restated as fact.
>
> **How to use it for the next tenant.** Copy this file, keep §1–§7 as the process, and replace
> Appendix C with the new tenant's data — the fill-in worksheets are
> [`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md) §7.

**อ่านก่อน (สำหรับ Admin ของ Tenant).** เอกสารนี้เรียงลำดับการตั้งค่าไว้ใน §5 (S0–S16) — ทำตามลำดับ
เพราะแต่ละขั้นใช้ผลลัพธ์ของขั้นก่อนหน้า ถ้าต้องการเส้นทางสั้นที่สุดก่อน ให้ใช้ "Minimum paths" ท้าย §5
ก่อนเริ่ม ตรวจ §2 G2 ว่าองค์กรซื้อ Package ไหน เพราะบางหน้าจอจะถูกปิดด้วยสิทธิ์ระดับ tenant ไม่ใช่สิทธิ์
ผู้ใช้ และตรวจ §9 L-list ว่าหน้าจอใดเป็นต้นแบบ (mock) ไม่ใช่ของจริง

---

## 1. What "tenant" means in this build

| Fact | Evidence |
| --- | --- |
| There is **no tenant-creation UI or API** in this repository. `tenant` appears only in a TODO describing a future `GET /tenants/{orgId}/entitlements`. | `src/core/store/slices/entitlementSlice.ts:5-8,39-42` |
| Runtime tenant identity is the **`organization` string on the logged-in user**, used as the entitlement lookup key. | `src/core/store/slices/entitlementSlice.ts:29-43`, `src/core/mocks/entitlements/index.ts:60-69` |
| The login form's Organization field is **free text** with autocomplete; the suggestion list is exactly the registered fixture keys, and the field defaults to `BMA`. | `src/core/components/auth/LoginForm.tsx:28,337-347`, `src/core/mocks/entitlements/index.ts:29` |
| When the BFF omits `organization`, login backfills it from the form selection (a copy, not a mutation of the cached response). | `src/core/providers/AuthProvider.tsx:209-216` |
| Entitlements are resolved from **fixtures**, not an API (`ENTITLEMENTS_SOURCE = "fixtures"`), and the fixture registry is keyed by the organization string, not by `orgId`. | `src/core/store/slices/entitlementSlice.ts:14`, `src/core/mocks/entitlements/index.ts:18-24` |
| Three places fall back to `"SKY-AI"` when the tenant string is missing, and the mock-user builder swaps in the system role. A new tenant's user whose payload lacks the field is silently treated as SKY-AI. | `src/core/utils/authService.ts:95,166`, `src/core/providers/AuthProvider.tsx:45-53` (L12) |
| The frontend never derives tenant scope itself: data calls carry the JWT and are scoped server-side. The only family that sends `orgId` explicitly is org settings (`/organizations/{orgId}/…`). | `src/core/types/organization.ts:132-149`, `CLAUDE.md` ("Auth, permissions, and routing guards") |
| A tenant can only reach the app through the login payload: `organization`, `orgId`, `roleId`, `permission`. Anything missing produces a plausible-looking but wrong session, never an error. | §2 G4 |

**Consequence.** "Create the tenant" is a **backend/platform** work item (organization record + users +
roles + permission catalog + entitlements). Everything an Admin can click starts at §5 S1.

**A second consequence specific to SKYCC.** One login maps to exactly one `organization`, and the
product has **no tenant switcher and no client/account entity** — "which client program is this case
for" is expressed through the organization tree (S1), user groups (S2) and case types (S7b), not
through a tenant boundary. That is why §1.2 below is a decision, not a detail.

### 1.1 Today's state of the SKYCC tenant in this repository

`SKYCC` is **registered but not provisioned**:

```ts
import skyictFixture from "./skyict.json";
import skyccFixture from "./skyict.json";   // ← same file, two names
…
export const ENTITLEMENT_FIXTURES: Record<string, TenantEntitlements> = {
  BMA: bmaFixture as TenantEntitlements,
  SIH: sihFixture as TenantEntitlements,
  "SKY-AI": skyAiFixture as TenantEntitlements,
  SKYICT: skyictFixture as TenantEntitlements,
  SKYCC: skyccFixture as TenantEntitlements,   // ← SKYICT's data
};
```

(`src/core/mocks/entitlements/index.ts:5-6,18-24`)

Three consequences, all of them silent:

| # | Consequence | Why it matters |
| --- | --- | --- |
| 1 | Signing in as `SKYCC` today resolves to SKYICT's **Enterprise** plan, all 8 SKUs and 11 features, `maxAgents: 50`, `seats.used: 0`. | The Subscription panel (§5 S14) **looks healthy and is wrong** — it is evidence about SKYICT, not SKYCC. |
| 2 | Editing `skyict.json` changes SKYCC too. | A tuning change for one tenant silently re-prices the other. |
| 3 | The fixture test suite asserts nothing about SKYCC. | The existing shape test passes *because it is the same object* — the defect is invisible to `pnpm test` (F5). |

### 1.2 Decision D1 — one SKYCC tenant, or one tenant per client program?

SKYCC is a BPO: it runs many client programs ("campaigns") on shared seats, in three service centres,
across voice and non-voice channels **[SITE]**. The product gives two ways to model that.

| | **Option A — one tenant = SKYCC** (recommended) | **Option B — one tenant per client** |
| --- | --- | --- |
| Tenant key | `SKYCC` | `SKYCC-<CLIENT>` per program |
| Isolation between clients | Organization tree (service line → client program → team), user groups, case types, KB categories, role scoping | Hard tenant boundary; separate users, roles, entitlements |
| What the backend must own | 1 organization, 1 role set, 1 permission catalog | N organizations, N role sets, a client-onboarding process per client |
| Agent accounts | One account per agent, reusable across programs | **One account per agent per client** — `username` uniqueness is not tenant-scoped in practice (L13), so the second account either collides or needs a mangled username |
| Switching work | Agent sees every program they hold permissions/skills for | Agent must log out and log back in as a different tenant — there is no tenant switcher (§1) |
| Entitlements | One plan for the whole company | A plan per client; a client that only needs voice can be Essential while another is Professional |
| Reporting | One dataset filterable by program | Cross-client reporting becomes a platform question |
| Effort | Appendix C, once | §5 S1–S16 repeated per client, plus N backend records |

**Recommendation:** **Option A**, with per-client separation carried by Department/Command (S1), user
groups (S2) and case types (S7b), unless a client contract explicitly requires data isolation — in
which case Option B is viable only after the backend answers the `username` uniqueness question (L13,
§10 D10) and accepts a per-client onboarding cost.

**Do not block §5 on this decision.** S1–S16 are identical under both options; only the *number* of
trees changes. What must be settled before *go-live* is the client-isolation model (D4) and who
administers each tenant.

---

## 2. The gates every screen passes through

These six gates decide whether "the tenant exists" also means "the tenant can use the product".

**G1 — RBAC (`permId`).** `user.permission` is a `Record<category, string[]>` of dotted ids such as
`case.assign`, delivered by the BFF login response; `PermissionManager` flattens it and does an exact
`includes` match. `ProtectedRoute` with `requiredPermissions` requires **ALL** listed keys
(`hasAllPermissions`, `src/core/components/auth/ProtectedRoute.tsx:296-297`). Menus use
`hasPermission` / `hasAnyPermission` individually, so *menu visibility and page access are separate
checks* — a recurring source of "I see the menu and get denied" (L7, L11).

**G2 — Entitlements (`entitlement.*`).** A second, tenant-scoped gate ("did the tenant buy this"),
resolved from `src/core/mocks/entitlements/*` today (`src/core/store/slices/entitlementSlice.ts:14`).
It has **no admin bypass by design** (`src/core/components/auth/ProtectedRoute.tsx:374-391`).
Reality check (verified by exhaustive grep of `requiredFeature` / `EntitlementGate feature=`):
**only four of the eleven features gate anything** —

| Feature | What it actually gates | Evidence |
| --- | --- | --- |
| `entitlement.kb` | the whole `/kms/*` module (lock page) + the Knowledge sidebar group | `src/App.tsx:53-62`, `src/core/layout/SuperSidebar.tsx:622-633` |
| `entitlement.audit` | `/auditlog` (route level) | `src/App.tsx:64-71` |
| `entitlement.chat` | `/cc/lobby-incoming`, `/cc/chat-history` (both are placeholder pages, L21) | `src/cc/App.tsx:41-59` |
| `entitlement.gis` | Map Settings section, **and** the case-creation address map inside it | `src/cms/components/admin/system-configuration/settings/map/MapSettingsSection.tsx:114`, `src/cms/components/case/createCase/map/AddressMap.tsx:45` |

The other seven (`core`, `agent.desktop`, `bot`, `cad`, `channel.social`, `kb.semantic_search`,
`rbac.advanced`) are declared, shape-validated and displayed in the subscription panel but change no
screen (L2). **For SKYCC this is commercially decisive — see F1.**

**G3 — System-role bypass.** Route guards skip RBAC when `profile.roleId === SYSTEM_ROLE`, a hardcoded
UUID `d6381714-8e89-47de-9d16-859131cdc5dc` (`src/core/utils/constants.ts:279`,
`src/core/utils/authService.ts:512`, `src/core/components/auth/ProtectedRoute.tsx:271,296-297`).
`SuperSidebar` and `SuperTopbar` — the shell a real user sees — have **no** such bypass.
**Consequence: a new tenant's Admin role gets no menu at all unless every key is granted explicitly,
unless the backend reuses that UUID for it.**

**G4 — Mock fallbacks.** If the stored profile lacks `orgId` **or** `roleId`, app bootstrap *replaces*
the user object with `AuthService.createMockUser(...)`: `organization: "SKY-AI"`,
`roleId = SYSTEM_ROLE`, and a synthetic permission list
(`src/core/providers/AuthProvider.tsx:45-53`, `src/core/utils/authService.ts:95`). This *looks*
healthy — the admin bypass hides the missing RBAC — but the tenant has become SKY-AI with the wrong
permission set, so most super-app menus disappear.

**G5 — Build-time environment gates (not per tenant).** Several behaviours that read as
"configuration" are compiled in from `.env.*` and therefore differ per **environment**, not per
tenant. Verified variable names (all present in the `.env*` files; values are environment secrets and
are deliberately not reproduced here):

| Group | Variables | Read by |
| --- | --- | --- |
| Transport | `VITE_BASE_URL`, `VITE_GRAPHQL_BASE_URL`, `VITE_USE_GRAPHQL`, `VITE_WS_URL`, `VITE_WEBSOCKET_BASE_URL` | `src/core/config/api.ts`, `hybridBaseQuery` |
| Demo/mock switches | `VITE_MOCK_API`, `VITE_API_DELAY`, `VITE_ENABLE_DEVTOOLS` | §2 G6 |
| Case-list tuning / SLA | `VITE_GET_CASE_PER_REQUEST`, `VITE_GET_CASE_RETRY`, `VITE_CASE_ASSIGNMENT_WARING_SLA`, `VITE_CASE_ASSIGNMENT_ALERT_SLA` | case list, SLA badge |
| Maps | `VITE_MAP_PROVIDER`, `VITE_ARCGIS_API_KEY`, `VITE_ARCGIS_ROUTE_URL`, `VITE_LONGDO_API_KEY`, `VITE_MAPTILER_API_KEY`, `VITE_ORS_API_KEY`, `VITE_BOUNDARY_SOURCE`, `VITE_BOUNDARY_MINIO_BASE_URL` | `src/core/config/api.ts`, boundary loader |
| Privacy | `VITE_ENABLE_PII_MASKING` | customer PII display |
| Reports | `VITE_JASPER_URL`, `VITE_JASPER_USERNAME`, `VITE_JASPER_PASSWORD`, `VITE_JASPER_CSRF_TOKEN`, `VITE_JASPER_TIMEZONE` | `src/cms/components/report/openReport.ts` |
| Sessions | `VITE_JWT_SECRET`, `VITE_TOKEN_EXPIRY`, `VITE_UTC_TIMEZONE` | `TokenManager` |

Two tenants needing different values for any of these is a product change, not onboarding. The *map
provider* is the one exception with a per-organization override (`OrgMapGeneralSettings.mapProvider`,
§5 S14).

**G6 — The demo gate: what is mock-only in this build.** This is the gate the SKYICT runbook did not
need and SKYCC cannot do without: for a contact-center tenant, *every* interaction surface is affected.
Verified surface by surface:

| Surface | State today | Evidence |
| --- | --- | --- |
| Incoming-call screen pop (`CALL_INCOMING`) | Contract + type guards exist; **the 3CX adapter is not built**, so events only arrive from the dev mock emitter | `src/cc/types/incomingCall.ts:11-28`, `src/App.tsx:35-46` |
| Answer / hold / resume / transfer / end, dialpad | Wired to the **dev-only mock lifecycle**; all commands are inert in a normal production session | `src/cc/store/api/callControlApi.ts:5-16`, `src/cc/components/softphone/mockCallLifecycle.ts:86-88` |
| Agent state (Ready / Not Ready / Break) | Command vocabulary exists; the event mapping is provisional and mock-driven | `src/cc/types/agentStateCommand.ts:20-22,30` |
| Supervisor roster + listen / whisper / barge / force-end | Mock-driven; the in-page `cc.supervision.view` check has a mock-mode bypass | `src/cc/store/api/callControlApi.ts:56-63`, `src/cc/components/supervision/SupervisionBoard.tsx:62` |
| `/cc/dashboard` KPI dashboard | **Endpoint dormant**: `GET /call-center/dashboard` does not exist on the BFF; renders the fixture (`VITE_MOCK_API`) | `src/cc/types/callCenterDashboard.ts:11-13`, `src/cc/components/dashboard/useCallCenterDashboard.ts:7-11,58,75` |
| `/cc/email` workspace | Renders a fixture through a façade; API slice is dormant | `src/cc/components/workspace/useEmailData.ts:6-10,60`, `src/cc/store/api/emailApi.ts:15-22` |
| `/cc/lobby-incoming`, `/cc/chat-history` | **Placeholder pages** ("coming soon"), gated by `entitlement.chat` | `src/cc/App.tsx:41-59` |
| `/cms/dashboard/callcenter`, `/cms/dashboard/agent-status`, `/cms/dashboard/analytics` | Real screens with **hardcoded fixture data**, no permission gate, and absent from both menus | `src/cms/App.tsx:142-144`, `src/cms/components/dashboard/CallcenterDashboard.tsx:24-131`, `src/cms/components/dashboard/AnalyticsDashboard.tsx:39-52` |
| Case intake "Contact method" | Hardcoded list mirroring a backend table; social channels stay hidden until the backend assigns `caseSourceId`s; **no EMAIL entry** | `src/cms/components/case/constants/caseConstants.tsx:21-46`, `src/cms/utils/customerSocial.policy.ts:60-86` |
| Case, workflow, knowledge, contacts, appointments, admin | **Real** — these are the functioning half of the product | §5 |

**Consequence for SKYCC:** a go-live that promises "agents take calls in the product" is a backend
project (P6), not a configuration task. The configurable product today is the *case/CRM/KB platform
around* the call — which is exactly what §5 sets up.

---

## 3. Part A — the one frontend change (F1–F5)

This is the only code change a new tenant needs in this repository. **For SKYCC it is not done**
(§1.1): F1 is a commercial decision, F3/F4/F5 are open work.

### F1 — Decide the package (blocking, commercial)

The fixture declares a plan, and the plan determines which features can ever be unlocked. Verified
mapping (`src/core/config/entitlements/packages.ts:17-42`, `:45-49`,
`src/core/config/entitlements/featureCatalog.ts:21-77`):

| Plan | Price / agent / month | Bundled SKUs | Features granted | **What SKYCC actually gets today** |
| --- | --- | --- | --- | --- |
| `essential` | ฿1,500 | `CC-CORE`, `CC-AGENT`, `CC-KB` | `core`, `agent.desktop`, `kb` | Knowledge Base module (real), case/CRM platform (not entitlement-gated at all), and nothing else that is gated. `core`/`agent.desktop` gate nothing (L2). |
| `professional` | ฿2,500 | + `CC-CHAT`, `CC-CHANNEL` | + `chat`, `channel.social` | The two chat pages — which are **placeholders** (L21) — plus `channel.social`, which gates nothing. |
| `enterprise` | ฿4,000 | + `CC-GIS`, `CC-CAD`, `CC-BOT` | + `gis`, `cad`, `bot` + `ENTERPRISE_EXTRA_FEATURES` (`entitlement.kb.semantic_search`, `entitlement.audit`, `entitlement.rbac.advanced`) | `/auditlog` (a real screen) and the Map Settings section. `gis` is irrelevant to a contact-center tenant unless the on-site service model is used (S11). `cad`, `bot`, `kb.semantic_search`, `rbac.advanced` gate nothing. |

Reading it as a buyer:

- **Voice + knowledge + case management = `essential` today.** The case platform itself is *not*
  entitlement-gated, so an Essential tenant is not crippled — the gated modules are KB (needed), chat
  (placeholder), GIS (irrelevant), audit (compliance).
- **`professional` buys placeholders right now.** The honest line is "buy it when the chat module
  ships", not "buy it for web chat".
- **`enterprise` is only justified by `entitlement.audit`** (and by a client contract that requires
  audit trails). There is **no way to buy audit alone**: it is bundled in the enterprise preset and
  granted only through `ENTERPRISE_EXTRA_FEATURES` (`packages.ts:44-49`). If SKYCC needs audit without
  GIS/CAD/BOT, that is a commercial/packaging question (D2), not a config choice.
- `CC-SERVICE` exists in the `SkuCode` union but is in **no** package preset and grants **no** feature
  (`src/core/config/entitlements/packages.ts:17-42`; the SKU union is `SkuCode` in
  `src/core/types/entitlement.ts:11-20`). Do not sell it as a package component without a code change.

Also decide **seat/storage/case-volume limits** (`limits.maxAgents`, `maxStorageGB`,
`maxCasesPerMonth`, `maxAPICallsPerDay`) — they are display values today (L3) but they are what the
customer will be told they bought.

### F2 — Confirm the login payload contract (blocking, backend)

Before creating any fixture, obtain from the BFF team the exact login/`profile` payload for the
tenant's user and confirm it carries:

| Field | Why it matters if absent |
| --- | --- |
| `organization` = the tenant key (`"SKYCC"`) | Entitlement lookup falls through to the `default` (Essential) fixture (`index.ts:60-69`). |
| `orgId` | G4 triggers on the next page load and **overwrites the profile** with the SKY-AI mock user. |
| `roleId` | Same G4 overwrite. |
| `permission` as `Record<category, string[]>`, with the **category key `"kms"` present** for KB permissions | The Knowledge group in the sidebar renders only when `permissionsByCategory.kms` is non-empty and at least one of four KB view keys is held (`src/core/layout/SuperSidebar.tsx:622-633`). |
| `deptId` / `commId` / `stnId` | These are not gates, but they pre-fill the user form and drive case routing; an agent without them is assignable to nothing meaningful (S4). |

Sanity check after first login: `localStorage.profile` must show all of the above.

### F3 — Add the fixture file (NOT DONE for SKYCC)

`src/core/mocks/entitlements/skyict.json` exists; **`skycc.json` does not**. Create
`src/core/mocks/entitlements/skycc.json` and make it SKYCC's own file, then replace every value.
The runtime shape guard is `isTenantEntitlements` (`src/core/mocks/entitlements/index.ts:36-52`);
a fixture that fails it is **rejected and silently replaced** by `default.json`.

Shape to copy — the guard requires exactly these keys, so the structure matters and the values do not.
The values below are deliberately placeholders: **do not copy SKYICT's Enterprise set** (F1 explains
why that would be wrong for SKYCC).

```json
{
  "orgId": "SKYCC",
  "plan": "<essential|professional|enterprise>",
  "skus": ["..."],
  "features": ["..."],
  "limits": {
    "maxAgents": 0,
    "maxStorageGB": 0,
    "maxCasesPerMonth": 0,
    "maxAPICallsPerDay": 0
  },
  "seats": { "used": 0, "max": 0 },
  "renewedAt": "YYYY-MM-DDTHH:MM:SSZ",
  "expiresAt": "YYYY-MM-DDTHH:MM:SSZ"
}
```

Notes that are easy to get wrong:

- **`features` is what actually gates.** It is read literally, never recomputed from `skus`
  (`src/core/config/entitlements/featureCatalog.ts:21-77` is a catalogue for display/upsell, not a
  resolver). A fixture whose `features` and `skus` disagree behaves according to `features`.
- The guard requires `orgId`, `plan`, `skus[]`, `features[]`, `limits.maxAgents`, `seats.used`,
  `seats.max`. Missing one = rejected = Essential defaults, with no error on screen.
- Do **not** rename or delete `default.json` — it is the fallback for unknown orgs
  (`index.ts:26,68`).
- `renewedAt` / `expiresAt` are optional and display-only; `seats.used` is **not** derived from the
  users you create (L3).
- For a contact-center tenant, the feature list is short: `entitlement.core`, `entitlement.agent.desktop`
  and `entitlement.kb` are the ones with any meaning; add `entitlement.chat` only when chat ships, and
  `entitlement.audit`/`entitlement.gis` only if bought. Copying SKYICT's 11-feature array is the
  wrong default — it advertises GIS and CAD to a tenant that has no field service.

### F4 — Register the fixture properly (DONE but wrong)

The registry edit is what makes a key appear in the login Organization dropdown
(`FIXTURE_TENANT_NAMES` is derived from the registry keys, `index.ts:29`). Current state — the
alias — is quoted in §1.1. It must become:

```ts
import skyccFixture from "./skycc.json";
…
  SKYCC: skyccFixture as TenantEntitlements,
```

Lookup is trim + case-insensitive (`index.ts:60-69`), so `skycc`, `SKYCC` and ` SKYCC ` all resolve —
but the resolved payload's `orgId` is stamped with the string the user actually typed
(`index.ts:65`). If a later report groups by `orgId`, standardise the casing at the login form or
teach the report to normalise; nothing in the app normalises it today.

### F5 — Extend the tests (NOT DONE for SKYCC)

`src/core/mocks/entitlements/entitlementFixtures.test.ts` asserts BMA/SIH/SKY-AI/SKYICT
(`:16-21`), their case-insensitive forms (`:23-29`), and the tenant-name list (`:52-56`). **SKYCC is
absent from all three.** Add, in the same style:

```ts
expect(resolveFixture("SKYCC").plan).toBe("<tier>");
expect(resolveFixture("skycc").plan).toBe("<tier>");                 // case-insensitive
expect(resolveFixture("SKYCC").features).toContain("entitlement.kb"); // behaviour, not shape
expect(FIXTURE_TENANT_NAMES).toEqual(expect.arrayContaining(["SKYCC"]));

// The aliasing defect (§1.1) deserves a permanent guard:
expect(resolveFixture("SKYCC").plan).toBe(resolveFixture("<SKYCC's own file if it differs>").plan);
```

Run `pnpm test` (Vitest, `src/**/*.test.{ts,tsx}`) and `pnpm build` (`tsc -b` is strict with
`noUnusedLocals`). Note the suite's existing habit: it asserts **behaviour per tenant**, not just the
shape — a shape-only test is exactly why the SKYCC alias went unnoticed: both keys point at one valid
object.

---

## 4. Part B — backend / platform prerequisites (P1–P14)

These cannot be done from this repository. Each row states the **contract the frontend depends on**, so
the request to the backend team is unambiguous. P6–P8 and P14 are the SKYCC-specific ones.

| # | Prerequisite | Frontend dependency (evidence) |
| --- | --- | --- |
| **P1** | Create the tenant + organization record; issue `orgId`. | No FE create path (§1). `orgId` is returned on the profile and preserved by `src/core/providers/AuthProvider.tsx:209-216`. |
| **P2** | Ensure the **global permission catalog** (`GET /permission`) contains every `permId` the UI checks — Appendix A. | A key absent from the catalog cannot be granted in Role Privilege, so the menu/route stays invisible. |
| **P3** | Create the tenant's roles and `role_permission` rows. `roleName` is stored verbatim — this tenant should use snake_case (`system_admin`, `admin`, `supervisor`, `agent`, `qa_analyst`, `trainer`, `client_viewer`). Decide explicitly whether `system_admin` reuses the hardcoded `SYSTEM_ROLE` UUID; if not, every key must be granted individually (G3). | `src/core/types/role.ts`, `src/core/utils/constants.ts:279` |
| **P4** | Create users with the fields the UI expects: `username`, `orgId`, `roleId`, `deptId`, `commId`, `stnId`, `empId`, `email`, `mobileNo`, `title`, `firstName`, `middleName`, `lastName`, `displayName`, `userType`, `photo`, `active`, `citizenId`, `bod`, `blood`, `gender`, `address`. Password is **not** part of the create contract — set it afterwards via `POST /users/reset_password` or `PATCH /users/change_password/{id}`. | `UserFormData` — `src/core/types/user.ts:216-247` |
| **P5** | Seed the master data that has **no create UI**: case statuses (`GET /case_status`, read-only, S000–S019), unit types (`GET /mdm/types`), unit sources (`GET /mdm/sources`), unit statuses (`GET /mdm/status`), companies (`GET /mdm/companies`), order/request statuses. For SKYCC the *unit type/source* catalogues need CC-meaningful values (e.g. seat, softphone, queue-endpoint) or the Unit screen is unusable (S6). | `src/cms/components/ui/status/status.tsx:11-20`, `src/cms/store/api/unitApi.ts`, `src/cms/types/unit.ts` |
| **P6** | **Deliver the telephony adapter.** The product has no PBX integration of its own: publish `CALL_INCOMING` / lifecycle / `AGENT_STATE_CHANGED` events over the existing websocket, serve the `/call-control/*` commands, and map each agent's extension to the product `agentId` id space. Contract documents exist for every one of these; the adapter does not. | `src/cc/types/incomingCall.ts:11-28`, `src/cc/store/api/callControlApi.ts:5-16`, `docs/CALL_INCOMING-Websocket-Event-Contract.md`, `docs/CALL-Lifecycle-Websocket-Event-Contract.md`, `docs/Agent-State-Command-Contract.md`, `docs/Make-Call-Command-Contract.md`, `docs/Supervisor-Call-Control-Command-Contract.md` |
| **P7** | **Assign the case `source` codes.** The "Contact method" dropdown is a hardcoded mirror of a backend table (`01 CALL`, `02 METTLINK`, `04 METTRIQ`, `05 IOT-Alert`, `06 Other` — note `03` is absent), and the social channels stay hidden until the backend supplies a `caseSourceId` per provider. **There is no EMAIL code** — for an omnichannel BPO that is a gap, not a detail (L22). Ask for the authoritative id list including EMAIL/CHAT/INBOUND-campaign codes before promising email intake. | `src/cms/components/case/constants/caseConstants.tsx:21-46`, `src/cms/utils/customerSocial.policy.ts:60-86` |
| **P8** | Bind the tenant's default **order workflow** in `app_configs`. | **UNVERIFIED from this repo** — no `app_configs` reference exists anywhere in `src/`. Confirm the column, the workflow name and the owner. Low priority for SKYCC unless a tele-sales program sells goods (S12). |
| **P9** | Expose the GraphQL operations the frontend maps: `KBCMSServiceTypeArticle` (article ↔ case sub-type mapping, used from the sub-type form) and `UpdateRolePermissionMulti` (the GraphQL form of `POST /role_permission/add`, which has **no** GQL mapping). | `src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts`, `src/core/store/api/graphql/roleQueries.ts` |
| **P10** | Serve the report server (JasperReports) at the path the app posts to, with the report units SKYCC is sold. The bundled report catalogue is **field-service shaped** (order/case/service reports, Thai folder names) — whether a *call/agent/supervisor* report set exists is **UNVERIFIED**; assume it does not until the report owner confirms. | `src/cms/components/report/openReport.ts`, `src/cms/components/report/reportConfig.json` |
| **P11** | Confirm the per-environment flags (G5), especially `VITE_MOCK_API` and `VITE_USE_GRAPHQL`. Under mock mode several screens read fixtures instead of the API, which masks a mis-provisioned tenant; under GraphQL mode a URL with no `GQL_MAP` entry is a hard failure, not a REST fallback. | `CLAUDE.md` ("Environment configuration", "Hybrid REST/GraphQL query layer") |
| **P12** | Ship `GET /tenants/{orgId}/entitlements` (or confirm fixtures are acceptable at go-live). Until then the plan/SKU/seat panel is a static fixture (F3). | `src/core/store/slices/entitlementSlice.ts:14,39-42` |
| **P13** | Seed **area boundary geometry** *only if* SKYCC uses the on-site service model (SKYCC engineers dispatched to a client site **[SITE]**) or the GIS map. District polygons, not just names, are what make the Create Case Service Center field auto-resolve. | `src/cms/components/case/formFields/serviceCenterMatch.ts`, `src/cms/types/area.ts` |
| **P14** | **Provide the non-voice channels** for SKYCC's stated channel mix (web chat, email, social) **[SITE]**. Today: the email workspace's API slice is dormant and renders fixtures, and the two chat pages are placeholders behind `entitlement.chat`. There is no inbound-email ingestion pipeline nor a social-message ingestion pipeline in this repository. | `src/cc/store/api/emailApi.ts:15-22`, `src/cc/App.tsx:41-59`, L20/L21 |

### The request to the backend team (copy-paste)

Everything above can be handed over as five sentences:

> "We are onboarding tenant `SKYCC` (orgId `<uuid>`). Please (1) confirm every permission key in
> Appendix A exists in `GET /permission`; (2) create roles `system_admin`, `admin`, `supervisor`,
> `agent`, `qa_analyst`, `trainer`, `client_viewer` and tell us whether `system_admin` reuses
> `d6381714-8e89-47de-9d16-859131cdc5dc`; (3) create the users in Appendix C.3 with the fields listed in
> P4; (4) tell us the authoritative case-`source` code list **including EMAIL**, and assign
> `caseSourceId`s to LINE/Facebook/Text Chat if those channels are in scope; (5) give us the telephony
> adapter status (P6) and the entitlement endpoint status (P12)."

---

## 5. Part C — in-app configuration, in dependency order (S0–S16)

Follow this order; each step's output is an input to a later one. "Menu path" is what a user actually
clicks in the super-app shell (`SuperTopbar` → **More**, or `SuperSidebar`). Every gate listed is from
the code, not from a source document.

### S0 — What an Admin cannot configure (and where it lives instead)

A contact-center operator will look for these first. None of them is in this product.

| Want to configure | Where it actually lives | Product evidence |
| --- | --- | --- |
| ACD queues, skills-based call routing, IVR, overflow, opening hours | The **PBX** (3CX or equivalent). The product has no queue entity, no IVR editor and no ACD rule table; "queue" appears only as a *display row* in fixture dashboards. | `src/cms/components/dashboard/CallcenterDashboard.tsx:24-131`, `src/cms/mocks/*` |
| Agent extensions, SIP devices, recording | The PBX. The product's `Device` entity is a **map object with lat/long** for field equipment, not a SIP extension. | `src/cms/types/deviceIoT.tsx`, §5 S11 |
| Wrap-up / disposition codes | Case **sub-types** + the dynamic form + case results (S7, S8, C.11) — that is the product's version of a disposition code | `src/cms/types/case.ts:246-276`, `src/cms/types/caseResult.ts` |
| Outbound dialer / campaign lists / lead assignment | **Nothing.** No campaign or lead module exists in `src/` (L24); only design documents under `docs/` | exhaustive grep for `campaign`: 2 hits, both KMS broadcast copy |
| Real-time agent wallboard | Requires P6. `/cms/dashboard/callcenter` renders fixture rows and is not in any menu (L23) | `src/cms/App.tsx:142-144` |
| Shift/roster/forecast | Nothing. `autoRespectShiftSchedule` exists as an assignment **flag** only | `src/core/types/organization.ts:302-308` |

Stating this in the onboarding kickoff prevents the single most expensive misunderstanding: the tenant
buys a **case/CRM/KB platform with call-centre surfaces attached**, not an ACD. The per-section verdict
for SKYCC — what to configure, what to skip — is in Appendix C.14.

**The dependency chain at a glance** (this is the map an Admin needs):

```text
S1 Organization ─┬─> S4 Users ─┬─> S6 Units (login seat, dept/comm/stn)
                 │             └─> S9 Contacts (agent identity)
                 └─> S2 User Groups ─> S7 Workflow nodes (dispatch/process PIC)
S3 Roles ─> S4 Users
S5 Skills ──────────────┐
S6 Unit Properties ─────┼─> S7b Case Sub-Type (skill + property + workflow + device type)
S7 Workflows ───────────┘                  │
                                           ├─> S8 Dynamic forms (rendered per sub-type)
                                           └─> S13 KB articles (mapped back into the sub-type)
S9 Contacts (+ configuration) ─> Create Case with a real customer
S10 Appointments ─> callbacks / scheduled call-backs
S13 Knowledge base ─> agent scripts & campaign briefs
S14 Organization settings ─> assignment rules consumed by the case board
S15 Case results ─> the close-case dialog's reason list
S12 CRM master data ─> only if a program sells goods
S11 Area / Place / Device ─> only for the on-site service model (otherwise skip)
```

**Minimum paths** (pick one before starting):

| Path | Steps | Use when |
| --- | --- | --- |
| **Voice MVP** (recommended first) | S1 → S3 → S4 → S5 → S7 → S7b → S8 → S9 → S13 → S15 → S16 | A single inbound program, agents log interactions as cases, KB scripted answers. No CRM, no GIS, no area. |
| **Full CC platform** | Voice MVP + S2 → S6 → S14 → S10 → S12 | Multiple programs, per-team dispatch, callbacks, tele-sales order tracking. |
| **Field/on-site model** | Full CC platform + S11 (+ P13 polygons) | SKYCC engineers dispatched to a client site **[SITE]** — needs `entitlement.gis` (Enterprise). |

### S1 — Organization structure (Department → Command → Station)

- **Where:** More → User Management → Organization (`/organization`); page gate `organization.view`
  (`src/core/pages/Admin/OrganizationManagement.tsx:55`). The route itself is **not** guarded
  (`src/App.tsx:90`) — the page-level gate is the only check.
- **Entities (3 levels, created in this order):**
  `Department{deptId, en, th, active}` → `Command{deptId, commId, en, th, active}` →
  `Station{deptId, commId, stnId, en, th, active}`. Create DTOs carry **only** `{active, en, th}` plus
  the parent id (`src/core/types/organization.ts:17-84`).
- **The mapping decision (D3).** The product has **no site field**. Assignment rules route by
  `department` (`src/core/types/organization.ts:280-290`), so the department level should be whatever
  cases are routed *by*. Two defensible models **[PROPOSED]**:

  | Model | Department | Command | Station | Choose when |
  | --- | --- | --- | --- | --- |
  | **Service-line first** (recommended) | Service line: Inbound CS, Telesales, Technical Support, Back Office/BPM | Client program under that line | Team / wave / shift | Cases are routed by function, one agent pool serves several clients |
  | **Site first** | Service centre (Software Park 9F, Site 2, Site 3 **[SITE]**) | Client program | Team / wave | Headcount, reporting and SLAs are managed per site |

  Whichever dimension you do *not* use must live inside the names (e.g. `Telesales — SP9F`), because
  there is nowhere else to put it.
- **SKYCC data:** 4 departments, 7 commands, 9 stations — Appendix C.1.
- **Verify:** the hierarchy view lists every row with the intended parent;
  `GET /department_command_stations` returns the flattened tree (`src/core/store/api/organizationApi.ts`).
- ⚠️ **Edit the right API module:** the live one is `src/core/store/api/organizationApi.ts`.
  `src/cms/store/api/organizationApi.ts` is an unimported stale duplicate (L14). Do not "fix" it.
- ⚠️ **Do not** enter sites/teams under Area Management. Organization and Area are different models
  (S11).

### S2 — User groups

- **Where:** More → User Management → User Group (`/user-group`); page gate `usergroup.view`
  (`src/core/pages/Admin/UserGroupManagement.tsx:41`).
- **Fields:** `en`, `th`, `active` (create DTO `UserGroupCreateData`), optional free-text `description`
  on the read model. `grpId` is **server-generated**; the create form has no id field and no "Main
  Category" (`src/core/types/user.ts:296-327`).
- **Membership** is keyed by `(grpId, username)`; the UI writes single links or replaces the whole set.
- **Why it matters:** workflow `dispatch` / `process` nodes assign work to a **user group**, not to
  individuals, so groups must exist before S7.
- **SKYCC data:** 8 groups (7 program/function groups + `General`) — Appendix C.2. `General` is expected
  to be created by the backend when the tenant is created (source-document roadmap item,
  **UNVERIFIED** — check, and create it manually if absent).
- **Model groups as the work-routing unit, not the org chart.** For a BPO the useful groups are
  "who picks this up": per-program queues, QA, Workforce, Training, Escalation.

### S3 — Roles and permissions (RBAC)

- **Where:** More → User Management → Role & Privilege (`/role-privilege`); page gate `role.view`
  (`src/core/pages/Admin/RolePrivilegeManagement.tsx:72`).
- **What it edits:** `Role{roleName, en?, th?, active}` and the `role_permission` link rows (`roleId` +
  `permId` + `active`) (`src/core/types/role.ts`). The matrix is grouped by the permission's
  `groupName` and locks the **system role** unless the signed-in user is the system admin
  (`src/core/components/admin/user-management/role-privilege/PrivilegeMatrixView.tsx:241`).
- **`roleName` is data, not a label.** SKYCC should store snake_case — `system_admin`, `admin`,
  `supervisor`, `agent`, `qa_analyst`, `trainer`, `client_viewer` **[PROPOSED]**. A grant script or a
  report must use the literal string; "Supervisor" will not match.
- **The CC-role reality check:** there is no "supervisor sees their team only" scoping in RBAC —
  permissions are global to the tenant. A SKYCC supervisor role can see *all* cases, all programs. If
  per-program visibility is required, that is a product question (D4), not a permission setting.
- **Verify:** log in as the tenant `agent` and confirm no admin-only menu appears (§6). Still the
  single most reliable check that P2/P3 were done.
- ⚠️ Do not grant `package.view`: the Package menu entry is a `disabled: true` placeholder pointing at
  a route that does not exist (`src/core/layout/SuperTopbar.tsx:482-486`).

### S4 — Users

- **Where:** More → User Management → User (`/user`), create at `/user/create`; list gate `user.view`
  (`src/core/pages/Admin/UserManagement.tsx:98`), and the form requires `user.create` **and**
  `user.update` together (`src/core/pages/Admin/UserForm.tsx:804`; AND semantics per G1).
- **Fields (`UserFormData`):** `active`, `address`, `blood`, `bod`, `citizenId`, `commId`, `deptId`,
  `displayName`, `email`, `empId`, `firstName`, `gender`, `lastName`, `middleName`, `mobileNo`,
  `orgId`, `password`/`confirmPassword` (change-password flow), `photo`, `roleId`, `stnId`, `title`,
  `userType`, `username` (`src/core/types/user.ts:216-247`).
- **Depends on** S1 (`deptId`/`commId`/`stnId` are selects) and S3 (`roleId`).
- **After creating the user**, the preview panel carries three more assignments that matter for routing:
  **Groups** (`UserGroupsView`), **Skills** (`SkillsMatrixView`), **Area coverage**
  (`AreaAssignmentView`, `distIds[]` — not needed for SKYCC unless S11 is used).
- **Username convention (D10).** `username` is the login and, in practice, globally unique (L13). The
  natural convention for a CC tenant is the enterprise username or the PBX extension
  (`<extension>.<initials>`) — decide once, because changing it later means recreating the account.
- **SKYCC data:** role-based placeholder accounts only (Appendix C.3). The real staff list is HR data
  and must not be invented in this document.

### S5 — Skills

- **Where:** More → System Config → Skill (`/cms/skill`); gate `unit.view` (**not** `settings.view`) —
  the page and the menu both use it (`src/cms/pages/Admin/SkillManagement.tsx:49-50`,
  `src/core/layout/SuperTopbar.tsx:391-393`). Note the commented-out `settings.view` at
  `SkillManagement.tsx:49`: the page *looks* like a settings page and is gated as a unit page.
- **Fields:** `en`, `th`, `active`; `skillId` server-generated (`src/cms/types/skill.ts`).
- **Used by:** case sub-types (`userSkillList`) and user skill assignment (S4). Create them before S7b,
  otherwise the sub-type form's required skill select has nothing to offer.
- **For SKYCC, skills are the routing vocabulary** the product actually has — so model them as
  *capability* ("Thai/English billing support", "insurance product knowledge"), not as team names
  (teams are S2). Appendix C.4.

### S6 — Unit properties, then units

- **Where:** System Config → Property (`/cms/property`, page gate `unit.view`) and Units (`/cms/unit`,
  page gate `unit.view`; create/edit gate `unit.create` **and** `unit.update`)
  (`src/cms/pages/Admin/PropertyManagement.tsx`, `src/cms/pages/Admin/UnitManagement.tsx:51`).
- **What a "unit" is for SKYCC.** In this model a unit is an assignable service unit: it carries
  `username` (which user works it), `deptId/commId/stnId` (where it sits), `unitTypeId`/`unitSourceId`
  (read-only catalogues), a `priority`, and telemetry fields (`isLogin`, `sttId`, `breakDuration`,
  `healthChk`, `loc*`) that read as a **workstation/seat** rather than a vehicle
  (`src/cms/types/unit.ts`). For a contact-center tenant the honest mapping is
  **unit = logged-in seat** (agent workstation or softphone endpoint), with properties describing the
  channel it serves.
- **Properties:** `en`, `th`, `active`; `propId` server-generated (`src/cms/types/unit.ts`). The admin
  assigns properties through the unit's Properties tab.
- **Read-only catalogues:** unit **type**, **source**, **status**, and **company** are read-only in the
  UI — they must be seeded (P5) before this screen is usable. Their default vocabulary
  (`Staff` / `Internal`) is field-service language; ask the backend for CC values in the same seed
  (e.g. seat / softphone / queue endpoint).
- ⚠️ `compId` is a **Company** record (`/mdm/companies`), a different entity from `deptId`
  (Organization). Do not type the department name into the company field.
- **Optional for the Voice MVP.** A tenant can run cases without units; units become necessary when the
  assignment board must hand work to a specific login (and when the staff map layer is used, which a
  BPO does not need).
- **SKYCC data:** 8 properties, 6 seats — Appendix C.12.

### S7 — Workflows

- **Where:** More → Workflow → Workflow Management (`/cms/workflow/list`) and the builder
  (`/cms/workflow/editor/v3`). **The routes are unguarded** (`src/cms/App.tsx:179-183`); the pages gate
  `workflow.view` (`src/cms/pages/Workflow/List.tsx:53`, `src/cms/pages/Workflow/Editor.tsx:83`) while
  the **menu** entries use `workflow.view` for the list and `workflow.create` for the builder
  (`src/core/layout/SuperTopbar.tsx:292-300`).
- ⚠️ **Menu/page disagree here**: a role with `workflow.view` only can open the editor by URL while the
  builder menu entry stays hidden; a role with `workflow.create` but not `workflow.view` sees the menu
  and is denied (L11). Grant both to whoever builds workflows.
- **Node types:** `start`, `process`, `dispatch`, `decision`, `sla`, `end`
  (`src/cms/types/workflow.ts:18-24`); metadata carries `totalSla` and `wfType` (`:44-50`). Assignment
  nodes pick a **user group** from S2.
- **Default shape available for reference:** `src/cms/mocks/workflowDefault.json` — its metadata
  carries `title`/`description`/`status`, so `totalSla` must be set per tenant.
- **Ordering:** create case workflows here **before** S7b, because the sub-type form requires `wfId`.
- **Contact-center reading of the SLA bands.** The product's status vocabulary is
  `New → Assigned → In-progress → Done → Close` plus On-Hold/Cancel/Draft (C8). Map them to
  first-response / handling / resolution targets as a *worksheet*, not as a screen contract (C9).
- **SKYCC data:** 5 flows with per-node minutes — Appendix C.6.

### S7b — Case Type / Sub Type (the SLA + routing backbone)

- **Where:** System Config → Service Type (`/cms/service`); page gate `service.view`
  (`src/cms/pages/Admin/ServiceManagement.tsx:70`); route unguarded (`src/cms/App.tsx:196`).
- **Two entities, not one:** case **type** (`POST /casetypes/add`) and case **sub-type**
  (`POST /casesubtypes/add`), plus the combined read `/casetypes_with_subtype` used by the tree.
- **Type fields — and the trap:** the create form has exactly **two** inputs, EN and TH; the payload is
  `CaseTypesCreateData = {active, en, th}` (`src/cms/types/case.ts:328-338`). `typeId` is
  **server-assigned** and only appears afterwards as the row key for update/delete. **There is no
  "Type Code" field** — a `1001/1002` style code cannot be typed in anywhere (C6). Keep those numbers
  in the tenant's own documentation instead.
- **Sub-type fields:** `typeId`, `sTypeCode`, `en`, `th`, `wfId`, `caseSla`, `priority`,
  `userSkillList[]`, `unitPropLists[]`, `mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`, `active`
  (`src/cms/types/case.ts:246-276`).
- **What the form actually validates:** `en`, `th`, `sTypeCode`, `typeId`, `priority`, `unitPropLists`,
  `userSkillList`, `wfId`, **`mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`**
  (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:333-363`).
  **`caseSla` is *not* required** — the validation is commented out (`:333-336`) and a blank SLA saves
  as `"0"` (`:581`). Always type the SLA: it is what the SLA monitor compares against.
- ⚠️ **L26 — the three mandatory metadata fields are device/field-service language.** Their labels in
  the UI are "Device Type", "Device Type Name" and "Case Type" (`public/i18n/en.json`, keys
  `crud.service.form.sub_type.{mDeviceType,mDeviceTypeName,mWorkOrderType}`), and no sub-type can be
  saved without them. **A contact-center tenant must fill them with something meaningful**: use the
  *terminal/channel class* as the device (`VOICE`, `CHAT`, `EMAIL`, `WEB`, `BACKOFFICE`), its display
  name, and the business work type. Keep one spelling per tenant, and write the convention down — it
  lands in reporting.
- **Priority is ambiguous at the storage level — read L1 before filling that column.**
- **KB article mapping:** the sub-type form carries a tree multi-select that maps **published knowledge
  articles to the sub-type**, saved after the sub-type via the KMS GraphQL service
  (`src/kms/components/casetype-map-articles/service/casetype-map-articles.service.ts`). This creates an
  ordering cycle: articles need categories/files (S13), which need the tenant configured first.
  Practical sequence: create the sub-type without articles → build KB content (S13) → re-open the
  sub-type and map articles.
  - ⚠️ Because the mapping call runs after the sub-type save, a failing mapping call turns the whole
    action into an error toast **even though the sub-type was saved** (L16). Confirm the row in the tree
    before re-saving.
- **SKYCC data:** 5 types, 15 sub-types — Appendix C.5.

### S8 — Forms (dynamic case forms)

- **Where:** More → Form → Form Management (`/cms/form-management`, page gate `form.view`) and the
  builder (`/cms/dynamic-form`, route gate `form.create`)
  (`src/cms/pages/Forms/FormManagement.tsx:19`, `src/cms/App.tsx:167-176`).
- **How a form reaches Create Case:** the case form is read per case **sub-type** and per workflow
  (`POST /forms/casesubtype`, `/forms/GetFormlinkWf`, `/forms/getAllFormslinkWf`).
- ⚠️ **The form builder still exposes no "bind to sub-type" field.** In the API slice the `caseSubType`
  key is commented out and only `id` is posted. How the link is established server-side is
  **UNVERIFIED here**; ask the backend owner and use
  `/forms/casesubtype?id={sTypeId}` returning the form as the acceptance check. Do not schedule an
  in-app step that does not exist.
- **For SKYCC the form is the disposition sheet.** Design it the way a wrap-up form is designed: one
  required outcome field, the minimum identifying data, and one free-text note. Appendix C.7 gives
  four.
- **SKYCC data:** 4 forms — Appendix C.7.

### S9 — Contacts, contact configuration

- **Where:** More → Contact → Contact List (`/cc/contacts-list`, route gate `contact.view`,
  `src/cc/App.tsx:80-86`) and Contact Configuration (`/cc/contacts-configurations`, route gate
  `contact_config.view`, `src/cc/App.tsx:88-95`).
- **Why a CC tenant needs the configuration screen:** the tenant stores more customer data than agents
  should see. Field-level visibility is the product's answer to PDPA-style minimisation at the desk —
  and it is **per tenant, not per client program**.
- **Configurable fields (verified):** `photo`, `displayName`, `title`, `firstName`, `middleName`,
  `lastName`, `citizenId`, `dob`, `blood`, `gender`, `mobileNo`, `email`, `userType`, `note`,
  `languagePreference`, `contractPreference`, `social?`, plus **two address blocks** (`address` and
  `currentAddress`, each with per-subfield toggles: no/room/floor/building/street/road/subDistrict/
  district/province/postalCode/country/lat/lon), plus `dynamicForm` + `dynamicFormEnable`
  (`src/cms/types/customer.ts:3-51`).
  - `social` is optional in the type on purpose — the backend may not persist it yet; every consumer
    tests `!== false`, so an absent value means "shown".
  - For a voice-heavy BPO, `address`/`currentAddress` are noise: switch them off and keep
    `mobileNo`/`email`/`languagePreference` (the last one matters — tell the agent which language the
    customer expects).
- **Contact identities are omnichannel:** a customer can hold several accounts on `LINE`, `FACEBOOK`,
  `TEXTCHAT`, plus extra `PHONE`/`EMAIL` contact points (`src/cms/types/customerSocial.ts:28`,
  `src/cms/utils/customerSocial.policy.ts:89-139`). Only `LINE`/`FACEBOOK`/`TEXTCHAT` can become a case
  *source*, and only once the backend assigns the codes (P7, L22).
- **SKYCC data:** Appendix C.8.

### S10 — Appointments (callbacks)

- **Where:** More → Contact → Appointment (`/cc/appointment`, route gate `appointment.view`) and
  Appointment Types (`/cc/appointment-types`, same key — there is no separate `appointment_type.*`)
  (`src/cc/App.tsx:61-77`).
- **Appointment types are name-only:** `en`, `th`, `active`; the API keys the row on
  `appointmentTypeId`, not the numeric `id` (`src/cms/types/appointmentType.ts`).
- **SKYCC reading:** this is the **callback** feature — a promise to call the customer back at a time.
  Model appointment types as callback windows rather than as physical meetings (Appendix C.9). Note the
  product does not dial; the callback still happens on the PBX.

### S11 — Area, Places, Devices (optional — usually skip for SKYCC)

- **Area** (`/cms/area`, page gate `area.view`; **menu** gate `settings.view` — grant both, L7):
  `Country{countryId, nameSpace, …}` → `AreaProvince{countryId, provId}` →
  `AreaDistrict{countryId, provId, distId}` (`src/cms/types/area.ts`). It is a **geography** hierarchy,
  not an org chart. Its operational purpose is the Create Case Service Center auto-match driven by
  district polygons.
- **Places** (`/cms/place`, gate `organization_settings.manage`) — controlled vocabulary
  `police_station | hospital | fire_station` only. Nothing a BPO maps onto.
- **Devices** (`/cms/device`, same gate) — map objects with lat/long, strings for coordinates, soft
  delete. **Not** SIP extensions.
- **Decision:** skip S11 unless SKYCC runs the on-site service model or needs the GIS map. Skipping it
  also means skipping `entitlement.gis` from the package (F1) and P13.
- If it *is* used: a tenant that enters district **names** without **polygons** gets a permanently
  manual Service Center field on Create Case — the single most common "the map does not work" cause.
  Note also that the "Try Again" resolver beside a failed auto-match is a **stub that always rejects**
  (L5).

### S12 — CRM master data (conditional)

Only when a tele-sales program sells goods. Order matters: Brand and Category → Product / Spare part →
Store → stock.

| Step | Route | Gate | Fields (verified) |
| --- | --- | --- | --- |
| Brand | `/cms/brands` | `product.view` | `en`, `th`, `type`, `active`, logo (upload first, then send the returned URL as `image`) — `src/cms/types/brand.ts` |
| Category | `/cms/categories` | `product.view` | `en`, `th`, `type`, `active` — `src/cms/types/category.ts` |
| Product | `/cms/products` | `product.view` | list page; stock views at `/cms/products/stock` (`product_stock.view`) |
| Store | `/cms/stores` | `product.view` | `en`, `th`, `discount`, `active` — **no address field** (`src/cms/types/store.ts`) |
| Spare parts | `/cms/inventory` | `sparepart.view` | inventory list; stock at `/cms/inventory/stock` (`sparepart_stock.view`) |
| Order requests | `/cms/inventory/request` | `order.view` | write actions also check `order.create/update/cancel/complete/delete` |
| CRM dashboards | `/cms/products/dashboard` | `crm_dashboard.view` | see L10 before granting the sidebar entry |
| Services | `/cms/services` | `crm_service.view` | service catalogue |

`Brand.type` / `Category.type` are free strings used to separate the product catalogue from the
spare-part catalogue; pick one convention per tenant (`Product` / `SparePart`) and keep it.

⚠️ **This is not a sales-order system.** There is no payment gateway and no logistics tracking (stated
by the product requirements document,
[`SKYICT-Service-Center-Project-Prototype-v3.md`](./SKYICT-Service-Center-Project-Prototype-v3.md)
§02). A tele-sales program that needs to *charge* a customer does so outside this product.

### S13 — Knowledge base (the highest-value module for a BPO)

- **Where:** More → Knowledge, or the sidebar Knowledge group — which renders only when the user holds
  a `kms` permission category **and** at least one of `kb_dashboard.view`, `kb_broadcast.view`,
  `kb_article.view`, `kb_article.mgmt.view` (`src/core/layout/SuperSidebar.tsx:622-633`). The module
  itself is gated at the route by `entitlement.kb` (`src/App.tsx:53-62`).
- **Pages:** category manager, files, articles, broadcast, banner, source — each with its own
  `kb_*` key (`src/kms/common/utils/enumHelper.ts:1-46`). In-page checks use the core `usePermissions`
  hook, so a missing key shows a "no permission" panel **inside** a module that loaded fine.
- **Article lifecycle:** `draft → review → published`, with `unpublished`, `archived`, `wait_publish`,
  `wait_approve` also present (`src/kms/articles/dtos/articles.dto.ts`). Approval/reject is
  `kb_article.mgmt.changestatus`.
- **Why it matters more here than for SKYICT:** a BPO's product is the agent's answer. Scripts,
  campaign briefs, objection handling, escalation matrices and do-not-say lists all belong here, mapped
  onto sub-types so they surface on Create Case (S7b).
- **SKYCC data:** Appendix C.10.

### S14 — Organization settings, then verify the subscription

- **Where:** More → System Config → Organization Settings (`/cms/settings/organization`), gate
  `organization_settings.manage` (`src/cms/pages/Admin/OrganizationSettingsManagement.tsx:27`).
- **Three sections are registered:**
  1. **Map settings** — general/layers/incident/staff/assignment. **Locks behind `entitlement.gis`**
     (`MapSettingsSection.tsx:114`). The per-organization `mapProvider` override
     (`arcgis | longdo | maptiler | null = inherit`) is the only way two tenants use different map
     backends (G5). Not relevant to a voice-only CC tenant.
  2. **Assignment rules** — `mode` (`automatic | manual`), routing criteria (skill / location /
     department / availability / case type with selected sub-types, combined AND or OR),
     `allocationMethod` (`round_robin | load_balance`), and advanced options per service sub-type
     (`src/core/types/organization.ts:275-331`). **Not** entitlement-gated. **This is the one settings
     section a CC tenant must configure**: it decides whether cases auto-route to agents or wait on a
     dispatcher.
  3. **Subscription & Entitlements** — display-only view of plan, seat usage, SKUs and per-feature
     state. It renders whatever the fixture says, which makes it the fastest place to confirm F3/F4.
- ⚠️ **Both write-section behaviours are frontend contracts ahead of the backend, and they differ.**
  - **Assignment rules** loads the real query and falls back to schema defaults on 404 / GraphQL error /
    bad shape; **Save resolves `{ ok: false }`** and shows a persistent "not saved to server" banner
    **without discarding the edits**.
  - **Map settings no longer calls the load endpoint at all** — it always renders schema defaults, and
    Save still PATCHes (L17). Until the load query is re-enabled, treat every Map Settings value as
    **display-only**.
  - For a demo, verify with `VITE_MOCK_API="true"` (a session stub backs both screens).
- ⚠️ **Escalation rules have a built component that is not registered in the section list**, and an API
  contract but no screen (L4). Warning threshold / target role / on-off cannot be configured from the
  UI today.
- **SKYCC data:** Appendix C.13.

### S15 — Case results (close reasons)

- **Where:** System Config → Case Result (`/cms/case-result`); menu gate `settings.view`
  (`src/core/layout/SuperTopbar.tsx:397-399`) and page gate `settings.view`
  (`src/cms/pages/Admin/CaseResultManagement.tsx:40`); write actions also check
  `settings.create` / `settings.update` / `settings.delete`.
- **Fields:** `en`, `th`, `active` only — `resId` is generated.
- **Why it belongs in the runbook:** the close-case dialog forces a reason, and the reason is what a
  supervisor reads when reconciling a program's disposition mix. Seed it **before** the pilot, not
  after: an empty list leaves agents with no honest option (they pick "Other" and the reporting value
  disappears).
- **Model the list around what SKYCC must report to its clients**, not around internal tidy-up: the
  useful split is resolved / deferred (callback) / handed to the client / escalated internally / lost
  contact. Appendix C.11.
- **Case *statuses* (S000–S019) are backend-owned and read-only** — do not try to configure them here
  (C8).

### S16 — Verification pass

Run §7 as a scripted walkthrough, as each role, in a fresh browser profile. Split the run into
"**must pass**" (real product) and "**known demo**" (mock, G6) so a green checklist never implies a
working phone system.

---

## 6. Role → permission matrix (mapped to the keys the code actually checks)

Role intent is SKYCC's **[PROPOSED]**; the keys are this repository's. "Y" means the code checks it for
a surface that role should use.

| Key | Admin | Supervisor | Agent | QA Analyst | Trainer | Client Viewer | Gates |
| --- | :--: | :--: | :--: | :--: | :--: | :--: | --- |
| `case.view` | Y | Y | Y | Y | Y | Y | case history detail actions, screen-pop lookups |
| `case.view_history` | Y | Y | Y | Y | – | Y | `/cms/case/history` (page-level) |
| `case.create` | Y | Y | Y | – | – | – | `/cms/case/creation`, `/cms/case/creation_schedule_date` |
| `case.update` | Y | Y | Y | – | – | – | case edit/save in case detail |
| `case.view_timeline` | Y | Y | Y | Y | – | Y | activity timeline in case detail |
| `case.comment` | Y | Y | Y | Y | Y | – | comment/mention composer |
| `case.attach_file` | Y | Y | Y | – | – | Y | attachment section |
| `case.assign` | Y | Y | – | – | – | – | assignment board, assign actions |
| `case.close` | Y | Y | – | – | – | – | close action inside case detail |
| `case.delete` | Y | – | – | – | – | – | cancel case in history |
| `dashboard.view` | Y | Y | – | Y | – | Y | case dashboard, `/cms/dashboard/case-summary-by-area`, `/cms/dashboard/dispatch`, `/dashboard/custom` |
| `report.view` | Y | Y | – | Y | – | Y | Report **menu** only — the page has no guard (L8) |
| `contact.view` | Y | Y | Y | – | – | Y | `/cc/contacts-list` |
| `contact_config.view` | Y | – | – | – | – | – | `/cc/contacts-configurations` |
| `appointment.view` | Y | Y | Y | – | – | Y | `/cc/appointment`, `/cc/appointment-types` |
| `product.view` | Y | – | – | – | – | – | products, brands, categories, stores — grant only when S12 applies |
| `product_stock.view` / `sparepart.view` / `sparepart_stock.view` / `order.view` | Y | – | – | – | – | – | CRM surfaces; same caveat |
| `crm_dashboard.view` | Y | – | – | – | – | – | `/cms/products/dashboard` route + topbar; the **sidebar entry is dead** (L10) |
| `crm_service.view` | Y | – | – | – | – | – | `/cms/services` |
| `service.view` (+ `.create`/`.update`) | Y | – | – | – | – | – | Case Type / Sub Type (S7b) |
| `unit.view` | Y | – | – | – | – | – | Units, Properties, **Skills** (S5) |
| `unit.create`, `unit.update` | Y | – | – | – | – | – | unit create/edit form (**both** required) |
| `settings.view` | Y | – | – | – | – | – | Case Result, **Area menu**, **Area Template menu**; Case Result writes also check `settings.create/update/delete` |
| `area.view` (+ `.create`/`.update`/`.delete`) | Y | – | – | – | – | – | Area pages — only if S11 is in scope (L7) |
| `organization_settings.manage` | Y | – | – | – | – | – | Place, Device, Organization Settings |
| `form.view` | Y | – | – | – | – | – | form management |
| `form.create` | Y | – | – | – | – | – | dynamic form builder |
| `form.update` | Y | – | – | – | – | – | Form menu group visibility |
| `workflow.view` | Y | Y | – | – | – | – | workflow list **and** builder page (L11) |
| `workflow.create` | Y | – | – | – | – | – | workflow builder menu entry + editing |
| `workflow.update` | Y | – | – | – | – | – | editing an existing workflow |
| `user.view` / `user.create` / `user.update` | Y | – | – | – | – | – | user list / user form (**both** create+update for the form) |
| `role.view` (+ `role.create`/`update`/`delete`) | Y | – | – | – | – | – | Role & Privilege |
| `usergroup.view` (+ `.create`/`.update`/`.delete`) | Y | – | – | – | – | – | User Group |
| `organization.view` (+ `.update`) | Y | – | – | – | – | – | Organization tree |
| `auditlog.view` | Y | – | – | – | – | – | Audit Log **menu** (route needs `entitlement.audit`; the page checks no key — L9) |
| `package.view` | – | – | – | – | – | – | Package menu entry is a **disabled placeholder** — grant nothing |
| `cc.supervision.view` | Y | Y | – | – | – | – | supervisor board (in-page check only; the route is ungated — L6) |
| `kb_dashboard.view`, `kb_category.view`, `kb_article.view`, `kb_article.mgmt.view`, `kb_file.view`, `kb_broadcast.view`, `kb_banner.view`, `kb_source.view` | Y | Y | Y | Y | Y | Y | `/kms/*` and the Knowledge sidebar group |
| `kb_article.mgmt.{create,update,copy,newversion,changestatus}`, `kb_file.{create,upload,delete}`, `kb_category.{create,update,delete}` | Y | – | – | – | Y | – | article authoring / review / publish |
| `kb_banner.{create,delete}`, `kb_broadcast.{create,update,delete}`, `kb_source.{create,update,delete}` | Y | – | – | – | – | – | banner, in-app broadcast, source registry |

Four structural rules this table cannot express:

1. **Menu key ≠ route key.** Several surfaces need one key to *see* the menu and another to *open* the
   page (Area: `settings.view` + `area.view`; Workflow: `workflow.create` to see + `workflow.view` to
   open). Grant both.
2. **`requiredPermissions` is AND.** Where the table says "both", a role holding only one of the two keys
   sees the menu and is then denied the page.
3. **Entitlements are not permissions.** Buying a module does not grant access, and granting access does
   not unlock a module the tenant did not buy.
4. **Some surfaces are reachable by URL regardless of the matrix.** Verified ungated (route-level) and
   worth knowing before a client demo:

   | Surface | What actually guards it |
   | --- | --- |
   | `/cc/softphone`, `/cc/supervision`, `/cc/email`, `/cc/dashboard` | **Nothing at route level**; the sidebar keys are commented out. Only `cc.supervision.view` is checked *inside* the supervision board (L6) |
   | `/cms/report` | **Nothing** — the page has no check either (L8) |
   | `/cms/case/:caseId` | **Nothing**; only the *actions* inside are permission-checked (L8) |
   | `/auditlog` | `entitlement.audit` only — no `auditlog.view` check (L9) |
   | `/cms/dashboard/callcenter`, `/cms/dashboard/agent-status`, `/cms/dashboard/analytics` | **Nothing**, and they are not in either menu (L23) |
   | `/organization`, `/user`, `/role-privilege`, `/user-group`, `/cms/service`, `/cms/unit`, `/cms/area`, `/cms/skill`, `/cms/workflow/*` | Page-level `ProtectedRoute` only — the route table has no gate (`src/App.tsx:90-97`, `src/cms/App.tsx:179-203`) |

---

## 7. Acceptance checklist

Use a fresh browser profile (localStorage `profile` caches the tenant and role). Two blocks: **must
pass** (real product) and **known demo** (G6 — do not present these as delivered).

***Identity and package***

- [ ] Login page lists `SKYCC` in the Organization suggestions; typing `SKYCC` and logging in succeeds.
- [ ] `localStorage.profile` shows `organization: "SKYCC"`, a real `orgId`, a real `roleId` (not
      `d6381714-8e89-47de-9d16-859131cdc5dc`), and `permission` containing the expected keys, including
      a `kms` category if the tenant has a knowledge base.
- [ ] Organization Settings → **Subscription & Entitlements** shows SKYCC's plan, SKU list and seat
      usage — this proves F3/F4 resolved **SKYCC's own fixture**, not SKYICT's (§1.1).
- [ ] An unentitled module shows the **lock page**, not a broken page and not a 404 (`/kms/*` for a
      non-KB tenant is the cleanest test).

***Navigation per role***

- [ ] Each role sees exactly its menus (§6): Admin all; Supervisor case + dashboard + contacts +
      KB; Agent case + contacts + appointments + KB and **no** System Config / User Management / CRM;
      Client Viewer read-only surfaces; QA dashboard + case + KB; Trainer KB write keys.
- [ ] For the Admin role, no menu entry lands on the generic 404 or an "insufficient permissions" page
      (L7/L10/L11 list the known cases).
- [ ] A user holding only `unit.view` **cannot** open `/cms/unit/create` (AND semantics still true).

***Case platform (must pass)***

- [ ] Organization tree lists every department/command/station with the correct parent (S1).
- [ ] Each user opens and shows role, dept/command/station, groups and skills (S4).
- [ ] Each workflow opens in the builder, publishes, and its total SLA equals the sum of its nodes (S7).
- [ ] Each case sub-type saves and renders in the tree with the intended SLA, priority label, skills,
      unit properties, workflow and **device/work-order text** (S7b, L26).
- [ ] Create Case for at least one sub-type per type: form renders → customer resolves → case saves with
      the expected SLA and the expected contact method (P7 decides which methods exist).
- [ ] Case assignment board lists the case; a supervisor assigns it to an agent (`case.assign`).
- [ ] Case detail shows the timeline only with `case.view_timeline`, attachments only with
      `case.attach_file`, and close only with `case.close`.
- [ ] Contact configuration hides the fields that were disabled, including the address sub-fields (S9).
- [ ] Knowledge Base: category → file → article publish, then map the article onto a sub-type and see it
      surface on Create Case (requires `entitlement.kb` + `kb_*` + `service.view`).
- [ ] Dashboard surfaces open with their gates: `/cms/` (case dashboard),
      `/cms/dashboard/case-summary-by-area`, `/cms/dashboard/dispatch`, `/dashboard/custom`.
- [ ] Report menu opens `/cms/report` and each report link reaches the Jasper server (P10).

***Contact-center surfaces (known demo — verify honestly, then label)***

- [ ] `VITE_MOCK_API="true"` in a dev build: `window.emitMockIncomingCall(...)` raises the screen pop;
      Answer creates/opens the linked case (G6).
- [ ] Softphone controls respond **only** in dev + mock mode; in a production build they are inert and
      the agent-state selector does not command the PBX (L18).
- [ ] `/cc/dashboard` renders the fixture and shows its mock hint; swapping the month does not fetch
      (L19).
- [ ] `/cc/lobby-incoming` and `/cc/chat-history` show the "coming soon" placeholder for an entitled
      tenant and the lock page for a non-entitled one (L21).
- [ ] No one in the room believes the phone system is connected. **This is the deliverable of the demo
      block.**

---

## 8. Corrections to the source document (v3, and to the SKYICT reading of it)

The data document [`SKYICT-Service-Center-Project-Prototype-v3.md`](./SKYICT-Service-Center-Project-Prototype-v3.md)
is a **requirements** document written for a field-service tenant. Its *data model* transfers to SKYCC
almost everywhere; its *field-service vocabulary* does not. Each item below was checked against code;
the code wins.

| # | v3 says | Reality (evidence) |
| --- | --- | --- |
| **C1** | §1 Organization: Department → Command → Station, ids server-assigned | Correct. Add: create DTOs carry **no** id at all — only `{active, en, th}` + parent id — and the levels must be created in order (`src/core/types/organization.ts:17-84`). |
| **C2** | §9 Area is Country → Province → District | Correct, and it is **geography**, not the org chart. Its operational purpose is the Create Case Service Center auto-match driven by **district polygons**; names alone leave the field manual (S11). A contact-center tenant usually skips it entirely. |
| **C3** | §5 Priority: 10 labels, stored value = index inside its group | Correct. Keep the 0–9 bucketing caveat (L1) and **use one label per severity band** — Critical and the first High both store `0` (`src/cms/utils/constants.ts:245-250`, `src/cms/components/admin/system-configuration/service/ServiceHierarchyView.tsx:113-124`). |
| **C4** | §4 User Group has no "Main Category" | Correct. Its create payload is `{active, en, th}`; `description` is read-only/optional (`src/core/types/user.ts:296-327`). |
| **C5** | §13 Appointment type has no category / stay duration | Correct. The API key is `appointmentTypeId`, not `id` (`src/cms/types/appointmentType.ts`). For SKYCC, read this screen as **callbacks**, not meetings (S10). |
| **C6** | §5 "Type Code (`typeId`)" — a business key you type in, table of 1001…1006 | **Wrong.** The case-type create form has only EN and TH; the payload is `{active, en, th}` and `typeId` is server-assigned, appearing only afterwards as the row key (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx`, `src/cms/types/case.ts:328-338`). Only the **sub-type** has an enterable `sTypeCode`. |
| **C7** | §5 Sub-type: `caseSla` listed among required fields | **Wrong for the UI.** `caseSla` validation is commented out and a blank value saves as `"0"` (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:333-336,581`). The genuinely required set is `en`, `th`, `sTypeCode`, `typeId`, `priority`, `unitPropLists`, `userSkillList`, `wfId`, **`mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`** (`:333-363`). Those last three are labelled "Device Type / Device Type Name / Case Type" (`public/i18n/en.json`) — see L26. |
| **C8** | §11 Case Status groups: In-progress = S004–S011, S013, S015, S019 | Actual grouping (`src/cms/components/ui/status/status.tsx:11-20`): In-progress = `S004, S005, S006, S008, S010, S011, S013, S015, S019`; New = `S001, S002, S009`; Assigned = `S003`; Done = `S016, S012, S017`; Close `S007` / Cancel `S014` / On-Hold `S018` / Draft `S000` are hidden from the default filters. |
| **C9** | §6 Workflow SLA table implies fixed status columns (New/Assigned/Acknowledge/In-progress/Done/Closed) | Correct as a **business worksheet**, not as a screen contract. The workflow node types are the six product ones — `start`, `process`, `dispatch`, `decision`, `sla`, `end` — and each node carries its own SLA; `totalSla` lives in workflow metadata (`src/cms/types/workflow.ts:18-24,44-50`). |

Still correct in v3 and reused as-is: the Contact Configuration field-level enable/disable, the module
inventory (Customer 360 / CRM / Case / Dashboard & Report / User Management / KB), the KB approval
lifecycle, and the rule that Priority must be recorded as a label.

---

## 9. Known limitations found while preparing this runbook

Pre-existing, affecting tenant setup or acceptance. **None of them is fixed by this document.** Items
L1–L17 were verified in this repository on 2026-11-11 and are inherited from the same product surface
the SKYICT runbook documents; L18–L26 are the ones that matter specifically to a contact-center tenant.

**L1 — Priority can be stored ambiguously.** The sub-type editor generates ten options whose values
repeat per group (`value: index`), so "Critical" and the first "High" both store `0`
(`src/cms/utils/constants.ts:245-250`, `src/cms/components/admin/system-configuration/service/ServiceHierarchyView.tsx:113-124`). A tenant that needs three
distinct severity levels cannot express them reliably. **Workaround:** one label per severity band, and
verify the badge on the created case matches the label that was picked.

**L2 — Seven of eleven entitlement features gate nothing.** Only `entitlement.kb`,
`entitlement.audit`, `entitlement.chat` and `entitlement.gis` are referenced by any gate (verified by
exhaustive grep of `requiredFeature` / `EntitlementGate feature=`). `core`, `agent.desktop`, `bot`,
`cad`, `channel.social`, `kb.semantic_search`, `rbac.advanced` are declared, validated and displayed but
buy nothing. Do not sell "Bot" or "CAD" as unlockable features.

**L3 — Seat usage is a fixture value.** `seats.used` is not derived from the users you create; it
renders whatever the fixture says. A tenant with 400 agents and `"used": 0` looks healthy and is wrong.

**L4 — Escalation rules have no UI path.** The section component is fully built, never imported, and not
in `SETTINGS_SECTIONS`; the API contract exists. Warning threshold / target role / on-off cannot be
configured from the UI today.

**L5 — The Service Center "Try Again" resolver is a stub that always rejects.** No backend contract
exists. Polygon matching is the only working mechanism (S11).

**L6 — The CC workspace routes have no permission gate.** `/cc/softphone`, `/cc/supervision`,
`/cc/email`, `/cc/dashboard` have no route guard and the sidebar keys are commented out
(`src/core/layout/SuperSidebar.tsx:81-154`, `src/cc/App.tsx:28-39`). Any logged-in user can open them by
URL; only `cc.supervision.view` is checked *inside* the supervision board.

**L7 — Area requires two keys.** Menu needs `settings.view`, page needs `area.view` (S11). Granting only
one produces "menu visible, page denied".

**L8 — `/cms/report` and `/cms/case/:caseId` have no guard at all.** Neither route nor page enforces
`report.view`; case detail is reachable by URL and only its *actions* are permission-checked.

**L9 — `/auditlog` checks the entitlement, not the permission.** The route requires
`entitlement.audit` (`src/App.tsx:64-71`) and the page checks no key at all, so `auditlog.view` gates
**only the menu**.

**L10 — The Product → Dashboard sidebar entry never appears.** `SuperSidebar` gates it on
`hasAnyPermission(["crm_dashboard"])` — a key with no `.view` suffix — while the route and the topbar
both require `crm_dashboard.view`. Use **More → Dashboard & Analytic → Product**.

**L11 — Workflow menu and page use different keys.** Menu `workflow.create` (builder) /
`workflow.view` (list), page `workflow.view`. Grant both to the builder role.

**L12 — Hard-coded tenant defaults.** Three fallbacks resolve to `"SKY-AI"` and the mock-user
substitution swaps in `SYSTEM_ROLE` (§2 G4). Any payload missing `organization`/`orgId`/`roleId`
produces a *plausible but wrong* session rather than an error.

**L13 — `username` uniqueness is not tenant-scoped in practice.** Adding a tenant creates a *second*
account for a person or fails loudly on `UNIQUE (username)`. That failure is the answer, not an
obstacle: escalate the product question ("may one person belong to two tenants?") rather than rewriting
usernames. This is the main argument against one-tenant-per-client (§1.2).

**L14 — Two `organizationApi` modules and one is dead.** The live module is
`src/core/store/api/organizationApi.ts`; `src/cms/store/api/organizationApi.ts` is a near-identical copy
that no file imports. An engineer "fixing" the duplicate changes nothing.

**L15 — The legacy `AppSidebar` (non-super shell) is out of sync with routes.** Not rendered when the
super-app shell is active; only matters if the shell is switched back.

**L16 — A sub-type save can report failure after succeeding.** The KB article mapping call runs after
the sub-type write and its throw is caught by the same handler, so a mapping error shows an error toast
for a saved sub-type. Re-read the tree before re-saving.

**L17 — Map Settings never reads the server.** The load query is commented out and the section always
renders schema defaults; Save still PATCHes, so a value can be written and never read back. Assignment
rules have the healthy version of the same facade. Do not use Map Settings as evidence that org
configuration persisted.

**L18 — Call controls are mock-only in a production session.** Answer/hold/resume/transfer/end, the
dialpad and the agent-state selector are wired to a dev-only mock lifecycle that no-ops outside
`import.meta.env.DEV` + `VITE_MOCK_API` (`src/cc/components/softphone/mockCallLifecycle.ts:86-88`,
`src/cc/store/api/callControlApi.ts:5-16`). **A SKYCC go-live that includes voice requires the backend
adapter (P6).** Nothing an Admin can configure changes this.

**L19 — The CC dashboard's endpoint does not exist.** `GET /call-center/dashboard` is contract-only; the
page renders `src/cc/mocks/callCenterDashboard.json`. KPI definitions (CSAT, efficiency) are also open
questions in the contract (`src/cc/types/callCenterDashboard.ts:11-22,38-41,67`).

**L20 — The email workspace is fixture-only.** `src/cc/store/api/emailApi.ts` is dormant by design and
the UI renders a fixture through a façade. There is no inbound-email ingestion in this repository
(P14).

**L21 — The chat pages are placeholders.** `/cc/lobby-incoming` and `/cc/chat-history` render "coming
soon" behind `entitlement.chat`. Buying Professional today unlocks two placeholder screens.

**L22 — The case contact-method list is hardcoded, has no EMAIL code, and the social codes are
unassigned.** `01 CALL`, `02 METTLINK`, `04 METTRIQ`, `05 IOT-Alert`, `06 Other` — note the missing
`03`, which is why the list is described in code as a mirror of a backend table we do not control.
LINE/Facebook/Text Chat are appended only when the backend supplies a `caseSourceId`
(`src/cms/components/case/constants/caseConstants.tsx:21-46`,
`src/cms/utils/customerSocial.policy.ts:60-86`). For an omnichannel BPO this is the single most
important backend question in P7.

**L23 — Three call-center dashboards exist outside both menus, ungated, with fixture data.**
`/cms/dashboard/callcenter`, `/cms/dashboard/agent-status`, `/cms/dashboard/analytics`
(`src/cms/App.tsx:142-144`) — the queue tables are hardcoded arrays
(`src/cms/components/dashboard/CallcenterDashboard.tsx:24-131`,
`src/cms/components/dashboard/AnalyticsDashboard.tsx:39-52`). **Their queue names are placeholder data
inherited from the template; they are not SKYCC clients.** Do not show them to a client as reporting.

**L24 — There is no campaign / outbound / lead-dialer module.** An exhaustive grep for "campaign" in
`src/` returns two hits, both knowledge-base broadcast copy. The design documents under `docs/`
(`Campaign-Outbound-Technical-Discussion.md`, `Campaign-Outbound-Meeting-Cheat-Sheet.md`) are
discussions, not shipped scope. SKYCC's tele-sales/telesales line **[SITE]** therefore runs on the case
platform (sub-types + forms + KB), not on a dialer.

**L25 — The SKYCC entitlement fixture aliases SKYICT's file.** §1.1. Consequences: wrong plan shown,
coupled edits, and a test suite that cannot see the problem.

**L26 — Every case sub-type requires device/work-order text even for a non-device business.**
`mDeviceType`, `mDeviceTypeName`, `mWorkOrderType` are mandatory and labelled "Device Type / Device
Type Name / Case Type" (`src/cms/components/admin/system-configuration/service/ServiceManagement.tsx:353-363`, `public/i18n/en.json`). A contact-center tenant
must fill them with a channel/terminal convention (S7b) — and that convention ends up in reporting, so
write it down once.

---

## 10. Decisions and open questions (owner required)

1. **D1 — Tenancy model:** one SKYCC tenant, or one per client program? (§1.2) Owner: SKYCC management +
   platform. Blocks go-live, not §5.
2. **D2 — Package:** which plan and which limits are signed? It changes F3 and the honest sales claim
   (F1). If `entitlement.audit` is required, note it is bundled only in Enterprise. Owner:
   commercial/account.
3. **D3 — Organization mapping:** service-line-first or site-first (S1)? Owner: SKYCC operations.
4. **D4 — Client isolation:** how are client programs separated, and may a supervisor see all of them?
   RBAC is tenant-global; there is no per-program scoping (S3). Owner: SKYCC operations + product.
5. **D5 — Go-live scope of the CC surfaces:** is a go-live allowed while L18–L21 stand? If not, P6 and
   P14 are prerequisites, not follow-ups. Owner: SKYCC + platform.
6. **D6 — Telephony adapter:** which PBX, which contract version, and when (P6)? Owner:
   backend/platform.
7. **D7 — Does SKYCC's `system_admin` reuse `SYSTEM_ROLE` (`d6381714-…`)?** If not, that role needs every
   key in §6 granted explicitly, including the KB keys and the `kms` permission category. Owner:
   backend/platform.
8. **D8 — Case `source` codes:** authoritative list including EMAIL, and `caseSourceId`s for
   LINE/Facebook/Text Chat (P7, L22). Owner: backend/platform.
9. **D9 — Reports:** which report units is SKYCC sold, and does a call/agent report set exist at all?
   (P10) Owner: platform/ops.
10. **D10 — Username convention and the two-tenant question** (L13). Owner: SKYCC HR/IT + platform.
11. **D11 — Entitlement endpoint:** will `GET /tenants/{orgId}/entitlements` ship before go-live? If it
    does, F3/F4 change shape and a `GQL_MAP` entry is required under `VITE_USE_GRAPHQL="true"`
    (P12). Owner: backend/platform.
12. **D12 — PII posture:** `VITE_ENABLE_PII_MASKING` is **build-time and per environment**, not per
    tenant (§2 G5), and contact-field visibility is per tenant, not per client program (S9). If a client
    contract requires masking for their data only, that is a product change. Owner: SKYCC compliance.

---

## Appendix A — permission keys checked by this frontend (verified inventory, 2026-11-11)

Extracted from every `hasPermission` / `hasAnyPermission` / `hasAllPermissions` / `requiredPermissions`
call site in `src/`. Keys appear here only if a gate reads them (commented-out checks — e.g.
`workspace.*` — are excluded on purpose, see L6).

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

Entitlement features (**not** permissions — never put these in a role):
`entitlement.core`, `entitlement.agent.desktop`, `entitlement.kb`, `entitlement.kb.semantic_search`,
`entitlement.chat`, `entitlement.bot`, `entitlement.gis`, `entitlement.cad`,
`entitlement.channel.social`, `entitlement.audit`, `entitlement.rbac.advanced`
(`src/core/types/entitlement.ts`, `src/core/config/entitlements/featureCatalog.ts:21-77`). Which of them
gate a screen: §2 G2, L2.

**Keys that appear in the codebase but gate nothing live** — do not spend catalog entries on them
without a code change: `report.export`, `report.generate`, `report.schedule`, `report.delete`,
`organization.delete`, and the whole `workspace.*` family (`workspace.softphone`, `.dashboard`, `.email`,
`.chat.lobby`, `.chat.history`), which is commented out in the sidebar (L6).

## Appendix B — evidence index

| Area | Files read |
| --- | --- |
| Tenant identity & entitlements | `src/core/mocks/entitlements/{index.ts,default.json,skyict.json,entitlementFixtures.test.ts}`, `src/core/types/entitlement.ts`, `src/core/store/slices/entitlementSlice.ts`, `src/core/config/entitlements/{packages.ts,featureCatalog.ts}`, `src/core/components/auth/LoginForm.tsx` |
| Auth & RBAC | `src/core/providers/AuthProvider.tsx`, `src/core/utils/{authService.ts,constants.ts}`, `src/core/components/auth/{ProtectedRoute.tsx,LoginForm.tsx}`, `src/core/pages/Admin/*`, `src/core/components/admin/user-management/role-privilege/PrivilegeMatrixView.tsx` |
| Navigation & routes | `src/App.tsx`, `src/cms/App.tsx`, `src/cc/App.tsx`, `src/core/layout/{SuperSidebar.tsx,SuperTopbar.tsx}` |
| Contact-center surfaces | `src/cc/**` (components, pages, store/api, types), `src/cms/components/dashboard/{CallcenterDashboard.tsx,AnalyticsDashboard.tsx}`, `docs/{CALL_INCOMING,CALL-Lifecycle,Agent-State-Command,Make-Call-Command,Supervisor-Call-Control,CC-Dashboard-KPI}-*` |
| Master data models | `src/core/types/{organization.ts,user.ts,role.ts,entitlement.ts}`, `src/cms/types/{case.ts,customer.ts,customerSocial.ts,skill.ts,unit.ts,workflow.ts,appointmentType.ts,area.ts,deviceIoT.tsx}`, `src/cms/utils/{constants.ts,customerSocial.policy.ts}`, `src/cms/components/case/constants/caseConstants.tsx` |
| Admin screens read | `src/cms/pages/Admin/{OrganizationManagement…}` (core), `src/cms/pages/Admin/{ServiceManagement,UnitManagement,SkillManagement,PlaceManagement,DeviceManagement,OrganizationSettingsManagement}.tsx`, `src/cms/components/admin/system-configuration/service/{ServiceManagement.tsx,ServiceHierarchyView.tsx}`, `src/cms/pages/{Workflow,Forms,Report}/*`, `src/cms/components/ui/status/status.tsx` |
| Knowledge base | `src/kms/common/utils/enumHelper.ts`, `src/kms/articles/dtos/articles.dto.ts`, `src/kms/components/casetype-map-articles/service/*` |
| Environment | `.env`, `.env.dev`, `.env.qa`, `.env.sit`, `.env.staging`, `.env.production` (variable **names** only) |
| Source documents | `docs/SKYICT-Tenant-Onboarding-Runbook-v2.md`, `docs/SKYICT-Service-Center-Project-Prototype-v3.md`, `docs/templates/Tenant-Onboarding-Template.md`, `CLAUDE.md` |
| External business source | <https://www.skycc.co.th> — pages `/`, `/nature-of-business/`, `/our-services/outsourced-contact-center-services/`, `/organizational-structure/` (fetched 2026-11-11) |

## Appendix C — SKYCC configuration data set (worked example)

Every table below is **data to enter**, not a claim about the product. Rows marked **[PROPOSED]** are a
starting point the tenant may change; rows marked **[SITE]** derive from the company website; nothing
here is a signed contract. Where the product cannot store a value it is marked instead of being
silently dropped. A new tenant copies this appendix and replaces every row in the worksheet spirit of
[`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md) §7.

### C.0 Business context and what it forces in the configuration

| Fact about SKYCC **[SITE]** | Configuration consequence |
| --- | --- |
| Outsourced contact-center / CX operator (BPO): fully outsourced management, facility rental, outsourced CSR, maintenance. | The tenant is an **operator of programs**, not a single brand. §1.2 (tenancy) and S1's client-program level are the load-bearing decisions. |
| Three main service centres, ~2,200 seats capacity, ~1,550 seats in service, >2.36 million calls/month. | Department/Command must scale to many teams; usernames and group names need a deterministic convention (S1, S2, S4). Seat counts feed the entitlement `limits.maxAgents` (F1). |
| Channels: voice **and** non-voice — web chat, email, social media, mobile app. | Needs `entitlement.chat` when chat ships (F1), P14 for ingestion, and the P7 source codes — today case intake has **no EMAIL** method (L22). |
| Digital products: ChatOne (voice bot + chatbot), Digital Survey, Social CRM, virtual receptionist "บุษบา". | These are **separate systems**, not modules of this product. `entitlement.bot` gates nothing (L2) — do not present the product as ChatOne. |
| Service lines: customer service, telesales/sales-by-phone, technical support, BPM/back office, CX training academy. | The five case types in C.5 mirror exactly these lines; the roles in C.3 and groups in C.2 follow them. |
| Tele-sales / tele-survey / follow-up campaigns are a sold service. | There is **no campaign module** (L24): model a program as a case type + workflow + KB brief, and schedule call-backs through appointments (C.9). |
| On-site service model exists (facility at the client's site). | Only then do Area/Place/Device (S11), district polygons (P13) and `entitlement.gis` become relevant. |

Contact details for the tenant record **[SITE]**: SKY CC Company Limited, 99/26 Moo 4, Software Park
Building 9th floor, Chaeng Watthana Rd, Klong Kluea, Pak Kret, Nonthaburi 11120, +66 2685 0000. Use these
in the tenant's own documentation and in the report header — **not** in any field of this product
(there is no tenant-address field).

### C.1 Organization (S1) — 4 departments, 7 commands, 9 stations **[PROPOSED]**

Service-line-first model (S1, D3):

| # | Department (EN / TH) | Command (EN / TH) — client program | Station (EN / TH) — team/wave | Active |
| --- | --- | --- | --- | --- |
| 1 | Inbound Customer Service / บริการลูกค้าขาเข้า | Client A Card Services / บริการบัตรลูกค้า A | Wave 1 / เวฟ 1 | Y |
| 2 | Inbound Customer Service / บริการลูกค้าขาเข้า | Client A Card Services / บริการบัตรลูกค้า A | Wave 2 / เวฟ 2 | Y |
| 3 | Inbound Customer Service / บริการลูกค้าขาเข้า | Client B Policy Service / บริการกรมธรรม์ลูกค้า B | Wave 1 / เวฟ 1 | Y |
| 4 | Inbound Customer Service / บริการลูกค้าขาเข้า | Client C Retail CS / บริการลูกค้าค้าปลีก C | Wave 1 / เวฟ 1 | Y |
| 5 | Telesales / ขายทางโทรศัพท์ | Client C Telesales / ขายทางโทรศัพท์ลูกค้า C | Wave 1 / เวฟ 1 | Y |
| 6 | Telesales / ขายทางโทรศัพท์ | Client D Tele-survey / สำรวจความพึงพอใจลูกค้า D | Wave 1 / เวฟ 1 | Y |
| 7 | Technical Support / สนับสนุนเทคนิค | Client B Tech Support / สนับสนุนเทคนิคลูกค้า B | Wave 1 / เวฟ 1 | Y |
| 8 | Back Office / งานปฏิบัติการหลังบ้าน | Client A Document Processing / งานเอกสารลูกค้า A | Wave 1 / เวฟ 1 | Y |
| 9 | Inbound Customer Service / บริการลูกค้าขาเข้า | Client C Retail CS / บริการลูกค้าค้าปลีก C | Wave 2 / เวฟ 2 | Y |

`Client A…D` are placeholders for real program names — do not put a real client name into a demo
database without the account owner's approval. Site is **not** stored by the product: if site matters
for reporting, put it in the Station name (`Wave 1 — SP9F`).

### C.2 User groups (S2) — 8 groups, 7 of them program/function **[PROPOSED]**

| Group EN | Group TH | Purpose |
| --- | --- | --- |
| General | ทั่วไป | Default group (expected to be created with the tenant — verify, create manually if absent) |
| Program A Delivery | ทีมให้บริการลูกค้า A | Dispatch/process node target for client A work |
| Program B Delivery | ทีมให้บริการลูกค้า B | Dispatch/process node target for client B work |
| Program C Delivery | ทีมให้บริการลูกค้า C | Dispatch/process node target for client C work |
| Telesales Desk | ทีมขายทางโทรศัพท์ | Tele-sales and tele-survey programs |
| QA & Compliance | ตรวจสอบคุณภาพ | Call and case QA, compliance sampling |
| Workforce & Traffic | บริหารกำลังคน | Shift/queue monitoring, escalation target |
| Training & CX Academy | ฝึกอบรม | Content ownership, onboarding curriculum |

(8 rows including `General`; `General` is not a program group.)

### C.3 Roles and placeholder accounts (S3, S4) **[PROPOSED]**

`roleName` values (stored verbatim, snake_case):

| `roleName` | Intent | Notes |
| --- | --- | --- |
| `system_admin` | Platform owner of the tenant | Decide whether it reuses `SYSTEM_ROLE` (D7). Without that UUID every key must be granted explicitly. |
| `admin` | Tenant administrator | Everything except the system-role lock |
| `supervisor` | Team lead / traffic | Case + assign + close + dashboard + supervision; **sees all programs** (D4) |
| `agent` | CSR / tele-sales agent | Case + contact + appointment + KB read |
| `qa_analyst` | Quality analyst | Case read + dashboard + KB read; **no** write on cases |
| `trainer` | CX Academy / content owner | KB authoring + publish, case read |
| `client_viewer` | Read-only client-side account | Only if a client is given access — agree scope before creating (it is tenant-wide visibility, see D4) |

Placeholder accounts (12) — real staff data belongs to HR, not to this document:

| # | `username` | `displayName` | `roleName` | Dept / Command / Station |
| --- | --- | --- | --- | --- |
| 1 | `skycc.system` | SKYCC System Admin | `system_admin` | Back Office / Client A Document Processing / Wave 1 |
| 2 | `skycc.admin` | SKYCC Admin | `admin` | Back Office / Client A Document Processing / Wave 1 |
| 3 | `sup.a.cs` | Supervisor — Client A CS | `supervisor` | Inbound CS / Client A Card Services / Wave 1 |
| 4 | `sup.c.tele` | Supervisor — Client C Telesales | `supervisor` | Telesales / Client C Telesales / Wave 1 |
| 5 | `sup.b.tech` | Supervisor — Client B Tech | `supervisor` | Technical Support / Client B Tech Support / Wave 1 |
| 6 | `wfm.analyst` | Workforce Analyst | `supervisor` | Back Office / Client A Document Processing / Wave 1 |
| 7 | `qa.lead` | QA Lead | `qa_analyst` | Back Office / Client A Document Processing / Wave 1 |
| 8 | `trainer.lead` | Training Lead (CX Academy) | `trainer` | Back Office / Client A Document Processing / Wave 1 |
| 9 | `agent.a01` | Agent — Client A CS | `agent` | Inbound CS / Client A Card Services / Wave 1 |
| 10 | `agent.a02` | Agent — Client A CS | `agent` | Inbound CS / Client A Card Services / Wave 2 |
| 11 | `agent.c01` | Agent — Client C Telesales | `agent` | Telesales / Client C Telesales / Wave 1 |
| 12 | `agent.b01` | Agent — Client B Tech | `agent` | Technical Support / Client B Tech Support / Wave 1 |

Grant `user.create` + `user.update` together (page needs both), and remember the form will not send a
password — set it afterwards (P4).

### C.4 Skills (S5) — 8 skills **[PROPOSED]**

| Skill EN | Skill TH | Routing meaning | Sub-types that require it (C.5) |
| --- | --- | --- | --- |
| Inbound Customer Service | บริการลูกค้าขาเข้า | general inquiry handling | 5001, 5002, 5004 |
| Billing & Payment | การเรียกเก็บเงิน | invoices, payments, refunds | 5003 |
| Complaint Handling | การจัดการข้อร้องเรียน | anger de-escalation, remediation | 5005 |
| Retention & Cancellation | การรักษาลูกค้า | win-back, cancellation saves | 5006 |
| Telesales | ขายทางโทรศัพท์ | offer scripts, objection handling | 5101, 5102, 5103 |
| Technical Support | สนับสนุนเทคนิค | app/web/service troubleshooting | 5201, 5202, 5203 |
| Back Office Processing | งานปฏิบัติการหลังบ้าน | documents, verification | 5301, 5302, 5303 |
| English Service | บริการภาษาอังกฤษ | language routing | any sub-type, as a second skill |

### C.5 Case types and sub-types (S7b) — 5 types, 15 sub-types **[PROPOSED]**

`sTypeCode` is the only business code the product accepts (C6). `Device type` / `Work order` columns
exist because the form **requires** them (L26) — the SKYCC convention is to put the **channel/terminal**
there.

| # | Type (EN / TH) | `sTypeCode` | Sub-type (EN / TH) | Priority | Skill | Workflow (C.6) | SLA (min) | `mDeviceType` / name | `mWorkOrderType` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Customer Service / บริการลูกค้า | 5001 | Product & Service Inquiry / สอบถามสินค้าและบริการ | High | Inbound Customer Service | SKYCC-Voice Inquiry | 30 | VOICE / Voice | Voice |
| 2 | Customer Service / บริการลูกค้า | 5002 | Order Status / ตรวจสอบสถานะคำสั่งซื้อ | Medium | Inbound Customer Service | SKYCC-Voice Inquiry | 30 | VOICE / Voice | Voice |
| 3 | Customer Service / บริการลูกค้า | 5003 | Billing & Payment / การเรียกเก็บเงิน | High | Billing & Payment | SKYCC-Voice Inquiry | 30 | VOICE / Voice | Voice |
| 4 | Customer Service / บริการลูกค้า | 5004 | Callback Request / ขอนัดโทรกลับ | Low | Inbound Customer Service | SKYCC-Voice Inquiry | 30 | VOICE / Voice | Voice |
| 5 | Complaint & Escalation / ข้อร้องเรียน | 5005 | Complaint & Escalation / ข้อร้องเรียนและส่งต่อ | Critical | Complaint Handling | SKYCC-Complaint | 266 | VOICE / Voice | Complaint |
| 6 | Complaint & Escalation / ข้อร้องเรียน | 5006 | Retention & Cancellation / ยกเลิกและรักษาลูกค้า | High | Retention & Cancellation | SKYCC-Complaint | 266 | VOICE / Voice | Retention |
| 7 | Telesales / ขายทางโทรศัพท์ | 5101 | Lead Follow-up / ติดตามผู้สนใจ | High | Telesales | SKYCC-Lead | 146 | VOICE / Voice | Tele-sales |
| 8 | Telesales / ขายทางโทรศัพท์ | 5102 | Upsell & Cross-sell / เสนอขายเพิ่ม | Medium | Telesales | SKYCC-Lead | 146 | VOICE / Voice | Tele-sales |
| 9 | Telesales / ขายทางโทรศัพท์ | 5103 | Tele-survey / สำรวจความพึงพอใจ | Low | Telesales | SKYCC-Lead | 146 | VOICE / Voice | Survey |
| 10 | Technical Support / สนับสนุนเทคนิค | 5201 | Service Down / Outage / ระบบขัดข้อง | Critical | Technical Support | SKYCC-Tech Support | 139 | VOICE / Voice | Incident |
| 11 | Technical Support / สนับสนุนเทคนิค | 5202 | App & Web Issue / ปัญหาแอปและเว็บ | High | Technical Support | SKYCC-Tech Support | 139 | CHAT / Chat | Incident |
| 12 | Technical Support / สนับสนุนเทคนิค | 5203 | Device & Network Setup / ตั้งค่าอุปกรณ์และเครือข่าย | Medium | Technical Support | SKYCC-Tech Support | 139 | VOICE / Voice | Incident |
| 13 | Back Office / งานหลังบ้าน | 5301 | Email Response / ตอบกลับทางอีเมล | High | Back Office Processing | SKYCC-Back Office | 530 | EMAIL / Email | Back office |
| 14 | Back Office / งานหลังบ้าน | 5302 | Document Processing / งานเอกสาร | Medium | Back Office Processing | SKYCC-Back Office | 530 | BACKOFFICE / Back office | Back office |
| 15 | Back Office / งานหลังบ้าน | 5303 | Data Verification / ตรวจสอบข้อมูล | Medium | Back Office Processing | SKYCC-Back Office | 530 | BACKOFFICE / Back office | Back office |

The `typeId` values that a field-service document typically shows (`1001…`) are **not enterable** (C6).
`caseSla` is not enforced by the form but must be typed anyway (C7) — set it to the workflow total below.
`unitPropLists` is required as well; assign the property that matches the channel (C.12).

### C.6 Workflows and SLA bands (S7) — 5 flows **[PROPOSED]**

Per-node minutes; `totalSla` in workflow metadata must equal the sum.

| # | Workflow | New | Assigned | Acknowledge | In-progress | Done | Closed | Total SLA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SKYCC-Voice Inquiry | 1 | 2 | 2 | 15 | 5 | 5 | **30** |
| 2 | SKYCC-Complaint | 1 | 5 | 5 | 240 | 10 | 5 | **266** |
| 3 | SKYCC-Lead | 1 | 5 | 10 | 120 | 5 | 5 | **146** |
| 4 | SKYCC-Tech Support | 1 | 3 | 5 | 120 | 5 | 5 | **139** |
| 5 | SKYCC-Back Office | 5 | 10 | 15 | 480 | 15 | 5 | **530** |

Node types available: `start`, `process`, `dispatch`, `decision`, `sla`, `end`. The column names above
are the **business worksheet** carried from v3 (C9) — the screen has nodes, not columns. Put a
**dispatch** node in every flow whose work is picked up by a program group (C.2), and a **decision**
node wherever QA sampling or escalation splits the path. An `sla` node per band is how the per-node SLA
is actually enforced.

### C.7 Dynamic forms (S8) — 4 forms **[PROPOSED]**

One form per case **type**, covering its sub-types (the binding mechanism is P8/S8 — verify with
`/forms/casesubtype?id={sTypeId}` before promising it).

| Form | Sub-types it must resolve for | Minimum fields (disposition-style) |
| --- | --- | --- |
| Voice Disposition Form | 5001–5004, 5101–5103 | contact outcome (req, select), customer identity check (req), intent (req, select), resolution offered (req, text), call-back needed (checkbox) + callback time, notes, complaint-flag |
| Complaint & Retention Form | 5005, 5006 | complaint category (req, select), severity (req, select), what was promised (req), remediation (req, select), escalation owner (req, group), SLA breach flag, notes |
| Technical Support Form | 5201, 5202, 5203 | affected system (req), first-occurrence time (req), scope/blast radius (req, select), steps already tried (multi), workaround given (req), incident reference, notes |
| Back Office Case Form | 5301, 5302, 5303 | document type (req), received channel (req, select), verification result (req, select), discrepancy detail, target completion date (req, date), notes |

Keep the form short: a wrap-up screen that takes three minutes defeats its purpose. Anything the case
platform already captures (customer, contact method, SLA, priority) must **not** be repeated as a form
field.

### C.8 Contact configuration (S9) **[PROPOSED]**

Voice-first BPO: minimise what the agent sees, maximise what routing needs.

| Field | Show | Field | Show |
| --- | --- | --- | --- |
| displayName | Y | photo | N |
| title | N | email | Y |
| firstName | Y | mobileNo | Y |
| middleName | N | address (home) | N — all sub-fields off |
| lastName | Y | currentAddress | N — all sub-fields off |
| citizenId | N | userType | Y |
| dob | N | note | Y |
| blood | N | languagePreference | Y |
| gender | N | contractPreference | Y |
| social (LINE/Facebook/Text Chat) | Y | dynamic form | Y |

`social` is optional in the type because the backend may not persist it; an absent value means "shown"
(`src/cms/types/customer.ts:40-47`). Turn the two address blocks off unless a program actually needs
them — they are 26 toggles and pure noise for a call centre.

### C.9 Appointment types — callbacks (S10) **[PROPOSED]**

| Appointment type EN | TH | Meaning |
| --- | --- | --- |
| Callback 15 min | โทรกลับภายใน 15 นาที | Queue-full / overflow promise |
| Callback 1 hour | โทรกลับภายใน 1 ชั่วโมง | Deferred handling |
| Follow-up Call | โทรติดตามผล | Post-resolution check |
| Escalation Callback | โทรกลับกรณีเร่งด่วน | Supervisor-level promise |

Name + active only (`appointmentTypeId` is the key). The product does not dial — the callback is still
made on the PBX (S0).

### C.10 Knowledge base (S13) **[PROPOSED]**

Categories (level 0 → 2):

```text
Operations / การปฏิบัติงาน                     (0)
├── Agent Scripts / บทพูดของเจ้าหน้าที่          (1)
│   └── Greeting & Verification / การทักทายและยืนยันตัวตน   (2)
├── Escalation / การส่งต่อ                      (1)
│   └── Tier 2 & Supervisor Matrix / ตารางส่งต่อ            (2)
Program Briefs / สรุปโครงการลูกค้า              (0)
├── Client A / ลูกค้า A                         (1)
└── Client C Telesales / ลูกค้า C               (1)
Compliance / การปฏิบัติตามกฎ                    (0)
└── Do-Not-Say & PDPA / ข้อห้ามและ PDPA         (1)
```

Files: root `SKYCC` → `Scripts`, `Program Briefs`, `Training`, `Escalation Contacts` (level 1) →
`Wave Handover` (level 2).

Articles to prove the lifecycle (3): *Greeting & Identity Verification Script* (→ Agent Scripts,
**Published**), *Client A Card Services — Program Brief* (→ Client A, **Review**), *Escalation Matrix
Tier 2* (→ Escalation, **Draft**). After the first two are published, map them onto sub-types 5001/5005
in the sub-type form (S7b) so they surface on Create Case.

### C.11 Case results (close reasons) **[PROPOSED]**

`Resolved on Call / แก้ไขจบในสาย`, `Callback Scheduled / นัดโทรกลับ`, `Transferred to Client /
ส่งต่อให้ลูกค้า (client brand)`, `Transferred to Tier 2 / ส่งต่อทีมเทคนิค`, `Customer Disconnected /
ลูกค้าวางสาย`, `Duplicate Contact / ติดต่อซ้ำ`, `No Action Required / ไม่ต้องดำเนินการ` — `en`, `th`,
`active` only; `resId` is generated. Case **statuses** (S000–S019) are backend-owned and read-only
(C8).

### C.12 Unit properties and units (S6) **[PROPOSED]**

Properties (8): `Voice Seat`, `Chat Seat`, `Email Seat`, `Thai`, `English`, `Tier 2`, `Supervisor Seat`,
`Back Office`.

Seat convention: `unitId` = `SEAT-00N`, `unitName` = the seat label, `username` = the agent who logs in
(so the seat and the person are linked). `vehicle`/`plateNo`/`provinceCode`/GPS fields are irrelevant —
leave blank. Unit type / source come from the read-only catalogues (P5); `Staff`/`Internal` is the
field-service vocabulary and should be reseeded with CC values if the backend agrees.

| `unitId` | `unitName` | Login user | Dept / Command / Station | Properties |
| --- | --- | --- | --- | --- |
| SEAT-001 | SEAT-001 | agent.a01 | Inbound CS / Client A Card Services / Wave 1 | Voice Seat, Thai |
| SEAT-002 | SEAT-002 | agent.a02 | Inbound CS / Client A Card Services / Wave 2 | Voice Seat, English |
| SEAT-003 | SEAT-003 | agent.c01 | Telesales / Client C Telesales / Wave 1 | Voice Seat, Thai |
| SEAT-004 | SEAT-004 | agent.b01 | Technical Support / Client B Tech Support / Wave 1 | Voice Seat, Tier 2 |
| SEAT-005 | SEAT-005 | — | Back Office / Client A Document Processing / Wave 1 | Email Seat, Back Office |
| SEAT-006 | SEAT-006 | — | Back Office / Client A Document Processing / Wave 1 | Chat Seat, Thai |

### C.13 Organization settings and package (S14, F1) **[PROPOSED]**

| Setting | Value | Why |
| --- | --- | --- |
| Assignment `mode` | `automatic` | Cases should reach a program team without a dispatcher once S1/S5 are right. Start `manual` for the first week if the skills matrix is not settled. |
| Routing criteria | `skillBased` + `department` + `caseType` (all sub-types), `availability` on | Skills (C.4) and department (C.1) are the only two dimensions the tenant actually filled in. |
| `combineWithAnd` | `true` | A case must match its program **and** a capable agent; OR-routing sends work to the wrong line. |
| `allocationMethod` | `load_balance` | Spiky call volumes; round-robin ignores who is buried. |
| `autoRequireAllSkills` | `true` | Prevents an English-only customer landing on a Thai-only agent. |
| `autoRespectShiftSchedule` | `false` for now | No roster/forecast data exists in the product (S0); leave off until WFM has a source. |
| Map settings | leave default / not configured | `entitlement.gis` is not recommended for SKYCC (F1). Treat as display-only anyway (L17). |
| Package | `essential` (recommended) → `professional` when chat ships → `enterprise` only if `entitlement.audit` is required | F1. |
| `limits.maxAgents` | the signed seat count (C.0 says ~1,550 seats in service **[SITE]** — the *contracted* number is what goes here) | F3 |

### C.14 What not to configure for SKYCC (and where the worksheet goes)

| Section | Verdict for a CC tenant |
| --- | --- |
| S11 Area / Places / Devices | **Skip.** No field dispatch. Revisit only for the on-site service model (needs `entitlement.gis` + P13). |
| S12 CRM master data | **Conditional.** Only for a program that sells goods; not a payment system. |
| Map Settings (part of S14) | **Skip** — display-only today anyway (L17). |
| `entitlement.bot`, `.cad`, `.channel.social`, `.kb.semantic_search`, `.rbac.advanced` | **Never buy for the feature.** They gate nothing (L2). |
| `package.view` | Grant to nobody — disabled placeholder (S3). |

For the next tenant, replace C.1–C.13 with their own tables using
[`templates/Tenant-Onboarding-Template.md`](./templates/Tenant-Onboarding-Template.md) §7, and leave
§1–§7 of this document as the process.
