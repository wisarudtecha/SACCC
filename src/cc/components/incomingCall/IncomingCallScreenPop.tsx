// Global container for the incoming-call screen pop. Mounted once in
// `src/App.tsx` as a `<Routes>` sibling (inside WebSocketProvider/router/
// auth/toast/i18n), renders nothing unless an active call card exists.
//
// Dev/mock wiring mirrors the SLA escalation precedent in
// `NotificationDropdown.tsx`: the emitter + console util are imported
// unconditionally but no-op outside `import.meta.env.DEV` +
// `VITE_MOCK_API="true"` (constant conditions tree-shake them from
// production builds). In mock mode a single demo call fires ~8s after
// login; more can be injected from the devtools console via
// `window.emitMockIncomingCall({ ani: "+66811223344" })`.
import { useEffect } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { IncomingCallCard } from "./IncomingCallCard";
import { useIncomingCallPopups } from "./useIncomingCallPopups";
import {
  attachMockIncomingCallConsoleUtil,
  startMockIncomingCallEmitter,
} from "./mockIncomingCallEmitter";

export default function IncomingCallScreenPop() {
  const { items, handleMessage, openCase, createCase, answer, dismiss } = useIncomingCallPopups();
  const { t } = useTranslation();

  // Mock-mode wiring (VITE_MOCK_API + dev only): the emitter feeds the same
  // handler the real websocket uses, so the demo path is the production path.
  useEffect(() => {
    const stopDemo = startMockIncomingCallEmitter(handleMessage);
    const detachConsoleUtil = attachMockIncomingCallConsoleUtil(handleMessage);
    return () => {
      stopDemo();
      detachConsoleUtil();
    };
  }, [handleMessage]);

  if (items.length === 0) {
    return null;
  }

  const newest = items[items.length - 1];
  const newestNumber = newest.ani.national || newest.ani.raw;

  return (
    <>
      {/* Screen-reader announcement for each stack change; visually hidden. */}
      <div className="sr-only" aria-live="polite">
        {t("cc.screenpop.incoming_call_announcement", { number: newestNumber })}
      </div>
      <div className="bottom-6 right-6 fixed z-9999 flex flex-col gap-2">
        {items.map((item, index) => (
          <IncomingCallCard
            key={item.call.callId}
            item={item}
            queueCount={items.length}
            isNewest={index === items.length - 1}
            onAnswer={answer}
            onOpenCase={openCase}
            onCreateCase={createCase}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </>
  );
}
