// Global active-call indicator bar. Mounted in App.tsx so it overlays every
// module. Shows the most recent active call with a live duration timer and a
// hang-up button.
import { useEffect, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useGlobalActiveCalls } from "./useGlobalActiveCalls";
import { formatCallDuration } from "./globalCallState";

export default function ActiveCallBar() {
  const { primaryCall, hasActiveCalls, endCall } = useGlobalActiveCalls();
  const [elapsed, setElapsed] = useState(0);

  // Live duration ticker (1s) based on the primary call's startedAt.
  useEffect(() => {
    if (!primaryCall) {
      setElapsed(0);
      return;
    }
    const started = new Date(primaryCall.startedAt).getTime();
    if (Number.isNaN(started)) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCall?.callId, primaryCall?.startedAt]);

  if (!hasActiveCalls || !primaryCall) {
    return null;
  }

  const caller = primaryCall.ani || "Unknown";
  const statusLabel =
    primaryCall.status === "on_hold"
      ? "On Hold"
      : primaryCall.status === "transferred"
        ? "Transferred"
        : "Active";

  return (
    <div className="bottom-6 left-1/2 -translate-x-1/2 fixed z-[9998] flex items-center gap-3 rounded-full bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 shadow-xl">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
      <Phone className="h-4 w-4 text-green-400" aria-hidden="true" />
      <span className="text-xs font-medium">
        {caller}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 dark:bg-gray-600 text-gray-200">
        {statusLabel}
      </span>
      <span className="text-xs font-mono text-gray-300">
        {formatCallDuration(elapsed)}
      </span>
      <button
        type="button"
        onClick={() => endCall(primaryCall.callId)}
        className="ml-1 rounded-full p-1 bg-red-600 hover:bg-red-700 text-white"
        aria-label="Hang up"
        title="Hang up"
      >
        <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
