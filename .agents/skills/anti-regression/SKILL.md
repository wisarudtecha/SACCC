---
name: anti-regression
description: Persistent anti-regression discipline — identify mistakes, trace root causes, extract generalizable lessons, convert them into enforceable rules, and review those rules before similar work. Trigger on every correction, identified mistake, requirement violation, incorrect implementation, or rejected result, and proactively before any task that may overlap with previously documented lessons.
---

# Anti-Regression

Persistent discipline for preventing previously identified mistakes from recurring. Review relevant lessons before acting, learn from every meaningful correction, and convert generalizable mistakes into enforceable behavioral constraints.

## Before Every Task

Review the accumulated lessons before starting work.

1. Identify lessons relevant to the current task.
2. Apply their Prevention Rules during analysis and implementation.
3. Check that the planned behavior does not conflict with any documented rule.
4. Do not repeat a documented mistake unless the current context explicitly requires different behavior.

If no lesson is relevant, proceed normally.

---

## 1. Identify the mistake

When a mistake, incorrect implementation, requirement violation, or correction occurs, determine exactly what went wrong.

Capture:

- What the AI produced or did
- What was expected instead
- Which requirement, assumption, or behavior was incorrect
- Whether the issue is a symptom or a broader failure pattern

Do not immediately write a lesson from the surface symptom.

Bad:

> I forgot to add validation.

Good:

> External input was passed directly into business logic without a boundary validation step.

The second statement describes a reusable failure pattern.

---

## 2. Find the root cause

Determine why the mistake happened.

Separate the root cause from the symptom.

Ask:

- What assumption was wrong?
- What requirement was missed or misunderstood?
- What information was ignored?
- What process or reasoning step was missing?
- Was an existing rule not reviewed or not applied?
- Is the failure caused by a broader decision-making pattern?

Do not document a lesson until the underlying cause is understood well enough to prevent recurrence.

---

## 3. Extract the generalizable lesson

Convert the specific incident into a reusable lesson.

The lesson must apply to future tasks beyond the original incident.

Avoid overly specific rules tied only to:

- One ticket
- One file
- One component
- One API
- One bug
- One user correction

Prefer rules describing a class of behavior.

Bad:

> Remember to check the Customer API response in this feature.

Good:

> When integrating with an external API, verify the actual response contract before implementing dependent frontend behavior.

---

## 4. Create an enforceable rule

Convert the lesson into a concrete Prevention Rule.

A good Prevention Rule is:

- Specific
- Actionable
- Generalizable
- Easy to verify
- Applicable before or during implementation
- Strong enough to prevent the same class of mistake

The Prevention Rule is the most important part of every lesson.

Example:

> Whenever accepting external input, validate it at the system boundary before passing it to internal business logic.

The rule must describe what the AI should do, not merely what it should remember.

---

## 5. Check for existing lessons

Before adding a new lesson:

1. Search existing lessons for the same or related root cause.
2. If an existing lesson already covers the behavior, update or strengthen it instead of creating a duplicate.
3. If the new lesson represents a genuinely different failure pattern, add it.
4. Do not create multiple rules that express the same constraint in different words.

Keep the lesson set compact and actionable.

---

## 6. Record the lesson

Every new lesson must use exactly this structure:

### [Lesson Title]

- Date: `YYYY-MM-DD`
- Mistake:
- Root Cause:
- Correct Behavior:
- Prevention Rule:
- Example:

### Recording requirements

**Date**

Date when the lesson was identified.

**Mistake**

Describe the incorrect behavior or result.

**Root Cause**

Explain why the mistake happened.

**Correct Behavior**

Describe what should have happened instead.

**Prevention Rule**

Define the reusable rule that prevents recurrence.

**Example**

Provide a short example demonstrating the rule in practice.

---

## 7. Apply lessons to future work

A documented lesson is an active constraint, not historical documentation.

Before similar work:

1. Review applicable lessons.
2. Translate their Prevention Rules into implementation constraints.
3. Check the solution against those constraints.
4. Verify that the previous failure pattern has not been reintroduced.

If a documented rule conflicts with a new explicit requirement, follow the current requirement and recognize that the existing rule may need to be updated.

---

## 8. Handle corrections

Every meaningful correction is a potential learning event.

When the user corrects the AI:

1. Determine what was wrong.
2. Determine why it happened.
3. Check whether the cause is generalizable.
4. Check existing lessons.
5. Add a new lesson or strengthen an existing lesson when appropriate.
6. Apply the resulting rule to future similar work.

Do not record purely contextual corrections that cannot reasonably prevent future mistakes.

---

## 9. Preserve rule integrity

Existing lessons must not be silently removed, weakened, or contradicted.

Change an existing rule only when:

- The rule is incorrect.
- The rule is too broad or too narrow.
- A new requirement explicitly supersedes it.
- A better general rule replaces it.

When a rule is superseded, update the lesson deliberately rather than silently deleting its history.

---

## Operating Rules

- Review relevant lessons **before** every task.
- Treat every meaningful correction as a potential new lesson.
- Identify the **root cause**, not merely the symptom.
- Generalize lessons beyond the original incident.
- Convert lessons into **concrete Prevention Rules**.
- Check for duplicate or overlapping lessons before adding new ones.
- A Prevention Rule is an active constraint for future work.
- Do not repeat a documented mistake unless the current context explicitly requires different behavior.
- Do not create lessons for purely contextual or non-generalizable corrections.
- Do not weaken an existing rule merely because applying it is inconvenient.
- If an existing rule conflicts with a newer explicit requirement, follow the newer requirement and update the rule accordingly.
- Keep the lesson set concise, reusable, and actionable.

If you catch yourself repeating a documented mistake, stop, identify which Prevention Rule should have prevented it, and correct the process before continuing.

---

# Lessons

### A truthiness check is not a success check
- **Date:** 2026-08-25
- **Mistake:** Tree/entity reads across the area surfaces tested `Boolean(response.data)` to decide
  whether the server returned something. Three countries whose area tree had never been generated
  answered `{ status: "-1", data: null }` with HTTP 200, and those failures were rendered as real
  countries — blank hierarchy rows, `undefined (undefined)` select options, nameless map
  boundaries. Separately, `isApiSuccess` ended in `return Boolean(status)`, and `Boolean("-1")` is
  `true`, so the BFF's own failure code printed a **success** toast over a rejected write.
- **Root Cause:** Two coercions stacked. `hybridBaseQuery` fulfils a business failure (only
  transport and GraphQL-schema faults became RTK errors), and `normalizeToApiResponse` coerces
  `data: extracted?.data ?? []`. `Boolean([])` is `true` and `Boolean("-1")` is `true`, so both the
  payload and the status code read as positive evidence when they were the opposite.
- **Correct Behavior:** Decide success from the envelope's `status` via
  `readEnvelopeStatus` (`src/core/utils/apiResponseStatus.ts`), and decide "is there data" from the
  payload's **shape** via a type guard that rejects arrays. `hybridBaseQuery` now rejects a
  conclusive failure envelope; an inconclusive one still resolves by design, so the shape guard is
  still required at the read site.
- **Prevention Rule:** In this codebase an API payload is never validated by truthiness. `[]` is
  truthy and is what a null payload becomes; `"-1"` is truthy and is what a failure looks like.
  Before treating a response as data, check the status with `readEnvelopeStatus` and the payload
  with a `value is T` guard that asserts a required field and excludes `Array.isArray`. The same
  applies to any new numeric- or string-coded status: test the token, never the truthiness.
- **Example:**
  ```ts
  // WRONG - [] is truthy, so an un-generated tree becomes a country
  const trees = results.filter((tree): tree is AreaCountryTree => Boolean(tree));

  // CORRECT - src/cms/utils/areaTree.ts
  export const isAreaCountryTree = (value: unknown): value is AreaCountryTree =>
    Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && typeof (value as AreaCountryTree).countryId === "string";
  ```

### Count the request ids before calling repeated calls a duplication bug
- **Date:** 2026-08-25
- **Mistake:** "The same endpoint is called four times per page load" was initially read as a
  missing-dedupe bug in `boundarySource.ts`.
- **Root Cause:** The calls were a fan-out — one per country — not a repeat. RTK Query already
  deduplicates concurrent `initiate` calls that share an argument, so N network requests to one
  endpoint means N distinct cache keys, and differing responses prove it outright.
- **Correct Behavior:** Compare the request **arguments**, not just the endpoint name, and treat
  a mix of failures and successes across "duplicate" calls as evidence they are not duplicates.
- **Prevention Rule:** Before proposing a caching or dedupe fix for repeated RTK Query calls,
  confirm the calls share a cache key. If the responses differ, the fan-out is the design and the
  real defect is elsewhere.

### A loading gate that swaps out a subtree throws away its state
- **Date:** 2026-08-26
- **Mistake:** The area hierarchy came back fully collapsed after every create, edit and delete.
  This read as "expansion is not persisted", when nothing was ever asked to persist it.
- **Root Cause:** `HierarchyView` holds `expandedItems` in local state seeded once at mount, and
  `AreaManagement` rendered the tree behind `{!isLoading && ...}`. A write calls
  `refreshAfterWrite` → `reloadTrees`, `useOrgAreaTrees` sets `isLoading`, the gate swapped the
  tree for a placeholder, and unmounting destroyed the state. The reload was the trigger, but the
  gate was the cause.
- **Correct Behavior:** Show the full-page placeholder only when there is nothing to show
  (`isLoading && !hasRecords`) and keep the rendered subtree mounted through a refresh, saying so
  with an inline indicator. `useOrgAreaTrees` deliberately keeps the previous data until the
  refetch settles, so there is always something to keep on screen.
- **Prevention Rule:** Before adding or trusting a `{!isLoading && <X/>}` gate, ask what state
  lives inside `X`. Expansion, scroll position, selection, in-progress input and focus all die on
  unmount. If the component owns any of it and the flag can flip while the user is working, gate
  on "have data at all", not on "is fetching".
- **Example:**
  ```tsx
  // WRONG - every refetch unmounts the tree and folds it back up
  {isLoading && <Placeholder />}
  {!isLoading && hasRecords && <AreaHierarchyView ... />}

  // CORRECT - the placeholder is for the empty first load only
  {isLoading && !hasRecords && <Placeholder />}
  {isLoading && hasRecords && <InlineRefreshingNote />}
  {hasRecords && <AreaHierarchyView ... />}
  ```

### A page reload is not a cache invalidation
- **Date:** 2026-08-26
- **Mistake:** `ServiceManagement` and `OrganizationManagement` ended every successful write with
  `setTimeout(() => window.location.replace(...), 1000)` — ten call sites navigating the app to
  itself to show what had just been saved.
- **Root Cause:** Their mutations carried no `invalidatesTags`, so nothing refetched. In
  `organizationApi` every tag was commented out, and each commented line said `providesTags` even
  on mutations, where it would have done nothing had it been uncommented. `"Organization"` was
  also absent from `commonTagTypes`, and an unregistered tag is silently inert — the same trap
  already recorded against `"Store"` in `baseApi.ts`.
- **Correct Behavior:** Mutations `invalidatesTags`, queries `providesTags`, and every tag name
  is registered in the slice's `tagTypes`. Writes then refresh the lists in place, and the
  component keeps its state: modal close and form reset become explicit instead of being done by
  the reload.
- **Prevention Rule:** Treat `window.location.replace` / `reload` after a mutation as a defect
  report, not a pattern to copy: it discards every piece of UI state the user built up. Fix the
  cache wiring instead, and when adding a tag check three things — the mutation invalidates, the
  query provides, and the name is in `tagTypes`. Removing such a reload also means taking over
  whatever it used to do implicitly (closing the dialog, clearing the form).

### A hidden input is not write protection
- **Date:** 2026-08-26
- **Mistake:** Moving PII masking to the backend, the plan was to render fields the user may not
  see as plain text instead of inputs, and call the write path handled. It was not: an agent
  without `pii.customer.*` who fixed a typo in a customer's surname would have written
  `••••1234` over the real phone number.
- **Root Cause:** `CustomerCreate`'s `handleSubmit` builds its PATCH body from `formData`, not
  from the DOM (`{ ...formData, ... }`). Once the server returns pre-masked records, the redacted
  string *is* the form state. Removing the input changes what the agent can type into; it changes
  nothing about what gets submitted. The same applies to `disabled`/`readOnly`, which is why the
  older `lockPiiInput` deliberately blanked the *display* while leaving the real value in state.
- **Correct Behavior:** Drop the unviewable keys from the payload (`omitUnviewableCustomerPii`),
  skip their validation so an untouched redacted field can't block an unrelated save, and render
  text so the affordance matches. Check the indirect paths too — `displayName` fell back to the
  email address and would have carried the redaction in through the back door.
- **Prevention Rule:** When a value can arrive already redacted, trace it to the *submit payload*,
  not to the input. Ask: what does this form actually send, and is this field in it? A feature
  flag that disables masking must never disable the write protection with it — masking is a
  display question, "may this user edit this field" is a permission question, and they have to be
  switched separately.
- **Example:**
  ```tsx
  // WRONG - looks protected, still PATCHes the mask over the record
  {canView ? <Input value={formData.email} .../> : <p>{formData.email}</p>}
  await update({ id, data: { ...formData } });

  // CORRECT - the key never leaves the client
  {canView ? <Input value={formData.email} .../> : <MaskedField path="email" value={formData.email} />}
  await update({ id, data: omitUnviewableCustomerPii(payload, canViewField) });
  ```


### A component declared inside a render is a new component every render
- **Date:** 2026-08-27
- **Mistake:** Adding the editable Properties tab to the unit preview, `PropertyTab` was declared
  as a `const` inside `UnitManagementComponent` — copying the shape of the `SkillTab` already
  there. Every click on a property toggle made the whole matrix visibly blink out and back.
- **Root Cause:** A component declared in a render body is a brand-new function object each time
  the parent renders. React compares `element.type` by reference, so a new identity means unmount
  the old subtree and mount a fresh one — every descendant loses its state and its DOM. Toggling
  set `propertyIds` in the parent, which re-rendered it, which remounted the matrix.
  `PropertyMatrixContent` seeds `maxHeight` to `0` and only fills it in from a post-mount effect,
  so the remount painted one frame at `max-height: 0` — the visible half of the flicker. The
  identical defect sat in `SkillTab` unnoticed for as long as that tab stayed read-only: nothing
  in it set parent state, so nothing ever triggered the remount.
- **Correct Behavior:** Hoist tab bodies to module scope and pass what they need as props
  (`UnitSkillTab`, `UnitPropertyTab`). Identity is then stable, React reconciles instead of
  remounting, and child state survives. Separately, seed layout state lazily
  (`useState(calcMatrixMaxHeight)`) so even a genuine first mount never paints at zero.
- **Prevention Rule:** Never declare a component inside another component's body — not even a
  small one, not even "just for this tab". If it takes hooks or props, it belongs at module
  scope; if it is pure markup, inline the JSX instead of wrapping it in a component. The symptom
  only appears once something in the subtree triggers a parent state change, so the absence of a
  flicker today is not evidence the code is correct. Same consequence as
  "A loading gate that swaps out a subtree throws away its state" — different trigger, and worth
  checking both when a UI resets itself for no obvious reason.
- **Example:**
  ```tsx
  // WRONG - new PropertyTab identity per render, so every parent state change remounts it
  const Parent = () => {
    const [ids, setIds] = useState<string[]>([]);
    const PropertyTab = ({ item }) => <Matrix ids={ids} onToggle={setIds} item={item} />;
    return <Preview tabs={[{ render: item => <PropertyTab item={item} /> }]} />;
  };

  // CORRECT - stable module-level identity, state passed in
  const PropertyTab = ({ item, ids, onToggle }) => <Matrix ids={ids} onToggle={onToggle} item={item} />;
  const Parent = () => {
    const [ids, setIds] = useState<string[]>([]);
    return <Preview tabs={[{ render: item => <PropertyTab item={item} ids={ids} onToggle={setIds} /> }]} />;
  };
  ```

### RTK Query's `data` is not scoped to the arg you asked for
- **Date:** 2026-08-27
- **Mistake:** The unit preview's Assigned Properties showed the PREVIOUS unit's properties
  whenever the newly previewed unit had none. A hand-rolled "is the shared query pointed at this
  record yet" guard was already in place and did not catch it.
- **Root Cause:** `const { data } = useGetUnitPropertiesQuery({ id: selectedUnitId })`. RTK Query
  defines `data` as *the latest returned result regardless of hook arg* — on an arg change it
  keeps serving the previous arg's payload until the new arg yields a **successful** result. When
  the BFF answers an empty set with a failure envelope (`hybridBaseQuery` turns that into a real
  RTK error), the new arg never yields one, so `data` stayed on the old unit indefinitely. The
  guard could not see this: it compared ids and `isFetching`, both of which had already settled
  into the "ready" state while `data` was still stale. A second hole compounded it — `assigned`
  was gated on `!isLoading`, and `isLoading` was itself gated on `hasUnitId`, so a record with a
  blank `unitId` bypassed the guard entirely.
- **Correct Behavior:** Destructure `currentData`, which is scoped to the current hook arg and is
  `undefined` until that arg itself resolves. Gate derived view state on the positive condition
  (`isReady && !isFetching`), never on the negation of a flag that has its own preconditions.
- **Prevention Rule:** Whenever a query arg is driven by which record the user is looking at —
  preview modals, master/detail, tabs over a selected row — read `currentData`, not `data`. Treat
  `data` as "last success this hook ever saw", because that is what it is. And remember this
  codebase's envelope rule: an empty result can arrive as a *failure*, so "no rows" and "request
  errored" are the same event to RTK — which is exactly the case where the stale-`data` fallback
  is visible and permanent.
- **Example:**
  ```tsx
  // WRONG - on unit change, keeps rendering the previous unit until the new one SUCCEEDS
  const { data, isFetching } = useGetUnitPropertiesQuery({ id: selectedUnitId });
  const rows = (data?.data as UnitProperty[]) || [];
  <Assigned rows={isLoading ? [] : rows} />

  // CORRECT - arg-scoped read, and the view gates on the positive condition
  const { currentData, isFetching } = useGetUnitPropertiesQuery({ id: selectedUnitId });
  const rows = (currentData?.data as UnitProperty[]) || [];
  const visible = (isReady && !isFetching) ? rows : [];
  <Assigned rows={visible} />
  ```

### Reading a guard through a ref removes the effect's reason to re-run
- **Date:** 2026-08-27
- **Mistake:** The boundary sketch layer's "stored rings -> what is on the map" effect skipped
  itself while a gesture was running, by reading `modeRef.current !== "idle"`. Cancelling a draw
  then left the map blank: the polygon that had been on it was gone, and the boundary was still
  in the field's value with nobody left to redraw it.
- **Root Cause:** Starting a draw clears the layer, and cancelling one restores nothing - the
  stored rings never changed, so their identity never changed either. The effect's only other
  dependency was `isReady`. Returning to idle WAS the event that should have redrawn, and reading
  the mode through a ref is precisely what hid that event from React. The ref made the guard
  correct and the trigger absent.
- **Correct Behavior:** Depend on `mode` and guard on the dependency (`if (mode !== "idle") return`).
  The effect then re-runs on the transition, and an idempotence check - here a signature compare
  against what is already drawn - keeps the extra runs free.
- **Prevention Rule:** A ref belongs in an effect for values it must READ WITHOUT re-running for
  (callbacks, the theme in a build-once effect). The moment a value decides *whether the effect
  should do its work*, it is a dependency, because every transition of it is a reason to re-run.
  When the worry is "this will now run too often", the answer is an idempotence check inside the
  effect, not a ref outside its dependency list.
- **Example:**
  ```ts
  // WRONG - returning to idle is invisible, so nothing ever restores the polygon
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    if (!isReady || modeRef.current !== "idle") return;
    redraw(rings);
  }, [isReady, rings]);

  // CORRECT - the transition re-runs it; the signature check makes repeats free
  useEffect(() => {
    if (!isReady || mode !== "idle") return;
    if (ringsSignature(rings) === renderedSignatureRef.current) return;
    redraw(rings);
  }, [isReady, rings, mode]);
  ```

### An RTK Query endpoint edit does not reach the browser on hot reload
- **Date:** 2026-08-28
- **Mistake:** `updateAppointmentType`'s body was fixed to stop leaking `appointmentTypeId` into
  the GraphQL input, `tsc -b` passed, and the change was reported as done — but the app kept
  sending the OLD payload. The mapping was blamed next; the mapping was never the problem.
- **Root Cause:** Vite invalidates the edited `src/cms/store/api/*.ts` module, and every importer
  is a `.tsx` module with a default component export — a React Fast Refresh boundary — so the
  update is hot-applied instead of triggering a full page reload. The module re-executes,
  `injectEndpoints` runs a second time against the same api slice, and RTK Query 2.x skips any
  endpoint name it has already registered unless `overrideExisting: true` is passed
  (it `console.error`s and `continue`s). The original `query` closure keeps serving requests.
- **Correct Behavior:** Every `injectEndpoints` call in `src/**/store/api/` now passes
  `overrideExisting: import.meta.env.DEV`, so dev re-injection replaces definitions while the
  production guard is untouched. Keep passing it on any new api slice file.
- **Prevention Rule:** When a verified code change appears to have no effect at runtime, suspect
  the runtime before re-editing the code: a registry that is populated once per module evaluation
  (RTK endpoints, event listeners, singleton caches) survives HMR with its FIRST values. Confirm
  with a hard reload / dev-server restart before forming a second theory — and treat
  "`tsc -b` passes" as evidence the code compiles, never as evidence the browser is running it.
- **Example:**
  ```ts
  // WRONG - after an HMR update, the previously registered `query` is what still runs
  export const appointmentTypeApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: builder => ({ /* ... */ }),
  });

  // CORRECT - dev re-injection replaces the definitions; production keeps the guard
  export const appointmentTypeApi = baseWelcomeCrmApi.injectEndpoints({
    endpoints: builder => ({ /* ... */ }),
    overrideExisting: import.meta.env.DEV,
  });
  ```

### Close the dialog that is on screen, not the one you opened from
- **Date:** 2026-08-28
- **Mistake:** In `ServiceManagement.tsx` the Type and Sub-Type confirmation modals stayed on
  screen after Confirm. The save itself worked — the toast fired and the list refreshed behind a
  dialog the user had to dismiss by hand.
- **Root Cause:** A two-step flow with two independent flags: Save does
  `setTypeConfirmIsOpen(true); setTypeIsOpen(false)`, so by the time `handleTypeSave` runs, the
  form modal is already closed and the confirm modal is the visible one. The handler's `finally`
  closed `typeIsOpen` — a no-op — and never touched `typeConfirmIsOpen`. A second path was worse:
  the `if (errors.length > 0) return;` guard sits BEFORE the `try`, so `finally` never runs at all,
  and the messages `validateType()` sets render inside the form modal, hidden behind the confirm
  dialog — Confirm appeared to do nothing, with no exit but Cancel.
- **Correct Behavior:** The `finally` closes every flag the flow may have opened
  (`setTypeConfirmIsOpen(false); setTypeIsOpen(false)`), and the validation guard hands control
  back to the step that can display its errors (`setTypeConfirmIsOpen(false); setTypeIsOpen(true)`).
  `AppointmentTypeManagement.tsx` is the reference: its `finally` closes both flags.
- **Prevention Rule:** In a multi-step modal flow, the handler runs in a LATER step than the one
  that called it — close by asking "which flags can be true right now?", never "which modal did
  this button live in?". And any `return` placed before the `try` opts out of the `finally`
  cleanup: either move the guard inside the `try`, or repeat the teardown on that branch.

### An ArcGIS SDK error is not an `instanceof Error`
- **Date:** 2026-08-28
- **Mistake:** `isAbortError` in `ArcgisAddressMap.tsx` was written as
  `error instanceof Error && error.name === "AbortError"`. It never returned true, so both of its
  guards were dead: every React StrictMode remount logged "Failed to load basemap from the ArcGIS
  styles service; using fallback" and ran the fallback branch, and a view destroyed mid-load would
  have surfaced a user-visible "Failed to initialise map" through `onError`.
- **Root Cause:** `@arcgis/core/core/Error` is a standalone class that does NOT extend the native
  `Error` — it just sets `type`, `name`, `message`, `details` on itself. The give-away in the
  console is the `type: 'error'` field and a minified constructor name (`_r`), not `Error`.
- **Correct Behavior:** Delegate to the SDK's own duck-typed helper,
  `promiseUtils.isAbortError(error)` from `@arcgis/core/core/promiseUtils.js` (typed
  `(error: unknown) => boolean`). It matches on `error.name` alone, with no prototype test.
- **Prevention Rule:** Never narrow a third-party SDK's rejection with `instanceof Error`. Check
  the library's error class in `node_modules` first, and prefer the library's own type guard when
  it ships one. A guard that silently never matches is worse than no guard: it converts expected
  noise into a false failure report and drowns the real failure it was written to catch.

### An empty GeoJSON FeatureCollection loads as a table, not as an empty layer
- **Date:** 2026-08-28
- **Mistake:** The `boundary-country` `GeoJSONLayer` failed with
  `featurelayerview:table-not-supported`, and nothing in the app noticed: the Country toggle in
  the boundary picker was silently inert and `setIsError` never fired.
- **Root Cause:** No country has a drawn polygon, so `buildLevelData` emits
  `{"type":"FeatureCollection","features":[]}`. GeoJSONLayer infers `geometryType` from the parsed
  features, so it stays `null`; `get isTable(){ return this.loaded && null == this.geometryType }`
  is then true, and `FeatureLikeLayerView2D` refuses to create a view for a table. `layer.load()`
  RESOLVES — a table is a valid loaded layer — so the `.catch` on it can never report this.
- **Correct Behavior:** Declare `geometryType: "polygon"` on the layer. The parser takes the
  declared value as its seed and only infers when it is null, and the layer's post-load
  `revertToOrigin` covers `objectIdField`/`fields`/`timeInfo` only, so a declared value survives.
- **Prevention Rule:** Data-driven layers must be correct at zero rows, not just at the row count
  the current tenant happens to have — a fresh org would have hit this at all three levels. And
  when a resource can fail AFTER its `load()` promise resolves (layer views, workers, render
  pipelines), a `load().catch()` is not error handling: find the stage that actually reports, or
  accept that the failure is console-only and say so in a comment.


### A phantom dependency can load a second copy of a context-based library
- **Date:** 2026-08-28
- **Mistake:** `/kms/articles` threw `useNavigate() may be used only in the context of a <Router>
  component.` at `src/kms/articles/index.tsx:21`, even though `main.tsx` mounts `<BrowserRouter>`
  above the whole tree. The stack pointed at a component nested many levels inside the Router, so
  the message was actively misleading — nothing was rendered outside the provider.
- **Root Cause:** `node_modules/react-router` was a real directory at 7.6.2 (an orphan left by the
  stale `package-lock.json` npm install), while pnpm linked `react-router-dom` 7.13.0 to its own
  `react-router` 7.13.0 in `.pnpm`. 16 files import from bare "react-router" — a package that was
  never declared in `package.json` — so they resolved to the orphan. Two physical copies means two
  `createContext()` calls: the provider published on one `NavigationContext`, the hook read the
  other, got `undefined`, and threw the "outside a Router" invariant.
- **Correct Behavior:** Declare the package explicitly (`"react-router": "7.13.0"`, exact, matching
  what `react-router-dom` pins), add `resolve.dedupe` in `vite.config.ts`, then
  `rm -rf node_modules/react-router node_modules/.vite && pnpm install`. Vite's optimizer keys its
  cache on `browserHash`, so a stale `node_modules/.vite` keeps serving the old copy after the fix.
- **Prevention Rule:** "Used outside its provider" from a context-based library (React Router,
  Redux, React Query, any `createContext` package) means *check for duplicate copies before
  checking the component tree*. Two fast, conclusive checks: `require.resolve` the package from the
  repo root and from the consuming package's directory — they must return the same path; and grep
  the `// node_modules/...` provenance comments in `node_modules/.vite/deps/<pkg>.js`, which name
  the exact tree each prebundle came from. Root causes that are not symlinks under pnpm are
  orphans, not dependencies. Also: importing a package absent from `package.json` works only by
  accident of hoisting — grep for bare specifiers that no manifest declares.
- **Example:** `node_modules/.vite/deps/react-router.js` carried
  `// node_modules/react-router/dist/development/chunk-…` while `react-router-dom.js` carried
  `// node_modules/.pnpm/react-router@7.13.0_…/…`. After the fix, both entries import
  `NavigationContext` from one shared `chunk-SQN6XHDY.js` and shrank from 385 KB / 457 KB to
  6 KB / 14 KB.

### `t` from useTranslation is a new function every render
- **Date:** 2026-08-31
- **Mistake:** `LongdoSearchBox`'s debounce effect listed `t` in its dependency array and opened with
  an unconditional `setCandidates([]); setIsSearching(false)` for terms shorter than the search
  floor. Opening the case creation form produced an endless
  "Maximum update depth exceeded" loop before a single character was typed.
- **Root Cause:** Two independent faults that only loop together. `useTranslation`
  (`src/core/hooks/useTranslation.ts`) returns `t: translate`, where `translate` is declared inside
  the hook body — so it is a **new function identity on every render** and can never satisfy a
  dependency comparison. And `setCandidates([])` hands React a fresh array every call, so the state
  never compares equal and React's bail-out never engages. Effect runs → sets state → re-render →
  new `t` → effect runs again.
- **Correct Behavior:** Keep `t` out of dependency arrays. Read it through a ref
  (`translateRef.current = t`) the same way this folder already holds `onError`/`onSelect`, and make
  any state write in an effect idempotent: `setCandidates(previous => previous.length === 0 ? previous : [])`.
- **Prevention Rule:** In this codebase, `t` from `useTranslation` is **never** a valid dependency —
  neither is any other value rebuilt inside a hook body. Before adding a dependency to a `useEffect`
  that writes state, ask whether that value is referentially stable across renders; if it is a
  function or an object literal, hold it in a ref instead. Separately, never write a fresh `[]` or
  `{}` into state unconditionally from an effect — pass the updater form and return `previous`
  unchanged when there is nothing to clear, so a stray re-run cannot become a loop.
  (`useMemo` with `t` is merely wasted work, not a loop — the rule is about effects that set state.)
- **Example:**
  ```ts
  // WRONG - new `t` each render re-runs this, and [] is always a new identity
  useEffect(() => {
    if (term.length < MIN) { setCandidates([]); return; }
    // …
  }, [term, t]);

  // CORRECT - src/cms/components/case/createCase/map/longdo/LongdoSearchBox.tsx
  const translateRef = useRef(t);
  translateRef.current = t;
  useEffect(() => {
    if (term.length < MIN) {
      setCandidates(previous => (previous.length === 0 ? previous : []));
      return;
    }
    // …
  }, [term, language]);
  ```

### A pure helper in an SDK-bound module drags the whole SDK with it
- **Date:** 2026-09-01
- **Mistake:** The Longdo sketch hook imported `ringsSignature` - a one-line `JSON.stringify` - from
  `map/sketch/sketchGeometry.ts`. That file also imports `@arcgis/core`'s `Polygon`,
  `SpatialReference` and `webMercatorUtils`, so the Longdo-only chunk went from 25 KB to **210 KB**
  and shipped Esri geometry into a build configured to use a different map SDK entirely.
- **Root Cause:** Bundlers resolve imports per MODULE, not per binding. Importing one tree-shakeable
  function from a module still evaluates that module's import graph, and a side-effectful vendor SDK
  is not tree-shaken away. Nothing in the type system or the linter says a word about it.
- **Correct Behavior:** Provider-neutral helpers live in provider-neutral modules. `ringsSignature`
  moved to `@/cms/utils/areaGeometry`, which imports nothing but types, and both sketch layers import
  it from there. The chunk went back to 31 KB.
- **Prevention Rule:** Before importing anything into a provider-specific module (`map/longdo/**`),
  check what the SOURCE module imports, not just what you are naming. If a shared helper is pure,
  it belongs beside the other pure helpers (`@/cms/utils/*`, `*Types.ts`), never in a file that
  imports a rendering SDK. The check that catches this is a build, not a type-check: compare the
  provider chunk's size before and after, and treat an unexplained jump as a leak rather than as
  the feature being big.
- **Example:**
  ```ts
  // WRONG - pulls @arcgis/core into a Longdo-only chunk for one JSON.stringify
  import { ringsSignature } from "../../sketch/sketchGeometry";

  // CORRECT - src/cms/utils/areaGeometry.ts imports only types
  import { MIN_RING_POINTS, closeRing, ringsSignature, roundRing } from "@/cms/utils/areaGeometry";
  ```

### Adding CRUD to a read-only entity: reuse its cache tag, and check `deleteItem`'s signature
- **Date:** 2026-09-10
- **Mistake risk:** Device Management (`system-configuration/device/DeviceManagement.tsx`) added
  create/update to the previously read-only `deviceIoTApi`. Two traps: (1) minting a fresh RTK
  cache tag would have left the case-map Device layer (`getDevicesInBounds`) stale after an admin
  edit; (2) `EnhancedCrudContainer`'s `deleteItem` prop is `(id: string) => Promise<unknown>` -
  it never passes the row, so a *soft* delete (PATCH `active: false`) has nothing to build the
  body from unless the callback closes over the loaded `data`.
- **Root Cause:** RTK Query refetches a query only when a mutation invalidates a tag that query
  `provides`. A new tag no existing query provides refreshes nothing. And a container callback's
  signature is the contract - "delete" there means "I have an id", not "I have the entity".
- **Correct Behavior:** Both new mutations `invalidatesTags: ["Device Iot"]`, the same tag
  `getDeviceIoT` **and** `getDevicesInBounds` already `provide`, so one edit refreshes the admin
  list and the dispatcher's map together. `softDeleteDevice(id)` does `data.find(d => d.id === id)`
  then PATCHes `{ ...toDeviceUpdateData(row), active: false }`.
- **Prevention Rule:** When extending a read-only `*Api.ts` with mutations, grep the file for the
  tag its queries `provide` and reuse it - do not add a new one unless the read and write genuinely
  address different caches. Before wiring `EnhancedCrudContainer.deleteItem` to anything other than
  a plain hard `DELETE`, re-read its type in `EnhancedCrudContainer.tsx` - it is id-only.
- **Also:** new fields on a shared read model (`Device` gained `en`/`th`/`active`) must be
  **optional** if any existing consumer constructs the object as a literal
  (`deviceBoundsStub.ts`, test helpers) - a required field breaks `tsc -b` at every such site,
  and the BFF may not echo the field yet anyway.

### A new menu item added to the sidebar is not automatically in the topbar
- **Date:** 2026-09-14
- **Mistake:** Adding the Case Summary by Area page added a sidebar entry in
  `src/cms/layout/AppSidebar.tsx` but not the mirrored entry in `src/core/layout/SuperTopbar.tsx`'s
  "More" dropdown — reported by the user as a recurring mistake. Auditing the two files side by
  side while fixing it found a second, pre-existing instance of the exact same gap: `area-template`
  (Area Templates) was in the sidebar's `system_configuration` group with no counterpart in the
  topbar's `system_config` group.
- **Root Cause:** `AppSidebar.tsx` and `SuperTopbar.tsx` are two independently hand-maintained
  arrays of menu items — there is no shared source of truth, no shared config, and nothing that
  fails to compile or fails a test when one is updated and the other isn't. Adding a route to one
  file is silently easy to treat as "done" without ever looking at the other.
- **Correct Behavior:** Any time a menu item is added to (or removed from) `AppSidebar.tsx`'s
  `mainItems`, add the mirrored entry to the matching group in `SuperTopbar.tsx`'s `moreItems` in
  the *same* change — both use `permissions.hasPermission(...)`/`hasAnyPermission(...)` gates and a
  `t(...)` label, so the shape to copy is already established. Add the i18n keys for both
  (`navigation.sidebar.main.*` and `navigation.super_app.topbar.more.menu.*`) together too, not one
  at a time.
- **Prevention Rule:** Before reporting a "new menu item" task as complete, grep both
  `src/cms/layout/AppSidebar.tsx` and `src/core/layout/SuperTopbar.tsx` for the feature's route
  path. If the path appears in only one file, the task is not finished. Treat this as a mandatory
  last step, the same way i18n keys must land in all three `public/i18n/*.json` files.
- **Example:**
  ```tsx
  // AppSidebar.tsx — added, but incomplete on its own
  {
    name: t("navigation.sidebar.main.dashboard.nested.case_summary_by_area"),
    path: "/dashboard/case-summary-by-area",
    permission: permissions.hasPermission("dashboard.view"),
  }

  // SuperTopbar.tsx — the required mirror, same permission, prefixed with the cms mount path
  // because the topbar renders outside the cms router (unlike the sidebar)
  {
    icon: <Map />,
    name: t("navigation.super_app.topbar.more.menu.dashboard_analytic.sub_menu.case_summary_by_area"),
    path: "/cms/dashboard/case-summary-by-area",
    permission: permissions.hasPermission("dashboard.view")
  }
  ```

### Never call a context-consumer hook inside the component that provides that context
- **Date:** 2026-09-25
- **Mistake:** `useEntitlementsBootstrap()` was invoked directly in `AuthProvider`'s component
  body (`src/core/providers/AuthProvider.tsx`). The hook calls `useAuth()`, which reads
  `AuthContext` — a context only available *below* `<AuthContext.Provider>`. The app crashed on
  first render with `Uncaught Error: useAuth must be used within an AuthProvider`.
- **Root Cause:** A React component cannot consume the context it provides: the
  `<AuthContext.Provider>` element only exists in the component's returned JSX, so any hook in
  its own body runs *outside* the provider's scope. Mounting a hook "where the lifecycle lives"
  feels co-located but is exactly the wrong place when the hook reads that same context.
- **Correct Behavior:** Mount context-consuming bootstrap/effect hooks in a child component
  rendered inside the provider — here, a render-null `<EntitlementsBootstrap />` placed inside
  `<AuthContext.Provider>` in AuthProvider's JSX. Redux hooks (`useAppDispatch`/`useAppSelector`)
  are unaffected because `<Provider store>` wraps `AuthProvider` in `main.tsx`, but any hook
  reading `AuthContext` must sit below it in the tree.
- **Prevention Rule:** Before calling a custom hook inside a provider component, check every
  context hook it (transitively) calls. If any of those contexts is the one the component
  provides, extract a child component and mount it inside the provider's JSX instead. Verify
  with a runtime smoke check (dev server / first render), not just `tsc` — this class of bug
  type-checks perfectly and only fails at render time.
- **Example:**
  ```tsx
  // WRONG — crashes at render: useAuth() runs outside AuthContext.Provider
  export const AuthProvider = ({ children }) => {
    useEntitlementsBootstrap(); // calls useAuth() internally
    return <AuthContext.Provider value={v}>{children}</AuthContext.Provider>;
  };

  // RIGHT — the hook runs in a child, below the provider
  export const AuthProvider = ({ children }) => (
    <AuthContext.Provider value={v}>
      <EntitlementsBootstrap /> {/* calls useEntitlementsBootstrap(), returns null */}
      {children}
    </AuthContext.Provider>
  );
  ```

### Server-provided user fields typed as required are not guaranteed — backfill at the trust boundary
- **Date:** 2026-09-25
- **Mistake:** The entitlement bootstrap keyed fixture lookup off `user.organization`, typed as a
  *required* string in `src/core/types/auth.ts`. The frontend stores the BFF login response's
  `user` object verbatim (no `transformResponse`, no mapping), so if the backend omits the field,
  the lookup key was silently `undefined`, `loadEntitlements` never dispatched, and every
  entitlement gate silently reported "not locked" — no error, no badge, no way to notice from the
  UI.
- **Root Cause:** TypeScript's static guarantee (`organization: string`) was treated as a runtime
  guarantee. The BFF response shape is server-defined and unverified; a required-field type on an
  unmapped server payload masks exactly the failure it claims to prevent. Fail-closed-by-design
  UI (`isLocked` returns false until data is ready) then made the absence invisible.
- **Correct Behavior:** At the login trust boundary, backfill from authoritative client-side
  input: `AuthProvider.login` now fills `user.organization` from the login form's explicit tenant
  selection when the BFF omits it (copying, not mutating, the RTK-cached response). Lookup keys
  derived from server strings are matched tolerantly (`resolveFixture` is now trim +
  case-insensitive).
- **Prevention Rule:** Any value read from an unmapped server payload must be treated as
  potentially absent regardless of its TS type — validate or backfill it at the boundary where it
  enters the app, and make downstream lookups tolerant of casing/whitespace. When a feature gate
  "never triggers," check the data-loading path in Redux DevTools *before* touching the gate's
  rendering logic; and verify gating features against real backend responses, not only fixtures.
- **Example:**
  ```ts
  // WRONG — trusts the server to populate a field the type declares required
  const orgKey = state.user?.organization; // undefined at runtime, silently

  // RIGHT — backfill at the login boundary from the user's explicit selection
  const loggedInUser = response.user && !response.user.organization
    ? { ...response.user, organization: credentials.organization }
    : response.user;
  ```

### Never ship a lock badge or gate that upsells a route with nothing behind it
- **Date:** 2026-09-25
- **Mistake:** The live-chat sidebar entries (`/cc/lobby-incoming`, `/cc/chat-history`) were given
  `entitlement.chat` lock badges while no such routes existed — an *entitled* tenant (Professional/
  Enterprise) clicking through landed on the generic 404. The upsell worked; the entitlement
  delivered nothing.
- **Root Cause:** Gating was designed from the menu outward ("which nav items need locks")
  instead of from the entitlement contract outward ("what does an entitled tenant get when the
  gate opens"). Every gate has two sides, and only the locked side was built.
- **Correct Behavior:** Every entitlement gate must have a route-level answer for BOTH sides:
  locked tenants get the lock/upsell UI; entitled tenants get a real page — even if only a
  "coming soon" placeholder (`ProtectedRoute requiredFeature` + placeholder page). Sidebar badges
  alone are not a gate.
- **Prevention Rule:** When adding `feature` to a nav item or `requiredFeature` to a route,
  first confirm the target route exists and renders something for entitled users. If it doesn't,
  ship the placeholder page in the same change. Check both directions by logging in as a locked
  fixture tenant AND an entitled one (SKY-AI vs SIH/BMA fixtures).
- **Example:**
  ```tsx
  // WRONG — badge upsells a route that 404s for paying tenants
  { name: "Lobby", path: "/cc/lobby-incoming", feature: "entitlement.chat" }
  // (no /cc/lobby-incoming route registered)

  // RIGHT — placeholder page + route gate ship together with the badge
  <Route path="/lobby-incoming" element={
    <ProtectedRoute requiredFeature="entitlement.chat">
      <LobbyIncomingPage />  {/* "coming soon" placeholder */}
    </ProtectedRoute>
  } />
  ```

### Under VITE_USE_GRAPHQL=true, a list row only has the fields the GQL_MAP entry requests — check the field list before reading anything else off it
- **Date:** 2026-09-29
- **Mistake:** The OverviewTab read-only location map parsed `caseLat`/`caseLon` off the
  case-history list row (`CaseEntity`) and never rendered. The type declares those fields as
  required strings, and REST returns them — but the list runs through `hybridBaseQuery` with
  `VITE_USE_GRAPHQL="true"`, and `GET_LIST_CASE_QUERY.fields` in
  `src/cms/store/api/graphql/caseQueries.ts` requests only a handful of columns. GraphQL returns
  exactly what was asked for, so every row arrived with coordinates `undefined` and the
  `Number.isFinite` guard (correctly) hid the map. No error anywhere — the feature just silently
  didn't appear.
- **Root Cause:** The `CaseEntity` interface describes the REST/DB record, not the GraphQL
  projection. In GraphQL mode the runtime shape of a list row is the `fields` string in the
  matching `graphql/*Queries.ts` entry, full stop. Trusting the TS type over the query's field
  list masked the gap. (Same family as "server-provided fields typed as required are not
  guaranteed", but here the truncation happens in OUR query definition, not the server.)
- **Correct Behavior:** OverviewTab now sources coordinates from the already-fetched
  `CaseSop` record (`useGetCaseSopQuery` → `sopData.caseLat/caseLon`), whose GraphQL mapping
  uses the opaque `data desc` shape that passes the full object through, with the list-row
  fields as fallback only.
- **Prevention Rule:** Before reading a field off any list/detail row fetched through the
  hybrid base query, check the corresponding `fields` string in `src/**/store/api/graphql/
  *Queries.ts` — if the field isn't listed, it is `undefined` at runtime regardless of what
  the TS interface says. When adding a feature that needs a field missing from the projection,
  either source it from an opaque-`data` query already in flight (preferred) or extend the
  `fields` list after confirming the BFF schema exposes it — remember there is no REST fallback
  in GraphQL mode, so a bad field name breaks the whole endpoint, not just your feature.
- **Example:**
  ```ts
  // WRONG — assumes the list row carries every CaseEntity field
  const lat = parseFloat(caseItem.caseLat ?? ""); // always undefined in GraphQL mode

  // RIGHT — take it from a query whose mapping passes `data` through whole
  const caseLat = sopData?.caseLat ?? caseItem.caseLat;
  ```

### A tab hidden on truthiness of its own data never shows that data
- **Date:** 2026-09-29
- **Mistake:** `CasePanel.tsx`'s tab filter read `if (tab.id === "SubCase" && !!referCaseList) return false;`
  — it removed the SubCase tab exactly when `referCaseList` was truthy, i.e. exactly when there
  were sub-cases to display. The feature was fully built (SubCaseTab, create-sub-case modal,
  server-maintained `referCaseLists`) and invisible to every user who had data.
- **Root Cause:** The intended condition was "hide when EMPTY" (`!referCaseList`), written as its
  negation. `!!x` and `!x` read almost identically in a filter callback, and nothing fails to
  compile when a display condition is inverted — the only evidence is a feature that "doesn't
  exist" for users with data and appears (brokenly) for users without.
- **Correct Behavior:** The condition was removed entirely (the tab now always shows; an empty
  state and the Link action live inside it). When a hide-condition is genuinely needed, write it
  as a positive "show when" expression and read it back as English before committing:
  "this hides the tab when the list HAS items" is obviously wrong said aloud.
- **Prevention Rule:** Whenever a filter/conditional decides VISIBILITY of UI based on the very
  data that UI displays, test both branches mentally: data present → visible? data absent →
  hidden? An inverted truthiness check passes `tsc`, passes lint, and deletes a feature. Grep for
  the pattern when a supposedly-built feature is reported missing: `!!<collection>` near
  `return false` / `&&` short-circuits in tab or section filters.

### The idb `caseList` cache is a websocket sync artifact, not a display datasource
- **Date:** 2026-09-29
- **Mistake:** The old `SubCaseTab` resolved the parent's `referCaseLists` (an array of caseIds
  from the server) by reading `idbStorage.getItem("caseList")` and filtering it client-side.
  Linked cases that the websocket had never pushed into the local cache silently did not render —
  no error, no loading state, just missing rows that varied by device and session history.
- **Root Cause:** IndexedDB `caseList` is populated opportunistically by websocket messages and
  list-page visits (see `WebSocketProvider` / `idbStorage`), so its contents are "whatever this
  browser happened to sync", not "the cases that exist". Treating it as a queryable store made
  correctness depend on cache warmth. The server had already handed over the authoritative id
  list; the lookup of each id should have gone to the API.
- **Correct Behavior:** The reworked tab fetches each id via `useGetCaseByIdMutationMutation`
  (`GET /case/caseId/:id`) with `Promise.all` — id lists from the server are always resolved
  against the server. The localStorage/idb caches are write-through conveniences
  (`updateCaseInLocalStorage` after a PATCH) for offline/websocket freshness, never read sources
  for rendering a specific known set of ids.
- **Prevention Rule:** Never use `idbStorage` / `localStorage` case caches as the read side of a
  feature that knows WHICH records it needs.   If you hold server-provided ids, fetch them by id
  from the API. Cache reads are acceptable only for genuinely offline-first surfaces — and even
  then the UI must say the data may be incomplete, which a silent `.filter()` never does.

### `CaseSop` does not cast to `CreateCase` — map `formData`, never invent the rest
- **Date:** 2026-09-29
- **Mistake:** `useCaseReferLink` built the link/unlink PATCH body as
  `{ ...childSop.data, caseId, referCaseId } as CreateCase`. `tsc -b` rejected it (TS2352):
  the spread is missing `formData`, `caseSla`, `nodeId`, `deptId`, `commId`, `stnId`, so neither
  type sufficiently overlaps the other for a single `as`.
- **Root Cause:** `CreateCase` is a write DTO whose required fields are sourced from UI state in
  the normal save flow, not a subset of the `CaseSop` read model. A bare spread of the read model
  is therefore not even *cast-compatible* with it — and "fixing" the cast by filling the missing
  fields with `""`/`undefined` literals would have invented values that a replace-semantics PATCH
  could persist over real data.
- **Correct Behavior:** Add only the field that has a faithful source — `formData:
  childSop.data.formAnswer`, the same mapping `CaseDetailView`'s save uses — and cast
  `as unknown as CreateCase`, leaving fields the SOP doesn't carry (caseSla, station ids, nodeId)
  absent rather than blanked. The BFF already tolerates the full CaseSop-shaped body because the
  existing save spreads it too.
- **Prevention Rule:** When reusing a read model as a write payload, if `as T` fails with
  "neither type sufficiently overlaps", do not silence it by fabricating the missing required
  fields — each fabricated value is a potential data wipe on the server. Map what has a real
  source, omit the rest, and use `as unknown as T` with a comment saying why the gap is safe.

### A read model that type-checks as a mutation body can still fail GraphQL input validation
- **Date:** 2026-09-29
- **Mistake:** `useCaseReferLink` PATCHed `{ ...childSop.data, referCaseId } as unknown as
  CreateCase`. `tsc -b` passed; the BFF rejected it with two `BAD_USER_INPUT` errors:
  `caseSla` arrived as the number `97` (the SOP read model computes it — the TS interface
  doesn't even declare it, but the spread carries it) while `CaseUpdateInput.caseSla` is
  `String`, and `customerId` is **not a field of `CaseUpdateInput` at all** (customer linking
  has its own `CaseCustomerInput`/`UpdateCaseCustomer` mutation).
- **Root Cause:** GraphQL input types are curated server-side subsets of the record, not the
  REST write DTO and not the read model. `buildGraphQLQuery` passes the request body through
  verbatim as `variables.input` (only stripping `undefined`/`null`/`""`), so every key the
  spread carries must exist in the input type with a compatible scalar. Two spreads hid the
  mismatch from the compiler: the `as unknown as CreateCase` cast, and runtime fields the
  TS interface never declares.
- **Correct Behavior:** Fields the target input type does not define are dropped at the
  mapping layer, not per call site: `GqlMapConfig.omitInputFields` (honored in
  `buildGraphQLQuery`) removes them for every caller of that endpoint at once, and REST
  bodies stay untouched. `UPDATE_CASE_MUTATION` carries `omitInputFields: ["customerId"]`.
  Type coercions stay at the call site (`body.caseSla = String(...)` in
  `useCaseReferLink`) because the mapper omits, it does not convert. When the server
  reports input-coercion errors, remember it collects ALL of them in one pass — the
  reported fields are the complete violation list, so a minimal targeted fix is safe.
- **Prevention Rule:** Spreading a GET response into a mutation body is a cross-boundary
  transfer, not a copy. Before sending, diff the spread's runtime keys against what the target
  GraphQL input type accepts (the server's `BAD_USER_INPUT` message names both unknown fields
  and scalar mismatches — read the whole `errors` array), and never assume the TS interface
  enumerates the runtime fields. Same family as "A hidden input is not write protection" and
  "server-provided fields typed as required are not guaranteed": the type system does not
  model this boundary.
- **Related mapper behaviour:** `gqlMapper`'s input cleaning strips `""` — which silently
  turned case UNLINK (`referCaseId: ""`) into a no-op in GraphQL mode. `referCaseId` is now
  exempt from the strip (see the `v5.1` comment in `gqlMapper.ts`). Any future "clear a field
  by sending empty string" flow in GraphQL mode hits the same wall: check the strip list
  before assuming the value reaches the server.

### GraphQL input types are strict at EVERY nesting level — and the read model keeps growing
- **Date:** 2026-09-30
- **Mistake:** After `customerId` was fixed, the close-case save failed again with seven more
  `BAD_USER_INPUT` errors: top-level `docId` (a server-side read-model field the frontend
  never declares — it appeared when the BFF's record grew), and six fields nested inside
  `attachments[*]` (`orgId`, `caseId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`),
  because `AttachmentInput` accepts only `id`/`type`/`attId`/`attName`/`attUrl`. The
  top-level `omitInputFields` mechanism couldn't reach the nested violations.
- **Root Cause:** Two compounding truths. (1) Input-type strictness applies recursively —
  passing validation at the top level says nothing about nested input types. (2) The BFF's
  read model is ALIVE: it gains fields (`docId` showed up between one error report and the
  next) without any frontend change, and every spread-echo caller inherits each new field as
  a fresh validation failure. The mapper's empty-strip also does not recurse, so nested
  `orgId: ""` placeholders survive cleaning and still fail the schema.
- **Correct Behavior:** `omitInputFields` now supports dotted paths applied recursively
  through arrays (`attachments.orgId` strips orgId from every item) — see the `v5.2`
  comment and `omitAtPath` in `gqlMapper.ts`, and the full violation list on
  `UPDATE_CASE_MUTATION` in `caseQueries.ts`. The place to encode "what the server's input
  type accepts" is that ONE config entry, shared by all four `patchUpdateCase` call sites
  (main save, schedule save, create-follow-up, linked-cases link/unlink).
- **Prevention Rule:** A `BAD_USER_INPUT` "Field X is not defined by type Y" error means:
  add X to the endpoint's `omitInputFields` in `graphql/*Queries.ts` (dotted if nested) —
  never patch a call site, and never assume a previously-clean payload is still clean after
  a BFF deploy. When choosing between omit-list and pick-list for a curated input type:
  without the authoritative schema in-repo, a PICK list fails SILENTLY (drops valid fields,
  data loss) while an OMIT list fails LOUDLY (a validation error naming the exact field).
  Prefer loud. `gqlMapper.test.ts` covers the case-update sanitizing contract — extend the
  fixture there when adding paths.
- **Watch item:** `CREATE_CASE_MUTATION` (`CaseInsertInput`) receives the same style of
  spread body plus `UploadFileRes`-shaped attachments but has reported no violations so far;
  if it errors, the same `omitInputFields` mechanism applies — do not "pre-fix" it blindly,
  because omitting a field the insert input DOES accept would silently stop persisting it.

### One rejected fetch in Promise.all blanks the whole list — and not every endpoint serves every record state
- **Date:** 2026-09-30
- **Mistake:** Linking a CANCELLED case succeeded, but the linked-cases list rendered empty,
  exactly as if the link had failed. The tab fanned the server's id list out with
  `Promise.all(childIds.map(id => getCaseById(id).unwrap()))`: the `/case/caseId/:id`
  lookup rejects (or returns no data) for terminal-state cases, one rejection fails the
  entire `Promise.all`, the catch left the list empty — every card gone, not just the
  cancelled one.
- **Root Cause:** Two stacked assumptions. `Promise.all` is fail-fast: the successful
  fetches are discarded with the first rejection. And endpoint choice was made by
  convenience (`getCaseByIdMutation` existed) without checking which case states it
  serves — `/dispatch/:caseId/SOP` demonstrably loads cancelled/closed cases (it powers
  their detail pages), `/case/caseId/:id` does not.
- **Correct Behavior:** SubCaseTab now fetches per id via `useLazyGetCaseSopQuery` with
  `Promise.allSettled`, partitions results (`partitionLinkedCaseResults` in
  `linkedCaseUtils.ts`), and renders any id whose details failed as a reduced "details
  unavailable" card that is still clickable and unlinkable. A server-provided id is proof
  the link exists; the UI must never silently drop it because a secondary lookup failed.
- **Prevention Rule:** When fanning a server-provided id list out into per-id fetches:
  (1) `Promise.allSettled`, never `Promise.all` — one bad record must not take the list
  down; (2) render failures explicitly (placeholder row), never filter them out silently;
  (3) pick the lookup endpoint by which RECORD STATES it serves, not by which hook is
  already imported — if the detail page can display the record, use the detail page's
  endpoint for lookups of that record.

### A file's name is not its encoding, and an environment's bucket is not a default
- **Date:** 2026-11-02
- **Mistake:** Wiring the boundary polygons to MinIO, two things were inferred from
  names instead of measured. (1) `.json.gz`, served as `Content-Type: application/gzip`,
  was assumed to be gzip - so a `response.json()` parser and a `DecompressionStream`
  branch were both on the table without evidence. The objects are PLAIN JSON: the bytes
  start with `[`, there is no `Content-Encoding`, and nothing decompresses them. (2)
  `BOUNDARY_MINIO_BASE_URL` was first written with a hardcoded fallback to the staging
  bucket, so a production deploy that omitted the variable would have read staging
  geometry and rendered successfully.
- **Root Cause:** A remote payload's properties were taken from its labels. An extension
  and a `Content-Type` are claims by the WRITER; the bytes are the contract. Likewise a
  bucket name in a sample URL describes ONE environment, and a default is a decision
  that silently applies to every environment that omits the variable. Neither failure is
  reachable by `tsc`, lint, or a unit test built on a hand-written fixture - all three
  only ever confirm what the author already believed.
- **Correct Behavior:** Fetch one real object and inspect the raw bytes before writing
  the parser (gzip magic is `1f 8b`; decode conditionally, so a writer that later starts
  compressing for real needs no change here). Require per-environment roots and treat
  "absent" as "not configured", falling back to a known-good code path with a loud error
  rather than to a plausible-looking default.
- **Prevention Rule:** Before parsing anything remote, spend one request looking at the
  BYTES rather than the name, the header or the documentation - and write the parser so
  the surprise is handled, not merely avoided. Any config value that identifies an
  environment (bucket, project, tenant, region) is required, never defaulted: a default
  belonging to another environment fails silently and looks healthy, which is worse than
  failing to start.
- **Example:**
  ```ts
  // WRONG - trusts the extension, and lets prod read the staging bucket
  const res = await fetch(url);              // ".json.gz"
  const rings = await res.json();            // breaks the day the writer gzips
  BOUNDARY_MINIO_BASE_URL: import.meta.env.VITE_X || "https://storage/cms-stg/area-org-tree",

  // CORRECT - read bytes, decompress only if they really are gzip
  const bytes = new Uint8Array(await res.arrayBuffer());
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  // ...and no default: empty means "not configured", handled explicitly by the caller
  BOUNDARY_MINIO_BASE_URL: (import.meta.env.VITE_X || "").replace(/\/+$/, ""),
  ```

### A store that exists is not a store that is populated — find the dispatcher before reading from it
- **Date:** 2026-11-02
- **Mistake:** `boundarySource.ts` needed the signed-in user's `orgId` from outside React and
  read `store.getState().auth.user?.orgId`. In a fully logged-in session that was `null`, so
  every boundary polygon silently failed to draw behind
  "Cannot load boundary geometry: the signed-in user carries no orgId". The reported cause -
  "the user has no orgId" - was wrong: the value existed all along, in a different store.
- **Root Cause:** `src/core/store/slices/authSlice.ts` defines an `auth` slice with a
  `loginSuccess` reducer, but **nothing in `src` ever dispatches it**. The real session lives in
  `AuthProvider`'s `useReducer` (`src/core/providers/AuthProvider.tsx`) and is rehydrated from
  `TokenManager.getStoredUser()` - the `"profile"` entry in localStorage/sessionStorage, which
  carries `orgId` at its root (`AuthService.createMockUser`, and `AuthProvider`'s own backfill at
  `AuthProvider.tsx:45`). Two parallel `AuthState`/`User` types exist - the Redux slice uses the
  CMS `User` (`@/cms/types`, no `orgId`), the context uses `@/core/types/auth` (has it) - and the
  type error that should have been the warning was silenced with a cast to `{ orgId?: unknown }`,
  which made an always-null read look deliberate.
- **Correct Behavior:** Read the persisted profile
  (`TokenManager.getStoredUser()` - synchronous, framework-free, so usable from a plain module).
  Belt and braces: the RTK base query already falls back to `TokenManager` for exactly the same
  reason, so this is the established source of truth, not a workaround.
- **Prevention Rule:** Before reading a value out of any shared state container (Redux slice,
  context, cache), grep for the thing that WRITES it and confirm it is actually dispatched. A
  slice that is defined, typed and exported proves nothing. If a cast is needed to make the read
  compile, that is the signal to go find the writer, not to narrow the shape and move on - and
  when a value can be absent, fail with a message that names the exact record inspected, so the
  next reader is not sent to the wrong place by a plausible-sounding symptom.
- **Example:**
  ```ts
  // WRONG - authSlice declares loginSuccess, but no dispatcher exists anywhere in src
  const user = store.getState().auth.user as { orgId?: unknown } | null; // always null

  // CORRECT - the store AuthProvider itself rehydrates from
  const profile = TokenManager.getStoredUser() as { orgId?: unknown } | null;
  const orgId = profile?.orgId;
  return typeof orgId === "string" && orgId.length > 0 ? orgId : null;
  ```

### A field name in a document is a claim about the data model
- **Date:** 2026-11-04
- **Mistake:** The v1 tenant-setup document listed fields and hierarchies that the product does
  not have: an area hierarchy of "Level 1 / Level 2 / Level 3" whose own example
  (`SKYICT / Central Zone / Station 1`) was a *department/command/station* path, a User Group
  `Main Category` column (`CAD`/`ORDER`/`KB`) with no such field, an appointment type with
  "category" and "stay duration", a priority scale documented as `CRITICAL 0 - NONCRITICAL 9`
  while the UI emits `0,0,1,2,0,1,2,0,1,2`, and a "Package" menu entry pointing at a route that
  does not exist. None of it failed anything: it was a document, and the customer was about to
  use it as the specification for provisioning a real tenant.
- **Root Cause:** The document was written from how the product *should* look, then carried
  forward by editing rather than by re-reading the code. A field name copies cheaply and its
  wrongness is invisible until someone types it into a form that does not have it. The same
  habit that makes prose reuse feel efficient is what makes a stale spec dangerous: there is no
  compiler, no test and no runtime between a document and the claim it makes.
- **Correct Behavior:** Every field, code, hierarchy level and route named in a document that
  will be used as a work order was traced to its source before publication - the TS interface
  (`src/**/types/*.ts`), the form component that renders it, the route table
  (`src/App.tsx`, `src/{cms,cc,kms}/App.tsx`), or the menu array. Claims that could not be
  traced were labelled as unverified instead of being restated. The corrections went into the
  new document as a numbered list with evidence paths, so the reviewer can check each one
  rather than re-auditing the whole document.
- **Prevention Rule:** Before publishing any document that another person will act on, treat
  every proper noun it contains - field name, code, status value, level label, menu item, route,
  permission key - as a claim requiring evidence, and cite the file you read it from. If a value
  came from a previous version of the document rather than from code, that is not evidence:
  re-verify or mark it unverified. When a document contradicts the code, the code wins and the
  contradiction gets an explicit correction entry - never a quiet edit.
  **This includes the document's own derived numbers and citations:** a count ("7 of 11 features"),
  a cross-reference ("§8 C17"), and a `file:line` range are claims exactly like a field name - the
  count must be computed from the artifact, the reference must resolve to a section that exists,
  and a line range may only be cited for lines actually read (otherwise cite the file alone).
  A summary written before the body is where inverted counts and dangling references come from;
  re-derive both after the body is final.
- **Example:**
  ```text
  WRONG (v1)                                  RIGHT (verified against code)
  Area L1/L2/L3 = SKYICT/Central/Station1   -> Area = Country > Province > District (types/area.ts)
  User Group: Main Category CAD/ORDER/KB    -> UserGroup = grpId/th/en/description/active
  Priority CRITICAL 0 .. NONCRITICAL 9      -> 4 labels, value = index inside group (0,0,1,2,...)
  Menu "Package" -> /cms/packages           -> no such route anywhere in src (dead link)

  WRONG (v0.2 draft, caught in self-audit)     RIGHT
  header "4 of 11 features gate nothing"    -> grep the feature keys: 4 gate, 7 gate nothing
  "§8 C17"                                  -> C17 does not exist; C14 is the workflow entry
  ".env.staging:51-90"                      -> only 52-56,68-85 were read; cite those
  ```
### An identifier the system assigns is not yours to invent

- **Date:** 2026-11-05
- **Mistake:** Writing `db/seed/skyict/02-sec_org-structure.sql`, the department's business key had
  to be supplied because a raw INSERT lists every column - so the script invented fixed, readable
  UUIDs (`5ec00001-...`, `5ec00002-...-0001`, ...) and derived the children's keys from them. The
  user rejected it outright: "dept_uuid ต้องไม่กำหนดเอง". Checking the contract afterwards confirmed
  why - the frontend's `DepartmentCreateData` / `CommandCreateData` / `StationCreateData` carry only
  `{active, en, th}` plus the parent id (`src/core/types/organization.ts:25-84`), i.e. the product
  treats these keys as server-assigned. The only thing that demanded a value was the column list of
  a hand-written INSERT, not the data model.
- **Root Cause:** A raw SQL statement's column list reads like a requirement ("supply all 36
  values"), and it silently converted "the database's job" into "the author's choice". Nothing in
  the statement, the type system or a dry run objects: invented ids insert fine, satisfy every FK
  and look correct in review. The mistake is invisible until someone asks who owns the value - or
  until a second environment diverges.
- **Correct Behavior:** Let the database mint every identifier the application never sends -
  `gen_random_uuid()` (or the column default) - and link rows by their natural business key instead
  of by a value written down in advance: children resolve their parent with a join on `(orgId, en)`,
  idempotency is guarded by `NOT EXISTS` on that same key, and the generated ids are printed at the
  end for whoever needs them next (here: the user seed's parameters). Surrogate `id` columns are
  omitted from the INSERT entirely so their default - and their sequence - stays intact.
- **Prevention Rule:** Before writing any value into a column, ask which side produces it. If the
  application never sends it - business keys, surrogate ids, tokens, timestamps, hash salts - the
  script must not choose it: use the database's generator and read the result back. Hard-coded
  identifiers in a seed/migration are acceptable only when the value is genuinely external and fixed
  (an enum code, a country code). Corollary: a statement that seems to require a value for such a
  column is a sign the script needs a generate-and-return step, not a literal.
- **Example:**
  ```sql
  -- WRONG - the author picked the tenant's department key
  \set dept_uuid '5ec00001-0000-4000-8000-000000000001'
  INSERT INTO public.sec_departments ("deptId", "orgId", en, ...)
  VALUES (:'dept_uuid'::uuid, :'org_id'::uuid, 'SKYICT', ...);

  -- CORRECT - the database assigns it; children resolve the parent by name
  INSERT INTO public.sec_departments ("deptId", "orgId", en, ...)
  SELECT gen_random_uuid(), :'org_id'::uuid, v.en, ...
    FROM (VALUES ('SKYICT')) AS v (en)
   WHERE NOT EXISTS (SELECT 1 FROM public.sec_departments d
                      WHERE d."orgId" = :'org_id'::uuid AND d.en = v.en);

  INSERT INTO public.sec_commands ("deptId", "orgId", "commId", en, ...)
  SELECT d."deptId", d."orgId", gen_random_uuid(), v.en, ...
    FROM (VALUES ('Center Zone')) AS v (en)
    JOIN public.sec_departments d ON d."orgId" = :'org_id'::uuid AND d.en = 'SKYICT'
   WHERE NOT EXISTS (SELECT 1 FROM public.sec_commands c
                      WHERE c."orgId" = d."orgId" AND c."deptId" = d."deptId" AND c.en = v.en);
  ```

### A script's execution environment is part of its contract

- **Date:** 2026-11-05
- **Mistake:** `db/seed/skyict/01-um_users.sql` and `02-sec_org-structure.sql` were written with psql
  meta-commands (`\set`, `\if :flag`) and described as runnable. The operator pasted them into a GUI
  SQL editor and got `ERROR: syntax error at or near "\"` / `LINE 57: \set org_id …` /
  `SQL state: 42601` - the client never sees `\set` as SQL. The scripts had been "tested" only through
  `psql`, which of course accepts them, so the test could not fail.
- **Root Cause:** Two assumptions were never stated, let alone checked: *which client* the operator
  uses, and *what the file must be* to be portable. `\set` felt like a neutral way to parameterise a
  script because it is the obvious one to whoever is writing from inside psql. A test run in the same
  tool that produced the file confirms the file works **there** - it cannot reveal a dependency on
  that tool.
- **Correct Behavior:** Parameters moved into a session `CREATE TEMP TABLE _seed_cfg (…);` populated by
  one `INSERT`, and each statement joined `_seed_cfg`; `\if :flag` became a `cfg.flag` guard in the
  WHERE clause. The files are now plain SQL: no `\`-commands, no `\gset`, no session assumptions
  beyond "one connection", and they run identically in psql, DBeaver, pgAdmin, DataGrip or CI.
- **Prevention Rule:** Treat the consumer of a script as part of its specification. Before shipping
  anything executable, name how it will be run and test it that way; if that is unknown, use only
  constructs every target client supports (plain SQL, explicit transactions) and put every parameter
  in one editable place. Applies beyond SQL: a shell snippet assuming bash on macOS, a Node script
  assuming a global CLI, a curl example assuming a shell that expands `{a,b}`. "It ran on my machine,
  in my tool" is the failure mode, not the evidence.
- **Example:**
  ```sql
  -- WRONG - works in psql, fails everywhere else with SQLSTATE 42601
  \set org_id '11111111-1111-1111-1111-111111111111'
  INSERT INTO public.sec_departments ("orgId", en) VALUES (:'org_id'::uuid, 'SKYICT');

  -- CORRECT - plain SQL, one edit point, same result in any client
  DROP TABLE IF EXISTS _seed_cfg;
  CREATE TEMP TABLE _seed_cfg (org_id uuid NOT NULL, actor text NOT NULL);
  INSERT INTO _seed_cfg VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'system');
  INSERT INTO public.sec_departments ("orgId", en)
  SELECT cfg.org_id, 'SKYICT' FROM _seed_cfg cfg;
  ```

### A guard that skips work without reporting is indistinguishable from success

- **Date:** 2026-11-05
- **Mistake:** `db/seed/skyict/01-um_users.sql` §3 guarded its INSERT with
  `WHERE NOT EXISTS (SELECT 1 FROM um_users WHERE username = ...)`, so a run against a database where
  10 of the 16 usernames already existed **under another orgId** inserted 6 rows, reported
  `INSERT 0 6`, and said nothing about the other 10. The operator saw six rows in a grid, concluded
  "the script does nothing", and two rounds went into debugging role assignment while the real problem
  was ten missing accounts.
- **Root Cause:** Two assumptions stacked. (1) *Scope*: `username` was assumed unique per tenant; it is
  unique across `um_users`, so "create this user for this tenant" was really "this person already has
  an account somewhere". (2) *Silence*: the NOT-EXISTS guard was written to prevent duplicates — a
  correct intent — but a skip is a **decision about data** and the operator never saw which rows were
  skipped or why. `INSERT 0 n` reports only what happened, never what did not.
- **Correct Behavior:** Before inserting, print a per-user report of where each username currently
  lives (`db/seed/skyict/00-diagnose-users.sql`, and §2c of the seed); after inserting, verify with an
  explicit state per user — `ok` / `IN OTHER ORG` (naming the owning orgId) / `NOT IN DB` / `ROLE
  DIFFERS` — instead of counting successful rows. Moving an account between tenants became a separate,
  off-by-default, explicitly-labelled step (`reassign_other_org`), because it takes the account away
  from the tenant that owns it.
- **Prevention Rule:** Any statement that skips rows must report **how many and why**, in the same run,
  in terms the operator can act on. And before treating an identifier as scoped (per tenant, per
  organisation, per environment), check the constraint that governs it: a global unique index silently
  converts "create" into "conflict", and every NOT-EXISTS guard on that column becomes a no-op that
  looks like a success. Same family as "A truthiness check is not a success check" — the evidence of
  work done is the reported state of every expected row, never the absence of errors.
- **Example:**
  ```sql
  -- WRONG - 10 rows silently skipped, output still looks like success
  INSERT INTO public.um_users (...) SELECT ... FROM _seed_users s
   WHERE NOT EXISTS (SELECT 1 FROM public.um_users u WHERE u.username = s.username);

  -- CORRECT - the same guard, but the run states what it did and what it refused to do
  SELECT s.username,
         CASE WHEN t.id IS NOT NULL THEN 'this tenant'
              WHEN o.id IS NOT NULL THEN 'IN OTHER ORG: ' || o."orgId"::text
              ELSE 'NOT IN DB' END AS state
    FROM _seed_users s
    LEFT JOIN public.um_users t ON t.username = s.username AND t."orgId" = cfg.org_id
    LEFT JOIN public.um_users o ON o.username = s.username AND o."orgId" <> cfg.org_id;
  ```

### A transposed literal is invisible to the eye — verify copied values by machine, not by re-reading
- **Date:** 2026-11-06
- **Mistake:** Transcribing the 16-user seed list into `db/seed/skyict/api-payloads/06-users.json`,
  `lastName: "Techa"` became `"displayName": "Wisarud Tehca"` — letters swapped. A re-read and even
  a grep for the name looked correct because the transposition is the same length with the same
  characters; the fix attempt first produced a SECOND wrong spelling ("Techna") because the eye
  keeps "reading" the intended word, not the bytes. The first detection was a grep that matched the
  line and showed the bytes — but the match was read as "the row is there", not "compare these
  bytes to the source".
- **Root Cause:** Literal values were copied by hand across an artifact boundary (SQL → JSON) and
  then "verified" by looking. A grep hit confirms PRESENCE, not CORRECTNESS: `Select-String 'Wisarud'`
  returns the line and the reader's expectation fills in the expected spelling. There is no compiler,
  schema or type between two files that both just contain strings.
- **Correct Behavior:** After writing a file that carries literals transcribed from a source file,
  run a scripted field-by-field comparison in the same turn: parse both files (regex/JSON), join on
  the natural key (username), and assert equality for every copied field; fix only what the diff
  reports. When a spelling looks suspicious, print the raw characters (char codes, or bracket the
  exact string) instead of re-reading the line.
- **Prevention Rule:** Never trust a visual re-read to verify a transcribed literal. When a file's
  strings were copied from another file, machine-diff the copied set against the source set before
  calling the work done — for names, ids, codes and other short strings especially, because
  transpositions and letter-swap typos are exactly what eyes skip. A search that "found the row" is
  not a verification; a comparison that reports `EQUAL` or names the differing bytes is. Same family
  as "A field name in a document is a claim": a value copied between artifacts remains a claim until
  checked against its origin.
- **Example:**
  ```powershell
  # WRONG - grep proves the row exists; the eye reads "Tehca" as "Techa"
  Select-String -Path 06-users.json -Pattern 'Wisarud'   # "looks right"

  # CORRECT - parse both artifacts and compare every copied field on the natural key
  $rows = [regex]::Matches($seedSql, "\('([a-z0-9.]+)',\s+'[^']*',\s+'([^']*)',\s+'',\s+'([^']*)',\s+'([^']*)',\s+'([^']*)',\s+'(\w+)'\)")
  foreach ($u in $usersJson) {
    $r = $rows | Where-Object { $_.Groups[1].Value -eq $u.username }
    if ($r.Groups[3].Value -ne $u.lastName) { "MISMATCH $($u.username) lastName [$($u.lastName)] want [$($r.Groups[3].Value)]" }
  }
  ```

### Invented literals masquerade as transcribed ones — machine-diff must check faithfulness, not just coverage
- **Date:** 2026-11-10
- **Mistake:** Building `docs/SKYICT-Pre-Config-JSON-Payloads.md` from two source docs, several
  "transcribed" values were actually invented: spare-part stock quantities "24/24/36/36/36"
  (those are WARRANTY months from the product table), `unitName` values "Staff"/"Internal"
  (the table's Unit-Name column is "UNIT-001"…), a KB article mapped to the wrong category
  (No Audio → No Audio *Troubleshooting* instead of → *Procedures*, which the source table's
  `2 (Procedures)` cell states), an extra `type:"part"` brand pair the doc never lists, and
  form-field `formRule: { options: [...] }` — a field that does not exist on `FormRule`
  (options live top-level, per the builder's own factory `function.ts:117-134`).
- **Root Cause:** A coverage-only check ("is the source string present in my file?") passes even
  when the file ALSO contains plausible invented values, because the eye reads its own prose as
  the intended meaning. Pairings (category↔article, brand↔part, column↔field) are the part a
  string-presence check cannot see. The deeper cause: the document was written from memory of
  the table while re-typing, instead of re-reading each table row at write time.
- **Correct Behavior:** The verification script (`docs/verify-skyict-preconfig.ps1`) runs BOTH
  directions: (1) coverage — every source literal must appear in the artifact; (2) faithfulness
  — every Thai (non-ASCII, Thai-letter) string in the artifact must be a substring of a source
  doc (no invented Thai). Pairings were checked by re-reading the source table rows at write
  time, and every contract field (e.g. `formRule`) was checked against its type definition, not
  against the shape the writer remembers.
- **Prevention Rule:** A verification of a transcribed artifact is only half done when it proves
  the source values are present. Always run the reverse check too — every value in the artifact
  that claims source provenance must be traceable to a source byte (or explicitly allow-listed
  as an invention/placeholder with a flag in the doc). Pairings (which value goes with which)
  must be re-read from the source table, never recalled.
- **Example:**
  ```powershell
  # COVERAGE (source -> artifact)
  foreach ($e in $expected) { if (-not $docN.Contains($e)) { "MISSING: $e" } }
  # FAITHFULNESS (artifact -> source): no invented Thai literals
  [regex]::Matches($docN, '[^\u0000-\u007F]+') | Where-Object { $_.Value -match '[\u0E00-\u0E7F]' } |
    ForEach-Object { if (-not $srcN.Contains($_.Value)) { "NOT IN SOURCES: $($_.Value)" } }
  ```

### "Verified" is a claim — a document that asserts machine verification must contain evidence that the check ran
- **Date:** 2026-11-10
- **Mistake:** The first draft of `SKYICT-Pre-Config-JSON-Payloads.md` §32 asserted
  "machine-checked … Result: 0 mismatches" while no script existed and no check had run. The
  claim was written as if the verification were already done, and several of the literals it
  claimed were checked (stock quantities, KB pairing, `formRule`) were wrong.
- **Root Cause:** The verification step was planned but not yet performed when the document was
  written; the sentence described the INTENDED process, not an executed one. A future reader
  (or a checkpoint summary) cannot distinguish "ran and passed" from "will run".
- **Correct Behavior:** Verification claims in a document are written AFTER the check executed
  and cite the executable evidence: the script path, how to re-run it, and the actual output of
  the run that just happened.
- **Prevention Rule:** Never write a "machine-verified / verified / checked" sentence into a
  deliverable before the verifying command has actually run in the session. The sentence must
  name the command/script that proves it and quote that run's output. If the check has not run
  yet, the doc says so explicitly ("verification pending") or the claim is omitted.
- **Example:**
  ```markdown
  <!-- WRONG -->
  The values above were machine-checked. Result: 0 mismatches.
  <!-- CORRECT -->
  Machine-checked by `verify-skyict-preconfig.ps1` (re-run: `pwsh -File ...`).
  Result (2026-11-10): PASS — 227 covered, 123 faithful, 0 mismatches.
  ```

### A batch text replacement that finds no match does not fail

- **Date:** 2026-11-11
- **Mistake:** Producing a 1,400-line document from a source document, then applying a batch of
  corrections with a script of `Replace(...)` calls. The script reported `edits applied`, and three
  of the planned corrections had silently done nothing: each search string had been written from
  memory of the source line rather than copied from the file, so the wrapped text did not match.
  The wrong cross-reference (`Appendix C.6` where `C.5` was meant) survived into the deliverable and
  was found only by a later, unrelated spot-read.
- **Root Cause:** `string.Replace` (and `sed`/`perl -pi`) return the string unchanged when the
  pattern is absent - there is no error, no warning, no exit code. A batch script therefore
  reports success for a set of edits it may not have performed, and the operator reads "ok" as
  "every edit landed". Compounding it: the search strings were reconstructed from memory of what
  the line *said* rather than copied from the file, which is exactly the class of mismatch -
  re-wrapped prose - that a human eye also skips.
- **Correct Behavior:** After any batch edit, re-read the region and confirm the change is present,
  and prefer verifying by *counting*: assert the replacements changed the file (line/byte delta, a
  grep for the NEW text, or a grep proving the OLD text is gone) inside the same command that made
  the edit, so a no-op cannot be reported as success. Search strings must be copied from the file,
  never retyped from memory.
- **Prevention Rule:** A text-mutation script is not "done" when it exits 0; it is done when the
  new text is observed in the file and the old text is observed absent. Every batch edit ends with
  a positive assertion (grep finds the new string) and a negative one (grep finds no old string) in
  the same run. Same family as "A guard that skips work without reporting is indistinguishable from
  success" and "`Verified` is a claim": the evidence of an edit is the changed file, never the
  absence of an error.
- **Example:**
  ```powershell
  # WRONG - reports "ok" whether or not anything matched
  $c = Get-Content $f -Raw
  $c = $c.Replace('Appendix C.6', 'Appendix C.5')
  Set-Content $f $c
  "ok"

  # CORRECT - the edit proves itself, in the same run
  $before = (Get-Content $f -Raw)
  $after  = $before.Replace('Appendix C.6', 'Appendix C.5')
  if ($after -eq $before) { throw "no-op: pattern not found" }
  Set-Content $f $after -NoNewline
  if (-not (Select-String -Path $f -Pattern 'Appendix C\.5' -Quiet)) { throw "new text absent" }
  if (Select-String -Path $f -Pattern 'Appendix C\.6' -Quiet) { throw "old text still present" }
  ```
### Renumbering a document's sections invalidates every reference to them - and a reference can resolve while still being wrong

- **Date:** 2026-11-11
- **Mistake:** Writing `docs/SKYCC-Pre-Config-JSON-Payloads.md`, sections were renumbered three times
  while the prose was written against the *planned* numbering (types = section 21, unverified = 22,
  corrections = 19). The finished file had **31 wrong `§N` references** - `§20 item 7` where the type
  table was `§25 item 7`, `§19 D5` where the discrepancy list was `§27`, `§21 item 4` pointing at
  "Case results" instead of the missing-contract table. Two more resolved to an existing but wrong
  section (`§23` = Organization settings, cited for "Machine verification" = `§28`); those passed the
  new automated check because the target heading existed.
- **Root Cause:** A section number is assigned when the document is planned and re-assigned every time
  a section is inserted - but the references were written incrementally and never re-read. Nothing
  fails: markdown renders a wrong `§` exactly like a right one. The two "resolves but wrong" cases show
  the deeper issue: *existence* of a target and *correctness* of the reference are different claims, and
  only the first is machine-checkable.
- **Correct Behavior:** Every `§N` was audited in one pass against the actual heading list (grouped by
  target number, then classified one by one), corrected with a script that asserts each replacement
  matched exactly once, and a **cross-reference integrity check** was added to the verifier: every `§N`
  must resolve to a `## N.` heading, with references into other documents explicitly marked and
  excluded.
- **Prevention Rule:** Treat a cross-reference as a claim needing evidence, exactly like a field name.
  After any renumbering or insertion, machine-check that every reference resolves, then *read* the
  references that resolve - existence is not topical correctness, and only a human pass catches
  "section 23 is about something else". Batch-fix with a script that asserts each edit matched exactly
  once and abort before writing if any did not, so a partial renumbering cannot land.
- **Example:**
  ```powershell
  # the fix script refuses to write unless every replacement matched exactly once
  foreach ($p in $pairs) {
    $n = ([regex]::Matches($doc, [regex]::Escape($p[0]))).Count
    if ($n -ne 1) { throw "MISS ($n): $($p[0])" }   # abort -> nothing written
    $doc = $doc.Replace($p[0], $p[1])
  }
  Set-Content -LiteralPath $f -Value $doc -NoNewline
  ```

### An artifact governed by a validation rule cannot contain its own counter-example

- **Date:** 2026-11-11
- **Mistake:** A Thai-faithfulness check (every Thai string in the document must come from a source
  document) was documented in the document itself, quoting the deliberately-corrupted string the
  negative control had produced. The next run failed on the document's own explanation: the invented
  Thai was now *in* the artifact. Worse, the same trap fired twice more - an invented `sTypeCode`
  example (`5299`) written into the section describing the invented-code check, and a recorded
  cross-reference count (`123`) that the very act of editing invalidated (`124`).
- **Root Cause:** A validator that scans the whole artifact has no notion of "this occurrence is
  illustrative". Documentation of a check is content like any other, so an example of a bad value is a
  bad value. The count case is the same shape: a number that summarises the artifact changes when the
  summary is written into it.
- **Correct Behavior:** Describe counter-examples without reproducing them ("a Thai suffix was appended
  to a skill's Thai name", "a plausible code outside the C.5 set"), and say why the literal is absent so
  the next author does not re-add it. For self-referential numbers, re-run after the edit and confirm
  the recorded value still equals the live one - or drop the number from the prose.
- **Prevention Rule:** Before quoting a failing value inside the document that the check governs, ask
  whether the check would flag the quote. If yes, paraphrase. And any quoted metric about the artifact
  (counts, sizes, line numbers) must be re-derived *after* the final edit, never before - the act of
  writing it down can change it. Corollary: prove the guard can fail by running it against a corrupted
  **copy**, never by putting the corruption in the deliverable.
- **Example:**
  ```markdown
  WRONG  The check reported: "Thai string 'การเรียกเก็บเงินลูกค้า' is not in any source"   -> re-fails
  RIGHT  The check reported a NOT-FAITHFUL line naming the invented suffix (not reproduced here:
         any Thai literal in this file must itself be traceable to a source).
  WRONG  recorded "123 §N references resolve" -> the edit that added this sentence made it 124
  RIGHT  update the number after the final edit, then re-run and confirm stability.
  ```

### A hardcoded `isLoading` is indistinguishable from a real one — and a page that gates on it is dead forever

- **Date:** 2026-11-12
- **Mistake:** The Organization Settings -> Map Settings page rendered nothing but the skeleton
  placeholder, permanently, for every signed-in user. `MapSettingsSection` returned the placeholder
  on `if (isLoading)`, and `useOrgMapSettings` returned `isLoading: !isMock && !!orgId` - a
  constant `true`. Every `.env*` sets `VITE_MOCK_API="false"` and every signed-in user carries an
  `orgId`, so the branch always fired: the form, the entitlement gate and the Save button were
  never mounted at all.
- **Root Cause:** The hook had been written against a real query, then the query was commented out
  because the backend route did not exist yet (and with it `realLoaded`, which became a bare
  `buildDefaultOrgMapSettings(orgId)`). The `isLoading` expression lost its third term in the same
  edit and became a condition that is simply true, while the *correct* line stayed directly above it
  as a comment. With no fetch in flight there is nothing that can ever settle the flag, so the
  placeholder is not a transient state - it is the final state. The sibling
  `useOrgAssignmentRules`, nominally a mirror of this hook, still had its live query and the correct
  `!isMock && !!orgId && isLoading`, which is what made the divergence invisible: both files read
  as "the same hook" at a glance.
- **Correct Behavior:** Keep the query live (its failure is already isolated downstream: the
  `isOrgMapSettings` shape guard turns 404 / GraphQL error into schema defaults), so `isLoading` is
  the query's own flag narrowed by the same conditions the query is `skip`ped on. And gate the page
  on the FIRST load only - a settled-once flag - so the refetch that every Save triggers
  (`invalidatesTags: ["Organization"]`) cannot unmount a form that now holds `errors`,
  `advancedOpen` and the admin's edits.
- **Prevention Rule:** A loading/data flag in a facade hook must be derived from a request that
  actually runs; never write a literal (or a shortened condition) into `isLoading` / `isLoaded`.
  When a query is disabled until a backend ships, introduce a named placeholder with its own comment
  (`const realIsLoading = false // no fetch yet`) rather than editing the real expression, and grep
  the mirror hook that the file claims to follow (`useOrgAssignmentRules` here) before assuming the
  shape is right. Symptom to recognise: skeleton / spinner that never resolves, no error in the
  console, and the component's own `if (isLoading) return` sits ABOVE its entitlement or error
  branches, so nothing downstream can ever explain itself.
- **Example:**
  ```ts
  // WRONG - true for every real session, and no request exists to settle it
  // isLoading: !isMock && !!orgId && isLoading,
  isLoading: !isMock && !!orgId,

  // CORRECT - the query runs, its flag settles, and a failure falls back to defaults
  const { data, isLoading } = useGetOrgMapSettingsQuery(orgId, { skip: !orgId || isMock });
  return { loaded, isLoading: !isMock && !!orgId && isLoading };
  ```
  ```tsx
  // WRONG - every refetch unmounts the form, discarding errors/edits/disclosure state
  if (isLoading) return <Skeleton />;

  // CORRECT - placeholder for the first load only
  const [hasSettledOnce, setHasSettledOnce] = useState(false);
  useEffect(() => { if (!isLoading) setHasSettledOnce(true); }, [isLoading]);
  if (isLoading && !hasSettledOnce) return <Skeleton />;
  ```

### A client-side mapping is a claim about the server's schema — never validate it against its own shape

- **Date:** 2026-11-13
- **Mistake:** Auditing "which endpoints still use REST", 43 of the 335 `GQL_MAP` entries turned out
  to name something the BFF does not define: a `root: "Organization"` that does not exist (4 entries,
  including the Map Settings and Assignment Rules screens that are shipped), a `root: "CallControl"`
  (11) and `root: "Email"` (4), eleven `Get*ById` operations where only `GetList*` exists, and four
  list mappings requesting `currentPage/pageSize/totalRecords/totalFiltered/totalPage` that the
  GraphQL `ApiResponse` type does not have. Every one of them looks complete in review, compiles,
  lints, and fails only when a user opens the screen — because with `VITE_USE_GRAPHQL="true"` there
  is no REST fallback.
- **Root Cause:** The mapping layer is a hand-written string template
  (`gqlMapper.buildGraphQLQuery`), so there is no compiler, type or test between it and the server
  contract. A mapping was verified by reading it — "root Organization, operation GetOrgMapSettings,
  reads fine" — which checks internal consistency, not resolvability. The GraphQL schema was treated
  as something the backend team owns and the frontend may assume, when in fact the FE's own
  assumption *is* the risk surface: an unknown root fails exactly like a typo.
- **Correct Behavior:** Ask the server. Anonymous introspection is open on the BFF, so
  `scripts/validate-gql-map.mjs` re-parses every `GQL_MAP` entry exactly as `buildGraphQLQuery`
  builds it and walks the root → operation → selection set against the introspected schema. It needs
  no token and sends no document, so it is safe to run against any environment. First run: 43 of 335
  entries rejected; after the fixes, 38 (all pre-existing backlog) and none of the new ones.
- **Prevention Rule:** Any hand-written artifact that mirrors a remote contract — a GraphQL document,
  a REST route map, a protobuf field name, an SQL column list — must be checked against that
  contract by machine before it is called done, and the check must be re-runnable per environment
  (staging and production schemas drift). Prefer a check that fails loudly on a name the server does
  not know, over any that merely confirms the artifact is well-formed. Corollary for this repo:
  before adding a `GQL_MAP` entry, confirm each of `root`, `operationName`, `inputType` and every
  name in `fields` exists by introspection — do not infer `Get*ById` from the existence of a
  `GetList*`, and do not copy a `root` from a sibling mapping (the `Organization` entries were
  copied from each other, so the same non-existent root propagated four times).
- **Example:**
  ```bash
  # every entry the BFF cannot resolve, with the exact missing name
  node scripts/validate-gql-map.mjs https://cc-bff-stg.one-sky.ai/graphql
  #   Query.Organization does not exist (mapped root is unknown to the BFF)
  #   ApiResponse.totalRecords does not exist
  #   AppointmentTypeQuery.GetAppointmentTypeById does not exist
  ```

### A validator that disagrees with the code it validates manufactures defects

- **Date:** 2026-11-13
- **Mistake:** The first two runs of `validate-gql-map.mjs` reported 64 then 44 "broken" entries, and
  most of them were the tool's own bugs: it decided a mapping was a mutation from the HTTP method
  (the mapper decides from `config.mutation` alone, so a `POST` mapped to a read was checked against
  the Mutation root and invented ~20 defects), it flattened nested selection sets onto the parent
  type (inventing every `data { ... }` field as a missing field of `ApiResponse`), it read `mutation:
  true` as the string `"true"`, and it scanned raw source so the comment `"/role/add must be declared
  before /role/:id"` was parsed as a real key. Two rounds went into the tool instead of the task.
- **Root Cause:** The validator's rules were written from an intuition about GraphQL rather than read
  out of `buildGraphQLQuery`, the single place that defines them. A tool that models the production
  code from memory drifts from it exactly the way a hand-written mapping drifts from the schema — the
  same failure this tool exists to catch, one level up.
- **Correct Behavior:** Derive each rule from the production path and say which line it came from
  (`isMutation = config.mutation === true`, "the document keyword is `config.mutation`, the method
  only picks the key"), calibrate against entries already known to work, and treat a large,
  surprising failure count as a bug in the checker until proven otherwise. Also: strip comment lines
  before scanning source, and only claim a defect after reading the specific names it printed.
- **Prevention Rule:** When writing a checker for code, model the code's own rule — quote the
  function and condition it copies — and prove the checker first against known-good cases; if the
  first run flags a large share of the corpus, fix the checker before anyone acts on the list. Same
  family as "A batch text replacement that finds no match does not fail": a tool's exit code is not
  evidence, its output on a known-good case is. And a checker that can only be trusted after several
  iterations must never be used to justify edits in the same session without re-running it on the
  pre-change state (here: 43 before, 38 after, none of the new ones among the failures).

### An audit that names a silent fallback has not removed it — the defect ships until someone reports the symptom

- **Date:** 2026-11-13
- **Mistake:** The REST→GraphQL audit explicitly listed `EnhancedCrudContainer.tsx:170` as a
  transport bypass ("falls back to `apiService.delete` whenever a screen omits the `deleteItem`
  prop"), counted it as class C, and moved on to the mappings. The next user message was "deleting a
  User still uses REST": `UserManagement.tsx` was one of six call sites omitting that prop, so every
  user delete went out as a raw `fetch` to `${APP_CONFIG.API_BASE_URL}/api/users/:id`
  (`/api/v1/api/users/…`) — a URL the BFF does not serve. The row never disappeared either, because
  that path invalidates no RTK cache tag.
- **Root Cause:** The audit was written as an inventory (where the bypasses are) rather than as a
  work list (which ones are reachable from a live screen and therefore currently broken). Documenting
  a bypass makes it *known*, which feels like progress, but a fallback that silently changes
  transport — or worse, changes it to an invalid URL — stays invisible in normal use: no error in
  the console beyond a failed request, no failing test, no type error. Only the user's network tab
  sees it.
- **Correct Behavior:** Each bypass that a live screen can reach is a defect with a current victim,
  not a future cleanup item: wire the call site to the real hook (`deleteItem={handleDeleteUser}` →
  `useDeleteUserMutation` → `User.DeleteUser`, mapping already existed), and keep the finding open in
  the document until the call sites are converted. A guard that survives is the one that makes the
  fallback loud or removes it, not the one that records it.
- **Prevention Rule:** When an audit finds a fallback that silently switches transport, protocol or
  data source, resolve it in the same pass or mark it **open with its live call sites enumerated** —
  never "noted". Concretely here: a container prop that changes transport when omitted
  (`deleteItem`, `onFetch`, `queryFn`) must be checked on every call site (`grep '<deleteItem\|deleteItem='`),
  and the fix belongs in the call site, not in the fallback. Before declaring such a screen fixed,
  answer both questions: which transport does this click use now, and does the list refresh
  afterwards without a page reload?
- **Example:**
  ```tsx
  // WRONG - the container's raw-fetch fallback silently runs (REST, wrong URL, no cache refresh)
  <EnhancedCrudContainer apiConfig={{ endpoints: { delete: "/api/users/:id" } }} onDelete={handleDelete} />

  // CORRECT - the delete reaches createHybridBaseQuery, i.e. User.DeleteUser in GraphQL mode,
  // and invalidates the "User" tag that useGetUsersQuery provides
  const [deleteUserMutation] = useDeleteUserMutation();
  const handleDeleteUser = useCallback((id: string) => deleteUserMutation(id).unwrap(), [deleteUserMutation]);
  <EnhancedCrudContainer deleteItem={handleDeleteUser} ... />
  ```

### An endpoint name is global to the api slice — a second `injectEndpoints` copy silently picks the winner

- **Date:** 2026-11-16
- **Mistake:** The Organization admin page (`core/components/admin/user-management/organization/`)
  did not refresh after deleting a Command or a Station: the row stayed on screen until a full
  browser reload (a Department delete was fine). The mutations carried
  `invalidatesTags: ["Organization"]` and the queries `providesTags: ["Organization"]`, so the
  tagging looked complete — and had been "fixed" once already for exactly this symptom.
- **Root Cause:** Endpoint names are **global to the api slice**, and three of them were defined
  twice on `baseApi`: `getCommands` / `getStations` in `cms/store/api/dispatch.ts`
  (`providesTags: ["Dispatch"]`) as well as in `core/store/api/organizationApi.ts`
  (`["Organization"]`), and `getDepartments` in `core/store/api/userApi.ts` (no tags at all) as well
  as in `organizationApi`. RTK Query keeps exactly ONE definition per name
  (`rtk-query.modern.mjs`: `if (inject.overrideExisting !== true && endpointName in
  context.endpointDefinitions) continue;`), and every api file in this repo passes
  `overrideExisting: import.meta.env.DEV`. So the live definition is "the last module evaluated" in
  dev and "the first" in a production build — the same duplicate resolves to a different definition
  per environment, and HMR can flip it mid-session. Read live from the running dev server with
  `baseApi.enhanceEndpoints({ endpoints: { getCommands: d => … } })`: `getDepartments` provided
  `["Organization"]` (organizationApi won), `getCommands`/`getStations` provided `["Dispatch"]`
  (dispatch.ts won). `deleteCommands` invalidated `"Organization"`, no mounted query provided it,
  so RTK Query refetched nothing.
- **Correct Behavior:** Keep exactly one definition per endpoint name. `/departments`, `/commands`
  and `/stations` are owned by `@/core/store/api/organizationApi`; the colliding copies were deleted
  from `dispatch.ts` and `userApi.ts` (neither had a consumer — every call site already imported
  `organizationApi`), with a comment at each site saying why nothing may be re-added there.
- **Prevention Rule:** Before adding a `builder.query`/`builder.mutation` to any `*Api.ts`, grep for
  the endpoint name across `src/**/store/api/**` — a name already registered on the same slice is not
  a second endpoint, it is a coin flip on which definition runs. The three things that must agree for
  an invalidation to work (mutation invalidates, query provides, tag in `tagTypes`) are necessary but
  NOT sufficient: the providing definition also has to be the one that won. When a list stubbornly
  refuses to refresh although the tags look right, read the **live** definition
  (`baseApi.enhanceEndpoints({ endpoints: { <name>: def => … } })` in the browser console) instead of
  re-reading the source you assume is running — and remember `injectEndpoints` never *removes* an
  endpoint, so an HMR edit that deletes one leaves the old definition registered until a full reload.
- **Example:**
  ```ts
  // WRONG - two definitions of one name; which one is live depends on evaluation order
  // cms/store/api/dispatch.ts
  getCommands: builder.query<ApiResponse<Commands[]>, PaginationParams>({
    query: params => ({ url: "/commands", params }),
    providesTags: ["Dispatch"],            // <- wins in this dev session
  }),
  // core/store/api/organizationApi.ts
  getCommands: builder.query<ApiResponse<Command[]>, OrganizationQueryParams>({
    query: params => `/commands?...`,
    providesTags: ["Organization"],        // <- what deleteCommands invalidates
  }),

  // CORRECT - one definition, in the module that owns the resource
  // core/store/api/organizationApi.ts  (dispatch.ts / userApi.ts define nothing that lives here)

  // And the check that reads the LIVE definition, not the source:
  const { baseApi } = await import("/src/core/store/api/baseApi.ts");
  baseApi.enhanceEndpoints({ endpoints: { getCommands: def => console.log(def.providesTags) } });
  ```

### `t(key) || "fallback"` is dead code — a missing translation renders the key, not empty

- **Date:** 2026-11-16
- **Mistake:** `ResetPasswordModal` guarded every label with an inline Thai literal, e.g.
  `t("userform.resetPasswordDescriptionForAdmin") || "กรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านใหม่เพื่อรีเซ็ต"`.
  The `||` reads as protection against a missing catalog entry. It is not: `t` returns the dotted
  key itself when the lookup misses, and a non-empty string is truthy, so the right-hand side can
  never run. A key that is genuinely absent renders `userform.resetPassword` in the dialog —
  visible, but nothing like the intended sentence — while the fallback sits there looking like
  the safety net.
- **Root Cause:** `LanguageContext.t` → `getNestedValue(translations, path)` ends in
  `... as string || path`, i.e. "the value, or the path". `TranslationKey` is `string`
  (`src/core/types/i18n.ts`), so no compiler check ties a key to the catalogs either. Two
  independent reasons the fallback branch was never exercised, and neither is visible at a call
  site that "looks defensive".
- **Correct Behavior:** Write `t(key)` alone. The real verification is that the key exists in ALL
  THREE catalogs (`public/i18n/{en,th,cn}.json`) inside the same change — that is the check the
  `||` was pretending to be. Verify the edit by parsing each file with node, not PowerShell:
  `ConvertFrom-Json` collapses keys that differ only in case (these catalogs contain both
  `OVERDUE` and `Overdue`) and fails with "keys with different casing", which looks exactly like
  invalid JSON you just introduced.
- **Prevention Rule:** In this codebase a translation fallback branch never runs — `t` returns the
  key on a miss — so treat `t(k) || "…"` as a defect to remove, not as defensive coding. When
  adding a key, add it to `en`, `th` and `cn` in the same change and machine-check the catalogs
  with `JSON.parse` under node rather than with PowerShell's case-insensitive JSON reader.
- **Example:**
  ```tsx
  // WRONG - unreachable fallback; a missing key shows "userform.resetPassword" instead
  {t("userform.resetPassword") || "รีเซ็ตรหัสผ่าน"}

  // CORRECT - the key is the contract, verified against all three catalogs
  {t("userform.resetPassword")}

  // and the check that actually proves it (node, not ConvertFrom-Json):
  // node -e "for (const f of ['en','th','cn']) JSON.parse(require('fs').readFileSync(`public/i18n/${f}.json`,'utf8'))"
  ```

### A selector that matches nothing is not evidence that the UI element is missing

- **Date:** 2026-11-16
- **Mistake:** Reproducing the Custom Dashboard in a headless browser, a probe searched the
  toolbar for `getByRole("button", { name: /add widget|เพิ่ม widget/i })`, got `count: 0` after
  clicking Customize, and was one line short of reporting "the Add Widget button never renders —
  that is why you cannot add a widget". The button renders fine; its Thai label is
  **"เพิ่มวิดเจ็ต"**, which transliterates the English word instead of containing it, so the regex
  could never match. The defect list being built had an invented defect at the top of it.
- **Root Cause:** The selector was written from a guess about how the label would read, not read
  from the catalog that owns it. A zero count is ambiguous between "absent" and "not matched",
  and nothing in that run distinguished the two — so the probe's silence was read as the
  application's silence.
- **Correct Behavior:** Read the label from its source first (`public/i18n/th.json` →
  `dashboard.custom.add_widget` = "เพิ่มวิดเจ็ต"), and make every probe dump the text it actually
  saw (`body.innerText`) in the same run as the count. With the dump in hand the ambiguity is gone:
  the label had been on screen all along.
- **Prevention Rule:** Never report a missing UI element from a zero selector count. A negative
  result from an automated probe is a claim about the probe until the label's authoritative source
  — or a positive dump of what was on the page — is included in the same run. Same family as
  "A validator that disagrees with the code it validates manufactures defects": a checker's
  silence proves nothing about the system, only about the pattern.
- **Example:**
  ```js
  // WRONG - reports "button missing" when the label is merely spelled differently
  const n = await page.getByRole("button", { name: /add widget|เพิ่ม widget/i }).count();
  if (n === 0) report("Add Widget button never renders");

  // CORRECT - label taken from the catalog, plus the dump showing what was on screen
  // public/i18n/th.json: "add_widget": "เพิ่มวิดเจ็ต"
  const n = await page.getByRole("button", { name: "เพิ่มวิดเจ็ต" }).count();   // 1
  const seen = await page.locator("body").innerText();                        // "… เพิ่มวิดเจ็ต …"
  ```
### A request that carries the right value is not a request that succeeded

- **Date:** 2026-11-16
- **Mistake:** Changing the Jasper report login username to `<tenant>_<username>`, the evidence that
  "it works" was a captured POST body containing `j_username: "SKYICT_tester"`. That is what the
  client SENT. The report server had answered by redirecting the popup to
  `jasperserver/login.html` - the login was rejected. Reported at that point, the change would have
  read as verified while every report click dead-ended on Jasper's login page.
- **Root Cause:** The evidence was taken at the boundary that was edited (the request body) instead
  of at the other end (the response / the screen the server produced). A form POST, a `fetch` and a
  GraphQL mutation all leave the client looking healthy regardless of what the server decided, and
  a cross-origin POST is not even readable from the page that sent it - so the request is the only
  thing that is easy to observe, and it is exactly the thing that cannot prove the outcome.
- **Correct Behavior:** Probe both behaviours in the running app and compare: forcing the previous
  shared account (`bma`) sent the popup to the rendered report ("TIBCO Jaspersoft: 1.1 ..."), the
  new per-user name sent it to `login.html`. That differential located the outcome on the server and
  separated "our value is correct" from "the server accepted it". It also bounds the claim: the
  signed-in user in that session was the QA account `tester`, so the rejection proves *that*
  account is missing or mismatched - not that the naming convention is wrong.
- **Prevention Rule:** When verifying a change to an identity/credential value, a request payload,
  or anything a server is allowed to reject, capture the request AND the resulting state in the
  same run: the value sent plus the status, redirect or screen the server produced. Report a
  request-only capture as "the client now sends X", never as "X works". Where the old and the new
  behaviour can both be reproduced, run them as a differential - only the difference tells you which
  layer is responsible - and state the scope of what was verified (which account, which tenant).
- **Example:**
  ```js
  // WRONG - proves only that the form was built with the new name
  // captured: { j_username: "SKYICT_tester" }  -> "it works"

  // CORRECT - same run, both paths, and the server's answer for each
  // per-user  -> popup URL: .../jasperserver/login.html          (rejected)
  // shared    -> popup URL: .../flow.html?_flowId=viewReportFlow (report rendered)
  // conclusion: the format is right; the report server has no SKYICT_tester account yet
  ```

### An empty branch is not a missing capability — grep the verb before asserting absence

- **Date:** 2026-11-17
- **Mistake:** Planning the websocket token work, I read `baseQueryFactory.ts:40-42`
  (`if (result.error?.status === 401) { // Refresh token }`) and put a definite "no" into the plan's
  decision table: *"Is there a token-refresh endpoint? No — that branch is empty, so an expired token
  means a dead socket. Separate ticket; not blocking this change."* The user answered "there is a
  token-refresh endpoint". It does: `AuthContext.refreshToken` → `AuthProvider.refreshToken`
  (`AuthProvider.tsx:288-354`) → `AuthService.refreshToken` → `POST /auth/refresh` (GraphQL
  `AuthRefresh`, input `RefreshInput!`), plus a scheduled silent refresh on top of it. The wrong "no"
  had already re-scoped the reconnect design away from a refresh path.
- **Root Cause:** An empty branch is evidence about **that function**, not about the codebase. I had
  grepped only `Authorization|prepareHeaders` inside `store/api`, so the word `refresh` never entered
  a result set — and a search that was never run looks exactly like a search that found nothing. The
  claim then landed in a table where a "no" reads as final, so nobody had a reason to re-check it.
- **Correct Behavior:** Score "does X exist?" with a repo-wide grep on the capability's own vocabulary
  (`refresh`, `refreshToken`, `retry`, `reconnect`, `invalidate`, …) and read the state/context layer
  (context callbacks, provider `useCallback`s, scheduling hooks) before concluding. Then correct the
  document where the wrong claim was made, and re-derive whatever was scoped because of it — here the
  reconnect policy gained `refresh-and-retry` and a test that a second `4401` must stop, not loop.
- **Prevention Rule:** Never write "there is no X", "X does not exist", "not supported", or "separate
  ticket" into a plan, review, report or PR until a repo-wide grep for X's vocabulary has actually run
  in the session; one call site proves only that one call site does not do it. Absence claims are the
  most dangerous kind in a document because a wrong "no" silently deletes work from scope and nothing
  fails — no compiler, no test, no runtime. When one is disproved, say plainly that the earlier claim
  was wrong and re-scope, rather than quietly editing it away.
- **Example:**
  ```text
  WRONG (shipped in the plan as a settled question)
    Q6 | Is there a token-refresh endpoint?
       | No - baseQueryFactory.ts:40-42's 401 branch is empty. Separate ticket; not blocking.

  CORRECT (grep the vocabulary, then read the writers)
    $ rg -n "refreshToken" src
      src/core/context/AuthContext.tsx:10       refreshToken: () => Promise<void>;
      src/core/providers/AuthProvider.tsx:288   const refreshToken = useCallback(async () => {
      src/core/utils/authService.ts:333         static async refreshToken(refreshToken: string)
      src/core/store/api/authApi.ts:64          refreshToken: builder.mutation(… url: "/auth/refresh")
    -> the capability exists, so a 4401 close becomes "refresh once, then reconnect"
       instead of a dead end.
  ```

- **Recurred 2026-11-18 — the search was scoped, not missing.** Auditing which Organization
  Settings values are consumed at runtime, I wrote into the plan: *"`staff.tracking` ยังไม่มีกลไก —
  ต้องออกแบบ transport ใหม่"*, based on `grep -include "*.tsx" "setInterval\("` returning nothing
  relevant. It missed `useStaffPositions.ts` — a **`.ts`** file — which has implemented the whole
  thing for months: MOB websocket events (`mobEvents.ts`, `UNIT_SELECT`/`STATUS`/`TRACKING`), a
  safety-net poll (`ROSTER_SAFETY_REFETCH_MS`), a patch flush, a reconcile debounce and a refresh
  cooldown. The user corrected it with "backend มีแล้ว ลองตรวจสอบดู".
  Same failure, new mechanism: the vocabulary was right, the **scope filter** silently excluded the
  file that answers the question. An `include`/path/extension restriction turns a repo-wide search
  into a search of the files you already suspected.
  **Prevention Rule (added):** an absence claim requires a grep whose scope is the whole repo — no
  `--include`, no path prefix, no extension filter, or at minimum a second unfiltered run. State in
  the claim *what* was searched ("no `setInterval` under `src/cms/**/*.tsx`"), and if the answer
  matters for a plan, search the capability's domain nouns (`tracking`, `position`, `staff`) instead
  of one implementation detail (`setInterval`) — a poll can be a `setTimeout` chain, an RTK
  `pollingInterval`, a websocket heartbeat or a query refetch.

### A comment is source code the compiler reads — `*/` ends it wherever it appears

- **Date:** 2026-11-17
- **Mistake:** Documenting the new PII redaction character, the example value
  `**` + `/` + `**` + `/` + `1990` was written literally into three comments: once in the block
  comment above `applyMask`, and twice inside JSX comment expressions
  (`{/* ... */}` in `CasePanel.tsx` and `CustomerCreate.tsx`). Both JSX ones broke `tsc -b`
  (`TS1109: Expression expected`, `TS1161: Unterminated regular expression literal`) and
  ESLint's parser stopped on the same lines.
- **Root Cause:** A block comment and a JSX comment expression are both terminated by the
  two-character sequence `*` `/`, and a date written the obvious way contains it. The comment
  "looks fine" in the editor because the editor highlights it as a comment; the failure only
  appears where the tokenizer decides the comment ended, which is one character earlier than
  the author meant.
- **Correct Behavior:** Split the sequence with the backticks that already surround the
  example — `` `**`/`**`/1990 `` — which reads the same to a human and has no `*` `/` adjacency.
  The same applies to any literal in prose: a glob (`src/**/*.ts`), a regex fragment, a
  Markdown bold marker followed by a slash.
- **Prevention Rule:** Before writing `*/` into a comment of any kind, ask whether it is the
  comment terminator rather than part of the example; if it is, break the adjacency. This
  repository has **no CI and no git hooks** (`CLAUDE.md`), so a broken comment can be committed
  and only surface on someone else's `pnpm build` — run `tsc -b` (or `pnpm build`) after editing
  comments in `.tsx` files, not just after editing code.
- **Example:**
  ```tsx
  // WRONG - the `*/` ends the JSX comment, and the rest is parsed as an expression
  {/* The mask is a `**/**/1990` string */}

  // CORRECT - same meaning, no terminator inside the comment
  {/* The redaction is a `**`/`**`/1990 string */}
  ```

### The contract names an endpoint; the screen calls a different one

- **Date:** 2026-11-18
- **Mistake:** Front-end PII masking was switched off on the strength of the backend's
  published contract ("the BFF masks customer records"). A smoke test with a token carrying
  **zero `pii.*` permissions** then showed the customer list rendering `ana@gmail.com |
  085-002-0000` in the clear. The contract's row 1 names `CustomerQuery.GetListCustomer`, and
  that resolver *does* mask (`av****@example.com`, `******8901`, `************`-style
  `citizenId`) — but the customer screen fires `CustomerProduct.GetListCustomerProduct`, which
  is not in the contract at all and returns the same columns unmasked. Only the photo stayed
  hidden, because that one gate is fail-closed in the client (`canViewField("photo")`).
- **Root Cause:** A masking matrix is **per resolver**; a UI is **per screen**; nothing enforces
  that the two line up. The contract was read as "what the backend masks" and the client layer
  was disabled against it, without capturing which operation each screen actually calls. A
  resolver that ignores the permission fails in exactly the same way as one that honours it —
  HTTP 200, `status: "0"`, plausible-looking data.
- **Correct Behavior:** For every PII-bearing screen, capture the operation it really fires and
  test it with a permission-less token before trusting any other layer. Treat every endpoint
  outside the published matrix as unmasked until proven otherwise, and keep the client-side
  redaction fail-closed (`redact*`, flag-independent) on read surfaces rather than only on
  locked inputs.
- **Prevention Rule:** Never conclude "the backend masks this" from a contract document — prove
  it per screen, with the operation name taken from the network log and a token that lacks the
  permission. When a client-side safety layer is disabled because "another layer covers it",
  the coverage must be verified on the live screens, not on the endpoint names. Corollary: the
  one gate that kept working (photo) was the one written fail-closed in the client — prefer that
  shape for anything that cannot be masked by a string (`<img src>`, downloads, exports).
- **Example:**
  ```text
  Contract row 1:  GET /api/v1/customer -> CustomerQuery.GetListCustomer   -> masked  OK
  Screen's call:   CustomerProduct.GetListCustomerProduct                    -> NOT masked
                   email "ana@gmail.com", mobileNo "085-002-0000", photo URL intact
  Same token, same user, two resolvers, opposite answers.
  ```

### An entitlement bound to the component that renders a capability leaves every sibling surface open

- **Date:** 2026-11-18
- **Mistake:** `entitlement.gis` was enforced in exactly one place - `AddressMap`, the map
  SDK switch - and was treated as "GIS is gated". It was not. The assignment picker kept
  rendering its ETA/TTL column for a tenant whose GIS add-on had been removed from the
  fixture, and pressing Calculate called `routeService` against the paid routing provider.
  Two more surfaces were open the same way: the dispatch dashboard heatmap and the
  case-summary-by-area choropleth (which also pulled district polygons from object
  storage). The user found the picker one by looking at a screen; the other two came out
  of auditing for the same shape.
- **Root Cause:** The gate was placed at the component that DRAWS the capability. GIS is
  not "a map" - it is an SDK, a routing service and a boundary-geometry fetch - and several
  of its capabilities render without any map at all. Because the map component was gated,
  every review of a map screen said "gated", and nothing in the codebase could answer
  "which surfaces answer to `entitlement.gis`?". A second contributing fault: the org
  settings that were supposed to narrow this exact column
  (`staff.etaTtl.applyToAssignmentPicker`, plus `assignment.showWorkload` /
  `showAssignedCases` / `enableRecommendRanking`) were declared in the type, rendered in
  the admin form, and read by nobody - so the control an admin would reach for had no
  effect either.
- **Correct Behavior:** Enumerate the consumers of the capability's SERVICES, not the
  components that display its output: `routeService`, `boundarySource`, every `@arcgis` /
  `maplibre-gl` importer. Gate at each provider switch (`AddressMap`,
  `CaseAreaChoroplethMap`, `DispatchHeatmap`), gate the hook that would spend the call
  (`useOfficerRouteSolves({ enabled })`), gate the route whose whole point is the
  capability (`/dashboard/case-summary-by-area`), and make the column list declare its own
  capability (`officerColumns.ts`) so a new column cannot skip the question. Then write
  down where each feature is enforced (`FEATURE_SURFACES`) and let a test compare it
  against the catalogue.
- **Prevention Rule:** Never conclude "feature X is gated" from one gate. List every
  consumer of the service, SDK or endpoint that X unlocks - including consumers that render
  no UI from it - and gate each one, or record explicitly why it needs none. Two checks
  make that verifiable: a registry that maps each catalogue feature to the files that
  enforce it (with every path asserted to exist), and a test that fails when a catalogue
  key has no entry. And when a capability decision is made, use the fail-CLOSED read
  (`hasFeature`); `isLocked` answers `false` while entitlements load and briefly grants
  the thing you are trying to withhold.
- **Example:**
  ```text
  WRONG (the shape that shipped)            RIGHT (one line per consumer)
  AddressMap          -> EntitlementGate    AddressMap               -> EntitlementGate
  assign picker       -> (nothing)          officerColumns.ts        -> hasGis && org switch
  dispatch heatmap    -> (nothing)          useOfficerRouteSolves    -> enabled:false
  case-area map       -> (nothing)          CaseAreaChoroplethMap    -> EntitlementGate
                                            DispatchHeatmap          -> EntitlementGate
                                            /dashboard/case-summary-by-area -> requiredFeature
  ```

### HEAD is not "before" when the working tree is the release

- **Date:** 2026-11-18
- **Mistake:** A plan step required "compare the bundle chunk sizes before and after this
  change", and the obvious way to get a baseline was `git stash -u` -> `pnpm build` ->
  `git stash pop`. Running `git status` first showed why that was wrong: the branch carries
  a large uncommitted feature (a whole settings subsystem plus dozens of untracked source
  and doc files) on top of `HEAD`, which is a docs-only commit. The "before" build would
  have been a tree several features older than the one the change was made in - different
  entry graph, missing modules, and for the files this task touched, versions that predate
  the surrounding work entirely. It would also have moved every unrelated uncommitted file
  out of the tree for the duration of a two-minute build.
- **Root Cause:** "The previous state" was assumed to be `HEAD`. In a repo with no CI and no
  habit of committing before each task, `HEAD` can be arbitrarily far behind the tree that
  actually builds - so `HEAD` is a different codebase, not a previous revision of this one.
  Nothing in the git output volunteers that: `git stash` is happy to stash a feature.
- **Correct Behavior:** Check `git status --porcelain` and `git log -1` **before** planning
  any before/after measurement. When `HEAD` is behind, say so and verify the property the
  measurement exists for directly instead of inventing a baseline: here, "the three map SDKs
  are still separate lazy chunks" was provable from the single after-build (each provider
  had its own emitted chunk; `dist/index.html` preloaded only `index` + `vendor`), so the
  honest report was "separation verified, exact before/after sizes unavailable and why".
- **Prevention Rule:** A comparison needs a baseline you can name. Before promising
  "before vs after" for sizes, timings, counts or behaviour, confirm what the baseline state
  actually is - `HEAD`, a tag, a worktree, a saved artifact. If the baseline cannot be
  produced without disturbing unrelated work, do not produce one: pick the property the
  comparison exists to protect, verify that property on the after-state alone, and state the
  missing number as missing. Same family as "A guard that skips work without reporting is
  indistinguishable from success" - an unmeasurable diff quietly reported as measured is
  worse than no diff, because it looks like evidence.
- **Example:**
  ```text
  WRONG  plan: "stash, build, compare sizes" -> builds a codebase from weeks ago,
                                                buries every other uncommitted file
  RIGHT  git status --porcelain; git log -1  -> HEAD is a docs commit, tree is a release
         verify the property instead:           three provider chunks emitted separately,
         (SDKs stay in their own lazy chunk)    index.html preloads index+vendor only
         report: "separation verified; sizes not diffed - no valid baseline exists"
  ```

### A "presentational" component that gains a query gains a Provider requirement

- **Date:** 2026-11-19
- **Mistake:** Wiring the org's Place count into the Map Settings screen,
  `LayerMapSettings` (documented as "purely presentational - it renders `value` and
  reports edits") was given a `useGetPlacesQuery` call. `npx tsc -b` passed, `eslint`
  passed, and **five tests in `OrganizationSettingsManagement.test.tsx` failed at once**
  with `could not find react-redux context value; please ensure the component is
  wrapped in a <Provider>`. That test renders the settings page without a Redux store
  because, until that moment, nothing in the subtree touched one.
- **Root Cause:** A data-fetching hook is not a local implementation detail: it adds a
  RUNTIME REQUIREMENT to every renderer of the component - a store, a provider, a
  network mock - and the type system cannot express it. Components described as
  "presentational" are exactly the ones tests render bare, so the requirement lands on
  the tests least prepared for it. The compiler stays silent because the hook is legal
  where it is called.
- **Correct Behavior:** Either keep the section presentational (fetch in the page shell
  and pass the value down), or accept the new requirement and update every test that
  renders the subtree - here a two-line `vi.mock` of the api module, which also keeps
  the test hermetic instead of firing a real request from a unit test.
- **Prevention Rule:** Before adding a hook that reads shared state (RTK Query, Redux,
  a context) to a component, ask **who renders this and what do they provide?** Then
  grep the test files that render that subtree (`grep -rl "<ComponentName" src`) and
  decide per file: provide the store, or mock the new dependency. Treat "the file's own
  comment says presentational" as a design signal, not a licence - if the new value is
  genuinely a view concern of that section, say so in the comment and update the tests
  in the same change. Same family as "Never call a context-consumer hook inside the
  component that provides that context": hooks carry environmental requirements that
  compile fine and fail at render.
- **Example:**
  ```tsx
  // WRONG - green tsc, five red tests, "purely presentational" no longer true
  export function LayerMapSettings({ value, onChange }) {
    const { data } = useGetPlacesQuery({ start: 0, length: PLACE_FETCH_LIMIT });
    // ...
  }

  // RIGHT - same fetch, and the test that renders the section says what it provides
  vi.mock("@/cms/store/api/placesApi", () => ({
    useGetPlacesQuery: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  }));
  ```

- **Recurred 2026-11-19 - the trigger was a NEWLY RENDERED SUBTREE, not a new query.**
  Adding Assignment-Rules validation made a blocked Save focus the `assignment-rules` tab,
  which meant `SmartRoutingSettings` - and its existing `useGetCaseTypesSubTypesQuery` -
  rendered in `OrganizationSettingsManagement.test.tsx` for the first time. That file had
  only ever rendered the `map` tab, so the suite had never needed a store for the
  assignment half; five tests went red with `could not find react-redux context value` the
  moment a test navigated there.
  **Prevention Rule (added):** a test that renders one TAB of a tabbed page proves nothing
  about the other tabs. When a change can make a different tab/section/render branch
  active - a validation redirect, an error focus, a default tab change, a deep link - treat
  that subtree as newly tested and mock or provide everything it reads. When writing the
  test, assert the branch actually switched (the section's own copy is in the DOM), not
  only that the action was refused.

### A DevTools `import()` can be a second copy of a module the app loaded with `?t=`

- **Date:** 2026-11-19
- **Mistake:** Verifying "the runtime map configuration settles at login" by evaluating
  `await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")` in the browser console.
  It answered `{ settled: false, orgId: null }` while the app was fully logged in and had clearly settled
  (its settings form was populated from the server). Read at face value, that says "the bootstrap never
  runs" - and I was one step from reporting a bug in code that was working.
- **Root Cause:** Vite serves app modules with an HMR cache-buster (`…/mapRuntimeConfig.ts?t=1795072691577`)
  while a console `import()` of the bare path resolves `…/mapRuntimeConfig.ts`. Different URL = different
  module record = a **second instance** with fresh module state. The app had written to its instance;
  the probe read a new, empty one. Nothing distinguishes them at the call site.
- **Correct Behavior:** Verify through behaviour that cannot be duplicated - which chunk the network fetches
  (`ArcgisAddressMap` vs `LongdoAddressMap`), the attribution text rendered on the map, or a `window`
  sentinel checked before/after an SPA navigation to prove no full reload happened. When internal state is
  genuinely needed, go through a path that does real work rather than module memory: the RTK store is fine
  (`store.dispatch(...initiate(...))` hits the server), and so is anything keyed off storage.
- **Prevention Rule:** A `?t=` suffix in a dev URL is a second module instance, so **never treat a console
  `import()` as "the app's state"**. Before believing a negative reading from a probe, prove the probe is
  looking at the same instance: an unsettled/empty value in a session that visibly works is evidence about
  the probe, not the app. Prefer assertions the user could also see (network, rendered text, a sentinel) -
  same family as "A selector that matches nothing is not evidence that the UI element is missing".
- **Example:**
  ```js
  // WRONG - app loaded it as mapRuntimeConfig.ts?t=1795…; this is a NEW module
  const cfg = (await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")).getMapRuntimeConfig();
  // { settled: false, orgId: null }   <- about the probe, not the app

  // RIGHT - observable behaviour, immune to module duplication
  window.__smokeSentinel = Date.now();
  history.pushState({}, "", "/cms/case/creation"); dispatchEvent(new PopStateEvent("popstate"));
  // sentinel still there  => no reload;  map credit "Esri"  => the new provider applied
  ```

### A mock/sample payload that no test reads is a contract nobody checks

- **Date:** 2026-11-19
- **Mistake:** `src/core/mocks/organizationSettings.sh` was the *source* of the org-settings
  contract (the backend's own sample request), yet nothing in the repo read it: the smoke
  script carried its own copy of the document and the client had no test built on it. By the
  time anyone looked, the file had drifted in three ways at once - it named a non-existent
  GraphQL field (`ListConfigProperty`; the schema has `GetConfigPropertyLists`), it contained
  no response examples at all even though the client branches on `status`/`desc`, and its
  payload had already been superseded twice in two days. Every one of those is invisible
  until someone pastes the file into a terminal.
- **Root Cause:** A document is not compiled, not imported and not exercised, so it can be
  wrong in ways no tool fails on. Worse, it *looks* authoritative ("this is what the backend
  sends"), which is exactly why people copy it instead of interrogating the schema. Two
  prompts for the same fact existed (the doc and the smoke script), so neither was the source
  of truth.
- **Correct Behavior:** Promote the payload to ONE canonical file the code actually reads
  (`src/core/mocks/orgConfigProperties.payload.json`), and add a test that runs it through the
  real adapters in both directions: decode must lose nothing and invent nothing, and
  `encode()` must produce the same document back (that is what a Save sends). Verify every
  operation name and input type by introspection instead of copying them from the document,
  and record corrections in the document rather than quietly editing them.
- **Prevention Rule:** If a file is a sample of a remote contract, a test must read that exact
  file; otherwise treat it as unverified prose. The check that earns the name is
  **round-trip through the production adapter** - forward-only checks (does it parse?) pass on
  payloads the writer would corrupt. And any operation/field name in such a file gets
  introspected once, because a doc is a claim about the schema, not evidence of it.
- **Example:**
  ```ts
  // The guard that makes the fixture trustworthy (both directions, real adapters)
  const payload = JSON.parse(readFileSync("src/core/mocks/orgConfigProperties.payload.json", "utf8"));
  const decoded = decodeOrgConfigProperties(payload, "org-fixture");
  expect(normalize(decoded.mapSettings)).toEqual(normalize(payload.mapSettings));
  expect(normalize(encodeOrgConfigProperties(payload, decoded))).toEqual(normalize(payload));
  ```
  ```text
  WRONG  document says ListConfigProperty            -> "Cannot query field" at run time
  RIGHT  introspected Query.ConfigPropertyQuery      -> GetConfigPropertyLists(ListInput)
  ```

### A file the user maintains is not yours to rewrite

- **Date:** 2026-11-19
- **Mistake:** Asked to "survey" `src/core/mocks/organizationSettings.sh` and make it usable, I replaced
  the whole file with a runnable bash script. The user had to restore it ("ถูกเขียนทับ ... ห้ามเขียนทับนะ").
  The rebuilt file dropped the file's original shape and the owner's own edits, and the survey they asked
  for could have been delivered without writing anything to it.
- **Root Cause:** I treated a document as my artifact because I was improving it, and "make it usable"
  read like an instruction to author it. A whole-file `write` has no diff to review and no memory of what
  was there: it silently changes the file's PURPOSE (a contract notebook became a CLI script) and destroys
  anything the owner added since I read it. Nothing in the tooling warns - the file still opens fine.
- **Correct Behavior:** Read it, report, and propose the addition. If it must change, add to it (append a
  section) or hand over the exact block for the owner to paste. Their file, their edit.
- **Prevention Rule:** Before writing a whole file, establish who owns it. If the user's verb was
  **survey / inspect / evaluate** (สำรวจ / ตรวจ / ดู), the deliverable is a report - not an edit. If the
  file is one the user wrote or restored, `write` is forbidden: use targeted `edit`s or append-only
  additions, and ask when a restructure is genuinely needed. Corollary: never rebuild a spec/mock file into
  a different KIND of artifact (script, module) without explicit approval.
- **Example:**
  ```text
  WRONG  write("organizationSettings.sh", <new runnable script>)      -> owner must restore it
  RIGHT  read + report ("payload structure unchanged; only a Get example was added")
         + propose "may I APPEND a response-samples section?"        -> owner decides
  ```

### A styled input with its `checked`/`value` binding commented out is uncontrolled

- **Date:** 2026-11-19
- **Mistake:** Smoke-testing the routing criteria after a reload, the `unitProperty`
  checkbox reported `input.checked === false` while the stored document said `true`. My
  first reading was "the saved value did not persist" - a bug report about the settings
  page that would have been wrong. Measuring the visible tick instead showed it WAS drawn,
  and the real defect was different: clicking that checkbox once changed nothing, and it
  took two clicks to turn it off.
- **Root Cause:** `src/core/components/form/input/Checkbox.tsx` renders
  `<input type="checkbox" ... />` with the line `// checked={checked}` commented out. The
  DOM input is therefore uncontrolled - it starts `false` no matter what the prop says -
  while the tick is a separate `<svg>` drawn from the prop. So the first click on a
  persisted `true` reports `e.target.checked === true`, React state stays `true`, and the
  click is a silent no-op. A second copy of the same component (`src/cms/.../Checkbox.tsx`)
  has the line uncommented, which is why the bug is invisible unless you look at the right
  file.
- **Correct Behavior:** A styled checkbox must be driven by its prop
  (`checked={checked}`), with the visual driven by the same value. When reviewing a
  "value did not persist" symptom, first confirm the input is controlled: read the
  component, not the DOM.
- **Prevention Rule:** Before treating `.checked` / `.value` on a styled input as the
  component's state, read the component and check the binding is not commented out,
  shadowed, or replaced by an internal `useState`. Verify with the thing the user sees (a
  tick, a token) as well as the DOM property, and compare against any sibling copy of the
  component - a divergent duplicate is both a clue and the fix reference. Same family as
  "A selector that matches nothing is not evidence that the UI element is missing": a
  measurement that reads the wrong signal produces a confident, wrong bug report.
- **Example:**
  ```tsx
  // WRONG - uncontrolled input; the tick and the DOM disagree after any external reset
  <input type="checkbox" onChange={(e) => onChange(e.target.checked)} />
  {checked && <TickSvg />}

  // RIGHT - one source of truth
  <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  ```
- **Swept 2026-11-19 (same class, whole boolean-control surface):** after fixing the
  Checkbox, every Switch/Radio/checkbox-style control was audited. One more instance:
  `src/cms/components/crm/View.tsx` rendered filter radios with
  `// checked={String(query[filter.key]) === String(option.value)}` commented out, so a
  filter restored from the URL / a preset / "clear filters" never showed in the circle -
  and the sibling `checkbox` case three lines below was bound correctly, which is the clue
  that identified the intent. Fixed (1 line). Everything else came back clean:
  Switch (`core/components/form/switch/Switch.tsx`) is div-based and explicitly
  controlled-or-uncontrolled (`checked !== undefined`), and all 21 call sites pass either
  `checked`+`onChange` or `defaultChecked`+`key`; all four Radio copies
  (`core`/`cms` × `Radio`/`RadioSm`) bind `checked`; the raw radios in `Calendar.tsx` and
  `dynamic-form/renderFormField.tsx` bind `checked`; the two hand-rolled checkboxes
  (`AssignOfficerModel`, `singleAssignOfficer`) bind `checked` too.
  **Watch items (not defects, uncontrolled on purpose today):** `crm/Form.tsx` passes a
  live value as `defaultChecked` with no `key`, and `formsManagents/ButtonAction.tsx` drives
  a switch by `defaultChecked` + `onChick` while its `color` follows separate state - both
  drift if the source value changes without a remount.
- **Fixed 2026-11-19:** `src/core/components/form/input/Checkbox.tsx` now binds
  `checked={checked}` (it had been commented out; the `src/cms/…` duplicate was already
  correct). Guarded by `Checkbox.test.tsx`, which was proved to fail on the old version
  (3 of 5 cases: DOM does not mirror the prop, a stored `true` needs two clicks, a re-seed
  from props is ignored) and pass on the fixed one. All 12 live call sites were audited
  first - every one feeds `checked` from state its `onChange` updates, so none relied on the
  uncontrolled behaviour.
