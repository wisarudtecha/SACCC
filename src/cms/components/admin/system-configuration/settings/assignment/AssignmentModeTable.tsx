// Assignment mode per case sub-type, as a HIERARCHY: case type (parent, collapsible)
// > case sub-type (leaf) x two stages (PIC / case assignment).
//
// Why a hierarchy rather than a flat list: the stored `caseSubTypes` ids belong to case
// TYPES, and an admin reasons about them that way ("the Fire types", "the Flood types").
// A flat list of `101-Fire-Alarm` strings hides that grouping and gets long fast. The
// expand/chevron/folder treatment is the same one the project already uses for the
// Service and Area hierarchies.
//
// The cell control is `StageModeControl` (a real radiogroup segmented control), not a
// dropdown: three fixed options with no search do not belong behind a click.
//
// "Not set" is the ABSENCE of an entry, not a third token: there is no org-wide default
// left to inherit (decision U2), so the editor has to be able to express it.
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  ASSIGNMENT_MODE_TARGETS,
  type AssignmentModeEntry,
  type AssignmentModeTarget,
} from "@/core/types/organization";
import {
  collectAssignmentModeSubTypeIds,
  getAssignmentModeForSubType,
  setAssignmentModeForSubType,
} from "@/cms/utils/orgAssignmentMode";
import { useGetCaseTypesSubTypesQuery } from "@/cms/store/api/serviceApi";
import type { CaseTypeSubType } from "@/cms/types/case";
import { SubsectionCard } from "../map/settingsControls";
import { StageModeControl } from "./StageModeControl";

const COLUMN_LABEL_KEYS: Record<AssignmentModeTarget, string> = {
  pic: "settings.assignment.mode_table.column_pic",
  assignment: "settings.assignment.mode_table.column_assignment",
};

/** Groups that have no catalogue entry get their own trailing section. */
const ORPHAN_GROUP_ID = "__uncatalogued__";

interface ModeRow {
  id: string;
  label: string;
  /** Set when the id is not in the catalogue - rendered as a prefix, translated at render time. */
  labelKey?: string;
}

interface ModeGroup {
  id: string;
  label: string;
  labelKey?: string;
  rows: ModeRow[];
}

interface AssignmentModeTableProps {
  entries: AssignmentModeEntry[];
  onChange: (entries: AssignmentModeEntry[]) => void;
  /** The shell's validation message for this table, when Save was blocked. */
  errorKey?: string;
}

export function AssignmentModeTable({
  entries,
  onChange,
  errorKey,
}: AssignmentModeTableProps) {
  const { t, language } = useTranslation();
  const { data, isLoading } = useGetCaseTypesSubTypesQuery(null);

  // Collapsed group ids. Default = all expanded, because the point of the screen is to
  // see (and set) the modes; collapsing is the opt-in.
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const groups = useMemo<ModeGroup[]>(() => {
    const catalogue = (data?.data as CaseTypeSubType[]) ?? [];
    const byType = new Map<string, ModeGroup>();
    const cataloguedIds = new Set<string>();

    for (const item of catalogue) {
      const typeName = language === "th" ? item.th : item.en;
      const group = byType.get(item.typeId) ?? {
        id: item.typeId,
        label: typeName || item.typeId,
        rows: [],
      };
      const subTypeName = language === "th" ? item.subTypeTh : item.subTypeEn;
      group.rows.push({
        id: item.sTypeId,
        label: `${item.sTypeCode || ""}-${subTypeName || ""}`,
      });
      byType.set(item.typeId, group);
      cataloguedIds.add(item.sTypeId);
    }

    // A stored id the catalogue no longer returns keeps a row: hiding it would leave an
    // entry that can neither be seen nor cleared.
    const orphans = collectAssignmentModeSubTypeIds(entries)
      .filter((id) => !cataloguedIds.has(id))
      .map((id) => ({ id, label: id, labelKey: "settings.assignment.mode_table.unknown_sub_type" }));

    const result = [...byType.values()];
    if (orphans.length > 0) {
      result.push({
        id: ORPHAN_GROUP_ID,
        label: "",
        labelKey: "settings.assignment.mode_table.unknown_group",
        rows: orphans,
      });
    }
    return result;
  }, [data, entries, language]);

  const renderRowLabel = (row: ModeRow) =>
    row.labelKey ? `${t(row.labelKey)}: ${row.label}` : row.label;

  return (
    <SubsectionCard titleKey="settings.assignment.mode_table.title">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("settings.assignment.mode_table.help")}
      </p>

      {/* The copy promises automatic routing and no engine consumes these values yet
          (decisions D18 / U3) - the note moved here with the control. */}
      <p className="text-xs text-amber-700 dark:text-amber-400">
        {t("settings.assignment.field.mode.engine_unavailable")}
      </p>

      {errorKey && <p className="text-xs text-red-500 dark:text-red-400">{t(errorKey)}</p>}

      {!isLoading && groups.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.assignment.mode_table.empty")}
        </p>
      )}

      {groups.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  scope="col"
                  className="pb-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {t("settings.assignment.mode_table.column_sub_types")}
                </th>
                {ASSIGNMENT_MODE_TARGETS.map((type) => (
                  <th
                    key={type}
                    scope="col"
                    className="pb-2 pl-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {t(COLUMN_LABEL_KEYS[type])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.id);
                return (
                  <Fragment key={group.id}>
                    <tr className="bg-gray-50/80 dark:bg-white/[0.03]">
                      <th colSpan={3} scope="colgroup" className="py-1.5 pr-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          aria-expanded={!isCollapsed}
                          className="inline-flex items-center gap-2 rounded px-1 py-0.5 font-semibold text-gray-800 hover:bg-gray-200/70 dark:text-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          )}
                          {isCollapsed ? (
                            <Folder className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                          ) : (
                            <FolderOpen className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                          )}
                          <span>{group.labelKey ? t(group.labelKey) : group.label}</span>
                          <span className="rounded bg-gray-200 px-1.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {group.rows.length}
                          </span>
                        </button>
                      </th>
                    </tr>

                    {!isCollapsed &&
                      group.rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          <th
                            scope="row"
                            className="py-1.5 pl-9 pr-3 text-left text-sm font-normal text-gray-700 dark:text-gray-300"
                          >
                            {renderRowLabel(row)}
                          </th>
                          {ASSIGNMENT_MODE_TARGETS.map((type) => (
                            <td key={type} className="py-1.5 pl-3">
                              <StageModeControl
                                value={getAssignmentModeForSubType(entries, type, row.id)}
                                onChange={(mode) =>
                                  onChange(setAssignmentModeForSubType(entries, type, row.id, mode))
                                }
                                ariaLabel={`${renderRowLabel(row)} - ${t(COLUMN_LABEL_KEYS[type])}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SubsectionCard>
  );
}
