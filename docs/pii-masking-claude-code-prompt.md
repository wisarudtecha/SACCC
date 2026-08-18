# Claude Code prompt — Customer PII masking + PII leak fixes

> Copy everything below the line into Claude Code, from the repo root.
> It is written to be pasted as a single prompt. Claude Code will stop at each
> checkpoint for your review.

---

Implement display-layer PII masking for **customer data**, plus three PII leak fixes
identified in a prior audit of this repo.

Read `CLAUDE.md` first and follow its coding rules and workflow. In particular:
avoid `any`, break components down, write readable rather than clever code, and
**do not delete existing code you don't understand** — this repo intentionally keeps
large commented-out version blocks.

## Ground truth from a prior audit

These findings were verified by reading the code. Confirm each one still holds before
acting on it (line numbers may have shifted), but do not re-derive the conclusions from
scratch — they are settled.

1. **There is no masking layer today.** Nothing in `src` masks, redacts or anonymises PII.

2. **`AuthProvider.logout` does not clear IndexedDB** (`src/core/providers/AuthProvider.tsx`,
   around line 149). It calls `TokenManager.clearTokens()`, `clearHardExpiry()` and
   dispatches `LOGOUT` — nothing else. The `caseList` object store in the `CMS` database
   (`src/cms/components/idb/idb.tsx`, `DB_NAME = VITE_DB_NAME || "CMS"`) persists on disk
   across logout. On a shared contact-center workstation the next agent inherits the
   previous agent's case data. `idbStorage.clear()` already exists (~line 145).

3. **`WebSocketCaseEvent` serialises the whole case list into synthetic StorageEvents**
   (`src/core/components/websocket/websocket.tsx`, around lines 69, 80 and 103):
   `window.dispatchEvent(new StorageEvent("storage", { key: "caseList", newValue: JSON.stringify(...) }))`.
   Any `window` listener sees the full payload. The receiving code re-reads from IndexedDB
   anyway, so `newValue` is effectively decorative.

4. **`hybridBaseQuery` logs potentially-identifying data** (`src/core/store/api/hybridBaseQuery.ts`,
   lines ~90 and ~121). Line 90 logs the failing request URL — GET params can carry
   `citizenId` via phone/ID lookups. Line 121 logs the raw GraphQL error, which commonly
   echoes input variables.

5. **GraphQL field selection is NOT available as a masking lever.** Every query in
   `src/cms/store/api/graphql/customerQueries.ts` selects `fields: "status msg data desc"`,
   where `data` is an opaque JSON scalar. The server returns whole records regardless of
   selection. Do not attempt to trim PII via `GQL_MAP`.

6. **Customer PII lives in `AddCustomer`** (`src/cms/types/customer.ts`). The phone field is
   **`mobileNo`**, not `phoneNo` — `phoneNo` belongs to Case/dispatch and is out of scope.
   There is also a `landline` field and a `photo` field.

7. **`CustomerFormConfigType` is a form-builder visibility toggle, not a security control.**
   It is tenant-global, admin-edited in `src/cms/components/customer/CustomerFormConfig.tsx`,
   and defaults everything to `true`. Do not overload it for masking and do not read it to
   decide masking.

8. **Dynamic form fields have no PII marker.** `IndividualFormField`
   (`src/cms/components/interface/FormField.tsx`) has `formRule` for validation but nothing
   for classification.

## Decisions already made — do not re-open these

- **Scope is customer data only.** User/admin PII (`src/core/types/user.ts`) is explicitly
  deferred. Do not touch it.
- **Single blanket permission `pii.view`.** Keep a per-field `permission` key in the rule
  objects anyway, all set to `pii.view`, so splitting into finer permissions later is a
  one-line change per entry rather than a refactor of every call site.
- **Address: precise parts only.** Classify `no`, `road`, `street`, `building`, `floor`,
  `room`, `lat`, `lon` — for both `address` and `currentAddress`. Leave `country`,
  `province`, `district`, `subDistrict`, `postalCode` unclassified; area and zone routing
  views read them and they are not identifying alone.
- **Dynamic fields: default-ALLOW.** A dynamic field with no explicit `pii` marker renders
  normally. Provide the extension point, but unmarked means visible.
- **No reveal-on-demand flow.** Permission determines visibility; there is no click-to-reveal
  interaction and no audit endpoint in this change.

## Phase 1 — Leak fixes

Smallest diffs, highest severity. Do these first.

1. **Clear IndexedDB on logout.** In `AuthProvider.logout`, clear the case/PII-bearing IDB
   stores alongside the token clearing. Make sure this is resilient — a failed IDB clear must
   not prevent logout from completing.
2. **Stop broadcasting payloads in StorageEvent.** In `websocket.tsx`, replace the full
   `JSON.stringify(caseList)` in `newValue` with a minimal change signal (e.g. the affected
   `caseId` or a timestamp). Verify every listener of this event still works — they re-read
   from IDB, but confirm rather than assume.
3. **Scrub the logging.** In `hybridBaseQuery.ts`, strip query parameters from the logged URL
   and log only GraphQL error messages/codes, not raw error objects that may echo variables.

**CHECKPOINT: stop here.** Report what changed and any listener you had to adjust. Wait for
review before continuing.

## Phase 2 — Classification module

Create `src/core/security/piiFields.ts`.

**It must have zero imports.** `CLAUDE.md` notes that `core` → `cms` imports are an existing
tangle to work around, not extend — and customer types live in `cms`. Keep this module pure
and dependency-free: string paths in, masked strings out.

Contents:

- `MaskStrategy` = `"lastN" | "email" | "yearOnly" | "truncate" | "full"`
- `PiiRule` = `{ strategy: MaskStrategy; keep?: number; permission: string }`
- `PII_VIEW_PERMISSION = "pii.view"`
- `CUSTOMER_PII_FIELDS: Record<string, PiiRule>` keyed by dotted path, so nested address
  fields work. 22 entries total:
  - `citizenId` → lastN, keep 4
  - `mobileNo` → lastN, keep 4
  - `landline` → lastN, keep 4
  - `email` → email
  - `dob` → yearOnly
  - `photo` → full
  - `address.{no,road,street,building,floor,room,lat,lon}` → full (8)
  - `currentAddress.{...same 8...}` → full (8)
- `applyMask(value, rule)` and lookup helpers.
- An extension point for dynamic fields that returns `undefined` when a field carries no
  explicit marker (default-allow).

**Masking behaviour — must fail closed:**

- `null`, `undefined` and `""` pass through unchanged. Masking an absent value falsely
  implies data exists.
- `lastN` where the value length is ≤ `keep` returns a full mask, never the whole value.
- `email` with no `@`, or with `@` at index 0, returns a full mask.
- `yearOnly` on an unparseable date returns a full mask.
- An unrecognised strategy returns a full mask.
- Format-preserving where practical, so table columns don't jump: `•••••••••0123`,
  `m••••••@example.com`, `••/••/1990`.

**CHECKPOINT: stop here.** Show me the module. Wait for review.

## Phase 3 — Display layer

Create a `MaskedField` component and a `useMaskedValue` hook wired to the existing
`usePermissions` hook (`src/core/hooks/usePermissions.ts`) and `PermissionManager`
(`src/core/utils/permissionManager.ts`). Follow the pattern established by `PermissionGate`
(`src/core/components/auth/PermissionGate.tsx`).

Note: `PermissionManager.hasPermission` flattens `user.permission` from
`Record<string, string[]>` and checks membership, and permissions are grouped by
`permId.split(".")[0]` — so a `pii.*` namespace slots in without changing that class.

**Two cases that need explicit handling, not a generic string mask:**

- **`photo`** is a URL. Returning `"••••••"` into an `<img src>` produces a broken image.
  Render a placeholder avatar instead.
- **`dob`** returns a *string*, so a masked value must never be handed to a date formatter
  or a date-picker component downstream.

**CHECKPOINT: stop here.** Wait for review.

## Phase 4 — Apply to customer screens

Apply masking to the customer read/display surfaces. Start by locating them rather than
trusting a list — `src/cms/components/customer/` is the primary area.

**Critical constraint: masking is for READ/DISPLAY contexts only.**

Do not mask values bound to form inputs. If an agent opens a customer edit form showing
`••••••4567` in the `citizenId` input and saves, the mask string is written into the record
and the real data is destroyed. For edit forms, either show the real value (gated on
permission) or disable/omit the field for users without it — never render a masked string
into an editable input. `CustomerCreate.tsx` is a form; treat it accordingly.

Check whether customer data is also displayed read-only inside case screens
(`CaseDetailView`, `CasePanel`, `OverviewTab`) and mask there if so — but do not extend into
case-owned fields like `phoneNo`.

**CHECKPOINT: stop here.** List every call site you changed and flag any you were unsure
about. Wait for review.

## Phase 5 — Verify

- Run `pnpm lint` and `tsc -b`. TypeScript is strict with `noUnusedLocals` and
  `noUnusedParameters` — unused vars fail the build, not just lint.
- **There is no test runner in this repo.** Do not create one, and do not assume Jest or
  Vitest exists. If you want to prove the masking functions behave, write a temporary
  throwaway script, run it, report the output, then delete it.
- Exercise the edge cases listed in Phase 2 explicitly and show me the results.
- Confirm coarse address parts are still visible and that area/zone routing views are
  unaffected.

## Out of scope — do not do these

- Any change to `src/core/types/user.ts` or user/admin PII screens.
- Any change to `GQL_MAP` or the `graphql/*Queries.ts` field selections.
- Any reveal-on-demand UI or audit-logging endpoint.
- Any change to `CustomerFormConfigType` or the form-config admin screen.
- Adding a test framework.
- Server-side masking. This change is a display-layer control only; the BFF remains the
  actual security boundary and is being handled separately.
