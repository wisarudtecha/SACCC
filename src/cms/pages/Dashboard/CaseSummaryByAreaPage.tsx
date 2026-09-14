import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import CaseSummaryByAreaDashboard from "@/cms/components/dashboard/CaseSummaryByAreaDashboard";
import { useTranslation } from "@/core/hooks/useTranslation";

function CaseSummaryByAreaPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageMeta
        title="Case Summary by Area | Cloud Contact Center"
        description="Case counts broken down by district and category, updated in real time."
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.dashboard.nested.case_summary_by_area")} />
      <CaseSummaryByAreaDashboard />
    </div>
  );
}

export default CaseSummaryByAreaPage;
