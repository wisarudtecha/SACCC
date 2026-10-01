// src/cms/components/escalation/slaEscalationNotification.ts
/**
 * Pure mapping from an SLA escalation event (CAD websocket contract) to the
 * header notification surface (`core/types/notification.ts` `Notification`,
 * rendered by NotificationDropdown).
 *
 * The dropdown's existing visual tiers are reused unchanged: `delay: "1"`
 * renders the amber gradient badge (used for pre-breach warnings) and
 * `delay: "2"` renders the red pulsing gradient badge (used for breaches), so
 * escalation alerts look native without touching the dropdown's markup.
 */
import type { Notification } from "@/core/types/notification";
import type { SlaEscalationEvent } from "@/cms/types/escalation";
import { escalationDedupeKey } from "@/cms/utils/slaEscalation";

/** `eventType` label shown on the notification badge and in the type filter. */
export const SLA_ESCALATION_EVENT_TYPE = "SLA Escalation";

/**
 * Alert identity: prefer the backend idempotency key (`eventId`); fall back to
 * the (caseId, level, type) composite so a malformed event still dedupes.
 */
export function escalationAlertKey(event: SlaEscalationEvent): string {
  return event.eventId || escalationDedupeKey(event.caseId, event.level, event.type);
}

/** Case-detail deep link consumed by the dropdown's `redirectURL` handling. */
export function escalationCaseDeepLink(caseId: string): string {
  return `/case/${caseId}`;
}

export interface EscalationNotificationCopy {
  /** Message body for a pre-breach warning, e.g. "is approaching its SLA target". */
  warningMessage: string;
  /** Message body for a breach, e.g. "has breached its SLA target". */
  breachMessage: string;
}

/**
 * Builds the dropdown-compatible notification for one escalation event.
 * `copy` is supplied by the caller so i18n stays at the component layer.
 */
export function buildEscalationNotification(
  event: SlaEscalationEvent,
  copy: EscalationNotificationCopy
): Notification {
  const caseLabel = event.caseNumber ?? event.caseId;
  const redirectURL = escalationCaseDeepLink(event.caseId);
  return {
    id: escalationAlertKey(event),
    tenantId: "",
    senderType: event.type === "breach" ? "high" : "medium",
    senderPhoto: "",
    sender: event.targetRole,
    message: `${caseLabel} ${event.type === "breach" ? copy.breachMessage : copy.warningMessage}`,
    eventType: SLA_ESCALATION_EVENT_TYPE,
    redirectURL,
    createdAt: event.occurredAt,
    read: false,
    data: [
      { key: "caseId", value: event.caseId },
      { key: "delay", value: event.type === "breach" ? "2" : "1" },
      { key: "redirectURL", value: redirectURL },
    ],
    recipients: [{ type: "role", value: event.targetRole }],
    additionalJson: { ...event },
  };
}
