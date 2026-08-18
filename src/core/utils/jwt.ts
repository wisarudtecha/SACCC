// src/utils/jwt.ts
import type { JWTHeader, JWTPayload } from "@/core/types/auth";

// JWT Utilities
export class JWTUtils {
  /**
   * Safely decode base64 URL encoded string
   */
  static base64UrlDecode(str: string): string {
    try {
      // Add padding if needed
      const paddedStr = str + "=".repeat((4 - str.length % 4) % 4);
      // Replace URL-safe characters
      const base64 = paddedStr.replace(/-/g, "+").replace(/_/g, "/");
      return atob(base64);
    } catch (error) {
      throw new Error(`Failed to decode base64: ${error}`);
    }
  }

  /**
   * Encode object to base64 URL format
   */
  static base64UrlEncode(obj: unknown): string {
    try {
      const jsonStr = JSON.stringify(obj);
      const base64 = btoa(jsonStr);
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    } catch (error) {
      throw new Error(`Failed to encode to base64: ${error}`);
    }
  }

  /**
   * Create a properly formatted JWT token
   */
  static createToken(payload: Partial<JWTPayload>, expiresInHours: number = 24): string {
    const header: JWTHeader = {
      alg: "HS256",
      typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload: JWTPayload = {
      sub: payload.sub || "1",
      username: payload.username || "admin",
      name: payload.name || "Admin of SKY AI",
      role: payload.role || "admin",
      permissions: payload.permissions || ["read", "write", "delete", "admin"],
      organization: payload.organization || "SKY-AI",
      iat: now,
      exp: now + (expiresInHours * 60 * 60),
      iss: "cms-portal",
      aud: "cms-users",
      jti: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "mock-" + Date.now()
    };

    const encodedHeader = this.base64UrlEncode(header);
    const encodedPayload = this.base64UrlEncode(jwtPayload);
    const signature = this.base64UrlEncode({ signature: "mock-signature-" + Date.now() });

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}
