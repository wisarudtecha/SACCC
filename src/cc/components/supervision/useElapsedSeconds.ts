// Live duration ticker for roster rows: seconds elapsed since an ISO
// `startedAt` timestamp, refreshed every second. Clamped at zero so server
// clock skew never renders a negative duration.
import { useEffect, useState } from "react";

export function useElapsedSeconds(startedAt: string | null | undefined): number {
  const [elapsed, setElapsed] = useState(() =>
    secondsSince(startedAt)
  );

  useEffect(() => {
    setElapsed(secondsSince(startedAt));
    if (!startedAt) {
      return undefined;
    }
    const id = setInterval(() => {
      setElapsed(secondsSince(startedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

function secondsSince(startedAt: string | null | undefined): number {
  if (!startedAt) {
    return 0;
  }
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}
