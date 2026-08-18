// /src/utils/tokenManager.ts
import { JWTUtils } from "@/core/utils/jwt";
import {
  // AUTH_AUTHORITY_KEY,
  AUTH_LOCK_KEY,
  // AUTH_SOURCE_KEY
} from "@/core/utils/constants";
import type { User } from "@/core/types/auth";
import type { DecodedJWT, JWTHeader, JWTPayload, TokenValidationResult } from "@/core/types/auth";

export class TokenManager {
  private static STORAGE_KEY = "access_token";
  private static REFRESH_KEY = "refresh_token";
  private static PROFILE_KEY = "profile";
  private static LANGUAGE_KEY = "language";

  // Simple encryption for sensitive data (in production, use proper encryption)
  private static encrypt(data: string): string {
    try {
      return btoa(encodeURIComponent(data));
    }
    catch {
      return data;
    }
  }

  static decrypt(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    }
    catch {
      return data;
    }
  }
  
  static setTokens(
    accessToken: string,
    refreshToken: string,
    // rememberMe: boolean = false,
    rememberMe: boolean = true,
    profile?: unknown,
    language?: string
  ) {
    if (sessionStorage.getItem(AUTH_LOCK_KEY) === "true") {
      console.warn("🔒 Token set blocked by AUTH_LOCK");
      return;
    }

    this.clearTokens();

    // const storage = rememberMe ? localStorage : sessionStorage;
    const storage = rememberMe && localStorage || sessionStorage;

    // Encrypt tokens for security
    storage.setItem(this.STORAGE_KEY, accessToken);
    storage.setItem(this.REFRESH_KEY, refreshToken);

    if (profile) {
      storage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    }

    if (language) {
      storage.setItem(this.LANGUAGE_KEY, language);
    }

    // Set secure cookie as backup (if HTTPS and production)
    if (typeof document !== "undefined" && window.location.protocol === "https:") {
      try {
        const secure = "Secure";
        const sameSite = "SameSite=Strict";
        // const httpOnly = ""; // Can"t set HttpOnly from JavaScript
        document.cookie = `${this.STORAGE_KEY}=${this.encrypt(accessToken)}; Path=/; ${secure}; ${sameSite}; Max-Age=86400`;
      }
      catch (error) {
        console.warn("Could not set secure cookie:", error);
      }
    }
  }
  
  static getToken(): string | null {
    const localStorage_token = localStorage.getItem(this.STORAGE_KEY);
    const sessionStorage_token = sessionStorage.getItem(this.STORAGE_KEY);
    
    const token = localStorage_token || sessionStorage_token;
    return token ? this.decrypt(token) : null;
  }
  
  static getRefreshToken(): string | null {
    const localStorage_token = localStorage.getItem(this.REFRESH_KEY);
    const sessionStorage_token = sessionStorage.getItem(this.REFRESH_KEY);
    
    const refreshToken = localStorage_token || sessionStorage_token;
    return refreshToken ? this.decrypt(refreshToken) : null;
  }

  static getStoredUser(): User | null {
    const localStorage_user = localStorage.getItem(this.PROFILE_KEY);
    const sessionStorage_user = sessionStorage.getItem(this.PROFILE_KEY);
    
    const userData = localStorage_user || sessionStorage_user;
    if (userData) {
      try {
        return JSON.parse(this.decrypt(userData));
      }
      catch {
        return null;
      }
    }
    return null;
  }
  
  static clearTokens() {
    // Clear all tokens (for development only)
    // localStorage.clear();
    // sessionStorage.clear();

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.PROFILE_KEY);

    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.PROFILE_KEY);

    // sessionStorage.removeItem(AUTH_AUTHORITY_KEY);
    // sessionStorage.removeItem(AUTH_SOURCE_KEY);
    // sessionStorage.removeItem(AUTH_LOCK_KEY);

    // Clear secure cookies
    if (typeof document !== "undefined") {
      try {
        document.cookie = `${this.STORAGE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
      }
      catch (error) {
        console.warn("Could not clear secure cookie:", error);
      }
    }
  }
  
  /**
   * Check if token is expired (legacy method for backward compatibility)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      // console.log("⏰ Token expiry check:", { 
      //   exp: payload.exp, 
      //   now: currentTime, 
      //   isExpired,
      //   timeLeft: payload.exp - currentTime 
      // });
      
      return isExpired;
    }
    catch (error) {
      console.log("❌ Token expiry check failed:", error);
      return true;
    }
  }

  static getTokenExpiryTime(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000; // Convert to milliseconds
    }
    catch {
      return null;
    }
  }

  static isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    const expiryTime = this.getTokenExpiryTime(token);
    if (!expiryTime) {
      return true;
    }
    
    const now = Date.now();
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
    
    return (expiryTime - now) < threshold;
  }

  // ===================================================================
  // JWTTokenInspector Helper
  // ===================================================================

  /**
   * Decode JWT token without verification (for client-side use)
   */
  static decodeToken(token: string): DecodedJWT {
    // console.log("🔓 Decoding JWT token...");
    
    if (!token || typeof token !== "string") {
      throw new Error("Invalid token format");
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format - must have 3 parts");
    }

    try {
      const header = JSON.parse(JWTUtils.base64UrlDecode(parts[0])) as JWTHeader;
      const payload = JSON.parse(JWTUtils.base64UrlDecode(parts[1])) as JWTPayload;
      const signature = parts[2];

      // console.log("✅ Token decoded successfully:", {
      //   header,
      //   payload: { ...payload, exp: new Date(payload.exp * 1000) },
      //   hasSignature: !!signature
      // });

      return {
        header,
        payload,
        signature,
        raw: {
          header: parts[0],
          payload: parts[1],
          signature: parts[2]
        }
      };
    }
    catch (error) {
      // console.error("❌ Token decoding failed:", error);
      throw new Error(`Failed to decode token: ${error}`);
    }
  }

  /**
   * Validate JWT token comprehensively
   */
  static validateToken(token: string): TokenValidationResult {
    // console.log("🔍 Validating JWT token...");
    
    const result: TokenValidationResult = {
      isValid: false,
      isExpired: false,
      errors: []
    };

    try {
      if (!token) {
        result.errors.push("Token is missing");
        return result;
      }

      const decoded = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);

      // Check token structure
      if (!decoded.header.alg || !decoded.header.typ) {
        result.errors.push("Invalid token header");
      }

      if (!decoded.payload.sub || !decoded.payload.exp) {
        result.errors.push("Invalid token payload - missing required fields");
      }

      // Check expiration
      if (decoded.payload.exp < now) {
        result.isExpired = true;
        result.errors.push("Token has expired");
      }

      // Check issued at time (not in future)
      if (decoded.payload.iat && decoded.payload.iat > now + 300) { // 5 min tolerance
        result.errors.push("Token issued in the future");
      }

      // In a real app, you would verify signature here
      // For demo purposes, we"ll mock signature validation
      if (!decoded.signature || decoded.signature.length < 10) {
        result.errors.push("Invalid token signature");
      }

      // If no errors and not expired, token is valid
      result.isValid = result.errors.length === 0;

      // Extract user information
      if (result.isValid || (!result.isExpired && result.errors.length <= 1)) {
        result.user = {
          id: decoded.payload.sub,
          username: decoded.payload.username,
          name: decoded.payload.name || "Unknown User",
          role: (decoded.payload.role as User["role"]) || "viewer",
          department: "IT", // Default for demo
          organization: decoded.payload.organization || "SKY-AI", // Default for demo
          orgId: "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
          roleId: "d6381714-8e89-47de-9d16-859131cdc5dc",
          lastLogin: new Date(),
          isEmailVerified: true, // Default for demo
          twoFactorEnabled: false, // Default for demo
          // permission: decoded.payload.permissions || ["read"]
          permission: Array.isArray(decoded.payload.permissions)
            ? { default: decoded.payload.permissions }
            : decoded.payload.permissions || { default: ["read"] }
        };
        
        result.expiresAt = new Date(decoded.payload.exp * 1000);
        result.issuedAt = decoded.payload.iat ? new Date(decoded.payload.iat * 1000) : undefined;
      }

      // console.log("🔍 Token validation result:", {
      //   isValid: result.isValid,
      //   isExpired: result.isExpired,
      //   errors: result.errors,
      //   expiresAt: result.expiresAt,
      //   user: result.user?.email
      // });

      return result;

    }
    catch (error) {
      result.errors.push(`Token validation failed: ${error}`);
      // console.error("❌ Token validation error:", error);
      return result;
    }
  }

  /**
   * Get token expiration info
   */
  static getTokenExpiry(token: string): { expiresAt: Date; timeLeft: number; isExpired: boolean } | null {
    try {
      const decoded = this.decodeToken(token);
      const expiresAt = new Date(decoded.payload.exp * 1000);
      const timeLeft = decoded.payload.exp * 1000 - Date.now();
      const isExpired = timeLeft <= 0;

      return {
        expiresAt,
        timeLeft: Math.max(0, timeLeft),
        isExpired
      };
    }
    catch (error) {
      console.error("❌ Failed to get token expiry:", error);
      return null;
    }
  }

  /**
   * Refresh token if it's about to expire (within 5 minutes)
   */
  static shouldRefreshToken(token: string): boolean {
    try {
      const expiry = this.getTokenExpiry(token);
      if (!expiry) return true;

      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      return expiry.timeLeft < fiveMinutes && !expiry.isExpired;
    }
    catch {
      return true;
    }
  }
}
