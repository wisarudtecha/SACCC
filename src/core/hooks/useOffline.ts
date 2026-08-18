// /src/hooks/useOffline.ts
import { useContext, createContext } from "react";
import type { OfflineContextValue } from "@/core/types/offline-manager";

export const OfflineContext = createContext<OfflineContextValue | null>(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};
