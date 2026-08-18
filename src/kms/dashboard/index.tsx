import PageMeta from "@/kms/components/common/PageMeta";
import { useTranslation } from "@/core/hooks/useTranslation";
import KbActivityBlock from "@/kms/components/dashboard/KbActivityBlock/index";
import KbArticlesBlock from "@/kms/components/dashboard/KbArticlesBlock/index";
import KbCategoriesBlock from "@/kms/components/dashboard/KbCategoriesBlock/index";
import KbDashboardHero from "@/kms/components/dashboard/KbDashboardHero/index";
import KbMetricsBlock from "@/kms/components/dashboard/KbMetricsBlock/index";
// import KbSearchesBlock from "../components/dashboard/KbSearchesBlock/index";
import KbTrendBlock from "@/kms/components/dashboard/KbTrendBlock/index";
// import KbSectionCard from "../components/dashboard/KbSectionCard/index";
// import { KbTabCardList } from "../components/card-kb-tab";
import { usePermissions } from "@/core/hooks/usePermissions";
import { KbPermission } from "@/kms/common/utils/enumHelper"
import NotFound from "@/core/pages/OtherPage/NotFound";
const Dashboard = () => {
  const { t } = useTranslation();
  const permissions = usePermissions();
  if(!permissions.hasPermission(KbPermission.KB_DASHBOARD_VIEW)){
        return <NotFound />;
  }

  return (
    <>
      <PageMeta
        title={t("knowledge.dashboard.page.metaTitle")}
        description={t("knowledge.dashboard.page.metaDescription")}
      />


      <div className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
        <KbDashboardHero />
        <KbMetricsBlock />

        <section className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
          <KbTrendBlock />
          <div className="space-y-6">
            <KbCategoriesBlock />
            {/* <KbSearchesBlock /> */}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <KbArticlesBlock />
          <KbActivityBlock />
        </section>

        {/* <KbSectionCard
          title="Knowledge Base"
          description="Knowledge repository and FAQs"
        >
          <KbTabCardList />
        </KbSectionCard> */}
      </div>
    </>
  );
};

export default Dashboard;
