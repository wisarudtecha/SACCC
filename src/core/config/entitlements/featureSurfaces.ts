// Where every entitlement feature is actually enforced.
//
// WHY THIS FILE EXISTS. The GIS leak this table was written for was not a bug in a
// condition - it was a MISSING question. The gate had been placed on the component that
// draws a map (`AddressMap`), so every GIS capability that renders without a map
// (routing/ETA-TTL in the assignment picker, the dashboard heatmap and choropleth) was
// silently ungated. Nothing failed: no type error, no test, no console message. The next
// paid feature can fail the same way unless "which surfaces answer to this feature?" is a
// question the codebase can answer.
//
// So: one entry per key in `FEATURE_CATALOG`. Either it names the files that gate the
// feature, or it says in words why there is no UI surface yet. `featureSurfaces.test.ts`
// asserts both properties - including that every file listed here still exists - so a
// new catalogue entry cannot ship without answering, and these paths cannot rot.
//
// Keep `surfaces` to the files that DECIDE visibility, not to every file that renders
// gated content: the point is to find the gate, not to rebuild the import graph.
import type { EntitlementFeature } from "@/core/types/entitlement";

export interface FeatureSurface {
  /** Repo-relative path of a file that enforces (or reports) this feature. */
  path: string;
  /** What in that file does the enforcing. */
  note: string;
}

export interface FeatureSurfaceEntry {
  surfaces: FeatureSurface[];
  /** Set instead of `surfaces` when the feature has no UI to gate yet. */
  noUiSurface?: string;
}

export const FEATURE_SURFACES: Record<EntitlementFeature, FeatureSurfaceEntry> = {
  "entitlement.core": {
    surfaces: [],
    noUiSurface:
      "Platform baseline: the whole application is the surface, and losing it means " +
      "losing the account rather than a screen. Gating login on it would be circular.",
  },

  "entitlement.agent.desktop": {
    surfaces: [],
    noUiSurface:
      "No agent-desktop workspace UI exists in this repository yet; the cc module is a " +
      "dashboard/workspace shell with the incoming-call popup only.",
  },

  "entitlement.kb": {
    surfaces: [
      {
        path: "src/App.tsx",
        note: "Route gate on /kms/* (EntitlementGate fullPage).",
      },
      {
        path: "src/core/layout/SuperSidebar.tsx",
        note: "Lock badge + hide on the knowledge menu items.",
      },
      {
        path: "src/core/layout/SuperTopbar.tsx",
        note: "feature: \"entitlement.kb\" on the knowledge group in the More dropdown.",
      },
    ],
  },

  "entitlement.kb.semantic_search": {
    surfaces: [],
    noUiSurface:
      "Its only consumer (the kms semantic-search toggle) was removed in 8cf3d4e " +
      "because the backend endpoint does not exist. The catalogue entry is kept for the " +
      "pricing model; add a surface here when the feature ships.",
  },

  "entitlement.chat": {
    surfaces: [
      {
        path: "src/cc/App.tsx",
        note: "Route gates on the live-chat placeholder pages.",
      },
      {
        path: "src/core/layout/SuperSidebar.tsx",
        note: "Lock badge + hide on the workspace chat items.",
      },
    ],
  },

  "entitlement.bot": {
    surfaces: [],
    noUiSurface: "No bot builder/console UI in this repository yet.",
  },

  "entitlement.gis": {
    surfaces: [
      {
        path: "src/cms/components/case/createCase/map/AddressMap.tsx",
        note: "EntitlementGate at the map provider switch (every case-form/admin map).",
      },
      {
        path: "src/cms/components/assignOfficer/officerColumns.ts",
        note: "The picker's ETA/TTL column needs hasGis AND applyToAssignmentPicker.",
      },
      {
        path: "src/cms/components/assignOfficer/workload/useOfficerRouteSolves.ts",
        note: "`enabled` gate: an unentitled row can never call the routing provider.",
      },
      {
        path: "src/cms/components/dashboard/map/CaseAreaChoroplethMap.tsx",
        note: "EntitlementGate at the choropleth provider switch (also stops the boundary fetch).",
      },
      {
        path: "src/cms/components/dashboard/map/heatmap/DispatchHeatmap.tsx",
        note: "EntitlementGate at the heatmap provider switch.",
      },
      {
        path: "src/cms/components/dashboard/DispatchDashboard.tsx",
        note: "Removes the heatmap section (and its 500-case sample) when locked.",
      },
      {
        path: "src/core/components/custom-dashboard/widgets/availability.ts",
        note: "Widgets that declare a feature are hidden/not rendered when it is locked.",
      },
      {
        path: "src/cms/components/admin/system-configuration/settings/map/MapSettingsSection.tsx",
        note: "EntitlementGate around the org Map Settings form.",
      },
      {
        path: "src/cms/App.tsx",
        note: "Route gate on /dashboard/case-summary-by-area.",
      },
      {
        path: "src/cms/layout/AppSidebar.tsx",
        note: "feature: \"entitlement.gis\" on the case-summary-by-area entry.",
      },
    ],
  },

  "entitlement.cad": {
    surfaces: [],
    noUiSurface:
      "No CAD (computer-aided dispatch) surface yet: assignment is manual " +
      "(workload ranking), not automated recommendation.",
  },

  "entitlement.channel.social": {
    surfaces: [],
    noUiSurface: "No social-channel inbox UI in this repository yet.",
  },

  "entitlement.audit": {
    surfaces: [
      {
        path: "src/App.tsx",
        note: "ProtectedRoute requiredFeature on /auditlog.",
      },
    ],
  },

  "entitlement.rbac.advanced": {
    surfaces: [],
    noUiSurface:
      "Role/user-group administration is RBAC-permission gated today; the advanced " +
      "policy UI (conditional/attribute rules) does not exist yet.",
  },
};
