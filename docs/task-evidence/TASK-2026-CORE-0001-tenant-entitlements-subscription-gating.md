# TASK-2026-CORE-0001 — Tenant Entitlements & Subscription-Based Feature Gating

## Identity

- Task: Package/entitlement system (Essential / Professional / Enterprise tiers) gating features by tenant subscription
- Ticket: Not located (provisional ID)
- Project: Cloud Contact Center
- Feature Area: core / entitlements (consumed by cms, kms, cc)
- Role: Owner (implementation)
- Status: **Delivered** — committed `8acc496`, released **0.85.0** (2026-09-25); rollout continued in **0.86.0** (2026-09-28, commit `9fe8d1d`)
- Date: 2026-09-25 (initial), 2026-09-28 (rollout)
- Source Confidence: Explicit (git log + diffs); business/pricing rationale Unknown (no ticket found)

## Context

The product previously had no concept of tenant subscription tiers — all authenticated
tenants saw the same feature set. `docs/CC-Super-App-Product-Pricing-Model.md` exists in the
working tree (untracked) alongside this work, suggesting a pricing-tier plan was in progress,
but no ticket links the two — Strongly Inferred, not confirmed.

## Problem

KB (`kms`) and GIS/Maps routes, and specific sub-features within them, needed to be
restricted per subscription tier without a backend entitlement service necessarily being
ready first, and without silently breaking navigation for tenants who lack a tier.

## My Contribution

I implemented the full client-side entitlement layer:

- `resolveEntitlements.ts` (`src/core/config/entitlements/`) — pure resolution logic from a
  tenant's package/SKU to a feature-flag map, with a dedicated unit test file
  (`resolveEntitlements.test.ts`, 139 lines) and fixture-based tests
  (`entitlementFixtures.test.ts`, 62 lines) covering 4 mock tenants (`bma`, `sih`, `sky-ai`,
  `default`).
- `EntitlementGate`, `EntitlementLockedPage`, `LockedFeature`, `UpgradeModal`,
  `useUpgradePrompt` — the reusable gating UI: a route-level gate, a full locked-page
  fallback, an inline locked-feature wrapper, and an upgrade-prompt modal.
- `useEntitlements` / `useEntitlementsBootstrap` hooks + `entitlementSlice.ts` (Redux) to
  load and cache the tenant's entitlement state.
- Wired the gate into `ProtectedRoute.tsx` (KB and GIS/Maps routes) and into
  `SuperSidebar.tsx` (lock badge + upgrade prompt on nav items for unentitled features).
- Added a **Subscription & Entitlements** section to Organization Settings showing plan,
  seat usage, and per-feature status.
- Fixed a gap in `AuthProvider.tsx`/`types/auth.ts`: login now backfills the tenant key used
  for entitlement lookup when the BFF omits it, so entitlement resolution doesn't silently
  fail for tenants missing that field.
- 2026-09-28: extended the rollout — grouped the Place/Device map menus under a new
  "Map Management" parent in `SuperTopbar.tsx` (commit `e84d99d`), added a KB semantic-search
  toggle gated behind `entitlement.kb.semantic_search` (`kms`, commit `545253f` — UI is a real
  consumer of the gate; the semantic-search backend endpoint itself does not exist yet, so
  entitled tenants see "coming soon" rather than a working feature), and added a `cc` live-chat
  placeholder page set gated behind an entitlement flag (commit `caf8bc4`) as a second
  cross-module consumer of the same gate. Documented the pattern as an anti-regression rule
  (commit `6b62dbf`, see `.agents/skills/anti-regression/SKILL.md`). Published as **0.86.0**
  together with the case-overview map (TASK-2026-CMS-0016).

## Technical Decision

### Context
Feature gating needed to work before any backend entitlement service was necessarily final,
across three architecturally different modules (`core`/`cms` on RTK Query, `kms` on
`antd`+`react-query`, `cc` as its own app shell).

### Options Considered
- Gate at the API layer only (block requests) — rejected, doesn't prevent a confusing broken
  UI for users who can see a nav item they can't use.
- Gate per-component ad hoc in each module — rejected, would duplicate the lock/upgrade-modal
  UX three times with drift risk.

### Decision
Built a single core-owned gate (`EntitlementGate`/`useEntitlements`/`isLocked(feature)`) that
any module can import and check against a feature-key catalog (`featureCatalog.ts`), keeping
gating logic and UX centralized in `core` while individual modules only decide *which* feature
keys to check.

### Rationale
Matches the existing architectural direction (other modules depend on `core`) and avoids
three parallel implementations of the same lock/upgrade-prompt pattern.

### Trade-offs
Mock entitlement fixtures (`src/core/mocks/entitlements/*.json`) stand in for a real backend
entitlement service — real tenant-to-package mapping and enforcement server-side is Unknown /
not yet verified.

### Expected Impact
Enables tiered pricing to be enforced in the UI ahead of, or independent from, backend
enforcement, and gives a single reusable pattern for gating any future paid feature.

### Actual Result
Not yet measured — no production tenant/usage data available in this session.

## Outcome

Package/entitlement gating shipped across two releases (0.85.0, 0.86.0) and is now live on
KB routes, GIS/Maps routes, a new Organization Settings subscription panel, and is being used
by two new feature rollouts (`kms` semantic-search toggle, `cc` chat placeholder) as real
consumers of the gate rather than just the initial 43-file foundational commit.

## Impact

- **Technical**: introduced a reusable, tested (139+62 lines of unit tests) entitlement
  resolution + gating layer usable across architecturally different modules.
- **Product**: Not yet measured — no confirmed tier pricing or conversion data available.
- Impact: Not yet measured beyond the technical foundation.

## Evidence

- Commit `8acc496` — feat(core): add tenant entitlements and subscription-based feature gating (43 files, +1881/-22)
- Commit `3c27df1` — chore(release): publish subscription entitlement gating as 0.85.0
- Commit `e84d99d` — feat(core): group Place and Device menus under Map Management
- Commit `545253f` — feat(kms): add semantic search mode toggle with entitlement gating
- Commit `caf8bc4` — feat(cc): add live chat placeholder pages behind entitlement gate
- Commit `6b62dbf` — chore: document anti-regression rule for entitlement gates
- Commit `9fe8d1d` — chore(release): publish entitlement placeholders, map menu, and case overview map as 0.86.0
- Docs: `docs/CC-Super-App-Product-Pricing-Model.md` (untracked, context only, not confirmed linked)

## Career Signals

- Architecture — designed a single cross-module gating primitive rather than duplicating per module
- Ownership — carried the feature from foundational commit through two release rollouts as real consumers adopted it
- Quality — added unit + fixture tests for the resolution logic at introduction time, not after the fact

## Confidence

- Technical implementation: Explicit
- Business/pricing rationale: Unknown
- Task title/grouping: Strongly Inferred (no ticket located)

## Impact Level

L4 — System Improvement (new reusable platform capability spanning 3 modules; business impact not yet measurable)

## Correction — 2026-11-18 (post-delivery audit)

Two statements above were true when written and are no longer true; recorded rather than edited,
per the rule that when a document contradicts the code the code wins and the contradiction gets an
explicit entry.

1. **"added a KB semantic-search toggle gated behind `entitlement.kb.semantic_search`"** — that
   toggle was removed in commit `8cf3d4e` (`chore(kms): remove unused semantic search toggle`)
   because the backend endpoint does not exist. As of today `entitlement.kb.semantic_search` has
   **no UI consumer**; the catalogue entry is retained for the pricing model only.

2. **"live on ... GIS/Maps routes"** — over-stated. `entitlement.gis` was enforced only inside
   `AddressMap` (the map SDK switch) and in the org Map Settings form. Every GIS capability that
   renders without a map stayed open, confirmed by a user report and then by an audit:
   - the assignment picker's **ETA/TTL column** rendered for an unentitled tenant, and its
     Calculate button called the paid routing provider (`routeService`);
   - the **dispatch dashboard heatmap** was ungated (and fetched a 500-case sample);
   - the **case-summary-by-area choropleth** was ungated and fetched district boundary geometry
     from object storage;
   - the top-level **`/cms/dashboard/case-summary-by-area` route** had no `requiredFeature`.
   Also, `staff.etaTtl.applyToAssignmentPicker` and the three `assignment.*` map settings were
   editable in the admin form and read by nobody.

   Fixed in the same session: capability gates at every GIS provider switch, a declarative column
   list in the picker (`officerColumns.ts`), an `enabled` guard on `useOfficerRouteSolves`, the
   route gate, widget-level `feature` declarations (`isWidgetAvailable`), `feature` support in the
   cms sidebar and the topbar "More" menu (both previously unable to express it), the four dead
   org settings wired up, and `FEATURE_SURFACES` + a coverage test so a future catalogue entry
   cannot ship without naming its gate. See the `## Entitlements (paid capabilities)` section of
   `CLAUDE.md`.

