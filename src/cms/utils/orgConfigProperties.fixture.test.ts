// Drift guard for the canonical org-settings payload.
//
// `src/core/mocks/orgConfigProperties.payload.json` is the ONE document the mock
// spec (`organizationSettings.sh`) and `scripts/smoke-org-settings.mjs` both point
// at. Without this test the payload can silently drift from what the client
// actually reads and writes - which already happened twice in two days (the
// 2026-11-19 contract dropped `assignmentRules.mode` and four routing criteria, and
// added `assignmentMode[]` + `unitProperty`), and nothing failed.
//
// What it pins:
//   1. the payload is a document THIS client can read without loss;
//   2. the client writes back exactly what it read (no key invented, none dropped);
//   3. the payload passes the client's own validators, so it can be used to demo a
//      "fully configured" tenant rather than one the form would reject.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  decodeOrgConfigProperties,
  encodeOrgConfigProperties,
} from "./orgConfigProperties";
import { validateOrgMapSettings } from "./orgMapSettings";
import { validateAssignmentMode } from "./orgAssignmentMode";

const FIXTURE_PATH = "src/core/mocks/orgConfigProperties.payload.json";
const ORG_ID = "org-fixture";

function readPayload(): Record<string, unknown> {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Record<string, unknown>;
}

/** Key order is not part of the contract (the BFF re-serializes JSON), values are. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

describe("orgConfigProperties.payload.json", () => {
  it("carries exactly the three sections this client models", () => {
    expect(Object.keys(readPayload()).sort()).toEqual([
      "assignmentMode",
      "assignmentRules",
      "mapSettings",
    ]);
  });

  it("decodes without losing or inventing a map setting", () => {
    const payload = readPayload();
    const decoded = decodeOrgConfigProperties(payload, ORG_ID);
    const { orgId: mapOrgId, ...mapSettings } = decoded.mapSettings;

    expect(mapOrgId).toBe(ORG_ID);
    expect(normalize(mapSettings)).toEqual(normalize(payload.mapSettings));
  });

  it("decodes without losing or inventing an assignment rule", () => {
    const payload = readPayload();
    const decoded = decodeOrgConfigProperties(payload, ORG_ID);
    const { orgId: rulesOrgId, ...assignmentRules } = decoded.assignmentRules;

    expect(rulesOrgId).toBe(ORG_ID);
    expect(normalize(assignmentRules)).toEqual(normalize(payload.assignmentRules));
    // The four criteria retired on 2026-11-19 must not creep back in.
    expect(Object.keys(decoded.assignmentRules.routingModes).sort()).toEqual([
      "areaBased",
      "availability",
      "combineWithAnd",
      "skillBased",
      "unitProperty",
    ]);
  });

  it("decodes assignmentMode[] entry for entry, in the client's canonical order", () => {
    const payload = readPayload();
    const decoded = decodeOrgConfigProperties(payload, ORG_ID);

    expect(decoded.assignmentMode).toEqual(payload.assignmentMode);
  });

  it("writes back exactly what it read - the whole point of the guard", () => {
    const payload = readPayload();
    const decoded = decodeOrgConfigProperties(payload, ORG_ID);

    // encode() is what a Save sends: if it added a legacy key or dropped one, the
    // stored document would drift on the first edit an admin makes.
    expect(normalize(encodeOrgConfigProperties(payload, decoded))).toEqual(
      normalize(payload)
    );
  });

  it("passes the client's own validators, so it can seed a demo tenant", () => {
    const decoded = decodeOrgConfigProperties(readPayload(), ORG_ID);

    expect(validateOrgMapSettings(decoded.mapSettings)).toEqual({});
    expect(
      validateAssignmentMode(decoded.assignmentMode, decoded.assignmentRules.routingModes)
    ).toEqual({});
  });

  it("keeps the deliberately awkward seed values untouched", () => {
    const decoded = decodeOrgConfigProperties(readPayload(), ORG_ID);

    // Both are the backend's values, not the client's preferences - a fixture that
    // "looked nice" would stop testing these two states:
    //   - routing "auto" is DISABLED in the UI (decision D2/D8) but must still display
    //   - tracking 15s is below the 30s poll floor; the clamp happens at the point of
    //     use (decision D7), never by rewriting the stored document
    expect(decoded.mapSettings.staff.routing.mode).toBe("auto");
    expect(decoded.mapSettings.staff.tracking.autoIntervalSeconds).toBe(15);
  });
});
