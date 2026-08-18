// A map toolbar control group that collapses to a single icon on small maps.
//
// The toolbar has to serve two very different sizes: the expanded map has room
// for labelled buttons, while the inline maps are 220-320px, where the same
// controls cover the map they are meant to control. So on a small map a group
// shows only its icon and reveals its buttons on interaction.
//
// Opens on hover, on focus-within, OR on click:
//
//   - hover is the obvious affordance with a mouse;
//   - focus-within is what makes it usable from the keyboard;
//   - click PINS it open, and that is not redundant - touch devices have no
//     hover at all, so without the pin the group could never be opened on a
//     tablet.
//
// The children are hidden with CSS rather than unmounted, deliberately. They
// stay in the DOM and stay focusable, so tabbing into the group fires
// focus-within and opens it - the standard disclosure-on-focus behaviour.
// Unmounting them would make them unreachable except by first clicking the
// trigger, which is worse for keyboard users than the slight cost of rendering
// hidden nodes.
import {
  memo,
  useCallback,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode
} from "react";
import {
  MAP_CONTROL_SEGMENT_CLASS,
  MAP_CONTROL_SHELL_CLASS,
  mapControlRevealClass
} from "./mapControlStyles";

interface MapControlGroupProps {
  /** Shown alone when collapsed. */
  icon: ReactNode;
  /** Accessible name for the disclosure trigger. */
  label: string;
  /**
   * False on the expanded map, where there is room for everything and a trigger
   * would be pure friction. The group then renders permanently open with no
   * trigger at all.
   */
  collapsible?: boolean;
  /** Highlights the trigger when something inside the group is switched on. */
  isActive?: boolean;
  children: ReactNode;
  className?: string;
}

function MapControlGroupBase({
  icon,
  label,
  collapsible = true,
  isActive = false,
  children,
  className = ""
}: MapControlGroupProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isOpen = !collapsible || isPinned || isHovered || isFocused;

  // React's onBlur has focusout semantics (it bubbles), so this fires when focus
  // moves anywhere inside the group too - hence the containment check, without
  // which tabbing from the trigger to the first button would close the group.
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsFocused(false);
  }, []);

  // Escape only unpins; hover and focus close themselves, so forcing those shut
  // would just fight the pointer.
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setIsPinned(false);
    }
  }, []);

  if (!collapsible) {
    return <div className={`${MAP_CONTROL_SHELL_CLASS} ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`${MAP_CONTROL_SHELL_CLASS} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => setIsPinned((pinned) => !pinned)}
        title={label}
        aria-label={label}
        aria-expanded={isOpen}
        className={`${MAP_CONTROL_SEGMENT_CLASS} ${
          isActive
            ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
            : "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
        }`}
      >
        {icon}
      </button>

      <div className={mapControlRevealClass(isOpen)}>
        <span aria-hidden className="w-px shrink-0 bg-gray-200 dark:bg-gray-700" />
        {children}
      </div>
    </div>
  );
}

export const MapControlGroup = memo(MapControlGroupBase);
MapControlGroup.displayName = "MapControlGroup";

export default MapControlGroup;
