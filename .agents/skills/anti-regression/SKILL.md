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
