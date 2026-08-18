// /src/pages/Admin/UnitForm.tsx
/**
 * @fileoverview Units Management Form.
 * 
 * @description
 * Comprehensive units management form system that builds upon the existing Unit Management interface.
 * Provides unit definition, lifecycle management.
 * Integrates with existing Unit"s Properties system.
 * 
 * @metadata
 * Author: [Wisarud Techa]
 * First Created: [29-10-2025] v0.1.0
 * Last Updated: [29-10-2025] v0.1.0
 * 
 * @notes
 * - Auto-generated code; may contain incomplete logic or require validation.
 * - Modify with caution and document changes.
 * - Intended as a starting point or scaffolding.
 */

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetAreaQuery } from "@/cms/store/api/area";
import { useGetDepartmentsQuery, useGetCommandsQuery, useGetStationsQuery } from "@/core/store/api/organizationApi";
import {
  useCreateUnitsMutation,
  // useGetUnitsQuery,
  useGetUnitsByIdQuery,
  useUpdateUnitsMutation,
  useGetCompaniesQuery,
  useGetSourcesQuery,
  useGetUnitTypesQuery
} from "@/cms/store/api/unitApi";
import { useGetUsersQuery } from "@/core/store/api/userApi";
import type { Area } from "@/cms/store/api/area";
import type { Department, Command, Station } from "@/core/types/organization";
import type {
  Unit,
  UnitFormData,
  UnitType,
  Company,
  Source
} from "@/cms/types/unit";
import type { UserProfile } from "@/core/types/user";
import UnitForm from "@/cms/components/admin/system-configuration/unit/unit-form/UnitForm";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

interface UnitParams {
  id?: string;
  [key: string]: string | undefined;
}

const UnitFormPage: React.FC = () => {
  const { t } = useTranslation();

  const permissions = usePermissions();

  const { toasts, addToast, removeToast } = useToast();

  const { id } = useParams<UnitParams>();
  const unitId = Number(id);

  const [isLoading, setIsLoading] = useState(false);

  const [createUnits] = useCreateUnitsMutation();
  const [updateUnits] = useUpdateUnitsMutation();

  const handleSubmit = async (data: UnitFormData, id?: number) => {
    setIsLoading(true);
    try {
      // const response = await fetch("/api/units", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to create unit");

      setIsLoading(true);
      let response;
      if (permissions.hasAnyPermission(["unit.create", "unit.update"])) {
        if (id) {
          response = await updateUnits({
            id: id, data: data
          }).unwrap();
        }
        else {
          response = await createUnits(data).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        const storage = localStorage || sessionStorage;
        storage.setItem("toast", JSON.stringify({
          status: "success", msg: id && t("crud.unit.action.update.success") || t("crud.unit.action.create.success")
        }));
        window.location.replace("/cms/unit");
      }
      else {
        throw new Error(response?.desc || response?.msg || "Unknown error");
      }
    }
    catch (error) {
      console.log("🚀 ~ handleSubmit ~ error:", error);
      addToast("error", id && t("crud.unit.action.update.error") || t("crud.unit.action.create.error"));
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back or reset form
    // console.log("Form cancelled");
    window.location.replace("/cms/unit");
  };

  // ===================================================================
  // API Data
  // ===================================================================
  // const { data: unitsData } = useGetUnitsQuery({ start: 0, length: 1000 });
  // const units = unitsData?.data as unknown as Unit[] || [];

  const { data: companiesData } = useGetCompaniesQuery({ start: 0, length: 100 });
  const companies = companiesData?.data as unknown as Company[] || [];

  const { data: sourcesData } = useGetSourcesQuery({ start: 0, length: 100 });
  const sources = sourcesData?.data as unknown as Source[] || [];

  const { data: unitTypesData } = useGetUnitTypesQuery({ start: 0, length: 100 });
  const unitTypes = unitTypesData?.data as unknown as UnitType[] || [];

  const { data: usersData } = useGetUsersQuery({ start: 0, length: 1000 });
  const users = usersData?.data as unknown as UserProfile[] || [];

  const { data: departmentsData } = useGetDepartmentsQuery({ start: 0, length: 100 });
  const departments = departmentsData?.data as unknown as Department[] || [];

  const { data: commandsData } = useGetCommandsQuery({ start: 0, length: 1000 });
  const commands = commandsData?.data as unknown as Command[] || [];

  const { data: stationsData } = useGetStationsQuery({ start: 0, length: 10000 });
  const stations = stationsData?.data as unknown as Station[] || [];

  const { data: areasData } = useGetAreaQuery(null);
  const areas = areasData?.data as unknown as Area[] || [];

  const { data: unitData } = useGetUnitsByIdQuery(unitId, { skip: !unitId });
  const unit = unitData?.data as unknown as Unit || {};

  return (
    <>
      <PageMeta
        title="React.js Unit Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Unit Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["unit.create", "unit.update"]}>
        <PageBreadcrumb
          items={[
            { label: t("common.home"), href: "/" },
            { label: t("navigation.sidebar.main.system_configuration.nested.unit_management.header"), href: "/unit" },
            { label: unitId
              && t("navigation.sidebar.main.system_configuration.nested.unit_management.update.header")
              || t("navigation.sidebar.main.system_configuration.nested.unit_management.create.header")
            }
          ]}
        />

        {/* <UnitFormComponent unit={units} /> */}

        <UnitForm
          areas={areas}
          commands={commands}
          companies={companies}
          departments={departments}
          id={unitId}
          isLoading={isLoading}
          mode="create"
          sources={sources}
          stations={stations}
          initialData={unit}
          unitTypes={unitTypes}
          users={users}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ProtectedRoute>
    </>
  );
};

export default UnitFormPage;

/**
 * @keyFeatures
 * ----------------------------------------------------------------------------
 * - Types and Interfaces.
 * - Main Form Component.
 * - Form Sections.
 * - Common Components.
 * - Styling (CSS).
 * - Usage Example.
 * 
 * @version 0.1.0
 * @date    29-10-2025
 * ----------------------------------------------------------------------------
 */
