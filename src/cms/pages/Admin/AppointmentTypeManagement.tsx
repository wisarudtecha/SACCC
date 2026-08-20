// /src/cms/pages/Admin/AppointmentTypeManagement.tsx
/**
 * @fileoverview Appointment Type Management Dashboard.
 *
 * @description
 * Appointment type definition management (name/status) for the appointment type list,
 * consumed elsewhere (e.g. appointment creation) as a lookup.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetAppointmentTypeQuery } from "@/cms/store/api/appointmentType";
import type { AppointmentType } from "@/cms/types/appointmentType";
import AppointmentTypeManagementComponent from "@/cms/components/admin/system-configuration/appointment-type/AppointmentTypeManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const AppointmentTypeManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: appointmentTypesData, refetch } = useGetAppointmentTypeQuery({ start: 0, length: 100 });
  const appointmentTypes = appointmentTypesData?.data as unknown as AppointmentType[] || [];

  return (
    <div className="p-5 dark:bg-gray-900 xl:px-10 xl:py-12 min-h-screen">
      <PageMeta
        title="React.js Appointment Type Management | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Appointment Type Management page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <ProtectedRoute requiredPermissions={["appointment.view"]}>
        <PageBreadcrumb pageTitle={t("navigation.super_app.sidebar.contact.menu.appointment_type")} />

        <AppointmentTypeManagementComponent appointmentTypes={appointmentTypes} onRefresh={refetch} />
      </ProtectedRoute>
    </div>
  );
};

export default AppointmentTypeManagementPage;
