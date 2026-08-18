import { useTranslation } from "@/core/hooks/useTranslation";

import PageMeta from "@/kms/components/common/PageMeta";
import FileManagerPanel from "@/kms/components/files/FileManagerPanel";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
const FilesPage = () => {
  const permissions = usePermissions();
  if (!permissions.hasPermission(KbPermission.KB_FILE_VIEW)) {
    return <NotFound />;
  }
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={t("knowledge.files.page.metaTitle")}
        description={t("knowledge.files.page.metaDescription")}
      />

      <div className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.20),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.95),_rgba(248,250,252,0.98))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_26%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] sm:rounded-[32px] sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.16),_transparent_58%)] lg:block" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400">
              {t("knowledge.files.page.eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {t("knowledge.files.page.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t("knowledge.files.page.subtitle")}
            </p>
          </div>
        </section>

        {/* File manager panel — includes built-in sidebar, toolbar, grid, preview, toasts */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:rounded-[28px]">
          <FileManagerPanel heightCls="min-h-[520px]" />
        </section>
      </div>
    </>
  );
};

export default FilesPage;
