# CC SuperApp : QA Test Preparation Plan — v2

> ไฟล์นี้เป็นเวอร์ชันใหม่ของแผนเตรียมการทดสอบ โดยนำ **CC SuperApp-Feature Document** มาเทียบ (mapping) กับสถานะจริงของ codebase (repo: `cloud-contact-center`) แล้วกรอกข้อมูลลง Action Items และส่วนที่เกี่ยวข้องแทนที่ template เดิม
>
> - Source: Meeting Notes "CC SuperApp : To-Do List discussion" (9 พ.ย. 2026) + CC SuperApp-Feature Document (6 พ.ย. 2026)
> - วันที่เทียบ codebase: **9 พ.ย. 2026** (branch ปัจจุบัน)
> - ผู้จัดทำ: ทีม QA/FE (ร่างไว้สำหรับ N' Kratai นำไปทำ draft plan)

---

## 1. สรุปภาพรวม (Readiness Summary)

**ข้อสรุปหลัก:** Feature ที่อยู่ใน scope P1–P3 ของ meeting notes **ส่วนใหญ่ build แล้วและทดสอบได้เลย** มีจุดที่ต้องแก้ก่อนทดสอบ 2 กลุ่ม:

1. **GQL mapping gaps** — ระบบรันใน GraphQL-only mode ทุก environment (`VITE_USE_GRAPHQL="true"` และ `createHybridBaseQuery` **ไม่มี REST fallback**: URL ที่ไม่มี mapping ใน `GQL_MAP` จะ hard error) — endpoint บางตัวใน P1/P2/P7 ยังไม่มี mapping → ปุ่มที่ใช้ endpoint เหล่านั้นจะ error 100% ใน QA
2. **QA environment & test data** — environment/config/permissions/test data ตาม checklist ใน §3

| Tier | Feature (ตาม meeting notes) | สถานะ codebase | ทดสอบได้เมื่อไหร่ |
| --- | --- | --- | --- |
| P1 | Contact Management (Customer profile, link product/services/cases/appointments) | ✅ Build ครบ — มี GQL gap 1 จุด (`/customer_service/add`) | ทดสอบได้เลย **ยกเว้น** ปุ่ม Add Service (แก้ GQL B1.1 ก่อน) |
| P1 | Customer profile Custom Fields Configuration | ✅ ครบ (general fields + address + dynamic customer forms) | ทดสอบได้เลย |
| P1 | Customer Appointment Management | ✅ ครบ (list/calendar/create/status/type admin) | ทดสอบได้เลย |
| P2 | CRM & Customer 360 (Products, Inventory, Spare Parts) | ✅ ครบ | ทดสอบได้เลย |
| P2 | Order & Dispatch (spare parts order, life cycle, notification) | ✅ UI ครบ — GQL gap 3 จุด (order info/items) | ทดสอบได้เลย **ยกเว้น** สร้าง/แก้รายการใน cart (แก้ GQL ก่อน) |
| P2 | ~~Package~~ & Service | ✅ Service ครบ; Package เป็น menu disabled ใน topbar | ทดสอบเฉพาะ Service |
| P3 | Case & Ticket Management (create, dispatch, life cycle, history, notification) | ✅ ครบทั้ง FE + map (ArcGIS/MapTiler/Longdo) | ทดสอบได้เลย (QA ต้องมี ArcGIS key) |
| P3 | Linkage customer contact with case | ✅ ครบ (phone lookup, social identity, link existing, create new from case) | ทดสอบได้เลย |
| P4 | Real-time Dashboard & Analytics (Cases, Products) | ✅ ครบ (call-center KPI dashboard ยังเป็น shell) | ทดสอบได้เลย |
| P4 | Report (Case Reports, Order Reports) | ✅ ครบ — Jasper 13 รายงาน ตรงกับ Feature Doc ทุกตัว | ทดสอบได้เลย (ต้อง verify Jasper Server) |
| P5 | Workflow Automation + SLA Monitoring & Escalation | ✅ FE ครบ (editor v3, SOP, SLA countdown/escalation) | ทดสอบ FE ได้; scenario SLA breach ต้องรอ BE event |
| P6 | Dynamic Forms & Custom Fields | ✅ ครบ | ทดสอบได้เลย |
| P7 | User Management (users/roles/org/groups/RBAC/audit) | ✅ ครบ — GQL gap 1 จุด (toggle user status) + permission provisioning | ทดสอบได้เลย **ยกเว้น** เปิด/ปิด user (แก้ GQL ก่อน) |
| P8 | System Configuration (Service/Unit/Skill/Area) | ✅ ครบ (พื้นที่/area/place/device/organization settings ด้วย) | ทดสอบได้เลย |
| P9 | Core System GUI (multi-language, dark/light, responsive) | ✅ ครบ (en/th/cn catalogs + theme context) | ทดสอบได้เลย |
| — | Knowledge Base (note: เตรียมใน QA session ถัดไป) | ✅ ครบทั้ง module (`src/kms/`) | พร้อมตามแผน session ถัดไป |
| — | Contact Center (v0.2.0) | ⚠️ UI ครบแต่ backend 3CX adapter ยังไม่มี — รันด้วย mock lifecycle | ทดสอบ UI/flow ด้วย mock ได้; real call integration ยังทดสอบไม่ได้ |
| — | Live Chat (v0.2.0) | ❌ Placeholder pages (gated ด้วย `entitlement.chat`) | ยังไม่ทดสอบ |
| — | Campaign Management (v0.2.1) | ❌ ยังไม่มี code ใน repo | ยังไม่ทดสอบ (ตาม milestone: Dec 2026–Feb 2027) |

---

## 2. Feature Document ↔ Codebase Mapping (รายละเอียด)

> พิกัดทั้งหมดเป็น relative path จาก root repo (`cloud-contact-center`)

### P1 — Contact Management / Customer 360

| หัวข้อใน Feature Doc | สถานะใน codebase | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Customer profile create/update | ✅ | `src/cms/components/customer/CustomerCreate.tsx`, `src/cms/pages/Customer/Customer.tsx` (route `/cc/contacts-list`) | Validation: mobile/email/format ถูกแก้แล้ว (changelog: "fix ... CustomerCreate.tsx") |
| Show customer products | ✅ | `CustomerView.tsx` + `src/cms/store/api/customerProduct.ts` | GQL mapped: `/customer_product` + `/customer_product/add` (`customerProductQueries.ts`) → ทดสอบ Add Product ได้, หาก error ให้ดู console "No GraphQL mapping found" |
| Show customer services | ✅ | `customerService.ts` + `customerServiceQueries.ts` | `POST /customer_service/add` **ไม่มี mapping** ใน `GQL_CUSTOMER_SERVICE` (มีเฉพาะ `/customer_service`, `/customer_service/:id`) → Add Service จะ hard error ต้องแก้ก่อน |
| Show customer cases | ✅ | `useGetListCaseByCustomerIdQuery` (`caseApi.ts` → `caseQueries.ts` mapped) | — |
| Show customer appointments | ✅ | `useGetAppointmentByCustomerIdQuery` (mapped) | — |
| Contact Configuration (enable/disable field) | ✅ | `src/cms/pages/Customer/CustomerFormConfig.tsx` (route `/cc/contacts-configurations`) | General + Address fields + dynamic customer forms (import/export, versioning) |
| Customer notes | ✅ | `customer/notes/NoteManager.tsx` + `customerNoteRoutes.ts` (GQL mapped, key order load-bearing) | — |
| Social accounts (LINE/FB linkage) | ✅ | `customer/social/SocialAccountManager.tsx` | ใช้ใน case create (social identity resolve) ด้วย |
| Appointment Management | ✅ | `src/cms/pages/Appointment/Appointment.tsx` (route `/cc/appointment`), types admin `/cc/appointment-types` | Calendar view + status workflow (`next_stage` mapped) |

> **หมายเหตุ P1 (linkage):** meeting notes ระบุว่า "There is no customer linkage with products, services, cases using dummy menu in customer profile" — ตาม codebase ตอนนี้ปุ่ม Add Product / Add Services **เชื่อมต่อ API จริงแล้ว** (`useAddCustomerProductMutation` / `useAddCustomerServiceMutation`) ดังนั้นข้อนี้เป็น scope ที่ต้อง **verify ว่า linkage ใช้งานจริงครบหรือไม่** ไม่ใช่ทดสอบ dummy menu

### P2 — CRM & Customer 360 View

| หัวข้อใน Feature Doc | สถานะใน codebase | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Products catalog | ✅ | `src/cms/pages/Crm/Products/ProductListPage.tsx` (route `/cms/products`) | Brands/Categories/Stores เป็น master data ร่วม (routes `/cms/brands`, `/cms/categories`, `/cms/stores`) |
| Product stock | ✅ | `ProductStockPage.tsx` (`/cms/products/stock`) + `ProductStock.tsx` | Bug fix ที่ต้อง regression: off-by-one "Low Stock" ที่ threshold = 5 (changelog มี) |
| Inventory (spare parts) | ✅ | `src/cms/pages/Crm/Inventory/InventoryListPage.tsx` (`/cms/inventory`) | — |
| Spare parts stock in/out | ✅ | `InventoryStockPage.tsx` + `stock/StockInForm` / `StockOutForm` + barcode | Barcode in/out forms มีครบ |
| Order for services (spare parts) | ✅ | `src/cms/pages/Crm/Request/InventoryRequestListPage.tsx` (`/cms/inventory/request`) + `InventoryCartDrawer.tsx` | — |
| Order life cycle management | ✅ | `order.ts` (control/cancel/info) + `inventoryViewRequest.tsx` (status buttons) | **GAP:** `PUT /orders/:id/info` (ใช้โดย `InventoryCartDrawer.updateOrderInfo`) และ `POST /orders/:id/items` / `DELETE /orders/:id/items/:id` (ใช้โดย cart) **ไม่มี GQL mapping** → flow สร้าง order ผ่าน cart จะ hard error ที่ขั้นตอน update info / add item ต้องแก้ก่อน |
| Event Notification (order) | ⚠️ | `notificationApi.ts` (core) | FE notification infrastructure ครบ; **verify กับ BE** ว่า order event push จริงบน QA |
| Service (~~Package~~) | ✅ / disabled | `src/cms/pages/Crm/Services/ServiceListPage.tsx` (`/cms/services`); Package menu `disabled: true` ใน topbar | ทดสอบ Service เท่านั้น |
| Product Dashboard | ✅ | `ProductDashboardPage.tsx` (`/cms/products/dashboard`) | V1/V2 สองเวอร์ชันอยู่ — confirm กับ dev ว่า version ไหน live |

### P3 — Case & Ticket Management

| หัวข้อใน Feature Doc | สถานะใน codebase | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Create Case (fixed form) | ✅ | `src/cms/components/case/createCase/createCase.tsx` (route `/cms/case/creation`) | Dynamic form fields ตาม case type/sub-type; attachments; SLA countdown |
| Create Case + map (CAD/GIS) | ✅ | `createCase/map/` (ArcGIS default, MapTiler, Longdo — 3 provider สลับด้วย `VITE_MAP_PROVIDER`) | QA ใช้ `arcgis` → **QA env ต้องมี `VITE_ARCGIS_API_KEY`** (ดู §3 blocker B2) |
| Case Assignment Board | ✅ | `src/cms/pages/Case/caseAssignment.tsx` (route `/cms/case/assignment`) | Kanban by status, drag assign, officer workload; offline cache via IndexedDB |
| Case Details | ✅ | `src/cms/components/case/CaseDetailView.tsx` (route `/cms/case/:caseId`) | — |
| Case History | ✅ | `src/cms/pages/Case/CaseHistory.tsx` (route `/cms/case/history")` | list + `CaseHistory.tsx` component (add/edit/delete history — GQL mapped) |
| Dispatch management (no mobile app — ตาม note ใน Feature Doc) | ✅ | `createCase/map/staff/` (staff map, routing, drag-assign, ETA) + `dispatch.ts` API + `/cms/dashboard/dispatch` | Unit workload, SOP steps, cancel case/unit — GQL mapped ครบ |
| Case life cycle management | ✅ | case status flow (S000 draft / S001 publish ฯลฯ) + SLA escalation rules (`utils/escalationRules.ts`, `components/escalation/`) | — |
| Event Notification (case) | ⚠️ | websocket `WebSocketProvider` + `caseListSignal` + SLA escalation notification (มี unit tests) | verify WS connect บน QA (§3 B5) |
| Knowledge Suggestion (ขีดฆ่าใน meeting notes) | ✅ ออก scope | KMS module แยก — มี `docs/Feature_Checklist_Audit_20261103.md` | ตาม decision ใน meeting: ตัดออก (check with KMS team Aood) |
| AI Case Summarize (ขีดฆ่า) | ✅ ออก scope | ยังไม่มีใน repo | next phase |
| Linkage customer contact with case | ✅ | `CaseCustomerInput`, `LinkingExistingCustomer`, social identity resolve, phone→customer lookup ที่ save time (`createCase.tsx:203-232`) | — |
| Create new customers' profile from case action | ✅ | `CasePanel.tsx` → `CustomerCreate` (dialog "Add customer") | GQL `/customer/add` mapped |

### P4 — Dashboard & Report

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Cases dashboard | ✅ | `src/cms/components/dashboard/ServiceDashboard.tsx` (home `/cms/`) + `CaseSummaryByAreaPage` (choropleth + heatmap, 3 map providers) + `DispatchDashboardPage` | Export to PDF/HTML image (`jspdf`/`html2canvas`) |
| Custom dashboard (cross-module) | ✅ | `src/core/pages/Dashboard/CustomDashboard.tsx` (route `/dashboard/custom`) | widget registry + layout persistence (`dashboardLayoutApi`) |
| Products dashboard | ✅ | `ProductDashboardPage` | — |
| Call center dashboard statistics | ⚠️ | `src/cc/pages/Dashboard/CallCenterDashboard.tsx` (route `/cc/dashboard`) | **KPI endpoint ยัง DORMANT** (`callCenterDashboardApi.ts`: BFF ยังไม่มี, contract DRAFT) — หน้าจอเป็น shell ข้อมูล hardcoded/mocked → ทดสอบ UI shell ได้เท่านั้น, ไม่ assert ตัวเลข |
| Case Reports (4+4) | ✅ | `src/cms/pages/Report/Report.tsx` + `reportConfig.json` | Jasper: CASE__1_1x–1_4x, CASE__2_1x–2_4x — ตรงกับ Feature Doc ทุกตัว |
| Order Reports (3+3) | ✅ | เหมือนบรรทัด Case Reports (หน้าเดียวกัน) | Jasper: CRM__1_1x–1_3x, CRM__2_1x–2_3x |

> Jasper: QA config ชี้ไปที่ `https://jasper-qa-ccsuperapp.one-sky.ai/` — **verify ว่า report units ถูก deploy บน server ตัวนั้น + มีข้อมูล QA ให้ render** (ถ้าไม่มีข้อมูล รายงานเปิดได้แต่ว่าง → จัดเตรียม test data ก่อน §3 B4)

### P5 — Workflow Automation

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Dynamic workflow configuration (case type) | ✅ | `src/cms/pages/Workflow/List.tsx` + `Editor.tsx` v3 (route `/cms/workflow/list`, `/cms/workflow/editor/v3`) | Canvas editor, import/export, validate, versioning/rollback — GQL mapped |
| Dynamic workflow configuration (order type) | ⚠️ | workflow engine เป็นตัวเดียว; order ใช้ `orderWorkflowQueries` (GQL root `OrderWorkflow`) | verify ว่ามี workflow template สำหรับ order บน QA |
| SLA Monitoring & Escalation | ✅ (FE) | `components/Sla/Sla.tsx` (countdown badge), `components/countDownSla`, `utils/escalationRules.ts` (thresholds จาก env: `VITE_CASE_ASSIGNMENT_WARING_SLA=2700s`, `ALERT_SLA=1800s`) | **Scenario test:** ต้องมี case ที่ SLA ใกล้ breach บน QA — จัด test data (§3 B4); escalation notification event รอ BE push |

### P6 — Dynamic Forms & Custom Fields

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Create Dynamic forms | ✅ | `src/cms/pages/Forms/FormManagement.tsx` (`/cms/form-management`) + `DynamicForm` (`/cms/dynamic-form`) | drag & drop, version modal, import/export (formType customer/case ฯลฯ) |
| Case Meta data Custom Field Configuration | ✅ | `caseTypeSubType/` + `formFields/` (form fields ตาม case sub-type, `useCaseTypeForm`) | QA ต้องมี case type + form configured (§3 B4) |
| Contact Custom Fields Configuration | ✅ | `CustomerFormConfig.tsx` + customer forms (`/customer-forms` GQL mapped) | — |

### P7 — User Management & Role Privilege

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| User Management | ✅ | `src/core/pages/Admin/UserManagement.tsx` (route `/user`) | **GAP:** `PUT /users/:id/status` (toggle active) ไม่มี GQL mapping → ปุ่ม disable/enable user hard error ต้องแก้ก่อน (endpoint นี้มี consumer ใน UI — verify ขณะ test) |
| Role & privilege | ✅ | `src/core/pages/Admin/RolePrivilegeManagement.tsx` (route `/role-privilege`) | RBAC ผ่าน `PermissionManager` + `PermissionGate` |
| User Groups | ✅ | `UserGroupManagement.tsx` (`/user-group`) | GQL mapped |
| Organization Management | ✅ | `OrganizationManagementPage` (`/organization`) | command/department/station GQL mapped |
| Audit Logs & Compliance | ✅ | `src/core/pages/Admin/AuditLog.tsx` (route `/auditlog`, gated `entitlement.audit`) | **verify entitlement** เปิดให้ tenant QA (§3 B3) |
| ABAC | ⚠️ | พบ entitlement gates (`EntitlementGate`: `entitlement.kb`, `entitlement.chat`) — ไม่มี ABAC policy engine แบบเต็ม | confirm scope กับ PM — ถ้าไม่มีใน product plan, ตัดออกจาก test case |

### P8 — System Configuration

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Service Type Management | ✅ | `src/cms/pages/Admin/ServiceManagement.tsx` (`/cms/service`) | GQL `/service_type` mapped |
| Unit Management | ✅ | `UnitManagementPage` + `UnitFormPage` (`/cms/unit`) | MDM units — GQL mapped; ใช้ใน dispatch |
| Skill Management | ✅ | `SkillManagementPage` (`/cms/skill`) | GQL mapped |
| Area Management | ✅ | `AreaManagementPage` (`/cms/area`) + `AreaTemplateManagement` (versioned templates) | GQL mapped; geometry source `org` บน QA |
| Organization Settings | ✅ | `OrganizationSettingsManagementPage` (`/cms/settings/organization`) | — |
| (เพิ่มเติมใน codebase) Place / Device / Property / Case Result | ✅ | `/cms/place`, `/cms/device`, `/cms/property`, `/cms/case-result` | แนะนำเพิ่มใน test scope ของ P8 — เป็น master data ที่ case/dispatch ขึ้นกับ |

### P9 — Core System GUI

| หัวข้อ | สถานะ | พิกัด | หมายเหตุ |
| --- | --- | --- | --- |
| Multi-language (en/th/cn) | ✅ | `public/i18n/{en,th,cn}.json` (ขนาด 206/330/184 KB) + `LanguageContext` | th เป็น default; switch ผ่าน topbar |
| Dark & Light Mode | ✅ | `src/core/context/ThemeContext.tsx` + `ThemeToggleButton` | — |
| Mobile & Web Responsive | ✅ (ต้อง verify) | sidebar rail (<768px) + responsive layouts | E2E ยังไม่มี — manual cross-device check |

### นอก P1–P9 แต่อยู่ใน Feature Doc

| หัวข้อ | สถานะ | หมายเหตุ |
| --- | --- | --- |
| Knowledge Base (Feature Doc §09) | ✅ ครบ | `src/kms/` (~130 files): articles + review/approve workflow, category, banner, broadcast, file manager, dashboard, source management — ตาม meeting: เตรียมใน **QA session ถัดไป** (Jane & Champ คุยกับ Aood แล้ว) |
| Contact Center (Feature Doc §10) | ⚠️ | Softphone / screen pop / supervision UI ครบ (`src/cc/`) แต่ **backend 3CX adapter ยังไม่มี** — ทุก call control command รันผ่าน mock lifecycle (DEV + `VITE_MOCK_API`) → บน QA (`VITE_MOCK_API=false`) ทดสอบ UI/layout ได้; incoming call test ได้ผ่าน `window.emitMockIncomingCall` เฉพาะ dev build |
| Live Chat (Feature Doc §11) | ❌ | `/cc/lobby-incoming`, `/cc/chat-history` เป็น placeholder pages (gated `entitlement.chat`) — ตาม milestone: Nov–Dec 2026 |
| Campaign Management | ❌ | ยังไม่มี code ใน repo — ตาม milestone: Dec 2026–Feb 2027 (มี docs: `docs/AI-Notes-Campaign-Management-Discussion-on-Oct-29-2026.md`, `docs/Campaign-Outbound-Technical-Discussion.md`) |

---

## 3. Blockers / สิ่งที่ต้องทำให้เสร็จก่อนเริ่มทดสอบ

| ## | Blocker | รายละเอียด | Owner (เสนอ) | Priority |
| --- | --- | --- | --- | --- |
| B1 | **GQL mapping gaps** (hard error ใน QA เพราะ GraphQL-only ไม่มี REST fallback) | B1.1: `POST /customer_service/add` → เพิ่มใน `GQL_CUSTOMER_SERVICE` (`src/cms/store/api/graphql/customerServiceQueries.ts`) • B1.2: `PUT /orders/:id/info`, `POST /orders/:id/items`, `DELETE /orders/:id/items/:id` → เพิ่ม mapping (file `orderItemQueries.ts` ปัจจุบันเป็น dead code — keys ชนกับ `orderWorkflowQueries.ts`) • B1.3: `PUT /users/:id/status` → เพิ่มใน `GQL_USER` (`src/core/store/api/graphql/userQueries.ts`) • (verify แล้ว: `POST /customer_product/add` มี mapping อยู่แล้ว — ไม่ได้อยู่ในรายการนี้) | FE dev | B1.1 = P1-blocking (Add Service) • B1.2 = P2-blocking (order cart) • B1.3 = P7-blocking (user status) |
| B2 | **QA map keys** | `.env.qa` ไม่มี `VITE_ARCGIS_API_KEY` / `VITE_ARCGIS_ROUTE_URL` ขณะที่ `VITE_MAP_PROVIDER="arcgis"` → case create map (geocode, boundaries, device/place/staff layers) จะพังใน QA build — ให้ dev confirm ว่า key ไปด้วย mechanism ไหน (shared `.env` หรือ deploy-time) และ verify บน QA จริง | Dev + DevOps | P3-blocking |
| B3 | **QA permission provisioning** | user ทดสอบต้องถูก assign permissions: `contact.view`, `contact_config.view`, `appointment.view`, `case.create/assign/view_history`, `product.view`, `sparepart.view`, `sparepart_stock.view`, `order.view`, `crm_service.view`, `crm_dashboard`, `dashboard.view`, `form.create`, `package.view`(N/A), role mgmt, `organization_settings.manage`, `entitlement.audit` — sidebar/topbar menu จะไม่โชว์ถ้าไม่มี | P Jay / P X (backend) | P1-blocking |
| B4 | **QA test data** | Customer profiles (ที่มี/ไม่มี mobile), products+serial numbers, inventory+spare parts, stores, case types/subtypes + forms, areas (geometry), units+skills, appointment types, order samples (ทุก status), cases ในหลาย status + case ที่ SLA ใกล้ breach (สำหรับ P5), Jasper report source data | P Jane (Apiwat) + Dev | P1–P5 |
| B5 | **QA build & connectivity** | deploy build ล่าสุดบน `skyai-cloud-cc-qa.one-sky.ai` (BFF `cc-bff-qa`, WS `wss://welcome-case-qa.one-sky.ai/ws`); smoke: login → BFF reachable → WS connect → ตรวจ console ว่าไม่มี "No GraphQL mapping found" ระหว่างเดินหน้าหลัก | DevOps | ทั้งหมด |
| B6 | **Jasper Server** | verify report units (CASE__1_1x…2_4x, CRM__1_1x…2_3x) deploy บน `jasper-qa-ccsuperapp.one-sky.ai` + login ผ่าน (csrf token ใน `.env.qa`) + มีข้อมูล render | QA + Dev | P4-blocking |
| B7 | **SIT/PROD ไม่พร้อม** | `.env.sit` และ `.env.production`: `VITE_GRAPHQL_BASE_URL=""` (TODO) → environment นี้ใช้ไม่ได้ใน mode GraphQL — แผนนี้ทดสอบบน **QA เท่านั้น** จนกว่าจะ set | DevOps | info |
| B8 | **3CX adapter (out of scope รอบนี้)** | Contact Center real call ยังทดสอบไม่ได้ — ใช้ `docs/CC-ScreenPop-Softphone-Test-Walkthrough.md` + `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` เมื่อ adapter พร้อม | FE + BE | v0.2.0 |

---

## 4. Action Items (ตามลำดับ P ของ meeting notes, กรอกจาก codebase analysis)

### P1. First priority

- [ ] **Contact Management**
  - [ ] Customer profile — create/update: field validation (mobile required+format, email format), duplicate phone, search by name/phone, edit, view detail
    - Codebase: `CustomerCreate.tsx` / `CustomerView.tsx` — routes `/cc/contacts-list` (list) + detail drawer
    - Test data: customer ที่มี mobile, ไม่มี mobile, มี social accounts
  - [ ] Verify customer linkage จริง (ไม่ใช่ dummy menu — meeting notes ระบุว่ามี dummy menu):
    - [ ] Linked products list + **Add Product** (ปุ่ม Add product → serial number + store) — ⚠️ smoke `POST /customer_product/add` (มี GQL mapping แล้ว — หาก error ให้ดู console "No GraphQL mapping found")
    - [ ] Linked services list + **Add Service** (service type + date) — ⚠️ **blocked B1.1** (`/customer_service/add` ไม่มี GQL mapping)
    - [ ] Linked cases (list case ของ customer, click → case detail)
    - [ ] Linked appointments (list + create from customer)
  - [ ] Customer notes: create/edit/delete, note category
  - [ ] Social accounts: link LINE/Facebook, status draft/linked, unlink
  - [ ] Contact Configuration (route `/cc/contacts-configurations`): enable/disable general fields + address fields, verify ว่า field ที่ disable ไม่โชว์ใน profile, dynamic customer form (create/import/version/publish)
  - [ ] **Customer Appointment Management** (route `/cc/appointment`, `/cc/appointment-types`): list/calendar, create appointment, status workflow (next stage), appointment type admin

### P2. Second priority

- [ ] **CRM & Customer 360 View**
  - [ ] Product & Inventory Management: brand/category CRUD, product CRUD, store stock, product stock (verify regression: qty = 5 ต้องแสดง "Low Stock")
  - [ ] Spare parts & Inventory Management: inventory CRUD, stock in/out (manual + barcode), stock history, stock summary
- [ ] **Order & Dispatch Management**
  - [ ] Create order spare parts (cart → confirm) — ⚠️ **blocked B1.2** (GQL: `PUT /orders/:id/info`, `POST /orders/:id/items`, `DELETE /orders/:id/items/:id`)
  - [ ] Order life cycle management: request → approve/reject → status transitions (control order), cancel order (verify remark required)
  - [ ] Event Notification: verify notification แสดงเมื่อ order เปลี่ยน status (⚠️ verify BE push บน QA — หาก BE ยังไม่ push, log เป็น gap ให้ BE)

### P3. Third priority

- [ ] **Case & Ticket Management**
  - [ ] Create case & ticket (fixed form): ฟิลด์บังคับตาม case type, dynamic form fields, attachment upload (file upload ต้องผ่าน multipart — verify ใน GraphQL mode), save draft (S000) vs submit (S001)
  - [ ] Map (CAD/GIS): geocode address, boundary levels, device/place layers, sketch — ⚠️ **blocked B2** (ArcGIS key)
  - [ ] Dispatch management (no mobile app integration — ตาม Feature Doc note): staff map, assign unit (drag + panel), SOP steps, unit workload, cancel dispatch — verify `/cms/dashboard/dispatch` real-time feed
  - [ ] Case life cycle management: status transitions ทั้งหมด + SLA countdown badges (warning 45min/alert 30min ตาม env thresholds)
  - [ ] Case history (list/detail/add): history CRUD per case
  - [ ] Event Notification: websocket case list live update, SLA escalation notification (⚠️ test case ที่ SLA ใกล้ breach — B4)
  - [ ] Linkage customer contact with case:
    - [ ] Link existing customer (phone lookup, `LinkingExistingCustomer`)
    - [ ] Create new customers' profile from case action (dialog "Add customer" → save → case link)
    - [ ] Phone-only case: save case ต้อง resolve phone → customer อัตโนมัติ (verify case.customerId ถูก set)
    - [ ] Social case: resolve via social identity (LINE/FB) — ใช้ test data จาก P1
  - [ ] Knowledge Suggestion — ~~ออก scope~~ (ขีดฆ่าตาม meeting)
  - [ ] AI Case Summarize — ~~ออก scope~~ (next phase)

### P4. Fourth priority

- [ ] **Real-time Dashboard & Analytics**
  - [ ] Cases dashboard (home `/cms/`): widgets, export (PDF/image), case summary by area (choropleth + heatmap + table)
  - [ ] Dispatch dashboard (`/cms/dashboard/dispatch`): KPI row, officer status, events feed, heatmap
  - [ ] Custom dashboard (`/dashboard/custom`): add/remove widgets, layout persist (log out/in ต้องจำ layout)
  - [ ] Products dashboard (`/cms/products/dashboard`): confirm V1 vs V2 (ถาม dev) + export
  - [ ] Call center dashboard (`/cc/dashboard`): UI shell เท่านั้น (KPI endpoint ยัง DORMANT — assert layout/navigation ไม่ assert ตัวเลข)
- [ ] **Report** (⚠️ **blocked B6** — Jasper + data)
  - [ ] Case Reports: 1.1–1.4 (รายวัน/รายเดือน/เปรียบเทียบ), 2.1–2.4 (detail/โดยประเภท/โดยผล/โดยสถานที่) — verify parameter (date range), data ตรงกับ source, locale th/en
  - [ ] Order Reports: 1.1–1.3 (daily/inventory/spare parts), 2.1–2.3 (details/request parts/top 10 sales)

### P5. Fifth priority

- [ ] **Workflow Automation Engine**
  - [ ] Dynamic workflow configuration related case type: create workflow (canvas), nodes/conditions, validate, publish, version + rollback; case ที่ link workflow ต้องวิ่ง SOP ถูก
  - [ ] Dynamic workflow configuration related order type: ⚠️ verify template order workflow อยู่บน QA
  - [ ] SLA Monitoring & Escalation: countdown display, warning/alert thresholds (2700s/1800s), escalation action + notification (⚠️ BE event — B4 test data)

### P6. Sixth priority

- [ ] **Dynamic Forms & Custom Fields**
  - [ ] Create Dynamic forms: builder (fields, layout), validation rules, version modal, import/export (verify formType รักษาอยู่หลัง import — changelog fix), publish
  - [ ] Case Meta data Custom Field Configuration: case type → sub-type → form fields, verify create case form render ตาม config
  - [ ] Contact Custom Fields Configuration: → ทับกับ P1 Contact Configuration (test ครั้งเดียว, cross-ref)

### P7. Seventh priority

- [ ] **User Management**
  - [ ] User Management: CRUD, search, **toggle active** (⚠️ **blocked B1.3** — `PUT /users/:id/status` ไม่มี GQL mapping), change/reset password, user group membership (add/batch/remove)
  - [ ] Role & privilege: role CRUD, assign permissions (multi), role-permission matrix
  - [ ] Organization Management: organization tree, command/department/station
  - [ ] RBAC: user แต่ละ role เห็น menu/button ต่างกัน (matrix ตาม B3 permissions), `ProtectedRoute` block direct URL
  - [ ] ABAC: ⚠️ confirm scope (codebase พบ entitlement gates เท่านั้น)
  - [ ] Audit Logs (`/auditlog`): ⚠️ verify `entitlement.audit` เปิดบน QA; filter by user/time, action coverage (login, CRUD, export)
- [ ] (Compliance tracking: audit log coverage —รวมใน audit tests ข้างต้น)

### P8. Eighth priority

- [ ] **System Configuration**
  - [ ] Service Type Management: CRUD, ใช้ใน appointment + customer service
  - [ ] Unit Management: CRUD, unit properties (bulk assign), link departments/commands/stations
  - [ ] Skill Management: CRUD, user↔skill linkage
  - [ ] Area Management: CRUD, country/province/district tree, area template (version/publish/adopt)
  - [ ] (เพิ่ม) Place / Device / Property / Case Result Management: CRUD — เป็น master data ของ map + case

### P9. Ninth priority

- [ ] **Core System GUI (UI/UX)**
  - [ ] Multi-language: switch en/th/cn — spot check ทุก P1–P8 screen (translation key ไม่ตก, layout ไม่พัง), th เป็น default
  - [ ] Dark & Light Mode: switch ผ่าน topbar, persist, verify ทุก module (cms/cc/kms) + charts/map theme
  - [ ] Mobile & Web Responsive: breakpoints (rail <768px), form/modal บน mobile, case form + map

---

## 5. Environment & Setup Checklist (ก่อนวัน test)

- [ ] QA build ใหม่ deploy บน `skyai-cloud-cc-qa.one-sky.ai` (build ด้วย `vite build --mode qa`, หมายเหตุ: build ต้องใช้ NODE_OPTIONS 8GB ตาม script)
- [ ] `VITE_USE_GRAPHQL="true"` ทำงานกับ BFF `cc-bff-qa.one-sky.ai/graphql` — smoke ทุกหน้าหลัก, console ต้องไม่มี "No GraphQL mapping found" (ถ้ามี = GQL gap ใหม่ → report FE)
- [ ] WS `wss://welcome-case-qa.one-sky.ai/ws` connect (devtools → Network → WS), real-time case list update
- [ ] ArcGIS key ทำงาน (case create → map load, geocode ค้นหาได้) — B2
- [ ] Jasper login + 1 รายงานสุ่ม render — B6
- [ ] Login user ทดสอบ: 1 admin (ครบ permission), 1 agent (case only), 1 viewer (read-only) — B3
- [ ] Test data seed ตาม B4 (customer/product/inventory/order/case/appointment + SLA-breach case)
- [ ] Unit test baseline: `pnpm test` ผ่าน 52 test files ก่อนเริ่ม (regression gate)
- [ ] `VITE_MOCK_API="false"` (QA รัน real API — mock utilities ใช้ใน dev build เท่านั้น)

---

## 6. Test Execution Order (เสนอ)

> วัตถุประสงค์: ทดสอบตาม P1→P9 แต่ลำดับให้ data dependency ทำงาน (สร้าง data ใน P1 ใช้ต่อใน P2–P4)

| Session | Scope | เงื่อนไข |
| --- | --- | --- |
| S0 (setup) | Environment & Setup Checklist (§5) ทั้งหมด + smoke walk ทุก module (login, navigation, console clean) | ก่อน S1 |
| S1 | P1 Contact Management + Custom Fields + Appointment | B1.1 (customer service GQL) + B3 + B4 (customers) |
| S2 | P2 CRM: products/inventory/spare parts + P2 order/cart | B1.2 (order items GQL) + B4 (inventory, orders) |
| S3 | P3 Case: create (incl. map), linkage, history, assignment, dispatch | B2 (ArcGIS) + B4 (case types, areas, units) |
| S4 | P3/P5 SLA + escalation scenario + P4 dashboards | B4 (SLA-breach cases) + WS live |
| S5 | P4 Reports (Jasper) + P6 Forms/Workflows | B6 |
| S6 | P7 User Mgmt + P8 Configuration | B1.3 (user status GQL) |
| S7 | P9 UI (i18n/theme/responsive) — cross-cut, ทำร่วมกับ session อื่นได้ | — |
| S8 (session ถัดไป) | Knowledge Base + CAD/GIS (ตาม meeting decision) | KB data + Aood integration progress |
| (out of scope รอบนี้) | Contact Center real call, Live Chat, Campaign Management | รอ B8 / milestone |

---

## 7. Risks & Open Questions (จาก codebase analysis)

| ## | Risk / Question | Impact | คำถามให้ทีม |
| --- | --- | --- | --- |
| R1 | GQL mapping gaps (B1) — ปุ่มหลัก P1/P2/P7 hard error | High | Dev fix ก่อน S1/S2/S6 หรือ QA ทดสอบ feature อื่นไปก่อนแล้วกลับมา |
| R2 | `.env.qa` ไม่มี ArcGIS key (B2) | High (P3) | Dev confirm deployment key mechanism |
| R3 | Order item/update GQL shadowed (`orderItemQueries.ts` เป็น dead code) | Med (P2) | BE confirm operation names สำหรับ order items ก่อน FE เพิ่ม mapping |
| R4 | Call center KPI dashboard ยัง DORMANT (contract DRAFT Q1–Q10 pending) | Med (P4) | BE ETA ของ BFF endpoint |
| R5 | Event notification (order/case SLA) ยังไม่ verify BE push บน QA | Med (P2/P3/P5) | BE confirm event trigger พร้อม data test หรือไม่ |
| R6 | ABAC ไม่มีใน codebase (มี entitlement gates) | Low | PM confirm product scope |
| R7 | Product Dashboard มี V1/V2 | Low | Dev confirm live version |
| R8 | SIT/PROD BFF URL ยังว่าง (B7) | — (QA only รอบนี้) | DevOps planning |
| R9 | Live Chat เป็น placeholder, Campaign ยังไม่มี code | — (out of scope) | ตาม milestone Nov–Dec 2026 / Dec 2026–Feb 2027 |

---

## 8. Appendix — References

- Feature Document: `CC SuperApp-Feature Document` (6 พ.ย. 2026) — mapping ครบทุก §01–§11 ใน §2 ของไฟล์นี้
- Meeting Notes เดิม: `CC SuperApp : To-Do List discussion` (9 พ.ย. 2026)
- CC Integration test docs (ใน repo `docs/`):
  - `CC-Integration-Dev-Test-Guide.md`
  - `CC-ScreenPop-Softphone-Test-Walkthrough.md`
  - `CALL_INCOMING-Mock-Cutover-Checklist.md`
  - `CALL_CENTER_DASHBOARD_INVALIDATED-Test-Procedures.md`
  - `Feature_Checklist_Audit_20261103.md`
  - `feature-gap-matrix-2026-10-29.md` (gap analysis ล่าสุดก่อนหน้า)
- GQL mapper mechanics: `src/core/utils/gqlMapper.ts`, `src/core/store/api/hybridBaseQuery.ts` (GraphQL-only, no REST fallback)
- Key API slices ที่ test ขึ้นกับ: `src/cms/store/api/{custommerApi,customerProduct,customerService,order,caseApi,dispatch}.ts`, `src/core/store/api/{userApi,roleQueries,userGroupQueries,organizationApi,auditApi,notificationApi}.ts`
