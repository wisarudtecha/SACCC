 
import { useTranslation } from "@/core/hooks/useTranslation";
import { useBroadcastBlockData } from "@/kms/broadcast/hook/useBroadcastData";

const BroadcastHero = () => {
   
   const { t } = useTranslation();
  const { isLoading, isError } = useBroadcastBlockData("summary");

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-5 dark:border-white/10 dark:bg-slate-950/70 sm:rounded-[32px] sm:p-8">
        <div className="h-6 w-56 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-[32px] border border-rose-200 bg-rose-50/80 p-6 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
        {t("knowledge.broadcast.labels.loadFailed")}
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.20),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.95),_rgba(248,250,252,0.98))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_26%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] sm:rounded-[32px] sm:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.16),_transparent_58%)] lg:block" />
      <div className="relative grid gap-4">
        <div className="max-w-3xl min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {t("knowledge.broadcast.page.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {t("knowledge.broadcast.page.subtitle")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BroadcastHero;
