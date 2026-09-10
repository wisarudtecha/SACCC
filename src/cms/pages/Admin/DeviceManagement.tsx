// /src/cms/pages/Admin/DeviceManagement.tsx
/**
 * @fileoverview Device Management Dashboard.
 *
 * @description
 * Admin CRUD for the org's IoT device registry (Camera / Fire Hydrant / AED /
 * "etc."), the same records the case-map Device layer renders. Route-gated by
 * `organization_settings.manage` (CAD-FE-Device-Management, reusing the Place
 * screen's permission).
 *
 * Structurally mirrors PlaceManagement: the list query lives here so the screen
 * can hand `refetch` down. `deviceIoTApi`'s create/update mutations invalidate
 * the "Device Iot" cache tag, so a create/edit refreshes the list (and the
 * case-map layer) in place with no full-page reload.
 */

import React from "react";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetDeviceIoTQuery } from "@/cms/store/api/deviceIoT";
import type { Device } from "@/cms/types/deviceIoT";
import DeviceManagementComponent from "@/cms/components/admin/system-configuration/device/DeviceManagement";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";

const DeviceManagementPage: React.FC = () => {
  const { t } = useTranslation();

  // ===================================================================
  // API Data
  // ===================================================================
  const { data: devicesData, isLoading, isError, refetch } = useGetDeviceIoTQuery({ start: 0, length: 100 });
  const devices = devicesData?.data as unknown as Device[] || [];

  return (
    <>
      <PageMeta
        title="Device Management | Cloud Contact Center"
        description="Admin management of the org's IoT device registry shown on the case map."
      />

      <ProtectedRoute requiredPermissions={["organization_settings.manage"]}>
        <PageBreadcrumb pageTitle={t("navigation.sidebar.main.system_configuration.nested.device_management")} />

        <DeviceManagementComponent
          devices={devices}
          isLoading={isLoading}
          isError={isError}
          onRefresh={refetch}
        />
      </ProtectedRoute>
    </>
  );
};

export default DeviceManagementPage;
