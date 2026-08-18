// src/crm/components/websocket/WebSocketContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { getNewCaseDataByCaseId } from "@/cms/components/case/caseLocalStorage.tsx/caseListUpdate";
import { notifyCaseListChanged } from "@/cms/components/case/caseListSignal";
import { idbStorage } from "@/cms/components/idb/idb";
import { resolveRuntimeEnv } from "@/core/config/api";
import { useToast as UseToast } from "@/core/hooks/useToast";
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

export interface WebSocketContextType {
  connectionState: "connecting" | "connected" | "disconnected" | "error";
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
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const { toasts, addToast, removeToast } = UseToast();
  
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
        wsRef.current.send(JSON.stringify({ type: "ping" }));
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

  const getProfile = () => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        return JSON.parse(profile);
      }
      catch (err) {
        console.error("🚀 ~ getProfile ~ Failed to parse profile:", err);
        return null;
      }
    }
    return null;
  };

  const websocket = (config: WebSocketConfig) => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    configRef.current = config;
    setConnectionState("connecting");
    clearTimers();

    try {
      const ws = new WebSocket(config.url);
      const profile = getProfile();
      ws.onopen = () => {
        const userRegisterPayload = { "EVENT": "SUBSCRIBE", orgId: profile.orgId, username: profile.username };

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

        // Attempt reconnect if it wasn"t a manual close
        if (event.code !== 1000 && configRef.current) {
          attemptReconnect();
        }
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

        reconnectAttemptsRef.current = 0;
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

  const disconnect = () => {
    clearTimers();
    configRef.current = null;

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
      wsRef.current.send(JSON.stringify(data));
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
