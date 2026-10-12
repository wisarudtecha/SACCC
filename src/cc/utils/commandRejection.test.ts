import { describe, expect, it } from "vitest";
import { extractRejectionMessage } from "./commandRejection";

describe("extractRejectionMessage", () => {
  it("returns the envelope msg from a business rejection (200 + '-1')", () => {
    expect(
      extractRejectionMessage({ data: { status: "-1", msg: "already monitored" } })
    ).toBe("already monitored");
  });

  it("returns null when the error has no envelope (transport failure)", () => {
    expect(extractRejectionMessage(new Error("Failed to fetch"))).toBeNull();
    expect(extractRejectionMessage({ status: 500 })).toBeNull();
  });

  it("returns null for empty or whitespace-only messages", () => {
    expect(extractRejectionMessage({ data: { msg: "" } })).toBeNull();
    expect(extractRejectionMessage({ data: { msg: "   " } })).toBeNull();
  });

  it("returns null for non-object errors", () => {
    expect(extractRejectionMessage(null)).toBeNull();
    expect(extractRejectionMessage(undefined)).toBeNull();
    expect(extractRejectionMessage("already monitored")).toBeNull();
  });
});
