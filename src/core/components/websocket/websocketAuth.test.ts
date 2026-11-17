// src/core/components/websocket/websocketAuth.test.ts
//
// Pure-logic tests for the token carrier. DECIDED 2026-11-17: the token is a flat
// `access_token` field on the SUBSCRIBE frame, not a request header.
//
// The cases that matter most are the ones a reader is likely to "fix" wrongly later:
//
//   - the key is omitted entirely when there is no token (not `access_token: ""`, which
//     a server would read as a credential that is present but empty);
//   - the token is re-read at call time, so a rotated token is what goes out;
//   - an auth rejection must never become an endless refresh/retry loop.
import { describe, expect, it } from "vitest";
import {
  WS_CLOSE_FORBIDDEN,
  WS_CLOSE_UNAUTHORIZED,
  buildRegisterFrame,
  isAuthRejectionCode,
  nextReconnectAction,
  withAccessToken
} from "./websocketAuth";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

describe("buildRegisterFrame", () => {
  it("carries the identity plus a flat access_token field", () => {
    expect(buildRegisterFrame({ orgId: "org-1", username: "agent" }, JWT)).toEqual({
      EVENT: "SUBSCRIBE",
      orgId: "org-1",
      username: "agent",
      access_token: JWT
    });
  });

  it("omits the key entirely when there is no token", () => {
    // Not `access_token: ""` and not a nested `headers` object — the server must see
    // "no credential" unambiguously.
    const frame = buildRegisterFrame({ orgId: "org-1", username: "agent" }, null);
    expect(frame).toEqual({ EVENT: "SUBSCRIBE", orgId: "org-1", username: "agent" });
    expect("access_token" in frame).toBe(false);
    expect("headers" in frame).toBe(false);
  });

  it("tolerates a missing profile rather than throwing", () => {
    expect(buildRegisterFrame({}, JWT)).toMatchObject({ EVENT: "SUBSCRIBE", access_token: JWT });
  });

  it("uses whatever token the caller read at call time", () => {
    // The provider re-reads the token on every send precisely so a rotated one wins.
    const first = buildRegisterFrame({ orgId: "o" }, "token-1");
    const second = buildRegisterFrame({ orgId: "o" }, "token-2");
    expect(first.access_token).toBe("token-1");
    expect(second.access_token).toBe("token-2");
  });
});

describe("withAccessToken", () => {
  it("returns the payload untouched when there is no token", () => {
    const payload = { type: "ping" };
    expect(withAccessToken(payload, null)).toBe(payload);
  });

  it("stamps the token without mutating the caller's object", () => {
    const payload = { type: "ping" };
    expect(withAccessToken(payload, JWT)).toEqual({ type: "ping", access_token: JWT });
    expect(payload).toEqual({ type: "ping" });
  });
});

describe("isAuthRejectionCode", () => {
  it("matches only the two auth close codes", () => {
    expect(isAuthRejectionCode(WS_CLOSE_UNAUTHORIZED)).toBe(true);
    expect(isAuthRejectionCode(WS_CLOSE_FORBIDDEN)).toBe(true);
  });

  it("does not match a normal or transient close", () => {
    expect(isAuthRejectionCode(1000)).toBe(false);
    expect(isAuthRejectionCode(1006)).toBe(false);
    expect(isAuthRejectionCode(4400)).toBe(false);
  });
});

describe("nextReconnectAction", () => {
  const base = {
    alreadyRefreshed: false,
    attempts: 0,
    closeCode: 1006,
    hasAccessToken: true,
    hasRefreshToken: true,
    maxAttempts: 10
  };

  it("stops on a deliberate close", () => {
    expect(nextReconnectAction({ ...base, closeCode: 1000 })).toBe("stop");
  });

  it("retries a transient close", () => {
    expect(nextReconnectAction(base)).toBe("retry");
  });

  it("stops once the attempt budget is spent", () => {
    expect(nextReconnectAction({ ...base, attempts: 10 })).toBe("stop");
  });

  it("stops when there is no access token to reconnect with", () => {
    expect(nextReconnectAction({ ...base, hasAccessToken: false })).toBe("stop");
  });

  it("refreshes once on an auth rejection", () => {
    expect(nextReconnectAction({ ...base, closeCode: WS_CLOSE_UNAUTHORIZED })).toBe("refresh-and-retry");
    expect(nextReconnectAction({ ...base, closeCode: WS_CLOSE_FORBIDDEN })).toBe("refresh-and-retry");
  });

  it("never refreshes twice for the same failure", () => {
    expect(nextReconnectAction({ ...base, alreadyRefreshed: true, closeCode: WS_CLOSE_UNAUTHORIZED })).toBe("stop");
  });

  it("stops on an auth rejection when no refresh token exists", () => {
    expect(nextReconnectAction({ ...base, closeCode: WS_CLOSE_UNAUTHORIZED, hasRefreshToken: false })).toBe("stop");
  });

  it("refreshes even when the attempt budget is spent, because the budget was for transient retries", () => {
    expect(nextReconnectAction({ ...base, attempts: 10, closeCode: WS_CLOSE_UNAUTHORIZED })).toBe("refresh-and-retry");
  });
});
