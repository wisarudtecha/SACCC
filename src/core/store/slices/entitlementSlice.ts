// src/core/store/slices/entitlementSlice.ts
/**
 * Entitlement state — the tenant's purchased plan, SKUs, and feature grants.
 *
 * Source of truth is currently per-tenant fixtures keyed by the login-time
 * organization string (`user.organization`, e.g. "BMA"). When the backend
 * endpoint lands, flip ENTITLEMENTS_SOURCE to "api" and re-key the loader to
 * `user.orgId` — this file is the only place that changes.
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { TenantEntitlements } from "@/core/types/entitlement";
import { resolveFixture } from "@/core/mocks/entitlements";

export const ENTITLEMENTS_SOURCE: "fixtures" | "api" = "fixtures";

export interface EntitlementState {
  status: "idle" | "loading" | "ready" | "error";
  /** Organization key the current `data` was resolved for. */
  loadedForOrg: string | null;
  data: TenantEntitlements | null;
}

const initialState: EntitlementState = {
  status: "idle",
  loadedForOrg: null,
  data: null,
};

export const loadEntitlements = createAsyncThunk<
  TenantEntitlements,
  string
>("entitlements/load", async (orgKey) => {
  if (ENTITLEMENTS_SOURCE === "fixtures") {
    // Yield a microtask so consumers can't depend on synchronous fixture
    // resolution — keeps timing semantics identical after the API swap.
    await Promise.resolve();
    return resolveFixture(orgKey);
  }
  // TODO(api): call GET /tenants/{orgId}/entitlements here. If done via RTK
  // Query, a GQL_ENTITLEMENT entry must be registered in gqlMapper.ts first —
  // under VITE_USE_GRAPHQL=true a missing mapping is a hard error.
  throw new Error("Entitlement API source is not implemented yet");
});

const entitlementSlice = createSlice({
  name: "entitlements",
  initialState,
  reducers: {
    resetEntitlements: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadEntitlements.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadEntitlements.fulfilled, (state, action) => {
        state.status = "ready";
        state.loadedForOrg = action.meta.arg;
        state.data = action.payload;
      })
      .addCase(loadEntitlements.rejected, (state, action) => {
        state.status = "error";
        state.data = null;
        // Mark the failed org so the bootstrap hook doesn't hot-loop retries.
        state.loadedForOrg = action.meta.arg;
      });
    // NOTE: no logout extraReducer here — the Redux authSlice.logout action
    // is never dispatched in this app (AuthProvider uses its own context
    // reducer), so the bootstrap hook resets this slice on logout instead.
  },
});

export const { resetEntitlements } = entitlementSlice.actions;
export default entitlementSlice.reducer;
