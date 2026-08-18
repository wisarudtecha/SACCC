import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import ReportComponent from "@/cms/components/report/ReportComponet";
import { useTranslation } from "@/core/hooks/useTranslation";

function ReportPage() {
    const { t } = useTranslation()
    return (
        <div>
            <PageMeta
                title="React.js Report | TailAdmin - Next.js Admin Dashboard Template"
                description="This is React.js Report page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
            />

            <PageBreadcrumb pageTitle={t("common.report")} />
            <ReportComponent />
        </div>
    );
};

export default ReportPage;

