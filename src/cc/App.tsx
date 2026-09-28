// src/cc/App.tsx
// React Imports
import { Routes, Route } from "react-router-dom";

// Authentication Imports
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";

// Template Imports
import NotFound from "@/core/pages/OtherPage/NotFound";

import CallCenterDashboardPage from "@/cc/pages/Dashboard/CallCenterDashboard";
import EmailPage from "@/cc/pages/Workspace/Email";
import LobbyIncomingPage from "@/cc/pages/Workspace/LobbyIncoming";
import ChatHistoryPage from "@/cc/pages/Workspace/ChatHistory";

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

        {/* Live Chat (CC-CHAT, Professional+). Route-level entitlement gate
            backs the sidebar lock badges — placeholder pages until the chat
            functionality ships. */}
        <Route
          path="/lobby-incoming"
          element={
            <ProtectedRoute requiredFeature="entitlement.chat">
              <LobbyIncomingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-history"
          element={
            <ProtectedRoute requiredFeature="entitlement.chat">
              <ChatHistoryPage />
            </ProtectedRoute>
          }
        />

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
