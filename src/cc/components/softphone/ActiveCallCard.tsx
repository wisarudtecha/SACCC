// Caller info card for the active-call left panel.
// Pure presentation — timer is local; everything else comes from props.
import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { PhoneCall } from "lucide-react";
import type { CallSession } from "./softphoneCallState";
import { formatCallDuration } from "./softphoneCallState";
import { MonitorBadge } from "./MonitorBadge";

export interface ActiveCallCardProps {
  call: CallSession;
  contactName?: string | null;
  contactNumber?: string | null;
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

export function ActiveCallCard({
  call,
  contactName,
  contactNumber,
}: ActiveCallCardProps) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (call.status !== "active") return;
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [call.callId, call.status]);

  const displayName = contactName ?? t("cc.screenpop.unknown_caller");
  const displayNumber = contactNumber ?? call.callId;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-6 dark:bg-gray-800/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        {contactName ? initialsOf(contactName) : <PhoneCall className="h-8 w-8" />}
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {displayName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {displayNumber}
        </p>
      </div>

      {call.monitor && <MonitorBadge monitor={call.monitor} />}

      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
        {formatCallDuration(elapsed)}
      </p>
    </div>
  );
}
