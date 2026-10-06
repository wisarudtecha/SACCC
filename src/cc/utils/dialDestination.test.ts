import { describe, expect, it } from "vitest";
import {
  dialDestinationDigits,
  dialDestinationErrorKey,
  validateDialDestination,
} from "./dialDestination";

describe("validateDialDestination", () => {
  it("accepts a Thai national number and returns it trimmed", () => {
    const result = validateDialDestination("  0811223344  ");
    expect(result).toEqual({ ok: true, destination: "0811223344" });
  });

  it("accepts a formatted E.164 number verbatim, without normalizing", () => {
    const result = validateDialDestination("+66 81-122-3344");
    expect(result).toEqual({ ok: true, destination: "+66 81-122-3344" });
  });

  it("accepts a short internal extension", () => {
    const result = validateDialDestination("100");
    expect(result).toEqual({ ok: true, destination: "100" });
  });

  it("accepts a DTMF service code with * and #", () => {
    const result = validateDialDestination("*121#");
    expect(result).toEqual({ ok: true, destination: "*121#" });
  });

  it("accepts the maximum of 20 significant characters", () => {
    const destination = `+${"1".repeat(20)}`;
    expect(validateDialDestination(destination)).toEqual({
      ok: true,
      destination,
    });
  });

  it("rejects empty and whitespace-only input", () => {
    expect(validateDialDestination("")).toEqual({ ok: false, reason: "empty" });
    expect(validateDialDestination("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects letters", () => {
    expect(validateDialDestination("0811-ABC")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a + anywhere but the leading position", () => {
    expect(validateDialDestination("08+11")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(validateDialDestination("0811+")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects input with no significant characters", () => {
    expect(validateDialDestination("+")).toEqual({ ok: false, reason: "invalid" });
    expect(validateDialDestination("( - )")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects more than 20 significant characters", () => {
    expect(validateDialDestination("1".repeat(21))).toEqual({
      ok: false,
      reason: "too_long",
    });
    // Separators do not count toward the bound.
    expect(validateDialDestination(`+${"1".repeat(20)}-`)).toMatchObject({
      ok: true,
    });
  });

  it("ignores separators when counting significant characters", () => {
    const spaced = ` ${"1".repeat(20)} `;
    expect(validateDialDestination(spaced)).toEqual({
      ok: true,
      destination: "1".repeat(20),
    });
  });
});

describe("dialDestinationErrorKey", () => {
  it("maps each rejection reason to its i18n key", () => {
    expect(dialDestinationErrorKey("empty")).toBe(
      "cc.softphone.dialpad_invalid_empty"
    );
    expect(dialDestinationErrorKey("invalid")).toBe(
      "cc.softphone.dialpad_invalid_chars"
    );
    expect(dialDestinationErrorKey("too_long")).toBe(
      "cc.softphone.dialpad_invalid_length"
    );
  });
});

describe("dialDestinationDigits", () => {
  it("extracts the digits from a formatted destination", () => {
    expect(dialDestinationDigits("+66 81-122-3344")).toBe("66811223344");
  });

  it("returns an empty string when there are no digits", () => {
    expect(dialDestinationDigits("*#")).toBe("");
  });
});
