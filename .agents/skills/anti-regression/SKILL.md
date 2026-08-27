# Anti-Regression Skill

## Purpose

Prevent the AI from repeating mistakes that have already been
identified and documented.

## Mandatory Rule

Whenever the AI makes a mistake, violates a requirement, produces
an incorrect implementation, or receives corrective feedback:

1. Identify exactly what went wrong.
2. Determine the root cause.
3. Extract a generalizable lesson.
4. Convert the lesson into a concrete rule or constraint.
5. Write the lesson into this SKILL.md file.
6. Before performing similar work in the future, review the
   accumulated rules in this file.
7. Never repeat a documented mistake unless the current context
   explicitly requires a different behavior.

## Learning Format

Every new lesson must contain:

### [Lesson]
- Date:
- Mistake:
- Root Cause:
- Correct Behavior:
- Prevention Rule:
- Example:

## Important

Do not merely record the symptom.

The lesson must be written as a reusable rule that can prevent
the same class of mistake in future tasks.

Bad:
> I forgot to add validation.

Good:
> Whenever accepting external input, validate it at the boundary
> before passing it to internal business logic.

## Before Every Task

Check the rules in this file for lessons relevant to the current task.

## After Every Correction

If the user corrects the AI, treat the correction as a potential
new lesson and update this file when the lesson is generalizable.

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
