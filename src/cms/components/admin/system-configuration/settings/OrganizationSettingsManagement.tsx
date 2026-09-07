// Organization/System Settings shell - an extensible section registry.
//
// Adding a future settings domain is a one-line change: append an entry to
// SETTINGS_SECTIONS with its i18n label key, icon, and component. No routing,
// permission, or shell change is required. The first version shipped one section
// (Map Settings).
import { useState, type ComponentType } from "react";
import { Map as MapIcon, Waypoints, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { MapSettingsSection } from "./map/MapSettingsSection";
import { AssignmentRulesSection } from "./assignment/AssignmentRulesSection";

interface SettingsSectionDef {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  Component: ComponentType;
}

const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  { id: "map", labelKey: "settings.section.map", icon: MapIcon, Component: MapSettingsSection },
  {
    id: "assignment-rules",
    labelKey: "settings.section.assignment_rules",
    icon: Waypoints,
    Component: AssignmentRulesSection,
  },
];

export default function OrganizationSettingsManagement() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0]?.id ?? "");

  const active =
    SETTINGS_SECTIONS.find((section) => section.id === activeId) ?? SETTINGS_SECTIONS[0];
  const ActiveComponent = active?.Component;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active?.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(section.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1">{ActiveComponent && <ActiveComponent />}</div>
    </div>
  );
}
