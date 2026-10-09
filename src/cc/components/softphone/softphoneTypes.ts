// Shared types for the softphone redesign sub-components.
// Pure types — no React imports — so they stay node-testable.

export type CallDirection = "incoming" | "outgoing";

export interface RecentCallItem {
  callId: string;
  name: string;
  number: string;
  durationSeconds?: number;
  timestamp: string;
  direction: CallDirection;
  missed: boolean;
}

export type ContactChannelType = "PHONE" | "LINE" | "EMAIL" | "FACEBOOK";

export interface ContactChannel {
  type: ContactChannelType;
  value: string;
  isPrimary?: boolean;
}

export interface ContactListItem {
  id: string;
  name: string;
  phone: string;
  company?: string;
  tags?: string[];
  photo?: string;
}

export type ContactLookupStatus = "idle" | "loading" | "resolved" | "unknown" | "error";
