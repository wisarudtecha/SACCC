// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateVersionsView.tsx
/**
 * Every version in one template lineage, oldest to newest.
 *
 * Read-only by design: a version is a historical record. The only thing you can
 * do from here is fork a published one into a new draft, or open one.
 */
import React, { useMemo, useState } from "react";
import { ArrowLeft, GitFork, Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateCountryVersionsQuery,
  useForkTemplateCountryMutation
} from "@/cms/store/api/areaTemplateApi";
import { ROUTE_PREFIX } from "@/core/router/routePrefix";
import type { Column } from "@/cms/types/product";
import type { TemplateCountry } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { applyLocalTableQuery, INITIAL_LOCAL_QUERY, type LocalTableQuery } from "@/cms/utils/localTableQuery";
import AreaTemplateForkModal from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateForkModal";
import AreaTemplateStatusBadge from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateStatusBadge";
import Button from "@/core/components/ui/button/Button";
import GeometryCell from "@/cms/components/admin/system-configuration/areaTemplate/GeometryCell";
import View, { type Action } from "@/cms/components/crm/View";

interface AreaTemplateVersionsViewProps {
  templateId: string;
}

const AreaTemplateVersionsView: React.FC<AreaTemplateVersionsViewProps> = ({ templateId }) => {
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState<LocalTableQuery>(INITIAL_LOCAL_QUERY);
  const [forking, setForking] = useState<TemplateCountry | null>(null);

  const { data, isLoading, refetch } = useGetTemplateCountryVersionsQuery(templateId);
  const [forkTemplate, { isLoading: isForking }] = useForkTemplateCountryMutation();

  const allVersions = useMemo(() => (data?.data as TemplateCountry[]) || [], [data]);

  const { rows, filteredCount, totalCount } = useMemo(
    () => applyLocalTableQuery(
      allVersions,
      query,
      version => [version.en, version.th, version.version, version.publishedBy]
    ),
    [allVersions, query]
  );

  const entityName = t("crud.areaTemplate.versions.name");

  const columns: Column<TemplateCountry>[] = useMemo(() => [
    {
      key: "version",
      label: t("crud.areaTemplate.column.version"),
      render: version => `v${version.version}`
    },
    {
      key: "en",
      label: t("crud.areaTemplate.column.name"),
      render: version => (language === "th" ? version.th : version.en) || version.en || version.th
    },
    {
      key: "status",
      label: t("crud.areaTemplate.column.status"),
      render: version => <AreaTemplateStatusBadge status={version.status} />
    },
    {
      key: "coordinates",
      label: t("crud.areaTemplate.column.geometry"),
      render: version => <GeometryCell coordinates={version.coordinates} />
    },
    {
      key: "publishedBy",
      label: t("crud.areaTemplate.column.publishedBy"),
      render: version => version.publishedBy || "-"
    }
  ], [language, t]);

  const customActions: Action<TemplateCountry>[] = useMemo(() => [
    {
      icon: <Layers className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.manage"),
      variant: "outline",
      onClick: version => navigate(`${ROUTE_PREFIX.cms}/area-template/${version.id}`)
    },
    {
      icon: <GitFork className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.fork"),
      permission: "area.create",
      variant: "outline",
      show: version => version.status === "published",
      onClick: version => setForking(version)
    }
  ], [navigate, t]);

  return (
    <>
      <div className="mb-4">
        <Button
          onClick={() => navigate(`${ROUTE_PREFIX.cms}/area-template/${templateId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("crud.areaTemplate.action.back_to_template")}
        </Button>
      </div>

      <View
        columns={columns}
        customActions={customActions}
        data={rows}
        filtered={filteredCount}
        initialQuery={INITIAL_LOCAL_QUERY}
        loading={isLoading || isForking}
        permissionModule="area"
        query={query}
        showViewInTable={false}
        title={entityName}
        total={totalCount}
        onQueryChange={newQuery => setQuery(newQuery as LocalTableQuery)}
      />

      <AreaTemplateForkModal
        template={forking}
        loading={isForking}
        onClose={() => setForking(null)}
        onFork={async (template, name) => {
          try {
            const response = await forkTemplate({ id: template.id, data: { en: name } }).unwrap();
            if (!isApiSuccess(response)) {
              throw new Error(resolveApiError(response));
            }
            addToast("success", resolveApiMessage(
              response,
              t("crud.areaTemplate.action.fork_success").replace("_ENTITY_", entityName)
            ));
            refetch();
          }
          catch (error) {
            addToast("error", resolveApiError(
              error,
              t("crud.areaTemplate.action.fork_error").replace("_ENTITY_", entityName)
            ));
          }
          setForking(null);
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default AreaTemplateVersionsView;
