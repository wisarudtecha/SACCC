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
import type { AreaCountryTree, Country } from "@/cms/types/area";

interface UseOrgAreaTreesResult {
  trees: AreaCountryTree[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}

export const useOrgAreaTrees = (countries?: Country[]): UseOrgAreaTreesResult => {
  const [triggerGetTree] = useLazyGetOrgCountryTreeQuery();

  const [trees, setTrees] = useState<AreaCountryTree[]>([]);
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
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);

    // preferCacheValue: a country already in the RTK cache resolves without a
    // second network call, which matters when the list re-renders.
    Promise.all(
      countryIds.map(id =>
        triggerGetTree(id, true)
          .unwrap()
          .then(response => response?.data)
          .catch(() => undefined)
      )
    )
      .then(results => {
        if (cancelled || requestRef.current !== requestId) {
          return;
        }
        const loaded = results.filter((tree): tree is AreaCountryTree => Boolean(tree));
        setTrees(loaded);
        setHasError(loaded.length < countryIds.length);
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

  return { trees, isLoading, hasError, refetch };
};
