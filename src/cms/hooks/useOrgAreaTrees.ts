// src/cms/hooks/useOrgAreaTrees.ts
/**
 * Fetches the cached area tree for every country the organization has.
 *
 * GetOrgCountryTree takes one country id per call, and hooks cannot be called
 * in a loop, so the fan-out runs through a single lazy trigger instead. Orgs
 * normally have one country, so this is usually a single request - and it
 * replaces the length:10000 province + length:20000 district fetches the area
 * page used to make, along with the client-side join over them.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLazyGetOrgCountryTreeQuery } from "@/cms/store/api/area";
import { readAreaCountryTree, readAreaCountryTreeFailure } from "@/cms/utils/areaTree";
import type { AreaTreeOutcome } from "@/cms/utils/areaTree";
import type { AreaCountryTree, Country } from "@/cms/types/area";

/** A country whose tree could not be read, and why. */
export interface MissingAreaTree {
  /** The country row id the fetch was keyed on - matches `Country.id`. */
  id: number;
  outcome: Exclude<AreaTreeOutcome, "ok">;
  message: string;
}

interface UseOrgAreaTreesResult {
  trees: AreaCountryTree[];
  /**
   * The countries `trees` does not cover. Worth surfacing rather than swallowing: an org
   * whose tree has never been generated is silently absent from every area list and every
   * map, and nothing else in the UI says so.
   */
  missing: MissingAreaTree[];
  isLoading: boolean;
  /** True when `trees` is incomplete for any reason. */
  hasError: boolean;
  refetch: () => void;
}

export const useOrgAreaTrees = (countries?: Country[]): UseOrgAreaTreesResult => {
  const [triggerGetTree] = useLazyGetOrgCountryTreeQuery();

  const [trees, setTrees] = useState<AreaCountryTree[]>([]);
  const [missing, setMissing] = useState<MissingAreaTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Bumping this re-runs the effect without changing the id list.
  const [reloadToken, setReloadToken] = useState(0);

  // The effect must not re-run on every render just because `countries` is a new
  // array identity each time - key it on the ids it actually reads.
  const countryIds = useMemo(
    () => (countries || []).map(country => country.id),
    [countries]
  );
  const countryIdsKey = countryIds.join(",");

  // A slow response for a country list that has since changed must not overwrite
  // the newer result.
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (countryIds.length === 0) {
      setTrees([]);
      setMissing([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);

    // preferCacheValue: a country already in the RTK cache resolves without a
    // second network call, which matters when the list re-renders.
    //
    // Both settle paths are classified: hybridBaseQuery rejects a conclusive failure
    // envelope, but an inconclusive one still resolves carrying `data: []`, and that empty
    // array is truthy - reading it as a country is the bug this replaced.
    Promise.all(
      countryIds.map(id =>
        triggerGetTree(id, true)
          .unwrap()
          .then(response => ({ id, read: readAreaCountryTree(response) }))
          .catch((error: unknown) => ({ id, read: readAreaCountryTreeFailure(error) }))
      )
    )
      .then(results => {
        if (cancelled || requestRef.current !== requestId) {
          return;
        }
        const loaded: AreaCountryTree[] = [];
        const skipped: MissingAreaTree[] = [];

        results.forEach(({ id, read }) => {
          if (read.tree) {
            loaded.push(read.tree);
            return;
          }
          skipped.push({
            id,
            outcome: read.outcome === "not-generated" ? "not-generated" : "failed",
            message: read.message
          });
        });

        setTrees(loaded);
        setMissing(skipped);
        setHasError(skipped.length > 0);
      })
      .finally(() => {
        if (!cancelled && requestRef.current === requestId) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // countryIdsKey stands in for countryIds; reloadToken forces a manual refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIdsKey, reloadToken, triggerGetTree]);

  const refetch = useCallback(() => setReloadToken(token => token + 1), []);

  return { trees, missing, isLoading, hasError, refetch };
};
