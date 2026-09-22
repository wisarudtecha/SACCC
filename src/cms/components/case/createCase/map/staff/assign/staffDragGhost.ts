// The icon that follows the pointer while an officer is being dragged.
//
// Imperative DOM rather than a React component on purpose: it moves on every
// pointer event, and routing that through state would re-render a 700-line map
// component per mouse move. The real marker stays where it is (the officer has
// not moved - they are only being offered to the case), so this is a copy that
// is thrown away when the drag ends.
//
// Provider-agnostic: it only needs the map's container element, so the MapTiler
// and Longdo adapters reuse it.
export interface StaffDragGhost {
  /** Container-relative pixel position of the pointer. */
  move: (x: number, y: number) => void;
  /** True while the pointer is over the case pin, i.e. a drop would assign. */
  setOverPin: (isOverPin: boolean) => void;
  destroy: () => void;
}

const GHOST_SIZE_PX = 28;
const GHOST_Z_INDEX = "30";
const OVER_PIN_RING = "0 0 0 4px rgba(59, 130, 246, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35)";
const IDLE_RING = "0 2px 8px rgba(0, 0, 0, 0.35)";

export function createStaffDragGhost(
  container: HTMLElement,
  rgb: readonly [number, number, number]
): StaffDragGhost {
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: `${GHOST_SIZE_PX}px`,
    height: `${GHOST_SIZE_PX}px`,
    marginLeft: `${-GHOST_SIZE_PX / 2}px`,
    marginTop: `${-GHOST_SIZE_PX / 2}px`,
    borderRadius: "9999px",
    background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    border: "2px solid #ffffff",
    boxShadow: IDLE_RING,
    opacity: "0.9",
    // Never the target of the pointer it is following - the map keeps receiving
    // the drag events underneath it.
    pointerEvents: "none",
    zIndex: GHOST_Z_INDEX,
    transition: "box-shadow 120ms ease-out",
    // Hidden until the first move so it does not flash at the top-left corner.
    visibility: "hidden"
  } satisfies Partial<CSSStyleDeclaration>);
  container.appendChild(ghost);

  return {
    move: (x, y) => {
      ghost.style.transform = `translate(${x}px, ${y}px)`;
      ghost.style.visibility = "visible";
    },
    setOverPin: (isOverPin) => {
      ghost.style.boxShadow = isOverPin ? OVER_PIN_RING : IDLE_RING;
    },
    destroy: () => {
      ghost.remove();
    }
  };
}
