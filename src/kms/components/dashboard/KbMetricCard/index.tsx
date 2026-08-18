import type { DashboardMetricTone } from "@/kms/dashboard/dtos/dashboard.dto";

interface KbMetricCardProps {
  title: string;
  value: string;
  changeLabel: string;
  description: string;
  tone: DashboardMetricTone;
}

const toneStyles: Record<
  DashboardMetricTone,
  {
    surface: string;
    line: string;
    chip: string;
  }
> = {
  sky: {
    surface:
      "from-sky-500/15 via-sky-500/5 to-white dark:from-sky-500/20 dark:via-sky-500/8 dark:to-slate-950",
    line: "stroke-sky-500",
    chip: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
  },
  violet: {
    surface:
      "from-violet-500/15 via-violet-500/5 to-white dark:from-violet-500/20 dark:via-violet-500/8 dark:to-slate-950",
    line: "stroke-violet-500",
    chip: "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
  },
  emerald: {
    surface:
      "from-emerald-500/15 via-emerald-500/5 to-white dark:from-emerald-500/20 dark:via-emerald-500/8 dark:to-slate-950",
    line: "stroke-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  amber: {
    surface:
      "from-amber-500/18 via-amber-500/6 to-white dark:from-amber-500/20 dark:via-amber-500/8 dark:to-slate-950",
    line: "stroke-amber-500",
    chip: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
};

const KbMetricCard = ({
  title,
  value,
  changeLabel,
  description,
  tone,
}: KbMetricCardProps) => {
  const palette = toneStyles[tone];
  changeLabel=changeLabel??"";

  return (
    <article
      className={`overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br p-5 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.55)] dark:border-white/10 ${palette.surface}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </article>
  );
};

export default KbMetricCard;
