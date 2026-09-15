import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import DispatchDashboard from "@/cms/components/dashboard/DispatchDashboard";
import { useTranslation } from "@/core/hooks/useTranslation";

function DispatchDashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageMeta
        title="Dispatch Dashboard | Cloud Contact Center"
        description="Central command-center view of open events, officer status, incident density, and live performance indicators."
      />

      <PageBreadcrumb pageTitle={t("navigation.sidebar.main.dashboard.nested.dispatch")} />
      <DispatchDashboard />
    </div>
  );
}

export default DispatchDashboardPage;
