import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "@/kms/components/common/PageMeta";
import BannerGrid from "@/kms/components/banner/BannerGrid";
import BannerArticleList from "@/kms/components/banner/BannerArticleList";
import {
  useBannerList,
  useAddBanner,
  useRemoveBanner,
  useReorderBanners,
} from "@/kms/banner/hook/useBannerData";
import type { BannerItem, ArticleItem } from "@/kms/banner/dtos/banner.dto";

import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";

const BannerManagementPage = () => {
  const permissions = usePermissions();
  if (!permissions.hasPermission(KbPermission.KB_BANNER_VIEW)) {
    return <NotFound />;
  }

  const isCreate =  permissions.hasPermission(KbPermission.KB_BANNER_CREATE)
  const isDelete =   permissions.hasPermission(KbPermission.KB_BANNER_DELETE)

  const { t,language } = useTranslation();
  

  const { data: banners = [], refetch } = useBannerList(language,'manage');

  const addMutation = useAddBanner();
  const removeMutation = useRemoveBanner();
  const reorderMutation = useReorderBanners();

  const [selectedBanners, setSelectedBanners] = useState<BannerItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingArticleId, setAddingArticleId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedBanners(
      banners.map((b, index) => ({
        ...b,
        id: String(b.id),
        articleId: String(b.articleId),
        order: Number(b.order ?? index + 1),
      })),
    );
  }, [banners]);

  const selectedArticleIds = selectedBanners.map((b) => String(b.articleId));

  const handleReorder = (reordered: BannerItem[]) => {
    setSelectedBanners(reordered);
    setIsDirty(true);
  };

  const handleSave = async () => {
    await reorderMutation.mutateAsync(
      selectedBanners.map((b, index) => ({
        articleId: Number(b.articleId),
        id: Number(b.id),
        order: index + 1,
      })),
    );
    setIsDirty(false);
    await refetch();
  };

  const handleSelect = async (article: ArticleItem) => {
    
    const articleId = String(article.articleId);
    if (selectedBanners.some((b) => String(b.articleId) === articleId)) return;
    setAddingArticleId(articleId);
    try {
      await addMutation.mutateAsync({
        articleId,
        title: article.title,
        description: article.description ?? "",
        url: `/kms/articles/${articleId}`,
        // coverImage: `https://picsum.photos/seed/${articleId}/400/240`,
      });

      await refetch();
    } catch (error) {
      console.error("add banner error", error);
    } finally {
      setAddingArticleId(null);
    }
  };

  const handleRemove = async (id: string) => {
    const bannerId = String(id);
    const oldBanners = selectedBanners;
    setRemovingId(bannerId);
    setSelectedBanners((prev) =>
      prev
        .filter((b) => String(b.id) !== bannerId)
        .map((b, index) => ({
          ...b,
          order: index + 1,
        })),
    );

    try {
      await removeMutation.mutateAsync(bannerId);
      await refetch();
    } catch (error) {
      console.error("remove banner error", error);
      setSelectedBanners(oldBanners);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <PageMeta
        title={t("knowledge.banner.page.metaTitle")}
        description={t("knowledge.banner.page.metaDescription")}
      />
      <div className="space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(255,251,235,0.95),_rgba(248,250,252,0.98))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_26%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] sm:rounded-[32px] sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.14),_transparent_58%)] lg:block" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
              {t("knowledge.banner.page.eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {t("knowledge.banner.page.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t("knowledge.banner.page.subtitle")}
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("knowledge.banner.grid.title")}
            </h2>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-[11px] text-amber-500 dark:text-amber-400">
                  {t("knowledge.banner.grid.unsaved")}
                </span>
              )}

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-white/[0.08] dark:text-slate-400">
                {selectedBanners.length} {t("knowledge.banner.grid.count")}
              </span>
            </div>
          </div>
          <BannerGrid
            banners={selectedBanners}
            isLoading={false}
            removingId={removingId}
            isDirty={isDirty}
            isSaving={reorderMutation.isPending}
            onRemove={handleRemove}
            onReorder={handleReorder}
            onSave={handleSave}
            isDelete={isDelete}
          />
        </div>

        <BannerArticleList
          selectedArticleIds={selectedArticleIds}
          addingArticleId={addingArticleId}
          onSelect={handleSelect}
          isCreate={isCreate}
        />
      </div>
    </DndProvider>
  );
};

export default BannerManagementPage;
