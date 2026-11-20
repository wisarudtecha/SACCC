#!/usr/bin/env node
// Staging smoke test for the Organization Settings storage path
// (config property `org.config.properties`).
//
// WHAT IT PROVES
//   1. `GetConfigPropertyByKey` on a key that has never been saved - the exact
//      envelope wording, which the FE uses to tell "nothing stored yet" apart from
//      "the read failed" (`NOT_STORED_PATTERN` in useOrgConfigProperties.ts).
//   2. `SetConfigPropertyByKey` UPSERTS (creates the row when it is absent).
//   3. The `propVal` JSON scalar round-trips faithfully: `assignmentMode[]` entry for
//      entry, the new `unitProperty` criterion, a key this client does not model
//      (`__smokeMarker`), and `advancedOptions.serviceSubType` (no UI control) - the
//      things a rebuild-instead-of-merge would erase. It also asserts the four
//      retired criteria and `assignmentRules.mode` do NOT come back.
//   4. Whether `data` comes back as the ROW (`{ propKey, propVal }`) or as the
//      document itself. The hook accepts both; this reports which one staging uses.
//
// SAFETY
//   It only ever WRITES the dedicated smoke key (`org.config.properties.smoke`).
//   The real key `org.config.properties` is read once, and only its shape is
//   printed - never its values. Nothing is deleted.
//
// USAGE
//   $env:ORG_SETTINGS_TOKEN = "<bearer>"     # preferred: not in shell history
//   node scripts/smoke-org-settings.mjs
//
//   node scripts/smoke-org-settings.mjs --token <bearer> [--url <graphql-url>] [--cleanup]
//
//   --cleanup deletes the smoke row at the end (DeleteConfigProperty), so the next
//   run starts from a genuinely never-saved key.
//
// Exit code 0 = every check passed, 1 = at least one failed or a request errored.

import { readFileSync } from "node:fs";

const DEFAULT_URL = "https://cc-bff-stg.one-sky.ai/graphql";
const SMOKE_KEY = "org.config.properties.smoke";
const REAL_KEY = "org.config.properties";
// The ONE canonical payload (also what `src/core/mocks/organizationSettings.sh` writes).
// Read at run time so this script cannot drift from the document the client is tested
// against - `orgConfigProperties.fixture.test.ts` guards the other direction.
const FIXTURE_PATH = new URL(
  "../src/core/mocks/orgConfigProperties.payload.json",
  import.meta.url
);

// Mirrors the FE's readEnvelopeStatus: a token is success only if it says so.
const SUCCESS_TOKENS = ["true", "0", "ok", "success", "succeeded"];
const FAILURE_TOKENS = ["false", "-1", "error", "fail", "failed"];

const classifyStatus = (status) => {
  if (status === true) return "success";
  if (status === false) return "failure";
  if (typeof status === "number") return status === 0 ? "success" : status === -1 ? "unknown" : "failure";
  if (typeof status === "string") {
    const token = status.trim().toLowerCase();
    if (token === "") return "unknown";
    if (SUCCESS_TOKENS.includes(token)) return "success";
    if (FAILURE_TOKENS.includes(token)) return "failure";
    return "unknown";
  }
  return "unknown";
};

/** The FE's own test for "nothing stored yet" (useOrgConfigProperties.ts). */
const NOT_STORED_PATTERN = /not\s*found|no\s*(?:record|data)|does\s*not\s*exist|ไม่พบ/i;

/**
 * The FE resolves its banner wording through `readEnvelopeMessage`, which prefers
 * `desc` over `msg` - so that is the string the "nothing stored yet" test sees.
 */
const envelopeMessageForPattern = (envelope) => {
  for (const candidate of [envelope.desc, envelope.msg]) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate;
  }
  return "";
};

/**
 * Structural equality. Key ORDER is not compared on purpose: the server stores
 * `propVal` as TEXT through a Go JSON value, which re-serializes maps with sorted
 * keys, so a byte comparison reports a false difference on identical data.
 */
const deepEqual = (left, right) => {
  if (left === right) return true;
  if (left === null || right === null) return false;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => key in right && deepEqual(left[key], right[key]));
};

/** Name the first differing path, so a failed comparison is actionable. */
const firstDifference = (left, right, path = "") => {
  if (deepEqual(left, right)) return null;
  const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!isObject(left) || !isObject(right)) {
    return `${path || "(root)"}: sent ${JSON.stringify(left)} vs read ${JSON.stringify(right)}`;
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const difference = firstDifference(left[key], right[key], path ? `${path}.${key}` : key);
    if (difference) return difference;
  }
  return `${path || "(root)"}: differs`;
};

const args = process.argv.slice(2);
const readArg = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const token = readArg("token") || process.env.ORG_SETTINGS_TOKEN || "";
const url = readArg("url") || process.env.ORG_SETTINGS_GRAPHQL_URL || DEFAULT_URL;

if (!token) {
  console.error(
    "No bearer token. Set $env:ORG_SETTINGS_TOKEN (preferred) or pass --token <bearer>."
  );
  process.exit(1);
}

const failures = [];
const notes = [];

const check = (label, condition, detail) => {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
    failures.push(label);
  }
};

const gql = async (query, variables) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (body.errors?.length) {
    const message = body.errors.map((entry) => entry.message).join(" | ");
    throw new Error(`GraphQL errors (HTTP ${response.status}): ${message}`);
  }
  // The response nests the envelope one level deeper than the root:
  //   { data: { ConfigProperty: { <operationName>: { status, msg, data, desc } } } }
  // Reading `data.ConfigProperty.status` (the root) is undefined - that mistake made
  // this script report "everything empty" while the API was answering correctly.
  const root = body.data?.ConfigProperty ?? {};
  return Object.values(root)[0] ?? {};
};

const GET_BY_KEY = `query GetByKey($input: ConfigPropertyKeyInput) {
  ConfigProperty { GetConfigPropertyByKey(input: $input) { status msg data desc } }
}`;

const SET_BY_KEY = `mutation SetByKey($input: ConfigPropertySetInput!) {
  ConfigProperty { SetConfigPropertyByKey(input: $input) { status msg data desc } }
}`;

// Only used by --cleanup, to remove the smoke row this script itself created.
const DELETE_BY_ID = `mutation DeleteById($input: GetIdInput!) {
  ConfigProperty { DeleteConfigProperty(input: $input) { status msg data desc } }
}`;

const describeEnvelope = (envelope) =>
  `status=${JSON.stringify(envelope.status)} outcome=${classifyStatus(envelope.status)} ` +
  `msg=${JSON.stringify(envelope.msg ?? "")} desc=${JSON.stringify(envelope.desc ?? "")}` +
  ` data=${envelope.data === null ? "null" : Array.isArray(envelope.data) ? `array(${envelope.data.length})` : typeof envelope.data}`;

/** propVal may arrive decoded, as JSON text, or wrapped in a row - accept all three. */
const unwrapPropVal = (data) => {
  if (data === null || data === undefined) return { shape: "null", document: null };
  if (typeof data === "object" && !Array.isArray(data) && typeof data.propKey === "string") {
    const raw = data.propVal;
    const document =
      typeof raw === "string" ? JSON.parse(raw) : raw && typeof raw === "object" ? raw : null;
    return { shape: "row", document, updatedAt: data.updatedAt, updatedBy: data.updatedBy };
  }
  if (typeof data === "string") {
    return { shape: "json-text", document: JSON.parse(data) };
  }
  if (typeof data === "object") {
    return { shape: "document", document: data };
  }
  return { shape: typeof data, document: null };
};

const main = async () => {
  console.log(`Endpoint: ${url}`);
  console.log(`Smoke key: ${SMOKE_KEY} (the only key this script writes)\n`);

  // ── 1) Read a key that has never been saved ────────────────────────────────
  console.log("1) GET smoke key before anything is stored");
  const before = await gql(GET_BY_KEY, { input: { propKey: SMOKE_KEY } });
  console.log(`  ${describeEnvelope(before)}`);
  notes.push(
    `missing-key envelope: ${describeEnvelope(before)} -> outcome "${classifyStatus(before.status)}"`
  );
  const beforeOutcome = classifyStatus(before.status);
  check(
    "a never-saved key is either a conclusive failure or a success with no data",
    beforeOutcome !== "unknown" || before.data === null,
    "an `unknown` status WITH data present would be ambiguous to the FE"
  );

  // The one wording the FE depends on: `NOT_STORED_PATTERN` is what separates
  // "nothing saved yet" (defaults + Save allowed) from "the read failed" (Save
  // disabled, so a real failure cannot overwrite the stored document).
  if (before.data === null) {
    const missingMessage = envelopeMessageForPattern(before);
    check(
      "the FE's NOT_STORED_PATTERN recognises the server's wording",
      NOT_STORED_PATTERN.test(missingMessage),
      `wording ${JSON.stringify(missingMessage)} would classify as "error", which disables Save for a tenant that has never saved`
    );
  } else {
    console.log(
      "  NOTE  a row already exists for the smoke key (an earlier run), so the missing-key wording was not sampled - run with --cleanup to reset it"
    );
  }

  // ── 2) Upsert a realistic document ─────────────────────────────────────────
  // Built from the canonical fixture, with exactly two deliberate deviations:
  //   - `serviceSubType` is set to "emergency" (the fixture has "general", which is also
  //     the schema default) because a client that RESET unmanaged values instead of
  //     preserving them would produce "general" by accident - the check below can only
  //     tell the difference if the sent value is not the default.
  //   - `__smokeMarker` is a key this client does not model at all.
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  const document = {
    ...structuredClone(fixture),
    assignmentRules: {
      ...structuredClone(fixture.assignmentRules),
      advancedOptions: {
        ...structuredClone(fixture.assignmentRules.advancedOptions),
        serviceSubType: "emergency",
      },
    },
    __smokeMarker: { writtenAt: new Date().toISOString() },
  };

  console.log("\n2) SET smoke key (upsert)");
  const written = await gql(SET_BY_KEY, { input: { propKey: SMOKE_KEY, propVal: document } });
  console.log(`  ${describeEnvelope(written)}`);
  check(
    "the write reports success",
    classifyStatus(written.status) === "success",
    `outcome was "${classifyStatus(written.status)}"`
  );

  // ── 3) Read it back and compare ────────────────────────────────────────────
  console.log("\n3) GET smoke key after the write");
  const after = await gql(GET_BY_KEY, { input: { propKey: SMOKE_KEY } });
  console.log(`  ${describeEnvelope(after)}`);
  const { shape, document: stored, updatedAt } = unwrapPropVal(after.data);
  console.log(`  payload shape: ${shape}${updatedAt ? `, updatedAt=${updatedAt}` : ""}`);
  notes.push(`read-back payload shape: ${shape}`);

  check("the read-back carries a document", stored !== null && typeof stored === "object");
  if (stored && typeof stored === "object") {
    check(
      "map half round-trips",
      stored.mapSettings?.assignment?.showWorkload === true &&
        stored.mapSettings?.incident?.radiusMeters === 900
    );
    check(
      "staff Auto interval survives as a NUMBER (not stringified)",
      stored.mapSettings?.staff?.routing?.autoIntervalSeconds === 60,
      `got ${JSON.stringify(stored.mapSettings?.staff?.routing?.autoIntervalSeconds)}`
    );
    check(
      "routingModes.areaBased round-trips",
      stored.assignmentRules?.routingModes?.areaBased === true,
      `got ${JSON.stringify(stored.assignmentRules?.routingModes?.areaBased)}`
    );
    check(
      "routingModes.unitProperty round-trips (new criterion, 2026-11-19)",
      stored.assignmentRules?.routingModes?.unitProperty === true,
      `got ${JSON.stringify(stored.assignmentRules?.routingModes?.unitProperty)}`
    );
    check(
      "assignmentMode[] round-trips entry for entry",
      deepEqual(stored.assignmentMode, document.assignmentMode),
      firstDifference(document.assignmentMode, stored.assignmentMode) ?? ""
    );
    check(
      "the retired assignment keys stay out of the stored rules",
      stored.assignmentRules?.mode === undefined &&
        stored.assignmentRules?.routingModes?.locationBased === undefined &&
        stored.assignmentRules?.routingModes?.department === undefined &&
        stored.assignmentRules?.routingModes?.caseType === undefined &&
        stored.assignmentRules?.routingModes?.caseTypeSubTypes === undefined,
      `retired keys present: ${JSON.stringify(stored.assignmentRules)}`
    );
    check(
      "advancedOptions.serviceSubType round-trips (no UI control for it)",
      stored.assignmentRules?.advancedOptions?.serviceSubType === "emergency",
      `got ${JSON.stringify(stored.assignmentRules?.advancedOptions?.serviceSubType)}`
    );
    check(
      "unknown key __smokeMarker survives",
      stored.__smokeMarker !== undefined,
      "a rebuild-instead-of-merge would have dropped it"
    );
    check(
      "no client-side bookkeeping leaked into propVal",
      stored.mapSettings?.orgId === undefined &&
        stored.assignmentRules?.orgId === undefined &&
        stored.mapSettings?.updatedAt === undefined
    );

    // Structural equality on the parts we sent. NOT a string comparison: the server
    // stores propVal as TEXT through a Go JSON value, which re-serializes maps with
    // sorted keys, so byte equality reports a false difference.
    const sentSections = {
      mapSettings: document.mapSettings,
      assignmentRules: document.assignmentRules,
      assignmentMode: document.assignmentMode,
    };
    const readSections = {
      mapSettings: stored.mapSettings,
      assignmentRules: stored.assignmentRules,
      assignmentMode: stored.assignmentMode,
    };
    const difference = firstDifference(sentSections, readSections);
    check(
      "every section is structurally identical after the round trip",
      difference === null,
      difference ?? ""
    );
  }

  // ── 4) Read the REAL key, read-only ────────────────────────────────────────
  console.log(`\n4) GET the real key ${REAL_KEY} (read only - never written here)`);
  const real = await gql(GET_BY_KEY, { input: { propKey: REAL_KEY } });
  console.log(`  ${describeEnvelope(real)}`);
  const realDecoded = unwrapPropVal(real.data);
  if (realDecoded.document) {
    const keys = Object.keys(realDecoded.document);
    console.log(`  top-level keys: ${keys.join(", ") || "(none)"}`);
    const rules = realDecoded.document.assignmentRules;
    if (rules?.routingModes) {
      console.log(
        `  routingModes keys: ${Object.keys(rules.routingModes).join(", ")}`
      );
    }
    notes.push(`real key present, top-level: ${keys.join(", ")}`);
  } else {
    notes.push(`real key: ${describeEnvelope(real)}`);
    console.log(
      "  (no stored document yet - the FE would show schema defaults and Save would create it)"
    );
  }

  // ── 5) Cleanup (--cleanup) ─────────────────────────────────────────────────
  if (args.includes("--cleanup")) {
    console.log("\n5) Cleanup: remove the smoke row this run created");
    const smokeRowId =
      after.data && typeof after.data === "object" ? after.data.id : undefined;
    if (smokeRowId === undefined || smokeRowId === null) {
      console.log("  skipped - the read-back carried no id");
    } else {
      try {
        const deleted = await gql(DELETE_BY_ID, { input: { id: String(smokeRowId) } });
        console.log(`  ${describeEnvelope(deleted)}`);
        const removed = classifyStatus(deleted.status) === "success";
        console.log(`  ${removed ? "removed" : "NOT removed"} (id ${String(smokeRowId)})`);
        notes.push(`cleanup: ${removed ? "smoke row deleted" : "delete did not report success"}`);
      } catch (error) {
        // Housekeeping must never fail the verification result.
        console.log(`  cleanup request failed (not fatal): ${error.message}`);
        notes.push(`cleanup failed: ${error.message}`);
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n── Notes ──");
  for (const note of notes) console.log(`  - ${note}`);

  if (failures.length > 0) {
    console.log(`\nFAILED (${failures.length}): ${failures.join("; ")}`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
};

main().catch((error) => {
  console.error(`\nRequest failed: ${error.message}`);
  process.exit(1);
});
