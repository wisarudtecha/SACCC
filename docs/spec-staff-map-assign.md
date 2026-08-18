# Spec (ฉบับแก้ไข): สั่งการ / ยกเลิกการสั่งการ เจ้าหน้าที่ จาก Staff Panel บนแผนที่ ArcGIS

> ฉบับนี้ปรับจาก "Unit Widget on ArcGIS Map" ให้ **map ตรงกับโค้ดที่มีอยู่จริง** ในรีโป
> ไม่มี endpoint สมมติ ไม่มี component ซ้ำซ้อน และไม่มี state ที่ขัดกับดีไซน์เดิม

---

## 0. สรุปสิ่งที่เปลี่ยนจาก spec เดิม

| หัวข้อ | Spec เดิม | ฉบับนี้ | เหตุผล |
|---|---|---|---|
| ที่ตั้ง | `caseAssignment.tsx` | `CaseDetailView.tsx` (ผ่าน `CaseDisplay` → `CaseStaffMapField`) | หน้า assignment เป็น list/kanban ไม่มีแผนที่ ส่วน CaseDetailView มี map + mutation ครบแล้ว |
| Widget | สร้าง floating panel ใหม่ | **ต่อยอด `StaffDetailPanel` ที่มีอยู่** | panel + section registry + i18n key ถูกวางไว้รอแล้ว |
| Tabs / `viewMode` | `'case-details' \| 'staff-list' \| 'minimized'` | **ตัดทิ้งทั้งหมด** ใช้ `isStaffVisible` + `selectedStaffId` + `openSectionId` ที่มีอยู่ | ดูรายละเอียด §3 |
| Assign API | `POST /api/v1/cases/{id}/assign` | `POST /dispatch/event` (`dispatchInterface`) | ของจริงในระบบ |
| Cancel API | `POST /api/v1/cases/{id}/cancel-assignment` | `POST /dispatch/cancel/unit` (`CancelUnit`) | ของจริงในระบบ |
| จำนวนคนต่อครั้ง | array หลายคน | **1 คน/ครั้ง** | endpoint จริงรับ `unitId` เดี่ยว และ UX เลือกจากหมุดบนแผนที่ |
| Freshness | polling 5 วิ | **WebSocket เป็นหลัก + polling 10 วิ เป็น fallback** | ใช้ `STAFF_REFRESH_COOLDOWN_MS = 10_000` ตัวเดิม |
| 5-mile buffer | อยู่ใน scope | เลื่อนออก (§9) | ไม่มี roster list ให้กรองแล้ว |

---

## 1. ขอบเขต

### ไฟล์ที่แก้

| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `src/cms/store/api/dispatch.ts` | เพิ่ม `invalidatesTags: ["Dispatch"]` ให้ 2 mutation |
| `src/cms/components/case/CaseDetailView.tsx` | ขยาย `staffOverlay` memo ให้ส่ง callback + สถานะลงไป |
| `src/cms/components/case/CaseDisplay.tsx` | ขยาย type ของ prop `staffOverlay` แล้ว forward ต่อ |
| `.../map/staff/CaseStaffMapField.tsx` | รับ prop ใหม่, ถือ `pendingAction`, forward เข้า panel |
| `.../map/staff/StaffDetailPanel.tsx` | ส่ง context เข้า `render` ของ section |
| `.../map/staff/staffPanelSections.tsx` | เขียน `render` ของ 3 section + เปลี่ยน `status` เป็น `"available"` |
| `.../map/staff/useStaffPositions.ts` | เพิ่ม polling fallback |
| `public/i18n/{en,th,cn}.json` | เพิ่มคีย์ปุ่ม/ยืนยัน/toast (§7) |

### ไฟล์ที่ **ห้าม** แก้

- `AssignOfficerModel.tsx` / `singleAssignOfficer.tsx` — modal เดิมยังต้องทำงานเหมือนเดิม ฟีเจอร์นี้เป็นทางลัดเพิ่ม ไม่ใช่ตัวแทน
- `ArcgisAddressMap.tsx`, `useStaffGraphicsLayer.ts` — `hitTest`, `goTo`, GraphicsLayer มีครบแล้ว
- `caseAssignment.tsx` — ไม่แตะ

---

## 2. สถาปัตยกรรม — ใครถืออะไร

```
CaseDetailView.tsx                    ← เจ้าของ mutation + SOP + toast + confirm modal
  │  staffOverlay={{ caseId, assignedUnitIds, canAssign, canCancel, onAssign, onCancel }}
  ▼
CaseDisplay.tsx                       ← ส่งผ่านอย่างเดียว (presentational)
  ▼
CaseStaffMapField.tsx                 ← เจ้าของ isStaffVisible / selectedStaffId / pendingAction
  ├── ArcgisAddressMapField → ArcgisAddressMap (hitTest, goTo, GraphicsLayer)
  ├── StaffMapControls      (toggle / refresh / notice)
  └── StaffDetailPanel      ← render section assign / cancel-assign / assigned-case
```

**หลักการ:** business logic ทั้งหมด (payload, SOP stage, toast, refetch) อยู่ที่ `CaseDetailView` เท่านั้น
ชั้นแผนที่รู้แค่ "ปุ่มนี้กดได้ไหม" กับ "กดแล้วเรียกอะไร" — ตรงกับคอมเมนต์เดิมใน `CaseStaffMapField.tsx`
ที่ระบุว่า *"ArcgisAddressMapField / ArcgisAddressMap stay generic"*

---

## 3. State — คำตอบเรื่อง `viewMode`

**ข้อสรุป: ไม่ต้องมี `viewMode` เลย** เพราะ `StaffDetailPanel` ที่มีอยู่ทำหน้าที่นี้ครบแล้ว

`viewMode` ใน spec เดิมเอา 3 แกนที่ไม่เกี่ยวกันมามัดรวม:

| แกน | ของเดิมใน spec | ตัวจริงในโค้ด | อยู่ที่ไหน |
|---|---|---|---|
| ย่อ/ขยาย widget | `'minimized'` | `isStaffVisible: boolean` | `CaseStaffMapField:44` |
| เลือกเจ้าหน้าที่ | `'staff-list'` | `selectedStaffId: string \| null` (คลิกหมุดบนแผนที่) | `CaseStaffMapField:45` |
| เปิดหัวข้อไหน | `'case-details'` | `openSectionId: string \| null` (accordion) | `StaffDetailPanel:43` |

การมัดรวมทำให้เกิดบั๊กแน่นอน: ย่อ widget แล้วขยายกลับจะจำไม่ได้ว่าเปิด section ไหนอยู่

**ไม่มี `staff-list` ตามที่ระบุ** — การเลือกเจ้าหน้าที่คือ *คลิกหมุดบนแผนที่* ซึ่งเลือกได้ทีละ 1 คนโดยธรรมชาติ
(`resolveStaffClick` → `setSelectedStaffId`) `StaffDetailPanel` แสดง 1 คนที่เลือกอยู่ ปุ่มสั่งการ/ยกเลิกจึงผูกกับคนคนนั้นเสมอ

### state ที่ต้องเพิ่ม (มีตัวเดียว)

```ts
// CaseStaffMapField.tsx — แทน UnitWidgetState ทั้งก้อนใน spec เดิม
type PendingStaffAction =
  | { type: "assign" | "cancel"; unitId: string; unitName: string; username: string }
  | null;

const [pendingAction, setPendingAction] = useState<PendingStaffAction>(null);
const [submittingUnitId, setSubmittingUnitId] = useState<string | null>(null);
```

`isSubmitting` ของ spec เดิมเป็น `boolean` ทั้ง widget → เปลี่ยนเป็น `submittingUnitId`
เพื่อให้ disable เฉพาะการ์ดของคนที่กำลังยิง API ไม่ใช่ freeze ทั้งแผนที่

---

## 4. API — ใช้ของจริงทั้งหมด (ไม่มี endpoint ใหม่)

### 4.1 อ่านข้อมูล

| ต้องการ | Hook | REST url | หมายเหตุ |
|---|---|---|---|
| ตำแหน่งเจ้าหน้าที่ | `useGetUnitQuery({ caseId })` | `GET /dispatch/{caseId}/units` | `useStaffPositions` ใช้อยู่แล้ว |
| รายชื่อที่สั่งการไปแล้ว | `useGetCaseSopQuery({ caseId })` → `data.data.unitLists` | `GET /dispatch/{caseId}/SOP` | `CaseDetailView:293` มีอยู่แล้ว |

**แหล่งความจริงว่า "สั่งการไปแล้วหรือยัง"** คือ `sopData.data.unitLists: CaseSopUnit[]`
ตรรกะเดียวกับที่ `AssignOfficerModel.tsx:203` ใช้กรอง `availableOfficers`

```ts
// CaseDetailView.tsx
const assignedUnitIds = useMemo(
  () => new Set((sopData?.data?.unitLists ?? []).map(u => u.unitId)),
  [sopData?.data?.unitLists]
);
```

### 4.2 สั่งการ (Assign) — 1 คน/ครั้ง

`POST /dispatch/event` ผ่าน `usePostDispacthMutationMutation()`
payload คือ `dispatchInterface` — **ลอกจาก `handleDispatch` ที่ `CaseDetailView.tsx:899` แบบตรง ๆ**

```ts
const dispatchJson: dispatchInterface = {
  caseId:   initialCaseData!.caseId,
  unitId:   marker.unitId,
  unitUser: marker.username,
  nodeId:   sopData?.data?.dispatchStage?.nodeId,
  status:   sopData?.data?.dispatchStage?.data?.data?.config?.action,
};
// guard เดิม: ต้องมีครบทั้ง 4 ไม่งั้น throw
```

> ⚠️ `nodeId` และ `status` **ต้องดึงจาก `dispatchStage` ของ SOP เท่านั้น** ห้าม hardcode
> นี่คือเหตุผลที่ business logic ต้องอยู่ที่ `CaseDetailView` ไม่ใช่ในชั้นแผนที่

หลังสำเร็จ ทำตาม `handleDispatch` เดิมทุกขั้น: `dispatchUpdateLocate()` → `setCaseState({status})` → `refetch()`

### 4.3 ยกเลิกการสั่งการ (Cancel) — 1 คน/ครั้ง

`POST /dispatch/cancel/unit` ผ่าน `usePostCancelUnitMutationMutation()`
payload คือ `CancelUnit` — **ลอกจาก `handleConfirmCancelUnit` ที่ `CaseDetailView.tsx:455`**

```ts
const cancelUnitJson = {
  caseId:   caseState?.workOrderNummber,
  unitId:   marker.unitId,
  unitUser: marker.username,
} as CancelUnit;
```

> ⚠️ `CancelUnit` ประกาศ `resId` / `resDetail` เป็น required แต่โค้ดเดิม **ไม่ส่ง** (คอมเมนต์ทิ้งไว้แล้ว cast ทับ)
> ให้ **ส่งเหมือนเดิมเป๊ะ ๆ** ห้ามคิดค่า `resId` ขึ้นเอง — ฟิลด์นี้มาจาก `closeCaseOption` ซึ่งเป็นเหตุผลปิดเคส
> คนละความหมายกับ "เหตุผลถอนเจ้าหน้าที่" ถ้า BFF บังคับ ต้องคุยกับทีม BFF ก่อน ไม่ใช่เดาในหน้าบ้าน
> (`reason: "Reassigned / Cancelled by dispatcher"` ใน spec เดิมจึงถูกตัดออก)

### 4.4 GraphQL — ไม่ต้องแก้อะไร

`GQL_DISPATCH` (`graphql/dispatchQueries.ts`) ครอบคลุมครบแล้ว:

```
"/dispatch/:id/units"  → GetUnitDispatch
"/dispatch/event"      → Event         (mutation)
"/dispatch/cancel/unit"→ CancelUnit    (mutation)
"/dispatch/:id/SOP"    → SOPCase
```

ทุก url ที่ฟีเจอร์นี้เรียกมี entry ครบ จึงปลอดภัยเมื่อ `VITE_USE_GRAPHQL=true`
**ถ้าเพิ่ม endpoint ใหม่ในอนาคต ต้องเพิ่ม entry ที่นี่ด้วยเสมอ** เพราะไม่มี REST fallback

### 4.5 ช่องโหว่ที่ต้องปิด: cache invalidation

`getUnit` และ `getCaseSop` ประกาศ `providesTags: ["Dispatch"]` แต่ **`postDispacthMutation` /
`postCancelUnitMutation` ไม่มี `invalidatesTags`** ทั้งคู่ ทำให้ทุกที่ต้อง `refetch()` เอง

```ts
// dispatch.ts
postDispacthMutation: builder.mutation<ApiResponse<null>, dispatchInterface>({
  query: (params) => ({ url: `/dispatch/event`, method: "POST", body: params }),
  invalidatesTags: ["Dispatch"],          // ← เพิ่ม
}),
postCancelUnitMutation: builder.mutation<ApiResponse<null>, CancelUnit>({
  query: (params) => ({ url: `/dispatch/cancel/unit`, method: "POST", body: params }),
  invalidatesTags: ["Dispatch"],          // ← เพิ่ม
}),
```

> **ผลกระทบ:** flow เดิม (modal, AssignedOfficers) จะ refetch เพิ่มอีกรอบเพราะเรียก `refetch()` เองอยู่แล้ว
> ถือว่ายอมรับได้ (โหลดซ้ำ ไม่ผิดพลาด) แต่ต้องทดสอบว่าไม่เกิด refetch loop ก่อน merge
> ถ้าไม่อยากเสี่ยง ทางเลือกสำรอง: ไม่แตะ `dispatch.ts` แล้วให้ `CaseDetailView` เรียก
> `triggerRefetchUnit()` หลัง mutation แทน (ปลอดภัยกว่า แต่ hook เดิมไม่ได้ประโยชน์)

---

## 5. ความสดของข้อมูล: WebSocket เป็นหลัก + Polling 10 วินาที

### 5.1 WebSocket (ทางหลัก)

โครงมีอยู่แล้วใน `useStaffPositions.ts` แค่ปิดธงไว้:

```ts
const STAFF_WS_ENABLED: boolean = false;      // ← เปิดเมื่อ BFF ส่ง event
const STAFF_WS_EVENT = "UNIT-LOCATION-UPDATE";
```

**ห้ามเปิดธงนี้จนกว่า BFF จะยืนยันว่าส่ง event จริง** เปิดตอนนี้จะทำให้ `source` แสดง
"WebSocket (live)" ทั้งที่ไม่มีข้อมูลเข้ามา = โกหกผู้ใช้

เพิ่มการฟัง event เกี่ยวกับการสั่งการ (ไม่ใช่แค่ตำแหน่ง) เพื่อกัน dispatcher ชนกัน:
`CaseDetailView` ฟัง `CASE-UPDATE` / `CASE-STATUS-UPDATE` อยู่แล้ว (`:320`) และเรียก `refetch()`
ซึ่งอัปเดต `unitLists` → ปุ่มบน panel สลับสถานะเองอัตโนมัติ **ไม่ต้องเขียนอะไรเพิ่ม**

### 5.2 Polling (fallback)

```ts
// useStaffPositions.ts
const shouldPoll = enabled && !!caseId && !(STAFF_WS_ENABLED && isConnected);

const { data, isFetching, isError, refetch } = useGetUnitQuery(
  { caseId },
  {
    skip: !enabled || !caseId,
    pollingInterval: shouldPoll ? STAFF_REFRESH_COOLDOWN_MS : 0,   // 10_000
  }
);
```

เงื่อนไข 3 ชั้น เรียงตามความสำคัญ:

1. **ไม่เปิด layer = ไม่ poll** — คงเจตนาเดิม *"an operator who never opens the layer should not pay for it"*
2. **WebSocket ต่อติด = ไม่ poll** — ไม่ยิงซ้ำสิ่งที่ socket ส่งมาให้แล้ว
3. **ใช้ค่าคงที่ตัวเดียวกับ cooldown (10 วิ)** — ถ้า poll ถี่กว่า cooldown ปุ่ม refresh จะถูก
   `useEffect` ที่ผูกกับ `isFetching` (`:76`) รีเซ็ตนับใหม่ตลอดจนกดไม่ได้เลย ผู้ใช้จะเห็นเป็นปุ่มพัง
   **นี่คือเหตุผลตรง ๆ ที่ 5 วินาทีของ spec เดิมใช้ไม่ได้**

> เพิ่มคอมเมนต์ในโค้ดว่าทำไม `pollingInterval` ต้อง `>=` `STAFF_REFRESH_COOLDOWN_MS` ไม่งั้นคนแก้ทีหลังจะลดค่าลงแล้วพังเงียบ ๆ

### 5.3 ป้ายบอกที่มาของข้อมูล

`useStaffPositions` คืน `source: "graphql" | "websocket"` และ `StaffDetailPanel` แสดงอยู่แล้ว
(`map_staff_source_graphql` / `map_staff_source_websocket`) — ไม่ต้องแก้

---

## 6. UI

> ดูของจริงได้ที่ `docs/mockup-staff-map-assign.html` (สลับสถานะ / ขนาดแผนที่ / Accordion vs Tabs ได้)

### 6.0 โครงการ์ด — 3 โซนแยกหน้าที่กัน

```
┌─────────────────────────────┐
│ (สช) สมชาย ใจดี         [X] │  โซน 1: ตัวตน        (ไม่เลื่อน)
│      ● พร้อมปฏิบัติงาน       │
├─────────────────────────────┤
│ [ ➕ สั่งการเข้าเคสนี้      ] │  โซน 2: ปุ่มหลัก     (ไม่เลื่อน) ★ ใหม่
├─────────────────────────────┤
│ 📍 พิกัด 13.736717, ...      │  โซน 3: รายละเอียด   (เลื่อนได้)
│ ▼ 📋 เคสที่รับผิดชอบ    (3) │
│ ▶ 👤 ข้อมูลส่วนตัว          │
│ ▼ ➕ สั่งการเคสนี้           │
│ ▶ 🛣 เส้นทาง                │
│ ▶ 🧭 การติดตาม              │
└─────────────────────────────┘
```

**โซน 2 คือหัวใจของการทำให้ปุ่มเด่นขึ้น** — เป็นแถบปุ่มติดหัวการ์ด อยู่นอกพื้นที่ scroll
จึงมองเห็นและกดได้เสมอไม่ว่าผู้ใช้จะเปิดหัวข้อไหนหรือเลื่อนไปไกลแค่ไหน
ปุ่มเดียวกันนี้ **ยังคงมีอยู่ใน section ด้วย** พร้อมคำอธิบายบริบท (ขั้นตอน SOP ที่จะถูกใช้)
รองรับผู้ใช้ 2 แบบตามที่ระบุ: คนรีบกดที่หัวการ์ด คนอยากอ่านก่อนกดในหัวข้อ

ทั้งสองปุ่มเรียก handler ตัวเดียวกันและเปิด `ConfirmationModal` ตัวเดียวกัน
สถานะ `disabled` / spinner ผูกกับ `submittingUnitId` ร่วมกัน จึงไม่มีทางไม่ตรงกัน

| สถานะ | ปุ่มบนแถบ | สี |
|---|---|---|
| ยังไม่สั่งการ | `➕ สั่งการเข้าเคสนี้` | ทึบน้ำเงิน + เงา |
| สั่งการแล้ว | `➖ ถอนออกจากเคสนี้` | ขอบแดง พื้นขาว |
| SOP ไม่อนุญาต | disabled + ข้อความสีเหลืองใต้ปุ่มบอกเหตุผล | จาง |
| กำลังยิง API | spinner + "กำลังส่งคำสั่ง..." | disabled |

### 6.1 เขียน `render` ของ 3 section ใน `staffPanelSections.tsx`

Registry มี 6 section รอไว้แล้ว ทั้งหมด `status: "in-development"` งานคือเติม `render` แล้วพลิกเป็น `"available"`

| section id | ทำในเฟสนี้ | เนื้อหา |
|---|---|---|
| `assigned-case` | ✅ | รายการเคสทั้งหมดที่คนนี้ถืออยู่ + ไฮไลต์เคสปัจจุบัน (§6.2) |
| `assign` | ✅ | คำอธิบาย SOP + ปุ่มสั่งการ — แสดงเมื่อ **ยัง**ไม่อยู่ใน `unitLists` |
| `cancel-assign` | ✅ | คำอธิบายผลลัพธ์ + ปุ่มยกเลิก — แสดงเมื่ออยู่ใน `unitLists` แล้ว |
| `personal-info` | ❌ | คงเดิม |
| `routing` | ❌ | คงเดิม |
| `tracking` | ❌ | คงเดิม |

### 6.2 Section "เคสที่รับผิดชอบ" — ไฮไลต์เคสปัจจุบัน

```
┌──────────────────────────────┐
│▌CS-2026-0814 [เคสนี้] SLA 42น│ ← ขอบซ้ายน้ำเงิน 3px + พื้นฟ้าอ่อน
│ กำลังเดินทาง · สั่งการ 12 นาที│
└──────────────────────────────┘
  เคสอื่นที่ถืออยู่ (2)
┌──────────────────────────────┐
│ CS-2026-0799                 │ ← จาง (opacity .72) ไม่มีขอบสี
│ กำลังดำเนินการ · ระบบไฟฟ้า...│
└──────────────────────────────┘
```

การแยกความเด่นใช้ 4 สัญญาณพร้อมกัน ไม่พึ่งสีอย่างเดียว (เผื่อผู้ใช้ตาบอดสี):

1. **ขอบซ้ายหนา 3px สีน้ำเงิน** — เด่นแม้มองเร็ว ๆ
2. **พื้นหลังฟ้าอ่อน** (`#eff6ff` / dark: `rgba(59,130,246,.13)`)
3. **badge "เคสนี้"** — ข้อความชัดเจน ไม่ต้องตีความ
4. **แยกกลุ่ม** — เคสปัจจุบันอยู่บนสุดเสมอ คั่นด้วยหัวข้อ "เคสอื่นที่ถืออยู่ (n)"

เมื่อ **ยังไม่ได้สั่งการ** เคสปัจจุบันยังแสดงอยู่ (ตำแหน่งเดิม) แต่เปลี่ยนเป็น
**ขอบซ้ายเส้นประ + พื้นหลังปกติ + badge เทา** พร้อมข้อความ "ยังไม่ได้สั่งการเจ้าหน้าที่คนนี้"
เพื่อให้เห็นความต่างระหว่าง "เคสที่กำลังดูอยู่" กับ "เคสที่รับผิดชอบจริง" ในที่เดียว

> **ที่มาข้อมูล:** เคสปัจจุบันมาจาก `sopData.data.unitLists` ที่โหลดอยู่แล้ว
> ส่วน **เคสอื่น** ยังไม่มี endpoint ที่คืน "เคสทั้งหมดของ unit หนึ่ง" — ดูข้อ §9.1

### 6.3 Accordion หรือ Tabs — ข้อสรุป: **Accordion แบบปรับตามความสูง**

ทดลองเทียบได้ในไฟล์ mockup (ปุ่ม "โหมด") เหตุผลที่เลือก Accordion:

**1. ความกว้างไม่พอสำหรับแท็บ** — การ์ดกว้าง 288px (`w-72`) มี 5–6 หัวข้อ
เฉลี่ยแท็บละ ~48px ซึ่งใส่ได้แค่ไอคอน ถ้าใส่ label ภาษาไทยจะล้นจนต้องเลื่อนแนวนอน
หัวข้อท้าย ๆ จะมองไม่เห็นจนกว่าจะเลื่อน — แย่กว่า accordion ที่เห็นครบทุกหัวข้อในหน้าเดียว

**2. จำนวนแท็บไม่คงที่** — `assign` กับ `cancel-assign` สลับกันตามสถานะ
tab bar ที่จำนวนแท็บเปลี่ยนหลังกดปุ่ม จะทำให้แท็บอื่นขยับตำแหน่ง = เสี่ยงกดผิด
ในงาน dispatch ที่ต้องเร็ว accordion ยุบ/กางในที่เดิมจึงปลอดภัยกว่า

**3. แท็บบังคับให้มีเนื้อหาเปิดค้างเสมอ** — กินความสูงคงที่
บนแผนที่ default `height={320}` panel เหลือพื้นที่ ~240px (`max-h-[calc(100%-5rem)]`)
accordion ที่ยุบหมดใช้แค่ ~32px/แถว × 6 = 192px ยังพอเห็นครบ แต่ tab pane จะเหลือที่ให้เนื้อหาแทบไม่พอ

**4. 3 ใน 6 หัวข้อยังเป็น "กำลังพัฒนา"** — accordion แสดง badge เตือนที่หัวแถวก่อนกด
ส่วนแท็บต้องกดเข้าไปถึงจะรู้ว่าว่างเปล่า

**5. ไม่ต้องรื้อของเดิม** — `StaffDetailPanel` เป็น accordion อยู่แล้ว เปลี่ยนเป็นแท็บคือเขียนใหม่ทั้ง component

#### พฤติกรรมที่ปรับตามความสูง

| ขนาดแผนที่ | พื้นที่ panel | พฤติกรรม |
|---|---|---|
| `height={320}` (ค่าเริ่มต้นใน `CaseDisplay`) | ~240px | เปิดได้ **ทีละ 1 หัวข้อ** (`openSectionId` เดิม) — ที่เหลือยุบ ผู้ใช้เห็นสารบัญครบโดยไม่ต้องเลื่อน |
| แผนที่ขยาย / เต็มจอ | ~500px+ | กาง `assigned-case` **ค้างไว้เสมอ** + เปิดหัวข้ออื่นเพิ่มได้อีก 1 พร้อมกัน — เห็นภาระงานกับปุ่มสั่งการในสายตาเดียว |

วัดด้วย `ResizeObserver` บน element ของ panel (ไม่ใช่ media query — เพราะแผนที่ขยายคือ
container โตขึ้น ไม่ใช่ viewport เปลี่ยน) เกณฑ์ที่แนะนำ: `>= 420px` ถือว่าสูงพอ

```ts
// StaffDetailPanel.tsx
const [isTall, setIsTall] = useState(false);
// ResizeObserver → setIsTall(height >= STAFF_PANEL_TALL_PX)   // 420
const isSectionOpen = (id: string) =>
  isTall ? (id === openSectionId || id === "assigned-case") : id === openSectionId;
```

> **หมายเหตุการทำงาน:** `ArcgisAddressMapField` สร้าง `MapView` ตัวที่สองตอน expand
> panel จึงถูก mount ใหม่ — `isTall` จะคำนวณใหม่เองโดยอัตโนมัติ ไม่ต้องซิงก์ state ข้าม view

### ขยาย signature ของ `render`

```ts
export interface StaffSectionContext {
  isAssigned: boolean;
  canAssign: boolean;          // sopData.data.dispatchStage?.data ? true : false
  canCancel: boolean;          // canCancelUnit จาก CaseDetailView:307
  isSubmitting: boolean;       // submittingUnitId === marker.unitId
  onRequestAssign: () => void; // เปิด confirm
  onRequestCancel: () => void;
}

export interface StaffPanelSection {
  // ...เดิม
  render?: (marker: StaffMarker, ctx: StaffSectionContext) => ReactNode;
  /** section นี้ควรโผล่ไหมสำหรับ marker/ctx นี้ ถ้าไม่ระบุ = โผล่เสมอ */
  isVisible?: (marker: StaffMarker, ctx: StaffSectionContext) => boolean;
}
```

`isVisible` ทำให้ section `assign` กับ `cancel-assign` สลับกันโดยไม่ต้องยัด `if` เข้าไปใน `StaffDetailPanel`
คงเจตนาเดิมของไฟล์ที่ว่า *"no changes to the panel itself"*

### เงื่อนไขปุ่ม (เรียงลำดับการตัดสิน)

```
ไม่มีสิทธิ์ case.assign     → ไม่แสดง section เลย (PermissionGate ครอบ layer อยู่แล้ว)
กำลังยิง API               → ปุ่ม disabled + spinner
canAssign / canCancel = false → ปุ่ม disabled + tooltip อธิบายว่าสถานะ SOP ไม่อนุญาต
นอกนั้น                    → ปุ่มกดได้
```

### Confirm dialog

ทั้ง assign และ cancel ต้องผ่านหน้ายืนยัน ใช้ `ConfirmationModal` ตัวเดียวกับที่
`CaseDetailView` ใช้อยู่ (`:1166`) — เรนเดอร์ที่ `CaseDetailView` **ไม่ใช่ในแผนที่**
เพื่อไม่ให้ modal ถูก clip ด้วย `overflow-hidden` ของ map container และไม่ชนกับ dialog stack เดิม

`CaseStaffMapField` แค่เรียก `onAssign(marker)` / `onCancel(marker)` ขึ้นไป แล้ว `CaseDetailView` เป็นคนเปิด modal

---

## 7. Permission และ i18n

### Permission

`STAFF_LAYER_PERMISSION = "case.assign"` ครอบ layer ทั้งก้อนอยู่แล้ว (`CaseStaffMapField.tsx:32`)
ปุ่มสั่งการอยู่ใน layer นั้นจึงถูกครอบโดยอัตโนมัติ **ไม่ต้องเพิ่ม PermissionGate ซ้อน**

### i18n

คีย์ section 6 ตัว + คำอธิบาย มีครบทั้ง `en` / `th` / `cn` แล้ว (27 คีย์ต่อไฟล์) ที่ต้องเพิ่มคือ:

```
case.display.map_staff_assign_button
case.display.map_staff_assign_confirm_title
case.display.map_staff_assign_confirm_message
case.display.map_staff_cancel_button
case.display.map_staff_cancel_confirm_title
case.display.map_staff_cancel_confirm_message
case.display.map_staff_badge_assigned
case.display.map_staff_badge_unassigned
case.display.map_staff_action_blocked        // tooltip ตอน canAssign/canCancel = false
```

toast ใช้ของเดิมที่มีอยู่แล้ว: `case.display.toast.dispatch_success`,
`case.display.toast.cancel_unit_success`, `case.display.toast.cancel_unit_fail`

> ต้องเพิ่มครบทั้ง 3 ไฟล์ใน `public/i18n/` — catalog loader ไม่มี fallback ข้ามภาษา

---

## 8. Error handling และ optimistic update

### ไม่ทำ optimistic update เต็มรูปแบบ

spec เดิมเสนอ optimistic แล้ว rollback เมื่อ error — **ไม่แนะนำสำหรับ assign**
เพราะความจริงของ "สั่งการแล้ว" ไม่ได้อยู่ที่ frontend แต่มาจาก SOP workflow ฝั่ง BFF
(`dispatchStage` → `nextStage`) การพลิก UI ล่วงหน้าอาจแสดง stage ที่ผิด แล้ว `unitLists`
ที่ refetch กลับมาไม่ตรง = ผู้ใช้เห็นสถานะกระพริบสลับไปมา ซึ่งแย่กว่ารอ spinner 1 วินาที

**ใช้แทน:** disable ปุ่ม + spinner ระหว่างยิง → toast → refetch → UI อัปเดตจากข้อมูลจริง
(รูปแบบเดียวกับที่ `handleDispatch` / `handleConfirmCancelUnit` ทำอยู่แล้ว)

### เมื่อ error

1. `payload.msg?.toLowerCase() !== "success"` ก็ถือว่า fail — BFF คืน HTTP 200 พร้อม msg error ได้ (ตรรกะเดิม)
2. toast error พร้อม message
3. ปลด `submittingUnitId` เสมอใน `finally`
4. **ห้าม** ปิด `StaffDetailPanel` ทิ้ง — ผู้ใช้ต้องกดซ้ำได้ทันที

### กรณีขอบที่ต้องรองรับ

| กรณี | พฤติกรรม |
|---|---|
| dispatcher อีกคนสั่งการคนเดียวกันไปก่อน | WS `CASE-UPDATE` → refetch → ปุ่มเปลี่ยนเป็น "ยกเลิก" เอง; ถ้ากดชน BFF ปฏิเสธ → toast |
| เจ้าหน้าที่หลุดจาก `/dispatch/units` ระหว่างเปิด panel | `selectedMarker` เป็น `null` → panel ปิดเอง (มีอยู่แล้ว `CaseStaffMapField:65`) |
| เจ้าหน้าที่ไม่มีพิกัด (0/0) | ไม่มีหมุดให้คลิก → ต้องใช้ modal เดิม; นับรวมใน `map_staff_unmappable` แล้ว |
| ตำแหน่งเก่าเกิน 5 นาที | หมุดจาง + ป้าย "Outdated" (มีอยู่แล้ว `STAFF_STALE_THRESHOLD_MS`) — **ยังสั่งการได้** ไม่บล็อก |
| SOP ยังไม่มี `dispatchStage` | `canAssign = false` → ปุ่ม disabled + tooltip |

---

## 9. นอกขอบเขตเฟสนี้ / ต้องคุยกับ BFF

### 9.1 ⚠️ "เคสอื่นที่เจ้าหน้าที่คนนี้ถืออยู่" — ยังไม่มี endpoint

Section `assigned-case` ใน §6.2 ต้องการรายการเคสทั้งหมดของ unit หนึ่ง แต่ endpoint ที่มีทั้งหมด
เป็นแบบ **per-case** (`/dispatch/{caseId}/units`, `/dispatch/{caseId}/SOP/unit/{unitId}`)
ไม่มีตัวไหนคืน "unit นี้ถือเคสอะไรอยู่บ้าง" — ต้องขอ BFF เพิ่ม เช่น

```
GET /dispatch/unit/{unitId}/cases   → { caseId, statusId, caseTypeId, slaDeadline, createdAt }[]
```

**ทางเลือกจนกว่าจะมี endpoint** (เรียงตามความแนะนำ):

1. **ปล่อยแค่เคสปัจจุบันไปก่อน** — render เฉพาะแถวเคสนี้ ส่วน "เคสอื่น" แสดงข้อความ
   "อยู่ระหว่างพัฒนา" ใต้รายการ · ปลอดภัยที่สุด และเป็นรูปแบบที่ registry เดิมใช้อยู่แล้ว
2. รอ endpoint แล้วค่อยเปิด — เลื่อน `assigned-case` ทั้ง section เป็นเฟส 2
3. ❌ **ห้าม** ดึงเคสทั้งหมดมา filter ฝั่ง frontend — ค่าใช้จ่ายสูงและได้ข้อมูลไม่ครบตามสิทธิ์ผู้ใช้

> Mockup แสดงรายการเคสอื่นไว้เพื่อให้เห็นภาพ UI เต็มรูปแบบ — ตอน implement ต้องยึดข้อ 1
> จนกว่า BFF จะพร้อม

### 9.2 อื่น ๆ

- **`geometryEngine` buffer 5 กม.** — เมื่อเลือกเจ้าหน้าที่จากหมุดโดยตรงแล้ว ไม่มี list ให้กรอง
  ถ้าจะทำ ควรทำเป็น section `routing` (มี slot รออยู่) และใช้ **กิโลเมตร** ไม่ใช่ไมล์
- **เส้นประจากเคสไปหาเจ้าหน้าที่** — รวมอยู่ใน `routing` เช่นกัน
- **สั่งการหลายคนพร้อมกัน** — ใช้ `AssignOfficerModel` เดิม ซึ่ง loop ทีละคนอยู่แล้ว (`:928`)
- **เปิด `STAFF_WS_ENABLED`** — รอ BFF ส่ง `UNIT-LOCATION-UPDATE`

---

## 10. ลำดับงานและการตรวจสอบ

1. `dispatch.ts` — เพิ่ม `invalidatesTags` (แก้ก่อน จะได้เห็นผลกระทบต่อ flow เดิมเร็ว)
2. `useStaffPositions.ts` — เพิ่ม `pollingInterval` + คอมเมนต์ข้อจำกัด 10 วิ
3. `staffPanelSections.tsx` — ขยาย `render` signature + `isVisible`
4. `StaffDetailPanel.tsx` — ส่ง `ctx` เข้า `render`, เคารพ `isVisible`
5. `CaseStaffMapField.tsx` — รับ prop ใหม่, ถือ `submittingUnitId`, ส่งขึ้น
6. `CaseDisplay.tsx` — ขยาย type `staffOverlay`
7. `CaseDetailView.tsx` — ประกอบ `staffOverlay`, ต่อ `ConfirmationModal`, reuse `handleDispatch` เดิม
8. i18n ทั้ง 3 ไฟล์
9. เขียน `render` ของ 3 section

### Verification

รีโปนี้ **ไม่มี test runner** (ไม่มี `test` script, ไม่มีไฟล์เทสต์ใน `src`) จึงต้อง:

- `pnpm lint` และ `pnpm build` (`tsc -b`) — `noUnusedLocals` / `noUnusedParameters` เปิดอยู่
  ตัวแปรที่เผลอทิ้งไว้จะทำให้ **build พัง** ไม่ใช่แค่ warning
- ทดสอบมือทั้ง 2 โหมด: `VITE_USE_GRAPHQL=true` และ `false`
- ทดสอบ dark mode (ทุก component ในโฟลเดอร์นี้รองรับอยู่แล้ว)
- ทดสอบเปิด map แบบ expanded (`ArcgisAddressMapField` สร้าง `MapView` ตัวที่สอง — เป็นเหตุผลที่ state
  ต้องอยู่เหนือมัน ตามคอมเมนต์ที่หัวไฟล์ `CaseStaffMapField.tsx`)
- ทดสอบสองแท็บพร้อมกันบนเคสเดียวกัน เพื่อดูว่า refetch/WS ทำให้ปุ่มสลับสถานะถูกต้อง
