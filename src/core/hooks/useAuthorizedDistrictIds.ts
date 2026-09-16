// The District ids the logged-in dispatcher is authorized to work in.
//
// `distIdLists` is not part of the typed `User` model - it is an extra field
// the org's profile payload carries for area-of-responsibility scoping, so it
// is read here rather than added to auth.ts's shared User shape. Goes through
// TokenManager.getStoredUser() (the app's one profile-read path) instead of a
// second raw `localStorage.getItem("profile")` call.
import { useMemo } from "react";
import { TokenManager } from "@/core/utils/tokenManager";
import type { User } from "@/core/types/auth";

interface ProfileWithDistrictIds extends Partial<User> {
  distIdLists?: readonly string[] | string | null;
}

function normalizeDistrictIds(raw: ProfileWithDistrictIds["distIdLists"]): readonly string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((id) => id.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Empty means "no restriction on record" - callers treat that as unrestricted
 * rather than "authorized for nothing", since most profiles have no area
 * assignment at all.
 */
export function useAuthorizedDistrictIds(): readonly string[] {
  return useMemo(() => {
    const profile = TokenManager.getStoredUser() as ProfileWithDistrictIds | null;
    return normalizeDistrictIds(profile?.distIdLists);
  }, []);
}
