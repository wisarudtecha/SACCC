// Tests for the org settings document adapter.
//
// The two behaviours these pin down are the ones that silently corrupt settings:
// decoding a legacy/corrupt document (a wrong-typed value must not reach a
// controlled input) and encoding a save (a field this client does not model must
// survive it). Both are invisible in a normal UI smoke test - the form renders,
// the values look plausible, and the data is wrong.
import { describe, it, expect } from "vitest";
import type { OrgConfigPropertiesDoc } from "@/core/types/organization";
import {
  buildDefaultOrgConfigProperties,
  decodeOrgAssignmentRules,
  decodeOrgConfigProperties,
  decodeOrgMapSettings,
  decodePropVal,
  encodeOrgConfigProperties,
  withAssignmentRulesPatch,
  withMapSettingsPatch,
} from "./orgConfigProperties";

const ORG_ID = "org-1";

describe("decodePropVal", () => {
  it("passes a decoded object through", () => {
    expect(decodePropVal({ a: 1 })).toEqual({ a: 1 });
  });

  it("parses JSON text (ConfigPropVal.MarshalJSON only decodes text starting with { or [)", () => {
    expect(decodePropVal('{"mapSettings":{"general":{"allowMapStyleChange":false}}}')).toEqual({
      mapSettings: { general: { allowMapStyleChange: false } },
    });
  });

  it("returns an empty object for unparseable text, arrays and null", () => {
    expect(decodePropVal("not json")).toEqual({});
    expect(decodePropVal("true")).toEqual({});
    expect(decodePropVal([1, 2])).toEqual({});
    expect(decodePropVal(null)).toEqual({});
    expect(decodePropVal(undefined)).toEqual({});
  });
});

describe("decodeOrgMapSettings", () => {
  it("falls back to schema defaults for an empty document", () => {
    const decoded = decodeOrgMapSettings(undefined, ORG_ID);
    expect(decoded.orgId).toBe(ORG_ID);
    expect(decoded.incident.showRadius).toBe(true);
    expect(decoded.staff.routing).toEqual({ mode: "manual", autoIntervalSeconds: null });
  });

  it("keeps stored values, including a number under a null default", () => {
    const decoded = decodeOrgMapSettings(
      {
        general: { allowMapStyleChange: false },
        staff: { routing: { mode: "auto", autoIntervalSeconds: 60 } },
        incident: { radiusMeters: 1200 },
      },
      ORG_ID
    );
    expect(decoded.general.allowMapStyleChange).toBe(false);
    expect(decoded.staff.routing).toEqual({ mode: "auto", autoIntervalSeconds: 60 });
    expect(decoded.incident.radiusMeters).toBe(1200);
    // Untouched fields keep their defaults.
    expect(decoded.incident.showRadius).toBe(true);
  });

  it("rejects a value whose type does not match the field", () => {
    const decoded = decodeOrgMapSettings(
      { layers: { showPlace: "yes", showSearch: 1 }, incident: { radiusMeters: "900" } },
      ORG_ID
    );
    // The default, not the rejected "yes" - and the default is FALSE because an
    // unwired org must keep today's hidden layer (D10 in
    // docs/ORG-SETTINGS-Runtime-Wiring-Plan.md).
    expect(decoded.layers.showPlace).toBe(false);
    expect(decoded.layers.showSearch).toBe(true);
    expect(decoded.incident.radiusMeters).not.toBe("900");
  });

  it("does not share a module-level default object between records", () => {
    // Same guarantee the retired `caseTypeSubTypes` array test made: the defaults in
    // orgAssignmentRules.ts are module-level objects, so handing one out by reference
    // would let one org's edit leak into the next record.
    const first = decodeOrgAssignmentRules({}, ORG_ID);
    first.advancedOptions.serviceSubType = "emergency";
    const second = decodeOrgAssignmentRules({}, ORG_ID);
    expect(second.advancedOptions.serviceSubType).toBe("general");
  });
});

describe("decodeOrgAssignmentRules", () => {
  it("fills areaBased and unitProperty with their defaults when the document predates them", () => {
    const decoded = decodeOrgAssignmentRules(
      {
        routingModes: {
          skillBased: true,
          availability: true,
          combineWithAnd: true,
        },
      },
      ORG_ID
    );
    expect(decoded.routingModes.areaBased).toBe(false);
    expect(decoded.routingModes.unitProperty).toBe(false);
    expect(decoded.routingModes.combineWithAnd).toBe(true);
  });

  it("reads a stored areaBased value", () => {
    const decoded = decodeOrgAssignmentRules({ routingModes: { areaBased: true } }, ORG_ID);
    expect(decoded.routingModes.areaBased).toBe(true);
  });

  it("reads a stored unitProperty value", () => {
    const decoded = decodeOrgAssignmentRules(
      { routingModes: { unitProperty: true } },
      ORG_ID
    );
    expect(decoded.routingModes.unitProperty).toBe(true);
  });
});

describe("decodeOrgConfigProperties", () => {
  it("decodes both sections out of one propVal", () => {
    const decoded = decodeOrgConfigProperties(
      {
        mapSettings: { layers: { showBoundaries: false } },
        assignmentRules: { routingModes: { skillBased: true } },
        assignmentMode: [{ type: "pic", mode: "auto", caseSubTypes: ["a"] }],
      },
      ORG_ID
    );
    expect(decoded.orgId).toBe(ORG_ID);
    expect(decoded.mapSettings.layers.showBoundaries).toBe(false);
    expect(decoded.assignmentRules.routingModes.skillBased).toBe(true);
    expect(decoded.assignmentMode).toEqual([
      { type: "pic", mode: "auto", caseSubTypes: ["a"] },
    ]);
  });

  it("accepts propVal arriving as JSON text", () => {
    const decoded = decodeOrgConfigProperties(
      JSON.stringify({ assignmentRules: { allocationMethod: "load_balance" } }),
      ORG_ID
    );
    expect(decoded.assignmentRules.allocationMethod).toBe("load_balance");
  });

  it("returns schema defaults for an absent document (nothing saved yet)", () => {
    expect(decodeOrgConfigProperties(null, ORG_ID)).toEqual(
      buildDefaultOrgConfigProperties(ORG_ID)
    );
  });
});

describe("encodeOrgConfigProperties", () => {
  const doc: OrgConfigPropertiesDoc = buildDefaultOrgConfigProperties(ORG_ID);

  it("never writes the client-side bookkeeping keys into propVal", () => {
    const encoded = encodeOrgConfigProperties({}, doc);
    const mapSettings = encoded.mapSettings as Record<string, unknown>;
    const assignmentRules = encoded.assignmentRules as Record<string, unknown>;
    expect(mapSettings.orgId).toBeUndefined();
    expect(assignmentRules.orgId).toBeUndefined();
    expect(mapSettings.updatedAt).toBeUndefined();
    expect(mapSettings.updatedBy).toBeUndefined();
  });

  it("no longer introduces the retired assignment keys into a document that lacks them", () => {
    // 2026-11-19 contract change: the org-wide `mode` and four routing criteria were
    // removed. The typed model no longer carries them, so a Save must not resurrect
    // them - that re-introduction was the drift the change exists to stop.
    const encoded = encodeOrgConfigProperties({}, doc);
    const assignmentRules = encoded.assignmentRules as Record<string, unknown>;
    const routingModes = assignmentRules.routingModes as Record<string, unknown>;

    expect(assignmentRules.mode).toBeUndefined();
    for (const retired of ["locationBased", "department", "caseType", "caseTypeSubTypes"]) {
      expect(routingModes[retired]).toBeUndefined();
    }
    // The criterion that replaced them does reach the server.
    expect(routingModes.unitProperty).toBe(false);
  });

  it("leaves a stale retired key that is already stored alone", () => {
    // Merge-don't-rebuild, stated as a test: a Save writes the document it owns, it
    // does not clean up keys another writer put there. Documented so nobody reads the
    // previous test as "Save removes them".
    const raw = {
      assignmentRules: { mode: "automatic", routingModes: { department: true } },
    };
    const encoded = encodeOrgConfigProperties(raw, buildDefaultOrgConfigProperties(ORG_ID));
    const assignmentRules = encoded.assignmentRules as Record<string, unknown>;
    const routingModes = assignmentRules.routingModes as Record<string, unknown>;

    expect(assignmentRules.mode).toBe("automatic");
    expect(routingModes.department).toBe(true);
  });

  it("writes the assignmentMode array it owns and keeps entries it cannot read", () => {
    // The one key that cannot ride on deepMerge: it is an array, and arrays are
    // replaced wholesale. Unknown-stage entries must still come back.
    const raw = {
      assignmentMode: [
        { type: "pic", mode: "auto", caseSubTypes: ["a"] },
        { type: "escalation", mode: "auto", caseSubTypes: ["z"] },
      ],
    };
    const doc: OrgConfigPropertiesDoc = {
      ...buildDefaultOrgConfigProperties(ORG_ID),
      assignmentMode: [{ type: "pic", mode: "manual", caseSubTypes: ["a"] }],
    };

    expect(encodeOrgConfigProperties(raw, doc).assignmentMode).toEqual([
      { type: "pic", mode: "manual", caseSubTypes: ["a"] },
      { type: "escalation", mode: "auto", caseSubTypes: ["z"] },
    ]);
  });

  it("does not introduce an empty assignmentMode array into a document that never had one", () => {
    const encoded = encodeOrgConfigProperties({}, buildDefaultOrgConfigProperties(ORG_ID));
    expect(encoded.assignmentMode).toBeUndefined();
  });

  it("keeps the assignmentMode key when the document already has one", () => {
    const encoded = encodeOrgConfigProperties(
      { assignmentMode: [{ type: "escalation", mode: "auto", caseSubTypes: ["z"] }] },
      buildDefaultOrgConfigProperties(ORG_ID)
    );
    expect(encoded.assignmentMode).toEqual([
      { type: "escalation", mode: "auto", caseSubTypes: ["z"] },
    ]);
  });

  it("round-trips a field this client has no control for (advancedOptions.serviceSubType)", () => {
    // The real flow: the document is DECODED from the row, edited, then encoded
    // back. Decoding carries `serviceSubType` into the typed model even though no
    // control sets it, which is what keeps a Save from resetting it to the default.
    const raw = { assignmentRules: { advancedOptions: { serviceSubType: "emergency" } } };
    const loaded = decodeOrgConfigProperties(raw, ORG_ID);
    expect(loaded.assignmentRules.advancedOptions.serviceSubType).toBe("emergency");

    const encoded = encodeOrgConfigProperties(raw, loaded);
    const advanced = (encoded.assignmentRules as Record<string, Record<string, unknown>>)
      .advancedOptions;
    expect(advanced.serviceSubType).toBe("emergency");
  });

  it("overwrites stored values when handed a defaults-built document", () => {
    // Documents WHY a save must not run while the read failed: without a decoded
    // document the typed model carries schema defaults, and encoding them over a
    // stored value replaces it. `useOrgConfigProperties` exposes `loadState` for
    // exactly this reason; the UI blocks Save on `error`.
    const encoded = encodeOrgConfigProperties(
      { assignmentRules: { advancedOptions: { serviceSubType: "emergency" } } },
      doc
    );
    const advanced = (encoded.assignmentRules as Record<string, Record<string, unknown>>)
      .advancedOptions;
    expect(advanced.serviceSubType).toBe("general");
  });

  it("preserves unknown nested keys the typed model does not know about", () => {
    const encoded = encodeOrgConfigProperties(
      { mapSettings: { staff: { tracking: { futureFlag: true } }, futureSection: { x: 1 } } },
      doc
    );
    const mapSettings = encoded.mapSettings as Record<string, unknown>;
    const tracking = (mapSettings.staff as Record<string, Record<string, unknown>>).tracking;
    expect(tracking.futureFlag).toBe(true);
    expect(mapSettings.futureSection).toEqual({ x: 1 });
  });

  it("overrides the fields the document does carry", () => {
    const edited: OrgConfigPropertiesDoc = {
      ...doc,
      mapSettings: { ...doc.mapSettings, incident: { ...doc.mapSettings.incident, radiusMeters: 1500 } },
    };
    const encoded = encodeOrgConfigProperties({ mapSettings: { incident: { radiusMeters: 900 } } }, edited);
    const incident = (encoded.mapSettings as Record<string, Record<string, unknown>>).incident;
    expect(incident.radiusMeters).toBe(1500);
  });

  it("accepts a raw document that arrived as JSON text", () => {
    const raw = JSON.stringify({
      assignmentRules: { advancedOptions: { serviceSubType: "inspection" } },
    });
    const encoded = encodeOrgConfigProperties(
      raw,
      decodeOrgConfigProperties(raw, ORG_ID)
    );
    const advanced = (encoded.assignmentRules as Record<string, Record<string, unknown>>)
      .advancedOptions;
    expect(advanced.serviceSubType).toBe("inspection");
  });
});

describe("section patches", () => {
  const doc = buildDefaultOrgConfigProperties(ORG_ID);

  it("applies a map-settings patch without touching the assignment section", () => {
    const next = withMapSettingsPatch(doc, { layers: { showSearch: false } });
    expect(next.mapSettings.layers.showSearch).toBe(false);
    expect(next.assignmentRules).toEqual(doc.assignmentRules);
  });

  it("applies an assignment-rules patch without touching the map section", () => {
    const next = withAssignmentRulesPatch(doc, {
      routingModes: { areaBased: true },
    });
    expect(next.assignmentRules.routingModes.areaBased).toBe(true);
    expect(next.mapSettings).toEqual(doc.mapSettings);
  });
});
