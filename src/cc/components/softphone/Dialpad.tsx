// Dialpad for the softphone (`/cc/softphone`) — BRD FR-07 click-to-call,
// actual-calling plan FE-1.2. Pure presentation + local input state: the
// dial command goes through `onDial` (wired to the mock lifecycle in dev +
// mock mode, the dormant `makeCall` mutation once the adapter lands), and the
// leg itself renders in `ActiveCallPanel` only when its `CALL_ANSWERED`
// lifecycle event arrives (make-call command contract §4 — the softphone
// never renders call state from the command response).
//
// Outbound correlation: `onDial` returns the new leg's `callId` (the command
// response's correlation key). The status line below the keypad uses it to
// show "Calling…" until `activeCallId` matches — this is the only place the
// response is consumed; the call panel and toolbar are direction-agnostic and
// treat the dialed leg exactly like an inbound leg.
import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Delete, PhoneCall, X } from "lucide-react";
import {
  dialDestinationDigits,
  dialDestinationErrorKey,
  validateDialDestination,
} from "../../utils/dialDestination";

export interface DialpadProps {
  /** True when the dial command is wired (dev + mock mode only, like the toolbar). */
  enabled: boolean;
  /** `callId` of the most recent session that is not over, or null. */
  activeCallId: string | null;
  /** `callId` of the most recently ended session, or null. */
  lastEndedCallId: string | null;
  /**
   * Dials `destination`. Returns the new leg's `callId` (correlation key), or
   * null when the command is unavailable.
   */
  onDial: (destination: string) => string | null;
}

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"] as const;

/** A dial in flight or connected, tracked by the correlated callId. */
interface DialedLeg {
  callId: string;
  destination: string;
}

export function Dialpad({
  enabled,
  activeCallId,
  lastEndedCallId,
  onDial,
}: DialpadProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [attemptedDial, setAttemptedDial] = useState(false);
  const [dialed, setDialed] = useState<DialedLeg | null>(null);

  const validation = validateDialDestination(input);
  const connected = dialed !== null && activeCallId === dialed.callId;

  // The dialed leg ended — the ended-call notice above takes over; drop the
  // status line (and with it the dialing indicator, in case the leg never
  // connected).
  useEffect(() => {
    if (dialed !== null && lastEndedCallId === dialed.callId) {
      setDialed(null);
    }
  }, [dialed, lastEndedCallId]);

  // A second dial while a call is connected is consult/conference semantics
  // (actual-calling plan Q7, out of scope this release) — the Call button is
  // blocked and says why.
  const busyWithActiveCall = activeCallId !== null;
  const callDisabled =
    !enabled ||
    busyWithActiveCall ||
    !validation.ok ||
    (dialed !== null && !connected);

  const handleDial = () => {
    setAttemptedDial(true);
    if (!validation.ok) {
      return;
    }
    const callId = onDial(validation.destination);
    if (callId !== null) {
      setDialed({ callId, destination: validation.destination });
      setInput("");
    }
  };

  // Validation feedback: character/length problems surface as the agent
  // types; the "enter a number" nudge only after a failed dial attempt.
  const errorKey =
    validation.ok || (validation.reason === "empty" && !attemptedDial)
      ? null
      : dialDestinationErrorKey(validation.reason);

  const hintKey = !enabled
    ? t("cc.softphone.dialpad_unavailable")
    : busyWithActiveCall
      ? t("cc.softphone.dialpad_busy_hint")
      : null;

  return (
    <section
      className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"
      aria-label={t("cc.softphone.dialpad_title")}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="tel"
          value={input}
          placeholder={t("cc.softphone.dialpad_destination_placeholder")}
          aria-label={t("cc.softphone.dialpad_destination_placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !callDisabled) {
              handleDial();
            }
          }}
        />
        <button
          type="button"
          aria-label={t("cc.softphone.dialpad_backspace")}
          title={t("cc.softphone.dialpad_backspace")}
          disabled={input.length === 0}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:enabled:hover:bg-gray-800"
          onClick={() => setInput((previous) => previous.slice(0, -1))}
        >
          <Delete className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYPAD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="rounded-lg border border-gray-200 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => {
              setAttemptedDial(false);
              setInput((previous) => previous + key);
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={callDisabled}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={handleDial}
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" />
        {t("cc.softphone.dialpad_call")}
      </button>

      {errorKey !== null && (
        <p className="text-xs text-red-500 dark:text-red-400">{t(errorKey)}</p>
      )}
      {errorKey === null && hintKey !== null && (
        <p className="text-xs text-gray-400 dark:text-gray-500">{hintKey}</p>
      )}

      {dialed !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          {connected ? (
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          ) : (
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-amber-500"
              aria-hidden="true"
            />
          )}
          <p className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">
            {connected
              ? t("cc.softphone.dialpad_connected")
              : t("cc.softphone.dialpad_calling", {
                  destination: dialDestinationDigits(dialed.destination) ||
                    dialed.destination,
                })}
          </p>
          <button
            type="button"
            aria-label={t("cc.softphone.dialpad_clear")}
            title={t("cc.softphone.dialpad_clear")}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
            onClick={() => setDialed(null)}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
