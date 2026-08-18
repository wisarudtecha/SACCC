import { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import PageMeta from "@/kms/components/common/PageMeta";
import ArticleFilterBar from "@/kms/components/articles/ArticleFilterBar";
import ArticleListBlock from "@/kms/components/articles/ArticleListBlock";
import ArticleBannerCarousel from "@/kms/components/articles/ArticleBannerCarousel";
import { ArticleFilter } from "@/kms/articles/dtos/articles.dto";
import { useNavigate } from "react-router";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";


const ArticlesPage = () => {
  const permissions = usePermissions();
  if (!permissions.hasAnyPermission([KbPermission.KB_ARTICLE_VIEW, KbPermission.KB_ARTICLE_MGMT_VIEW])) {
    return <NotFound />;
  }
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ArticleFilter>({});
  const navigate = useNavigate();
  return (
    <>
      <PageMeta title={t("knowledge.articles.pageTitle")} description={t("knowledge.articles.pageSubtitle")} />

      <div className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(255,251,235,0.95),_rgba(248,250,252,0.98))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_26%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] sm:rounded-[32px] sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.14),_transparent_58%)] lg:block" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
              Knowledge Base
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {t("knowledge.articles.pageTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t("knowledge.articles.pageSubtitle")}
            </p>
          </div>
        </section>

        {/* Banner carousel */}
        <ArticleBannerCarousel />

        {/* Filter bar */}
        <ArticleFilterBar
          onChange={setFilter}
          showAddButton={permissions.hasAnyPermission([
            KbPermission.KB_ARTICLE_MGMT_CREATE,
          ])}
          onAddArticle={() => {
            navigate("/kms/articles/create");
          }}
        />

        {/* Article list */}
        <ArticleListBlock
          filter={filter}
          onPageChange={(page) => setFilter((f) => ({ ...f, page }))}
        />
      </div>
    </>
  );
};

export default ArticlesPage;
