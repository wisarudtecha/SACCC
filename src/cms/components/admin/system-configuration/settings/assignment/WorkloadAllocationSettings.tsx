// "Workload & Resource Allocation" subsection - single-select allocation method,
// two options. Configuration only; no engine consumes the choice.
import { ALLOCATION_METHODS, type AllocationMethod } from "@/core/types/organization";
import { MethodPicker, type MethodOption } from "./MethodPicker";

const ALLOCATION_OPTIONS: ReadonlyArray<MethodOption<AllocationMethod>> =
  ALLOCATION_METHODS.map((method) => ({
    value: method,
    labelKey: `settings.assignment.allocation.${method}.label`,
    descKey: `settings.assignment.allocation.${method}.desc`,
  }));

interface WorkloadAllocationSettingsProps {
  value: AllocationMethod;
  onChange: (value: AllocationMethod) => void;
}

export function WorkloadAllocationSettings({
  value,
  onChange,
}: WorkloadAllocationSettingsProps) {
  return (
    <MethodPicker
      titleKey="settings.assignment.group.workload_allocation"
      labelKey="settings.assignment.field.allocation_method.label"
      helpKey="settings.assignment.field.allocation_method.help"
      value={value}
      onChange={onChange}
      options={ALLOCATION_OPTIONS}
    />
  );
}
