// src/core/components/entitlements/EntitlementGate.tsx
import type { ReactNode } from "react";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { EntitlementLockedPage } from "./EntitlementLockedPage";
import { LockedFeature } from "./LockedFeature";
import type { EntitlementFeature } from "@/core/types/entitlement";

interface EntitlementGateProps {
  feature: EntitlementFeature;
  children: ReactNode;
  /** Custom replacement when locked; overrides the built-in lock UI. */
  fallback?: ReactNode;
  /** Neutral placeholder while entitlements load (defaults to nothing). */
  loadingFallback?: ReactNode;
  /** "lock" shows upsell UI (product default); "hidden" renders nothing. */
  mode?: "lock" | "hidden";
  /** Full-page lock state (route-level gates) instead of the inline block. */
  fullPage?: boolean;
}

/**
 * Secondary validation gate — "did this tenant buy this feature", layered on
 * top of RBAC. Deliberately performs NO system-admin bypass (unlike
 * PermissionGate): entitlements are tenant-scoped, so a tenant's system
 * admin only sees what the tenant purchased. Do not add an admin exemption
 * here without a product decision.
 */
export function EntitlementGate({
  feature,
  children,
  fallback,
  loadingFallback,
  mode = "lock",
  fullPage = false,
}: EntitlementGateProps) {
  const { isLoading, isLocked } = useEntitlements();

  // Neutral while loading — never flash lock UI before entitlements resolve.
  if (isLoading) {
    return <>{loadingFallback ?? null}</>;
  }

  if (!isLocked(feature)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  if (mode === "hidden") {
    return null;
  }

  return fullPage ? (
    <EntitlementLockedPage feature={feature} />
  ) : (
    <LockedFeature feature={feature} />
  );
}
