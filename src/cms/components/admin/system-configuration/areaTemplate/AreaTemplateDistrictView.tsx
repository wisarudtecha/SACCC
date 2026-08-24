// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateDistrictView.tsx
import React, { useMemo, useState } from "react";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateDistrictsQuery,
  useCreateTemplateDistrictMutation,
  useUpdateTemplateDistrictMutation,
  useDeleteTemplateDistrictMutation
} from "@/cms/store/api/areaTemplateApi";
import type { Column, FieldConfig } from "@/cms/types/product";
import type { TemplateDistrict, TemplateProvince } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import { formatPolygonRings, parsePolygonRings, toCoordinatesPayload } from "@/cms/utils/areaGeometry";
import { applyLocalTableQuery, INITIAL_LOCAL_QUERY, type LocalTableQuery } from "@/cms/utils/localTableQuery";
import Form from "@/cms/components/crm/Form";
import GeometryCell from "@/cms/components/admin/system-configuration/areaTemplate/GeometryCell";
import View from "@/cms/components/crm/View";

interface AreaTemplateDistrictViewProps {
  /** Districts hang off a template province, not a template country. */
  province: TemplateProvince;
  /** Published templates are locked: no create, edit or delete. */
  locked: boolean;
  addToast: (variant: "success" | "error", message: string) => void;
}

const AreaTemplateDistrictView: React.FC<AreaTemplateDistrictViewProps> = ({
  province,
  locked,
  addToast
}) => {
  const { language, t } = useTranslation();
  const permissions = usePermissions();

  const [query, setQuery] = useState<LocalTableQuery>(INITIAL_LOCAL_QUERY);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TemplateDistrict | null>(null);

  const { data, isLoading, refetch } = useGetTemplateDistrictsQuery({ templateProvinceId: province.id });
  const [createDistrict, { isLoading: isCreating }] = useCreateTemplateDistrictMutation();
  const [updateDistrict, { isLoading: isUpdating }] = useUpdateTemplateDistrictMutation();
  const [deleteDistrict, { isLoading: isDeleting }] = useDeleteTemplateDistrictMutation();

  const loading = isLoading || isCreating || isUpdating || isDeleting;
  const entityName = t("crud.areaTemplate.district.name");

  const allDistricts = useMemo(() => (data?.data as TemplateDistrict[]) || [], [data]);

  const { rows, filteredCount, totalCount } = useMemo(
    () => applyLocalTableQuery(
      allDistricts,
      query,
      district => [district.en, district.th, district.distId, district.postcode]
    ),
    [allDistricts, query]
  );

  const columns: Column<TemplateDistrict>[] = useMemo(() => [
    {
      key: "en",
      label: t("crud.areaTemplate.column.name"),
      render: district => (language === "th" ? district.th : district.en) || district.en || district.th
    },
    { key: "distId", label: t("crud.areaTemplate.column.districtCode") },
    {
      key: "postcode",
      label: t("crud.areaTemplate.column.postcode"),
      render: district => district.postcode || "-"
    },
    {
      key: "coordinates",
      label: t("crud.areaTemplate.column.geometry"),
      render: district => <GeometryCell coordinates={district.coordinates} />
    }
  ], [language, t]);

  const formFields: FieldConfig[] = useMemo(() => [
    {
      name: "distId",
      label: t("crud.areaTemplate.field.districtCode.label"),
      placeholder: t("crud.areaTemplate.field.districtCode.placeholder"),
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
      name: "postcode",
      label: t("crud.areaTemplate.field.postcode.label"),
      placeholder: t("crud.areaTemplate.field.postcode.placeholder"),
      type: "text"
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
    // The action buttons are permission-gated, but a handler that trusts the UI
    // is one refactor away from being reachable without one.
    if (!permissions.hasAnyPermission(["area.create", "area.update"])) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    const parsed = parsePolygonRings(String(formData.coordinates || ""));
    if (parsed.error) {
      addToast("error", t(`crud.areaTemplate.geometry.error.${parsed.error}`));
      return;
    }

    // countryId/provId are inherited from the parent province rather than typed,
    // so a district can never be filed under a code its parent does not have.
    const shared = {
      countryId: province.countryId,
      provId: province.provId,
      distId: String(formData.distId || ""),
      en: String(formData.en || ""),
      th: String(formData.th || ""),
      postcode: String(formData.postcode || ""),
      active: Boolean(formData.active),
      nameSpace: "",
      coordinates: toCoordinatesPayload(parsed.rings, editing?.coordinates)
    };

    try {
      const response = editing
        ? await updateDistrict({ id: editing.id, data: { ...shared, id: editing.id } }).unwrap()
        : await createDistrict({ ...shared, templateProvinceId: province.id }).unwrap();

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

  const handleDelete = async (district: TemplateDistrict) => {
    try {
      const response = await deleteDistrict(district.id).unwrap();
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

  return (
    <>
      <View
        columns={columns}
        createLabel={t("crud.common.create").replace("_ENTITY_", entityName)}
        data={rows}
        filtered={filteredCount}
        initialQuery={INITIAL_LOCAL_QUERY}
        loading={loading}
        permissionModule="area"
        query={query}
        showViewInTable={false}
        title={`${entityName} - ${(language === "th" ? province.th : province.en) || province.provId}`}
        total={totalCount}
        onAdd={locked ? undefined : () => {
          setEditing(null);
          setShowForm(true);
        }}
        onDelete={locked ? undefined : handleDelete}
        onEdit={locked ? undefined : district => {
          setEditing(district);
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
              distId: editing.distId,
              th: editing.th,
              en: editing.en,
              postcode: editing.postcode || "",
              coordinates: formatPolygonRings(editing.coordinates),
              active: editing.active
            }
            : { distId: "", th: "", en: "", postcode: "", coordinates: "", active: true }}
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

export default AreaTemplateDistrictView;
