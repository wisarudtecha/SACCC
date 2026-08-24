// /src/cms/components/admin/system-configuration/areaTemplate/AreaTreePreview.tsx
/**
 * Read-only rendering of a cached area tree.
 *
 * Deliberately not AreaHierarchyView: that is an editing surface with a large
 * callback contract. This exists so "Regenerate tree" has a visible effect -
 * without it the button rebuilt a cache nothing in the app displayed - and so an
 * author can confirm the cache matches their edits before publishing.
 *
 * Takes AreaCountryTree, so it renders an org tree just as happily as a template
 * one (TemplateCountryTree is AreaCountryTree plus version/status).
 */
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AreaCountryTree } from "@/cms/types/area";
import { describeGeometry } from "@/cms/utils/areaGeometry";

interface AreaTreePreviewProps {
  tree?: AreaCountryTree;
  isLoading?: boolean;
}

const GeometryNote: React.FC<{ coordinates?: AreaCountryTree["coordinates"] }> = ({ coordinates }) => {
  const { t } = useTranslation();
  const { hasGeometry, pointCount } = describeGeometry(coordinates);

  return (
    <span className="text-xs text-gray-400 dark:text-gray-500">
      {hasGeometry
        ? t("crud.areaTemplate.geometry.summary").replace("_POINTS_", String(pointCount))
        : t("crud.areaTemplate.geometry.none")}
    </span>
  );
};

const AreaTreePreview: React.FC<AreaTreePreviewProps> = ({ tree, isLoading = false }) => {
  const { language, t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const nameOf = (node: { en?: string; th?: string }) =>
    (language === "th" ? node.th : node.en) || node.en || node.th || "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <button
        onClick={() => setIsExpanded(open => !open)}
        className="flex w-full items-center gap-2 px-6 py-3 text-left"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t("crud.areaTemplate.tree.title")}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
              {t("crud.common.loading_records")}
            </p>
          )}

          {/* An un-generated cache reads as an empty tree rather than an error,
              so point at the button rather than showing a bare "no data". */}
          {!isLoading && !tree && (
            <p className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
              {t("crud.areaTemplate.tree.empty")}
            </p>
          )}

          {!isLoading && tree && (
            <ul className="space-y-2 text-sm">
              <li>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{nameOf(tree)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{tree.countryId}</span>
                  <GeometryNote coordinates={tree.coordinates} />
                </div>

                <ul className="mt-2 space-y-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                  {(tree.provinces || []).map(province => (
                    <li key={`province-${province.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{nameOf(province)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{province.provId}</span>
                        <GeometryNote coordinates={province.coordinates} />
                      </div>

                      <ul className="mt-1 space-y-1 border-l border-gray-200 pl-4 dark:border-gray-700">
                        {(province.districts || []).map(district => (
                          <li key={`district-${district.id}`} className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-200">{nameOf(district)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{district.distId}</span>
                            {district.postcode && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{district.postcode}</span>
                            )}
                            <GeometryNote coordinates={district.coordinates} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaTreePreview;
