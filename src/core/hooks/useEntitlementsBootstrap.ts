// src/core/hooks/useEntitlementsBootstrap.ts
/**
 * Loads the current tenant's entitlements once a user is authenticated, and
 * reloads when the organization changes (re-login as another tenant).
 * Mount once near the top of the app (AuthProvider).
 */
import { useEffect } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/core/hooks/redux";
import {
  loadEntitlements,
  resetEntitlements,
} from "@/core/store/slices/entitlementSlice";

export const useEntitlementsBootstrap = () => {
  const { state } = useAuth();
  const dispatch = useAppDispatch();
  const loadedForOrg = useAppSelector((s) => s.entitlements.loadedForOrg);

  const orgKey = state.isAuthenticated ? state.user?.organization : undefined;

  useEffect(() => {
    if (!orgKey) {
      // Logged out — entitlements are tenant-scoped, drop them.
      if (loadedForOrg !== null) dispatch(resetEntitlements());
      return;
    }
    // Load once per org; an org switch or logout/re-login re-triggers.
    if (loadedForOrg === orgKey) return;
    dispatch(loadEntitlements(orgKey));
  }, [orgKey, loadedForOrg, dispatch]);
};
