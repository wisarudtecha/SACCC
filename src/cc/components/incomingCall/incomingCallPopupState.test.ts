import { describe, expect, it } from "vitest";
import type { AniNormalization } from "../../utils/ani";
import type { IncomingCallEvent } from "../../types/incomingCall";
import type { CaseSummary, CustomerSummary } from "../../utils/incomingCallPayload";
import {
  INCOMING_CALL_AUTO_DISMISS_MS,
  INCOMING_CALL_MAX_ACTIVE,
  incomingCallPopupReducer,
  type IncomingCallPopupItem,
} from "./incomingCallPopupState";

const NOW = 1_000_000;

const ANI: AniNormalization = {
  raw: "+66811223344",
  digits: "66811223344",
  national: "0811223344",
  e164: "+66811223344",
};

function call(callId: string): IncomingCallEvent {
  return { callId, ani: "+66811223344", timestamp: "2026-10-02T10:30:00.000Z" };
}

function enqueue(state: IncomingCallPopupItem[], callId: string, now = NOW) {
  return incomingCallPopupReducer(state, { type: "enqueue", call: call(callId), ani: ANI, now });
}

describe("incomingCallPopupReducer — enqueue", () => {
  it("adds a pending item whose expiry is now plus the auto-dismiss window", () => {
    const state = enqueue([], "call-1");
    expect(state).toHaveLength(1);
    expect(state[0]?.call.callId).toBe("call-1");
    expect(state[0]?.lookup).toBe("pending");
    expect(state[0]?.casesStatus).toBe("idle");
    expect(state[0]?.expiresAt).toBe(NOW + INCOMING_CALL_AUTO_DISMISS_MS);
  });

  it("ignores an event whose callId is already active", () => {
    const state = enqueue([], "call-1");
    const deduped = enqueue(state, "call-1", NOW + 5_000);
    expect(deduped).toHaveLength(1);
    // The original item keeps its expiry — the duplicate did not refresh it.
    expect(deduped[0]?.expiresAt).toBe(NOW + INCOMING_CALL_AUTO_DISMISS_MS);
  });

  it("drops new events once the active queue is full", () => {
    let state: IncomingCallPopupItem[] = [];
    for (let index = 1; index <= INCOMING_CALL_MAX_ACTIVE; index += 1) {
      state = enqueue(state, `call-${index}`);
    }
    expect(state).toHaveLength(INCOMING_CALL_MAX_ACTIVE);

    const overflow = enqueue(state, `call-${INCOMING_CALL_MAX_ACTIVE + 1}`);
    expect(overflow).toHaveLength(INCOMING_CALL_MAX_ACTIVE);
    expect(overflow.every((item) => !item.call.callId.includes("5"))).toBe(true);
  });
});

describe("incomingCallPopupReducer — dismiss / expire", () => {
  it("dismiss removes only the targeted call", () => {
    const state = enqueue(enqueue([], "call-1"), "call-2");
    const dismissed = incomingCallPopupReducer(state, { type: "dismiss", callId: "call-1" });
    expect(dismissed.map((item) => item.call.callId)).toEqual(["call-2"]);
  });

  it("expire removes only items whose time has elapsed", () => {
    let state = enqueue([], "call-1", NOW);
    state = enqueue(state, "call-2", NOW + 10_000);
    const afterExpiry = incomingCallPopupReducer(state, {
      type: "expire",
      now: NOW + INCOMING_CALL_AUTO_DISMISS_MS,
    });
    expect(afterExpiry.map((item) => item.call.callId)).toEqual(["call-2"]);
  });

  it("expire keeps items exactly at the boundary alive until the next tick", () => {
    const state = enqueue([], "call-1", NOW);
    const alive = incomingCallPopupReducer(state, {
      type: "expire",
      now: NOW + INCOMING_CALL_AUTO_DISMISS_MS - 1,
    });
    expect(alive).toHaveLength(1);
  });
});

describe("incomingCallPopupReducer — resolution transitions", () => {
  const CUSTOMER: CustomerSummary = {
    id: "cust-42",
    displayName: "Jane W.",
    firstName: "Jane",
    lastName: "Wong",
    mobileNo: "0811223344",
    email: "jane@example.com",
    photo: "",
  };

  const CASES: CaseSummary[] = [
    { caseId: "D260708-00001", statusId: "S001", priority: 1, receivedDate: "2026-10-02T00:00:00.000Z" },
  ];

  it("walks the happy path: pending → resolving → resolved, then cases load", () => {
    let state = enqueue([], "call-1");
    state = incomingCallPopupReducer(state, { type: "resolutionStarted", callId: "call-1" });
    expect(state[0]?.lookup).toBe("resolving");

    state = incomingCallPopupReducer(state, {
      type: "customerResolved",
      callId: "call-1",
      customer: CUSTOMER,
    });
    expect(state[0]?.lookup).toBe("resolved");
    expect(state[0]?.customer).toEqual(CUSTOMER);

    state = incomingCallPopupReducer(state, { type: "casesLoading", callId: "call-1" });
    expect(state[0]?.casesStatus).toBe("loading");

    state = incomingCallPopupReducer(state, {
      type: "casesLoaded",
      callId: "call-1",
      cases: CASES,
    });
    expect(state[0]?.casesStatus).toBe("loaded");
    expect(state[0]?.cases).toEqual(CASES);
  });

  it("records an unknown caller without inventing a customer", () => {
    let state = enqueue([], "call-1");
    state = incomingCallPopupReducer(state, { type: "resolutionStarted", callId: "call-1" });
    state = incomingCallPopupReducer(state, { type: "customerUnknown", callId: "call-1" });
    expect(state[0]?.lookup).toBe("unknown");
    expect(state[0]?.customer).toBeUndefined();
    expect(state[0]?.casesStatus).toBe("idle");
  });

  it("records a hard lookup error", () => {
    let state = enqueue([], "call-1");
    state = incomingCallPopupReducer(state, { type: "customerLookupFailed", callId: "call-1" });
    expect(state[0]?.lookup).toBe("error");
  });

  it("records a case-load error", () => {
    let state = enqueue([], "call-1");
    state = incomingCallPopupReducer(state, {
      type: "customerResolved",
      callId: "call-1",
      customer: CUSTOMER,
    });
    state = incomingCallPopupReducer(state, { type: "casesFailed", callId: "call-1" });
    expect(state[0]?.casesStatus).toBe("error");
  });

  it("updates only the matching item, leaving siblings untouched", () => {
    const state = enqueue(enqueue([], "call-1"), "call-2");
    const updated = incomingCallPopupReducer(state, {
      type: "customerResolved",
      callId: "call-2",
      customer: CUSTOMER,
    });
    expect(updated[0]?.lookup).toBe("pending");
    expect(updated[1]?.lookup).toBe("resolved");
  });

  it("ignores transitions for unknown callIds", () => {
    const state = enqueue([], "call-1");
    const untouched = incomingCallPopupReducer(state, {
      type: "customerResolved",
      callId: "ghost",
      customer: CUSTOMER,
    });
    expect(untouched).toEqual(state);
  });
});

describe("incomingCallPopupReducer — immutability", () => {
  it("never mutates the previous state array or its items", () => {
    const initial = enqueue([], "call-1");
    const snapshot = initial.map((item) => ({ ...item }));
    const originalSnapshot = JSON.parse(JSON.stringify(initial));

    incomingCallPopupReducer(initial, { type: "resolutionStarted", callId: "call-1" });
    incomingCallPopupReducer(initial, { type: "dismiss", callId: "call-1" });
    incomingCallPopupReducer(initial, {
      type: "customerResolved",
      callId: "call-1",
      customer: {
        id: "x",
        displayName: "",
        firstName: "",
        lastName: "",
        mobileNo: "",
        email: "",
        photo: "",
      },
    });

    expect(initial).toEqual(snapshot);
    expect(JSON.parse(JSON.stringify(initial))).toEqual(originalSnapshot);
  });
});
