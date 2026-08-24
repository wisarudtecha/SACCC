// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateCountryView.tsx
/**
 * The area template list.
 *
 * A template is a draft until it is published, and publishing locks it - the
 * only way to change a published lineage is to fork it into a new draft
 * version. That state drives every action here, which is why Edit and Delete
 * are custom actions rather than View's built-in onEdit/onDelete: those two
 * render unconditionally, and a locked template needs the buttons gone, not a
 * rejection after the click.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Edit, GitFork, History, Layers, Send, Trash2 } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateCountriesQuery,
  useCreateTemplateCountryMutation,
  useUpdateTemplateCountryMutation,
  useDeleteTemplateCountryMutation,
  usePublishTemplateCountryMutation,
  useForkTemplateCountryMutation
} from "@/cms/store/api/areaTemplateApi";
import { ROUTE_PREFIX } from "@/core/router/routePrefix";
import type { Column, FieldConfig } from "@/cms/types/product";
import type { TemplateCountry, TemplateCountryCreateData } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { formatPolygonRings, parsePolygonRings, toCoordinatesPayload } from "@/cms/utils/areaGeometry";
import { applyLocalTableQuery, INITIAL_LOCAL_QUERY, type LocalTableQuery } from "@/cms/utils/localTableQuery";
import AreaTemplateForkModal from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateForkModal";
import AreaTemplateStatusBadge from "@/cms/components/admin/system-configuration/areaTemplate/AreaTemplateStatusBadge";
import Form from "@/cms/components/crm/Form";
import GeometryCell from "@/cms/components/admin/system-configuration/areaTemplate/GeometryCell";
import View, { type Action } from "@/cms/components/crm/View";

const isDraft = (template: TemplateCountry) => template.status === "draft";
const isPublished = (template: TemplateCountry) => template.status === "published";

const AreaTemplateCountryView: React.FC = () => {
  const { language, t } = useTranslation();
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState<LocalTableQuery>(INITIAL_LOCAL_QUERY);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TemplateCountry | null>(null);
  const [forking, setForking] = useState<TemplateCountry | null>(null);

  const { data, isLoading, refetch } = useGetTemplateCountriesQuery();
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateCountryMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateCountryMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteTemplateCountryMutation();
  const [publishTemplate, { isLoading: isPublishing }] = usePublishTemplateCountryMutation();
  const [forkTemplate, { isLoading: isForking }] = useForkTemplateCountryMutation();

  const loading = isLoading || isCreating || isUpdating || isDeleting || isPublishing || isForking;

  const allTemplates = useMemo(() => (data?.data as TemplateCountry[]) || [], [data]);

  const { rows, filteredCount, totalCount } = useMemo(
    () => applyLocalTableQuery(
      allTemplates,
      query,
      template => [template.en, template.th, template.countryId, template.version]
    ),
    [allTemplates, query]
  );

  const entityName = t("crud.areaTemplate.name");

  const columns: Column<TemplateCountry>[] = useMemo(() => [
    {
      key: "en",
      label: t("crud.areaTemplate.column.name"),
      render: template => (language === "th" ? template.th : template.en) || template.en || template.th
    },
    { key: "countryId", label: t("crud.areaTemplate.column.countryCode") },
    {
      key: "version",
      label: t("crud.areaTemplate.column.version"),
      render: template => `v${template.version}`
    },
    {
      key: "status",
      label: t("crud.areaTemplate.column.status"),
      render: template => <AreaTemplateStatusBadge status={template.status} />
    },
    {
      key: "coordinates",
      label: t("crud.areaTemplate.column.geometry"),
      render: template => <GeometryCell coordinates={template.coordinates} />
    },
    {
      key: "yearOfData",
      label: t("crud.areaTemplate.column.yearOfData"),
      render: template => template.yearOfData ? String(template.yearOfData) : "-"
    }
  ], [language, t]);

  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "countryId",
      label: t("crud.areaTemplate.field.countryCode.label"),
      placeholder: t("crud.areaTemplate.field.countryCode.placeholder"),
      type: "text",
      required: true
    },
    {
      name: "th",
      label: t("crud.areaTemplate.field.th.label"),
      placeholder: t("crud.areaTemplate.field.th.placeholder"),
      type: "text",
      required: true
    },
    {
      name: "en",
      label: t("crud.areaTemplate.field.en.label"),
      placeholder: t("crud.areaTemplate.field.en.placeholder"),
      type: "text",
      required: true
    },
    {
      name: "yearOfData",
      label: t("crud.areaTemplate.field.yearOfData.label"),
      placeholder: t("crud.areaTemplate.field.yearOfData.placeholder"),
      type: "number"
    },
      {
        name: "shapeArea",
        label: t("crud.area.form.country.shapeArea.label"),
        placeholder: t("crud.area.form.country.shapeArea.placeholder"),
        type: "number"
      },
      {
        name: "shapeLength",
        label: t("crud.area.form.country.shapeLength.label"),
        placeholder: t("crud.area.form.country.shapeLength.placeholder"),
        type: "number"
      },
    {
      name: "coordinates",
      label: t("crud.areaTemplate.field.coordinates.label"),
      placeholder: t("crud.areaTemplate.field.coordinates.placeholder"),
      type: "textarea"
    },
    {
      name: "active",
      label: t("common.active"),
      type: "toggle"
    }
  ], [t]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    // The action buttons are permission-gated, but a handler that trusts the UI
    // is one refactor away from being reachable without one.
    if (!permissions.hasAnyPermission(["area.create", "area.update"])) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    // Form validates required-ness only, so geometry is parsed here. A bad paste
    // keeps the dialog open with the input intact rather than silently sending
    // coordinates the map will not be able to draw.
    const parsed = parsePolygonRings(String(formData.coordinates || ""));
    if (parsed.error) {
      addToast("error", t(`crud.areaTemplate.geometry.error.${parsed.error}`));
      return;
    }

    const payload: TemplateCountryCreateData = {
      countryId: String(formData.countryId || ""),
      en: String(formData.en || ""),
      th: String(formData.th || ""),
      active: Boolean(formData.active),
      nameSpace: "",
      // An untouched number input hands back "", which must not become 0.
      yearOfData: formData.yearOfData ? Number(formData.yearOfData) : null,
      shapeArea: formData.shapeArea ? Number(formData.shapeArea) : null,
      shapeLength: formData.shapeLength ? Number(formData.shapeLength) : null,
      coordinates: toCoordinatesPayload(parsed.rings, editing?.coordinates)
    };

    try {
      const response = editing
        ? await updateTemplate({ id: editing.id, data: { ...payload, id: editing.id } }).unwrap()
        : await createTemplate(payload).unwrap();

      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response));
      }

      addToast("success", resolveApiMessage(
        response,
        t(editing ? "crud.common.form.action.update.success" : "crud.common.form.action.create.success")
          .replace("_ENTITY_", entityName)
      ));
      setShowForm(false);
      setEditing(null);
      refetch();
    }
    catch (error) {
      addToast("error", resolveApiError(
        error,
        t(editing ? "crud.common.form.action.update.error" : "crud.common.form.action.create.error")
          .replace("_ENTITY_", entityName)
      ));
    }
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successKey: string,
    errorKey: string,
    /** The permission this action needs; the matching button declares the same one. */
    permission: string
  ) => {
    if (!permissions.hasPermission(permission)) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    try {
      const response = await action() as Parameters<typeof isApiSuccess>[0];
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response));
      }
      addToast("success", resolveApiMessage(response, t(successKey).replace("_ENTITY_", entityName)));
      refetch();
    }
    catch (error) {
      addToast("error", resolveApiError(error, t(errorKey).replace("_ENTITY_", entityName)));
    }
  };

  const customActions: Action<TemplateCountry>[] = useMemo(() => [
    {
      icon: <Layers className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.manage"),
      variant: "outline",
      onClick: template => navigate(`${ROUTE_PREFIX.cms}/area-template/${template.id}`)
    },
    {
      icon: <History className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.versions"),
      variant: "outline",
      onClick: template => navigate(`${ROUTE_PREFIX.cms}/area-template/${template.id}/versions`)
    },
    {
      icon: <Edit className="w-3 h-3" />,
      label: t("crud.common.update"),
      permission: "area.update",
      variant: "outline",
      show: isDraft,
      onClick: template => {
        setEditing(template);
        setShowForm(true);
      }
    },
    {
      icon: <Send className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.publish"),
      permission: "area.update",
      variant: "primary",
      show: isDraft,
      onClick: template => runAction(
        () => publishTemplate(template.id).unwrap(),
        "crud.areaTemplate.action.publish_success",
        "crud.areaTemplate.action.publish_error",
        "area.update"
      )
    },
    {
      icon: <GitFork className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.fork"),
      permission: "area.create",
      variant: "outline",
      show: isPublished,
      onClick: template => setForking(template)
    },
    {
      icon: <Trash2 className="w-3 h-3" />,
      label: t("crud.common.delete"),
      permission: "area.delete",
      variant: "outline-error",
      show: isDraft,
      onClick: template => runAction(
        () => deleteTemplate(template.id).unwrap(),
        "crud.common.form.action.delete.success",
        "crud.common.form.action.delete.error",
        "area.delete"
      )
    }
    // runAction closes over stable RTK triggers and t; re-creating the array on
    // every render would defeat nothing here, but the deps keep it honest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate, publishTemplate, deleteTemplate, t]);

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", entityName)}
        customActions={customActions}
        data={rows}
        filtered={filteredCount}
        initialQuery={INITIAL_LOCAL_QUERY}
        loading={loading}
        permissionModule="area"
        query={query}
        showViewInTable={false}
        title={entityName}
        total={totalCount}
        onAdd={() => {
          setEditing(null);
          setShowForm(true);
        }}
        onQueryChange={newQuery => setQuery(newQuery as LocalTableQuery)}
      />

      {showForm && (
        <Form
          cancelLabel={t("crud.common.form.action.cancel")}
          fields={formFields}
          initialValues={editing
            ? {
              countryId: editing.countryId,
              th: editing.th,
              en: editing.en,
              yearOfData: editing.yearOfData ?? "",
              shapeArea: editing.shapeArea ?? "",
              shapeLength: editing.shapeLength ?? "",
              coordinates: formatPolygonRings(editing.coordinates),
              active: editing.active
            }
            : {
              countryId: "",
              th: "",
              en: "",
              yearOfData: "",
              shapeArea: "",
              shapeLength: "",
              coordinates: "",
              active: true
            }}
          loading={loading}
          open={showForm}
          submitLabel={(editing ? t("common.update_entity") : t("crud.common.create")).replace("_ENTITY_", entityName)}
          title={(editing ? t("common.edit_entity") : t("crud.common.create")).replace("_ENTITY_", entityName)}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <AreaTemplateForkModal
        template={forking}
        loading={isForking}
        onClose={() => setForking(null)}
        onFork={async (template, name) => {
          await runAction(
            () => forkTemplate({ id: template.id, data: { en: name } }).unwrap(),
            "crud.areaTemplate.action.fork_success",
            "crud.areaTemplate.action.fork_error",
            "area.create"
          );
          setForking(null);
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default AreaTemplateCountryView;
