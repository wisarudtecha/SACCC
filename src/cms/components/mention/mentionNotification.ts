// src/cms/components/mention/mentionNotification.ts
/**
 * Pure mapping from a MENTION websocket event to the header notification
 * surface (core/types/notification.ts Notification, rendered by
 * NotificationDropdown) - the same pattern as
 * cms/components/escalation/slaEscalationNotification.ts.
 */
import type { Notification } from "@/core/types/notification";
import type { MentionEvent } from "./mentionEvent";

/** `eventType` label shown on the notification badge and in the type filter. */
export const MENTION_EVENT_TYPE = "Mention";

/**
 * Alert identity: (commentId, mentionedUserId) - one alert per mentioned user
 * per comment, so a replayed event never double-popups.
 */
export function mentionAlertKey(event: MentionEvent): string {
  return `mention-${event.commentId}-${event.mentionedUserId}`;
}

/**
 * Case-detail deep link, optionally targeting the exact comment so the
 * detail view can open the comment section and scroll to it. Relative on
 * purpose: NotificationDropdown navigates via useAppNavigate("cms"), which
 * prepends the /cms route prefix.
 */
export function mentionCaseDeepLink(caseId: string, commentId?: string): string {
  const base = `/case/${caseId}`;
  if (!commentId) {
    return base;
  }
  return `${base}?commentId=${encodeURIComponent(commentId)}`;
}

export interface MentionNotificationCopy {
  /** Message body, e.g. "mentioned you in case X" - i18n stays at the caller. */
  message: string;
}

export function buildMentionNotification(
  event: MentionEvent,
  copy: MentionNotificationCopy
): Notification {
  const sender =
    event.mentionedByDisplayName || event.mentionedByUsername || event.mentionedByUserId;
  const redirectURL = mentionCaseDeepLink(event.caseId, event.commentId);
  return {
    id: mentionAlertKey(event),
    tenantId: "",
    senderType: "low",
    senderPhoto: "",
    sender,
    message: `${sender} ${copy.message}`,
    eventType: MENTION_EVENT_TYPE,
    redirectURL,
    createdAt: event.timestamp,
    read: false,
    data: [
      { key: "caseId", value: event.caseId },
      { key: "commentId", value: event.commentId },
      { key: "redirectURL", value: redirectURL },
    ],
    recipients: [{ type: "user", value: event.mentionedUsername }],
    additionalJson: { ...event },
  };
}
