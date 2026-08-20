// src/cc/App.tsx
// React Imports
import { Routes, Route } from "react-router-dom";

// Authentication Imports
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";

// Template Imports
import NotFound from "@/core/pages/OtherPage/NotFound";

import CallCenterDashboardPage from "@/cc/pages/Dashboard/CallCenterDashboard";
import EmailPage from "@/cc/pages/Workspace/Email";

import AppointmentPage from "@/cms/pages/Appointment/Appointment";
import AppointmentTypeManagementPage from "@/cms/pages/Admin/AppointmentTypeManagement";
import CustomerPage from "@/cms/pages/Customer/Customer";
import CustomerFormConfigPage from "@/cms/pages/Customer/CustomerFormConfig";

export default function CcApp() {
  return (
    <>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/dashboard" element={<CallCenterDashboardPage />} />
        <Route path="/email" element={<EmailPage />} />

        <Route
          path="/appointment"
          element={
            <ProtectedRoute requiredPermissions={["appointment.view"]}>
              <AppointmentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointment-types"
          element={
            <ProtectedRoute requiredPermissions={["appointment.view"]}>
              <AppointmentTypeManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contacts-list"
          element={
            <ProtectedRoute requiredPermissions={["contact.view"]}>
              <CustomerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contacts-configurations"
          element={
            <ProtectedRoute requiredPermissions={["contact_config.view"]}>
              <CustomerFormConfigPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
