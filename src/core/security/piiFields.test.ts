// src/core/security/piiFields.test.ts
//
// Pins the PII contract the frontend shares with the backend:
//
//   1. the redaction character is `*`, because the backend's write-back safeguard recognises a
//      masked value by that pattern — a prettier character would be written over the record;
//   2. every customer-record field is ONE class (`pii.user.sensitive.personal`), while the
//      dynamic form fields keep the two-way general/sensitive split and the case phone number
//      keeps its own permission;
//   3. `redact*` ignores `PII_MASKING_ENABLED` (a locked field never renders a real value),
//      while `mask*` is governed by it.
//
// Why these tests exist: every rule here is a string that nothing else type-checks. Point a rule
// at a permission no role can be granted and its field is masked for everybody forever; get the
// character wrong and the write-back safeguard silently stops recognising the mask. Neither
// fails to compile.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADDRESS_PARTS,
  CASE_PII_FIELDS,
  CONTACT_PII_FIELDS,
  CUSTOMER_PII_FIELDS,
  PII_CASE_PHONE_PERMISSION,
  PII_CUSTOMER_GENERAL_PERMISSION,
  PII_CUSTOMER_SENSITIVE_PERMISSION,
  PII_FULL_MASK,
  PII_USER_SENSITIVE_PERMISSION,
  applyMask,
  canEditCasePhoneNo,
  getCasePiiRule,
  getContactPiiRule,
  getCustomerPiiRule,
  getDynamicFieldPiiRule,
  maskAddressParts,
  maskCaseField,
  maskContactField,
  maskCustomerField,
  omitUnviewableCustomerPii,
  redactCaseField,
  redactContactField,
  redactCustomerField,
  redactValue,
} from "./piiFields";

const REDACTED = "****";

describe("applyMask", () => {
  it("redacts with `*`, the character the backend recognises", () => {
    expect(applyMask("0812345678", { strategy: "lastN", keep: 4, permission: "x" })).toBe(
      "******5678"
    );
    expect(applyMask("anything", { strategy: "full", permission: "x" })).toBe(REDACTED);
  });

  it("never discloses a value too short to partially hide", () => {
    // Equal length would render the whole value in the clear.
    expect(applyMask("1234", { strategy: "lastN", keep: 4, permission: "x" })).toBe(REDACTED);
    expect(applyMask("1234", { strategy: "lastN", keep: 0, permission: "x" })).toBe(REDACTED);
    expect(applyMask("ab", { strategy: "truncate", keep: 2, permission: "x" })).toBe(REDACTED);
  });

  it("keeps one leading character and the domain for an email address", () => {
    expect(applyMask("somchai@example.com", { strategy: "email", permission: "x" })).toBe(
      "s******@example.com"
    );
    // A single-character local part is fully disclosed by "keep the first character".
    expect(applyMask("a@example.com", { strategy: "email", permission: "x" })).toBe(
      "*@example.com"
    );
    expect(applyMask("not-an-email", { strategy: "email", permission: "x" })).toBe(REDACTED);
  });

  it("keeps the year and masks day and month", () => {
    expect(applyMask("1990-05-12", { strategy: "yearOnly", permission: "x" })).toBe(
      "**/**/1990"
    );
    expect(applyMask("not a date", { strategy: "yearOnly", permission: "x" })).toBe(REDACTED);
  });

  it("leaves an absent value alone rather than implying data exists", () => {
    expect(applyMask(null, { strategy: "full", permission: "x" })).toBeNull();
    expect(applyMask(undefined, { strategy: "full", permission: "x" })).toBeUndefined();
    expect(applyMask("", { strategy: "full", permission: "x" })).toBe("");
  });

  it("fails closed on a strategy it does not know", () => {
    expect(applyMask("secret", { strategy: "bogus" as never, permission: "x" })).toBe(REDACTED);
  });
});

describe("the classification tables", () => {
  it("files every customer-record field under the one backend class", () => {
    for (const [path, rule] of Object.entries(CUSTOMER_PII_FIELDS)) {
      expect(rule.permission, path).toBe(PII_USER_SENSITIVE_PERMISSION);
    }
  });

  it("covers all thirteen address parts on both addresses", () => {
    expect(ADDRESS_PARTS).toHaveLength(13);
    for (const prefix of ["address", "currentAddress"]) {
      for (const part of ADDRESS_PARTS) {
        expect(getCustomerPiiRule(`${prefix}.${part}`), `${prefix}.${part}`).toBeDefined();
      }
    }
    // Eight scalar columns plus both address objects — a new rule has to be added deliberately.
    expect(Object.keys(CUSTOMER_PII_FIELDS)).toHaveLength(8 + ADDRESS_PARTS.length * 2);
  });

  it("classifies gender and blood, which used to be exposed in the clear", () => {
    expect(getCustomerPiiRule("gender")?.strategy).toBe("full");
    expect(getCustomerPiiRule("blood")?.strategy).toBe("full");
  });

  it("gives the case phone number its own permission", () => {
    expect(getCasePiiRule("phoneNo")).toMatchObject({
      strategy: "lastN",
      keep: 4,
      permission: PII_CASE_PHONE_PERMISSION,
    });
    expect(Object.keys(CASE_PII_FIELDS)).toEqual(["phoneNo"]);
    // The unconditional (flag-gated) read helper — the `redact*` counterpart is asserted below.
    expect(maskCaseField("phoneNo", "0812345678")).toBe("******5678");
    expect(maskCaseField("caseDetail", "broken window")).toBe("broken window");
  });

  it("classifies the customer-contact phone under the customer-record class", () => {
    // A separate table because `/customer_contacts` is its own entity: a customer has many
    // contacts, each with its own number. The permission class is the shared one.
    expect(getContactPiiRule("contactPhone")).toMatchObject({
      strategy: "lastN",
      keep: 4,
      permission: PII_USER_SENSITIVE_PERMISSION,
    });
    expect(Object.keys(CONTACT_PII_FIELDS)).toEqual(["contactPhone"]);
    expect(maskContactField("contactPhone", "0812345678")).toBe("******5678");
    // The contract does not classify the contact's name or address.
    expect(getContactPiiRule("contactName")).toBeUndefined();
    expect(getContactPiiRule("contactAddr")).toBeUndefined();
    expect(redactContactField("contactName", "Somchai", () => false)).toBe("Somchai");
  });

  it("does not classify the customer's name", () => {
    expect(getCustomerPiiRule("firstName")).toBeUndefined();
    expect(maskCustomerField("firstName", "Somchai")).toBe("Somchai");
  });

  it("keeps the dynamic-form split on the customer classes", () => {
    expect(getDynamicFieldPiiRule({ pii: "lastN" })).toEqual({
      strategy: "lastN",
      permission: PII_CUSTOMER_GENERAL_PERMISSION,
    });
    expect(
      getDynamicFieldPiiRule({
        pii: { strategy: "full", permission: PII_CUSTOMER_SENSITIVE_PERMISSION },
      })
    ).toEqual({ strategy: "full", permission: PII_CUSTOMER_SENSITIVE_PERMISSION });
    // Unmarked is the default: an admin's free-text field renders normally.
    expect(getDynamicFieldPiiRule({})).toBeUndefined();
  });
});

describe("maskAddressParts", () => {
  const address = {
    no: "7/129",
    road: "Baromrajchonnee Rd",
    street: "7/129",
    building: "Central Pinklao Tower A",
    floor: "19th",
    room: "1901",
    lat: "13.7563",
    lon: "100.5018",
    subDistrict: "Aroon-Amarin",
    district: "Bangkok Noi",
    province: "Bangkok",
    postalCode: "10700",
    country: "Thailand",
    untouched: "keep me",
  };

  it("redacts every part by default, including the coarse ones the contract now covers", () => {
    const masked = maskAddressParts(address);

    for (const part of ADDRESS_PARTS) {
      expect(masked[part], part).toBe(REDACTED);
    }
    expect(masked.untouched).toBe("keep me");
  });

  it("does not mutate the input", () => {
    const original = { ...address };
    maskAddressParts(address);
    expect(address).toEqual(original);
  });

  it("honours the caller's per-part permission", () => {
    const masked = maskAddressParts(address, part => part !== "province");
    expect(masked.province).toBe("Bangkok");
    expect(masked.no).toBe(REDACTED);
  });

  it("leaves an absent part absent rather than inventing a redaction", () => {
    const masked = maskAddressParts<{ no?: string; province?: string }>({ province: "Bangkok" });
    expect(masked.no).toBeUndefined();
    expect(masked.province).toBe(REDACTED);
  });
});

describe("redaction is a permission question, not a display one", () => {
  const canSee = () => true;
  const cannotSee = () => false;

  it("returns the real value to a viewer who may see the field", () => {
    expect(redactCustomerField("mobileNo", "0812345678", canSee)).toBe("0812345678");
    expect(redactCaseField("phoneNo", "0812345678", canSee)).toBe("0812345678");
  });

  it("redacts for a viewer who may not, whatever the masking flag says", () => {
    // No `PII_MASKING_ENABLED` in scope: that is the point.
    expect(redactCustomerField("mobileNo", "0812345678", cannotSee)).toBe("******5678");
    expect(redactCaseField("phoneNo", "0812345678", cannotSee)).toBe("******5678");
    expect(redactCustomerField("gender", "Male", cannotSee)).toBe(REDACTED);
  });

  it("passes an unclassified field through", () => {
    expect(redactCustomerField("firstName", "Somchai", cannotSee)).toBe("Somchai");
    expect(redactCaseField("caseDetail", "broken window", cannotSee)).toBe("broken window");
  });

  it("redacts nothing when the field carries no rule", () => {
    expect(redactValue("0812345678", undefined, false)).toBe("0812345678");
  });

  it("requires BOTH permissions before the case phone field may be edited", () => {
    // The field displays the customer's mobileNo and is submitted as the case's phoneNo, so one
    // permission is not enough: with either missing, the write is silently discarded.
    const granted = () => true;
    const withheld = () => false;

    expect(canEditCasePhoneNo(granted, granted)).toBe(true);
    expect(canEditCasePhoneNo(granted, withheld)).toBe(false);
    expect(canEditCasePhoneNo(withheld, granted)).toBe(false);
    expect(canEditCasePhoneNo(withheld, withheld)).toBe(false);
  });
});

describe("omitUnviewableCustomerPii", () => {
  const payload = {
    firstName: "Somchai",
    email: "somchai@example.com",
    mobileNo: "0812345678",
    gender: "Male",
    blood: "O",
    address: { no: "7/129", province: "Bangkok" },
    currentAddress: undefined as { no?: string } | undefined,
  };

  it("drops every key the viewer may not see and keeps the rest", () => {
    const result = omitUnviewableCustomerPii(
      payload,
      path => path === "email" || path === "address.province"
    );

    expect(result.email).toBe("somchai@example.com");
    expect(result.firstName).toBe("Somchai");
    // Newly classified, and the reason this test exists: both used to be written back.
    expect("gender" in result).toBe(false);
    expect("blood" in result).toBe(false);
    expect("mobileNo" in result).toBe(false);
    expect("address.no" in (result.address as object)).toBe(false);
    // A part the viewer may see survives.
    expect((result.address as { province?: string }).province).toBe("Bangkok");
  });

  it("does not mutate the caller's object, including the nested address", () => {
    const before = JSON.parse(JSON.stringify(payload));
    omitUnviewableCustomerPii(payload, () => false);

    expect(payload.address).toEqual(before.address);
    expect(payload.gender).toBe("Male");
  });

  it("leaves a parent that is absent or not an object exactly as it came in", () => {
    const result = omitUnviewableCustomerPii(payload, () => false);
    expect(result.currentAddress).toBeUndefined();
  });
});

describe("PII_MASKING_ENABLED", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const loadFlag = async (value: string | undefined): Promise<boolean> => {
    vi.stubEnv("VITE_ENABLE_PII_MASKING", value);
    vi.resetModules();
    const config = await import("./piiConfig");
    return config.PII_MASKING_ENABLED;
  };

  it("is OFF unless an environment literally opts in", async () => {
    // Reversed on purpose from the show-flag convention: the backend is the masking layer, and
    // a deployment that forgets the key must not mask twice. Flipping this back to
    // `!== "false"` re-introduces double masking in every unconfigured environment.
    expect(await loadFlag(undefined)).toBe(false);
    expect(await loadFlag("")).toBe(false);
    expect(await loadFlag("false")).toBe(false);
    expect(await loadFlag("1")).toBe(false);
  });

  it("is ON only for the literal string 'true'", async () => {
    expect(await loadFlag("true")).toBe(true);
  });
});

describe("exports used by the surfaces", () => {
  it("exposes the fixed-width full mask", () => {
    expect(PII_FULL_MASK).toBe(REDACTED);
  });
});
