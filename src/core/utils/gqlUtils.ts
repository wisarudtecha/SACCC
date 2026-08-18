// src/core/utils/gqlUtils.ts
import { FetchArgs } from "@reduxjs/toolkit/query";
import type { ExtractedFile } from "@/core/types/gql";

const NUMBER_FIELDS = [
  "start",
  "length"
];

export const isBlob = (value: unknown): value is Blob => {
  return typeof Blob !== "undefined" && value instanceof Blob;
};

export const isFile = (value: unknown): value is File => {
  return typeof File !== "undefined" && value instanceof File;
};

export const containsFile = (obj: unknown): boolean => {
  if (!obj) {
    return false;
  }
  if (isFile(obj) || isBlob(obj)) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.some(containsFile);
  }
  if (typeof obj === "object") {
    return Object.values(obj).some(containsFile);
  }
  return false;
};

export const extractFiles = (obj: Record<string, unknown>, basePath = "variables.input"): ExtractedFile[] => {
  const files: ExtractedFile[] = [];
  const walk = (current: unknown, path: string) => {
    if (isFile(current) || isBlob(current)) {
      files.push({
        key: `${files.length}`,
        file: current,
        path
      });
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        walk(item, `${path}.${index}`);
      });
      return;
    }
    if (current && typeof current === "object") {
      Object.entries(current).forEach(([key, value]) => {
        walk(value, `${path}.${key}`);
      });
    }
  };
  walk(obj, basePath);
  return files;
};

export const extractGraphQLData = (response: Record<string, unknown>) => {
  if (!response?.data) {
    return response;
  }
  let current = response.data;
  while (current && typeof current === "object" && current !== null) {
    const keys = Object.keys(current as Record<string, unknown>);
    if (keys.length !== 1) {
      break;
    }
    current = (current as Record<string, unknown>)[keys[0]] as Record<string, unknown>;
  }
  return current;
};

export const extractQueryParams = (url: string) => {
  const [path, queryString] = url.split("?");
  if (!queryString) {
    return { path, queryParams: {} };
  }
  const queryParams = Object.fromEntries(
    Array.from(new URLSearchParams(queryString).entries()).map(
      // ([k, v]) => [k, normalizeValue(v)]
      ([k, v]) => [k, normalizeQueryParams(k, v)]
    )
  );
  return { path, queryParams };
};

export const gql = (document: string, variables?: Record<string, unknown>, fallback?: string | FetchArgs) => ({
  type: "GQL" as const,
  document,
  variables,
  fallback
});

export const normalizeObject = (obj: Record<string, unknown>, isMutation: boolean) => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (typeof v === "string") {
        // return [k, normalizeValue(v)];
        if (isMutation) {
          return [k, normalizeMutationInput(v)];
        }
        return [k, normalizeQueryParams(k, v)];
      }
      return [k, v];
    })
  );
};

export const normalizeToApiResponse = (response: Record<string, unknown>) => {
  const extracted = extractGraphQLData(response) as Record<string, unknown>;
  // Case 1: Standard Envelope (e.g., list queries with pagination)
  if (extracted?.data !== undefined) {
    return {
      status: extracted?.status ?? -1,
      msg: extracted?.msg ?? "",
      currentPage: extracted?.currentPage ?? 1,
      pageSize: extracted?.pageSize ?? 10,
      totalFiltered: extracted?.totalFiltered ?? 0,
      totalRecords: extracted?.totalRecords ?? 0,
      totalPage: extracted?.totalPage ?? 1,
      data: extracted?.data ?? [],
      desc: extracted?.desc ?? "",
    };
  }
  // Case 2: Unwrapped GraphQL result (e.g., mutations like CreateCase)
  // If this was a GraphQL response (starts with .data), return the unwrapped content
  if (response?.data !== undefined) {
    return extracted;
  }
  // Case 3: REST fallback (already normalized or direct response)
  return response;
};

export const normalizeMutationInput = (v: string) => {
  if (v === "true") {
    return true;
  }
  if (v === "false") {
    return false;
  }
  return v;
};

export const normalizeQueryParams = (k: string, v: string) => {
  if (v === "true") {
    return true;
  }
  if (v === "false") {
    return false;
  }
  // number (int / float)
  if (NUMBER_FIELDS.includes(k)) {
    return Number(v);
  }
  // if (!isNaN(Number(v))) {
  //   return Number(v);
  // }
  return v;
};

export const replaceFilesWithNull = (obj: unknown): unknown => {
  if (isFile(obj) || isBlob(obj)) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceFilesWithNull);
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceFilesWithNull(v)])
    );
  }
  return obj;
};

export const shouldUseGraphQL = (params?: { useGql?: boolean }) => {
  return params?.useGql === true;
};

export const unwrapGql = (path: string[]) => (response: Record<string, unknown>) => {
  return path.reduce((acc: unknown, key) => (acc as Record<string, unknown>)?.[key], response);
};
