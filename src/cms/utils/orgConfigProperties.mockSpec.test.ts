// Read-only drift guard between the mock contract notebook and the canonical payload.
//
// WHY THIS EXISTS, AND WHAT IT MAY NOT DO
//   `src/core/mocks/organizationSettings.sh` is maintained by hand (it is the backend's
//   own sample request). Nobody may rewrite it - so this test READS it and compares its
//   payload's SHAPE with `orgConfigProperties.payload.json`, the fixture the client tests
//   and the smoke script use.
//
//   Chain of trust: `orgConfigProperties.fixture.test.ts` proves the fixture round-trips
//   through the client's adapters; this test proves the mock spec still describes the same
//   shape. If the spec gains or loses a field, the fixture (and therefore the client) has
//   to follow - and if the spec is reformatted so this test cannot find the payload, it
//   FAILS LOUDLY instead of skipping, because a guard that silently skips proves nothing.
//
// VALUES ARE NOT COMPARED, ONLY SHAPES: the fixture deliberately carries real BMA
// `caseSubTypes` ids while the spec carries placeholder UUIDs.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MOCK_SPEC_PATH =
  process.env.ORG_SETTINGS_MOCK_SPEC ?? "src/core/mocks/organizationSettings.sh";
const FIXTURE_PATH = "src/core/mocks/orgConfigProperties.payload.json";

/**
 * `path.to.value: type`, with array indices collapsed to `[]` and every element merged,
 * so the result is order-insensitive and readable in a diff.
 */
function shapePaths(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    const merged = value.flatMap((item) => shapePaths(item, `${path}[]`));
    return merged.length > 0 ? merged : [`${path}[]: empty`];
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).flatMap((key) =>
      shapePaths((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key)
    );
  }
  if (value === null) {
    return [`${path}: null`];
  }
  return [`${path}: ${typeof value}`];
}

function uniqueSorted(paths: string[]): string[] {
  return [...new Set(paths)].sort();
}

/** The `propVal` object of the CreateConfigProperty sample in the mock spec. */
function readMockSpecPayload(): Record<string, unknown> {
  const text = readFileSync(MOCK_SPEC_PATH, "utf8");
  const blocks = [...text.matchAll(/--data '([\s\S]*?)'/g)].map((match) => match[1]);

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block);
    } catch {
      continue;
    }
    const sample = parsed as {
      query?: string;
      variables?: { input?: { propVal?: unknown } };
    };
    const propVal = sample.variables?.input?.propVal;
    if (
      typeof sample.query === "string" &&
      sample.query.includes("CreateConfigProperty") &&
      propVal &&
      typeof propVal === "object"
    ) {
      return propVal as Record<string, unknown>;
    }
  }

  throw new Error(
    `${MOCK_SPEC_PATH} no longer contains a parseable CreateConfigProperty sample with variables.input.propVal. ` +
      "Either the sample was removed/reformatted, or this extractor needs updating - do not delete the guard."
  );
}

describe("organizationSettings.sh vs the canonical payload", () => {
  it("describes exactly the same shape as the fixture", () => {
    const spec = readMockSpecPayload();
    const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Record<string, unknown>;

    expect(uniqueSorted(shapePaths(spec))).toEqual(uniqueSorted(shapePaths(fixture)));
  });

  it("still has the three top-level sections, including assignmentMode[]", () => {
    expect(Object.keys(readMockSpecPayload()).sort()).toEqual([
      "assignmentMode",
      "assignmentRules",
      "mapSettings",
    ]);
  });

  it("does not describe any routing criterion retired on 2026-11-19", () => {
    const spec = readMockSpecPayload();
    const routingModes = (spec.assignmentRules as { routingModes: Record<string, unknown> })
      .routingModes;

    expect(Object.keys(routingModes).sort()).toEqual([
      "areaBased",
      "availability",
      "combineWithAnd",
      "skillBased",
      "unitProperty",
    ]);
  });
});
