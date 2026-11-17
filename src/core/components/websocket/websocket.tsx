// src/crm/components/websocket/WebSocketContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import {
  STAMP_EVERY_OUTGOING_FRAME,
  buildRegisterFrame,
  getAccessToken,
  hasRefreshToken,
  isAuthRejectionCode,
  nextReconnectAction,
  withAccessToken
} from "@/core/components/websocket/websocketAuth";
import { getNewCaseDataByCaseId } from "@/cms/components/case/caseLocalStorage.tsx/caseListUpdate";
import { notifyCaseListChanged } from "@/cms/components/case/caseListSignal";
import { idbStorage } from "@/cms/components/idb/idb";
import { resolveRuntimeEnv } from "@/core/config/api";
import { useAuth } from "@/core/hooks/useAuth";
import { useToast as UseToast } from "@/core/hooks/useToast";
import { TokenManager } from "@/core/utils/tokenManager";
import type { User } from "@/core/types/auth";
import type { CaseEntity } from "@/cms/types/case";

export interface WebSocketConfig {
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string | string[];
  reconnectInterval?: number;
  url: string;
}

export interface WebSocketMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp?: number;
  type: string;
}

export interface WebSocketProviderProps {
  autoConnect?: boolean;
  children: ReactNode;
  defaultConfig?: WebSocketConfig;
}

/**
 * "unauthorized" is terminal, not transient: the socket stopped because the server
 * rejected the credential (or there was none to present). It never recovers by
 * waiting, so consumers should not treat it like "disconnected".
 */export type WebSocketConnectionState = "connecting" | "connected" | "disconnected" | "error" | "unauthorized";

export interface WebSocketContextType {
  /** Broadcast a message to all subscribers without sending over the wire. Useful for mocks. */
  broadcast: (message: WebSocketMessage) => void;
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  disconnect: () => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: (data: any) => void;
  websocket: (config: WebSocketConfig) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);
const WEBSOCKET = import.meta.env.VITE_WEBSOCKET_BASE_URL;

// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const defalutWebsocketConfig = {
  heartbeatInterval: 60000,
  maxReconnectAttempts: 10,
  reconnectInterval: 5000,
  url: `${WEBSOCKET}/api/v1/notifications/register`
} as WebSocketConfig;

export const WebSocketCaseEvent = (message: WebSocketMessage) => {
  switch (message.data?.EVENT) {
    case "CASE-CREATE":
      (async () => {
        const caseId = message.data.additionalJson.caseId;
        await getNewCaseDataByCaseId(caseId);
        notifyCaseListChanged(caseId);
      })();
      break;

    case "CASE-UPDATE":
      (async () => {
        const caseId = message.data.additionalJson.caseId;
        await getNewCaseDataByCaseId(caseId);
        notifyCaseListChanged(caseId);
      })();
      break;

    case "CASE-STATUS-UPDATE":
      (async () => {
        try {
          const caseList = JSON.parse(JSON.stringify(await idbStorage.getItem("caseList") ?? "[]")) as CaseEntity[];
          const targetCaseId = message?.data?.additionalJson?.caseId;
          const newStatus = message?.data?.additionalJson?.status;

          if (targetCaseId && newStatus !== undefined) {
            const updatedCaseList = caseList.map((item) =>
              item.caseId === targetCaseId
                ? { ...item, statusId: newStatus === "S013" ? "S001" : newStatus }
                : item
            );

            // Awaited: listeners re-read IndexedDB when the signal fires, so the write has
            // to have committed by then. Previously the event carried the payload, which
            // masked this race.
            await idbStorage.setItem("caseList", JSON.stringify(updatedCaseList));

            notifyCaseListChanged(targetCaseId);
          }
        }
        catch (error) {
          console.error("🚀 ~ WebSocketCaseEvent ~ Failed to update case status:", error);
        }
      })();
      break;

    default:
      break;
  }
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  autoConnect = false,
  children,
  defaultConfig
}) => {
  const configRef = useRef<WebSocketConfig | null>(null);
  // const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  // One refresh attempt per auth rejection. Reset on a successful SUBSCRIBE and on an
  // explicit disconnect, so a second 4401 for the SAME failure becomes terminal
  // instead of an endless refresh/retry loop.
  const refreshedForFailureRef = useRef(false);
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>("disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const { toasts, addToast, removeToast } = UseToast();

  // Used only after the server rejects the credential (4401/4403). This component is
  // mounted inside <AuthProvider> (main.tsx), so the context is available here.
  //
  // Held in a ref rather than called through the closed-over value: `refreshToken` is a
  // useCallback that AuthProvider rebuilds whenever its auth state changes, and the socket
  // created at mount would otherwise keep calling the first-render copy forever.
  const { refreshToken } = useAuth();
  const refreshTokenRef = useRef(refreshToken);
  refreshTokenRef.current = refreshToken;

  const clearTimers = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const startHeartbeat = () => {
    const config = configRef.current;
    if (!config?.heartbeatInterval) {
      return;
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // The credential is established once, by the SUBSCRIBE frame, so a ping does
        // not need to repeat it (see STAMP_EVERY_OUTGOING_FRAME in websocketAuth.ts).
        const ping = STAMP_EVERY_OUTGOING_FRAME
          ? withAccessToken({ type: "ping" }, getAccessToken())
          : { type: "ping" };

        wsRef.current.send(JSON.stringify(ping));
      }
    }, config.heartbeatInterval);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const attemptReconnect = () => {
    // if (!config) {
    //   return;
    // }
    const config = configRef.current;

    // const maxAttempts = config?.maxReconnectAttempts || 5;
    const maxAttempts = config?.maxReconnectAttempts || 10;

    const interval = config?.reconnectInterval || 3000;
    
    if (reconnectAttemptsRef.current >= maxAttempts) {
      console.warn("🚀 ~ attemptReconnect ~ Max reconnect attempts reached");
      setConnectionState("error");
      return;
    }

    reconnectAttemptsRef.current++;
    // console.log("🚀 ~ attemptReconnect ~ Attempting to reconnect...:", reconnectAttemptsRef.current / maxAttempts);

    reconnectTimeoutRef.current = setTimeout(() => {
      websocket(config || defalutWebsocketConfig);
    }, interval);
  };

  /**
   * The identity half of the SUBSCRIBE frame.
   *
   * Read through TokenManager, not `localStorage.getItem("profile")` directly: TokenManager
   * is what writes that key, it can store the session in sessionStorage instead
   * (tokenManager.ts:52), and it applies `decrypt()` on the way out. Reading the storage key
   * by hand is the defect recorded against UserAuditLog — and here it fails silently, because
   * the frame would simply carry `orgId: undefined` and the server would subscribe nobody.
   */
  const getProfile = (): User | null => TokenManager.getStoredUser();

  const websocket = (config: WebSocketConfig) => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Fail closed. Opening first and authenticating afterwards is what the server used
    // to accept and what this change exists to stop; without a credential there is
    // nothing to present, so no socket is created at all.
    const token = getAccessToken();
    if (!token) {
      setIsConnected(false);
      setConnectionState("unauthorized");
      return;
    }

    isConnectingRef.current = true;
    configRef.current = config;
    setConnectionState("connecting");
    clearTimers();

    try {
      // The upgrade request carries no credential — the browser cannot set a header on it.
      // The token goes out in the first frame instead, so nothing about the URL changes.
      const ws = new WebSocket(config.url);
      const profile = getProfile();
      ws.onopen = () => {
        // Re-read the token here rather than reusing the one captured above: a refresh
        // may have rotated it between construction and open. The frame carries a flat
        // `access_token` field, which is what the server authenticates the connection with.
        const userRegisterPayload = buildRegisterFrame(
          { orgId: profile?.orgId, username: profile?.username },
          getAccessToken()
        );

        ws.send(JSON.stringify(userRegisterPayload));

        // setIsConnected(true);
        // setConnectionState("connected");

        isConnectingRef.current = false;

        // reconnectAttemptsRef.current = 0;

        startHeartbeat();
      };

      ws.onmessage = event => {
        try {
          const parsed = JSON.parse(event.data);
          const message: WebSocketMessage = {
            type: parsed.type || "message",
            data: parsed,
            timestamp: Date.now()
          };

          
          if (isConnected === false && message.data.EVENT === "SUBSCRIBE-SUCCESS") {
            console.log("🚀 ~ websocket ~ WebSocket connected");
            // The credential was accepted, so the next auth rejection earns its own
            // single refresh attempt — and the reconnect budget starts over, because the
            // connection is healthy again.
            refreshedForFailureRef.current = false;
            reconnectAttemptsRef.current = 0;
            setIsConnected(true);
            setConnectionState("connected");
            return
          }

          setLastMessage(message);
          switch (message.data.EVENT != null) {
            case message.data.EVENT?.includes("CASE"):
              WebSocketCaseEvent(message)
              break;

            default:
              break;
          }

          // Notify all subscribers
          subscribersRef.current.forEach(callback => {
            try {
              callback(message);
            }
            catch (error) {
              console.error("🚀 ~ websocket ~ Error in WebSocket subscriber callback:", error);
            }
          });
        }
        catch (error) {
          console.error("🚀 ~ websocket ~ Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = event => {
        // console.log("🚀 ~ websocket ~ WebSocket disconnected:", event.code, event.reason);
        // console.log("🚀 ~ websocket ~ WebSocket disconnected");
        setIsConnected(false);
        setConnectionState("disconnected");
        isConnectingRef.current = false;
        stopHeartbeat();

        // No config means `disconnect()` was called on purpose.
        if (!configRef.current) {
          return;
        }

        const action = nextReconnectAction({
          alreadyRefreshed: refreshedForFailureRef.current,
          attempts: reconnectAttemptsRef.current,
          closeCode: event.code,
          hasAccessToken: Boolean(getAccessToken()),
          hasRefreshToken: hasRefreshToken(),
          maxAttempts: configRef.current.maxReconnectAttempts || 10
        });

        if (action === "refresh-and-retry") {
          refreshedForFailureRef.current = true;
          void recoverAfterAuthRejection();
          return;
        }

        if (action === "stop") {
          // Terminal. Retrying an auth rejection or a missing credential only produces
          // the same close again, so say what happened instead of looping silently.
          if (isAuthRejectionCode(event.code) || !getAccessToken()) {
            setConnectionState("unauthorized");
          }
          return;
        }

        attemptReconnect();
      };

      ws.onerror = (
        // error
      ) => {
        // console.error("🚀 ~ websocket ~ WebSocket error:", error);
        if (resolveRuntimeEnv() === "local") {
          addToast("error", "websocket ~ WebSocket error");
        }
        setConnectionState("error");
        isConnectingRef.current = false;

        // connect(defalutWebsocketConfig);

        // Do NOT reset the attempt counter here. It used to be zeroed on every error, which
        // defeated `maxReconnectAttempts` entirely: a handshake the browser keeps refusing
        // (an echoed-protocol mismatch does exactly this) retried forever, every 5 s, with
        // no ceiling. The counter now resets on a successful SUBSCRIBE-SUCCESS instead —
        // the moment the connection is genuinely healthy again.
        attemptReconnect();
      };
      wsRef.current = ws;
    }
    catch (error) {
      console.error("🚀 ~ websocket ~ Failed to create WebSocket connection:", error);
      setConnectionState("error");
      isConnectingRef.current = false;
    }
  };

  /**
   * One refresh attempt after the server rejects the credential, then a single reconnect.
   *
   * `AuthContext.refreshToken` resolves `void` and swallows its own failures
   * (AuthProvider.tsx:346-353 deliberately does not sign the user out), so the outcome
   * cannot be read from the promise. It is judged by re-reading the credential, and a
   * second rejection is caught by `refreshedForFailureRef` — which turns "still
   * rejected" into a terminal unauthorized state instead of a refresh loop.
   */
  const recoverAfterAuthRejection = async () => {
    setConnectionState("connecting");

    try {
      await refreshTokenRef.current();
    }
    catch (error) {
      // The provider already logs; this is for the socket path only.
      console.error("🚀 ~ recoverAfterAuthRejection ~ Token refresh failed:", error);
    }

    // Disconnected (or unmounted) while the refresh was in flight.
    if (!configRef.current) {
      return;
    }

    if (!getAccessToken()) {
      setConnectionState("unauthorized");
      return;
    }

    websocket(configRef.current);
  };

  const disconnect = () => {
    clearTimers();
    configRef.current = null;
    refreshedForFailureRef.current = false;

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionState("disconnected");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // The connection is authenticated once, by the SUBSCRIBE frame, so outgoing frames
      // do not repeat the token by default — every copy is another place a JWT can be
      // captured. Flip STAMP_EVERY_OUTGOING_FRAME if the server ever validates per frame.
      const payload = STAMP_EVERY_OUTGOING_FRAME
        ? withAccessToken(data as Record<string, unknown>, getAccessToken())
        : data;

      wsRef.current.send(JSON.stringify(payload));
    }
    else {
      console.warn("🚀 ~ send ~ WebSocket is not connected. Message not sent:", data);
    }
  };

  const onMessage = (callback: (message: WebSocketMessage) => void) => {
    subscribersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  const broadcast = (message: WebSocketMessage) => {
    subscribersRef.current.forEach((callback) => {
      try {
        callback(message);
      }
      catch (error) {
        console.error("🚀 ~ broadcast ~ Error in WebSocket subscriber callback:", error);
      }
    });
  };

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      websocket(defaultConfig || defalutWebsocketConfig);
    }

    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, defaultConfig]);

  const contextValue: WebSocketContextType = {
    broadcast,
    isConnected,
    connectionState,
    send,
    onMessage,
    websocket,
    disconnect,
    lastMessage
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
      <ToastContainer disbleCloseButton={true} toasts={toasts} onRemove={removeToast} />
    </WebSocketContext.Provider>
  );
};
