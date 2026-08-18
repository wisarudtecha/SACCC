import type { ReactNode } from "react";

interface KbSectionCardProps {
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}

const KbSectionCard = ({
  title,
  description,
  children,
  aside,
  className = "",
}: KbSectionCardProps) => {
  return (
    <section
      className={`rounded-[28px]  bg-white/95 p-5  backdrop-blur dark:border-white/10 dark:bg-slate-950/70 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
};

export default KbSectionCard;
