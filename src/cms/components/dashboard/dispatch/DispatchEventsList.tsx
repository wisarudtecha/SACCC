// src/cms/components/dashboard/dispatch/DispatchEventsList.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Case } from "@/cms/store/api/caseApi";
import { useGetCaseStatusesQuery } from "@/cms/store/api/serviceApi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { DateStringToAgoFormat } from "@/cms/components/date/DateToString";

const PANEL_HEIGHT = 480;
const STATUS_LIST_LENGTH = 100;
const DEFAULT_STATUS_COLOR = "#6b7280";

interface DispatchEventsListProps {
  events: Case[];
  isLoading: boolean;
}

export const DispatchEventsList: React.FC<DispatchEventsListProps> = ({ events, isLoading }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { data: statusData } = useGetCaseStatusesQuery({ start: 0, length: STATUS_LIST_LENGTH });

  const statusById = new Map((statusData?.data ?? []).map(status => [status.statusId, status]));

  if (isLoading) {
    return <Skeleton height={PANEL_HEIGHT} />;
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboard.dispatch.events_empty")}</p>
    );
  }

  return (
    <div
      className="space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      style={{ maxHeight: PANEL_HEIGHT }}
    >
      {events.map(caseRecord => {
        const status = statusById.get(caseRecord.statusId);
        const statusLabel = status ? (language === "th" ? status.th : status.en) : caseRecord.statusId;

        return (
          <button
            key={caseRecord.id}
            type="button"
            onClick={() => navigate(`/case/${caseRecord.caseId}`)}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {caseRecord.caseId}
              </div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                {caseRecord.caselocAddr || t("dashboard.dispatch.no_address")}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: status?.color || DEFAULT_STATUS_COLOR }}
              >
                {statusLabel}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {DateStringToAgoFormat(caseRecord.receivedDate, language)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DispatchEventsList;
