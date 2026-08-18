# SuperApps Structure Guide

Short map for humans and AI.

## Entry

- `kb.routes.tsx`: entry point of the module. Registers routes and wraps shared providers.
- `constant.ts`: shared config and fixed values used across the module.

## Base Libraries

Use these as the default foundation for work in this module:

- `@tanstack/react-query`: server-state fetching, caching, refetching, and async request flow.
- `i18next` + `react-i18next`: translations and localized UI text.
- `antd`: ready-made UI components for forms, tables, modal, and interaction patterns.
- `react-medium-image-zoom`: zoomable image viewer for image preview use cases.

## Main Folders

- `pages/<feature>/index.tsx`: page container. Handles page state, request params, data loading flow, and layout composition.
- `pages/<feature>/dtos`: types for request, response, and internal data shape used by that page.
- `pages/<feature>/hook`: page-level logic that should not live inside JSX, such as data fetching hooks or reusable state logic.
- `pages/<feature>/service`: functions for API calls, payload builders, and data transformation before UI usage.
- `components/<Feature.Block>/index.tsx`: reusable UI block such as card, table, chart, panel, or form section.
- `components/<Feature.Block>/dtos|hook|service|style.css`: files owned by that component only.
- `hook/`: shared hooks used across more than one page or component.
- `contant/`: shared text constants.
- `t/`: translation files.

## Folder Intent

- `pages`: owns screen-level behavior.
- `components`: owns reusable presentation blocks.
- `hook`: owns shared React logic.
- `service`: if present under a page or component, owns side effects and data preparation.
- `dtos`: if present under a page or component, owns type contracts.

## What `dtos`, `hook`, and `service` Are For

- `dtos`: define the shape of data. Use them for request body, response data, props models, and mapped UI data.
- `hook`: isolate reusable React behavior. Use them for fetching, state composition, subscriptions, and derived UI logic.
- `service`: isolate non-UI operations. Use them for calling APIs, building request payloads, formatting response data, and helper logic tied to data flow.

Keep these files close to the owner folder. If the logic is only used by one page or one component, keep it local there.

## Split Rule

- Keep orchestration in `pages/...`.
- Keep reusable UI in `components/...`.
- Keep types in `dtos`.
- Keep React logic in `hook`.
- Keep API and transformation logic in `service`.
- Avoid mixing API code directly inside large JSX files.

## Read Order For AI

1. `kb.routes.tsx`
2. `constant.ts`
3. `pages/<feature>/index.tsx`
4. `pages/<feature>/hook` and `service`
5. `components/<Feature.Block>` used by that page

## Practical Flow

`route -> page -> page hook/service -> component`

Use this rule when adding new work:

- add or update route in `kb.routes.tsx`
- create or update the page in `pages/<feature>`
- extract reusable UI into `components/<Feature.Block>`
- keep `dtos`, `hook`, and `service` near the page or component that owns them
