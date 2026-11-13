# SKYICT Service Center Project-Prototype (v3)

## To-Do List : Setting Up New SKYICT Tenant

***Date: Nov 10, 2026***

> **v3 Note:** ถอดแบบจาก v2 โดยเติมข้อมูลในแต่ละตารางให้ครบตามโมเดลข้อมูลจริงของระบบ (เทียบจาก codebase: `src/**/types/*`, `src/cms/components/ui/status/status.tsx`, `db/seed/skyict/*`, `docs/SKYICT-Tenant-Onboarding-Runbook.md`) ข้อมูลใดที่ตรวจสอบจากโค้ดไม่ได้จะถูกทำเครื่องหมาย **UNVERIFIED** รายการแก้ไขจาก v2 ดูหัวข้อ "Correction Notes (v3 vs v2)" ท้ายเอกสาร

## **Overview**

Integrated Omnichannel Contact Center, CRM, and Case Management Platform designed for modern enterprises with scalable cloud-native architecture, intelligent automation, and unified customer engagement.

## **CC Super Apps Product**

## **01** **Customer 360ํ**

Aggregates every interaction from customer into one dashboard.

Connects profiles, products, history, and service cases in one place.

### **Contact management**

The process of storing, organizing, and tracking information about your customers, leads, and communication history. It acts as a digital address book that records basic details like phone numbers and emails, while also tracking every past conversation, purchase, and meeting.

### **Contact Configuration**

The company can store necessary customer information and can specify that only essential customer information is displayed to agents or customer service, by choosing to **enable** or **disable** it at the field level, even if the system stores a variety of data.

The company can store data in two main parts:

- **General Customer Information field**: A customer field commonly used for general information storage.

- **Dynamic Customer Custom Field**: A customer field that can be customized with an unlimited number of additional fields to accommodate diverse customer data storage needs and requirements.

### **Appointment Management**

Appointment management is the process of planning, tracking, and organizing meetings between service providers and their clients. Today, businesses usually use digital appointment management systems to let appointment with customers availability, book time slots online.

---

## **02** **CRM**

Customer Relationship Management.

This system is software or a platform used to record, track, and manage all customer information, from contact history and order volume to purchasing behavior and customer-reported issues. It helps businesses provide efficient customer care and increase sales.

### **Products**

The digital infrastructure is used to organize a company's product catalog and track the flow of goods from suppliers to storage.

**Product inventory** is the complete list of raw materials, parts, and finished goods that a business has on hand to sell to customers. It represents the physical products a company owns that are sitting on store shelves, packed in warehouses, or moving along the supply chain.

**Product stock** is the exact quantity of finished goods that a business has available for immediate sale to customers. It refers specifically to the final, retail-ready products sitting on your store shelves or warehouse racks right now.

### **Spare Parts**

The digital infrastructure used to organize a company's spare parts catalog and track the flow of parts from suppliers to storage.

**Spare parts inventory** is the collection of backup parts and materials kept on hand to repair or maintain equipment and machinery. Unlike product stock, these items are not meant to be sold to customers. Instead, they are used internally to fix things when they break and to perform routine maintenance so your business operations do not grind to a halt.

**Spare parts stock** is the exact number of ready-to-use backup components physically sitting on your shelves for quick machinery repairs. While "spare parts inventory" includes the entire strategy of ordering and tracking parts, "stock" refers strictly to the actual pieces—like bolts, filters, or motors—available in your supply room right now. These items are kept on hand to make sure a broken machine can be fixed immediately without waiting for supplier delivery.

### **Order for services**

To quickly order spare parts for your service work, if you manage field service operations, you can integrate the system to initiate purchasing or link parts directly to open work orders.

**Order management** for products and spare parts is the process of tracking an order from the exact moment a customer or technician requests it until it is safely delivered. It acts as the command center for your business logistics, making sure items are pulled from stock, packed correctly, and shipped on time.

The process looks slightly different depending on whether you are dealing with **retail products** or **internal maintenance parts**:

- **For Products**: It is about fulfilling a sales order from a customer who bought an item from your store or website.

- **For Spare Parts**: It is usually about fulfilling a work order from a maintenance technician who needs a part to fix a broken machine.

**Note**: Not included payment gateway, logistic provider tracking.

---

## **03** **Case & Ticket Management**

This system manages customer complaints, problems, and inquiries by transforming all contact from various channels (such as email, phone, LINE, Facebook, Live Chat) into a centralized "ticket" or "case." This allows the support or customer service team to systematically track, investigate, and resolve issues without any work being missed.

### Create Case

**Create Case** is the first step in a customer support system where a client's problem or request is officially recorded as a digital ticket. It takes an incoming message—like an email, a phone call, or a chat message—and turns it into a trackable file inside a company's software.

This process acts as the formal entry point for fixing customer issues, making sure no request is forgotten or lost in an inbox.

### **Case Assignment Board**

The task management tool displays results on a board, emphasizing the movement of task statuses (e.g., To Do -> In Progress -> Done), providing a clear overview of the workflow immediately. This helps the team understand the systematic task assignment process better.

**Note**: Not included in mobile application for first response unit.

### **Case Details**

**Case Details** is the core information screen inside a support ticket that shows everything a team needs to know about a specific customer issue. It acts as the central command center for that single problem, collecting all the background facts, customer notes, and technical data onto one clean page.

Once a case is created, support agents spend most of their time looking at the Case Details screen to understand, troubleshoot, and solve the problem.

### **Case History**

In case management, a case history is a collection of all historical information, records, and context related to a specific case, from its initial inception until its complete resolution.

---

## **04** **Dashboard & Report Statistic**

### **Case Dashboard**

The tool summarizes work order information in an easy-to-understand visual format, such as graphs, tables, or key performance indicators (KPIs), on a single screen. This helps managers, technicians, and executives track status, assign tasks, and resolve issues in a timely manner.

### **Product Dashboard**

The Product and Parts Dashboard is a portal for monitoring asset availability, tracking part degradation, and preventing service disruptions that cause risk and delays.

### Report Server (ระบบรายงาน)

#### Orders Reports (รายงานคำสั่งซื้อ)

|**รหัส**|**ชื่อรายงาน**|**คำอธิบาย**|
|---|---|---|
|**1.**|**Orders Report**|*รายงานสรุปภาพรวมคำสั่งซื้อ*|
|1.1|Daily order report|รายงานคำสั่งซื้อประจำวัน|
|1.2|inventory report|รายงานสินค้าคงคลังคงเหลือ|
|1.3|spare parts inventory report|รายงานคลังสินค้าอะไหล่และชิ้นส่วนสำรอง|
|**2.**|**Order Details**|*รายงานรายละเอียดข้อมูลคำสั่งซื้อเชิงลึก*|
|2.1|order details report|รายงานรายละเอียดสินค้าในแต่ละคำสั่งซื้อ|
|2.2|Request Parts Summary|รายงานสรุปการขอเบิกชิ้นส่วน/อะไหล่|
|2.3|Top 10 Sales Report|รายงานยอดขาย 10 อันดับแรก|
||||

#### Cases Reports (รายงานเหตุ)

|**รหัส**|**ชื่อรายงาน**|**คำอธิบาย**|
|---|---|---|
|**1**|**รายงานสรุปงานบริการ**|*ภาพรวมประสิทธิภาพและแนวโน้มการให้บริการ*|
|1.1|📊 รายงานสรุปงานบริการรายวัน|ยอดรวมและสถานะการบริการแบบวันต่อวัน|
|1.2|📅 รายงานสรุปงานบริการรายเดือน|ภาพรวมผลการดำเนินงานแบบรายเดือน|
|1.3|📈 รายงานสรุปงานบริการเปรียบเทียบตามรายวัน|เปรียบเทียบข้อมูลวันต่อวัน เพื่อดูความเติบโต|
|1.4|📉 รายงานสรุปงานบริการเปรียบเทียบตามรายเดือน|วิเคราะห์แนวโน้มเปรียบเทียบแต่ละเดือน|
|**2**|**รายงานรายละเอียดงานบริการ**|*ข้อมูลเชิงลึก เจาะลึกรายเคสและแยกหมวดหมู่*|
|2.1|📋 รายงานรายละเอียดข้อมูลงานบริการ|รายการงานทั้งหมด พร้อมข้อมูลอ้างอิงและสถานะ|
|2.2|🗂️ รายงานสรุปงานบริการแจกแจงตามประเภทงาน|จัดกลุ่มตามหมวดหมู่ (เช่น ซ่อม, ติดตั้ง, ปรึกษา)|
|2.3|✅ รายงานสรุปงานบริการแจกแจงตามผลให้บริการ|สรุปผลลัพธ์ (เช่น สำเร็จ, รอคอย, ยกเลิก)|
|2.4|📍 รายงานรายละเอียดงานบริการและสถานที่ให้บริการ|ข้อมูลการทำงานแยกตามพิกัดและสถานที่|
||||

---

## **05** **User Management & Role Privilege**

User management in a super app environment manages both end-users (employees) and administrator. It establishes a secure, personalized experience and necessary auditing tools.

---

## **06 Knowledge Base**

A **knowledge base (KB)** is a **centralized digital library** that stores, organizes, manages, retrieve and shares information. It serves as an organization's single source of truth, converting scattered documents into searchable, structured data.

**Source Management** is an administrative system feature used to configure, organize, and track the data origins feeding into a platform's knowledge base.

**Category management** is a strategic approach to organizing knowledge based articles into logical, manageable groups based on how users or consumers perceive and use them.

**File Manager** is a digital tool software application that allows you to organize, create, view, edit, and delete files and folders on a storage system.

**Article Management** is a core content management of knowledge base system (KB) module that allows administrators, writers, and support agents to create, organize, review, and publish written content.

***Approve Article Process***

This workflow governs the editorial lifecycle of Knowledge Base content to ensure high quality and accuracy before publication.

- **Review Article Before Publishing**: Evaluate drafts for brand alignment, accuracy, and formatting compliance.

- **Approve Article**: Authorize verified content for immediate publication to the live Knowledge Base.

- **Reject Article:** Block substandard drafts from publishing and change their status back to review or draft.

- **Feedback for Revision**: Provide actionable notes to authors detailing required edits for rejected content.

**Banner Management** is an administrative setting in a content platform or help center that allows managers to create, edit, and feature promotional or informative banners on a knowledge-based website. The specific feature "Show select article to banner" means you can link a specific help article, announcement, or blog post directly to that banner, so agent/staff are taken straight to the text when they click it.

Instead of just showing a generic image, this tool lets you push important, timely content right to the top of your knowledge-based website.

**Broadcast Management** is an administrative control center used to create, schedule, and send mass messages to many people at the same time. In business software and communication platforms, this tool allows you to blast out urgent announcements, marketing updates, or system notices in-app pop-ups—all from one place.

---

## **To-Do List: Setting ****U****p New SKYICT Tenant**

Prototype / Mockup / Demo Preparation

## Prerequisite Setting

### 1. Organization Configuration (ใส่เป็นแผนก หรือตาม Workflow ได้เลย e.g. Operator --> Dept.)

- [ ] Create `Tenant` for `Organization` — ⚠️ การสร้าง Tenant เป็นงานด้าน backend/platform (ไม่มีปุ่ม/หน้าสร้าง Tenant ในระบบหน้าบ้าน) จัดทำโดยทีมหลังบ้านก่อนเริ่มขั้นตอนในแอป

- [ ] ระบุการจัดการองค์กร

  - [ ] Level 1: Department

  - [ ] Level 2: Command

  - [ ] Level 3: Station

> **ข้อมูลระบบ:** โครงสร้างองค์กรมี 3 ระดับ Department → Command → Station เท่านั้น แต่ละแถวเก็บ `en` / `th` / `active` ส่วนรหัส `deptId` / `commId` / `stnId` **ระบบสร้างเอง (server-assigned) ห้ามตั้งเอง** (`src/core/types/organization.ts:17-84`)

#### **Example**

|**No.**|**Level 1 Department**|**Level 2 Command**|**Level 3** Station|
|---|---|---|---|
|1|Traffic Transportation Department|Center Zone|Station 1|
|2|Traffic Transportation Department|Center Zone|Station 2|
|3|Traffic Transportation Department|North Zone|Station 3|
|4|Traffic Transportation Department|Northeast Zone|Station 4|
|5|Traffic Transportation Department|South Zone|Station 5|
|6|Traffic Transportation Department|East Zone|Station 6|
|7|Traffic Transportation Department|West Zone|Station 7|
|||||

#### **Organization Information**

|**No.**|**Level 1 (Department)**|**Level 2 (Command)**|**Level 3 (Station)**|
|---|---|---|---|
|1|SKYICT|Center Zone|Station 1|
|2|SKYICT|Center Zone|Station 2|
|3|SKYICT|North Zone|Station 3|
|4|SKYICT|Northeast Zone|Station 4|
|5|SKYICT|South Zone|Station 5|
|6|SKYICT|East Zone|Station 6|
|7|SKYICT|West Zone|Station 7|

> เติมชื่อภาษาไทย (คอลัมน์ `th`) เมื่อมีข้อมูล เช่น SKYICT → SKYICT, Center Zone → โซนกลาง (seed ปัจจุบันใช้ชื่ออังกฤษซ้ำใน `th` — `db/seed/skyict/01-sec_org-structure.sql` §1)

---

### 2. Role. (เพื่อเชื่อมไปข้อ 3 สำหรับ Setup Demo)

- [ ] ระบุ Role ที่ต้องการ

  - [ ] Default Role

    - [ ] Admin - All Function

    - [ ] Agent - Call Taker

    - [ ] Dispatcher - Distribute the Case to Responder

    - [ ] Responder - Field Unit

- [ ] ระบุ Function ที่ให้ใช้งาน

  - [ ] เช่น Case, CRM, Contact, Workflow, Form, Config, Report, Knowledge (แต่ละ Role ใช้ Features อะไร)

#### Role

|No.|Role|Y/N|
|---|---|---|
|1|Admin|Y|
|2|Agent|Y|
|3|Dispatcher|Y|
|4|Responder|Y|
|5|||

> **roleName ที่ระบบเก็บจริง** (ต้องกรอกใน Role & Privilege ตามค่านี้ — เป็น string ตัวเล็กมีขีดล่าง):

|Role (ชื่อเรียก)|"roleName" ในฐานข้อมูล|
|---|---|
|System Admin (Admin ระดับระบบ)|`system_admin`|
|Admin|`admin`|
|Agent|`agent`|
|Dispatcher|`dispatcher`|
|Responder|`responder`|

(ยืนยันแล้วกับตาราง role ของ tenant นี้: `db/seed/skyict/api-payloads/04-roles.json`, `db/seed/skyict/02-um_users.sql` §1b)

#### Permission List

|No.|Function|Admin|Agent|Dispatcher|Responder|
|---|---|---|---|---|---|
|1|Case (Create / View / History)|Y|Y|Y|Y|
|2|Case (Assign / Close)|Y|N|Y|N|
|3|Case Assignment Board|Y|Y|Y|Y|
|4|CRM (Product / Spare Part / Inventory / Order)|Y|N|Y|N|
|5|Contact / Customer|Y|Y|Y|Y|
|6|Workflow|Y|N|N|N|
|7|Form|Y|N|N|N|
|8|Config (Service Type / Area / Unit / Skill / Appointment)|Y|N|N|N|
|9|Report / Dashboard|Y|N|Y|N|
|10|Knowledge|Y|Y|Y|Y|
|11|User / Role / User Group|Y|N|N|N|
|12|Organization / Audit Log|Y|N|N|N|

> **Permission keys ที่ระบบหน้าบ้านตรวจสอบจริง** (ใช้กรอกใน Role & Privilege — ค่ามาจาก codebase, `docs/SKYICT-Tenant-Onboarding-Runbook.md` §6):

|Function|Permission Keys|
|---|---|
|Case (Create / View / History)|`case.create`, `case.view`, `case.view_history`, `case.view`|
|Case (Assign / Close)|`case.assign`, `case.close` (Cancel case เพิ่ม `case.delete`)|
|Report / Dashboard|`dashboard.view`, `report.view`|
|CRM|`product.view`, `product_stock.view`, `sparepart.view`, `sparepart_stock.view`, `order.view`, `crm_dashboard.view`, `crm_service.view`|
|Contact / Customer|`contact.view`, `contact_config.view`|
|Workflow|`workflow.view`, `workflow.create`, `workflow.update`|
|Form|`form.view`, `form.create`, `form.update`|
|Config (Service Type)|`service.view`|
|Config (Area / Area Template)|`settings.view` (เมนู) **และ** `area.view` (หน้า) — ต้องให้ครบทั้งสองตัว|
|Config (Unit / Skill / Property)|`unit.view` (Skill ใช้ key นี้ด้วย), `unit.create` + `unit.update` (ฟอร์มสร้าง/แก้ unit)|
|Config (Organization Settings / Map / Place / Device)|`organization_settings.manage`|
|Appointment|`appointment.view`|
|User / Role / User Group|`user.view`, `user.create`, `user.update`, `role.view`, `usergroup.view`|
|Organization / Audit Log|`organization.view`, `auditlog.view` (Audit ต้องมี entitlement `entitlement.audit` ร่วมด้วย)|
|Knowledge (view)|`kb_dashboard.view`, `kb_category.view`, `kb_article.view`, `kb_file.view`, `kb_broadcast.view`, `kb_banner.view`, `kb_source.view` (+ `.create`/`.update`/`.delete` สำหรับผู้แก้ไข)|

> หมายเหตุเชิงโครงสร้าง: (1) บางหน้าต้องให้ 2 keys — เมนูใช้ key หนึ่ง เปิดหน้าใช้ key หนึ่ง (เช่น Area); (2) `requiredPermissions` ของ route ตรวจแบบ AND —缺一ตัวเข้าหน้าไม่ได้

---

### 3. User Management (Demo Sender View & Responder View)

- [ ] Tenant: SKYICT

- [ ] ระบุ User ที่ต้องการ

- [ ] Profile Photo

#### **User List**

|**#**|**User Name**|**First name**|**Last  Name**|**Email**|**Emp ID**|**Role**|**Department**|**Command**|**Station**|
|---|---|---|---|---|---|---|---|---|---|
|1|watee.tha|Watee|Thaiprasonk|<watee.tha@skyai.co.th>|AI680013|System Admin (`system_admin`)|SKYICT|Center Zone|Station 1|
|~~2~~|~~kittipong.mue~~|~~Kittipong~~|~~Muengrod~~|~~<kittipong.mue@skyai.co.th>~~|~~AI680110~~|~~Admin~~|~~—~~|~~—~~|~~—~~|
|3|apiwat.rod|Apiwat|Rodchuajeen|<apiwat.rod@skyai.co.th>|AI680018|System Admin (`system_admin`)|SKYICT|Center Zone|Station 1|
|4|wisarud.tec|Wisarud|Techa|<wisarud.tec@skyai.co.th>|AI680021|System Admin (`system_admin`)|SKYICT|Center Zone|Station 1|
|~~5~~|~~krittaya.ple~~|~~Krittaya~~|~~Plengwithaya~~|~~<krittaya.ple@skyai.co.th>~~|AI680012|~~Admin~~|~~—~~|~~—~~|~~—~~|
|6|agent1|Agent|1|<agent1@skyict.co.th>|SK699001|Agent|SKYICT|Center Zone|Station 1|
|7|agent2|Agent|2|<agent2@skyict.co.th>|SK699002|Agent|SKYICT|Center Zone|Station 1|
|8|responder1|Responder|1|<responder1@skyict.co.th>|SK699003|Responder|SKYICT|Center Zone|Station 1|
|9|responder2|Responder|2|<responder2@skyict.co.th>|SK699004|Responder|SKYICT|Center Zone|Station 2|
|10|generalservice|General Service|1|<generalservice1@skyict.co.th>|SK699005|Responder|SKYICT|Center Zone|Station 1|
|11|emergencyservice1|Emergency Service|1|<emergencyservice1@skyict.co.th>|SK699006|Responder|SKYICT|Center Zone|Station 1|
|12|emergencyservice2|Emergency Service|2|<emergencyservice2@skyict.co.th>|SK699007|Responder|SKYICT|Center Zone|Station 2|
|13|dispatcher1|Dispatcher|1|<dispatcher1@skyict.co.th>|SK699008|Dispatcher|SKYICT|Center Zone|Station 1|
|14|dispatcher2|Dispatcher|2|<dispatcher2@skyict.co.th>|SK699009|Dispatcher|SKYICT|Center Zone|Station 1|
|15|sompith.kit|Sompith|Kitcharoen|<sompith.kit@skyict.co.th>|SK690394|Admin (`admin`)|SKYICT|Center Zone|Station 1|
|16|chutikan.kon|Chutikan (Pimm)|Kongton|<chutikan.kon@skyict.co.th>|SK690375|Admin (`admin`)|SKYICT|Center Zone|Station 1|
|17|chatchanan.dul|Chatchanan (Petch)|Dulyakometh|<chatchanan.dul@skyict.co.th>|SK680123|Admin (`admin`)|SKYICT|Center Zone|Station 1|
|18|chamrat.mee|Chamrat (Tieung)|Meedam|<chamrat@skyict.co.th>|SK63035|Admin (`admin`)|SKYICT|Center Zone|Station 1|
|19||||||||||

> หมายเหตุ: (1) อีเมล 4 ตัวที่ v2 พิมพ์ผิด (respinder1/2, generalsrvice1, emergencyservice1 ซ้ำของ 2) แก้แล้วตาม `db/seed/skyict/02-um_users.sql` §7 D2; (2) User 19 คนใน v2 มี 16 คนที่ seed จริง (แถวขีดฆ่า 2 คนไม่นำเข้าระบบ); (3) Dept/Command/Station ที่กรอกคือหน่วยที่ผู้ใช้คนนั้นสังกัด — seed ปัจจุบันให้ค่าเดียวทั้ง 16 คน (ดู §1 `create_call_center` หากต้องการใช้ "Central Call Center" แทน)

***Access CC SuperApp Portal***

URL: <https://skyai-cloud-cc-stg.one-sky.ai/>

URL: <https://skyai-cloud-cc-qa.one-sky.ai/>
User: (ตาม User List ด้านบน)
Pass: Skyict@123

Tenant: SKYICT

---

### 4. User Group

Road Map:

1. BE: When creating a new tenant, then create the default user group:

    - General @Apiwat Rodchuajeen

2. BE: Create API for user group management @Apiwat Rodchuajeen-->Done

3. FE: Create GUI for user group management @Wisarud Techa -> Done

4. FE: Add user to group @Wisarud Techa -> Done

    1. Click to view the groups and display available user options/selected users.

    2. Supports selecting users one at a time, multiple users, and all users.

- [ ] ระบุ User Group ที่ต้องการ

- [ ] ใช้ 2 ส่วน

  - [ ] Knowledge Base - Group of User

  - [ ] Order PIC - Approval

> **ข้อมูลระบบ:** User Group เก็บ `en`, `th`, `active` (+ `description` เฉย ๆ ไม่มีบังคับ) — `grpId` ระบบสร้างเอง **ไม่มีคอลัมน์ "Main Category"** ในระบบ (`src/core/types/user.ts:296-311`) สมาชิกกลุ่มกำหนดคู่ `(กลุ่ม, username)` — กลุ่มนี้สำคัญเพราะ **node ของ Workflow จะมอบหมายงานให้ "กลุ่ม" ไม่ใช่ตัวคน**

#### **User Group**

|**Group (en / th)**|**Active**|Descriptions|
|---|---|---|
|General / ทั่วไป|Y|Default group (ระบบสร้างให้เมื่อสร้าง tenant ใหม่)|
|Dispatch Group 1 / กลุ่มกระจายงาน 1|Y|กลุ่ม Dispatcher ชุดที่ 1 (ใช้กับ node Dispatching)|
|Dispatch Group 2 / กลุ่มกระจายงาน 2|Y|กลุ่ม Dispatcher ชุดที่ 2 (สำรอง/เวร)|
|Order Approval / อนุมัติคำสั่งซื้อ|Y|กลุ่ม PIC อนุมัติการขอเบิกอะไหล่ (Order PIC)|
|Technical / สายเทคนิค|Y|กลุ่ม KB — เจ้าหน้าที่เทคนิค|
|Agent / นักโทรฯ|Y|กลุ่ม KB — สาย Agent|
|Dispatcher / ผู้กระจายงาน|Y|กลุ่ม KB — สาย Dispatcher|
|Operation / การปฏิบัติการ|Y|กลุ่ม KB — การปฏิบัติการ|
||||

---

### 5. Service Type / Sub Type

- [ ] ระบุ Type/ Sub Type ที่ต้องการ

- [ ] Priority — เลือกตามระดับความเร่งด่วน (ระบบมี 4 กลุ่ม: Critical / High / Medium / Low — ดูหมายเหตุ)

- [ ] ทักษะ อาจจะใส่ ทั่วไปก่อน หรืออาจจะแสดงตัวอย่าง เคสที่ต้องมีทักษะจำเป็น

- [ ] ใส่ SLA ไว้เป็น ตย. มาจากผลรวมของ Workflow ข้อ 6

> **ข้อมูลระบบ:** Case Type เก็บ `typeId` (business key ตัวอิสระ), `en`, `th`, `active` — "Type Code" ในตารางคือค่า `typeId` ที่กรอกเองได้ ส่วน Sub Type มี `sTypeCode` เพิ่ม และ**บังคับกรอก** `wfId`, `caseSla`, `priority`, `userSkillList`, `unitPropLists`, `mDeviceType`, `mDeviceTypeName`, `mWorkOrderType` (`src/cms/types/case.ts:246-276, 300-338`)
>
> **Priority:** ฟอร์มให้ตัวเลือก 10 รายการ = Critical ×1 + High ×3 + Medium ×3 + Low ×3 ค่าที่เก็บคือดัชนีภายในกลุ่ม (0; 0,1,2; 0,1,2; 0,1,2) แต่ทุกหน้าอ่านค่าแบบ buckets 0-9 (0=Critical, 1-3=High, 4-6=Medium, 7-9=Low) — ตารางด้านล่างจึงลงเป็น **label** และควรใช้ label เดียวต่อระดับความรุนแรง แล้วตรวจ badge บน case ที่สร้างจริง (`src/cms/utils/constants.ts:245-250`, `src/cms/components/function/Prioriy.tsx:20-25`, `src/cms/components/admin/system-configuration/service/ServiceHierarchyView.tsx:113-124`)

***Example***

#### **Type / Sub Type Information**

|No.|Type Code (`typeId`)|Case Type (EN)|Case Type (TH)|Sub Type Code (`sTypeCode`)|Sub Type (EN)|Sub Type (TH)|Priority|Skill|Workflow|SLA (min)|
|---|---|---|---|---|---|---|---|---|---|---|
|1|1001|IT Service|บริการ IT|3001|Telephony Hardware & IT Service|อุปกรณ์โทรศัพท์และระบบ IT|High|Investigation|SKYICT-Investigation Flow|64|
|2|1002|Repair|ซ่อมแซม|3002|Hardware Repair|ซ่อมแซมฮาร์ดแวร์|High|Repair|SKYICT-Repair Flow|109|
|3|1003|Service|บริการทั่วไป|3003|General IT Service|บริการ IT ทั่วไป (ติดตั้ง/จัดเตรียม)|High|Service|SKYICT-Service Flow|79|
|4|1004|Maintenance|ซ่อมบำรุง|3101|Preventive Maintenance|บำรุงรักษาเชิงป้องกัน|Medium|Maintenance|SKYICT-Maintenance Flow|269|
|5|1005|Outsourced|ส่งต่อภายนอก|3201|Outsourced Service|งานส่งต่อหน่วยงานภายนอก|Medium|Outsource|SKYICT-Outsourced Flow|199|
|6|1006|Emergency|แจ้งเหตุฉุกเฉิน|3901|Emergency Outage|เหตุขัดข้องวิกฤต|Critical|Investigation|SKYICT-Investigation Flow|64|

#### **Sub Type — ฟิลด์บังคับอื่น ๆ ที่ระบบถาม (ค่าแนะนำของ SKYICT)**

|Sub Type Code|`mDeviceType` (รหัสประเภทอุปกรณ์)|`mDeviceTypeName` (ชื่อประเภทอุปกรณ์)|`mWorkOrderType` (ประเภทใบงาน)|`unitPropLists` (Unit Properties)|
|---|---|---|---|---|
|3001|TEL|Telephony Hardware|IT Service|Telephony|
|3002|HW|IT Hardware|Repair|Hardware|
|3003|IT|General IT|Service|IT Service|
|3101|PM|Preventive Maintenance|Maintenance|General Service|
|3201|OUT|Outsourced|Outsource|Not Spectify|
|3901|EMG|Emergency|Emergency|Emergency Response|

> ฟิลด์ทั้งสาม (`mDeviceType`, `mDeviceTypeName`, `mWorkOrderType`) ฟอร์ม sub type **บังคับกรอก** (`ServiceManagement.tsx:353-366`) ค่าในตารางเป็นค่าแนะนำ — ปรับตามธุรกิจได้

---

### 6. WorkFlow การทำงาน

- [ ] ระบุ Workflow & SLA ที่ต้องการ

  - [ ] Note: After new, assigned status can customize

- [ ] Default orders workflow name: `SparePart - Do not Change` / `Delete`

  - [ ] Setup `PIC` / `User Group` for each node in orders workflow

  - [ ] Manual config workflowid for organization -> [`Database` welcome_crm] / [`Table` app_configs]

> **ข้อมูลระบบ:** Workflow สร้างด้วย node types 6 ชนิด: `start`, `process`, `dispatch`, `decision`, `sla`, `end` — node type `process` ตั้ง `sla` (นาที) และ `pic` (role หรือ user group) ได้, node `dispatch`/`process` ที่มอบหมายงานจะเลือก **User Group** จากข้อ 4 (`src/cms/types/workflow.ts:18-50`) สถานะ case (S001–S019 เช่น New/Assigned/In-progress/Done/Close/Cancel) มาจาก catalog หลังบ้าน **อ่านอย่างเดียว** ไม่มีหน้าสร้างใน frontend (`GET /case_status`)
>
> ชื่อ `SparePart - Do not Change / Delete` **UNVERIFIED** ใน frontend code — เป็นค่าฝั่ง backend (`app_configs`) ต้องยืนยันกับทีมหลังบ้าน

#### **Case Example:**

|**No.**|**Workflow Name**|**New**|**Assigned**|**Acknowledge**|**Inprogress**|**Done**|**Closed**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|
|1|SKYICT-Investigation Flow (Case Type 1001 / SubType 3001, 3901)|1 min|3 min|5 min|45 min|5 min|5 min|64 min|
|2|SKYICT-Repair Flow (Case Type 1002 / SubType 3002)|1 min|3 min|5 min|90 min|5 min|5 min|109 min|
|3|SKYICT-Service Flow (Case Type 1003 / SubType 3003)|1 min|3 min|5 min|60 min|5 min|5 min|79 min|
|4|SKYICT-Maintenance Flow (Case Type 1004 / SubType 3101)|1 min|3 min|10 min|240 min|10 min|5 min|269 min|
|5|SKYICT-Outsourced Flow (Case Type 1005 / SubType 3201)|1 min|3 min|5 min|180 min|5 min|5 min|199 min|
||||||||||

> โครงสร้าง node ตัวอย่าง (default workflow ในระบบ: `src/cms/mocks/workflowDefault.json` — title `SOP001`): Start → New (sla 1, agent) → Disp? (decision) → yes: Dispatching (sla 7, dispatcher) → Accept (sla 5, responder) → Arrival (sla 30, responder) → Resolve (sla 90, responder) → Complete (sla 2, dispatcher) → End ; no: Alert (sla 1, supervisor) → Assign Vender (sla 1, supervisor) → Fix (sla 1, supervisor) → Complete

#### **Orders Example:**

- Default orders workflow name : `SparePart - Do not Change` / `Delete`

|**No.**|**Workflow Name**|**Create Order**|**Request**|**Request Approved**|**Picking**|**Packing**|**Dispatched**|**Out for Delivery**|**Delivered**|**Complete**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|1|Order Part|1 min|3 min|10 min|30 min|40 min|60 min|30 min|2,880 min|5 min|3,059 min|
|||||||||||||

> สถานะ order/request (Create Order, Request, ...) มาจาก catalog หลังบ้าน (`OrderStatus` / `RequestStatus` entities: `statusId`, `en`, `th`, `active`) — สร้างฝั่ง backend, ตั้ง PIC/User Group ต่อ node ตามแผนผังนี้

#### **Cases Workflow SLA Information**

|**No.**|**Workflow Name**|**New**|**Assigned**|**Acknowledge**|**Inprogress**|**Done**|**Closed**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|
|1|SKYICT-Investigation Flow|1 min|3 min|5 min|45 min|5 min|5 min|64 min|
|2|SKYICT-Repair Flow|1 min|3 min|5 min|90 min|5 min|5 min|109 min|
|3|SKYICT-Service Flow|1 min|3 min|5 min|60 min|5 min|5 min|79 min|
|4|SKYICT-Maintenance Flow|1 min|3 min|10 min|240 min|10 min|5 min|269 min|
|5|SKYICT-Outsourced Flow|1 min|3 min|5 min|180 min|5 min|5 min|199 min|

#### **Orders Workflow SLA Information**

- Default orders workflow name : `SparePart - Do not Change` / `Delete`

|**No.**|**Workflow Name**|**Create Order**|**Request**|**Request Approved**|**Picking**|**Packing**|**Dispatched**|**Out for Delivery**|**Delivered**|**Complete**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|1|Order Part|1 min|3 min|10 min|30 min|40 min|60 min|30 min|2,880 min|5 min|3,059 min|
|||||||||||||

---

### 7. Dynamic Field & Forms (ใช้ตรงหน้า create case เพื่อให้ตรงกับเคสของลูกค้า ซึ่งจะ Link กับ Case Type ข้างบน หลังจากที่เลือก Case Type)

- [ ] ระบุ Dynamic Form สำหรับ Case Creation ที่ต้องการ เช่น แก้ไขปัญหา Server, ต้องการ MA

- [ ] ระบุ Dynamic Form สำหรับ Contact ที่ต้องการ เช่น Line ID, Position, etc (สำหรับ field contact ที่ต้องการของลูกค้า)

> **ข้อมูลระบบ:** ฟอร์ม case ถูกเรียกตาม **sub-type** (`GET /forms/casesubtype?id={sTypeId}`) และตาม workflow (`/forms/GetFormlinkWf`) — สร้าง form และ sub-type ก่อน แล้วตรวจว่า sub-type เรียกฟอร์มได้จริง; หน้า builder ยังไม่มีฟิลด์ "bind to sub-type" ให้กรอก (ต้องยืนยันช่องทาง bind กับ backend) (`src/cms/store/api/formApi.ts:202-209, 79-97`)

#### **📝** Form 1: Telephony Hardware & IT Service Form

(สำหรับแจ้งปัญหาอุปกรณ์ระบบโทรศัพท์ - SubType 3001)

##### 1.1) Header & Contact Fields (ข้อมูลผู้แจ้ง/ตำแหน่งที่ตั้ง)

- **ชื่อผู้แจ้งปัญหา / บุคลากร:** `[Required]` *(Text)*

- **เบอร์มือถือติดต่อกลับ:** `[Optional]` *(Phone - กรอกเพิ่มกรณีอยู่คนละจุดกับเบอร์ที่มีปัญหา)*

- **อาคาร / ชั้น / หน่วยงาน:** `[Required]` *(Dropdown / Text)*

##### 1.2) Dynamic Hardware & Symptom Fields (ข้อมูลอุปกรณ์และอาการเสีย)

- **อุปกรณ์ที่มีปัญหา:** `[Required]` *(Multi-select — IP Phone / Softphone / VoIP Gateway / Switch / Router / Access Point / คอมพิวเตอร์ / อื่น ๆ)*

- **รุ่นอุปกรณ์ (Model):** `[Optional]` *(Text)*

- **Serial Number / Asset Tag:** `[Optional]` *(Text)*

- **อาการเสีย:** `[Required]` *(Multi-select — ไม่มีเสียง / เสียงแตก / สายหลุด / เชื่อมต่อไม่ได้ / ไม่มีไฟ / อื่น ๆ)*

##### 1.3) General Details & Attachment

- **รายละเอียดอาการเพิ่มเติม / หมายเหตุ:** `[Optional]` *(Long Text)*

- **แนบรูปถ่ายอุปกรณ์ / จุดเกิดเหตุ:** `[Optional]` *(Attachment)*

---

#### **📝** Form 2: Hardware Repair Form

(สำหรับแจ้งซ่อมฮาร์ดแวร์ - SubType 3002)

- **อุปกรณ์ที่ต้องการซ่อม:** `[Required]` *(Multi-select — เครื่องคอมพิวเตอร์ / จอภาพ / พิมพ์ / อุปกรณ์ต่อพ่วง / อื่น ๆ)*

- **Serial Number / Asset Tag:** `[Required]` *(Text)*

- **อาการ/ความเสียหาย:** `[Required]` *(Multi-select — ไม่เปิดเครื่อง / หน้าจอแตก / ดิสก์เสีย / สายขาด / อื่น ๆ)*

- **ต้องการเปลี่ยนอะไหล่:** `[Optional]` *(Checkbox — ใช้เชื่อม Order for services ข้อ 02)*

- **รายละเอียดเพิ่มเติม:** `[Optional]` *(Long Text)* · **แนบรูปถ่าย:** `[Optional]` *(Attachment)*

---

#### **📝** Form 3: Emergency Outage Form

(สำหรับเหตุขัดข้องวิกฤต - SubType 3901)

- **ระบบ/บริการที่หยุดทำงาน:** `[Required]` *(Text — เช่น PBX, เน็ตอาคาร, อินเทอร์เน็ต)*

- **ช่วงเวลาที่เกิดเหตุ:** `[Required]` *(Datetime)*

- **ขอบเขตผลกระทบ (จำนวนผู้ใช้งาน/หน่วยงาน):** `[Required]` *(Text)*

- **เบอร์ติดต่อกลับ onsite:** `[Required]` *(Phone)*

- **สถานะเบื้องต้น ณ ตอนแจ้ง:** `[Required]` *(Select — ล่มทั้งหมด / ล่มบางส่วน / ช้าผิดปกติ)*

---

#### **Form Management List**

Here is the sorted list of forms arranged by their code and name.

|**Form Code / Name**|**Form Title**|**Version**|**Workflow**|**Date & Time**|**Updated By**|**Actions**|
|---|---|---|---|---|---|---|
|Form 1|Telephony Hardware & IT Service Form|v.1|SKYICT-Investigation Flow|*(ตามวันที่สร้างจริง)*|watee.tha|View Edit Delete|
|||SKYICT-Repair Flow|||||
|||SKYICT-Service Flow|||||
|||SKYICT-Maintenance Flow|||||
|||SKYICT-Outsourced Flow|||||
|Form 2|Hardware Repair Form|v.1|SKYICT-Repair Flow|*(ตามวันที่สร้างจริง)*|watee.tha|View Edit Delete|
|Form 3|Emergency Outage Form|v.1|SKYICT-Investigation Flow|*(ตามวันที่สร้างจริง)*|watee.tha|View Edit Delete|
||||||||

---

### 8. Skill Management (สามารถ routing case ไปยัง level skill ได้) หากจัด case type by dept ดีแล้ว อาจจะไม่ต้องมีก็ได้ ขึ้นอยู่กับความ complex

- [ ] ระบุ Skill ของเจ้าหน้าที่ Responder ถ้ามี

> **ข้อมูลระบบ:** Skill เก็บ `en`, `th`, `active` (`skillId` ระบบสร้างเอง) — skill ถูกโยงกับ sub-type ผ่าน `userSkillList` และกับเจ้าหน้าที่ผ่าน user skill (ตาราง Skill Matrix ด้านล่างคือคู่มือเทียบ) (`src/cms/types/skill.ts:4-10`)

***Example***

|**หมวดหมู่ความสามารถ (Skill)**|**นิยามย่อ (Definition)**|**ตัวอย่างงาน (Example)**|**ใช้กับ Sub Type**|
|---|---|---|---|
|**Maintenance**|ซ่อมบำรุงเชิงป้องกัน|ตรวจเช็คสภาพเครื่องจักร, สำรองข้อมูล|3101|
|**Service**|บริการตามคำขอ|ติดตั้งโปรแกรม, จัดเตรียมอุปกรณ์|3003|
|**Repair**|ซ่อมแซมระบบที่พัง|เปลี่ยนหน้าจอแตก, ซ่อมสายแลนขาด|3002|
|**Investigation**|ตรวจสอบหาสาเหตุ|วิเคราะห์สาเหตุเน็ตหลุด, เช็ค Log|3001, 3901|
|**General Support**|สนับสนุนทั่วไป|รีเซ็ตรหัสผ่าน, สอนวิธีใช้งานโปรแกรม|3003|
|**Outsource**|ส่งต่อหน่วยงานภายนอก|แจ้งเคลมประกัน, ประสานงาน ISP|3201|
|||||

#### **ตารางหมวดหมู่งาน (Skill Matrix)**

|**หมวดหมู่ความสามารถ (Skill)**|**นิยามย่อ (Definition)**|**ตัวอย่างงาน (Example)**|**เจ้าหน้าที่ตัวอย่าง (username)**|
|---|---|---|---|
|**Investigation**|ตรวจสอบหาสาเหตุ|วิเคราะห์สาเหตุเน็ตหลุด, เช็ค Log|responder1, responder2|
|**Repair**|ซ่อมแซมระบบที่พัง|เปลี่ยนหน้าจอแตก, ซ่อมสายแลนขาด|responder1|
|**Service**|บริการตามคำขอ|ติดตั้งโปรแกรม, จัดเตรียมอุปกรณ์|generalservice|
|**Maintenance**|ซ่อมบำรุงเชิงป้องกัน|ตรวจเช็คสภาพเครื่องจักร, สำรองข้อมูล|generalservice|
|**Emergency Response**|ตอบเหตุฉุกเฉิน|เข้าหน้างานเหตุวิกฤตภายใน 30 นาที|emergencyservice1, emergencyservice2|
|**Outsource**|ส่งต่อหน่วยงานภายนอก|แจ้งเคลมประกัน, ประสานงาน ISP|dispatcher1|
|||||

---

### 9. Area Management

- [ ] ระบุการจัดการพื้นที่บริการ

  - [ ] Level 1: Country

  - [ ] Level 2: Province

  - [ ] Level 3: District

> **ข้อมูลระบบ:** Area เป็นโมเดล **Country → Province → District** (เก็บ `countryId`/`provId`/`distId`, `en`, `th`, `active`, + รูปพิกัด/พื้นที่ได้) — **เป็นคนละระบบกับ Organization (ข้อ 1)** ห้ามเอาโซน/สถานีมากรอกที่นี่ (`src/cms/types/area.ts:191-232`) เมนู Area ใช้ key `settings.view` แต่หน้าใช้ `area.view` (ให้ครบทั้งสองตัว)

#### Service Area List

|**Code (countryId)**|**L1 Name (TH)**|**L1 Name (EN)**|**L2 Code (provId)**|**L2 Name (TH)**|**L2 Name (EN)**|**L3 Code (distId)**|**L3 Name (TH) (Limit 100 Char.)**|**L3 Name (EN)**|
|---|---|---|---|---|---|---|---|---|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|01|พระนคร|PHRA NAKHON|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|02|ดุสิต|DUSIT|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|03|หนองจอก|NONG CHOK|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|04|บางรัก|BANG RAK|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|05|บางเขน|BANG KHEN|
|TH|ไทย|THAILAND|10|กรุงเทพมหานคร|BANGKOK|06|บางกะปิ|BANG KAPI|
||||||||||

> ชื่อเขต/รหัสตามข้อมูลจริงของกรุงเทพมหานคร ( PROV_CODE `10` = BANGKOK; 50 เขต, 180 แขวง — dataset พร้อมรูปพิกัด: `src/cms/mocks/TH_Bangkok_Province.json`, `TH_Bangkok_District.json`, `TH_Bangkok_Subdistrict.json` ) — เลือกเขตที่ครอบคลุมพื้นที่ให้บริการของ tenant; District ครอบคลุมถึงระดับแขวง (subdistrict) ใน map lookup

---

### 10. Unit Management

Road Map:

1. BE: When creating a new tenant, then create default unit type / unit source @Apiwat Rodchuajeen

2. FE: Create GUI for Properties Management @Wisarud Techa -> Done

3. FE: Create GUI for unit to add each property to unit. @Wisarud Techa -> Done

    1. Enhancements to the GUI to add property to unit management

- Unit Type

  - Staff (ปฎิบัติงาน)

- Unit Source

  - Internal (หน่วยภายใน)

  - External (หน่วยภายนอกองค์กร)

- Unit Properties

  - Not Spectify (ไม่ระบุ)

- Unit

> **ข้อมูลระบบ:** ฟิลด์ของ Unit: `unitId` (business code ที่กรอกเองได้ เช่น UNIT-001), `unitName`, `unitTypeId`, `unitSourceId`, `priority`, `compId` (บริษัท), `deptId`/`commId`/`stnId` (สังกัดองค์กร), `username` (ผู้ใช้ที่ควบคุมหน่วย) — **Unit Type / Unit Source / Unit Status ในระบบอ่านอย่างเดียว (read-only)** ต้อง seed ฝั่ง backend ให้มาก่อนจึงจะเลือกในฟอร์มได้; การให้ Property แก่ unit ทำผ่านหน้า Properties (bulk assign) (`src/cms/types/unit.ts:87-153, 200-313`, `src/cms/store/api/unitApi.ts:118-143`)

#### **Unit List**

|**Unit ID\***|**Unit Name\***|**Unit Type**|**Username**|**Unit Source**|**Company**|**Department**|**Command**|**Station**|
|---|---|---|---|---|---|---|---|---|
|UNIT-001|UNIT-001|Staff|responder1|Internal|SKYICT|SKYICT|Center Zone|Station 1|
|UNIT-002|UNIT-002|Staff|responder2|Internal|SKYICT|SKYICT|Center Zone|Station 2|
|UNIT-003|UNIT-003|Staff|generalservice|Internal|SKYICT|SKYICT|Center Zone|Station 1|
|UNIT-004|UNIT-004|Staff|emergencyservice1|Internal|SKYICT|SKYICT|Center Zone|Station 1|
|UNIT-005|UNIT-005|Staff|emergencyservice2|Internal|SKYICT|SKYICT|Center Zone|Station 2|
|UNIT-006|UNIT-006|Staff||Internal|SKYICT|SKYICT|Center Zone|Station 1|
|UNIT-007|UNIT-007|Staff||Internal|SKYICT|SKYICT|Center Zone|Station 2|
||||||||||

> `username` ต้องเป็นบัญชีผู้ใช้จริงจากข้อ 3 (v2 มี generalservice1/2 ซึ่งไม่มีใน user list — แก้เป็น `generalservice`); UNIT-006/007 ขวดยอดไว้สำหรับ field unit ที่เพิ่มขึ้น

#### **Unit Properties**

|**ID\***|**Properties Name\* (EN)**|**Properties Name\* (TH)**|**Description**|
|---|---|---|---|
|*(ระบบสร้างเอง)*|Not Spectify|ไม่ระบุ|ค่า default เมื่อไม่ระบุคุณสมบัติ|
|*(ระบบสร้างเอง)*|General Service|งานบริการทั่วไป|บริการติดตั้ง/จัดเตรียมทั่วไป|
|*(ระบบสร้างเอง)*|Emergency Response|ตอบเหตุฉุกเฉิน|หน่วยตอบเหตุวิกฤต|
|*(ระบบสร้างเอง)*|Telephony|ระบบโทรศัพท์|IP Phone / VoIP / PBX|
|*(ระบบสร้างเอง)*|Network|ระบบเครือข่าย|Switch / Router / AP|
|*(ระบบสร้างเอง)*|Hardware|ฮาร์ดแวร์|เครื่องคอมพิวเตอร์/อุปกรณ์|
|*(ระบบสร้างเอง)*|Software|ซอฟต์แวร์|OS / โปรแกรมใช้งาน|
|*(ระบบสร้างเอง)*|IT Service|บริการ IT|บริการ IT ทั่วไป|
|||||

> `propId` ระบบสร้างเอง — ไม่ต้อง/ห้ามพิมพ์ PROP-001 เอง; คอลัมน์ ID ในระบบจะเป็น UUID ของระบบ

---

### 11. Case Result & Case Status (ผลปิดงาน)

- [ ] ระบุ Case Result (เหตุผลปิด/ยกเลิกงาน) ที่ต้องการ

- [ ] ยืนยัน Case Status จาก backend (อ่านอย่างเดียว)

#### **Case Result List**

|**No.**|**Result (EN)**|**Result (TH)**|**ใช้ตอน**|
|---|---|---|---|
|1|Work Completed|ปิดงานเรียบร้อย|เสร็จตามปกติ (Done)|
|2|Resolved Remote|แก้ปัญหาทางไกล|แก้จบที่ศูนย์ (ไม่ลงหน้างาน)|
|3|Customer Cancelled|ลูกค้ายกเลิก|ยกเลิกโดยลูกค้า (Cancel)|
|4|Transferred to Vendor|ส่งต่อผู้ขาย/ผู้ผลิต|ส่งงานต่อภายนอก|
|5|Duplicate Case|เคสซ้ำ|ปิดเพราะซ้ำกับเคสเดิม|
|||||

> **ข้อมูลระบบ:** Case Result เก็บ `resId`, `en`, `th`, `active` — ค่าที่ agent เลือกตอน close/cancel case (`src/cms/types/caseResult.ts`) ส่วน **Case Status (S001–S019)** มาจาก catalog หลังบ้าน อ่านอย่างเดียว `GET /case_status` — frontend จัดกลุ่มเป็น Draft (S000) / New (S001, S002, S009) / Assigned (S003) / In-progress (S004–S011, S013, S015, S019) / On-Hold (S018) / Done (S012, S016, S017) / Close (S007) / Cancel (S014) (`src/cms/components/ui/status/status.tsx:11-32`) — หากต้องการปรับสถานะต้องทำฝั่ง backend

---

### 12. Product Management

Road Map:

1. BE: When creating a new tenant, then create the default Brand / Brand photo: @Apiwat Rodchuajeen

    - General

2. BE: When creating a new tenant then Create default Store: @Apiwat Rodchuajeen

    - HQ

3. BE: Create API for Brand Management @Apiwat Rodchuajeen-> Assign

4. FE: Create GUI for Brand Management @Wisarud Techa -> Done

5. FE: Create GUI for Brand Photo Management @Wisarud Techa -> Done

6. FE: Create GUI for Store Management @Wisarud Techa -> Done

- Brand / Brand Photo

- Category of product

- Store

> **ข้อมูลระบบ:** Brand กับ Category เป็น 2 entity แยกกัน — Brand: `en`, `th`, `type`, `active` + โลโก้ (อัปโหลดก่อนแล้วเก็บ URL), Category: `en`, `th`, `type`, `active`; ฟิลด์ `type` เป็น string อิสระใช้แยก catalog สินค้า vs อะไหล่ (ตั้ง convention เดียว per tenant เช่น `Product` / `SparePart`) (`src/cms/types/brand.ts:11-32`, `src/cms/types/category.ts:4-19`)

#### **Brand and Category**

|**Brand (TH)**|**Brand (EN)**|**Main Category (TH)**|**Main Category (EN)**|**Sub-Category**|**Key Products**|
|---|---|---|---|---|---|
|Grandstream|Grandstream|ระบบโทรศัพท์|Telephony|IP Phone, VoIP Gateway|IP Phone, VoIP Gateway|
|Cisco|Cisco|เครือข่าย|Network|Switch, Router, Access Point|Network Switch, Access Point|
|Avaya|Avaya|ระบบโทรศัพท์|Telephony|IP Phone, PBX|IP Phone, PBX Server|
|||||||

#### Spare Part Category

|Use Group|Key Equipment|Spare Parts|Description|
|---|---|---|---|
|Telephony|IP Phone / VoIP Gateway|สายโทรศัพท์, ที่ตั้งโทรศัพท์, อะแดปเตอร์ไฟ|อะไหล่สำหรับระบบโทรศัพท์|
|Network|Switch / Router / Access Point|สาย LAN, โมดูล SFP, อะแดปเตอร์ไฟ|อะไหล่สำหรับระบบเครือข่าย|
|IT Hardware|คอมพิวเตอร์ / อุปกรณ์ต่อพ่วง|คีย์บอร์ด, เมาส์, สาย HDMI, SSD|อะไหล่ IT ทั่วไป|
|||||

#### **Store**

|**Store (TH)**|**Store (EN)**|**Description**|
|---|---|---|
|ร้านค้าสำนักงานใหญ่|HQ|Headquarter Store (default store ของ tenant)|
|คลังสินค้า 1|Store 1|Store 1|
|คลังสินค้า 2|Store 2|Store 2|
||||

> ฟิลด์จริงของ Store: `en`, `th`, `discount`, `active` — ไม่มีฟิลด์ที่อยู่/สาขา (`src/cms/types/store.ts:4-19`) คอลัมน์ Description เป็นหมายเหตุภายในเท่านั้น

#### **Product**

|**Product (TH)**|**Product (EN)**|**Code**|**Brand**|**Category**|**Year (mfd)**|**Price**|**Warranty (เดือน)**|
|---|---|---|---|---|---|---|---|
|โทรศัพท์ IP|IP Phone|P-0001|Grandstream|Telephony|2025|3,500|24|
|VoIP Gateway|VoIP Gateway|P-0002|Grandstream|Telephony|2025|15,900|24|
|Network Switch|Network Switch|P-0003|Cisco|Network|2025|12,000|36|
|Access Point|Access Point|P-0004|Cisco|Network|2025|8,500|36|
|PBX Server|PBX Server|P-0005|Avaya|Telephony|2025|120,000|36|
|||||||||

> ฟิลด์จริงของ Product: `en`, `th`, `productCode`, `brandId`, `categoryId`, `price`, `warranty`, `mfd` (+ รูปสินค้า) — คอลัมน์ Brand/Category ในตารางคือชื่อที่เลือกจาก Brand/Category ที่สร้างไว้ก่อน (`src/cms/types/product.ts:47-74`)

***Spare Parts***

|**Spare Part (TH)**|**Spare Part (EN)**|**Brand**|**Category**|**Year**|**Price**|**Warranty (เดือน)**|**Belong to**|
|---|---|---|---|---|---|---|---|
|สายโทรศัพท์ RJ11|Phone Cable RJ11|Grandstream|Telephony|2025|150|12|IP Phone|
|อะแดปเตอร์ไฟ IP Phone|IP Phone Power Adapter|Grandstream|Telephony|2025|250|12|IP Phone|
|โมดูล SFP|SFP Transceiver|Cisco|Network|2025|2,500|12|Network Switch|
|สาย LAN Cat6|CAT6 Cable|Cisco|Network|2025|60|12|Network Switch / Router|
|สาย HDMI|HDMI Cable|—|IT Hardware|2025|200|12|Desktop Computer|
|||||||||

> "Belong to" เป็นคู่มือเทียบภายใน (ระบบจับคู่อะไหล่น่าจะใช้อีกทางผ่าน store/serial — `ProductSerial`/`InventoryRequest` เก็บ `part` + `store`)

---

### 13. Appointment Management

Road Map:

1. BE: When creating a new tenant, then create default appointment type:  @Apiwat Rodchuajeen

    - General

    - Consult

    - Product  Advise

2. BE: Create API for Appointment Type Management @Apiwat Rodchuajeen->Assign

3. FE: Create GUI for Appointment Type Management @Wisarud Techa -> Done

> **ข้อมูลระบบ:** Appointment Type เก็บ `en`, `th`, `active` เท่านั้น — **ไม่มีฟิลด์หมวดหมู่/ระยะเวลาพักฟื้น** ในระบบ (`src/cms/types/appointmentType.ts:1-26`) คอลัมน์ Stay Duration ในตารางเป็นค่าแนะนำสำหรับการจัดตารางงานเท่านั้น

#### Appointment Type

|**Appointment Type (EN)**|**Appointment Type (TH)**|**Stay Duration (ค่าแนะนำ — ไม่เก็บในระบบ)**|**Common Examples (ตัวอย่างที่พบบ่อย)**|
|---|---|---|---|
|General|ทั่วไป|—|นัดหมายทั่วไป / walk-in|
|Consult|ปรึกษา|30 นาที|ปรึกษาเรื่องบริการ / ระบบ IT|
|Product Advise|แนะนำสินค้า|30 นาที|แนะนำผลิตภัณฑ์ / อุปกรณ์ IT|
|||||

#### Service Type

> = Case Type / Sub Type ของข้อ 5 (ใช้ชุดข้อมูลเดียวกัน)

|**Service Category (หมวดหมู่การบริการ)**|**Service Type (ประเภทการบริการ)**|**Urgency Level (ระดับความเร่งด่วน)**|**Description & Examples (คำอธิบายและตัวอย่าง)**|
|---|---|---|---|
|IT Service|Telephony Hardware (อุปกรณ์โทรศัพท์) — SubType 3001|High|ซ่อมอุปกรณ์โทรศัพท์ / ระบบ VoIP|
|IT Service|Network (เครือข่าย / อินเทอร์เน็ต) — SubType 3001|Critical (ใช้ 3901 กรณีวิกฤต)|อินเทอร์เน็ตหรือเครือข่ายขัดข้อง|
|Maintenance|Preventive Maintenance (บำรุงรักษาเชิงป้องกัน) — SubType 3101|Medium|ตรวจเช็คระบบตามรอบ / scheduled|
|Emergency|Emergency Outage (ขัดข้องวิกฤต) — SubType 3901|Critical|ระบบหยุดใช้งาน / ล่ม|
|||||

### 13. Customer Contact

- [ ] Config `Contact Configuration`

- [ ] Create `Customer`

- [ ] Setup linkage customer product

- [ ] Setup linkage customer service

- [ ] Setup linkage customer Appointment

> **ข้อมูลระบบ:** Contact Configuration คือการเปิด/ปิดฟิลด์ที่แสดงบนฟอร์ม customer ระดับ tenant (ค่าจริง: `displayName`, `title`, `firstName`, `middleName`, `lastName`, `citizenId`, `dob`, `blood`, `gender`, `mobileNo`, `email`, `photo`, `address` (บ้าน/ปัจจุบัน, รายชิ้น), `userType`, `note`, `languagePreference`, `contractPreference`, `social` + ฟอร์ม dynamic) (`src/cms/types/customer.ts:22-51`, `src/cms/components/customer/CustomerFormConfig.tsx`)

#### **Contact Configuration (ค่า default ของ SKYICT)**

|**Field**|**เปิด/ปิด**|**Field**|**เปิด/ปิด**|
|---|---|---|---|
|displayName|Y|photo|Y|
|title|N|email|Y|
|firstName|Y|mobileNo|Y|
|middleName|N|address (บ้าน/ปัจจุบัน)|Y|
|lastName|Y|userType|Y|
|citizenId|N|note|Y|
|dob|N|languagePreference|N|
|blood|N|contractPreference|N|
|gender|N|social (LINE/FB/etc)|Y|
|dynamic form|Y (Form ตาม sub-type)|||

#### **Customer**

|**Name (TH)**|**Profile Info**|Photo|Social ID|Note|**Product**|**Brand**|**Case**|
|---|---|---|---|---|---|---|---|
|Watee|<watee.tha@skyai.co.th> (Emp AI680013) — Admin SKY ICT|—|—|Demo — ผู้ดูแลระบบ ทดสอบ Demo|IP Phone (P-0001)|Grandstream|เคสเดโม: โทรศัพท์ไม่มีเสียง (3001)|
|Wisarud|<wisarud.tec@skyai.co.th> (Emp AI680021) — Admin SKY ICT|—|—|Demo — ผู้ดูแลระบบ ทดสอบ Demo|Network Switch (P-0003)|Cisco|เคสเดโม: สลับเน็ต (3001)|
|Apiwat|<apiwat.rod@skyai.co.th> (Emp AI680018) — Admin SKY ICT|—|—|Demo — ผู้ดูแลระบบ ทดสอบ Demo|VoIP Gateway (P-0002)|Grandstream|เคสเดโม: บำรุงรักษารายรอบ (3101)|

> Photo / Social ID เติมตอนสร้างจริง (ฟิลด์ photo ของ customer, social channels = LINE ID/Facebook ที่รองรับ)

---

### 14. Knowledge Base

- [ ] Create `Category`

- [ ] Create File / File Folder

- [ ] Create Article

#### Category List

|No.|**Category Name (TH)**|**Category Name (EN)**|**Root Category**|Level|
|---|---|---|---|---|
|1|การแก้ไขปัญหา|Operations|None|0|
|2|ขั้นตอนการตรวจสอบ Server|Procedures|1|1|
|3|ขั้นตอนการแก้ไขปัญหาโทรศัพท์ไม่มีเสียง|No Audio Troubleshooting|2|2|
|4|คู่มือใช้งาน|User Manual|1|1|
|5|การแจ้งเหตุฉุกเฉิน|Emergency Procedures|1|1|

#### File List

|No.|**Folder Name (TH)**|**Root Folder**|Level|
|---|---|---|---|
|1|SKYICT|None|0|
|2|Document|1|1|
|3|Training|1|1|
|4|User Manual|1|1|
|5|HandOver|3|2|
|6|Emergency Contact List|1|1|

#### Article List

|No.|**Article Name (TH)**|**Article Name (EN)**|**Details**|**Keyword**|**Category**|**File**|**Approve** (สถานะ)|
|---|---|---|---|---|---|---|---|
|1|ขั้นตอนการแก้ไขปัญหาโทรศัพท์ไม่มีเสียง|No Audio on IP Phone Troubleshooting|ตรวจสอบสัญญาณไฟ สายต่อ และ Port Switch / รีเซ็ตอุปกรณ์|โทรศัพท์, ไม่มีเสียง, VoIP|2 (Procedures)|—|Draft|
|2|การเปลี่ยนสาย LAN / โมดูล SFP|Replacing LAN Cable & SFP Module|ขั้นตอนเปลี่ยนสายและโมดูล พร้อมเช็กลิงก์|LAN, SFP, Switch|1 (Operations)|—|Review|
|3|คู่มือ PBX เบื้องต้น|PBX Quick Start Guide|การตั้งค่าพื้นฐาน PBX สำหรับผู้ใช้ใหม่|PBX, VoIP, คู่มือ|4 (User Manual)|User Manual|Published|

> สถานะ article ที่ใช้ในระบบ: `draft` → `review` → `published` (+ `unpublished`/`archived`) (`src/kms/articles/dtos/articles.dto.ts:5-15`)  — สิทธิ์ KB ใช้ prefix `kb_*` และต้องเปิด entitlement `entitlement.kb` ของ tenant ด้วย

---

## Correction Notes (v3 vs v2) — ตรวจสอบจาก Codebase

| # | v2 ระบุ | v3 แก้ไขเป็น (หลักฐาน) |
| --- | --- | --- |
| 1 | Priority "ตั้งแต่ CRITICAL: 0 - NONCRITICAL: 9" | ระบบมี 10 label (Critical×1, High×3, Medium×3, Low×3) ค่าเก็บ = ดัชนีภายในกลุ่ม; ทุกหน้าอ่านเป็น buckets 0-9 (0=Critical, 1-3=High, 4-6=Medium, 7-9=Low) — ตารางจึงลงเป็น label (`src/cms/utils/constants.ts:245-250`, `src/cms/components/function/Prioriy.tsx:20-25`) |
| 2 | Area Management ใช้คู่ SKYICT/Zone/Station | Area เป็น Country → Province → District — คนละโมเดลกับ Organization (ข้อ 1) เติมข้อมูลไทย/กทม./เขตจริง (`src/cms/types/area.ts:191-232`) |
| 3 | User Group มีคอลัมน์ Main Category (CAD/ORDER/KB) | ระบบไม่มีฟิลด์นี้ — User Group = `en`/`th`/`active` (+`description`) เท่านั้น (`src/core/types/user.ts:296-311`) |
| 4 | Appointment Type มี Category + Stay Duration | เก็บ `en`/`th`/`active` เท่านั้น (`src/cms/types/appointmentType.ts:1-26`) |
| 5 | "Type Code 1001" ของ Case Type | Case Type มี `typeId` (business key ตัวอิสระ) + `en`/`th`/`active` — คอลัมน์ Type Code คือค่า `typeId` ที่กรอก; `sTypeCode` อยู่ระดับ Sub Type (`src/cms/types/case.ts:300-338, 246-276`) |
| 6 | Role = Admin/Agent/Dispatcher/Responder | ในฐานข้อมูลเก็บเป็น `"roleName"` snake_case 5 ตัว: `system_admin`, `admin`, `agent`, `dispatcher`, `responder` (`db/seed/skyict/api-payloads/04-roles.json`, `02-um_users.sql` §1b) |
| 7 | อีเมล responder1/2, generalservice, emergencyservice1 พิมพ์ผิด/ซ้ำ | แก้ตาม seed: `responder1@`, `responder2@`, `generalservice1@`, `emergencyservice1@skyict.co.th` (`db/seed/skyict/02-um_users.sql` §7 D2) |
| 8 | Sub Type ไม่มีฟิลด์อุปกรณ์/ใบงาน | ฟอร์มบังคับกรอก `mDeviceType`/`mDeviceTypeName`/`mWorkOrderType` เพิ่มตารางค่าแนะนำ (`ServiceManagement.tsx:353-366`) |
| 9 | Unit Type/Source เลือกในฟอร์มได้ | ระบบ read-only — ต้อง seed ฝั่ง backend ก่อน (`src/cms/store/api/unitApi.ts:118-143`) |
| 10 | Case Status สร้าง/ปรับได้ในระบบ | `GET /case_status` อ่านอย่างเดียว (S001–S019) — ปรับต้องทำฝั่ง backend (`src/cms/store/api/serviceApi.ts:13-21`, `src/cms/components/ui/status/status.tsx:11-32`) |
| 11 | Default order workflow `SparePart - Do not Change / Delete` | ไม่มี string นี้ใน frontend code — ค่าฝั่ง backend (`app_configs`) ระบุ **UNVERIFIED** |
| 12 | Store มีรายละเอียดร้าน | Store = `en`/`th`/`discount`/`active` ไม่มีที่อยู่ (`src/cms/types/store.ts:4-19`) |
| 13 | Unit List ใช้ username generalservice1/2 | บัญชีที่ seed มีแค่ `generalservice` — แก้ให้ตรง (ข้อ 10) |
| 14 | Unit Properties ID = PROP-001… | `propId` ระบบสร้างเอง — ไม่ต้องพิมพ์รหัส (คอลัมน์ ID ว่างในตาราง) |
| 15 | "Create Tenant" เป็น checklist ในแอป | ไม่มี UI/API สร้าง tenant ฝั่ง frontend — เป็นงาน backend/platform (`docs/SKYICT-Tenant-Onboarding-Runbook.md` §1) |
