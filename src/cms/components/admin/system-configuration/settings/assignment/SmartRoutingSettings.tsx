// "Smart Routing & Assignment Rules" subsection - the routing criteria checkboxes
// and the AND/OR modifier.
// Configuration only; no engine consumes the choice.
//
// 2026-11-19 contract change (docs/ORG-SETTINGS-Assignment-Mode-Survey.md):
//   * the org-wide Automatic/Manual toggle was REMOVED from the stored document -
//     auto/manual is decided per case sub-type by `assignmentMode[]`, so there is
//     no org-level field left for a switch to write to;
//   * the Case Type sub-type multi-select went with the `caseType` criterion;
//   * `unitProperty` was added.
// The retired criteria are recorded on `RoutingModes` so they can be restored from
// that document rather than re-invented.
//
// NOTE: unrelated to StaffSmartRoutingSection.tsx / the map staff card's "Smart
// Routing Engine" (an ETA / drive-route calculator). All copy here lives under
// the settings.assignment.* i18n prefix to keep the two apart.
import { useMemo } from "react";
import Switch from "@/core/components/form/switch/Switch";
import Checkbox from "@/core/components/form/input/Checkbox";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { RoutingModes } from "@/core/types/organization";
import { SubsectionCard } from "../map/settingsControls";

interface SmartRoutingSettingsProps {
  routingModes: RoutingModes;
  onRoutingModesChange: (modes: Partial<RoutingModes>) => void;
  /**
   * The shell's validation message for the criteria list, when Save was blocked.
   * Nothing produces one today (`validateOrgAssignmentRules` is deliberately empty
   * until `assignmentMode[]` lands), but the hook stays so the red treatment is
   * already wired when it does.
   */
  errorKey?: string;
}

const CRITERIA_OPTIONS = [
  { key: "skillBased", labelKey: "settings.assignment.routing.skill_based.label", descKey: "settings.assignment.routing.skill_based.desc" },
  { key: "availability", labelKey: "settings.assignment.routing.availability.label", descKey: "settings.assignment.routing.availability.desc" },
  { key: "areaBased", labelKey: "settings.assignment.routing.area_based.label", descKey: "settings.assignment.routing.area_based.desc" },
  // Added 2026-11-19: matches an officer by the properties configured on the unit
  // (`GET /mdm/units/properties/{unitId}`). Boolean by decision U7 - which property
  // and value to match on is the backend's business.
  { key: "unitProperty", labelKey: "settings.assignment.routing.unit_property.label", descKey: "settings.assignment.routing.unit_property.desc" },
] as const;

export function SmartRoutingSettings({
  routingModes,
  onRoutingModesChange,
  errorKey,
}: SmartRoutingSettingsProps) {
  const { t } = useTranslation();

  const selectedCount = useMemo(
    () => CRITERIA_OPTIONS.filter((option) => routingModes[option.key]).length,
    [routingModes]
  );

  const showCombineToggle = selectedCount >= 2;

  return (
    <SubsectionCard titleKey="settings.assignment.group.smart_routing">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.assignment.field.routing_criteria.label")}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.assignment.field.routing_criteria.help")}
        </p>
        {/* The copy promises automatic routing and no engine consumes these values
            yet, so the control says so rather than letting an admin believe
            automation is live (decision D18, now anchored on the criteria because
            the org-wide mode switch is gone). */}
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t("settings.assignment.field.mode.engine_unavailable")}
        </p>

        <div className="mt-1 flex flex-col gap-2.5">
          {CRITERIA_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-start gap-3">
              <Checkbox
                checked={routingModes[option.key]}
                onChange={(checked) => onRoutingModesChange({ [option.key]: checked })}
                label={t(option.labelKey)}
              />
            </div>
          ))}
        </div>

        {errorKey && (
          <p className="text-xs text-red-500 dark:text-red-400">{t(errorKey)}</p>
        )}

        {/* AND / OR combine toggle - only meaningful with two or more criteria. */}
        {showCombineToggle && (
          <div className="mt-2 flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/[0.03]">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t("settings.assignment.field.combine.label")}
            </span>
            <div className="flex items-center gap-2">
              <span className={"text-xs font-medium " + (!routingModes.combineWithAnd ? "text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                {t("settings.assignment.field.combine.or")}
              </span>
              <Switch
                label=""
                checked={routingModes.combineWithAnd}
                onChange={(checked) => onRoutingModesChange({ combineWithAnd: checked })}
              />
              <span className={"text-xs font-medium " + (routingModes.combineWithAnd ? "text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                {t("settings.assignment.field.combine.and")}
              </span>
            </div>
            <p className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              {t("settings.assignment.field.combine.help")}
            </p>
          </div>
        )}
      </div>
    </SubsectionCard>
  );
}
