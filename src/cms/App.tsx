// src/cms/App.tsx
// React Imports
import { Routes, Route } from "react-router-dom";

// Template Imports
import { ScrollToTop } from "@/core/components/common/ScrollToTop";
import NotFound from "@/core/pages/OtherPage/NotFound";
import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import AppLayout from "@/cms/layout/AppLayout";
import Blank from "@/cms/pages/Blank";
import Calendar from "@/cms/pages/Calendar";
import FormElements from "@/cms/pages/Forms/FormElements";

// Authentication Imports
import { AuthenticatedContent } from "@/core/components/auth/AuthenticatedContent";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";

// Case Management Imports
import CasesAssignment from "@/cms/pages/Case/caseAssignment";
import CaseDetailView from "@/cms/components/case/CaseDetailView";
import CaseHistoryPage from "@/cms/pages/Case/CaseHistory";
import CaseCreation from "@/cms/components/case/createCase/createCase";
import CaseDetailViewSchedule from "@/cms/components/case/createCase/createCaseSchedule";

// Dashboard Mock Data (Archived) Imports
import AgentStatusDashboard from "@/cms/components/dashboard/AgentStatusDashboard";
import AnalyticsDashboard from "@/cms/components/dashboard/AnalyticsDashboard";
import CallcenterDashboard from "@/cms/components/dashboard/CallcenterDashboard";
import ServiceDashboard from "@/cms/components/dashboard/ServiceDashboard";

// Form Builder Imports
import FormManagement from "@/cms/pages/Forms/FormManagement"

// Workflow Builder Imports
import WorkflowListPage from "@/cms/pages/Workflow/List";
import WorkflowEditorPage from "@/cms/pages/Workflow/Editor";

// System Configuration Imports
import AreaManagementPage from "@/cms/pages/Admin/AreaManagement";
import AreaTemplateDetailPage from "@/cms/pages/Admin/AreaTemplateDetail";
import AreaTemplateManagementPage from "@/cms/pages/Admin/AreaTemplateManagement";
import AreaTemplateVersionsPage from "@/cms/pages/Admin/AreaTemplateVersions";
import PropertyManagementPage from "@/cms/pages/Admin/PropertyManagement";
import ServiceManagementPage from "@/cms/pages/Admin/ServiceManagement";
import SkillManagementPage from "@/cms/pages/Admin/SkillManagement";
import UnitFormPage from "@/cms/pages/Admin/UnitForm";
import UnitManagementPage from "@/cms/pages/Admin/UnitManagement";

// Report Imports
import ReportPage from "@/cms/pages/Report/Report";

// Product
import BrandListPage from "@/cms/pages/Crm/Brands/BrandListPage";
import CategoryListPage from "@/cms/pages/Crm/Categories/CategoryListPage";
import InventoryListPage from "@/cms/pages/Crm/Inventory/InventoryListPage";
import InventoryRequestListPage from "@/cms/pages/Crm/Request/InventoryRequestListPage";
import InventoryStockPage from "@/cms/pages/Crm/Inventory/InventoryStockPage";
import ProductDashboardPage from "@/cms/pages/Crm/Products/ProductDashboard";
import ProductListPage from "@/cms/pages/Crm/Products/ProductListPage";
import ProductStockPage from "@/cms/pages/Crm/Products/ProductStockPage";
import ServiceListPage from "@/cms/pages/Crm/Services/ServiceListPage";
import StoreListPage from "@/cms/pages/Crm/Stores/StoreListPage";

// Security & Error Handling Imports
import OfflineState from "@/core/components/offline/OfflineManager";

// Custom Theme Imports
import ThemeDebugger from "@/core/components/debug/ThemeDebugger";

export default function CmsApp() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          {/* Home Page */}
          <Route path="/" element={<ServiceDashboard />} />

          {/* Authentication */}
          <Route path="/authenticate" element={<AuthenticatedContent />} />

          {/* Case Management (Latest) */}
          <Route
            path="/case/assignment"
            element={
              <ProtectedRoute requiredPermissions={["case.assign"]}>
                <CasesAssignment />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/case/creation"
            element={
              <ProtectedRoute requiredPermissions={["case.create"]}>
                <CaseCreation/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/case/creation_schedule_date"
            element={
              <ProtectedRoute requiredPermissions={["case.create"]}>
                <CaseDetailViewSchedule caseData={undefined}/>
              </ProtectedRoute>
            }
          />

          <Route path="/case/history" element={<CaseHistoryPage />} />

          {/* Case Management (Archived) */}
          <Route path="/case-assignment" element={<CasesAssignment />} />
          
          <Route
            path="/case-creation"
            element={
              <ProtectedRoute requiredPermissions={["case.create"]}>
                <CaseCreation/>
              </ProtectedRoute>
            }
          />

          <Route path="/case/:caseId" element={<CaseDetailView />} />

          {/* Customizable Dashboard moved to a top-level /dashboard/custom route (src/App.tsx) */}

          {/* Dashboard Mock Data (Archived) */}
          <Route path="/dashboard/agent-status" element={<AgentStatusDashboard />} />
          <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
          <Route path="/dashboard/callcenter" element={<CallcenterDashboard />} />

          {/* Forms Builder */}
          <Route path="/form-elements" element={<FormElements />} />

          <Route
            path="/dynamic-form"
            element={
              <ProtectedRoute requiredPermissions={["form.create"]}>
                <DynamicForm enableSelfBg={true}/>
              </ProtectedRoute>
            }
          />

          <Route path="/form-management" element={<FormManagement />} />

          {/* Workflow Management (SOP) */}
          <Route path="/workflow/list" element={<WorkflowListPage />} />
          {/* Workflow Builder (Latest Version: v0.3.0) */}
          <Route path="/workflow/editor/v3" element={<WorkflowEditorPage />} />
          <Route path="/workflow/editor/v3/:id" element={<WorkflowEditorPage />} />
          <Route path="/workflow/editor/v3/:id/:action" element={<WorkflowEditorPage />} />

          {/* System Configuration */}
          <Route path="/area" element={<AreaManagementPage />} />
          {/* Area templates: versioned, publishable geography an org adopts into its own areas.
              The :id routes come after the list route but React Router matches on
              specificity, not order. */}
          <Route path="/area-template" element={<AreaTemplateManagementPage />} />
          <Route path="/area-template/:id" element={<AreaTemplateDetailPage />} />
          <Route path="/area-template/:id/versions" element={<AreaTemplateVersionsPage />} />
          <Route path="/property" element={<PropertyManagementPage />} />
          <Route path="/service" element={<ServiceManagementPage />} />
          <Route path="/skill" element={<SkillManagementPage />} />
          <Route path="/unit" element={<UnitManagementPage />} />
          <Route path="/unit/create" element={<UnitFormPage />} />
          <Route path="/unit/:id" element={<UnitFormPage />} />
          <Route path="/unit/:id/edit" element={<UnitFormPage />} />

          {/* Report */}
          <Route path="/report" element={<ReportPage />} />

          {/* Product Management */}
          {/* Brand and category are shared master data for both products and spare parts,
              so they sit alongside the product routes and reuse product.view. */}
          <Route
            path="/brands"
            element={
              <ProtectedRoute requiredPermissions={["product.view"]}>
                <BrandListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute requiredPermissions={["product.view"]}>
                <CategoryListPage />
              </ProtectedRoute>
            }
          />

          {/* Stores hold the serialized stock of both products and spare parts, so like brand
              and category they sit alongside the product routes and reuse product.view. */}
          <Route
            path="/stores"
            element={
              <ProtectedRoute requiredPermissions={["product.view"]}>
                <StoreListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredPermissions={["sparepart.view"]}>
                <InventoryListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/request"
            element={
              <ProtectedRoute requiredPermissions={["order.view"]}>
                <InventoryRequestListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/stock"
            element={
              <ProtectedRoute requiredPermissions={["sparepart_stock.view"]}>
                <InventoryStockPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/dashboard"
            element={
              <ProtectedRoute requiredPermissions={["crm_dashboard.view"]}>
                <ProductDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute requiredPermissions={["product.view"]}>
                <ProductListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/stock"
            element={
              <ProtectedRoute requiredPermissions={["product_stock.view"]}>
                <ProductStockPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute requiredPermissions={["crm_service.view"]}>
                <ServiceListPage />
              </ProtectedRoute>
            }
          />

          {/* Others Page */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />

          {/* Security & Error Handling */}
          <Route path="/security/offline-state" element={<OfflineState />} />

          {/* Custom Theme */}
          <Route path="/theme-debugger" element={<ThemeDebugger />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
