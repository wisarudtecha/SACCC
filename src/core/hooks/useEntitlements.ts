// src/core/hooks/useEntitlements.ts
/**
 * Entitlement checks — "did this tenant buy X", layered on top of RBAC
 * ("may this user do X"). Visible = entitled AND permitted.
 *
 * Deliberately has no system-admin bypass: entitlements are tenant-scoped,
 * so a tenant's system admin only sees what the tenant purchased.
 */
import { useAppSelector } from "@/core/hooks/redux";
import {
  getLimit as resolveLimit,
  hasAnyFeature as resolveAnyFeature,
  hasFeature as resolveFeature,
  minTierForFeature,
} from "@/core/config/entitlements";
import type {
  EntitlementFeature,
  EntitlementLimits,
} from "@/core/types/entitlement";

export const useEntitlements = () => {
  const { status, loadedForOrg, data } = useAppSelector(
    (state) => state.entitlements,
  );

  const isReady = status === "ready" && data !== null;

  return {
    status,
    isLoading: status === "idle" || status === "loading",
    loadedForOrg,
    plan: data?.plan ?? null,
    skus: data?.skus ?? [],
    features: data?.features ?? [],
    limits: data?.limits ?? null,
    seats: data?.seats ?? null,
    renewedAt: data?.renewedAt ?? null,
    expiresAt: data?.expiresAt ?? null,

    hasFeature: (feature: EntitlementFeature) =>
      isReady ? resolveFeature(data, feature) : false,

    hasAnyFeature: (features: EntitlementFeature[]) =>
      isReady ? resolveAnyFeature(data, features) : false,

    getLimit: (key: keyof EntitlementLimits) =>
      isReady ? resolveLimit(data, key) : null,

    minTierForFeature,

    /**
     * True only when entitlements are loaded AND the feature is not granted.
     * While loading this stays false so gates render a neutral state instead
     * of flashing lock UI on every login.
     */
    isLocked: (feature: EntitlementFeature) =>
      isReady ? !resolveFeature(data, feature) : false,
  };
};
