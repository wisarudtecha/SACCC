// "Smart Routing & Assignment Rules" subsection - single-select routing method,
// six options including the "Manual" baseline. Configuration only; no engine
// consumes the choice.
//
// NOTE: unrelated to StaffSmartRoutingSection.tsx / the map staff card's "Smart
// Routing Engine" (an ETA / drive-route calculator). All copy here lives under
// the settings.assignment.* i18n prefix to keep the two apart.
import { ROUTING_METHODS, type RoutingMethod } from "@/core/types/organization";
import { MethodPicker, type MethodOption } from "./MethodPicker";

const ROUTING_OPTIONS: ReadonlyArray<MethodOption<RoutingMethod>> =
  ROUTING_METHODS.map((method) => ({
    value: method,
    labelKey: `settings.assignment.routing.${method}.label`,
    descKey: `settings.assignment.routing.${method}.desc`,
  }));

interface SmartRoutingSettingsProps {
  value: RoutingMethod;
  onChange: (value: RoutingMethod) => void;
}

export function SmartRoutingSettings({ value, onChange }: SmartRoutingSettingsProps) {
  return (
    <MethodPicker
      titleKey="settings.assignment.group.smart_routing"
      labelKey="settings.assignment.field.routing_method.label"
      helpKey="settings.assignment.field.routing_method.help"
      value={value}
      onChange={onChange}
      options={ROUTING_OPTIONS}
    />
  );
}
