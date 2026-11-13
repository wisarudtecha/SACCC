# SKYCC Service Center Project\-Prototype

## To\-Do List : Setting Up New SKYCC Tenant

**Date: Nov 11, 2026**

## **Overview**

Integrated Omnichannel Contact Center, CRM, and Case Management Platform designed for modern enterprises with scalable cloud\-native architecture, intelligent automation, and unified customer engagement\.

## **CC Super Apps Product**

## **01****Customer 360ํ**

Aggregates every interaction from customer into one dashboard\.

Connects profiles, products, history, and service cases in one place\.

### **Contact management**

The process of storing, organizing, and tracking information about your customers, leads, and communication history**\.** It acts as a digital address book that records basic details like phone numbers and emails, while also tracking every past conversation, purchase, and meeting\.

#### **Contact Configuration**

The company can store necessary customer information and can specify that only essential customer information is displayed to agents or customer service, by choosing to **enable**or **disable** it at the field level, even if the system stores a variety of data\.

The company can store data in two main parts:

- **General Customer Information field**: A customer field commonly used for general information storage\.

- **Dynamic Customer Custom Field**: A customer field that can be customized with an unlimited number of additional fields to accommodate diverse customer data storage needs and requirements\.

#### **Appointment Management**

Appointment management is the process of planning, tracking, and organizing meetings between service providers and their clients\. Today, businesses usually use digital appointment management systems to let appointment  with customers availability, book time slots online\.

---

## **02****CRM**

Customer Relationship Management\.

This system is software or a platform used to record, track, and manage all customer information, from contact history and order volume to purchasing behavior and customer\-reported issues\. It helps businesses provide efficient customer care and increase sales\.

### **Products**

The digital infrastructure is used to organize a company's product catalog and track the flow of goods from suppliers to storage\.

**Product inventory**is the complete list of raw materials, parts, and finished goods that a business has on hand to sell to customers\. It represents the physical products a company owns that are sitting on store shelves, packed in warehouses, or moving along the supply chain\.

**Product stock**is the exact quantity of finished goods that a business has available for immediate sale to customers\. It refers specifically to the final, retail\-ready products sitting on your store shelves or warehouse racks right now\.

#### **Spare Parts**

The digital infrastructure used to organize a company's spare parts catalog and track the flow of parts from suppliers to storage\.

**Spare parts inventory**is the collection of backup parts and materials kept on hand to repair or maintain equipment and machinery\. Unlike product stock, these items are not meant to be sold to customers\. Instead, they are used internally to fix things when they break and to perform routine maintenance so your business operations do not grind to a halt\.

**Spare parts stock**is the exact number of ready\-to\-use backup components physically sitting on your shelves for quick machinery repairs\. While "spare parts inventory" includes the entire strategy of ordering and tracking parts, "stock" refers strictly to the actual pieces—like bolts, filters, or motors—available in your supply room right now\. These items are kept on hand to make sure a broken machine can be fixed immediately without waiting for supplier delivery\.

#### **Order for services**

To quickly order spare parts for your service work, if you manage field service operations, you can integrate the system to initiate purchasing or link parts directly to open work orders\.

**Order management**for products and spare parts is the process of tracking an order from the exact moment a customer or technician requests it until it is safely delivered\. It acts as the command center for your business logistics, making sure items are pulled from stock, packed correctly, and shipped on time\.

The process looks slightly different depending on whether you are dealing with **retail products** or **internal maintenance parts**:

- **For Products**: It is about fulfilling a sales order from a customer who bought an item from your store or website\.

- **For Spare Parts**: It is usually about fulfilling a work order from a maintenance technician who needs a part to fix a broken machine\.

**Note**: Not included payment gateway, logistic provider tracking\.

---

## **03****Case \& Ticket Management**

This system manages customer complaints, problems, and inquiries by transforming all contact from various channels \(such as email, phone, LINE, Facebook, Live Chat\) into a centralized "ticket" or "case\." This allows the support or customer service team to systematically track, investigate, and resolve issues without any work being missed\.

### Create Case

**Create Case**is the first step in a customer support system where a client's problem or request is officially recorded as a digital ticket\. It takes an incoming message—like an email, a phone call, or a chat message—and turns it into a trackable file inside a company's software\.

This process acts as the formal entry point for fixing customer issues, making sure no request is forgotten or lost in an inbox\.

#### **Case Assignment Board**

The task management tool displays results on a board, emphasizing the movement of task statuses \(e\.g\., To Do \-\> In Progress \-\> Done\), providing a clear overview of the workflow immediately\. This helps the team understand the systematic task assignment process better\.

**Note**: Not included in mobile application for first response unit\.

#### **Case Details**

**Case Details** is the core information screen inside a support ticket that shows everything a team needs to know about a specific customer issue\. It acts as the central command center for that single problem, collecting all the background facts, customer notes, and technical data onto one clean page\.

Once a case is created, support agents spend most of their time looking at the Case Details screen to understand, troubleshoot, and solve the problem\.

#### **Case History**

In case management, a case history is a collection of all historical information, records, and context related to a specific case, from its initial inception until its complete resolution\.

---

## **04****Dashboard \& Report Statistic**

### **Case Dashboard**

The tool summarizes work order information in an easy\-to\-understand visual format, such as graphs, tables, or key performance indicators \(KPIs\), on a single screen\. This helps managers, technicians, and executives track status, assign tasks, and resolve issues in a timely manner\.

#### **Product Dashboard**

The Product and Parts Dashboard is a portal for monitoring asset availability, tracking part degradation, and preventing service disruptions that cause risk and delays\.

#### Report Server \(ระบบรายงาน\)

##### Orders Reports \(รายงานคำสั่งซื้อ\)

|**รหัส**|**ชื่อรายงาน**|**คำอธิบาย**|
|---|---|---|
|**1\.**|**Orders Report**|*รายงานสรุปภาพรวมคำสั่งซื้อ*|
|1\.1|Daily order report|รายงานคำสั่งซื้อประจำวัน|
|1\.2|inventory report|รายงานสินค้าคงคลังคงเหลือ|
|1\.3|spare parts inventory report|รายงานคลังสินค้าอะไหล่และชิ้นส่วนสำรอง|
|**2\.**|**Order Details**|*รายงานรายละเอียดข้อมูลคำสั่งซื้อเชิงลึก*|
|2\.1|order details report|รายงานรายละเอียดสินค้าในแต่ละคำสั่งซื้อ|
|2\.2|Request Parts Summary|รายงานสรุปการขอเบิกชิ้นส่วน/อะไหล่|
|2\.3|Top 10 Sales Report|รายงานยอดขาย 10 อันดับแรก|
||||

###### Cases Reports \(รายงานเหตุ\)

|**รหัส**|**ชื่อรายงาน**|**คำอธิบาย**|
|---|---|---|
|**1**|**รายงานสรุปงานบริการ**|*ภาพรวมประสิทธิภาพและแนวโน้มการให้บริการ*|
|1\.1|📊 รายงานสรุปงานบริการรายวัน|ยอดรวมและสถานะการบริการแบบวันต่อวัน|
|1\.2|📅 รายงานสรุปงานบริการรายเดือน|ภาพรวมผลการดำเนินงานแบบรายเดือน|
|1\.3|📈 รายงานสรุปงานบริการเปรียบเทียบตามรายวัน|เปรียบเทียบข้อมูลวันต่อวัน เพื่อดูความเติบโต|
|1\.4|📉 รายงานสรุปงานบริการเปรียบเทียบตามรายเดือน|วิเคราะห์แนวโน้มเปรียบเทียบแต่ละเดือน|
|**2**|**รายงานรายละเอียดงานบริการ**|*ข้อมูลเชิงลึก เจาะลึกรายเคสและแยกหมวดหมู่*|
|2\.1|📋 รายงานรายละเอียดข้อมูลงานบริการ|รายการงานทั้งหมด พร้อมข้อมูลอ้างอิงและสถานะ|
|2\.2|🗂️ รายงานสรุปงานบริการแจกแจงตามประเภทงาน|จัดกลุ่มตามหมวดหมู่ \(เช่น ซ่อม, ติดตั้ง, ปรึกษา\)|
|2\.3|✅ รายงานสรุปงานบริการแจกแจงตามผลให้บริการ|สรุปผลลัพธ์ \(เช่น สำเร็จ, รอคอย, ยกเลิก\)|
|2\.4|📍 รายงานรายละเอียดงานบริการและสถานที่ให้บริการ|ข้อมูลการทำงานแยกตามพิกัดและสถานที่|
||||

---

## **05****User Management \& Role Privilege**

User management in a super app environment manages both end\-users \(employees\) and administrator\. It establishes a secure, personalized experience and necessary auditing tools\.

---

## **06 Knowledge Base**

A **knowledge base \(KB\)**is a **centralized digital library** that stores, organizes, manages, retrieve and shares information\. It serves as an organization’s single source of truth, converting scattered documents into searchable, structured data\.

**Source Management** is an administrative system feature used to configure, organize, and track the data origins feeding into a platform's knowledge base\.

**Category management** is a strategic approach to organizing knowledge based articles into logical, manageable groups based on how users or consumers perceive and use them\.

**File Manager** is a digital tool software application that allows you to organize, create, view, edit, and delete files and folders on a storage system\.

**Article Management** is a core content management of knowledge base system \(KB\) module that allows administrators, writers, and support agents to create, organize, review, and publish written content\.

***Approve Article Process***

This workflow governs the editorial lifecycle of Knowledge Base content to ensure high quality and accuracy before publication\.

- **Review Article Before Publishing**: Evaluate drafts for brand alignment, accuracy, and formatting compliance\.

- **Approve Article**: Authorize verified content for immediate publication to the live Knowledge Base\.

- **Reject Article:** Block substandard drafts from publishing and change their status back to review or draft\.

- **Feedback for Revision**: Provide actionable notes to authors detailing required edits for rejected content\.

**Banner Management** is an administrative setting in a content platform or help center that allows managers to create, edit, and feature promotional or informative banners on a knowledge\-based website\. The specific feature "\(Show select article to banner\)" means you can link a specific help article, announcement, or blog post directly to that banner, so agent/staff are taken straight to the text when they click it\.

Instead of just showing a generic image, this tool lets you push important, timely content right to the top of your knowledge\-based website\.

**Broadcast Management** is an administrative control center used to create, schedule, and send mass messages to many people at the same time\. In business software and communication platforms, this tool allows you to blast out urgent announcements, marketing updates, or system notices in\-app pop\-ups—all from one place\.

---

## **To\-Do List: Setting Up New SKYCC Tenant**

Prototype / Mockup / Demo Preparation

## Prerequisite Setting

Date required submit  @Aunnop Choocherd⏰2026-11-13 11:00

### 1\. Organization Configuration \(ใส่เป็นแผนก หรือตาม Workflow ได้เลย e\.g\. Operator \-\-\> Dept\.\)

- [ ] Create `Tenant` for `Organization`

- [ ] ระบุการจัดการองค์กร

  - [ ] Level 1 such as Organiztion / Department  

  - [ ] Level 2 such as Command

  - [ ] Level 3 such as Station

***Example***

|**No\.**|**Level 1 Department**|**Level 2 Command**|**Level 3** Station|
|---|---|---|---|
|1|Traffic Transportation Department|Center Zone|Station 1|
|2|Traffic Transportation Department|Center Zone|Station 2|
|3|Traffic Transportation Department|North Zone|Station 3|
|4|Traffic Transportation Department|Northeast Zone|Station 4|

#### **Organization Information**

|**No\.**|**Level 1**|**Level 2**|**Level 3**|
|---|---|---|---|
|1|SRT|Center|Center|
|2||||
|3||||

---

#### 2\. Role\. \(เพื่อเชื่อมไปข้อ 3 สำหรับ Setup Demo\)

- [ ] ระบุ Role ที่ต้องการ

  - [ ] Default Role

    - [ ] Admin \- All Function , Approve Content KB

    - [ ] Supervisor \- All Function, Approve Content KB

    - [ ] Agent \- Call Taker

    - [x] Dispatcher \-  Distribute the Case to Responder

    - [x] Responder \- Field Unit

    - [ ] Content \- Create Content KB for agent

    - [ ] Publisher \- Approve Content KB

- [ ] ระบุ Function ที่ให้ใช้งานได้

  - [x] เช่น Case, CRM, Contact, Workflow, Form, Config, Report, Knowledge \(แต่ละ Role ใช้ Features อะไร\)

  - [ ] Case

  - [ ] CRM

  - [ ] Contact

  - [ ] Report

  - [ ] Knowledge

##### Role

|No\.|Role|Case|CRM|Contact|Report|Knowledge\-View|Knowledge\-Create|Knowledge\-Approve|
|---|---|---|---|---|---|---|---|---|
|1|Admin|Y|Y|Y|Y|Y|Y|Y|
|2|Supervisor|Y|Y|Y|Y|Y|Y|Y|
|~~3~~|Agent|Y|Y|Y||Y|||
|~~4~~|Content|||||Y|Y||
|5|Publisher|||||Y|Y|Y|

###### Permission List  

---

#### 3\. User Management \(Demo Sender View \& Responder View\)

- [ ] Tenant: SKYCC

- [ ] ระบุ User ที่ต้องการ

- [ ] Profile Photo

##### **User List**

|\##|**User Name**|**First name**|**Last  Name**|**Email**|**Emp ID**|**Role**|**Department**|**Command**|**Station**|
|---|---|---|---|---|---|---|---|---|---|
|1|watee\.tha|Watee|Thaiprasonk|watee\.tha@skyai\.co\.th|AI680013|Admin|Central Call Center|Central Call Center|Call Center|
|~~2~~|~~kittipong~~~~\.mue~~</br>|~~Kittipong~~|~~Muengrod~~|~~kittipong\.mue@skyai\.co\.th~~|~~AI680110~~|~~Admin~~|~~Central Call Center~~|~~Central Call Center~~|~~Call Center~~|
|3|apiwat\.rod|Apiwat|Rodchuajeen|apiwat\.rod@skyai\.co\.th|AI680018|Admin|Central Call Center|Central Call Center|Call Center|
|4|wisarud\.tec|Wisarud|Techa|wisarud\.tec@skyai\.co\.th|AI680021|Admin|Central Call Center|Central Call Center|Call Center|
|~~5~~|~~k~~~~rittaya~~~~\.ple~~|~~Krittaya~~|~~Plengwithaya~~|~~krittaya\.ple@skyai\.co\.th~~|AI680012|~~Admin~~|~~Central Call Center~~|~~Central Call Center~~|~~Call Center~~|
||Aunnop\.cho|Aunnop|Choocherd|aunnop\.cho@skyai\.co\.th|AI680119|Admin|Central Call Center|Central Call Center|Call Center|
|6|agent1|Agent|1|agent1@skycc\.co\.th|SK699001|Agent|Central Call Center|Central Call Center|Call Center|
|7|agent2|Agent|2|agent2@skycc\.co\.th|SK699002|Agent|Central Call Center|Central Call Center|Call Center|
|8|responder1|Responder|1|respinder1@skycc\.co\.th|SK699003|Responder|Central Call Center|Central Call Center|Call Center|
|9|responder2|Responder|2|respinder2@skycc\.co\.th|SK699004|Responder|Central Call Center|Central Call Center|Call Center|
|10|generalservice|General Service|1|generalsrvice1@skycc\.co\.th|SK699005|Responder|Central Call Center|Central Call Center|Call Center|
|11|emergencyservice1|Emergency Service|1|emergencyservice2@skycc\.co\.th|SK699006|Responder|Central Call Center|Central Call Center|Call Center|
|12|emergencyservice2|Emergency Service|2|emergencyservice2@skycc\.co\.th|SK699007|Responder|Central Call Center|Central Call Center|Call Center|
|13|dispatcher1|Dispatcher|1|dispatcher1@skycc\.co\.th|SK699008|Dispatcher|Central Call Center|Central Call Center|Call Center|
|14|dispatcher2|Dispatcher|2|dispatcher2@skycc\.co\.th|SK699009|Dispatcher|Central Call Center|Central Call Center|Call Center|
|15|sompith\.kit|Sompith|Kitcharoen|sompith\.kit@skycc\.co\.th|SK690394|Admin|Central Call Center|Central Call Center|Call Center|
|16|chutikan\.kon|Chutikan \(Pimm\)|Kongton|chutikan\.kon@skycc\.co\.th|SK690375|Admin|Central Call Center|Central Call Center|Call Center|
|17|chatchanan\.dul|Chatchanan \(Petch\)|Dulyakometh|chatchanan\.dul@skycc\.co\.th|SK680123|Admin|Central Call Center|Central Call Center|Call Center|
|18|chamrat\.mee|Chamrat \(Tieung\)|Meedam|chamrat@skycc\.co\.th|SK63035|Admin|Central Call Center|Central Call Center|Call Center|
|19||||||||||

***Access CC SuperApp Portal***

URL: [https://skyai\-cloud\-cc\-stg\.one\-sky\.ai/](https://skyai-cloud-cc-stg.one-sky.ai/)

URL: <https://skyai\-cloud\-cc\-qa\.one\-sky\.ai/>
User: ???
Pass: Skycc@123

Tenant: SKYCC

---

#### 4\. User Group

Road Map:

1. BE: When creating a new tenant, then create the default user group:

    - General @Apiwat Rodchuajeen

2. BE: Create API for user group management @Apiwat Rodchuajeen\-\-\>Done

3. FE: Create GUI for user group management @Wisarud Techa \-\-\> Done

4. FE: Add user to group @Wisarud Techa \-\-\> Done

    1. Click to view the groups and display available user options/selected users\.

    2. Supports selecting users one at a time, multiple users, and all users\.

- [ ] ระบุ User Group ที่ต้องการ

- [ ] ใช้ 2 ส่วน

  - [ ] Knowledge Base \- Group of User

  - [ ] Order PIC \- Approval

##### **User Group**

|**Group**|**Main Category**|Descriptions|
|---|---|---|
|Dispatch Group 1|CAD|Dispatch Group 1|
|Dispatch Group 2|CAD|Dispatch Group 2|
|Order Approval|ORDER|Order Approval|
|Technical|KB|Technical|
|Agent|KB|Agent|
|Dispatcher|KB|Dispatcher|
|Operation|KB|Operation|
||||

---

#### 5\. Service Type / Sub Type

- [ ] ระบุ Type/ Sub Type ที่ต้องการ

- [ ] Priority \(ตั้งแต่ CRITICAL: 0 \- NONCLITICAL: 9\) สามารถกำหนดได้ตามความเร่งด่วน

- [ ] ทักษะ อาจจะใส่ ทั่วไปก่อน หรืออาจจะแสดงตัวอย่าง เคสที่ต้องมีทักษะจำเป็น

- [ ] ใส่ SLA ไว้เป็น ตย\. มาจากผลรวมของ Workflow ข้อ 6

***Example***

##### **Type********/**** ****Sub**** ****Type Information**

---

#### 6\. WorkFlow การทำงาน

- [ ] ระบุ Workflow \& SLA ที่ต้องการ

  - [ ] Note: After new, assigned status can customize

- [ ] Default orders workflow name: `SparePart - Do not Change`` ``/`` ``Delete`

  - [ ] Setup `PIC` / `User Group` for each node in orders workflow

  - [ ] Manual config workflowid for organization \-\-\> \[`Database` welcome\_crm\] / \[`Table` app\_configs\]

##### **Case Example:**

|**No\.**|**Workflow Name**|**New**|**Assigned**|**Acknowledge**|**Inprogress**|**Done**|**Closed**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|
|1|Work Flow for Case Type 1001|1 min</br>|3 min</br>|3 min|60 min|5 min</br>|5 min||
||||||||||

###### **Orders Example:**

- Default orders workflow name : `SparePart - Do not Change`` ``/`` ``Delete`

|**No\.**|**Workflow Name**|**Create Order**|**Request**|**Request Approved**|**Picking**|**Packing**|**Dispatched**|**Out for Delivery**|**Delivered**|**Complete**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|1|Order Part|1 min|3 min|10 min|30 min|40 min|60 min|30 min|2,880 min|5 min|3,059 min|
|||||||||||||

###### **Cases Workflow SLA Information**

###### **Orders Workflow SLA Information**

- Default orders workflow name : `SparePart - Do not Change`` ``/`` ``Delete`

|**No\.**|**Workflow Name**|**Create Order**|**Request**|**Request Approved**|**Picking**|**Packing**|**Dispatched**|**Out for Delivery**|**Delivered**|**Complete**|**Total SLA**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|1|Order Part|1 min|3 min|10 min|30 min|40 min|60 min|30 min|2,880 min|5 min|3,059 min|
|||||||||||||

---

#### 7\. Dynamic Field \& Forms \(ใช้ตรงหน้า create case เพื่อให้ตรงกับเคสของลูกค้า ซึ่งจะ Link กับ Case Type ข้างบน หลังจากที่เลือก Case Type\)

- [ ] ระบุ Dynamic Form สำหรับ Case Creation ที่ต้องการ เช่น แก้ไขปัญหา Server, ต้องการ MA

- [ ] ระบุ Dynamic Form สำหรับ Contact ที่ต้องการ เช่น Line ID, Position, etc \(สำหรับ field contact ที่ต้องการของลูกค้า\)

##### **📝** Form 1: Telephony Hardware \& IT Service Form

\(สำหรับแจ้งปัญหาอุปกรณ์ระบบโทรศัพท์ \- SubType 3001\)

######## 1\.1\) Header \& Contact Fields \(ข้อมูลผู้แจ้ง/ตำแหน่งที่ตั้ง\)

- **ชื่อผู้แจ้งปัญหา / บุคลากร:** `[Required]` *\(Text\)*

- **เบอร์มือถือติดต่อกลับ:** `[Optional]` *\(Phone \- กรอกเพิ่มกรณีอยู่คนละจุดกับเบอร์ที่มีปัญหา\)*

- **อาคาร / ชั้น / หน่วยงาน:** `[Required]` *\(Dropdown / Text\)*

######## 1\.2\) Dynamic Hardware \& Symptom Fields \(ข้อมูลอุปกรณ์และอาการเสีย\)

######## 1\.3\) General Details \& Attachment

- **รายละเอียดอาการเพิ่มเติม / หมายเหตุ:** `[Optional]` *\(Long Text\)*

- **แนบรูปถ่ายอุปกรณ์ / จุดเกิดเหตุ:** `[Optional]` *\(Attachment\)*

---

###### **Form Management List**

Here is the sorted list of forms arranged by their code and name\.

|**Form Code / Name**|**Form Title**|**Version**|**Workflow**|**Date \& Time**|**Updated By**|**Actions**|
|---|---|---|---|---|---|---|
|Form 1|Telephony Hardware \& IT Service Form|v\.1</br>|SKYCC\-Investigation Flow|Aug 17, 2026, 03:56 PM|watee\.tha|View Edit Delete|
|||v\.1|SKYCC\-Repair Flow||||
|||v\.1|SKYCC\-Service Flow||||
|||v\.1|SKYCC\-Maintenance Flow||||
|||v\.1|SKYCC\-Outsourced Flow||||
||||||||

---

#### 8\. Skill Management \(สามารถ routing case ไปยัง level skill ได้\) หากจัด case tpye by dept ดีแล้ว อาจจะไม่ต้องมีก็ได้ ขึ้นอยู่กับความ complex

- [ ] ระบุ Skill ของเจ้าหน้าที่ Responder ถ้ามี

***Example***

|**หมวดหมู่ความสามารถ \(Skill\)**|**นิยามย่อ \(Definition\)**|**ตัวอย่างงาน \(Example\)**|
|---|---|---|
|**Maintenance**|ซ่อมบำรุงเชิงป้องกัน|ตรวจเช็คสภาพเครื่องจักร, สำรองข้อมูล|
|**Service**|บริการตามคำขอ|ติดตั้งโปรแกรม, จัดเตรียมอุปกรณ์|
|**Repair**|ซ่อมแซมระบบที่พัง|เปลี่ยนหน้าจอแตก, ซ่อมสายแลนขาด|
|**Investigation**|ตรวจสอบหาสาเหตุ|วิเคราะห์สาเหตุเน็ตหลุด, เช็ค Log|
|**General Support**|สนับสนุนทั่วไป|รีเซ็ตรหัสผ่าน, สอนวิธีใช้งานโปรแกรม|
|**Outsource**|ส่งต่อหน่วยงานภายนอก|แจ้งเคลมประกัน, ประสานงาน ISP|
||||

##### **ตารางหมวดหมู่งาน \(Skill  Matrix\)**

|**หมวดหมู่ความสามารถ \(Skill\)**|**นิยามย่อ \(Definition\)**|**ตัวอย่างงาน \(Example\)**|
|---|---|---|
|**Maintenance**|ซ่อมบำรุงเชิงป้องกัน|ตรวจเช็คสภาพเครื่องจักร, สำรองข้อมูล|
|**Service**|บริการตามคำขอ|ติดตั้งโปรแกรม, จัดเตรียมอุปกรณ์|
|**Repair**|ซ่อมแซมระบบที่พัง|เปลี่ยนหน้าจอแตก, ซ่อมสายแลนขาด|
|**Investigation**|ตรวจสอบหาสาเหตุ|วิเคราะห์สาเหตุเน็ตหลุด, เช็ค Log|
|**General Support**|สนับสนุนทั่วไป|รีเซ็ตรหัสผ่าน, สอนวิธีใช้งานโปรแกรม|
|**Outsource**|ส่งต่อหน่วยงานภายนอก|แจ้งเคลมประกัน, ประสานงาน ISP|
||||

---

#### 9\. Area Management

- [ ] ระบุการจัดการพื้นที่บริการ

  - [ ] Level 1 such as

  - [ ] Level 2 such as

  - [ ] Level 3 such as

##### Service Area List

|**Code**|**L1 Name \(TH\)**|**L1 Name \(EN\)**|**L2 Code**|**L2 Name \(TH\)**|**L2 Name \(EN\)**|**L3 Code**|**L3 Name \(TH\) \(Limit 100 Char\.\)**|**L3 Name \(EN\)**|
|---|---|---|---|---|---|---|---|---|
|1|SKYCC|SKYCC|11|Central Zone|Central Zone|1101|Station 1||
|2|SKYCC|SKYCC|11|Central Zone|Central Zone|1102|Station 2||
||||||||||

---

#### 10\. Unit Management

Road Map:

1. BE: When creating a new tenant, then create default unit type / unit source @Apiwat Rodchuajeen

2. FE: Create GUI for Properties Management @Wisarud Techa \-\-\> Done

3. FE: Create GUI for unit to add each property to unit\. @Wisarud Techa \-\-\> Done

    1. Enhancements to the GUI to add property to unit management

- Unit Type

  - Staff \(ปฎิบัติงาน\)

- Unit Source

  - Internal \(หน่วยภายใน\)

  - External \(หน่วยภายนอกองค์กร\)

- Unit Properties

  - Not Spectify \(ไม่ระบุ\)

- Unit

##### **Unit List**

|**Unit ID\***|**Unit Name\***|**Unit Type**|**Username**|**Unit Source**|**Company**|**Department**|**Command**|**Station**|
|---|---|---|---|---|---|---|---|---|
|UNIT\-001|UNIT\-001|Staff|responder1|Internal|||||
|UNIT\-002|UNIT\-002|Staff|responder2|Internal|||||
|UNIT\-003|UNIT\-003|Staff|generalservice1|Internal|||||
|UNIT\-004|UNIT\-004|Staff|generalservice2|Internal|||||
|UNIT\-005|UNIT\-005|Staff|emergencyservice1|Internal|||||
|UNIT\-006|UNIT\-006|Staff|emergencyservice2|Internal|||||
|UNIT\-007|UNIT\-007|Staff||Internal|||||
|UNIT\-008|UNIT\-008|Staff||Internal|||||
||||||||||

###### **Unit Properties**

|**ID\***|**Properties Name\* \(EN\)**|**Properties Name\* \(TH\)**|**Description**|
|---|---|---|---|
|PROP\-001|Not Spectify|ไม่ระบุ||
|PROP\-002||||
|PROP\-003||||
|PROP\-004||||
|PROP\-005||||
|PROP\-006||||
|PROP\-007||||
|PROP\-008||||
|||||

---

#### 11\

---

#### 12\. Product Management

Road Map:

1. BE: When creating a new tenant, then create the default Brand / Brand photo: @Apiwat Rodchuajeen

    - General

2. BE: When creating a new tenant then Create default Store: @Apiwat Rodchuajeen

    - HQ

3. BE: Create API for Brand Management @Apiwat Rodchuajeen\-\-\> Assign

4. FE: Create GUI for Brand Management @Wisarud Techa \-\-\> Done

5. FE: Create GUI for Brand Photo Management @Wisarud Techa \-\-\> Done

6. FE: Create GUI for Store Management @Wisarud Techa \-\-\> Done

- Brand / Brand Photo

- Category of product

- Store

##### **Brand and Category**

|**Brand********\(****TH****\)**|**Brand \(****EN****\)**|**Main Category \(****TH****\)**|**Main Category \(****EN****\)**|**Sub\-Category**|**Key Products**|
|---|---|---|---|---|---|
|||||||

###### Spare Part Category

|Use Group|Key Equipment|Spare Parts|Description|
|---|---|---|---|
|||||

###### **Store**

|**Store \(TH\)**|**Store********\(EN\)**|**Description**|
|---|---|---|
|ร้านค้าสำนักงานใหญ่|HQ|Headquarter Store|
|คลังสินค้า 1|Store 1|Store 1|
|คลังสินค้า 2|Store 2|Store 2|
||||

###### **Product**

|**Product \(TH\)**|**Product********\(EN\)**|**Code**|**Brand**|**Category**|**Year**|**Price**|Warranty|
|---|---|---|---|---|---|---|---|
|||||||||

####### **Spare Parts**

|**Spare Part \(TH\)**|**Spare Part********\(EN\)**|**Brand**|**Category**|**Year**|**Price**|Warranty|Belong to|
|---|---|---|---|---|---|---|---|
|||||||||

---

#### 13\. Appointment Management

Road Map:

1. BE: When creating a new tenant, then create default appointment type:  @Apiwat Rodchuajeen

    - General

    - Consult  

    - Product  Advise

2. BE: Create API for Appointment Type Management @Apiwat Rodchuajeen\-\-\>Assign

3. FE: Create GUI for Appointment Type Management @Wisarud Techa \-\-\> Done

##### Appointment Type

|**Appointment Category  \(หมวดหมู่การนัดหมาย\)**|**Appointment Type  \(ประเภทการนัดหมาย\)**|**Stay Duration  \(ระยะเวลาการพักฟื้น\)**|**Common Examples  \(ตัวอย่างที่พบบ่อย\)**|
|---|---|---|---|
|||||

###### Service Type

|**Service Category  \(หมวดหมู่การบริการ\)**|**Service Type  \(ประเภทการบริการ\)**|**Urgency Level  \(ระดับความเร่งด่วน\)**|**Description \& Examples  \(คำอธิบายและตัวอย่าง\)**|
|---|---|---|---|
|||||

#### 13\. Customer Contact  

- [ ] Config `Contact Configuration`

- [ ] Create `Customer`

- [ ] Setup linkage customer product

- [ ] Setup linkage customer service

- [ ] Setup linkage customer Appointment

##### **Customer**

|**Name  \(TH\)**|**Profile Info**|Photo|Social ID|Note|**Product**|**Brand**|**Case**|
|---|---|---|---|---|---|---|---|
|Watee||||||||
|Wisarud||||||||
|Apiwat||||||||

---

#### 14\. Knowledge Base

- [ ] Create `Category`

- [ ] Create File / File Folder

- [ ] Create Article

##### Category List

|No\.|**Category Name \(TH\)**|**Category Name \(EN\)**|**Root Category**|Level|
|---|---|---|---|---|
|1|การแก้ไขปัญหา|Operations|None|0|
|2|ขั้นตอนการตรวจสอบ Server|Procedures|1|1|
|3|||||

###### File List

|No\.|**Folder Name \(TH\)**|**Root Folder**|Level|
|---|---|---|---|
|1|SKYCC|None|0|
|2|Document|1|1|
|3|Training|1|1|
|4|User Manual|1|1|
|5|HandOver|3|2|
|6||||

###### Article List

|No\.|**Article ****N****ame \(TH\)**|**Article****Name**** \(EN\)**|**Details**|**Keyword**|**Category**|**File**|**Approv****e******|
|---|---|---|---|---|---|---|---|
|1||||||||
