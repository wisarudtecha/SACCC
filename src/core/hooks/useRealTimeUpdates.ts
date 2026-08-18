// /src/hooks/useRealTimeUpdates.ts
import { useEffect, useRef } from "react";

interface UseRealTimeUpdatesProps<T> {
  endpoint: string;
  onUpdate: (data: T) => void;
  onDelete: (id: string) => void;
  onCreate: (data: T) => void;
  enabled?: boolean;
}

export const useRealTimeUpdates = <T extends { id: string }>({
  endpoint,
  onUpdate,
  onDelete,
  onCreate,
  enabled = true
}: UseRealTimeUpdatesProps<T>) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const wsUrl = `ws://localhost:5173/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected to ${endpoint}`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "UPDATE":
            onUpdate(message.data);
            break;
          case "DELETE":
            onDelete(message.id);
            break;
          case "CREATE":
            onCreate(message.data);
            break;
          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${endpoint}`);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [endpoint, onUpdate, onDelete, onCreate, enabled]);

  return wsRef.current;
};
