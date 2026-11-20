"use client"
import OfficerDetailModal from "@/cms/components/assignOfficer/officerSkillModal"
import { getAvatarIconFromString } from "@/cms/components/avatar/createAvatarFromString"
import Input from "@/core/components/form/input/InputField"
import { Avatar } from "@/core/components/ui/avatar/Avatarv2"
import Badge from "@/core/components/ui/badge/Badge"
import Button from "@/core/components/ui/button/Button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog"
import { ScrollArea } from "@/core/components/ui/scorllarea/scroll-area"
import { unitStatusConfig } from "@/cms/components/ui/status/status"
import { Area, mergeArea } from "@/cms/store/api/area"
import { useGetUnitQuery } from "@/cms/store/api/dispatch"
import { Unit, CaseSop } from "@/cms/types/dispatch"
import { UnitStatus } from "@/cms/types/unit"
import { AvatarFallback } from "@/core/components/ui/avatar/Avatarv2"
import { useTranslation } from "@/core/hooks/useTranslation"
import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react"
import type { MapLatLon } from "@/cms/components/case/createCase/map/mapTypes"
import { buildWorkloadByUnitId } from "@/cms/components/assignOfficer/workload/unitWorkloadAdapter"
import { compareWorkloadRank, getWorkloadRank } from "@/cms/components/assignOfficer/workload/workloadRank"
import { useOfficerRouteSolves } from "@/cms/components/assignOfficer/workload/useOfficerRouteSolves"
import { OfficerWorkloadCell } from "@/cms/components/assignOfficer/workload/OfficerWorkloadCell"
import { OfficerAssignedCasesCell } from "@/cms/components/assignOfficer/workload/OfficerAssignedCasesCell"
import { OfficerEtaTtlCell } from "@/cms/components/assignOfficer/workload/OfficerEtaTtlCell"
import {
  MAX_BATCH_ASSIGN_OFFICERS,
  canSelectMore,
  isSelectAllDisabled,
  pruneSelection
} from "@/cms/components/assignOfficer/batchAssignSelection"
import {
  resolveOfficerColumns,
  type OfficerColumnId
} from "@/cms/components/assignOfficer/officerColumns"
import { EntitlementGate } from "@/core/components/entitlements/EntitlementGate"
import { useEntitlements } from "@/core/hooks/useEntitlements"
import { useOrgMapSettings } from "@/cms/components/admin/system-configuration/settings/useOrgMapSettings"
import type { UnitWorkload } from "@/cms/types/unitWorkload"
import type { RouteState } from "@/cms/components/case/createCase/map/staff/routeTypes"

// The tracks are NOT in this class: which columns exist is decided per tenant
// entitlement and per org setting (`resolveOfficerColumns`), so the grid template is an
// inline style derived from that list. The hardcoded
// `grid-cols-[15%_11%_13%_15%_12%_14%_20%]` this replaces is what let the ETA/TTL
// column outlive the GIS add-on it belongs to.
const OFFICER_GRID_CLASS = "grid gap-3"

/** Default wrapper for a cell; a column can override it (name is inset, area is muted). */
const DEFAULT_OFFICER_CELL_CLASS = "flex items-center justify-center"

// "All Officer" is the default view: today's unfiltered roster. "Recommend"
// re-ranks by workload then currently-assigned-case count (Decision #9 — ETA/TTL
// is deliberately NOT part of this).
type OfficerViewMode = "all" | "recommend"


const SkillsDisplay = ({
  skills,
  maxInitialItems = 1,
  className = "",
  language = "th"
}: {
  skills: Array<{ skillId: string, en: string, th: string }>
  maxInitialItems?: number
  className?: string
  language?: string
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!skills || skills.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500 text-xs">No skills</span>
  }

  const visibleSkills = expanded ? skills : skills.slice(0, maxInitialItems)
  const remainingCount = skills.length - maxInitialItems
  return (
    <div className={`space-y-1 w-full ${className}`}>
      <div className="flex flex-wrap gap-1 items-center justify-start">
        {visibleSkills.map((skill) => (
          <Badge
            key={skill.skillId}
            variant="outline"
            className="text-xs max-w-30 truncate"
          >
            {skill?.[language === "th" ? "th" : "en"] || skill.th}
          </Badge>
        ))}
        {skills.length > maxInitialItems && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5 rounded transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                +{remainingCount}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Checkbox for multi-officer selection. `indeterminate` is only reachable from
// the header checkbox, where some - but not all - of the filtered rows are picked.
const UnifiedCheckbox = ({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  className = ""
}: {
  checked: boolean
  indeterminate?: boolean
  /** Set for officers already assigned to this case: visible, never selectable. */
  disabled?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <div className="relative flex items-center justify-center">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={`w-4 h-4 appearance-none rounded transition-all duration-200
      ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      bg-gray-200 border-2 border-gray-300
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      checked:bg-blue-600 checked:border-blue-600
      hover:border-blue-400
      dark:border-gray-500 dark:bg-gray-700
      dark:checked:bg-blue-500 dark:checked:border-blue-500
      dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800
      dark:hover:border-blue-400 ${className}`}
      />
      {checked && (
        <svg
          className="absolute pointer-events-none w-2.5 h-2.5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

/**
 * Everything one row's cells need, in one object.
 *
 * `renderOfficerCell` is a plain function on purpose, not a component: a component
 * declared inside the modal's render body gets a NEW identity on every render, and
 * React then unmounts/remounts the entire subtree - which is what makes a table blink
 * and lose state on unrelated parent updates (a documented lesson in this repo).
 */
interface OfficerRowContext {
  officer: Unit
  /** The CASE's area label - the same for every row, so it is resolved once per render. */
  areaLabel: string
  unitStatuses: UnitStatus[]
  workload: UnitWorkload | undefined
  routeState: RouteState
  canSolveRoute: boolean
  routeCooldownSeconds: number
  onSolveRoute: () => void
  onRetryWorkload: () => void
  language: string
}

/**
 * The content of one cell, chosen by column id. A `switch` (not a lookup of JSX) keeps
 * it exhaustive: adding an `OfficerColumnId` without a cell here fails to type-check
 * instead of rendering an empty column.
 */
function renderOfficerCell(
  columnId: OfficerColumnId,
  context: OfficerRowContext
): ReactNode {
  const { officer } = context

  switch (columnId) {
    case "name":
      return (
        <>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-200 text-gray-700 text-xs dark:bg-gray-700 dark:text-white">
              {officer.photo ?
                <img src={officer.photo} alt="officer" className="w-full h-full object-cover" /> : officer.unitName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-800 dark:text-white font-medium">
            {officer.unitName}
          </span>
        </>
      )

    case "status": {
      const status = unitStatusConfig.find(column => column.group.includes(officer.sttId));
      return (
        <div className=" flex items-center ">
          <div className={`w-3 h-3 rounded-full mx-1 ${officer.isLogin ? "bg-green-500" : "bg-red-500"}`}>
          </div>
          <Badge
            color={status?.color || "secondary"}
            variant={status?.variant || "light"}
          >
            {context.unitStatuses.find(column => column.sttId.includes(officer.sttId))?.sttName || "-"}
          </Badge>
        </div>
      )
    }

    case "area":
      return context.areaLabel

    case "skills":
      return <SkillsDisplay skills={officer.skillLists || []} language={context.language} />

    case "workload":
      // Workload rides the roster fetch: no separate loading/error state exists anymore
      // (see the signals comment in the modal). The cells stay as-is; the retry path is
      // unreachable but stays wired to the roster refetch for prop-shape parity.
      return (
        <OfficerWorkloadCell
          count={context.workload?.activeCaseCount}
          isLoading={false}
          isError={false}
          onRetry={context.onRetryWorkload}
        />
      )

    case "assignedCases":
      return (
        <OfficerAssignedCasesCell
          cases={context.workload?.cases}
          count={context.workload?.activeCaseCount}
          isLoading={false}
          isError={false}
          onRetry={context.onRetryWorkload}
        />
      )

    case "etaTtl":
      return (
        <OfficerEtaTtlCell
          state={context.routeState}
          canSolve={context.canSolveRoute}
          cooldownSeconds={context.routeCooldownSeconds}
          onSolve={context.onSolveRoute}
        />
      )
  }
}

interface AssignOfficerModalProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  caseId: string
  onAssign: (selectedOfficers: Unit[]) => void
  assignedOfficers?: Unit[]
  canDispatch?: boolean
  caseData: CaseSop | undefined
  sopUnitLists?: Array<{ unitId: string }>
}

type SortableColumns = keyof Omit<Unit, "id">

export default function AssignOfficerModal({
  open,
  onOpenChange,
  caseId,
  onAssign,
  caseData,
  assignedOfficers = [],
  canDispatch = true,
  sopUnitLists = [],
}: AssignOfficerModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // A case can hold several officers at once, so selection is a list of unitIds.
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([])
  const [sortColumn] = useState<SortableColumns>("locAlt")
  const [sortDirection] = useState<"asc" | "desc">("asc")
  const [disableAssign, setDisableAssign] = useState(false)
  const [showOfficerData, setShowOFFicerData] = useState<Unit | null>(null)
  const [viewMode, setViewMode] = useState<OfficerViewMode>("all")
  
  const unitStatus = useMemo(() => {
    return JSON.parse(localStorage.getItem("unit_status") ?? "[]") as UnitStatus[];
  }, []);

  const handleAssignOfficers = async () => {
    if (selectedOfficerIds.length === 0 || disableAssign) return;
    setDisableAssign(true);
    try {
      // Assigned officers cannot be selected (guards below), but the payload
      // filters them again so a stale selection can never re-dispatch someone
      // already on the case.
      const selectedOfficerObjects = rosterOfficers.filter(officer =>
        selectedOfficerIds.includes(officer.unitId) &&
        !assignedUnitIds.has(officer.unitId)
      );
      if (selectedOfficerObjects.length > 0) {
        await onAssign(selectedOfficerObjects);
      }
    } catch (error) {
      console.error("Failed to assign officers:", error);
    } finally {
      setDisableAssign(false);
    }
  };

  const { data: unitData, isLoading: isLoadingUnits, error: unitError, refetch: refetchUnits } = useGetUnitQuery(
    { caseId },
    {
      skip: !open || !caseId,
      refetchOnMountOrArgChange: true
    }
  )

  const areaList = useMemo(() =>
    JSON.parse(localStorage.getItem("area") ?? "[]") as Area[], []
  );

  // The FULL roster as the units endpoint returns it. Officers already assigned
  // to THIS case (sopUnitLists) stay listed on purpose — their workload and
  // assigned-cases cells remain visible so a dispatcher can track whether their
  // load has cleared — but they are never selectable (see assignedUnitIds and
  // selectableFilteredOfficers below).
  const rosterOfficers = useMemo(() => unitData?.data ?? [], [unitData?.data])

  // Who is already on this case. Drives the disabled checkbox and every
  // selection guard — one definition so the two cannot drift.
  const assignedUnitIds = useMemo(
    () => new Set(sopUnitLists.map((assignedUnit) => assignedUnit.unitId)),
    [sopUnitLists]
  )

  // Seed/reset the selection ONLY on the modal's open-state TRANSITIONS. The
  // deps below churn while the modal is open: every dispatch POST (each
  // officer of a batch) invalidates the "Dispatch" tag and refetches the SOP,
  // producing a new unitLists array and a new assignedUnitIds Set. Re-seeding
  // on every churn reset the selection to assignedOfficers (empty in the case
  // detail flow) mid-session - the "selected list disappeared" regression.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      // Preselect only officers not already on the case: an assigned officer's
      // checkbox is disabled, and a checked-but-disabled row would still count
      // toward the Assign button.
      setSelectedOfficerIds(
        assignedOfficers
          .filter((officer) => !assignedUnitIds.has(officer.unitId))
          .map((officer) => officer.unitId)
      )
    } else if (!open) {
      setSelectedOfficerIds([])
      setSearchTerm("")
      setViewMode("all")
    }
    wasOpenRef.current = open
    setDisableAssign(false)
  }, [open, assignedOfficers, assignedUnitIds])

  // The roster is live (refetch on reopen, "Dispatch" tag invalidation after an
  // assignment, SOP unit updates): whenever it changes, the selection follows.
  // A selected officer who disappeared from the roster - or who has since been
  // assigned to this case - drops out of the selection, and an over-cap
  // selection is trimmed back to the cap. Skipped while the first roster load is
  // still in flight, so the preselection above is not wiped before there is a
  // roster to reconcile against. Same array returned when nothing changed.
  useEffect(() => {
    if (!open || isLoadingUnits) return
    // An empty roster here is a TRANSIENT state far more often than a real one
    // (a refetch blip, or churn on the shared units cache the map keeps
    // refreshing); pruning against it would wipe the whole selection. Stale ids
    // left in the selection are harmless: no row renders for them, and the
    // assign payload filters by the roster anyway.
    if (rosterOfficers.length === 0) return
    setSelectedOfficerIds(prev => {
      const selectableIds = new Set(
        rosterOfficers
          .filter(officer => !assignedUnitIds.has(officer.unitId))
          .map(officer => officer.unitId)
      )
      const pruned = pruneSelection(prev, selectableIds)
      return pruned.length === prev.length ? prev : pruned
    })
  }, [open, isLoadingUnits, rosterOfficers, assignedUnitIds])

  const { t, language } = useTranslation();

  // --- Per-officer signals (workload, assigned cases, ETA/TTL) ---------------
  // Workload and assigned cases now arrive EMBEDDED in the roster response
  // itself (Unit.workloadCount / Unit.workloadCases — validated and indexed by
  // unitWorkloadAdapter.ts), so there is no second network call anymore and no
  // separate loading/error state: while the roster loads the modal shows its
  // full-screen loader, and a unit whose fields are missing/invalid simply has
  // no entry (the cells' own "-" state). The old dedicated bulk call
  // (useUnitWorkloads → POST /units/workload) is disconnected, not deleted.
  // ETA/TTL remains an independent, on-demand signal.

  const workloadByUnitId = useMemo(
    () => buildWorkloadByUnitId(unitData?.data),
    [unitData?.data]
  )

  // The open case's location, for the on-demand per-row route solves. Strings on
  // CaseSop; NaN here just means "no case location" and the cell says so.
  const caseLocation = useMemo<MapLatLon | null>(() => {
    const latitude = Number(caseData?.caseLat)
    const longitude = Number(caseData?.caseLon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    if (latitude === 0 && longitude === 0) return null
    return { latitude, longitude }
  }, [caseData?.caseLat, caseData?.caseLon])

  // --- Which columns this tenant/org may see -----------------------------------------
  // Two independent inputs, both already loaded by the app shell:
  //   * the tenant's entitlements - `hasFeature`, NOT `!isLocked`, because `isLocked`
  //     answers "false" while entitlements are still loading (fail-open) and would hand
  //     the ETA/TTL column to a tenant we have not proven owns the GIS add-on;
  //   * the org's Map Settings - `assignment.*` and `staff.etaTtl.applyToAssignmentPicker`,
  //     which until now were editable in the admin form and read by nobody.
  // `loaded` is always a fully-populated record (schema defaults when the endpoint has no
  // saved row), and RTK caches it per orgId, so this adds no request of its own.
  const { hasFeature } = useEntitlements();
  // `enabled: open` on purpose: this modal is mounted (closed) on every case page, so an
  // unconditional fetch here would ask for the org's map settings before anyone opened
  // the picker - including for tenants with no GIS at all. While skipped, the hook still
  // returns schema defaults, which is what the column list below reads.
  const { loaded: mapSettings } = useOrgMapSettings({ enabled: open });
  const officerColumns = resolveOfficerColumns({
    hasGis: hasFeature("entitlement.gis"),
    showWorkload: mapSettings.assignment.showWorkload,
    showAssignedCases: mapSettings.assignment.showAssignedCases,
    showRecommendRanking: mapSettings.assignment.enableRecommendRanking,
    etaTtlInPicker: mapSettings.staff.etaTtl.applyToAssignmentPicker,
  });

  const officerRoutes = useOfficerRouteSolves({
    officers: rosterOfficers,
    caseLocation,
    // Belt and braces: without the column there is nothing to press, and this makes a
    // leftover callback unable to reach the routing provider either.
    enabled: officerColumns.showEtaTtl,
  })

  // The AREA column shows the CASE's area (existing behaviour — it is identical on every
  // row), so it is resolved once per render instead of once per row.
  const caseAreaLabel = useMemo(() => {
    const matchedArea = areaList.find(
      item =>
        caseData?.provId === item.provId &&
        caseData?.countryId === item.countryId &&
        caseData?.distId === item.distId
    );
    return matchedArea ? mergeArea(matchedArea, language) : "-";
  }, [areaList, caseData?.provId, caseData?.countryId, caseData?.distId, language])

  const filteredOfficers = useMemo(() => {
    if (!searchTerm.trim()) return rosterOfficers
    const searchLower = searchTerm.toLowerCase()
    return rosterOfficers.filter((officer) =>
      officer.username.toLowerCase().includes(searchLower) ||
      officer.deptId.toLowerCase().includes(searchLower) ||
      officer.unitId.toLowerCase().includes(searchTerm) ||
      officer.skillLists.find(item => item[language === "en" ? "en" : "th"]?.toLowerCase().includes(searchLower)) ||
      (() => {
        const matchedArea = areaList.find(
          item =>
            caseData?.provId === item.provId &&
            caseData?.countryId === item.countryId &&
            caseData?.distId === item.distId
        );
        return matchedArea ? mergeArea(matchedArea, language).toLocaleLowerCase().includes(searchTerm) : "";
      })()
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterOfficers, searchTerm])

  const sortedOfficers = useMemo(() =>
    [...filteredOfficers].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    }),
    [filteredOfficers, sortColumn, sortDirection]
  )

  // "Recommend": least-loaded first — workload ascending, then currently-assigned
  // -case count ascending. Ties keep their prior order (Array.sort is stable), so
  // an equal-load pair still respects status/area/skills sorting from above.
  // ETA/TTL is intentionally not a factor (Decision #9) — this reads only data
  // already in hand, so toggling the view triggers no routing-provider calls.
  // Officers with no workload data yet (endpoint still loading, or it returned
  // nothing for that unit) sort last rather than jumping to the top on a 0.
  //
  // The ranking itself lives in workloadRank.ts, shared with the map's staff
  // filter so the two cannot disagree about who is least loaded.
  // The Recommend view is only reachable when the org enabled it
  // (`assignment.enableRecommendRanking`). Deriving the EFFECTIVE mode instead of only
  // hiding the button matters: a picker opened while the switch was on, then closed and
  // reopened after an admin turned it off, would otherwise keep re-ranking rows with no
  // visible control saying why.
  const effectiveViewMode: OfficerViewMode = officerColumns.showRecommendRanking ? viewMode : "all"

  const displayedOfficers = useMemo(() => {
    if (effectiveViewMode !== "recommend") return sortedOfficers

    return [...sortedOfficers].sort((a, b) =>
      compareWorkloadRank(
        getWorkloadRank(workloadByUnitId[a.unitId]),
        getWorkloadRank(workloadByUnitId[b.unitId])
      )
    )
  }, [effectiveViewMode, sortedOfficers, workloadByUnitId])

  const handleSelectOfficer = (officerId: string) => {
    // Assigned officers are listed for tracking only — never selectable.
    if (assignedUnitIds.has(officerId)) return
    setSelectedOfficerIds(prev =>
      prev.includes(officerId)
        ? prev.filter(id => id !== officerId)
        // At the batch cap no NEW officer may be checked - the row checkboxes
        // of unselected officers are disabled and this guard is the safety
        // net behind them (badge removal, select-all, ...).
        : canSelectMore(prev.length) ? [...prev, officerId] : prev
    )
  }

  // Selectable = filtered rows NOT already on this case. The header checkbox
  // and "select all" act on these only, so a search result full of assigned
  // officers leaves the header honestly unchecked instead of half-broken.
  const selectableFilteredOfficers = useMemo(
    () => filteredOfficers.filter(officer => !assignedUnitIds.has(officer.unitId)),
    [filteredOfficers, assignedUnitIds]
  )

  // "Select all" acts on the visible (filtered) rows only, so a search term
  // narrows what the header checkbox can add or remove.
  const isAllFilteredSelected = useMemo(() => {
    if (selectableFilteredOfficers.length === 0) return false
    return selectableFilteredOfficers.every(officer => selectedOfficerIds.includes(officer.unitId))
  }, [selectableFilteredOfficers, selectedOfficerIds])

  const isSomeFilteredSelected = useMemo(() => {
    if (selectableFilteredOfficers.length === 0) return false
    return !isAllFilteredSelected && selectableFilteredOfficers.some(officer => selectedOfficerIds.includes(officer.unitId))
  }, [selectableFilteredOfficers, selectedOfficerIds, isAllFilteredSelected])

  const handleSelectAll = () => {
    const filteredIds = selectableFilteredOfficers.map(officer => officer.unitId)
    if (isAllFilteredSelected) {
      setSelectedOfficerIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      // "Select all" adds the whole selectable filtered list, but never past
      // the batch cap: when slots are already used by officers outside the
      // current filter, only the remaining free slots are filled.
      setSelectedOfficerIds(prev => {
        const remaining = MAX_BATCH_ASSIGN_OFFICERS - prev.length
        if (remaining <= 0) return prev
        const toAdd = filteredIds.filter(id => !prev.includes(id)).slice(0, remaining)
        return Array.from(new Set([...prev, ...toAdd]))
      })
    }
  }

  // Selected officer objects for the summary badges.
  const selectedOfficerObjects = useMemo(
    () => rosterOfficers.filter(officer => selectedOfficerIds.includes(officer.unitId)),
    [rosterOfficers, selectedOfficerIds]
  )

  if (isLoadingUnits) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] h-[85vh] flex flex-col z-999999 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
              {t("case.assign_officer_modal.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">{t("common.loading")}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (unitError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] h-[85vh] flex flex-col z-999999 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
              {t("case.assign_officer_modal.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">{t("common.error")}</div>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] h-[85vh] flex flex-col z-999999 rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-white">
            {t("case.assign_officer_modal.title")}
          </DialogTitle>
        </DialogHeader>
        {showOfficerData && <OfficerDetailModal onOpenChange={() => setShowOFFicerData(null)} officer={showOfficerData as Unit} />}

        {/* Search Bar and Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="grow">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-200" />
              <Input
                placeholder={t("case.assign_officer_modal.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 pl-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
          {/* The Recommend ranking is an org switch (`assignment.enableRecommendRanking`).
              With it off there is only one view, so the whole segmented control goes
              rather than showing a single button that looks permanently pressed. */}
          {officerColumns.showRecommendRanking && (
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-xl mt-2 md:mt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("recommend")}
                aria-pressed={effectiveViewMode === "recommend"}
                className={effectiveViewMode === "recommend"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}
              >
                {t("case.assign_officer_modal.recommend_button")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("all")}
                aria-pressed={effectiveViewMode === "all"}
                className={effectiveViewMode === "all"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}
              >
                {t("case.assign_officer_modal.allofficer_button")}
              </Button>
            </div>
          )}
        </div>

        {/* Why a column is missing, said ONCE. The ETA/TTL column is the GIS add-on, so a
            tenant without it gets the standard lock block above the table instead of a
            per-row placeholder. The children are deliberately empty: this gate is used as
            a NOTICE - it renders the lock UI only when the feature is missing, and nothing
            at all when the tenant owns it. VITE_SHOW_ENTITLEMENT_UPSELL="false" reduces it
            to nothing, which is exactly what that flag is for; the column itself stays
            hidden either way (the entitlement decides, the flag only decides whether we
            say so). */}
        <EntitlementGate feature="entitlement.gis">{null}</EntitlementGate>

        {/* Officers Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar">
            <div className="min-w-295">
              {/* Table Header */}
              <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <div className="py-5 px-4 w-12 flex items-center justify-center">
                    <UnifiedCheckbox
                      checked={isAllFilteredSelected}
                      indeterminate={isSomeFilteredSelected}
                      // "Select all" is disabled when the selectable filtered
                      // list exceeds the batch cap: it may never pick a partial
                      // slice that would still look like "all".
                      disabled={isSelectAllDisabled(selectableFilteredOfficers.length)}
                      onChange={handleSelectAll}
                    />
                  </div>
                  <div
                    className={`${OFFICER_GRID_CLASS} flex-1 pr-10`}
                    style={{ gridTemplateColumns: officerColumns.gridTemplateColumns }}
                  >
                    {officerColumns.columns.map((column) => (
                      <div key={column.id} className="flex items-center justify-center">
                        {t(column.labelKey)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div>
                <ScrollArea className="h-full">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedOfficers.length === 0 ? (
                      <div className="flex justify-center items-center text-center text-gray-500 dark:text-gray-400 py-4">
                        {rosterOfficers.length === 0 ? t("case.assign_officer_modal.no_officer") : t("case.assign_officer_modal.not_match_officer")}
                      </div>
                    ) : (
                      displayedOfficers.map((officer) => {
                        const isSelected = selectedOfficerIds.includes(officer.unitId)
                        // Already on this case: row stays for workload tracking,
                        // but the checkbox is disabled and selection guards
                        // (above) make it unselectable by any path.
                        const isAssignedToCase = assignedUnitIds.has(officer.unitId)
                        return (
                          <div
                            key={officer.unitId}
                            className={`flex items-center text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "bg-white dark:bg-gray-900"
                              }`}
                          >
                            <div className="px-4">
                              <UnifiedCheckbox
                                checked={isSelected}
                                // Second rule: once the batch cap is reached, an
                                // UNselected officer is locked out until someone
                                // unchecks first. Selected rows stay togglable.
                                disabled={isAssignedToCase || (!isSelected && !canSelectMore(selectedOfficerIds.length))}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleSelectOfficer(officer.unitId)
                                }}
                              />
                            </div>
                            <div
                              className={`${OFFICER_GRID_CLASS} flex-1 py-3 pr-10 cursor-pointer`}
                              style={{ gridTemplateColumns: officerColumns.gridTemplateColumns }}
                              onClick={() => {
                                setShowOFFicerData(officer)
                              }}
                            >
                              {officerColumns.columns.map((column) => (
                                <div
                                  key={column.id}
                                  className={column.cellClass ?? DEFAULT_OFFICER_CELL_CLASS}
                                >
                                  {renderOfficerCell(column.id, {
                                    officer,
                                    areaLabel: caseAreaLabel,
                                    unitStatuses: unitStatus,
                                    workload: workloadByUnitId[officer.unitId],
                                    routeState: officerRoutes.routeStateFor(officer.unitId),
                                    canSolveRoute: officerRoutes.canSolve(officer.unitId),
                                    routeCooldownSeconds: officerRoutes.cooldownSeconds(officer.unitId),
                                    onSolveRoute: () => officerRoutes.solve(officer.unitId),
                                    onRetryWorkload: refetchUnits,
                                    language,
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedOfficerObjects.length > 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t("case.assign_officer_modal.select")} {selectedOfficerObjects.length} {t("case.assign_officer_modal.officer")}:
            </div>
            {!canSelectMore(selectedOfficerIds.length) && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t("case.assign_officer_modal.batch_limit_hint", { count: MAX_BATCH_ASSIGN_OFFICERS })}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2 max-h-20 overflow-y-auto custom-scrollbar">
              {selectedOfficerObjects.map((officer) => (
                <Badge key={officer.unitId}>
                  {getAvatarIconFromString(officer.unitName, "bg-blue-600 dark:bg-blue-700 my-1")}
                  {officer.unitName}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectOfficer(officer.unitId)
                    }}
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {canDispatch && <Button
            onClick={handleAssignOfficers}
            disabled={selectedOfficerIds.length === 0 || disableAssign}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {t("case.assign_officer_modal.assign_button")} ({selectedOfficerIds.length})
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}