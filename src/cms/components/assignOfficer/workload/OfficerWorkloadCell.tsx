// The "Work Loads" column cell for one officer row in singleAssignOfficer.tsx.
//
// v1 is a plain count/badge — no severity/threshold colouring (Decision #8).
// Loading / empty / error are handled here and here only: whatever this renders,
// the rest of the row (name, status, area, skills, the checkbox, Assign) keeps
// working.
import { memo } from "react";
import Badge from "@/core/components/ui/badge/Badge";
import { useTranslation } from "@/core/hooks/useTranslation";

interface OfficerWorkloadCellProps {
  /** Count of the officer's currently active/open assigned cases. */
  count?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function OfficerWorkloadCellBase({ count, isLoading, isError, onRetry }: OfficerWorkloadCellProps) {
  const { t } = useTranslation();

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
        {t("case.assign_officer_modal.workload_load_error")}
      </button>
    );
  }

  if (typeof count !== "number") {
    return <span className="text-xs text-gray-400 dark:text-gray-500">-</span>;
  }

  return (
    <Badge variant="light" color={count === 0 ? "success" : "secondary"}>
      {count}
    </Badge>
  );
}

export const OfficerWorkloadCell = memo(OfficerWorkloadCellBase);
OfficerWorkloadCell.displayName = "OfficerWorkloadCell";

export default OfficerWorkloadCell;
