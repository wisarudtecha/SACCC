// STUB backend-assisted Service Center resolution (REQ 2 - the "Try Again"
// fallback for when the polygon match in serviceCenterMatch.ts comes back
// `no-match`).
//
// There is no real endpoint for this yet, and - critically - no rule to prefer
// among candidates either; only a real backend contract would define one. A
// stub that "succeeds" by guessing (e.g. the first candidate) is worse than no
// resolution at all, since useResolveServiceCenter's caller adopts whatever
// this resolves to and overwrites the dispatcher's field. So until a real
// backend exists, this always rejects: useResolveServiceCenter's existing
// `.catch` never calls `onResolved`, which leaves the Service Center field
// exactly as-is - the same "leave it alone" behavior the honest no-match
// polygon path already has. Swap the body for a real RTK Query mutation once a
// backend contract exists, keeping this function's signature so
// ServiceCenterRetryButton/useResolveServiceCenter need no changes.
import type { Area } from "@/cms/store/api/area";

const STUB_RESOLVE_DELAY_MS = 900;

export type ServiceCenterResolveStatus = "idle" | "resolving" | "resolved" | "error";

/** Placeholder "ask the backend" call - always rejects, see file comment. */
export function stubResolveServiceCenter(_candidateAreas: readonly Area[]): Promise<Area> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Service Center backend resolution is not available yet"));
    }, STUB_RESOLVE_DELAY_MS);
  });
}
