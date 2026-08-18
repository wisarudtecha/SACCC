// src/core/components/custom-dashboard/sources/profile.ts
import type { DashboardProfile } from "@/core/components/custom-dashboard/sources/types";

/**
 * The dashboard subscribe frame is scoped by org and user. The profile is written to
 * localStorage at login; ServiceDashboard reads it the same way.
 */
export const getStoredProfile = (): DashboardProfile => {
  try {
    const raw = localStorage.getItem("profile");
    if (!raw) {
      return { orgId: "", username: "" };
    }
    const parsed = JSON.parse(raw) as Partial<DashboardProfile>;
    return {
      orgId: parsed.orgId ?? "",
      username: parsed.username ?? "",
    };
  }
  catch (error) {
    console.error("🚀 ~ getStoredProfile ~ Failed to parse profile:", error);
    return { orgId: "", username: "" };
  }
};
