// /src/types/notification.ts
export interface Data {
  key: string;
  value: string;
}

export interface Recipient {
  type: string;
  value: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  senderType: "low" | "medium" | "high" | string;
  senderPhoto: string;
  sender: string;
  message: string;
  eventType: string;
  redirectURL?: string;
  redirectUrl?: string;
  createdAt: string;
  read: boolean;
  data: Data[];
  recipients: Recipient[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalJson: any,
}

// export interface NotificationData {
//   key: string;
//   value: string;
// }

// export interface Recipient {
//   type: string;
//   value: string;
// }

// export interface NotificationEvent {
//   EVENT: null;
//   id: number;
//   orgId: string;
//   senderType: string;
//   senderPhoto: string;
//   sender: string;
//   message: string;
//   eventType: string;
//   redirectUrl: string;
//   createdAt: string; // ISO datetime string
//   createdBy: string;
//   expiredAt: string; // ISO datetime string
//   data: NotificationData[];
//   recipients: Recipient[];
// }

export type PopupItem = { id: string; noti: Notification };
