// The Assignment Rules section: assignment mode per case sub-type, routing criteria,
// AND/OR combine toggle, Workload Allocation and the advanced options. Purely
// presentational.
//
// Form state and Save live in the page shell (`OrganizationSettingsManagement`),
// because the backend stores this half, the map half and the `assignmentMode[]` array
// in ONE JSON document and the page saves them together.
//
// The org-wide Automatic/Manual toggle is GONE (2026-11-19 contract): auto/manual is
// decided per case sub-type by `AssignmentModeTable` - docs/ORG-SETTINGS-Assignment-Mode-Survey.md.
//
// Configuration only - selecting a routing or allocation method here does not change
// how any real case is assigned; no engine consumes these values yet.
import type {
  AssignmentModeEntry,
  OrgAssignmentRuleSettings,
} from "@/core/types/organization";
import { AdvancedAssignmentSettings } from "./AdvancedAssignmentSettings";
import { AssignmentModeTable } from "./AssignmentModeTable";
import { SmartRoutingSettings } from "./SmartRoutingSettings";
import { WorkloadAllocationSettings } from "./WorkloadAllocationSettings";

export interface AssignmentRulesSectionProps {
  value: OrgAssignmentRuleSettings;
  /** The document-level `assignmentMode[]` - a sibling of this section, not a field in it. */
  assignmentMode: AssignmentModeEntry[];
  onChange: (patch: Partial<OrgAssignmentRuleSettings>) => void;
  onAssignmentModeChange: (entries: AssignmentModeEntry[]) => void;
  /** Validation errors keyed by field (`routingModes`, `assignmentMode`), from the shell. */
  errors?: Record<string, string>;
}

export function AssignmentRulesSection({
  value,
  assignmentMode,
  onChange,
  onAssignmentModeChange,
  errors = {},
}: AssignmentRulesSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <AssignmentModeTable
        entries={assignmentMode}
        onChange={onAssignmentModeChange}
        errorKey={errors["assignmentMode"]}
      />
      <SmartRoutingSettings
        routingModes={value.routingModes}
        errorKey={errors["routingModes"]}
        onRoutingModesChange={(routingModes) =>
          onChange({ routingModes: { ...value.routingModes, ...routingModes } })
        }
      />
      <WorkloadAllocationSettings
        value={value.allocationMethod}
        onChange={(allocationMethod) => onChange({ allocationMethod })}
      />
      <AdvancedAssignmentSettings
        options={value.advancedOptions}
        onChange={(advancedOptions) =>
          onChange({ advancedOptions: { ...value.advancedOptions, ...advancedOptions } })
        }
      />
    </div>
  );
}
