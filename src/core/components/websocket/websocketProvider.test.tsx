// src/core/components/websocket/websocketProvider.test.tsx
//
// Pins the WIRING, not the helpers (those are covered by websocketAuth.test.ts): what a
// browser would actually put on the wire when the provider connects.
//
// Why this file exists: `websocketAuth.test.ts` can prove `buildRegisterFrame` returns a
// Bearer header until the cows come home, and the provider could still never call it. The
// three claims tested here are the ones that fail silently in production:
//
//   1. no credential -> no socket is created at all (fail closed, not "open then try");
//   2. the first frame carries `headers.Authorization` and the real identity from storage;
//   3. an auth rejection refreshes ONCE and then becomes terminal — the loop guard.
//
// The real TokenManager runs against jsdom's localStorage, so the storage contract is
// exercised too (a raw `localStorage` read would pass here only by accident: the reader
// under test is TokenManager itself).
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocketProvider, useWebSocket, type WebSocketContextType } from "@/core/components/websocket/websocket";

const refreshTokenMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/core/hooks/useAuth", () => ({
  useAuth: () => ({ refreshToken: refreshTokenMock })
}));

vi.mock("@/core/hooks/useToast", () => ({
  useToast: () => ({ toasts: [], addToast: vi.fn(), removeToast: vi.fn() })
}));

// Not under test, and each one drags IndexedDB / case-cache code into jsdom.
vi.mock("@/core/components/crud/ToastContainer", () => ({ ToastContainer: () => null }));
vi.mock("@/cms/components/case/caseLocalStorage.tsx/caseListUpdate", () => ({ getNewCaseDataByCaseId: vi.fn() }));
vi.mock("@/cms/components/case/caseListSignal", () => ({ notifyCaseListChanged: vi.fn() }));
vi.mock("@/cms/components/idb/idb", () => ({ idbStorage: { getItem: vi.fn(), setItem: vi.fn() } }));

// React 19 only writes into a jsdom container inside `act` when this is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZ2VudCJ9.c2lnbmF0dXJl";
const REGISTER_URL = "wss://ws.test/api/v1/notifications/register";
const PROFILE = { orgId: "org-1", username: "agent" };

/** Minimal stand-in for the browser socket: records the constructor args and every frame. */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  protocols?: string | string[];
  readyState: number = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  url: string;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    FakeWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close(code = 1000, reason = "") {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  /** Test helper: the server accepted the upgrade. */
  fireOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  /** Test helper: the server sent a frame. */
  fireMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  /** Test helper: the server closed the connection. */
  fireClose(code: number) {
    this.close(code);
  }
}

let container: HTMLDivElement;
let root: Root;
let latest: WebSocketContextType | null = null;

const ContextProbe = () => {
  latest = useWebSocket();
  return null;
};

const mount = async (autoConnect = true) => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <WebSocketProvider
        autoConnect={autoConnect}
        defaultConfig={{ heartbeatInterval: 60_000, maxReconnectAttempts: 10, reconnectInterval: 5000, url: REGISTER_URL }}
      >
        <ContextProbe />
      </WebSocketProvider>
    );
  });
};

const unmount = async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

beforeEach(() => {
  vi.stubGlobal("WebSocket", FakeWebSocket);
  localStorage.clear();
  sessionStorage.clear();
  FakeWebSocket.instances = [];
  latest = null;
  refreshTokenMock.mockClear();
});

afterEach(async () => {
  await unmount();
  vi.unstubAllGlobals();
});

describe("WebSocketProvider authentication", () => {
  it("does not open a socket at all when there is no access token", async () => {
    // Only the profile is present — a half-session, which is exactly the state a failed
    // login or a cleared token leaves behind.
    localStorage.setItem("profile", JSON.stringify(PROFILE));

    await mount();

    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(latest?.connectionState).toBe("unauthorized");
    expect(latest?.isConnected).toBe(false);
  });

  it("carries Authorization: Bearer on the SUBSCRIBE frame, with the stored identity", async () => {
    localStorage.setItem("access_token", JWT);
    localStorage.setItem("profile", JSON.stringify(PROFILE));

    await mount();

    expect(FakeWebSocket.instances).toHaveLength(1);
    const socket = FakeWebSocket.instances[0];

    // The upgrade URL is untouched: the credential travels in the frame, not the request.
    expect(socket.url).toBe(REGISTER_URL);
    expect(socket.protocols).toBeUndefined();

    await act(async () => {
      socket.fireOpen();
    });

    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0])).toEqual({
      EVENT: "SUBSCRIBE",
      orgId: PROFILE.orgId,
      username: PROFILE.username,
      access_token: JWT
    });
  });

  it("becomes connected on SUBSCRIBE-SUCCESS", async () => {
    localStorage.setItem("access_token", JWT);
    localStorage.setItem("profile", JSON.stringify(PROFILE));

    await mount();

    const socket = FakeWebSocket.instances[0];

    await act(async () => {
      socket.fireOpen();
      socket.fireMessage({ EVENT: "SUBSCRIBE-SUCCESS" });
    });

    expect(latest?.isConnected).toBe(true);
    expect(latest?.connectionState).toBe("connected");
  });

  it("refreshes once on 4401, then treats a second 4401 as terminal", async () => {
    localStorage.setItem("access_token", JWT);
    localStorage.setItem("refresh_token", "refresh-1");
    localStorage.setItem("profile", JSON.stringify(PROFILE));

    await mount();
    const first = FakeWebSocket.instances[0];

    await act(async () => {
      first.fireOpen();
      first.fireClose(4401);
    });

    // One refresh, and the provider reconnected with whatever credential is now stored.
    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(2);

    const second = FakeWebSocket.instances[1];

    await act(async () => {
      second.fireOpen();
      second.fireClose(4401);
    });

    // Second rejection: no second refresh, no third socket, terminal state.
    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(latest?.connectionState).toBe("unauthorized");
  });

  it("does not reconnect after a deliberate disconnect", async () => {
    localStorage.setItem("access_token", JWT);
    localStorage.setItem("profile", JSON.stringify(PROFILE));

    await mount();
    const socket = FakeWebSocket.instances[0];

    await act(async () => {
      socket.fireOpen();
      socket.fireMessage({ EVENT: "SUBSCRIBE-SUCCESS" });
      latest?.disconnect();
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(latest?.isConnected).toBe(false);
  });
});
