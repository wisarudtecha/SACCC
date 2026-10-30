// "Smart Routing & Assignment Rules" subsection - Automatic/Manual toggle plus
// individual routing-criteria selections (visible in both modes). When the Case
// Type criterion is selected, its sub-types are fetched from localStorage (with
// API fallback) and presented as a flat multi-select list.
// Configuration only; no engine consumes the choice.
//
// NOTE: unrelated to StaffSmartRoutingSection.tsx / the map staff card's "Smart
// Routing Engine" (an ETA / drive-route calculator). All copy here lives under
// the settings.assignment.* i18n prefix to keep the two apart.
import { useEffect, useMemo, useRef } from "react";
import Switch from "@/core/components/form/switch/Switch";
import Checkbox from "@/core/components/form/input/Checkbox";
import MultiSelect from "@/core/components/form/MultiSelect";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { RoutingModes } from "@/core/types/organization";
import { useGetCaseTypesSubTypesQuery } from "@/cms/store/api/serviceApi";
import type { CaseTypeSubType } from "@/cms/types/case";
import { FieldRow, SubsectionCard } from "../map/settingsControls";

interface SmartRoutingSettingsProps {
  mode: "automatic" | "manual";
  routingModes: RoutingModes;
  onModeChange: (mode: "automatic" | "manual") => void;
  onRoutingModesChange: (modes: Partial<RoutingModes>) => void;
}

const MODE_OPTIONS = [
  { key: "skillBased", labelKey: "settings.assignment.routing.skill_based.label", descKey: "settings.assignment.routing.skill_based.desc" },
  { key: "locationBased", labelKey: "settings.assignment.routing.location_based.label", descKey: "settings.assignment.routing.location_based.desc" },
  { key: "department", labelKey: "settings.assignment.routing.department.label", descKey: "settings.assignment.routing.department.desc" },
  { key: "availability", labelKey: "settings.assignment.routing.availability.label", descKey: "settings.assignment.routing.availability.desc" },
  { key: "caseType", labelKey: "settings.assignment.routing.case_type.label", descKey: "settings.assignment.routing.case_type.desc" },
] as const;

function readCachedCaseTypeSubTypes(): CaseTypeSubType[] {
  try {
    const raw = localStorage.getItem("caseTypeSubType");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatCaseTypeSubTypeLabel(item: CaseTypeSubType, language: string): string {
  const typeName = language === "th" ? item.th : item.en;
  const subTypeName = language === "th" ? item.subTypeTh : item.subTypeEn;
  return `${item.sTypeCode || ""}-${typeName || ""}-${subTypeName || ""}`;
}

export function SmartRoutingSettings({
  mode,
  routingModes,
  onModeChange,
  onRoutingModesChange,
}: SmartRoutingSettingsProps) {
  const { t, language } = useTranslation();
  const initializedRef = useRef(false);

  const selectedCount = useMemo(
    () => MODE_OPTIONS.filter((opt) => routingModes[opt.key]).length,
    [routingModes]
  );

  const showCombineToggle = selectedCount >= 2;
  const showCaseTypeSubTypes = routingModes.caseType;

  // Fetch case types with sub-types from API (used as fallback when localStorage is empty)
  const { data: apiCaseTypeSubTypes } = useGetCaseTypesSubTypesQuery(null, {
    skip: !showCaseTypeSubTypes,
  });

  // Build the flat list of sub-type options
  const caseTypeSubTypeOptions = useMemo(() => {
    const cached = readCachedCaseTypeSubTypes();
    const list: CaseTypeSubType[] =
      cached.length > 0
        ? cached
        : (apiCaseTypeSubTypes?.data as CaseTypeSubType[]) ?? [];

    return list.map((item) => ({
      value: item.sTypeId,
      text: formatCaseTypeSubTypeLabel(item, language),
    }));
  }, [apiCaseTypeSubTypes, language]);

  // When Case Type is first checked, pre-populate from localStorage once.
  // A ref guards against re-populating after the user clicks Deselect All.
  useEffect(() => {
    if (showCaseTypeSubTypes && !initializedRef.current) {
      initializedRef.current = true;
      const cached = readCachedCaseTypeSubTypes();
      if (cached.length > 0 && routingModes.caseTypeSubTypes.length === 0) {
        onRoutingModesChange({
          caseTypeSubTypes: cached.map((item) => item.sTypeId),
        });
      }
    }
    if (!showCaseTypeSubTypes) {
      initializedRef.current = false;
      if (routingModes.caseTypeSubTypes.length > 0) {
        onRoutingModesChange({ caseTypeSubTypes: [] });
      }
    }
  }, [showCaseTypeSubTypes, routingModes.caseTypeSubTypes.length, onRoutingModesChange]);

  const handleSelectAll = () => {
    onRoutingModesChange({
      caseTypeSubTypes: caseTypeSubTypeOptions.map((opt) => opt.value),
    });
  };

  const handleDeselectAll = () => {
    onRoutingModesChange({ caseTypeSubTypes: [] });
  };

  const manualActiveClass = "text-gray-800 dark:text-white";
  const manualInactiveClass = "text-gray-400 dark:text-gray-500";
  const autoActiveClass = "text-gray-800 dark:text-white";
  const autoInactiveClass = "text-gray-400 dark:text-gray-500";

  return (
    <SubsectionCard titleKey="settings.assignment.group.smart_routing">
      {/* Main Automatic / Manual toggle */}
      <FieldRow
        labelKey="settings.assignment.field.mode.label"
        helpKey="settings.assignment.field.mode.help"
      >
        <div className="flex items-center gap-3">
          <span className={"text-sm font-medium " + (mode === "manual" ? manualActiveClass : manualInactiveClass)}>
            {t("settings.assignment.field.mode.manual")}
          </span>
          <Switch
            label=""
            checked={mode === "automatic"}
            onChange={(checked) => onModeChange(checked ? "automatic" : "manual")}
          />
          <span className={"text-sm font-medium " + (mode === "automatic" ? autoActiveClass : autoInactiveClass)}>
            {t("settings.assignment.field.mode.automatic")}
          </span>
        </div>
      </FieldRow>

      {/* Routing criteria - visible in both Manual and Automatic modes */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.assignment.field.routing_criteria.label")}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.assignment.field.routing_criteria.help")}
        </p>

        <div className="mt-1 flex flex-col gap-2.5">
          {MODE_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-start gap-3">
              <Checkbox
                checked={routingModes[option.key]}
                onChange={(checked) =>
                  onRoutingModesChange({ [option.key]: checked })
                }
                label={t(option.labelKey)}
              />
            </div>
          ))}
        </div>

        {/* Case type sub-types - flat multi-select at the same level */}
        {showCaseTypeSubTypes && (
          <div className="mt-2 flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.03]">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {t("settings.assignment.field.case_type_sub_types.select_all")}
              </button>
              <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {t("settings.assignment.field.case_type_sub_types.deselect_all")}
              </button>
            </div>
            <MultiSelect
              label=""
              options={caseTypeSubTypeOptions}
              selected={routingModes.caseTypeSubTypes}
              onChange={(selected) =>
                onRoutingModesChange({ caseTypeSubTypes: selected })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("settings.assignment.field.case_type_sub_types.help")}
            </p>
          </div>
        )}

        {selectedCount === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t("settings.assignment.validation.no_criteria_selected")}
          </p>
        )}

        {/* AND / OR combine toggle */}
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
                onChange={(checked) =>
                  onRoutingModesChange({ combineWithAnd: checked })
                }
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
