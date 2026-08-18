// /src/utils/httpClient.ts
import { API_CONFIG } from "@/core/config/api";
import { TokenManager } from "@/core/utils/tokenManager";
import type { ApiResponse } from "@/core/types";

export class HttpClient {
  private static instance: HttpClient;
  // private abortController: AbortController | null = null;
  private requestControllers = new Map<string, AbortController>();

  static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    requestKey?: string // Optional key to group related requests
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${API_CONFIG.BASE_URL}${url}`;
    
    // Cancel previous request if still pending
    // if (this.abortController) {
    //   this.abortController.abort();
    // }
    
    // this.abortController = new AbortController();

    // Create abort controller for this request
    const abortController = new AbortController();

    // If a request key is provided, cancel previous requests with the same key
    if (requestKey) {
      const existingController = this.requestControllers.get(requestKey);
      if (existingController) {
        existingController.abort();
      }
      this.requestControllers.set(requestKey, abortController);
    }
    
    const defaultHeaders = new Headers({
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    });

    // Merge headers from options
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        defaultHeaders.set(key, value);
      });
    }

    // Add auth token if available
    const token = TokenManager.getToken();
    if (token) {
      defaultHeaders.set("Authorization", `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers: defaultHeaders,
      // signal: this.abortController.signal,
      signal: abortController.signal,
      credentials: "include", // Include cookies for CSRF
      mode: "cors" // Explicitly set CORS mode
    };

    // console.log("🌐 Making API request:", {
    //   method: config.method || "GET",
    //   url: fullUrl,
    //   headers: defaultHeaders,
    //   body: options.body ? "Present" : "None"
    // });

    try {
      const response = await fetch(fullUrl, config);

      // console.log("📡 API Response:", {
      //   status: response.status,
      //   statusText: response.statusText,
      //   headers: Object.fromEntries(response.headers.entries())
      // });

      // Clean up the controller from the map
      if (requestKey) {
        this.requestControllers.delete(requestKey);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.handleTokenRefresh();
          if (refreshed) {
            // Retry original request with new token
            return this.makeRequest(url, options);
          }
          else {
            throw new Error("Authentication failed - please login again");
          }
        }

        // Handle CORS errors
        if (response.status === 0 || response.type === "opaque") {
          throw new Error("CORS Error: Backend server is not configured to allow requests from this domain. Please check CORS settings.");
        }
        
        // const errorData = await response.json().catch(() => ({}));
        let errorData;
        try {
          errorData = await response.json();
        }
        catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log("✅ API Success:", data);
      return data;
    }
    catch (error) {
      // console.error("❌ API Error:", error);
      // Clean up the controller from the map on error
      if (requestKey) {
        this.requestControllers.delete(requestKey);
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Request cancelled");
      }
      
      // if (error instanceof TypeError && error.message === "Failed to fetch") {
      //   throw new Error("Network error - please check your connection");
      // }
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("CORS Error: Cannot connect to backend server. Please check:\n• Backend server is running\n• CORS is configured properly");
      }
      
      throw error;
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = TokenManager.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {
        method: "POST",
        // headers: {
        //   "Content-Type": "application/json",
        // },
        headers: headers,
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
        mode: "cors"
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      
      return false;
    }
    catch {
      return false;
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: "GET" });
  }

  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: "DELETE" });
  }

  // Cancel specific requests by key
  cancelRequest(requestKey: string): void {
    const controller = this.requestControllers.get(requestKey);
    if (controller) {
      controller.abort();
      this.requestControllers.delete(requestKey);
    }
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.requestControllers.forEach(controller => controller.abort());
    this.requestControllers.clear();
  }
}
