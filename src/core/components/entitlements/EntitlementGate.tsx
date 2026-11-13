// src/core/components/entitlements/EntitlementGate.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ENTITLEMENT_UPSELL_ENABLED } from "@/core/config/featureFlags";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { ROUTE_PREFIX } from "@/core/router/routePrefix";
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
 *
 * `VITE_SHOW_ENTITLEMENT_UPSELL="false"` turns every lock state this component
 * renders into "nothing at all" (see the branch below); it is the deployment-wide
 * switch, so it outranks the per-call `mode` prop rather than being a default for
 * it. The locked components themselves are untouched and still used when the
 * flag is on.
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

  // A caller-supplied `fallback` is that caller's own neutral replacement, not
  // an upsell, so it outranks the rest of this component in both flag states.
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // VITE_SHOW_ENTITLEMENT_UPSELL="false": a locked feature is hidden instead of
  // announced. Inline gates render nothing at all; a route-level gate has to send
  // the user somewhere real, so it goes to the cms home - the locked page itself
  // IS the announcement being switched off, so returning null there would just
  // leave a blank screen with no way forward.
  if (!ENTITLEMENT_UPSELL_ENABLED) {
    return fullPage ? <Navigate to={ROUTE_PREFIX.cms} replace /> : null;
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
