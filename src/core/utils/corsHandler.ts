// /src/utils/corsHandler.ts
/**
 * CORS Handling Utilities for Development
 * Alternative solutions and debugging tools
 */
import { APP_CONFIG } from "@/cms/utils/constants";

export class CORSHandler {
  /**
   * Check if current environment has CORS issues
   */
  static hasCORSIssue(): boolean {
    return import.meta.env.DEV && window.location.protocol !== "https:";
  }

  /**
   * Get appropriate API URL based on environment
   */
  static getApiUrl(endpoint: string): string {
    const baseUrl = import.meta.env.DEV 
      ? "/api/v1"  // Use proxy in development
      : (import.meta.env.VITE_API_BASE_URL || "/api/v1");
    
    return `${baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  }

  /**
   * Check if server supports CORS
   */
  static async checkCORSSupport(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "OPTIONS",
        headers: {
          "Origin": window.location.origin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
      });
      
      return response.ok && response.headers.get("Access-Control-Allow-Origin") !== null;
    }
    catch {
      return false;
    }
  }

  /**
   * Debugging helper for CORS issues
   */
  static debugCORS(error: unknown): void {
    if (import.meta.env.DEV) {
      console.group("🔴 CORS Debug Information");
      console.log("Error:", error);
      console.log("Frontend URL:", window.location.origin);
      console.log("API Base URL:", APP_CONFIG.API_BASE_URL);
      console.log("Using Proxy:", APP_CONFIG.API_BASE_URL.startsWith("/api"));
      
      if (!APP_CONFIG.API_BASE_URL.startsWith("/api")) {
        console.warn("💡 Recommendation: Use Vite proxy configuration for development");
        console.log(`Set API_BASE_URL to "/api/v1" and configure proxy in vite.config.ts`);
      }
      
      console.groupEnd();
    }
  }
}
