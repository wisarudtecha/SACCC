import React, { useState } from "react";
import {
  FiAlertCircle, FiCheck, FiChevronDown,
  FiChevronUp, FiX,
} from "react-icons/fi";
import { formatBytes } from "../../../common/common.transform.service";
import type { UploadTask } from "../../../files/service/files.service";

interface UploadTasksPanelProps {
  tasks: UploadTask[];
  onDismiss: (id: string) => void;
  onClearDone: () => void;
}

const UploadTasksPanel: React.FC<UploadTasksPanelProps> = ({ tasks, onDismiss, onClearDone }) => {
  const [minimized, setMinimized] = useState(false);

  if (tasks.length === 0) return null;

  const activeCount = tasks.filter((t) => t.status === "uploading").length;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
          )}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Upload tasks{activeCount > 0 ? ` · ${activeCount} active` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClearDone}
            className="rounded-lg px-2 py-1 text-[10px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-white/[0.05] dark:hover:text-slate-300"
          >
            Clear done
          </button>
          <button
            type="button"
            onClick={() => setMinimized((p) => !p)}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 dark:hover:bg-white/[0.05]"
          >
            {minimized ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Task list */}
      {!minimized && (
        <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-white/[0.05]">
          {tasks.map((task) => {
            const pct = task.totalBytes > 0 ? (task.bytesUploaded / task.totalBytes) * 100 : 0;
            const isDone = task.status === "done";
            const isError = task.status === "error";

            return (
              <div key={task.id} className="px-4 py-3">
                {/* File name row */}
                <div className="mb-1.5 flex items-center gap-2">
                  {isDone ? (
                    <FiCheck size={12} className="shrink-0 text-emerald-500" />
                  ) : isError ? (
                    <FiAlertCircle size={12} className="shrink-0 text-rose-500" />
                  ) : (
                    <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    {task.name}
                  </span>
                  {(isDone || isError) && (
                    <button
                      type="button"
                      onClick={() => onDismiss(task.id)}
                      className="shrink-0 rounded p-0.5 text-slate-300 transition hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                    >
                      <FiX size={11} />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      isDone
                        ? "bg-emerald-500"
                        : isError
                          ? "bg-rose-500"
                          : "bg-sky-500"
                    }`}
                    style={{ width: `${isDone ? 100 : pct}%` }}
                  />
                </div>

                {/* Stats */}
                {isError ? (
                  <p className="text-[10px] text-rose-400">{task.error ?? "Upload failed"}</p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(task.bytesUploaded)} uploaded, {formatBytes(task.totalBytes)} total
                    {" · "}
                    {pct.toFixed(2)}%
                    {task.speed > 512 && ` (${formatBytes(task.speed)}/s)`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadTasksPanel;
