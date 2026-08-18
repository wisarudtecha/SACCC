import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

interface SourceToastItem {
  id: number;
  tone: "success" | "error";
  message: string;
}

interface SourceToastStackProps {
  toasts: SourceToastItem[];
  onDismiss: (id: number) => void;
}

const toneClassMap: Record<
  SourceToastItem["tone"],
  { icon: React.ReactNode; panel: string; iconWrap: string }
> = {
  success: {
    icon: <FiCheckCircle />,
    panel:
      "border-emerald-200/80 bg-white text-slate-700 shadow-[0_18px_48px_-28px_rgba(16,185,129,0.35)] dark:border-emerald-500/20 dark:bg-slate-950/95 dark:text-slate-200",
    iconWrap:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  error: {
    icon: <FiAlertCircle />,
    panel:
      "border-rose-200/80 bg-white text-slate-700 shadow-[0_18px_48px_-28px_rgba(244,63,94,0.35)] dark:border-rose-500/20 dark:bg-slate-950/95 dark:text-slate-200",
    iconWrap:
      "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

const SourceToastStack = ({ toasts, onDismiss }: SourceToastStackProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100000] flex w-[min(92vw,360px)] flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const palette = toneClassMap[toast.tone];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur ${palette.panel}`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${palette.iconWrap}`}
            >
              {palette.icon}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
              aria-label="Dismiss toast"
            >
              <FiX />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SourceToastStack;
