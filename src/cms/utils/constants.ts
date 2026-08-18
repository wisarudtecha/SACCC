// src/cms/utils/constants.ts
/**
 * Application Constants
 */
import { AlertHexaIcon, CheckCircleIcon, ErrorHexaIcon, TimeIcon } from "@/core/icons";

export const APP_CONFIG = {
  NAME: "CMS - Case Management System",
  VERSION: "1.0.0",
  // Environment-based API configuration
  API_BASE_URL: (() => {
    const envName = import.meta.env.VITE_ENV;
    console.log("ENV:", envName);
    const envApi = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    // console.log("API_BASE_URL:", envApi);
    return envApi;
  })(),

  WS_URL: import.meta.env.VITE_WS_URL,
  ENV: import.meta.env.VITE_ENV,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    PROFILE: "/auth/profile",
  },
  TICKETS: {
    LIST: "/tickets",
    CREATE: "/tickets",
    UPDATE: "/tickets/:id",
    DELETE: "/tickets/:id",
    ASSIGN: "/tickets/:id/assign",
    COMMENT: "/tickets/:id/comments",
  },
  WORKFLOWS: {
    LIST: "/workflows",
    CREATE: "/workflows",
    UPDATE: "/workflows/:id",
    DELETE: "/workflows/:id",
    EXECUTE: "/workflows/:id/execute",
    TEMPLATES: "/workflows/templates",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: "/notifications/:id/read",
    PREFERENCES: "/notifications/preferences",
  },
} as const;

export const AUTO_DELETE_OPTIONS = [1, 3, 5, 7, 15, 30] as const;

export const CASE_CANNOT_DELETE = ["S007", "S013", "S014", "S016"] as const;
export const CASE_CANNOT_UPDATE = ["S007", "S013", "S014", "S016"] as const;

export const REQUEST_PART_CAN_UPDATE = ["OS000", "OS001", "OS002", "OS003", "OS004"] as string[];
export const REQUEST_PART_CANCEL = "OS010" as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
} as const;

// CORS-safe endpoints for development
export const CORS_SAFE_ENDPOINTS = [
  "/health",
  "/status",
  "/version",
] as const;

export const SHIPPING_COMPANIES = [
  "Thailand Post",
  "Kerry Express",
  "Flash Express",
  "J&T Express",
  "DHL Express",
  "SCG Express",
  "Ninja Van",
  "Best Express",
  "Lalamove",
  "Grab Express"
];


// Development configuration
export const DEV_CONFIG = {
  MOCK_API: import.meta.env.VITE_MOCK_API === "true",
  API_DELAY: parseInt(import.meta.env.VITE_API_DELAY || "0"),
  ENABLE_DEVTOOLS: import.meta.env.DEV,
} as const;

// export const INTERNAL_UNIT_SOURCE_ID = "3c48bb37-22a4-4aca-b659-955feadeb5c1" as const;
export const INTERNAL_UNIT_SOURCE_ID = ["3c48bb37-22a4-4aca-b659-955feadeb5c1", "3c861de0-86ee-4aed-9c90-c7223c70566a"] as const;

export const AUTH_AUTHORITY_KEY = "auth_authority" as const; // manual | sso
export const AUTH_LOCK_KEY = "auth_lock" as const; // true | false
export const AUTH_SOURCE_KEY = "auth_source" as const; // manual | sso
export const MAX_LOGIN_ATTEMPTS_INTERVAL_MS = 1000 as const; // 1 seconds
export const MAX_SSO_LOGIN_ATTEMPTS = 3 as const; // 3 times
export const SSO_TAKEOVER_KEY = "sso_takeover_active" as const; // true | false

export const LOW_STOCK_THRESHOLD = 5 as const;

export const ORDER_STATUS_ALLOW_TO_CANCEL = ["OS000", "OS001", "OS002"];

export const PERMISSIONS = {
  TICKETS: {
    READ: "tickets:read",
    CREATE: "tickets:create",
    UPDATE: "tickets:update",
    DELETE: "tickets:delete",
    ASSIGN: "tickets:assign",
  },
  WORKFLOWS: {
    READ: "workflows:read",
    CREATE: "workflows:create",
    UPDATE: "workflows:update",
    DELETE: "workflows:delete",
    EXECUTE: "workflows:execute",
  },
  USERS: {
    READ: "users:read",
    CREATE: "users:create",
    UPDATE: "users:update",
    DELETE: "users:delete",
  },
  ADMIN: {
    SYSTEM: "admin:system",
    USERS: "admin:users",
    SETTINGS: "admin:settings",
  },
} as const;

export const POPUP_AUTO_DISMISS_MS = 10000 as const; // แต่ละป็อปอัปโชว์ 10 วิ
export const POPUP_GROUP_AUTO_CLOSE_MS = 8000 as const; // ปิดทั้งชุดใน 8 วิ
export const POPUP_TRANSITION_MS = 300 as const; // animation 300ms (ต้องตรงกับ duration-300)

// export const PRIORITY_COLORS = {
//   low: "text-gray-600 bg-gray-50",
//   medium: "text-blue-600 bg-blue-50",
//   high: "text-orange-600 bg-orange-50",
//   urgent: "text-red-600 bg-red-50",
// } as const;

// export const PRIORITY_COLORS = {
//   low: "bg-transparent border-blue-600 dark:border-blue-300 text-blue-600 dark:text-blue-300",
//   medium: "bg-transparent border-yellow-600 dark:border-yellow-300 text-yellow-600 dark:text-yellow-300",
//   high: "bg-transparent border-red-600 dark:border-red-300 text-red-600 dark:text-red-300",
//   urgent: "bg-transparent border-red-600 dark:border-red-300 text-red-600 dark:text-red-300",
// } as const;
// export const PRIORITY_COLORS = {
//   low: "bg-transparent border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400",
//   medium: "bg-transparent border-yellow-500 dark:border-yellow-400 text-yellow-500 dark:text-yellow-400",
//   high: "bg-transparent border-red-500 dark:border-red-400 text-red-500 dark:text-red-400",
//   urgent: "bg-transparent border-red-500 dark:border-red-400 text-red-500 dark:text-red-400",
// } as const;
export const PRIORITY_COLORS = {
  critical: "bg-transparent border-red-600 dark:border-red-300 text-red-600 dark:text-red-300",
  high: "bg-transparent border-orange-500 dark:border-orange-400 text-orange-500 dark:text-orange-400",
  medium: "bg-transparent border-yellow-500 dark:border-yellow-400 text-yellow-500 dark:text-yellow-400",
  low: "bg-transparent border-blue-600 dark:border-blue-300 text-blue-600 dark:text-blue-300"
} as const;

// export const PRIORITY_LABELS = {
//   low: {
//     th: "ความสำคัญต่ำ",
//     en: "Low Priority",
//   },
//   medium: {
//     th: "ความสำคัญปานกลาง",
//     en: "Medium Priority",
//   },
//   high: {
//     th: "ความสำคัญสูง",
//     en: "High Priority",
//   },
//   urgent: {
//     th: "ความสำคัญสูงสุด",
//     en: "Urgent Priority",
//   }
// } as const;
export const PRIORITY_LABELS = {
  critical: {
    th: "ความสำคัญวิกฤต",
    en: "Critical Priority",
  },
  high: {
    th: "ความสำคัญสูง",
    en: "High Priority",
  },
  medium: {
    th: "ความสำคัญปานกลาง",
    en: "Medium Priority",
  },
  low: {
    th: "ความสำคัญต่ำ",
    en: "Low Priority",
  }
} as const;

// export const PRIORITY_LABELS_SHORT = {
//   low: {
//     th: "ต่ำ",
//     en: "Low",
//   },
//   medium: {
//     th: "ปานกลาง",
//     en: "Medium",
//   },
//   high: {
//     th: "สูง",
//     en: "High",
//   },
//   urgent: {
//     th: "สูงสุด",
//     en: "Urgent",
//   }
// } as const;
export const PRIORITY_LABELS_SHORT = {
  critical: {
    th: "วิกฤต",
    en: "Critical",
  },
  high: {
    th: "สูง",
    en: "High",
  },
  medium: {
    th: "ปานกลาง",
    en: "Medium",
  },
  low: {
    th: "ต่ำ",
    en: "Low",
  }
} as const;

export const PRIORITY_CONFIG = [
  { type: 'critical', count: 1, color: PRIORITY_COLORS.critical, icon: ErrorHexaIcon },
  { type: 'high', count: 3, color: PRIORITY_COLORS.high, icon: AlertHexaIcon },
  { type: 'medium', count: 3, color: PRIORITY_COLORS.medium, icon: TimeIcon },
  { type: 'low', count: 3, color: PRIORITY_COLORS.low, icon: CheckCircleIcon },
] as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  TICKETS: "/tickets",
  WORKFLOWS: "/workflows",
  USERS: "/users",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

export const SESSION_TIMEOUT_TIMER = 480; // min.
export const SESSION_TIMEOUT_WARNING = 1; // min.

export const SLA_STATUS_COLORS = {
  on_time: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  breached: "text-red-600 bg-red-50",
} as const;

export const SOP_TIMELINES_STATUS = ["S008", "S009", "S010", "S011", "S012", "S013", "S014"] as const;

export const STATUS_COLORS = {
  open: "text-blue-600 bg-blue-50",
  in_progress: "text-yellow-600 bg-yellow-50",
  pending: "text-orange-600 bg-orange-50",
  resolved: "text-green-600 bg-green-50",
  closed: "text-gray-600 bg-gray-50",
} as const;

export const SYSTEM_ROLE = "d6381714-8e89-47de-9d16-859131cdc5dc" as const;

export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      900: "#1e3a8a",
    },
    SUCCESS: {
      50: "#f0fdf4",
      500: "#22c55e",
      700: "#15803d",
    },
    WARNING: {
      50: "#fffbeb",
      500: "#f59e0b",
      700: "#d97706",
    },
    ERROR: {
      50: "#fef2f2",
      500: "#ef4444",
      700: "#dc2626",
    },
  },
  BREAKPOINTS: {
    xs: "320px",
    sm: "768px",
    md: "1024px",
    lg: "1280px",
    xl: "1920px",
  },
} as const;

export const VALIDATION_RULES = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  // PHONE: /^\+?[\d\s\-\(\)]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
} as const;

export const WEBSOCKET = import.meta.env.VITE_WEBSOCKET_BASE_URL;


export const formTypeOption = [
  { label: "common.case", value: "case" },
  { label: "common.customer", value: "customer" }
];