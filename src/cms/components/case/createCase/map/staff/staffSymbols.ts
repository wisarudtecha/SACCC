// Marker symbols for the staff layer.
//
// The map answers ONE question - "can I dispatch this person right now?" - so it
// uses three operational colours rather than the seven-colour status palette:
//
//   green  ready to take a command
//   red    logged in but engaged (acknowledged, en route, on scene, closed,
//          commanded) - visible, but not a candidate
//   gray   not on duty: marked not-ready, or not logged in at all
//
// This deliberately does NOT track `unitStatusConfig`, which stays the source of
// truth for status BADGES. A badge names the exact status; a marker only has to
// separate "available" from "busy" from "off". The panel's status dot follows
// this same three-colour rule (see getStaffStatusDotClass) so the map and the
// card next to it never disagree, while the status text beside the dot still
// carries the precise status name.
//
// Symbols are plain autocast objects, matching how MARKER_SYMBOL is written in
// ArcgisAddressMap.tsx. No picture markers: `photo` is a remote URL per unit,
// which would mean one request per officer on every render and a CSP surface the
// map does not otherwise need. The avatar belongs in the detail panel.

type Rgba = [number, number, number, number];

/** Unit status: ready for duty. The only status a dispatcher can act on. */
const STATUS_READY = "001";
/** Unit status: logged in but flagged not ready for duty. */
const STATUS_NOT_READY = "000";

const READY_RGB: [number, number, number] = [34, 197, 94];    // green-500
const ENGAGED_RGB: [number, number, number] = [239, 68, 68];  // red-500
const OFF_DUTY_RGB: [number, number, number] = [107, 114, 128]; // gray-500

/**
 * Person silhouette - a circular head over rounded shoulders - authored on a
 * 24x24 box so the bounding box is close to square and `size` scales it
 * predictably. Drawn as a SimpleMarkerSymbol `path` rather than a picture
 * marker: it stays a single filled shape, so the status colour, the muted
 * treatment and the selection outline all keep working on it unchanged.
 */
const STAFF_MARKER_PATH =
  "M12 2.3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4z " +
  "M12 12.3c-4.6 0-8.3 3-8.3 6.7v2.7c0 .6.5 1 1.1 1h14.4c.6 0 1.1-.4 1.1-1v-2.7c0-3.7-3.7-6.7-8.3-6.7z";

// A silhouette needs more pixels than a dot before it reads as a person.
const DEFAULT_SIZE = 18;
// Only a nudge: selection is carried by the halo behind the icon, so the figure
// itself barely changes and never turns into a blob.
const SELECTED_SIZE = 22;
const ACTIVE_ALPHA = 0.95;
const MUTED_ALPHA = 0.45;

/** Selection halo drawn under the marker - see createStaffHaloSymbol. */
const HALO_SIZE = 34;
const HALO_FILL_ALPHA = 0.22;
const HALO_OUTLINE_ALPHA = 0.45;

/**
 * Direction-of-travel chevron, drawn ON the selection halo's ring.
 *
 * A chevron authored pointing UP on a 24x24 box, so `angle` can be set straight
 * from a compass bearing with no offset to remember.
 */
const HEADING_CHEVRON_PATH = "M12 4 L20 20 L12 15.2 L4 20 Z";
const HEADING_SIZE = 11;
/** How far from the officer's feet the chevron sits - the halo's own radius. */
const HEADING_ORBIT_PX = HALO_SIZE / 2;

/** Group circle: base diameter, and how much each extra member adds. */
const GROUP_BASE_SIZE = 26;
const GROUP_SIZE_PER_MEMBER = 1.6;
const GROUP_MAX_SIZE = 40;
const GROUP_FILL_ALPHA = 0.92;
/** How far a selection halo extends past the group circle it sits under. */
const GROUP_HALO_MARGIN = 12;

function getGroupSize(count: number): number {
  return Math.min(GROUP_MAX_SIZE, GROUP_BASE_SIZE + count * GROUP_SIZE_PER_MEMBER);
}

export interface StaffSymbolState {
  isSelected: boolean;
  isStale: boolean;
  isLogin: boolean;
}

export type StaffAvailability = "ready" | "engaged" | "off-duty";

/**
 * The one place that decides what a staff member's colour means.
 *
 * An unrecognised status is treated as off duty rather than available: showing
 * an officer as dispatchable on the strength of a status we don't understand is
 * the failure that actually costs a dispatcher time.
 */
export function getStaffAvailability(statusId: string, isLogin: boolean): StaffAvailability {
  if (!isLogin || statusId === STATUS_NOT_READY) {
    return "off-duty";
  }
  return statusId === STATUS_READY ? "ready" : "engaged";
}

function getAvailabilityRgb(availability: StaffAvailability): [number, number, number] {
  switch (availability) {
    case "ready":
      return READY_RGB;
    case "engaged":
      return ENGAGED_RGB;
    default:
      return OFF_DUTY_RGB;
  }
}

function withAlpha(rgb: [number, number, number], alpha: number): Rgba {
  return [rgb[0], rgb[1], rgb[2], alpha];
}

/**
 * Build the marker symbol for one staff member.
 *
 * A stale or logged-out officer keeps its colour but loses opacity: the
 * dispatcher still sees who and what, while the washed-out marker says "this
 * position may no longer be true". Selection is carried by the halo behind the
 * marker plus a white ring, never by colour, so it cannot mask availability.
 */
export function createStaffSymbol(statusId: string, state: StaffSymbolState) {
  const rgb = getAvailabilityRgb(getStaffAvailability(statusId, state.isLogin));
  const isMuted = state.isStale || !state.isLogin;
  const alpha = isMuted ? MUTED_ALPHA : ACTIVE_ALPHA;
  const size = state.isSelected ? SELECTED_SIZE : DEFAULT_SIZE;

  return {
    type: "simple-marker" as const,
    style: "path" as const,
    path: STAFF_MARKER_PATH,
    color: withAlpha(rgb, alpha),
    size,
    // Lift the figure so it STANDS ON the reported position. Centred, the
    // coordinate would land at the officer's waist - a half-marker error the
    // dispatcher has no way to notice.
    yoffset: size / 2,
    outline: {
      color: [255, 255, 255, isMuted && !state.isSelected ? 0.7 : 1],
      width: state.isSelected ? 2 : 1.5
    }
  };
}

/**
 * The disc drawn UNDER the selected officer.
 *
 * Selection used to be a size jump plus a near-black ring, which turned the
 * figure into a dark blob and competed with the availability colour. A halo in
 * that same colour reads as "this one" without restating - or masking - what the
 * colour already says.
 *
 * Drawn as a separate graphic rather than folded into the marker: the icon is
 * lifted by `size / 2` so it stands on its coordinate, and an unshifted circle
 * therefore lands at the officer's feet, like a spotlight on the ground.
 */
export function createStaffHaloSymbol(statusId: string, isLogin: boolean) {
  return createHalo(getStaffAvailability(statusId, isLogin), HALO_SIZE);
}

/**
 * The same halo, sized to sit OUTSIDE a group circle.
 *
 * Used when the selected officer has been swallowed by a group: the selection
 * has to stay visible, and a 34px halo under a circle of up to 40px would simply
 * disappear beneath it.
 */
export function createStaffGroupHaloSymbol(availability: StaffAvailability, count: number) {
  return createHalo(availability, getGroupSize(count) + GROUP_HALO_MARGIN);
}

function createHalo(availability: StaffAvailability, size: number) {
  const rgb = getAvailabilityRgb(availability);

  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(rgb, HALO_FILL_ALPHA),
    size,
    outline: {
      color: withAlpha(rgb, HALO_OUTLINE_ALPHA),
      width: 1.5
    }
  };
}

/**
 * The direction-of-travel chevron for the SELECTED officer, when they are
 * actually travelling (see staffTelemetry.ts - a stopped unit's bearing is the
 * direction it last faced, not one it is going).
 *
 * A separate graphic rather than a rotation of the marker itself: the marker is
 * a person, and a rotated silhouette reads as someone falling over rather than
 * someone heading north-east. Rotating a chevron on the halo ring says the same
 * thing without touching the figure - and leaves createStaffSymbol, which every
 * officer on the map goes through, exactly as it was.
 *
 * Positioned by screen-space offset rather than by moving the geometry: the
 * chevron marks a direction from a point, not a second place the officer might
 * be, so it has to stay pinned to them at every zoom level.
 */
export function createStaffHeadingSymbol(
  statusId: string,
  isLogin: boolean,
  bearingDegrees: number
) {
  const rgb = getAvailabilityRgb(getStaffAvailability(statusId, isLogin));
  const radians = (bearingDegrees * Math.PI) / 180;

  return {
    type: "simple-marker" as const,
    style: "path" as const,
    path: HEADING_CHEVRON_PATH,
    color: withAlpha(rgb, ACTIVE_ALPHA),
    size: HEADING_SIZE,
    // Esri rotates a marker CLOCKWISE, and a compass bearing is measured
    // clockwise from north, so the two agree with no conversion. Worth stating
    // because the SDK's own docs only say "the angle of the marker relative to
    // the screen in degrees" and leave the direction open: the SDK converts a
    // marker's `angle` to a CIM rotation as `rotation: -angle`, and CIM rotation
    // is counter-clockwise-positive (hence cimSymbolUtils taking a `clockwise`
    // flag that defaults to false). Two negatives: `angle` is clockwise.
    //
    // Getting this backwards would mirror every arrow - a unit heading north-east
    // drawn heading north-west - which is precisely the kind of confidently wrong
    // indicator this section exists to avoid, so it is worth an eyeball on screen
    // rather than trust in a comment.
    angle: bearingDegrees,
    // Screen offsets: x grows right, y grows UP, hence sin/cos rather than the
    // cos/-sin a screen-coordinate system would need.
    xoffset: HEADING_ORBIT_PX * Math.sin(radians),
    yoffset: HEADING_ORBIT_PX * Math.cos(radians),
    outline: {
      color: [255, 255, 255, 1],
      width: 1
    }
  };
}

/**
 * The circle drawn in place of officers who overlap on screen.
 *
 * Deliberately CENTRED on its point, unlike the person marker, which is lifted
 * so it stands on its coordinate: a group marks an area several officers share,
 * not somebody standing at a spot, and a lifted circle would read as one more
 * person. Its colour is the group's best availability (see staffClusters.ts),
 * so a dispatcher can still see at a glance whether anyone here is dispatchable.
 */
export function createStaffGroupSymbol(availability: StaffAvailability, count: number) {
  const rgb = getAvailabilityRgb(availability);

  return {
    type: "simple-marker" as const,
    style: "circle" as const,
    color: withAlpha(rgb, GROUP_FILL_ALPHA),
    size: getGroupSize(count),
    outline: {
      color: [255, 255, 255, 1],
      width: 2
    }
  };
}

/**
 * The member count, drawn as a second graphic over the circle.
 *
 * A separate graphic rather than a CIMSymbol combining the two: CIM JSON is
 * verbose and easy to get subtly wrong, and the layer already draws a companion
 * graphic for the selection halo. The label carries the same group id in its
 * attributes, so clicking the number counts as clicking the group.
 */
export function createStaffGroupLabelSymbol(count: number) {
  return {
    type: "text" as const,
    text: String(count),
    color: [255, 255, 255, 1],
    // Thin dark halo so the digits hold up against every one of the three fills.
    haloColor: [17, 24, 39, 0.55],
    haloSize: 1,
    horizontalAlignment: "center" as const,
    verticalAlignment: "middle" as const,
    font: {
      size: 11,
      weight: "bold" as const
    }
  };
}

/** Tailwind classes for the same three colours, for the panel's status dot. */
export function getStaffStatusDotClass(statusId: string, isLogin: boolean): string {
  switch (getStaffAvailability(statusId, isLogin)) {
    case "ready":
      return "bg-green-500";
    case "engaged":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}
