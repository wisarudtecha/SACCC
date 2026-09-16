// Drives ServiceCenterRetryButton: calls the REQ 2 stub resolver and enforces
// a flat 10s disable after every click (stakeholder decision - the disable is
// a fixed cooldown, not tied to how long the call actually takes, and there is
// no limit on how many times the dispatcher can retry).
//
// Plain useState/useCallback rather than an RTK Query mutation, since
// stubResolveServiceCenter isn't a real network call yet - swap this hook's
// body for a mutation once a backend endpoint exists, keeping its return
// shape so ServiceCenterRetryButton needs no changes.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Area } from "@/cms/store/api/area";
import { stubResolveServiceCenter, type ServiceCenterResolveStatus } from "./serviceCenterResolve";

const COOLDOWN_MS = 10_000;

export interface UseResolveServiceCenterResult {
  status: ServiceCenterResolveStatus;
  /** True while the button must stay disabled - resolving, or in the flat post-click cooldown. */
  isDisabled: boolean;
  retry: () => void;
}

export function useResolveServiceCenter(
  candidateAreas: readonly Area[],
  onResolved: (area: Area) => void
): UseResolveServiceCenterResult {
  const [status, setStatus] = useState<ServiceCenterResolveStatus>("idle");
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
    }
  }, []);

  const retry = useCallback(() => {
    if (status === "resolving" || isCoolingDown) {
      return;
    }
    setStatus("resolving");
    setIsCoolingDown(true);
    cooldownTimer.current = setTimeout(() => setIsCoolingDown(false), COOLDOWN_MS);

    stubResolveServiceCenter(candidateAreas)
      .then((area) => {
        setStatus("resolved");
        onResolved(area);
      })
      .catch(() => {
        setStatus("error");
      });
  }, [status, isCoolingDown, candidateAreas, onResolved]);

  return {
    status,
    isDisabled: status === "resolving" || isCoolingDown,
    retry
  };
}
