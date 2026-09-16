// STUB backend-assisted Service Center resolution (REQ 2 - the "Try Again"
// fallback for when the polygon match in serviceCenterMatch.ts comes back
// `no-match`).
//
// There is no real endpoint for this yet. `stubResolveServiceCenter` simulates
// the round-trip and picks the first candidate Area, mirroring the FE-stub
// pattern this codebase already uses elsewhere for a contract the backend
// hasn't shipped (see the assign-picker workload endpoint). Swap the body for
// a real RTK Query mutation once a backend contract exists, keeping this
// function's signature so ServiceCenterRetryButton/useResolveServiceCenter
// need no changes.
import type { Area } from "@/cms/store/api/area";

const STUB_RESOLVE_DELAY_MS = 900;

export type ServiceCenterResolveStatus = "idle" | "resolving" | "resolved" | "error";

/**
 * Placeholder "ask the backend" call. There is no rule to prefer among
 * candidates yet - only a real backend contract would define one - so this
 * resolves to the first Area, or rejects when there is nothing to resolve to.
 */
export function stubResolveServiceCenter(candidateAreas: readonly Area[]): Promise<Area> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (candidateAreas.length === 0) {
        reject(new Error("No Service Center candidates available to resolve"));
        return;
      }
      resolve(candidateAreas[0]);
    }, STUB_RESOLVE_DELAY_MS);
  });
}
