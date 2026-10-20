// Compact Case Preview, opened by clicking a caseId in the assigned-cases list
// (OfficerAssignedCasesCell).
//
// Renders straight from the embedded workloadCases entry whenever it carries
// any display field. Only a BARE entry (caseId alone — see needsCaseFetch) falls
// back to a lazy getCaseByIdMutation lookup (`/case/caseId/{id}`), one call per
// open; the mutation endpoint does not cache, so the entry-first rule is what
// keeps this cheap. A fetch failure degrades to whatever the entry carries —
// the preview never blocks and never errors the roster.
//
// Positioning follows the MentionUserPopover pattern: fixed below the anchor,
// clamped into the viewport, closed by Escape or an outside click. Clicks are
// stopped from bubbling so the popover never opens OfficerDetailModal or
// toggles the row selection it sits inside.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCaseByIdMutationMutation } from "@/cms/store/api/caseApi";
import type { UnitWorkloadCase } from "@/cms/types/unitWorkload";
import {
  needsCaseFetch,
  resolveCasePreviewFields,
  type CasePreviewRemote
} from "./unitWorkloadAdapter";

const POPOVER_WIDTH = 288; // w-72
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP_PX = 6;

interface CasePreviewPopoverProps {
  /** The workloadCases entry the user clicked. Its caseId is always present. */
  entry: UnitWorkloadCase;
  /** Click-target rect, from the button's getBoundingClientRect(). */
  anchorRect: DOMRect;
  onClose: () => void;
}

function formatCreatedDate(value: string): string {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : value;
}

export function CasePreviewPopover({ entry, anchorRect, onClose }: CasePreviewPopoverProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [getCaseById] = useGetCaseByIdMutationMutation();
  const [remote, setRemote] = useState<CasePreviewRemote | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchError, setIsFetchError] = useState(false);

  useEffect(() => {
    if (!needsCaseFetch(entry)) {
      return;
    }
    let cancelled = false;
    setIsFetching(true);
    setIsFetchError(false);
    getCaseById({ caseId: entry.caseId })
      .unwrap()
      .then((response) => {
        if (cancelled) {
          return;
        }
        // Shape guard, not truthiness: an envelope that resolves with no usable
        // data object leaves the preview on entry fields only.
        const candidate = response?.data;
        setRemote(candidate && typeof candidate === "object" ? candidate : null);
      })
      .catch(() => {
        if (!cancelled) {
          setIsFetchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [entry, getCaseById]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchorRect.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN)
  );
  const top = anchorRect.bottom + ANCHOR_GAP_PX;

  const fields = resolveCasePreviewFields(entry, remote);

  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: "caseId", label: t("case.assign_officer_modal.case_preview_case_id"), value: fields.caseId },
    {
      key: "caseNumber",
      label: t("case.assign_officer_modal.case_preview_case_number"),
      value: fields.caseNumber ?? ""
    },
    {
      key: "statusId",
      label: t("case.assign_officer_modal.case_preview_status"),
      value: fields.statusId ?? ""
    },
    {
      key: "priority",
      label: t("case.assign_officer_modal.case_preview_priority"),
      value: fields.priority !== undefined ? String(fields.priority) : ""
    },
    {
      key: "createdDate",
      label: t("case.assign_officer_modal.case_preview_created"),
      value: fields.createdDate ? formatCreatedDate(fields.createdDate) : ""
    }
  ].filter((row) => row.value !== "");

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={t("case.assign_officer_modal.case_preview_title")}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      style={{ position: "fixed", top, left, width: POPOVER_WIDTH }}
      className="z-1000000 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("case.assign_officer_modal.case_preview_title")}
      </p>
      <dl className="space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{row.label}</dt>
            <dd className="truncate text-xs font-medium text-gray-900 dark:text-gray-100" title={row.value}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {isFetching && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      )}
      {isFetchError && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {t("case.assign_officer_modal.case_preview_load_error")}
        </p>
      )}
    </div>
  );
}

export default CasePreviewPopover;
