// /src/types/offline-manager.ts
export interface OfflineAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  endpoint: string;
  data: unknown;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  optimisticUpdate?: unknown;
  rollbackData?: unknown;
}

export interface CacheEntry {
  id: string;
  endpoint: string;
  data: unknown;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  version: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingActions: number;
  failedActions: number;
  successfulActions: number;
}

export interface ConflictResolution {
  id: string;
  localData: unknown;
  serverData: unknown;
  resolution: "local" | "server" | "merge" | "manual";
  timestamp: Date;
}

export interface OfflineContextValue {
  status: SyncStatus;
  queueAction: (action: Omit<OfflineAction, "id" | "timestamp" | "retryCount">) => void;
  getFromCache: (endpoint: string) => unknown;
  setCache: (endpoint: string, data: unknown, ttl?: number) => void;
  clearCache: () => void;
  forcSync: () => Promise<void>;
  conflicts: ConflictResolution[];
  resolveConflict: (conflictId: string, resolution: ConflictResolution["resolution"]) => void;
}
