// The expand / collapse button every map panel carries beside its close button.
//
// The panels dock over the map together (Case Panel, staff cards, boundary
// picker, Place / Device popups), and with several open they crowd it. Each one
// collapses to its header row so the dispatcher can shrink what they are not
// reading instead of closing it.
//
// Only the button lives here. What "collapsed" hides differs per panel - a footer,
// a fixed action bar, a details block - so each panel owns its own state and its
// own body, and this stays the one place the control looks and reads the same.
import { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

interface PanelCollapseToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  /** Tighter padding and icon for the small popups; the cards use the default. */
  isCompact?: boolean;
}

function PanelCollapseToggleBase({ isCollapsed, onToggle, isCompact = false }: PanelCollapseToggleProps) {
  const { t } = useTranslation();
  const label = isCollapsed
    ? t("case.display.map_panel_expand")
    : t("case.display.map_panel_collapse");
  const Icon = isCollapsed ? ChevronDown : ChevronUp;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-expanded={!isCollapsed}
      className={`shrink-0 rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${
        isCompact ? "p-0.5" : "p-1"
      }`}
    >
      <Icon className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}

export const PanelCollapseToggle = memo(PanelCollapseToggleBase);
PanelCollapseToggle.displayName = "PanelCollapseToggle";

export default PanelCollapseToggle;
