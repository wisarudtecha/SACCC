// /src/types/auth.ts
export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: "admin" | "manager" | "agent" | "viewer";
  department: string;
  lastLogin: Date;
  // permission: string[];
  permission: Record<string, string[]>;
  organization: string;
  orgId: string;
  roleId: string;
  avatar?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  /** Absolute epoch-ms deadline the warning modal is counting down to, if it is showing.
   *  Only ever the extendable token deadline — the absolute session cap signs the user
   *  out directly with no warning (see useHardSessionCap / terminateSession). */
  sessionTimeout: number | null;
  failedAttempts: number;
  isLocked: boolean;
  networkStatus: "online" | "offline";
  lastActivity: number;
}

// JWT Token Interfaces
export interface JWTHeader {
  alg: string;
  typ: string;
  kid?: string;
}

export interface JWTPayload {
  sub: string;
  username: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  organization: string;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

// export interface LoginCredentials {
//   username: string;
//   email?: string;
//   password: string;
//   organization?: string;
//   rememberMe: boolean;
//   captcha?: string;
//   twoFactorCode?: string;
// }

export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
  organization?: string;
  rememberMe: boolean;
  captcha?: string;
  twoFactorCode?: string;
  token?: string;
  language?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
  organization: string;
  rememberMe: boolean;
  captcha?: string;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
  organization?: string;
  captcha?: string;
  general?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  permissions?: string[];
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAnyPermission?: string[];
  module?: string; // e.g., "dispatch", "user" - checks for view permission
  action?: "view" | "create" | "update" | "delete"; // specific action permission
  fallback?: React.ComponentType;
}

export interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  role: string;
  organization: string;
  acceptTerms: boolean;
}

// Updated: [04-07-2025] v0.1.1
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  user?: User;
  errors: string[];
  expiresAt?: Date;
  issuedAt?: Date;
}
