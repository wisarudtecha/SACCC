// One officer-drag from "the ghost appears" to "dropped, cancelled or abandoned".
//
// Every provider decides for itself when a drag STARTS and where its pointer
// coordinates come from (ArcGIS drag events, MapLibre pointer events, ...), but
// what happens once it is going is the same everywhere, so it lives here once:
//
//   - a ghost copy of the officer follows the pointer and lights up over the pin;
//   - Escape abandons the drag;
//   - releasing over the pin reports the drop, releasing anywhere else does not.
//
// Nothing real moves: the officer and the case pin stay where they are, and no
// location is ever reported, so a drag cannot change where the case is.
import { createStaffDragGhost } from "./staffDragGhost";

export interface StaffDragSession {
  /** Container-relative pixel position of the pointer. */
  move: (x: number, y: number) => void;
  /** The pointer was released here. Reports the drop when it is over the pin. */
  end: (x: number, y: number) => void;
  /** Abandon the drag: no drop is reported. Safe to call more than once. */
  cancel: () => void;
  /**
   * False once the drag is over for any reason (ended, cancelled, Escape). The
   * caller can still be mid-gesture then - the pointer may still be down - which
   * is why this is a question to ask rather than a reason to forget the session.
   */
  isActive: () => boolean;
}

interface StartStaffDragSessionOptions {
  /** The map's container; the ghost is positioned inside it. */
  container: HTMLElement;
  rgb: readonly [number, number, number];
  unitId: string;
  /** Is this container-relative point close enough to the pin to assign? */
  isOverPin: (x: number, y: number) => boolean;
  onDrop: (unitId: string) => void;
}

export function startStaffDragSession({
  container,
  rgb,
  unitId,
  isOverPin,
  onDrop
}: StartStaffDragSessionOptions): StaffDragSession {
  const ghost = createStaffDragGhost(container, rgb);
  let isActive = true;
  let isOverPinNow = false;

  const finish = () => {
    if (!isActive) {
      return;
    }
    isActive = false;
    ghost.destroy();
    window.removeEventListener("keydown", handleKeyDown);
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      finish();
    }
  }
  window.addEventListener("keydown", handleKeyDown);

  return {
    move: (x, y) => {
      if (!isActive) {
        return;
      }
      ghost.move(x, y);
      const isOver = isOverPin(x, y);
      if (isOver !== isOverPinNow) {
        isOverPinNow = isOver;
        ghost.setOverPin(isOver);
      }
    },
    end: (x, y) => {
      if (!isActive) {
        return;
      }
      const isDrop = isOverPin(x, y);
      finish();
      if (isDrop) {
        onDrop(unitId);
      }
    },
    cancel: finish,
    isActive: () => isActive
  };
}
