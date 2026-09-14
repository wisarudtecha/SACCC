// src/cms/components/dashboard/CaseSummaryByAreaTable.tsx
import React, { useMemo, useState } from "react";
import { ChevronDownIcon } from "@/core/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/core/components/ui/table";
import { pickText, statusLabels } from "@/core/components/custom-dashboard/widgets/chartTheme";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Language } from "@/core/config/i18n";
import type { CaseAreaRow, CaseAreaStatusTotals } from "@/core/components/custom-dashboard/sources/types";

type SortKey = "area" | "new" | "inprogress" | "complete" | "rowTotal";
type SortDirection = "asc" | "desc";

interface CaseSummaryByAreaTableProps {
  rows: CaseAreaRow[];
  total?: CaseAreaRow;
}

const headerCellClass = "px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400";
const bodyCellClass = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

/** Displayed New/In Progress/Complete for a row: the row total, or one category's numbers when filtered. */
const getDisplayedTotals = (row: CaseAreaRow, selectedCategory: string | null): CaseAreaStatusTotals => {
  if (!selectedCategory) {
    return row.total;
  }
  const group = row.groups.find(candidate => candidate.label.en === selectedCategory);
  return group ?? { complete: 0, inprogress: 0, new: 0 };
};

const rowTotalOf = (totals: CaseAreaStatusTotals): number => totals.complete + totals.inprogress + totals.new;

const sortValue = (row: CaseAreaRow, key: SortKey, selectedCategory: string | null, language: Language): number | string => {
  if (key === "area") {
    return language === "th" ? row.area.th : row.area.en;
  }
  const totals = getDisplayedTotals(row, selectedCategory);
  if (key === "rowTotal") {
    return rowTotalOf(totals);
  }
  return totals[key];
};

const SortButton: React.FC<{
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}> = ({ label, active, direction, onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
    {label}
    {active && (
      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${direction === "asc" ? "rotate-180" : ""}`} />
    )}
  </button>
);

export const CaseSummaryByAreaTable: React.FC<CaseSummaryByAreaTableProps> = ({ rows, total }) => {
  const { language, t } = useTranslation();
  const labels = statusLabels(language);

  const [expandedAreaIds, setExpandedAreaIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("area");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const categories = useMemo(() => {
    const source = total?.groups.length ? total.groups : rows[0]?.groups ?? [];
    return source.map(group => group.label);
  }, [rows, total]);

  const groupedByProvince = useMemo(() => {
    const buckets = new Map<string, CaseAreaRow[]>();
    rows.forEach(row => {
      const key = row.provId ?? "—";
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(row);
      }
      else {
        buckets.set(key, [row]);
      }
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    buckets.forEach(bucket => {
      bucket.sort((a, b) => {
        const valueA = sortValue(a, sortKey, selectedCategory, language);
        const valueB = sortValue(b, sortKey, selectedCategory, language);
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
      });
    });

    return buckets;
  }, [rows, sortKey, sortDirection, selectedCategory, language]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(previous => (previous === "asc" ? "desc" : "asc"));
    }
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const toggleExpanded = (areaId: string) => {
    setExpandedAreaIds(previous => {
      const next = new Set(previous);
      if (next.has(areaId)) {
        next.delete(areaId);
      }
      else {
        next.add(areaId);
      }
      return next;
    });
  };

  const totalTotals = total ? getDisplayedTotals(total, selectedCategory) : undefined;

  return (
    <div className="space-y-4">
      {totalTotals && (
        <div className="flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("dashboard.case_summary_by_area.total_row")}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{labels.new}: <span className="font-semibold text-gray-900 dark:text-white">{totalTotals.new}</span></span>
            <span className="text-gray-500 dark:text-gray-400">{labels.inProgress}: <span className="font-semibold text-gray-900 dark:text-white">{totalTotals.inprogress}</span></span>
            <span className="text-gray-500 dark:text-gray-400">{labels.complete}: <span className="font-semibold text-gray-900 dark:text-white">{totalTotals.complete}</span></span>
            <span className="text-gray-500 dark:text-gray-400">{t("dashboard.case_summary_by_area.row_total")}: <span className="font-semibold text-gray-900 dark:text-white">{rowTotalOf(totalTotals)}</span></span>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.case_summary_by_area.category_filter")}
          </label>
          <select
            value={selectedCategory ?? ""}
            onChange={event => setSelectedCategory(event.target.value || null)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">{t("dashboard.case_summary_by_area.all_categories")}</option>
            {categories.map(category => (
              <option key={category.en} value={category.en}>{pickText(category, language)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <Table className="divide-y divide-gray-200 dark:divide-gray-700">
          <TableHeader className="bg-gray-50 dark:bg-gray-900">
            <TableRow>
              <TableCell isHeader className={headerCellClass}>
                <SortButton label={t("dashboard.case_summary_by_area.district")} active={sortKey === "area"} direction={sortDirection} onClick={() => toggleSort("area")} />
              </TableCell>
              <TableCell isHeader className={headerCellClass}>
                <SortButton label={labels.new} active={sortKey === "new"} direction={sortDirection} onClick={() => toggleSort("new")} />
              </TableCell>
              <TableCell isHeader className={headerCellClass}>
                <SortButton label={labels.inProgress} active={sortKey === "inprogress"} direction={sortDirection} onClick={() => toggleSort("inprogress")} />
              </TableCell>
              <TableCell isHeader className={headerCellClass}>
                <SortButton label={labels.complete} active={sortKey === "complete"} direction={sortDirection} onClick={() => toggleSort("complete")} />
              </TableCell>
              <TableCell isHeader className={headerCellClass}>
                <SortButton label={t("dashboard.case_summary_by_area.row_total")} active={sortKey === "rowTotal"} direction={sortDirection} onClick={() => toggleSort("rowTotal")} />
              </TableCell>
              <TableCell isHeader className={headerCellClass}>{null}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from(groupedByProvince.entries()).map(([provId, provinceRows]) => (
              <React.Fragment key={provId}>
                <TableRow className="bg-gray-50 dark:bg-gray-900/60">
                  <td colSpan={6} className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    {`${t("dashboard.case_summary_by_area.province")}: ${provId}`}
                  </td>
                </TableRow>
                {provinceRows.map(row => {
                  const totals = getDisplayedTotals(row, selectedCategory);
                  const isExpanded = expandedAreaIds.has(row.areaId);
                  return (
                    <React.Fragment key={row.areaId}>
                      <TableRow>
                        <TableCell className={bodyCellClass}>{pickText(row.area, language)}</TableCell>
                        <TableCell className={bodyCellClass}>{totals.new}</TableCell>
                        <TableCell className={bodyCellClass}>{totals.inprogress}</TableCell>
                        <TableCell className={bodyCellClass}>{totals.complete}</TableCell>
                        <TableCell className={`${bodyCellClass} font-medium`}>{rowTotalOf(totals)}</TableCell>
                        <TableCell className={bodyCellClass}>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.areaId)}
                            aria-label={t("dashboard.case_summary_by_area.view_breakdown")}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <td colSpan={6} className="bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {row.groups.map(group => (
                                  <tr key={group.label.en}>
                                    <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300">{pickText(group.label, language)}</td>
                                    <td className="py-1.5 pr-4 text-gray-500 dark:text-gray-400">{labels.new}: {group.new}</td>
                                    <td className="py-1.5 pr-4 text-gray-500 dark:text-gray-400">{labels.inProgress}: {group.inprogress}</td>
                                    <td className="py-1.5 text-gray-500 dark:text-gray-400">{labels.complete}: {group.complete}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CaseSummaryByAreaTable;
