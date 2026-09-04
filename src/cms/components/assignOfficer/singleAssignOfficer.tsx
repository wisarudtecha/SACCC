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
import { useState, useMemo, useEffect, useRef } from "react"
import type { MapLatLon } from "@/cms/components/case/createCase/map/mapTypes"
import { useUnitWorkloads } from "@/cms/components/assignOfficer/workload/useUnitWorkloads"
import { useOfficerRouteSolves } from "@/cms/components/assignOfficer/workload/useOfficerRouteSolves"
import { OfficerWorkloadCell } from "@/cms/components/assignOfficer/workload/OfficerWorkloadCell"
import { OfficerAssignedCasesCell } from "@/cms/components/assignOfficer/workload/OfficerAssignedCasesCell"
import { OfficerEtaTtlCell } from "@/cms/components/assignOfficer/workload/OfficerEtaTtlCell"

// One class for the 7-column officer grid so the header and every row stay in
// lockstep. Name gets the most room; ETA/TTL needs room for three lines + button.
const OFFICER_GRID_COLS = "grid grid-cols-[15%_11%_13%_15%_12%_14%_20%] gap-3"

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
  onChange,
  className = ""
}: {
  checked: boolean
  indeterminate?: boolean
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
        onChange={onChange}
        className={`w-4 h-4 appearance-none rounded cursor-pointer transition-all duration-200
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
      const selectedOfficerObjects = availableOfficers.filter(officer =>
        selectedOfficerIds.includes(officer.unitId)
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

  const { data: unitData, isLoading: isLoadingUnits, error: unitError } = useGetUnitQuery(
    { caseId },
    {
      skip: !open || !caseId,
      refetchOnMountOrArgChange: true
    }
  )

  const areaList = useMemo(() =>
    JSON.parse(localStorage.getItem("area") ?? "[]") as Area[], []
  );

  const availableOfficers = useMemo(() => {
    if (!unitData?.data) return []

    return unitData.data.filter((officer) => {
      return !sopUnitLists.some((assignedUnit) =>
        assignedUnit.unitId === officer.unitId
      );
    })
  }, [unitData?.data, sopUnitLists])

  useEffect(() => {
    if (open) {
      setSelectedOfficerIds(assignedOfficers.map((officer) => officer.unitId))
    } else {
      setSelectedOfficerIds([])
      setSearchTerm("")
      setViewMode("all")
    }
    setDisableAssign(false)
  }, [open, assignedOfficers])

  const { t, language } = useTranslation();

  // --- Per-officer signals (workload, assigned cases, ETA/TTL) ---------------
  // Each of the three is fetched/computed independently and fails on its own:
  // none of them gate the base roster below, each other, or the Assign action.

  const officerIds = useMemo(
    () => availableOfficers.map((officer) => officer.unitId),
    [availableOfficers]
  )

  // One bulk call for the whole visible roster — never one call per officer.
  const {
    byUnitId: workloadByUnitId,
    isLoading: isWorkloadLoading,
    isError: isWorkloadError,
    refetch: refetchWorkloads,
  } = useUnitWorkloads({ unitIds: officerIds, enabled: open })

  // The open case's location, for the on-demand per-row route solves. Strings on
  // CaseSop; NaN here just means "no case location" and the cell says so.
  const caseLocation = useMemo<MapLatLon | null>(() => {
    const latitude = Number(caseData?.caseLat)
    const longitude = Number(caseData?.caseLon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    if (latitude === 0 && longitude === 0) return null
    return { latitude, longitude }
  }, [caseData?.caseLat, caseData?.caseLon])

  const officerRoutes = useOfficerRouteSolves({ officers: availableOfficers, caseLocation })

  const filteredOfficers = useMemo(() => {
    if (!searchTerm.trim()) return availableOfficers
    const searchLower = searchTerm.toLowerCase()
    return availableOfficers.filter((officer) =>
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
  }, [availableOfficers, searchTerm])

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
  const displayedOfficers = useMemo(() => {
    if (viewMode !== "recommend") return sortedOfficers

    const rank = (unitId: string) => {
      const entry = workloadByUnitId[unitId]
      if (!entry) return { load: Number.POSITIVE_INFINITY, cases: Number.POSITIVE_INFINITY }
      return { load: entry.activeCaseCount, cases: entry.cases.length }
    }

    return [...sortedOfficers].sort((a, b) => {
      const rankA = rank(a.unitId)
      const rankB = rank(b.unitId)
      if (rankA.load !== rankB.load) return rankA.load - rankB.load
      return rankA.cases - rankB.cases
    })
  }, [viewMode, sortedOfficers, workloadByUnitId])

  const handleSelectOfficer = (officerId: string) => {
    setSelectedOfficerIds(prev =>
      prev.includes(officerId)
        ? prev.filter(id => id !== officerId)
        : [...prev, officerId]
    )
  }

  // "Select all" acts on the visible (filtered) rows only, so a search term
  // narrows what the header checkbox can add or remove.
  const isAllFilteredSelected = useMemo(() => {
    if (filteredOfficers.length === 0) return false
    return filteredOfficers.every(officer => selectedOfficerIds.includes(officer.unitId))
  }, [filteredOfficers, selectedOfficerIds])

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredOfficers.length === 0) return false
    return !isAllFilteredSelected && filteredOfficers.some(officer => selectedOfficerIds.includes(officer.unitId))
  }, [filteredOfficers, selectedOfficerIds, isAllFilteredSelected])

  const handleSelectAll = () => {
    const filteredIds = filteredOfficers.map(officer => officer.unitId)
    if (isAllFilteredSelected) {
      setSelectedOfficerIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      setSelectedOfficerIds(prev => Array.from(new Set([...prev, ...filteredIds])))
    }
  }

  // Selected officer objects for the summary badges.
  const selectedOfficerObjects = useMemo(
    () => availableOfficers.filter(officer => selectedOfficerIds.includes(officer.unitId)),
    [availableOfficers, selectedOfficerIds]
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
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-xl mt-2 md:mt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("recommend")}
              aria-pressed={viewMode === "recommend"}
              className={viewMode === "recommend"
                ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}
            >
              {t("case.assign_officer_modal.recommend_button")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("all")}
              aria-pressed={viewMode === "all"}
              className={viewMode === "all"
                ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}
            >
              {t("case.assign_officer_modal.allofficer_button")}
            </Button>
          </div>
        </div>

        {/* Officers Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar">
            <div className="min-w-[1180px]">
              {/* Table Header */}
              <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <div className="py-5 px-4 w-12 flex items-center justify-center">
                    <UnifiedCheckbox
                      checked={isAllFilteredSelected}
                      indeterminate={isSomeFilteredSelected}
                      onChange={handleSelectAll}
                    />
                  </div>
                  <div className={`${OFFICER_GRID_COLS} flex-1 pr-10`}>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.name")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.status")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.area")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.skills")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.workloads")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.assigned_cases")}</div>
                    <div className="flex items-center justify-center">{t("case.assign_officer_modal.eta_ttl")}</div>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div>
                <ScrollArea className="h-full">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedOfficers.length === 0 ? (
                      <div className="flex justify-center items-center text-center text-gray-500 dark:text-gray-400 py-4">
                        {availableOfficers.length === 0 ? t("case.assign_officer_modal.no_officer") : t("case.assign_officer_modal.not_match_officer")}
                      </div>
                    ) : (
                      displayedOfficers.map((officer) => {
                        const isSelected = selectedOfficerIds.includes(officer.unitId)
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
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleSelectOfficer(officer.unitId)
                                }}
                              />
                            </div>
                            <div
                              className={`${OFFICER_GRID_COLS} flex-1 py-3 pr-10 cursor-pointer`}
                              onClick={() => {
                                setShowOFFicerData(officer)
                              }}
                            >
                              <div className="flex items-center mx-4 space-x-2">
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
                              </div>
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const status = unitStatusConfig.find(column => column.group.includes(officer.sttId));
                                  return (
                                    <div className=" flex items-center ">
                                      <div className={`w-3 h-3 rounded-full mx-1 ${officer.isLogin ? "bg-green-500" : "bg-red-500"}`}>
                                      </div>
                                      <Badge
                                        color={status?.color || "secondary"}
                                        variant={status?.variant || "light"}
                                      >
                                        {unitStatus.find(column => column.sttId.includes(officer.sttId))?.sttName || "-"}
                                      </Badge>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center justify-center text-gray-600 dark:text-gray-300">
                                {(() => {
                                  const matchedArea = areaList.find(
                                    item =>
                                      caseData?.provId === item.provId &&
                                      caseData?.countryId === item.countryId &&
                                      caseData?.distId === item.distId
                                  );
                                  return matchedArea ? mergeArea(matchedArea, language) : "-";
                                })()}
                              </div>
                              <div className="flex items-center justify-center">
                                <SkillsDisplay skills={officer.skillLists || []} language={language} />
                              </div>
                              {/* Workload — plain count of active/open assigned cases. */}
                              <div className="flex items-center justify-center">
                                <OfficerWorkloadCell
                                  count={workloadByUnitId[officer.unitId]?.activeCaseCount}
                                  isLoading={isWorkloadLoading}
                                  isError={isWorkloadError}
                                  onRetry={refetchWorkloads}
                                />
                              </div>
                              {/* Currently assigned cases — count, click to expand the list. */}
                              <div className="flex items-center justify-center">
                                <OfficerAssignedCasesCell
                                  cases={workloadByUnitId[officer.unitId]?.cases}
                                  count={workloadByUnitId[officer.unitId]?.activeCaseCount}
                                  isLoading={isWorkloadLoading}
                                  isError={isWorkloadError}
                                  onRetry={refetchWorkloads}
                                />
                              </div>
                              {/* ETA / TTL — solved on demand, per row only. */}
                              <div className="flex items-center justify-center">
                                <OfficerEtaTtlCell
                                  state={officerRoutes.routeStateFor(officer.unitId)}
                                  canSolve={officerRoutes.canSolve(officer.unitId)}
                                  cooldownSeconds={officerRoutes.cooldownSeconds(officer.unitId)}
                                  onSolve={() => officerRoutes.solve(officer.unitId)}
                                />
                              </div>
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