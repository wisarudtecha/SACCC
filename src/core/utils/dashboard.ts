// src/core/utils/dashboard.ts
import type { JSONValue, JSONArray, JSONObject } from "@/core/types/dashboard.ts";

/**
 * Recursively search for a key in nested objects/arrays.
 * @param obj - The object or array to search
 * @param targetKey - The key to look for
 * @returns The value if found, otherwise undefined
 */
export const findKeyDeep = (obj: JSONObject | JSONArray, targetKey: string): JSONValue | undefined => {
  if (Array.isArray(obj)) {
    // Loop through array items
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        const result = findKeyDeep(item, targetKey);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
  else {
    // Loop through object keys
    for (const key in obj) {
      if (key === targetKey) {
        return obj[key];
      }
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        const result = findKeyDeep(value, targetKey);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
}

/**
 * Find key inside objects of an array, return index and val
 * @param arr - The array to search
 * @param searchKey - The key that want to find (e.g. "g1_en")
 * @returns An object containing the index and val, or undefined if not found
 */
export const findKeyInArray = (arr: JSONArray, searchKey: string): { index: number; val: JSONValue } | undefined => {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === "object" && item !== null) {
      if (searchKey in item) {
        return { index: i, val: (item as JSONObject)["val"] };
      }
    }
  }
  return undefined; // not found
}
