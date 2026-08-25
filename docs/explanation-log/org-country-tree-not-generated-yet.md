# Explanation

## Understanding the problem

Two symptoms were reported, and they turned out to be the same bug.

1. `boundarySource.ts` fires four `GetOrgCountryTree` calls on every page load. The first, second
   and fourth return `status: "-1"` with
   `"Tree not generated yet for this area country, call generate_tree first"`; the third succeeds.
2. The country `<select>` on Area Management contains an option that renders as
   `undefined (undefined)`.

**The four calls are not duplicates.** `fetchOrgTrees` fans out one call per country, and RTK
Query deduplicates concurrent `initiate` calls with the same argument — so four network requests
means four distinct country ids. Three of those countries have never had `generate_tree` run
against them. A deterministic "same three fail every reload" is per-country server state, not a
race. That half is a data problem, not a code one.

**The bug is that those three failures were indistinguishable from success.** The BFF answers a
business failure with HTTP 200 and no GraphQL `errors` array:

```json
{ "status": "-1", "msg": "Tree not generated yet for this area country, call generate_tree first",
  "data": null, "desc": "" }
```

`hybridBaseQuery` only converted transport and GraphQL-schema faults into RTK errors, so the
request FULFILLED and `.unwrap()` resolved. Then `normalizeToApiResponse`
(`src/core/utils/gqlUtils.ts`) coerced the payload:

```ts
data: extracted?.data ?? []      // null becomes []
```

And `Boolean([]) === true`. Every downstream "did I get a tree?" test was a truthiness test, so
three empty arrays flowed through the app as if they were real countries:

| Consumer | Symptom |
|---|---|
| `useOrgAreaTrees.ts` | `filter(Boolean)` kept `[]`; `hasError` was always `false` |
| `AreaManagement.tsx` (cms component) | `countriesOptions` → `{ value: undefined, label: "undefined (undefined)" }` |
| `AreaHierarchyView.tsx` | blank top-level rows, all sharing the key `compositeId("country", undefined)` |
| `AreaTemplateSyncModal.tsx` | phantom sync targets; the `trees.length === 1` preselect misfired |
| `AreaAssignmentView.tsx` | phantom country blocks in user area assignment |
| `boundarySource.ts` | a nameless country in the boundary picker and in the colouring pass |
| `AreaTreePreview` | `[]` defeated its own `!tree` empty state, so the "generate it first" hint never showed |

A second defect in the same family: `isApiSuccess` ended in `return Boolean(status)`, and
`Boolean("-1")` is `true` — so the BFF's own failure code read as **success** and printed a
success toast over a rejected write.

## How to verify

- Open the case-create map with `VITE_BOUNDARY_SOURCE="org"`. In the Network tab, the
  `/area/countries/{id}/tree` requests carry **different** ids — that is what confirms the count
  is the number of countries, not a repeated call.
- Before the fix: the boundary picker's country list is longer than the number of countries that
  actually drew, and the extra entries have blank labels.
- Before the fix: on Area Management, `countriesOptions` contains an entry whose `value` is
  `undefined`. It is visible in the province/district form's country dropdown.
- The general shape of the trap, reproducible in a console:
  `Boolean([])` → `true`, and `Boolean("-1")` → `true`.

## Suggested fix

Three layers, applied together.

**1. Reject conclusive failures once, centrally** (`src/core/store/api/hybridBaseQuery.ts`).
After `normalizeToApiResponse` in both transport branches, convert a negative envelope into a
real RTK error:

```ts
if (readEnvelopeStatus(record.status) === "failure") {
  return { error: { status: "ENVELOPE_ERROR", data: record,
                    error: readEnvelopeMessage(record) } as unknown as FetchBaseQueryError, meta };
}
```

Only `"failure"` converts. `readEnvelopeStatus` reports `"unknown"` for the *number* `-1` (which
`normalizeToApiResponse` substitutes when the server omits `status`), for the empty string and
for unrecognised tokens — all of which keep resolving, so endpoints that simply do not return the
field behave exactly as before. This is the consolidation `src/core/utils/apiResponseStatus.ts`
was written to seed.

**2. Stop `isApiSuccess` swallowing `"-1"`** (`src/cms/utils/apiResponse.ts`). Reject explicit
failure tokens up front, then fall through to the existing logic unchanged. Deliberately *not*
rewritten as `readEnvelopeStatus(...) === "success"`, which would also flip status-less responses
to failure.

**3. Guard the payload shape at every tree read** (`src/cms/utils/areaTree.ts`). Layer 1 leaves
inconclusive envelopes resolving, so a truthy-but-empty payload can still arrive:

```ts
export const isAreaCountryTree = (value: unknown): value is AreaCountryTree =>
  Boolean(value)
  && typeof value === "object"
  && !Array.isArray(value)                                  // the line that matters
  && typeof (value as AreaCountryTree).countryId === "string";
```

`readAreaCountryTree` / `readAreaCountryTreeFailure` wrap it and classify the outcome as `ok`,
`not-generated` or `failed`, so the UI can offer the Generate button rather than a bare error.
`useOrgAreaTrees`, `boundarySource` and `AreaTemplateDetailView` all read through them.

The ungenerated countries are then **surfaced, not auto-generated**: Area Management shows a
banner naming them with a Generate button gated on `area.create`/`area.update`. Generating from a
read path would 403 for a dispatcher on the case-create map and stampede across open tabs.

## Summary

- **Cause**: a business failure arrives HTTP 200 and FULFILLED; `normalizeToApiResponse` coerces
  its null payload to `[]`; `Boolean([])` is `true`, so every truthiness guard downstream accepted
  it as data.
- **Fix**: `hybridBaseQuery` rejects conclusive failure envelopes; `isApiSuccess` no longer reads
  `"-1"` as success; tree reads validate the payload *shape* instead of its truthiness.
- **Impact**: the "four calls" were never duplicates — they are one per country, and three of the
  org's countries genuinely need `generate_tree` run. They are now visible and fixable from the
  Area Management banner instead of failing silently.
