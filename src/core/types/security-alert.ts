// /src/types/security-alert.ts
export interface SecurityAlert {
  id: string;
  type: "login" | "password" | "lockout" | "permission" | "device" | "location" | "breach" | "session";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  actions?: SecurityAction[];
  autoClose?: number; // milliseconds
  persistent?: boolean;
  acknowledged?: boolean;
}

export interface SecurityAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger";
  handler: () => void;
}

export interface LoginAttempt {
  timestamp: Date;
  location: string;
  device: string;
  ip: string;
  success: boolean;
  userAgent: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  lastSeen: Date;
  trusted: boolean;
}
