// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateDetailView.tsx
/**
 * One area template: its provinces, and the districts of whichever province is
 * selected. Master/detail rather than a tree, because the province and district
 * list endpoints are the authoritative, immediately-consistent view - the
 * template tree is a cache that only refreshes on GenerateTemplateCountryTree.
 */
import React, { useState } from "react";
import { ArrowLeft, History, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateCountryByIdQuery,
  useGetTemplateCountryTreeQuery,
  useGenerateTemplateCountryTreeMutation
} from "@/cms/store/api/areaTemplateApi";
import { ROUTE_PREFIX } from "@/core/router/routePrefix";
import type { TemplateCountry, TemplateCountryTree, TemplateProvince } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { describeGeometry } from "@/cms/utils/areaGeometry";
import AreaTemplateDistrictView from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateDistrictView";
import AreaTemplateProvinceView from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateProvinceView";
import AreaTemplateStatusBadge from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateStatusBadge";
import AreaTreePreview from "@/cms/components/admin/system-configuration/areaTemplate/AreaTreePreview";
import Button from "@/core/components/ui/button/Button";

interface AreaTemplateDetailViewProps {
  templateId: string;
}

const AreaTemplateDetailView: React.FC<AreaTemplateDetailViewProps> = ({ templateId }) => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  const [selectedProvince, setSelectedProvince] = useState<TemplateProvince | null>(null);

  const { data, isLoading } = useGetTemplateCountryByIdQuery(templateId);
  const [generateTree, { isLoading: isGenerating }] = useGenerateTemplateCountryTreeMutation();
  // The cache the regenerate button rebuilds; both share the "AreaTemplate" tag,
  // so a successful regenerate refetches this on its own.
  const { data: treeData, isFetching: isFetchingTree } = useGetTemplateCountryTreeQuery(templateId);

  const template = data?.data as TemplateCountry | undefined;
  const locked = template?.status === "published";

  const handleGenerateTree = async () => {
    try {
      const response = await generateTree(templateId).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response));
      }
      addToast("success", resolveApiMessage(response, t("crud.areaTemplate.action.generate_tree_success")));
    }
    catch (error) {
      addToast("error", resolveApiError(error, t("crud.areaTemplate.action.generate_tree_error")));
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
        <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 cursor-default">
          {t("crud.common.loading_records")}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 cursor-default">
          {t("crud.common.zero_records")}
        </div>
      </div>
    );
  }

  const displayName = (language === "th" ? template.th : template.en) || template.en || template.th;
  const geometry = describeGeometry(template.coordinates);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Button
                onClick={() => navigate(`${ROUTE_PREFIX.cms}/area-template`)}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
                    {displayName}
                  </h2>
                  <AreaTemplateStatusBadge status={template.status} />
                  <span className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
                    v{template.version}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
                  {template.countryId}
                  {template.yearOfData ? ` · ${template.yearOfData}` : ""}
                  {geometry.hasGeometry
                    ? ` · ${t("crud.areaTemplate.geometry.summary").replace("_POINTS_", String(geometry.pointCount))}`
                    : ` · ${t("crud.areaTemplate.geometry.none")}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate(`${ROUTE_PREFIX.cms}/area-template/${templateId}/versions`)}
                variant="outline"
                size="sm"
              >
                <History className="w-4 h-4 mr-2" />
                {t("crud.areaTemplate.action.versions")}
              </Button>
              <Button
                onClick={handleGenerateTree}
                variant="outline"
                size="sm"
                disabled={isGenerating}
                className={`${isGenerating && "cursor-not-allowed disabled"}`}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("crud.areaTemplate.action.generate_tree")}
              </Button>
            </div>
          </div>

          {locked && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400 cursor-default">
              {t("crud.areaTemplate.locked_notice")}
            </p>
          )}
        </div>

        {/* The cached tree, so "Regenerate tree" has something visible to change */}
        <AreaTreePreview
          tree={treeData?.data as TemplateCountryTree | undefined}
          isLoading={isFetchingTree}
        />

        {/* Provinces */}
        <AreaTemplateProvinceView
          templateCountryId={template.id}
          countryCode={template.countryId}
          locked={locked}
          selectedProvinceId={selectedProvince?.id ?? null}
          onSelectProvince={setSelectedProvince}
          addToast={addToast}
        />

        {/* Districts of the selected province */}
        {selectedProvince ? (
          <AreaTemplateDistrictView
            province={selectedProvince}
            locked={locked}
            addToast={addToast}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 cursor-default">
            {t("crud.areaTemplate.district.select_province")}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default AreaTemplateDetailView;
