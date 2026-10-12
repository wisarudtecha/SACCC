// src/cc/App.tsx
// React Imports
import { Routes, Route } from "react-router-dom";

// Authentication Imports
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";

// Template Imports
import NotFound from "@/core/pages/OtherPage/NotFound";

import CallCenterDashboardPage from "@/cc/pages/Dashboard/CallCenterDashboard";
import SoftphonePage from "@/cc/pages/Softphone/Softphone";
import SupervisionPage from "@/cc/pages/Supervision/Supervision";
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
        {/* Softphone — no permission gate yet, mirroring /cc/dashboard: the
            sidebar's "workspace.softphone" key is commented out until the
            backend provisions it. */}
        <Route path="/softphone" element={<SoftphonePage />} />
        {/* Supervisor live-call roster — designed for cc.supervision.view
            (Supervisor-Call-Control-Command-Contract.md §5.1); same as
            /softphone, the route gate + sidebar key land with backend
            permission provisioning (the in-page check carries a mock-mode
            bypass until then, see SupervisionBoard.tsx). */}
        <Route path="/supervision" element={<SupervisionPage />} />
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
