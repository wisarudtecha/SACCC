import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useAuth } from "@/core/hooks/useAuth";
import reportConfig from "./reportConfig.json";
import { resolveJasperLogin } from "./jasperCredentials";
import { openJasperReport } from "./openReport";
import type { ReportConfig } from "@/cms/types/report";

const REPORT_CATALOGUE = reportConfig as ReportConfig;
const REPORT_GROUPS = REPORT_CATALOGUE.groups;

function ReportComponent() {
    const { t, language } = useTranslation();
    const { state } = useAuth();
    const jasperUrl = import.meta.env.VITE_JASPER_URL;
    const location = useLocation();

    // Jasper signs in as "<tenant>_<username>" (SKYICT_wisarud.tec) with the
    // tenant's default password (Skyict@123) — both rules live in
    // reportConfig.json. A null half makes openReport fall back to the shared
    // account and warn, rather than sending a half-built username or a made-up
    // password.
    const jasperLogin = resolveJasperLogin(REPORT_CATALOGUE, {
        tenant: state.user?.organization,
        username: state.user?.username,
    });

    useEffect(() => {
        if (!location.hash) {
            return;
        }
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [location.hash]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {REPORT_GROUPS.map((group) => (
                <div key={group.id} id={`report-group-${group.id}`} className="space-y-6 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t(group.title)}
                    </h2>

                    {group.sections.map((section) => (
                        <div
                            key={section.id}
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden mb-8"
                        >
                            <div className="overflow-auto custom-scrollbar">
                                <table className="min-w-full table-auto">
                                    <thead className="bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                                {t(section.title)}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {section.child.length === 0 ? (
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">
                                                    {t("common.no_data")}
                                                </td>
                                            </tr>
                                        ) : (
                                            section.child.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    onClick={() => openJasperReport(jasperUrl + item.url, language, jasperLogin)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-400">
                                                            {t(item.title)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default ReportComponent;
