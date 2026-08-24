// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateProvinceView.tsx
import React, { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateProvincesQuery,
  useCreateTemplateProvinceMutation,
  useUpdateTemplateProvinceMutation,
  useDeleteTemplateProvinceMutation
} from "@/cms/store/api/areaTemplateApi";
import type { Column, FieldConfig } from "@/cms/types/product";
import type { TemplateProvince } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { formatPolygonRings, parsePolygonRings, toCoordinatesPayload } from "@/cms/utils/areaGeometry";
import { applyLocalTableQuery, INITIAL_LOCAL_QUERY, type LocalTableQuery } from "@/cms/utils/localTableQuery";
import Form from "@/cms/components/crm/Form";
import GeometryCell from "@/cms/components/admin/system-configuration/areaTemplate/GeometryCell";
import View, { type Action } from "@/cms/components/crm/View";

interface AreaTemplateProvinceViewProps {
  templateCountryId: number;
  /** The parent template's country code - provinces inherit it, they don't pick one. */
  countryCode: string;
  /** Published templates are locked: no create, edit or delete. */
  locked: boolean;
  selectedProvinceId: number | null;
  onSelectProvince: (province: TemplateProvince) => void;
  addToast: (variant: "success" | "error", message: string) => void;
}

const AreaTemplateProvinceView: React.FC<AreaTemplateProvinceViewProps> = ({
  templateCountryId,
  countryCode,
  locked,
  selectedProvinceId,
  onSelectProvince,
  addToast
}) => {
  const { language, t } = useTranslation();

  const [query, setQuery] = useState<LocalTableQuery>(INITIAL_LOCAL_QUERY);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TemplateProvince | null>(null);

  const { data, isLoading, refetch } = useGetTemplateProvincesQuery({ templateCountryId });
  const [createProvince, { isLoading: isCreating }] = useCreateTemplateProvinceMutation();
  const [updateProvince, { isLoading: isUpdating }] = useUpdateTemplateProvinceMutation();
  const [deleteProvince, { isLoading: isDeleting }] = useDeleteTemplateProvinceMutation();

  const loading = isLoading || isCreating || isUpdating || isDeleting;
  const entityName = t("crud.areaTemplate.province.name");

  const allProvinces = useMemo(() => (data?.data as TemplateProvince[]) || [], [data]);

  const { rows, filteredCount, totalCount } = useMemo(
    () => applyLocalTableQuery(
      allProvinces,
      query,
      province => [province.en, province.th, province.provId]
    ),
    [allProvinces, query]
  );

  const columns: Column<TemplateProvince>[] = useMemo(() => [
    {
      key: "en",
      label: t("crud.areaTemplate.column.name"),
      render: province => (
        <span className={selectedProvinceId === province.id ? "font-semibold text-blue-600 dark:text-blue-300" : ""}>
          {(language === "th" ? province.th : province.en) || province.en || province.th}
        </span>
      )
    },
    { key: "provId", label: t("crud.areaTemplate.column.provinceCode") },
    {
      key: "coordinates",
      label: t("crud.areaTemplate.column.geometry"),
      render: province => <GeometryCell coordinates={province.coordinates} />
    }
  ], [language, selectedProvinceId, t]);

  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "provId",
      label: t("crud.areaTemplate.field.provinceCode.label"),
      placeholder: t("crud.areaTemplate.field.provinceCode.placeholder"),
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
      name: "coordinates",
      label: t("crud.areaTemplate.field.coordinates.label"),
      placeholder: t("crud.areaTemplate.field.coordinates.placeholder"),
      type: "textarea"
    },
    { name: "active", label: t("common.active"), type: "toggle" }
  ], [t]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const parsed = parsePolygonRings(String(formData.coordinates || ""));
    if (parsed.error) {
      addToast("error", t(`crud.areaTemplate.geometry.error.${parsed.error}`));
      return;
    }

    const shared = {
      countryId: countryCode,
      provId: String(formData.provId || ""),
      en: String(formData.en || ""),
      th: String(formData.th || ""),
      active: Boolean(formData.active),
      nameSpace: "",
      coordinates: toCoordinatesPayload(parsed.rings, editing?.coordinates)
    };

    try {
      const response = editing
        ? await updateProvince({ id: editing.id, data: { ...shared, id: editing.id } }).unwrap()
        : await createProvince({ ...shared, templateCountryId }).unwrap();

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

  const handleDelete = async (province: TemplateProvince) => {
    try {
      const response = await deleteProvince(province.id).unwrap();
      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response));
      }
      addToast("success", resolveApiMessage(
        response,
        t("crud.common.form.action.delete.success").replace("_ENTITY_", entityName)
      ));
      refetch();
    }
    catch (error) {
      addToast("error", resolveApiError(
        error,
        t("crud.common.form.action.delete.error").replace("_ENTITY_", entityName)
      ));
    }
  };

  const customActions: Action<TemplateProvince>[] = useMemo(() => [
    {
      icon: <MapPin className="w-3 h-3" />,
      label: t("crud.areaTemplate.action.districts"),
      variant: "outline",
      onClick: onSelectProvince
    }
  ], [onSelectProvince, t]);

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
        // A published template is locked. Withholding the callbacks is what hides
        // View's built-in create/edit/delete buttons - they have no `show` hook.
        onAdd={locked ? undefined : () => {
          setEditing(null);
          setShowForm(true);
        }}
        onDelete={locked ? undefined : handleDelete}
        onEdit={locked ? undefined : province => {
          setEditing(province);
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
              provId: editing.provId,
              th: editing.th,
              en: editing.en,
              coordinates: formatPolygonRings(editing.coordinates),
              active: editing.active
            }
            : { provId: "", th: "", en: "", coordinates: "", active: true }}
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
    </>
  );
};

export default AreaTemplateProvinceView;
