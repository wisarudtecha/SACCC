// Whether the browser tab is currently visible.
//
// Exists for the "idle map runs no timers" rule: the staff roster's safety-net
// poll costs one request per open case, and a dispatcher who left the tab in the
// background is not watching the map. Polling there is pure spend, so the poll
// stops and resumes on the same event.
//
// `document.hidden` is read through state rather than at call time so React
// re-renders (and therefore re-runs the caller's effect) when it changes.
import { useEffect, useState } from "react";

function readIsVisible(): boolean {
  // No document (SSR / non-DOM test environment): assume visible, i.e. keep the
  // behaviour the surface had before this hook existed.
  if (typeof document === "undefined") {
    return true;
  }
  return !document.hidden;
}

export function useDocumentVisible(): boolean {
  const [isVisible, setIsVisible] = useState(readIsVisible);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Updater form with an identity check: `visibilitychange` can fire more than
      // once for the same state, and re-rendering for nothing would re-run every
      // subscriber's effect.
      const next = readIsVisible();
      setIsVisible((previous) => (previous === next ? previous : next));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

export default useDocumentVisible;
