// src/cms/utils/apiResponse.ts
/**
 * Reading the BFF's response envelope.
 *
 * Every endpoint answers with { status, msg, data, desc } (or { message } on the
 * REST path), and both success and failure messages hide in one of several
 * fields depending on transport. Callers were each re-deriving the same
 * three-deep optional chain, which is how a handful of them ended up printing a
 * *success* string inside a catch block.
 */
import type { ApiResponse } from "@/core/types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
  (value && typeof value === "object") ? value as UnknownRecord : undefined;

const firstString = (source: UnknownRecord | undefined, keys: string[]): string | undefined => {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
};

/**
 * Whether an envelope reports success.
 *
 * The documented success code is "0" (a string), which is truthy - so plain
 * `if (response.status)` happens to work today. This deliberately keeps that
 * behaviour and only adds the numeric 0 case, which would otherwise read as a
 * failure. Widening it further (treating other codes as success) would risk
 * swallowing real errors, so anything else falsy stays a failure.
 */
export const isApiSuccess = (response: ApiResponse<unknown> | undefined | null): boolean => {
  const status = (response as UnknownRecord | undefined)?.status;
  if (status === 0 || status === "0") {
    return true;
  }
  return Boolean(status);
};

/**
 * Pulls a human-readable message out of either a rejected RTK Query error or a
 * non-success envelope. `fallback` is used when the payload carries nothing
 * useful, which is common on network failures.
 */
export const resolveApiError = (error: unknown, fallback?: string): string => {
  const MESSAGE_KEYS = ["message", "desc", "msg", "error"];

  const record = asRecord(error);
  // RTK Query wraps the response body in `data` on a rejected mutation.
  const fromData = firstString(asRecord(record?.data), MESSAGE_KEYS);
  if (fromData) {
    return fromData;
  }

  const fromTop = firstString(record, MESSAGE_KEYS);
  if (fromTop) {
    return fromTop;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback || "";
};

/** The success message an envelope carries, or the supplied default. */
export const resolveApiMessage = (
  response: ApiResponse<unknown> | undefined | null,
  fallback: string
): string => firstString(asRecord(response), ["message", "msg", "desc"]) || fallback;
