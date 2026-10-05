import { describe, expect, it } from "vitest";
import { CALL_ID_DEDUPE_MAX, createSeenCallIds } from "./callIdDedupe";

describe("createSeenCallIds", () => {
  it("reports unseen ids as absent and remembers added ones", () => {
    const seen = createSeenCallIds();
    expect(seen.has("call-1")).toBe(false);
    seen.add("call-1");
    expect(seen.has("call-1")).toBe(true);
    expect(seen.size).toBe(1);
  });

  it("re-adding an existing id is a no-op (redelivery stays deduped)", () => {
    const seen = createSeenCallIds();
    seen.add("call-1");
    seen.add("call-1");
    expect(seen.size).toBe(1);
  });

  it("never exceeds the cap, evicting the oldest id first", () => {
    const seen = createSeenCallIds(3);
    seen.add("call-1");
    seen.add("call-2");
    seen.add("call-3");
    seen.add("call-4");
    expect(seen.size).toBe(3);
    expect(seen.has("call-1")).toBe(false);
    expect(seen.has("call-2")).toBe(true);
    expect(seen.has("call-3")).toBe(true);
    expect(seen.has("call-4")).toBe(true);
  });

  it("evicts strictly in insertion order", () => {
    const seen = createSeenCallIds(2);
    seen.add("a");
    seen.add("b");
    seen.add("c"); // evicts "a"
    seen.add("b"); // no-op — must NOT refresh "b"'s position
    seen.add("d"); // evicts "b", not "c"
    expect(seen.has("b")).toBe(false);
    expect(seen.has("c")).toBe(true);
    expect(seen.has("d")).toBe(true);
  });

  it("defaults to the documented session cap", () => {
    const seen = createSeenCallIds();
    for (let index = 0; index < CALL_ID_DEDUPE_MAX + 25; index += 1) {
      seen.add(`call-${index}`);
    }
    expect(seen.size).toBe(CALL_ID_DEDUPE_MAX);
    // The oldest 25 were evicted; the newest entries survive.
    expect(seen.has("call-0")).toBe(false);
    expect(seen.has(`call-${CALL_ID_DEDUPE_MAX + 24}`)).toBe(true);
  });

  it("treats a redelivered id as fresh once evicted (documented bounded-memory tradeoff)", () => {
    // After a full session (>100 distinct calls), the earliest ids fall out
    // of memory. A redelivery of such an id shows a new card — accepted
    // behavior per the contract §5.2 (dedupe memory is bounded), locked here
    // so a refactor cannot change it silently.
    const seen = createSeenCallIds(2);
    seen.add("call-1");
    seen.add("call-2");
    seen.add("call-3"); // "call-1" evicted
    expect(seen.has("call-1")).toBe(false);
  });
});
