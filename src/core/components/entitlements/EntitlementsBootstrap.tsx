// src/core/components/entitlements/EntitlementsBootstrap.tsx
// Mounts the entitlement bootstrap hook under AuthContext.Provider — the hook
// consumes useAuth(), so it can only run in a child of AuthProvider, never
// inside AuthProvider itself.
import { useEntitlementsBootstrap } from "@/core/hooks/useEntitlementsBootstrap";

export function EntitlementsBootstrap() {
  useEntitlementsBootstrap();
  return null;
}
