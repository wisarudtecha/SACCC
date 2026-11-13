# SKYICT — API payloads (Department, Command, Station, Role, User)

JSON request bodies for creating the SKYICT tenant's organization structure, roles and users
through the product's own API — the counterpart of the SQL seeds in this folder.

Generated: 2026-11-06. Every payload shape was traced to the code, not to the documents:

| File | REST body type (evidence) | Endpoint |
| --- | --- | --- |
| `01-departments.json` | `DepartmentCreateData` — `src/core/types/organization.ts:25-29` | `POST /departments/add` |
| `02-commands.json` | `CommandCreateData` — `src/core/types/organization.ts:46-51` | `POST /commands/add` |
| `03-stations.json` | `StationCreateData` — `src/core/types/organization.ts:70-76` | `POST /stations/add` |
| `04-roles.json` | `RoleCreateData` — `src/core/types/role.ts:95-98` | `POST /role/add` |
| `05-role-permissions.json` | `RolePermissionsCreateData` — `src/core/types/role.ts:75-78` | `POST /role_permission/add` |
| `06-users.json` | `UserFormData` — `src/core/types/user.ts:216-247`, captured in `src/core/mocks/userCURL.v2.sh:222-264` | `POST /users/add` |

Data rows mirror `db/seed/skyict/01-sec_org-structure.sql` (1 department, 6 commands,
7 stations) and `db/seed/skyict/02-um_users.sql` (16 users with the same names, emails,
empIds and role assignments). The "Central Call Center" second department is intentionally
NOT here: in the SQL seed it is an off-by-default option (`create_call_center`, §6).

## Execution order

The API, unlike the SQL seeds, needs real parent ids at request time (the app resolves
"which department" in a form dropdown, so it can only send the id it was given). Create in
this order and copy each response's business key into the next step's placeholders:

1. `01-departments.json` → response carries `deptId` → fills `{{DEPT_ID_SKYICT}}`
2. `02-commands.json` → response carries `commId` → fills `{{COMM_ID_CTR}}`, `{{COMM_ID_NOR}}`, …
3. `03-stations.json` → response carries `stnId` → fills `{{STN_ID_01}}` … `{{STN_ID_07}}`
4. `04-roles.json` → response carries `id` → fills `{{ROLE_ID_SYSTEM_ADMIN}}` …
5. `05-role-permissions.json` → grant the permissions to the five new roles
6. `06-users.json` → create the 16 users with the role/dept/comm/stn ids from above

Do not invent the business keys: `deptId` / `commId` / `stnId` / role `id` are
server-assigned (same policy as the SQL seeds' ID POLICY — the frontend's create types
carry no id at all). The only ids you supply are the parent references above.

## Placeholders

`{{...}}` tokens must be replaced before sending — a raw token fails on the server.
`"string"` values in `06-users.json` (`blood`, `bod`, `empId`-style filler, `password`,
`photo`, `lastLogin`) are explicit "fill from your data source" markers; `mobileNo` /
`address` / `title` are `""` because the source document has no values (same as the SQL
seed's NULLs).

## Transport caveats (verified in `src/core/utils/gqlMapper.ts` 2026-11-06)

1. **`id: "add"` is injected into org creates in GraphQL mode.** The REST URLs
   `/departments/add`, `/commands/add`, `/stations/add` match the GQL keys
   `"/departments/:id"`, `"/commands/:id"`, `"/stations/:id"` (registered in
   `src/core/store/api/graphql/organizationQueries.ts:185-210`), and the mapper merges
   `pathParams` into the input (`gqlMapper.ts:293-299`). A request through the app's
   hybrid query layer therefore sends `DepartmentInput { id: "add", active, en, th }`.
   If the BFF's input types have no `id` field, that is a `BAD_USER_INPUT`, not a
   payload problem. Sending the payloads below **directly** to the BFF GraphQL endpoint
   (no `id` key) avoids the spurious field:

   ```json
   {
     "query": "mutation ($input: DepartmentInput!) { Department { CreateDepartment(input: $input) { status msg data desc } } }",
     "variables": { "input": { "active": true, "en": "SKYICT", "th": "SKYICT" } }
   }
   ```

   Same for `CreateCommand` (root `Command`, `CommandInput!`), `CreateStation`
   (root `Station`, `StationInput!`), `CreateRole` (root `Role`, `RoleInput!`),
   `CreateUser` (root `User`, `CreateUserInput!`).

2. **`POST /role_permission/add` has no GraphQL mapping** — it is absent from
   `GQL_ROLE` (`src/core/store/api/graphql/roleQueries.ts:56-72`). Under
   `VITE_USE_GRAPHQL=true` a call through the app hard-errors; the payload file is
   valid for the REST transport, and the GraphQL equivalent of the same operation is
   `UpdateRolePermissionMulti` on `PATCH /role_permission/multi`
   (`RolePermissionMultiInput!`) — `05-role-permissions.json` is already shaped as the
   `body` array that endpoint takes.

3. **Password is not part of the create contract.** `CreateUserInput` carries no
   `password` (captured sample `userCURL.v2.sh:222-264`; `02-um_users.sql` §3b says the
   same). `06-users.json` includes the key because the template does, but the initial
   password must be set afterwards via `POST /users/reset_password`
   (`ResetPasswordInput = { email, username, newPassword }`) or
   `PATCH /users/change_password/{id}`.

4. **The tenant's organization record must exist first** — it is a platform-provided
   prerequisite, not part of this set (no tenant/organization create API exists in this
   repository, per `docs/SKYICT-Tenant-Onboarding-Runbook.md` §1). `{{ORG_ID}}` comes
   from it.

## What a role alone does NOT do

A user with a role can log in, but sees only what role ↔ permission rows grant
(`02-um_users.sql` D8, runbook §5 S3). `05-role-permissions.json` is the payload for
those rows; the `permId` values must come from the tenant's own permission catalog —
the permission catalog is tenant-scoped data, so nothing in this repository can name
them (the only permIds that appear in code are the captured examples in
`src/core/mocks/permissionCURL.sh`, e.g. `auth.configure_2fa`).
