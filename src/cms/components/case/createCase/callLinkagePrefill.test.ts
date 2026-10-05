import { describe, expect, it } from "vitest";
import { readCallLinkagePrefill } from "./callLinkagePrefill";

function params(entries: Record<string, string>): URLSearchParams {
  return new URLSearchParams(entries);
}

describe("readCallLinkagePrefill", () => {
  it("maps a full param set to the prefill object", () => {
    const prefill = readCallLinkagePrefill(
      params({
        callId: "3cx-call-8842",
        ani: "+66811223344",
        callTimestamp: "2026-10-05T10:30:00.000Z",
      })
    );
    expect(prefill).toEqual({
      callId: "3cx-call-8842",
      ani: "+66811223344",
      callTimestamp: "2026-10-05T10:30:00.000Z",
    });
  });

  it("accepts a callId alone — ani and timestamp are optional", () => {
    expect(readCallLinkagePrefill(params({ callId: "mock-leg-1" }))).toEqual({
      callId: "mock-leg-1",
    });
  });

  it("returns null without a callId, even when ani/timestamp are present", () => {
    expect(
      readCallLinkagePrefill(
        params({ ani: "+66811223344", callTimestamp: "2026-10-05T10:30:00.000Z" })
      )
    ).toBeNull();
    expect(readCallLinkagePrefill(new URLSearchParams())).toBeNull();
  });

  it("returns null for a blank callId", () => {
    expect(readCallLinkagePrefill(params({ callId: "   " }))).toBeNull();
    expect(readCallLinkagePrefill(params({ callId: "" }))).toBeNull();
  });

  it("trims surrounding whitespace from values", () => {
    const prefill = readCallLinkagePrefill(
      params({ callId: "  call-1  ", ani: " 081-234 5678 " })
    );
    expect(prefill).toEqual({ callId: "call-1", ani: "081-234 5678" });
  });

  it("caps oversized values instead of failing", () => {
    const longId = "x".repeat(300);
    const prefill = readCallLinkagePrefill(
      params({ callId: longId, ani: "y".repeat(200) })
    );
    expect(prefill?.callId).toHaveLength(100);
    expect(prefill?.ani).toHaveLength(32);
  });

  it("keeps a timestamp only when it parses as a date", () => {
    expect(
      readCallLinkagePrefill(
        params({ callId: "call-1", callTimestamp: "not-a-date" })
      )
    ).toEqual({ callId: "call-1" });
    expect(
      readCallLinkagePrefill(
        params({ callId: "call-1", callTimestamp: "2026-10-05T10:30:00.000Z" })
      )
    ).toEqual({ callId: "call-1", callTimestamp: "2026-10-05T10:30:00.000Z" });
  });

  it("drops an empty ani instead of storing a blank string", () => {
    expect(
      readCallLinkagePrefill(params({ callId: "call-1", ani: "" }))
    ).toEqual({ callId: "call-1" });
  });
});
