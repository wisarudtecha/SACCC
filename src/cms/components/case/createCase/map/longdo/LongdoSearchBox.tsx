// Place search for the Longdo map.
//
// Exists because Longdo ships no search widget - the ArcGIS map gets its search
// box from the SDK (see the Search widget in ArcgisAddressMap), and there is no
// equivalent here. Written as an app control rather than styled markup around a
// vendor one, which also means it follows the app's dark mode and translations
// the way BasemapSwitcher already does.
//
// It reports a picked place and nothing else. What that MEANS - move the pin,
// or just navigate there in view-only mode - is the map's decision, exactly as
// it is for the ArcGIS widget's `select-result`.
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { searchPlaces, type PlaceCandidate } from "../services/longdoGeocode";

interface LongdoSearchBoxProps {
  onSelect: (candidate: PlaceCandidate) => void;
  /** Reported so the map can surface a failure the way it surfaces geocode failures. */
  onError?: (message: string) => void;
  compact?: boolean;
}

/**
 * Same floor the ArcGIS Search widget is configured with
 * (SEARCH_MIN_CHARACTERS): don't spend a request until the term could plausibly
 * match something.
 */
const SEARCH_MIN_CHARACTERS = 3;

/** The widget debounces internally; this is our equivalent. */
const SEARCH_DEBOUNCE_MS = 350;

function LongdoSearchBoxBase({ onSelect, onError, compact = false }: LongdoSearchBoxProps) {
  const { t, language } = useTranslation();
  const [term, setTerm] = useState("");
  const [candidates, setCandidates] = useState<readonly PlaceCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Every request is stamped with the term it was issued for, so a slow response
  // for an earlier term cannot overwrite the results of a later one.
  const latestTermRef = useRef("");
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  // `t` is a NEW function on every render (useTranslation builds its closure
  // inline), so it must never be a dependency of this effect - and the effect
  // sets state, so depending on it would re-render, re-run, and never settle.
  const translateRef = useRef(t);
  translateRef.current = t;

  useEffect(() => {
    const trimmed = term.trim();
    latestTermRef.current = trimmed;

    if (trimmed.length < SEARCH_MIN_CHARACTERS) {
      // Guarded rather than unconditional: `setCandidates([])` would hand React
      // a new array identity every time and defeat its bail-out, turning any
      // stray re-run of this effect into a render loop.
      setCandidates((previous) => (previous.length === 0 ? previous : []));
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      searchPlaces(trimmed, language)
        .then((results) => {
          if (latestTermRef.current !== trimmed) {
            return;
          }
          setCandidates(results);
          setIsOpen(true);
        })
        .catch((error: unknown) => {
          if (latestTermRef.current !== trimmed) {
            return;
          }
          console.error("Longdo place search failed", error);
          setCandidates((previous) => (previous.length === 0 ? previous : []));
          onErrorRef.current?.(translateRef.current("case.display.map_search_failed"));
        })
        .finally(() => {
          if (latestTermRef.current === trimmed) {
            setIsSearching(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [term, language]);

  const clear = useCallback(() => {
    setTerm("");
    setCandidates([]);
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (candidate: PlaceCandidate) => {
      onSelect(candidate);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  const placeholder = t("case.display.map_search_placeholder");

  return (
    <div className={`${compact ? "w-44" : "w-72"} max-w-full`}>
      <div className="flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 shadow-sm dark:bg-gray-800/95">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => setIsOpen(candidates.length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
        {isSearching && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />}
        {!isSearching && term.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label={t("case.display.map_search_clear")}
            className="shrink-0 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && candidates.length > 0 && (
        <ul className="mt-1 max-h-56 overflow-auto rounded-md bg-white/95 py-1 shadow-lg dark:bg-gray-800/95">
          {candidates.map((candidate) => (
            <li key={`${candidate.name}:${candidate.latitude},${candidate.longitude}`}>
              <button
                type="button"
                onClick={() => handleSelect(candidate)}
                className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <span className="block truncate font-medium">{candidate.name}</span>
                {candidate.address && (
                  <span className="block truncate text-gray-500 dark:text-gray-400">
                    {candidate.address}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const LongdoSearchBox = memo(LongdoSearchBoxBase);
LongdoSearchBox.displayName = "LongdoSearchBox";

export default LongdoSearchBox;
