// /src/utils/apiErrorHandler.ts
/**
 * Centralized API Error Handling
 */

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ApiError } from "@/cms/types";

export class ApiErrorHandler {
  static handleError(error: FetchBaseQueryError | ApiError): string {
    if (!error) return "An unknown error occurred";

    if ("status" in error) {
      switch (error.status) {
        case 400:
          return this.extractErrorMessage(error.data) || "Bad request";
        case 401:
          return "Authentication required";
        case 403:
          return "Access denied";
        case 404:
          return "Resource not found";
        case 409:
          return "Conflict - resource already exists";
        case 422:
          return this.extractValidationErrors(error.data) || "Validation failed";
        case 429:
          return "Too many requests - please try again later";
        case 500:
          return "Internal server error";
        case 503:
          return "Service temporarily unavailable";
        default:
          return `Error ${error.status}: ${this.extractErrorMessage(error.data)}`;
      }
    }

    if ("message" in error) {
      return error.message;
    }

    return "Network error - please check your connection";
  }

  private static extractErrorMessage(data: unknown): string | null {
    if (!data) return null;
    
    if (typeof data === "string") return data;
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') return data.message;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
    if (typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string') return data.detail;
    
    return null;
  }

  private static extractValidationErrors(data: unknown): string | null {
    if (!data || typeof data !== 'object' || !('errors' in data)) return null;
    
    if (Array.isArray((data as { errors: unknown }).errors)) {
      return ((data as { errors: unknown[] }).errors).map((err: unknown) => 
        typeof err === "string" ? err : (err as { message?: string; field?: string }).message || (err as { message?: string; field?: string }).field
      ).join(", ");
    }
    
    if (typeof (data as { errors: object }).errors === "object") {
      return Object.entries((data as { errors: Record<string, unknown> }).errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(", "); // Explicitly cast message to string
    }
    
    return null;
  }

  static isNetworkError(error: FetchBaseQueryError): boolean {
    return !("status" in error);
  }

  static isAuthError(error: FetchBaseQueryError): boolean {
    return "status" in error && (error.status === 401 || error.status === 403);
  }

  static isValidationError(error: FetchBaseQueryError): boolean {
    return "status" in error && error.status === 422;
  }
}
