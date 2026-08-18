# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cloud Contact Center — a React/TypeScript enterprise web app for case management, CRM (products, inventory, appointments), workflow automation, and dashboards. Built on a TailAdmin dashboard template scaffold, but the template branding in `README.md` no longer reflects the actual product.

## Coding Rules

- Avoid `any` unless necessary.
- Break down components to make them smaller and easier to read.
- Write readable code rather than overly short code.
- Do not delete existing code if you don't understand its function.

## Workflow

Before creating or modifying code, follow these steps:

- Read the relevant files first.
- Briefly explain your plan for creating or modifying the code.
- Create or modify only the necessary files.
- Check that the code doesn't affect other parts of the code.
- Summarize what you created or modified after you're finished.

## Tech Stack

- **Framework**: React 19 + TypeScript, built with Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Routing**: React Router v7 (nested `<Routes>` per module, see Module architecture)
- **State**: Redux Toolkit + RTK Query (server state/API); no separate local-state library — component state is plain React `useState`/`useReducer` (e.g. `src/core/hooks/useDashboard.ts`)
- **Data viz**: ApexCharts / react-apexcharts, Recharts
- **Drag & drop**: `@dnd-kit/*`, `react-dnd`, `@hello-pangea/dnd` (different features use different DnD libraries — check the surrounding component before picking one)
- **Calendar/scheduling**: FullCalendar
- **UI primitives**: Headless UI, Radix UI, Lucide icons
- **i18n**: custom JSON-catalog loader (`en`/`th`/`cn`), catalogs served from `public/i18n/` — not Lingui, see i18n section below
- **Persistence**: `idb` (IndexedDB) for offline/case caching, `js-cookie`
- **Linting/typing**: ESLint (`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`); TypeScript is `strict` with `noUnusedLocals`/`noUnusedParameters` on (`tsconfig.app.json`) — unused vars/params fail `pnpm build`, not just lint

## Commands

```bash
pnpm install          # this repo uses pnpm (pnpm-lock.yaml is authoritative; package-lock.json is stale)
pnpm dev              # start Vite dev server on :5173
pnpm build            # tsc -b && vite build
pnpm lint             # eslint .
pnpm preview          # preview a production build
pnpm prod             # build then preview
```

- Mode-specific builds: `vite build --mode <env>` where `<env>` matches one of `.env.dev`, `.env.qa`, `.env.sit`, `.env.staging`, `.env.production` (see Dockerfile `ARG ENVIRONMENT`).
- There is no test runner configured (no `test` script, no test files in `src`). Don't assume Jest/Vitest exists.
- `depcheck`, `ts-prune`, and `unimported` are devDependencies for manual dead-code audits; run via `npx` (no npm scripts wire them up).
- No ESLint/type-check filtering for a single file is scripted — run `pnpm lint` or `tsc -b` directly, or point ESLint/tsc at a specific path.

## Path aliases

Defined in both `vite.config.ts` and `tsconfig.app.json` — keep them in sync if you add a new top-level module:

```text
@/*      -> src/*
@/core/* -> src/core/*
@/ai/*   -> src/ai/*
@/cc/*   -> src/cc/*
@/cms/*  -> src/cms/*
@/kms/*  -> src/kms/*
```

## Module architecture

`src/App.tsx` mounts one `Route` per top-level module under `SuperLayout`, each module owning its own nested `<Routes>`:

- **`core`** — shared platform: auth, layout shell (`SuperLayout`/`SuperSidebar`/`SuperTopbar`), Redux store, RTK Query base APIs, permissions, dashboard widgets (`src/core/components/dashboard/`, `src/core/components/widgets/`), websocket provider, admin (org/user/role) pages. The intended direction is that other modules depend on `core`, not the reverse — but this isn't fully enforced: `core` currently imports from `@/cms` in dozens of places, including real logic (not just types), e.g. `src/core/providers/AuthProvider.tsx` imports `caseApiSetup` from `@/cms/components/case/uitls/CaseApiManager`. Treat `core` → `cms` imports as an existing tangle to work around, not a pattern to extend.
- **`cms`** — the main product surface, mounted at `/cms/*` (see `ROUTE_PREFIX` in `src/core/router/routePrefix.ts` — currently the only module with a registered prefix; `ai`/`cc`/`kms` don't have one) and also the default redirect target (`/` → `/cms`). Contains case management, CRM (products/inventory/orders/services), appointments, workflow builder pages, area/skill/unit admin, and reporting. This is where most feature work happens.
- **`cc`** — a separate, much smaller "Cloud Contact" app (dashboard/workspace) with its own `App.tsx`, still early-stage.
- **`ai`**, **`kms`** — stub modules, essentially empty placeholders for future AI and knowledge-management apps. Don't assume functionality exists there beyond the route mount.

Within `cms` (and to a lesser extent `core`), feature areas follow a consistent split: `components/<feature>`, `pages/<Feature>`, `store/api/<feature>Api.ts` (RTK Query), `store/api/graphql/<feature>Queries.ts` (GraphQL mapping), `types/<feature>.ts`.

## State management

Redux Toolkit store (`src/core/store/index.ts`) combines four RTK Query API slices (`baseApi`, `baseApiCrm`, `baseWelcomeCrmApi`, `graphqlApi`) plus plain slices (`auth`, `notifications`, `realtime`, `ui`). CMS-specific endpoints are injected into the core `baseApi`/`baseApiCrm` via `injectEndpoints` from files under `src/cms/store/api/`, not a separate store.

### Hybrid REST/GraphQL query layer (important, non-obvious)

RTK Query endpoints are written as normal REST calls (`query: () => ({ url: "/area", params })`), but `createHybridBaseQuery` (`src/core/store/api/hybridBaseQuery.ts`) intercepts every request and, when `VITE_USE_GRAPHQL === "true"`, auto-converts it to a GraphQL call by looking up the request's `url` in a global map (`GQL_MAP` in `src/core/utils/gqlMapper.ts`) built by merging per-feature `GQL_<FEATURE>` objects from `**/store/api/graphql/*Queries.ts` files. Each entry maps a REST path to `{ operationName, root, inputType?, fields }`, which `buildGraphQLQuery` turns into an actual GraphQL document.

Implications when adding a new endpoint:

- Add the RTK Query endpoint as usual (REST-shaped `url`).
- If a GraphQL equivalent exists on the BFF, add a matching entry to the relevant `graphql/*Queries.ts` file keyed by the exact REST `url` string, and register it in `GQL_MAP` (`src/core/utils/gqlMapper.ts`).
- There is no REST fallback once GraphQL is enabled (`VITE_USE_GRAPHQL === "true"`): a URL with no `GQL_MAP` entry, or a GraphQL call that errors, is logged via `console.error` and returned to the caller as a hard error — it does not silently retry via REST. This means enabling GraphQL in an environment requires `GQL_MAP` coverage for everything that environment actually calls; any gap is a user-facing failure, not a silent degrade. (The separate `VITE_USE_GRAPHQL !== "true"` switch still routes everything through REST directly, with GraphQL never attempted — that's unaffected.)
- File uploads (variables containing a `File`/`Blob`) are routed through `graphqlBaseQuery` (multipart) instead of `fetchBaseQuery`, since the latter would `JSON.stringify` and lose the file.

## Auth, permissions, and routing guards

- `AuthProvider` (`src/core/providers/AuthProvider.tsx`) + `ProtectedRoute` (`src/core/components/auth/ProtectedRoute.tsx`) gate the whole app in `main.tsx`.
- Permission checks go through `PermissionManager.hasPermission(user, permission)` (`src/core/utils/permissionManager.ts`), enforced via the `PermissionGate` component (`src/core/components/auth/PermissionGate.tsx`) and the `usePermissions` hook (`src/core/hooks/usePermissions.ts`).
- `TokenManager` (`src/core/utils/tokenManager.ts`) is the source of truth for the JWT; RTK Query base queries pull the token from Redux `auth` state or fall back to `TokenManager`.

## Dashboard widgets

Dashboard composition lives in `src/core/hooks/useDashboard.ts` (plain React state, types in `src/core/types/dashboard.ts`: `DashboardWidget`, `WidgetConfig`, `WidgetType`, `DashboardLayout`) plus `src/core/components/dashboard/` (`Dashboard.tsx`, `DashboardGrid.tsx`, `WidgetLibrary.tsx`). Reusable widget components live in `src/core/components/widgets/` (e.g. `MetricWidget.tsx`, `ChartWidget.tsx`, `TableWidget.tsx`); feature-specific widgets live under `src/cms/components/widgets/` (e.g. `CaseStatusWidget.tsx`, `SLAMonitorWidget.tsx`).

## Real-time and offline

`WebSocketProvider` (`src/core/components/websocket/websocket.tsx` — note the file's internal header comment still says `src/crm/...`, ignore it) wraps the app in `main.tsx` with `autoConnect`. It updates local IndexedDB (`idbStorage`, `src/cms/components/idb/idb.tsx`) and case list caches on incoming messages so case data stays live without a full refetch. `VITE_WS_URL` / `VITE_WEBSOCKET_BASE_URL` and the `/ws` Vite proxy (`vite.config.ts`) drive this in dev.

## i18n

Runtime JSON catalogs, not Lingui — `src/core/config/i18n.ts` fetches `/i18n/{lang}.json` (served from `public/i18n/{en,th,cn}.json`) and caches them per language (`th` is default). `LanguageContext`/`LanguageContextObject` (`src/core/context/`) expose the active language and lookup; `TranslationLoader` (`src/core/components/common/TranslationLoader.tsx`) preloads all catalogs and gates initial render until ready (`main.tsx`). To add a translation key, add it to all three files under `public/i18n/`.

Note: `@lingui/*` deps, `.babelrc`, and `lingui.config.js` are leftover from an earlier approach and unused in `src` — don't build new i18n on top of Lingui macros.

## Environment configuration

Per-environment `.env.*` files (`local`/`dev`/`qa`/`sit`/`staging`/`production`) define `VITE_BASE_URL`, `VITE_GRAPHQL_BASE_URL`, `VITE_WEBSOCKET_BASE_URL`, feature flags, and case-list tuning (`VITE_GET_CASE_PER_REQUEST`, SLA warning/alert thresholds in seconds, etc.). `src/core/config/api.ts` resolves these into `API_CONFIG` at runtime (`resolveRuntimeEnv`). These files carry real staging credentials/URLs — treat them as sensitive, don't paste their contents into commits, issues, or external tools.

When `VITE_MOCK_API=true` (checked in `src/core/utils/constants.ts` / `src/cms/utils/constants.ts`), some UI reads from static fixtures instead of the API — `src/core/mocks/*.json` (permissions, roles, users) and `src/cms/mocks/*.json` (appointments, case history, workflow data). If a feature behaves oddly, check this flag before assuming the API integration is broken.

## Known quirks

- **No CI, no git hooks**: there's no `.github/workflows` and no Husky config — don't assume lint/build/tests run automatically on commit or push.
- **`.stylelintrc.json` is orphaned**: the config file exists at the repo root, but `stylelint`/`stylelint-config-standard` aren't in `package.json` or `pnpm-lock.yaml` — there's no `pnpm lint:css` or similar script. Don't assume Stylelint runs anywhere.
- **`src/cms/components/d&d upload/`** has a space and `&` in the directory name — quote the path in any shell command that touches it.
- **Commented-out code is often intentional history, not clutter**: files like `src/core/store/api/baseApi.ts` keep large versioned blocks (`v1.0`, `v2.0`, `v3.0`) of superseded implementations commented out inline instead of deleting them. This is the concrete form the "do not delete existing code you don't understand" rule takes in practice — leave these blocks alone unless asked to clean them up.
- **`createCaseSchedule.tsx`** (`src/cms/components/case/createCase/`) is ~1,000 lines — a known exception to the "break down components" rule, not a pattern to copy into new code.

## Build/deploy notes

- Vite `manualChunks` currently just splits everything under `node_modules` into a single `vendor` chunk; there's commented-out finer-grained chunking left in `vite.config.ts` if bundle-size work is needed later.
- Docker build (`Dockerfile`) is a two-stage build: `npm run build -- --mode ${ENVIRONMENT}` then served via nginx (`nginx.conf`).
- Dev server proxies `/api` and `/ws` to `VITE_BASE_URL`/`VITE_WEBSOCKET_BASE_URL` to avoid CORS in local dev.
