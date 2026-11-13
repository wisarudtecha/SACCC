# REST → GraphQL migration audit

Date: 2026-11-13 · Scope: `src/**` (WebSocket surfaces excluded by request) · Evidence: `scripts/validate-gql-map.mjs` + a method-aware endpoint diff, both re-runnable (commands at the end).

## 1. How "using REST directly" actually happens here

RTK Query endpoints are written REST-shaped (`query: () => ({ url: "/area" })`).
`createHybridBaseQuery` (`src/core/store/api/hybridBaseQuery.ts`) intercepts **every** request from
`baseApi`, `baseApiCrm` and `baseWelcomeCrmApi`, and when `VITE_USE_GRAPHQL === "true"` converts it
to GraphQL by looking the URL up in `GQL_MAP` (`src/core/utils/gqlMapper.ts`, assembled from
`src/**/store/api/graphql/*Queries.ts`).

Every `.env*` in this repo sets `VITE_USE_GRAPHQL="true"`, so:

- **there is no REST fallback.** A URL with no entry, or an entry the BFF cannot resolve, is a
  hard user-facing error (`hybridBaseQuery.ts:178-189`), not a silent degrade.
- "still using REST" therefore means one of three things — and only the first is visible by
  reading the endpoint definitions:

| Class | What it is | Where it is |
| --- | --- | --- |
| **A. Unmapped endpoint** | REST-shaped RTK endpoint with no `GQL_MAP` entry for its (url, method) | 19 live, listed in §3 |
| **B. Broken mapping** | `GQL_MAP` entry that names a root/operation/field the BFF does not define | 38, listed in §4 |
| **C. Transport bypass** | code that never reaches `createHybridBaseQuery` at all | §5 |

Class C is the one the hybrid layer can never see: its own `fetch` is invisible to the switch.

## 2. Measurements

Method-aware diff of all 417 RTK Query endpoints (56 slice files) against the 334 `GQL_MAP`
entries, cross-checked against the **live BFF schema** (anonymous introspection on staging):

| Metric | Before | After this change |
| --- | --- | --- |
| Endpoints with no usable mapping | 184 | 161 |
| …of those, reachable from a live hook | 36 | **19** |
| `GQL_MAP` entries the BFF rejects | 43 | **38** (none of them new) |
| `GQL_MAP` entries total | 335 | 346 |

Repo state after this change: `pnpm test` 653/653 pass (28 in `gqlMapper.test.ts`, 9 of them new),
`npx tsc -b` clean.

## 3. Class A — unmapped endpoints still reachable (19)

Fixed in this change (13 entries, all verified against the live schema and covered by tests):

| Endpoint | Mapping added |
| --- | --- |
| POST `/departments/add`, `/commands/add`, `/stations/add` | `Department/Command/Station.Create*` |
| POST `/skill/add` | `Skill.CreateSkill` |
| POST `/role/add` | `Role.CreateRole` |
| POST `/role_permission/add` | `RolePermission.CreateRolePermission` |
| PATCH `/role_permission/:roleId` | `RolePermission.UpdateRolePermission` |
| DELETE `/role_permission/:id` | `RolePermission.DeleteRolePermission` |
| POST `/customer_service/add` | `CustomerService.CreateCustomerService` |
| PATCH `/forms/active`, `/forms/version`, `/forms/publish` | `Forms.UpdateFormsActive/Version/Publish` |
| GET/POST `/forms/GetFormlinkWf` | `Forms.GetFormlinkWf` |
| DELETE `/orders/:orderId/items/:itemId` | `OrderItem.DeleteOrderItem` |

Three of those needed a new mapper capability: `formApi` sends `{ formId, ... }` while the inputs
declare `id`, and the order-item delete sends `itemId` where `GetOrderItemInput` says `requestId`.
`GqlMapConfig.inputFieldAliases` (new, `src/core/types/gql.ts`) renames caller keys on the GraphQL
side only, so REST bodies are untouched — the same division of labour `omitInputFields` already had.

**Still blocked — the BFF has no such operation.** Mapping any of these would mean inventing an
operation name, which fails loudly at runtime; the honest state is "backend gap":

| Endpoint | Missing on the BFF |
| --- | --- |
| `/request_spare_part`, `/:id` (POST/PUT/DELETE) | no spare-part-request root at all (only `Sparepart`/`SparepartStock` CRUD) |
| POST `/units/workload` | no workload operation |
| PUT `/orders/:orderId/info` | `OrderWorkflowMutation` has Create/Update/Control/Cancel only |
| POST `/orders/:orderId/items`, PUT `.../:requestId` | `OrderItemInput` requires `productId: String!`, but both call sites accept **part-only** creates that REST supports — needs `productId` nullable or a part input |
| PATCH/DELETE `/service/:productId` | no `UpdateCustomerService` (and both hooks are unexported today, so dead in practice) |
| PATCH `/product/:productId` | `ProductInput` requires `active/brandId/categoryId/productCode`; the call site sends a partial `ProductUpdateData` — a partial update GraphQL cannot express as-is |
| GET/PATCH `/organizations/:orgId/escalation-rules` | no `Organization` root (see §4 — the two siblings that *are* mapped are already broken for this reason) |
| PUT `/users/:id/role` | no user-role operation |
| DELETE `/delete/` | `Attachment.DeleteFileCMS/CRM` exist, but the call site sends a body the input shape needs checking; low value (also reachable via `/files/*`, which is dead) |
| GET `/call-center/dashboard` | no CC dashboard aggregate (`Dashboard` root is the KMS one) |
| POST `/email/:id/{read,star,archive,trash}` | no `Email` root (BE-09) — the four mappings that *do* exist are placeholders pointing at it (see §4) |

## 4. Class B — 38 existing mappings the BFF cannot resolve

Found by `scripts/validate-gql-map.mjs`. These are the highest-severity finding: they look
complete, so nothing points at them until a user hits the screen.

- **`Organization` root does not exist** (4 entries): `/organizations/:orgId/map-settings` (GET+PATCH)
  and `/organizations/:orgId/assignment-rules` (GET+PATCH) — i.e. Organization Settings → Map
  Settings and Assignment Rules are broken in GraphQL mode today. Matches the code comment in
  `useOrgMapSettings` about the backend route not existing yet.
- **`CallControl` root does not exist** (11 entries): the whole `cc` call-control command surface.
- **`Email` root does not exist** (4 entries): `GQL_EMAIL` is explicitly a placeholder pending
  BE-09; its own banner says so.
- **`Get*ById` operations that do not exist** (11 entries) while only `GetList*` does:
  `AppointmentStatus`, `AppointmentType`, `Brand`, `Category`, `CustomerForm`, `CustomerProduct`,
  `Product`, `ServiceType`, `Sparepart`, `SparepartStock`, `Store`, plus `OrderItem.GetOrderItemById`
  and `OrderWorkflow.DeleteOrder`.
- **Pagination fields on `ApiResponse`** (4 entries: `/permission`, `/role`, `/customer-forms`,
  and `/store`): the mappings request `currentPage/pageSize/totalFiltered/totalRecords/totalPage`
  which the GraphQL `ApiResponse` type does not define, so those list screens cannot page in
  GraphQL mode even though REST returns them.

Each of these is a one-line evidence citation away from a backend ticket; none should be "fixed"
by editing the frontend alone.

## 5. Class C — transport bypasses (invisible to the hybrid layer)

| Location | What it does | Status |
| --- | --- | --- |
| `src/core/components/admin/user-management/user/UserManagement.tsx` | deletes a User through `EnhancedCrudContainer` without `deleteItem`, so the container falls back to `apiService.delete` — a raw `fetch` that never reaches the GraphQL switch and composes `/api/v1` + `/api/users/:id` | **FIXED**: `deleteItem={handleDeleteUser}` → `useDeleteUserMutation` → `User.DeleteUser` (mapping already existed in `userQueries.ts`); guarded by a test in `gqlMapper.test.ts` |
| `RoleManagement.tsx`, `UnitManagement.tsx`, `SkillManagement.tsx`, `UserGroupManagement.tsx` | identical omission (`apiConfig.endpoints.delete` set, `deleteItem` not passed); each has a working GraphQL DELETE mapping (`/role/:id`, `/mdm/units/:id`, `/skill/:id`, `/user_groups/:id`) and an unused RTK delete mutation | **OPEN** — same one-line fix per screen, not yet done |
| `src/core/components/crud/EnhancedCrudContainer.tsx:170` | falls back to `apiService.delete` (raw `fetch`) whenever a screen omits the `deleteItem` prop; also never invalidates RTK | Still the mechanism behind every row above. Until it is removed or made loud, the next screen to omit the prop inherits a silent REST delete |
| `src/cms/services/api.ts` | `ApiService` raw-fetch client; only consumer is the fallback above | Delete with it |
| `src/core/utils/apiHelper.ts` → `SignInForm.tsx` | `api.login()` fetches `http://localhost:8080/api/v1/AuthAPI/token` with the password in the query string | Legacy. `SignInForm` is mounted by `core/pages/AuthPages/SignIn.tsx`; real login runs on `graphqlApi`. **Should be deleted, not migrated** |
| `src/core/utils/httpClient.ts` (`AuthService`), `corsHandler.ts` | legacy REST clients, no live importers found beyond `authService` | Verify then delete |
| `src/kms/**/service/*.ts` | KMS talks REST with its own `fetch` (`General.API_BASE_URL = "/api"`), plus one `common/graphql.service.ts` | Separate subsystem: the BFF now exposes `KB*` roots, so a KMS migration is possible but is its own project — not touched here |
| map/geo/tile `fetch` calls (`maptiler*`, `longdo*`, `boundarySource`, `minioBoundaryGeometry`), attachment `attUrl` fetches | third-party or MinIO URLs, not the BFF API | Out of scope |

Dead endpoints (145 of the 161 unmapped, not counted in §3): `ticketApi` (21 endpoints, **all 21
hooks unused**, yet injected via `cms/store/index.ts`), `fileApi` (5/5 unused), most of `authApi`
(12/14) and `notificationApi` (11/12), `cms/store/api/baseApi.ts` (**a whole REST-only
`createApi` with zero importers**), `cms/store/api/organizationApi.ts` (duplicate of the core one,
zero importers). These cannot fall back to REST because they are never called — they are landmines
for the next person who wires one up, not current defects.

## 6. Plan

Done in this change: §3's 13 mappings + `inputFieldAliases` + 9 tests + the schema validator.

Next, in order:

1. **Backend tickets for §4** — one per missing root/operation/pagination field. Highest value:
   the `Organization` root (two screens already shipped against it) and the `Get*ById` family.
2. **Backend tickets for §3's blocked list** — start with `OrderItemInput.productId` (blocks a
   working create flow) and spare-part requests (3 endpoints).
3. **Delete the dead surface** (§5 + the dead slices) rather than migrating it. Deleting
   `cms/store/api/baseApi.ts` and `cms/store/api/organizationApi.ts` removes two ways to
   accidentally write a REST-only endpoint.
4. **Remove the `apiService.delete` fallback** in `EnhancedCrudContainer` and supply `deleteItem`
   at the remaining call sites.
5. **KMS**: separate project; it has its own data layer and the `KB*` roots to migrate onto.
6. **Keep the guard**: run the validator before any BFF deploy and in review — it is the only
   check that can see a mapping pointing at a non-existent operation.

## 7. Re-running the evidence

```bash
# every GQL_MAP entry vs the live BFF schema (no token, no data — reads only the schema)
node scripts/validate-gql-map.mjs https://cc-bff-stg.one-sky.ai/graphql

# the endpoint/GQL_MAP diff used for §2 (method-aware, hook-reachability aware)
#   source kept out of the repo; ask for scripts/gql-endpoint-audit.mjs if it is needed again
```

Schema caveat: the introspection above is the **staging** BFF as of 2026-11-13. `.env.dev` points at
a second staging host; production may differ. Re-run per environment before treating §3/§4 as final.
