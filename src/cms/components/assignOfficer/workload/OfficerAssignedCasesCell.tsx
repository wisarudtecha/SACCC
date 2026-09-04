// The "Currently assigned cases" column cell for one officer row.
//
// Shows a count; clicking it expands the actual list of case numbers inline
// (Decision #4 — count with expand-to-list). The click is stopped from bubbling
// so it never opens OfficerDetailModal, which the rest of the row does.
//
// Loading / empty / error live here and do not affect anything else on the row.
import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UnitWorkloadCase } from "@/cms/types/unitWorkload";

interface OfficerAssignedCasesCellProps {
  cases?: UnitWorkloadCase[];
  /**
   * Active-case count from the endpoint. Usually equals `cases.length`, but the
   * backend may report a count while returning a capped list — show the count,
   * expand what we actually have.
   */
  count?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function OfficerAssignedCasesCellBase({
  cases,
  count,
  isLoading,
  isError,
  onRetry,
}: OfficerAssignedCasesCellProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <span
        className="inline-block h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        aria-label={t("common.loading")}
      />
    );
  }

  if (isError) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
        className="text-xs text-amber-600 hover:underline dark:text-amber-400"
      >
        {t("case.assign_officer_modal.assigned_cases_error")}
      </button>
    );
  }

  const resolvedCount = typeof count === "number" ? count : cases?.length;

  if (typeof resolvedCount !== "number") {
    return <span className="text-xs text-gray-400 dark:text-gray-500">-</span>;
  }

  if (resolvedCount === 0) {
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {t("case.assign_officer_modal.assigned_cases_none")}
      </span>
    );
  }

  const caseList = cases ?? [];

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((previous) => !previous);
        }}
        disabled={caseList.length === 0}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent dark:text-blue-400 dark:hover:bg-blue-900/20 dark:disabled:text-gray-400"
        aria-expanded={expanded}
      >
        {resolvedCount}
        {caseList.length > 0 &&
          (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>

      {expanded && caseList.length > 0 && (
        <ul className="max-h-24 w-full space-y-0.5 overflow-y-auto rounded bg-gray-50 p-1.5 text-left custom-scrollbar dark:bg-white/5">
          {caseList.map((assignedCase) => (
            <li
              key={assignedCase.caseId}
              className="truncate text-xs text-gray-700 dark:text-gray-300"
              title={assignedCase.caseNumber || assignedCase.caseId}
            >
              {assignedCase.caseNumber || assignedCase.caseId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const OfficerAssignedCasesCell = memo(OfficerAssignedCasesCellBase);
OfficerAssignedCasesCell.displayName = "OfficerAssignedCasesCell";

export default OfficerAssignedCasesCell;
