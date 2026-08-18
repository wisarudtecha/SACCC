// src/core/components/custom-dashboard/layoutOwnership.ts
import { getStoredProfile } from "@/core/components/custom-dashboard/sources/profile";
import type { DashboardLayoutSummary } from "@/core/types/dashboardLayout";
import type { User } from "@/core/types/auth";

/**
 * Whether the current user may edit a layout.
 *
 * Only *shared* layouts can belong to someone else, so this is the only case that can be
 * read-only. Two caveats, both unverified against the backend:
 *
 * 1. We don't know whether `createdBy` holds a username or an id, so both are compared.
 * 2. We fail OPEN — when `createdBy` is blank, or we don't know who the user is, the layout is
 *    treated as editable. Locking someone out of their own layout on missing data is the worse
 *    failure, and the server is the real authority on authorization regardless. Confirm the
 *    actual rule before relying on this as a security boundary; it is a UI affordance, not one.
 */
export const canManageLayout = (
  layout: DashboardLayoutSummary | undefined,
  user: User | null | undefined
): boolean => {
  if (!layout || !layout.isShared) {
    return true;
  }

  const createdBy = layout.createdBy?.trim();
  if (!createdBy) {
    return true;
  }

  const profile = getStoredProfile();
  const identities = [user?.username, user?.id, profile.username]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (identities.length === 0) {
    return true;
  }

  return identities.includes(createdBy);
};
