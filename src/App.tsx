// src/App.tsx
import { Navigate, Routes, Route } from "react-router-dom";
import AiApp from "@/ai/App";
import CcApp from "@/cc/App";
import CmsApp from "@/cms/App";
import KmsApp from "@/kms/App";
// import Dashboard from "@/core/components/dashboard/Dashboard";
import SuperLayout from "@/core/layout/SuperLayout";
import CustomDashboard from "@/core/pages/Dashboard/CustomDashboard";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import AuditLog from "@/core/pages/Admin/AuditLog";
import OrganizationManagementPage from "@/core/pages/Admin/OrganizationManagement";
import RolePrivilegeManagementPage from "@/core/pages/Admin/RolePrivilegeManagement";
import UserForm from "@/core/pages/Admin/UserForm";
import UserGroupManagementPage from "@/core/pages/Admin/UserGroupManagement";
import UserManagementPage from "@/core/pages/Admin/UserManagement";
import BarChart from "@/core/pages/Charts/BarChart";
import LineChart from "@/core/pages/Charts/LineChart";
import NotFound from "@/core/pages/OtherPage/NotFound";
import BasicTables from "@/core/pages/Tables/BasicTables";
import Alerts from "@/core/pages/UiElements/Alerts";
import Avatars from "@/core/pages/UiElements/Avatars";
import Badges from "@/core/pages/UiElements/Badges";
import Buttons from "@/core/pages/UiElements/Buttons";
import ButtonsCustomize from "@/core/pages/UiElements/ButtonsCustomize";
import Images from "@/core/pages/UiElements/Images";
import Tabs from "@/core/pages/UiElements/Tabs";
import Videos from "@/core/pages/UiElements/Videos";
import UserProfiles from "@/core/pages/UserProfiles";

import ErrorBoundary from "@/core/components/security/ErrorBoundary";
import LoadingSystem from "@/core/components/ui/loading/LoadingSystem";
import SecurityAlerts from "@/core/components/security/SecurityAlerts";

export default function App() {
  return (
    <Routes>
      <Route element={<SuperLayout />}>
        <Route path="/" element={<Navigate to="/cms" />} />
        <Route path="/ai/*" element={<AiApp />} />
        <Route path="/cc/*" element={<CcApp />} />
        <Route path="/cms/*" element={<CmsApp />} />
        <Route path="/kms/*" element={<KmsApp />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/auditlog" element={<AuditLog />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/bar-chart" element={<BarChart />} />
        <Route path="/basic-tables" element={<BasicTables />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/buttons-customize" element={<ButtonsCustomize />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* Cross-module customizable dashboard (case + product widgets, extensible). */}
        <Route
          path="/dashboard/custom"
          element={
            <ProtectedRoute requiredPermissions={["dashboard.view"]}>
              <CustomDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/images" element={<Images />} />
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/organization" element={<OrganizationManagementPage />} />
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/role-privilege" element={<RolePrivilegeManagementPage />} />
        <Route path="/tabs" element={<Tabs />} />
        <Route path="/user" element={<UserManagementPage />} />
        <Route path="/user-group" element={<UserGroupManagementPage />} />
        <Route path="/user/:id/edit" element={<UserForm />} />
        <Route path="/user/create" element={<UserForm />} />
        <Route path="/videos" element={<Videos />} />

        <Route path="/security/error-boundaries" element={<ErrorBoundary />} />
        <Route path="/security/loading-system" element={<LoadingSystem />} />
        <Route path="/security/security-alerts" element={<SecurityAlerts />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
