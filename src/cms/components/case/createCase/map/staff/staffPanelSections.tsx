// The staff detail panel's section registry.
//
// The five sections below are the agreed shape of the dispatch widget. Each is
// declared here with its label, a one-line description of the work it will do,
// and a `render` slot. Filling one in means writing that `render` and flipping
// `status` to "available" - no changes to the panel itself.
//
// All five are now built. The "in-development" status stays in the type, and the
// panel keeps rendering its badge and the description line, because that is the
// framework a sixth section is added through: declare it, ship it labelled, then
// fill in `render`. A section is never mocked up, so nobody mistakes an empty row
// for working UI.
import {
  Activity,
  Gauge,
  Route,
  User,
  Workflow,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";
import StaffContextualWorkflowsSection from "./StaffContextualWorkflowsSection";
import StaffEtaTtlSection from "./StaffEtaTtlSection";
import StaffPersonalInfoSection from "./StaffPersonalInfoSection";
import StaffSmartRoutingSection from "./StaffSmartRoutingSection";
import StaffTrackingSection from "./StaffTrackingSection";
import type { RouteState } from "./routeTypes";
import type { StaffMarker } from "./staffTypes";

export type StaffSectionStatus = "available" | "in-development";

/**
 * Everything a section may need about the open case that isn't on the marker.
 * The panel knows only whether a button is enabled and what to call when it is
 * pressed; payloads, SOP lookups, toasts, modals and refetching stay in
 * CaseDetailView.
 */
export interface StaffSectionContext {
  /** Case number shown to the user - the work order number, not the internal id. */
  caseLabel: string;
  /** Whether this staff member is already on the open case (from SOP `unitLists`). */
  isAssigned: boolean;
  /** The SOP has a dispatch stage to run. */
  canAssign: boolean;
  /** The SOP allows withdrawing a unit from this case. */
  canCancel: boolean;
  /** A request for THIS staff member is in flight; other cards stay usable. */
  isSubmitting: boolean;
  onRequestAssign: () => void;
  onRequestCancel: () => void;
  /** Opens the full case record, rendered above the map by CaseDetailView. */
  onRequestCaseDetails: () => void;
  /**
   * This officer's status ON THIS CASE, distinct from their global duty status
   * (which the marker itself already carries). Undefined when not assigned here.
   */
  caseUnitStatusId?: string;
  /**
   * The officer -> case driving route. One shared state so Smart Routing and
   * ETA/TTL - both driven by the same solve - can never disagree.
   */
  route: {
    state: RouteState;
    /** False while a precondition fails, a solve is in flight, or the cooldown is armed. */
    canSolve: boolean;
    /** Seconds left before another solve is allowed; 0 when not cooling down. */
    cooldownSeconds: number;
    onSolve: () => void;
  };
  /**
   * The breadcrumb trail for this officer. The control lives in the tracking
   * section, but the STATE cannot: a section unmounts whenever its row is
   * collapsed, so owning it there would forget the setting every time. It is
   * owned by CaseStaffMapField and passed down here, exactly as `route` is.
   */
  trail: {
    isVisible: boolean;
    /** How many positions have actually been collected, so the section can say. */
    pointCount: number;
    onToggle: () => void;
  };
}

export interface StaffPanelSection {
  id: string;
  icon: LucideIcon;
  /** i18n key for the section heading. */
  labelKey: string;
  /** i18n key for the "what will live here" line shown while in development. */
  descriptionKey: string;
  status: StaffSectionStatus;
  /** Set once the section is built; `status` must become "available" with it. */
  render?: (marker: StaffMarker, ctx: StaffSectionContext) => ReactNode;
}

export const STAFF_PANEL_SECTIONS: readonly StaffPanelSection[] = [
  {
    id: "staff-tracking",
    icon: Activity,
    labelKey: "case.display.map_staff_section_tracking",
    descriptionKey: "case.display.map_staff_section_tracking_desc",
    status: "available",
    render: (marker, ctx) => <StaffTrackingSection marker={marker} ctx={ctx} />
  },
  {
    id: "smart-routing",
    icon: Route,
    labelKey: "case.display.map_staff_section_routing",
    descriptionKey: "case.display.map_staff_section_routing_desc",
    status: "available",
    render: (_marker, ctx) => <StaffSmartRoutingSection ctx={ctx} />
  },
  {
    id: "contextual-workflows",
    icon: Workflow,
    labelKey: "case.display.map_staff_section_workflows",
    descriptionKey: "case.display.map_staff_section_workflows_desc",
    status: "available",
    render: (_marker, ctx) => <StaffContextualWorkflowsSection ctx={ctx} />
  },
  {
    id: "eta-ttl",
    icon: Gauge,
    labelKey: "case.display.map_staff_section_eta_ttl",
    descriptionKey: "case.display.map_staff_section_eta_ttl_desc",
    status: "available",
    render: (_marker, ctx) => <StaffEtaTtlSection ctx={ctx} />
  },
  {
    id: "personal-info",
    icon: User,
    labelKey: "case.display.map_staff_section_personal_info",
    descriptionKey: "case.display.map_staff_section_personal_info_desc",
    status: "available",
    render: (marker) => <StaffPersonalInfoSection marker={marker} />
  }
];
