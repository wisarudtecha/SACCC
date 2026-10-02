import { describe, expect, it } from "vitest";
import { aniLookupVariants, normalizeThaiAni } from "./ani";

describe("normalizeThaiAni", () => {
  it("strips spaces, dashes, parentheses and dots from a national number", () => {
    const result = normalizeThaiAni("(081) 122-3344");
    expect(result?.national).toBe("0811223344");
  });

  it("converts an E.164 Thai mobile number to national format", () => {
    const result = normalizeThaiAni("+66811223344");
    expect(result?.national).toBe("0811223344");
    expect(result?.e164).toBe("+66811223344");
  });

  it("converts a bare 66-prefixed number to national format", () => {
    const result = normalizeThaiAni("66811223344");
    expect(result?.national).toBe("0811223344");
  });

  it("converts a 0066-prefixed number to national format", () => {
    const result = normalizeThaiAni("0066811223344");
    expect(result?.national).toBe("0811223344");
  });

  it("prepends 0 to a 9-digit number with a Thai mobile prefix", () => {
    expect(normalizeThaiAni("811223344")?.national).toBe("0811223344");
    expect(normalizeThaiAni("912345678")?.national).toBe("0912345678");
  });

  it("prepends 0 to a 66-prefixed Bangkok landline number", () => {
    const result = normalizeThaiAni("6621234567");
    expect(result?.national).toBe("021234567");
    expect(result?.e164).toBe("+6621234567");
  });

  it("leaves an already-national mobile number unchanged", () => {
    const result = normalizeThaiAni("0811223344");
    expect(result?.national).toBe("0811223344");
    expect(result?.e164).toBe("+66811223344");
  });

  it("leaves an already-national 9-digit landline number unchanged", () => {
    const result = normalizeThaiAni("021234567");
    expect(result?.national).toBe("021234567");
    expect(result?.e164).toBe("+6621234567");
  });

  it("keeps short codes and extensions untouched with a null e164", () => {
    const emergency = normalizeThaiAni("191");
    expect(emergency?.national).toBe("191");
    expect(emergency?.e164).toBeNull();

    const extension = normalizeThaiAni("123456");
    expect(extension?.national).toBe("123456");
    expect(extension?.e164).toBeNull();
  });

  it("returns null when the input contains no digits", () => {
    expect(normalizeThaiAni("")).toBeNull();
    expect(normalizeThaiAni("   ")).toBeNull();
    expect(normalizeThaiAni("unknown")).toBeNull();
    expect(normalizeThaiAni("+---")).toBeNull();
  });

  it("keeps the raw input and the extracted digits alongside the normalized forms", () => {
    const result = normalizeThaiAni("+66 81 122 3344");
    expect(result?.raw).toBe("+66 81 122 3344");
    expect(result?.digits).toBe("66811223344");
  });

  it("is idempotent for every Thai shape", () => {
    for (const input of ["+66811223344", "66811223344", "0066811223344", "811223344", "0811223344", "021234567"]) {
      const first = normalizeThaiAni(input);
      expect(first).not.toBeNull();
      const second = normalizeThaiAni(first!.national);
      expect(second?.national).toBe(first!.national);
      expect(second?.e164).toBe(first!.e164);
    }
  });
});

describe("aniLookupVariants", () => {
  it("returns national, e164 and raw digits in order when all differ", () => {
    const ani = normalizeThaiAni("+66 81 122 3344");
    expect(aniLookupVariants(ani!)).toEqual(["0811223344", "+66811223344", "66811223344"]);
  });

  it("dedupes when the raw digits equal the national form", () => {
    const ani = normalizeThaiAni("0811223344");
    expect(aniLookupVariants(ani!)).toEqual(["0811223344", "+66811223344"]);
  });

  it("returns only the national form for a short code with no e164", () => {
    const ani = normalizeThaiAni("191");
    expect(aniLookupVariants(ani!)).toEqual(["191"]);
  });

  it("never returns an empty list for a valid normalization", () => {
    const ani = normalizeThaiAni("0811223344");
    expect(aniLookupVariants(ani!).length).toBeGreaterThan(0);
  });
});
