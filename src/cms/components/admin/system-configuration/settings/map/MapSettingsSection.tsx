// The Map Settings section: five field groups, purely presentational.
//
// Form state, validation, dirty tracking and the Save button all live in the page
// shell (`OrganizationSettingsManagement`), because the backend stores the map and
// assignment halves in ONE JSON document and the page saves them together. This
// component renders `value` and reports edits through `onChange`; it owns only what
// is genuinely a view concern of this section (the Staff "Advanced" disclosure).
import { useEffect, useState } from "react";
import { EntitlementGate } from "@/core/components/entitlements/EntitlementGate";
import type { OrgMapSettings } from "@/core/types/organization";
import { AssignmentMapSettings } from "./AssignmentMapSettings";
import { GeneralMapSettings } from "./GeneralMapSettings";
import { IncidentMapSettings } from "./IncidentMapSettings";
import { LayerMapSettings } from "./LayerMapSettings";
import { StaffMapSettings } from "./StaffMapSettings";

/** The editable halves of the record (everything except the client-filled metadata). */
export type MapSettingsSectionKey = keyof Omit<
  OrgMapSettings,
  "orgId" | "updatedAt" | "updatedBy"
>;

export interface MapSettingsSectionProps {
  value: OrgMapSettings;
  /** Validation errors keyed by dotted path (`staff.routing.autoIntervalSeconds`). */
  errors: Record<string, string>;
  /**
   * Unsaved edits exist. Only used to disable the "reload page" escape hatch in the
   * General panel: reloading with unsaved changes would silently discard them.
   */
  isDirty?: boolean;
  onChange: <K extends MapSettingsSectionKey>(
    key: K,
    patch: Partial<OrgMapSettings[K]>
  ) => void;
}

export function MapSettingsSection({
  value,
  errors,
  isDirty = false,
  onChange,
}: MapSettingsSectionProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Validation runs in the shell, so a bad auto interval can be rejected while the
  // Staff disclosure that holds the field is collapsed. Open it, otherwise Save
  // looks like it did nothing.
  const hasStaffError = Object.keys(errors).some((key) => key.startsWith("staff."));
  useEffect(() => {
    if (hasStaffError) {
      setAdvancedOpen(true);
    }
  }, [hasStaffError]);

  return (
    // Map/GIS configuration is part of the CC-GIS add-on: unentitled tenants see the
    // lock panel instead of the form. The shell still holds the loaded document, so a
    // Save from another section writes the stored map values back unchanged.
    <EntitlementGate feature="entitlement.gis">
      <div className="flex flex-col gap-5">
        <GeneralMapSettings
          value={value.general}
          canReload={!isDirty}
          onChange={(patch) => onChange("general", patch)}
        />
        <LayerMapSettings
          value={value.layers}
          onChange={(patch) => onChange("layers", patch)}
        />
        <IncidentMapSettings
          value={value.incident}
          onChange={(patch) => onChange("incident", patch)}
          errors={errors}
        />
        <StaffMapSettings
          value={value.staff}
          onChange={(patch) => onChange("staff", patch)}
          errors={errors}
          advancedOpen={advancedOpen}
          onAdvancedOpenChange={setAdvancedOpen}
        />
        <AssignmentMapSettings
          value={value.assignment}
          onChange={(patch) => onChange("assignment", patch)}
        />
      </div>
    </EntitlementGate>
  );
}
