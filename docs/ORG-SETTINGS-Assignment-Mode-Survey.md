# Organization Settings — Assignment Contract Plan (`assignmentMode` + contract ล่าสุด)

สถานะ: **ก้อนที่ 1 + ก้อนที่ 2 เสร็จและตรวจรับแล้ว — เหลือ smoke test กับ staging**
ที่มา: `src/core/mocks/organizationSettings.sh` (`CreateConfigProperty`, `propKey = "org.config.properties"`) รอบล่าสุด 2026-11-19
เอกสารที่เกี่ยวข้อง: `docs/ORG-SETTINGS-Config-Property-Plan.md` · `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md` (D1–D19, §11–§17 ลงมือแล้ว)

> ชื่อไฟล์ยังเป็น `...Survey` ตามที่ถูกอ้างถึงจากเอกสารอื่น — เนื้อหาอัปเดตเป็น **แผนที่ decision ครบแล้ว**

---

## 1. payload เปลี่ยนอะไร (เทียบ 3 รอบ)

| ส่วน | 2026-11-18 | 2026-11-19 รอบ 1 | **2026-11-19 รอบ 2 (ล่าสุด)** |
| --- | --- | --- | --- |
| `mapSettings.*` | ครบ | เท่าเดิม | **เท่าเดิม** |
| `assignmentMode[]` | — | เพิ่มใหม่ (4 entry: `pic` / `assignment`) | **เท่าเดิม** |
| `assignmentRules.mode` | `"automatic"` | `"automatic"` | **ถูกลบออก** |
| `routingModes` | 8 key | เท่าเดิม | **เหลือ 5**: `skillBased`, `availability`, `areaBased`, **`unitProperty`** (ใหม่), `combineWithAnd` |
| `allocationMethod` / `advancedOptions` | มี | เท่าเดิม | **เท่าเดิม** |

**หายไป:** `locationBased` · `department` · `caseType` · `caseTypeSubTypes` (จาก `routingModes`) และ `mode` (จาก `assignmentRules`)
**เพิ่มมา:** `unitProperty` (boolean) — มีข้อมูลรองรับจริง `GET /mdm/units/properties/{unitId}` (`src/cms/store/api/unitApi.ts:77-86`) + type `UnitProperty` (`src/cms/types/unit.ts:262`)

---

## 2. ผลกระทบต่อโค้ดปัจจุบัน (ตรวจแล้ว 2026-11-19)

| # | สภาพปัจจุบัน | ผล |
| --- | --- | --- |
| 1 | `OrgAssignmentRuleSettings.mode` เป็น **required** default `"manual"` | payload ใหม่ไม่มี `mode` → decode เติม `"manual"` ⇒ หน้าจอแสดง "Manual" ทั้งที่ org ไม่ได้ตั้งค่า |
| 2 | `ROUTING_CRITERIA_KEYS` (`orgAssignmentRules.ts:110-117`) มี 6 ตัว รวม 3 ตัวที่ถูกลบ | validator (`validateOrgAssignmentRules:138`) ยังนับ criterion ที่ไม่มีใน contract |
| 3 | `SmartRoutingSettings` `MODE_OPTIONS` 6 checkbox | โชว์ 3 ตัวที่ตายแล้ว และ **ไม่มี `unitProperty`** |
| 4 | UI มี toggle Automatic/Manual + MultiSelect `caseTypeSubTypes` | ทั้งคู่ไม่มีที่เขียนแล้ว |
| 5 | **encode merge typed ทับ raw** (`orgConfigProperties.ts`) | ⚠️ **ทุก Save เขียน `mode` + `locationBased` + `department` + `caseType` + `caseTypeSubTypes` กลับเข้า document** — drift ที่เกิดจริงทุกครั้ง (ส่วน `unitProperty` รอด เพราะ merge ไม่ลบ key ที่ typed model ไม่รู้จัก) |
| 6 | `isOrgAssignmentRuleSettings` (`core/types/organization.ts:368`) | ไม่มีผู้ใช้แล้ว และบังคับ `mode` ⇒ ยิ่งใช้ไม่ได้กับ contract ใหม่ |

---

## 3. คำตอบที่ล็อกแล้ว (2026-11-19)

| # | คำถาม | **คำตอบ** | ผลต่อการออกแบบ |
| --- | --- | --- | --- |
| **U1** | `pic` vs `assignment` | **`pic` = ขั้นกำหนดผู้รับผิดชอบ (PIC) · `assignment` = ขั้นมอบหมายเคส** | ตาราง UI ต้องมี **2 คอลัมน์** ต่อ sub-type (คนละขั้น ไม่ใช่ค่าเดียวกันคนละมุม) |
| **U2** | `assignmentMode` override `assignmentRules.mode`? | **แทนที่** (mode ระดับ org ถูกลบจาก contract) | ไม่มี org-wide default ให้ inherit — ค่าเริ่มต้นของ sub-type ที่ไม่มีใน array คือ "ยังไม่ตั้งค่า" (§5) |
| **U3** | `auto` = ระบบจัดอัตโนมัติจริงไหม | **ใช่** | ต้องมี note **D18** ("ยังไม่เปิดใช้งาน (รอ engine)") — ไม่ disable ไม่ซ่อน |
| **U5** | inconsistency `caseType` vs `caseTypeSubTypes` | **หมดปัญหา** (ทั้งคู่ถูกถอด) | — |
| **U6** | 3 criterion ที่หายไป | **เลิกใช้** แต่ให้ **บันทึกไว้ในเอกสาร + comment ในโค้ด** เผื่อกลับมา | ต้องมี comment ที่ type + บันทึกในเอกสาร (ไม่ลบประวัติ) |
| **U7** | `unitProperty` | **เป็น boolean ไปก่อน** | 1 checkbox ไม่ต้องมีรายการ property |
| **U8** | `advancedOptions.auto*` / `manual*` | **ยังเป็น org-level** | ไม่ย้ายเข้า `assignmentMode` — คงอยู่ที่การ์ด Advanced |

---

## 4. โครงสร้าง UI ที่ล็อก (ทางเลือก A + U1)

**แทนที่** toggle Automatic/Manual และ MultiSelect `caseTypeSubTypes` ใน `SmartRoutingSettings` ด้วยตาราง:

```text
Assignment Mode by Case Sub-Type
┌──────────────────────────────┬──────────────────┬───────────────────────┐
│ Case sub-type                │ PIC              │ Case assignment       │
├──────────────────────────────┼──────────────────┼───────────────────────┤
│ 101-Fire-Alarm               │ [Auto ▾]         │ [Manual ▾]            │
│ 102-Flood-Water level        │ [Not set ▾]      │ [Auto ▾]              │
└──────────────────────────────┴──────────────────┴───────────────────────┘
  ⓘ ยังไม่เปิดใช้งาน (รอ engine)          ← note ตาม D18 / U3
```

- แถว = case sub-type ทั้งหมดจาก `useGetCaseTypesSubTypesQuery` + `formatCaseTypeSubTypeLabel` (`SmartRoutingSettings.tsx:55,80`) — ตัวที่มี label ภาษา 3 ภาษาแล้ว
- แต่ละช่องมี 3 สถานะ: **Auto / Manual / Not set** → `Not set` = ไม่เขียน entry สำหรับ sub-type นั้นใน `type` นั้น
  - เหตุผล: U2 บอกว่าไม่มี org default ให้ inherit ⇒ "ไม่ตั้งค่า" ต้องแสดงได้ ไม่ใช่บังคับเลือก
  - **runtime behavior ของ "Not set" เป็นเรื่อง backend** — FE แค่ไม่เขียน entry (บันทึกในเอกสาร ห้ามเดา)
- `routingModes` ยังเป็นการ์ดด้านบนของ section เดิม (5 checkbox: skillBased, availability, areaBased, unitProperty, combineWithAnd)
- `advancedOptions` คงเป็นการ์ด Advanced แบบ org-level (U8)
- `allocationMethod` คงเดิม

---

## 5. ร่างงาน — 2 ก้อนที่แยกกันได้

### ก้อนที่ 1 — Contract alignment (ทำก่อน, ไม่ต้องรออะไรแล้ว)

| ขั้น | ไฟล์ | สิ่งที่ทำ |
| --- | --- | --- |
| 1.1 | `core/types/organization.ts` | `RoutingModes`: ลบ `locationBased`/`department`/`caseType`/`caseTypeSubTypes`, เพิ่ม `unitProperty: boolean` · `OrgAssignmentRuleSettings`: ลบ `mode` · **ใส่ comment ระบุ criterion ที่เลิกใช้ + วันที่** (U6) |
| 1.2 | `cms/utils/orgAssignmentRules.ts` | `DEFAULT_ROUTING_MODES` ใหม่ · `ROUTING_CRITERIA_KEYS` = `skillBased`/`availability`/`areaBased`/`unitProperty` · `validateOrgAssignmentRules` เปลี่ยนกติกา (ดู 1.5) |
| 1.3 | `cms/utils/orgMapSettings.ts` ไม่เกี่ยว — ไม่แตะ | — |
| 1.4 | `assignment/SmartRoutingSettings.tsx` | ลบ toggle mode + MultiSelect `caseTypeSubTypes` + 3 checkbox ที่ตายแล้ว · เพิ่ม checkbox `unitProperty` · คง note D18 |
| 1.5 | validation | กติกาเดิม "Automatic + ไม่มี criterion = error" ต้องย้ายไปอิง `assignmentMode`: **ถ้ามี entry ใด `mode:"auto"` และ `hasRoutingCriterion() === false` → error** (เพราะ auto ที่ไม่มีเกณฑ์ = สัญญาว่าจัดอัตโนมัติโดยไม่มีวิธีจัด) — ใช้ copy เดิม `settings.assignment.validation.no_criteria_selected` |
| 1.6 | i18n 3 ไฟล์ | เพิ่ม `settings.assignment.routing.unit_property.{label,desc}` · ลบ/ไม่ใช้ key ของ `location_based`/`department`/`case_type`/`case_type_sub_types` (คง key ไว้ได้แต่ไม่มีใครอ้าง — ต้องเลือกและจดไว้) |
| 1.7 | tests | ปรับ `orgAssignmentRules.test.ts` (7 เคสอิง `mode`) · `OrganizationSettingsManagement.test.tsx` (3 เคสอิง automatic/manual) · เพิ่มเคส `unitProperty` นับเป็น criterion |
| 1.8 | docs | บันทึก criterion ที่เลิกใช้ + เหตุผล ในเอกสารนี้และใน `Runtime-Wiring-Plan` §6 |

### ก้อนที่ 2 — `assignmentMode` (ทำต่อได้ทันทีหลัง U1/U3/U7 ปิดแล้ว)

| ขั้น | ไฟล์ | สิ่งที่ทำ |
| --- | --- | --- |
| 2.1 | `core/types/organization.ts` | เพิ่ม `AssignmentModeToken = "auto" \| "manual"` (**ห้าม reuse `AssignmentMode` ที่เป็น `"automatic"`**) · `AssignmentModeTarget = "pic" \| "assignment"` (comment: pic = ขั้นกำหนดผู้รับผิดชอบ, assignment = ขั้นมอบหมายเคส) · `AssignmentModeEntry { type, mode, caseSubTypes: string[] }` · `OrgConfigPropertiesDoc.assignmentMode: AssignmentModeEntry[]` |
| 2.2 | `cms/utils/orgConfigProperties.ts` | decode tolerant: ไม่มี key → `[]` · entry ที่ `type`/`mode` ไม่รู้จัก → **ไม่ทิ้ง** (คงใน raw, ไม่ render) · `caseSubTypes` ที่ไม่ใช่ string → กรองออก · normalize ไม่ให้ sub-type ซ้ำใน `type` เดียวกัน |
| 2.3 | เช่นเดิม | **กับดัก**: `deepMerge` แทน array ทั้งก้อน ⇒ ตอน Save ต้องสร้าง array ใหม่ให้ครบ **รวม entry ที่ UI ไม่เข้าใจ** ไม่งั้นถูกลบ |
| 2.4 | `assignment/AssignmentModeTable.tsx` (ใหม่) + `AssignmentRulesSection` | ตาราง 2 คอลัมน์ตาม §4 · `onChange` คืน array ครบ · note D18 |
| 2.5 | i18n 3 ไฟล์ | `settings.assignment.mode_table.*` (หัวตาราง 2 คอลัมน์, สถานะ Not set, note) |
| 2.6 | tests | decode/encode (preserve entry ที่ไม่รู้จัก · array ถูกแทนทั้งก้อน · ไม่มี duplicate) · component test ว่าเลือกแล้ว `onChange` ให้ array ครบ |
| 2.7 | `scripts/smoke-org-settings.mjs` | round-trip `assignmentMode` + `unitProperty` + ยืนยันว่า Save ไม่เขียน `mode`/3 criterion ที่เลิกใช้กลับมา |

---

## 6. เกณฑ์ตรวจรับ

| # | ตรวจ | ต้องได้ |
| --- | --- | --- |
| 1 | Save จากหน้า settings แล้วอ่าน `propVal` ดิบ | **ไม่มี** `assignmentRules.mode`, `locationBased`, `department`, `caseType`, `caseTypeSubTypes` กลับมา |
| 2 | เลือก PIC = Auto ของ sub-type หนึ่ง → Save → อ่านกลับ | มี entry `{ type: "pic", mode: "auto", caseSubTypes: [...] }` ตรงตามที่เลือก |
| 3 | ตั้ง `Not set` ทั้ง 2 คอลัมน์ | ไม่มี entry ของ sub-type นั้น (ไม่ใช่ entry ที่ `caseSubTypes: []`) |
| 4 | org ที่มี `assignmentMode` entry ที่ FE ไม่รู้จัก `type` | Save แล้ว entry นั้นยังอยู่ |
| 5 | auto ที่ไม่มี criterion เลย | Save ถูกบล็อก + ข้อความชี้ไปที่ routing criteria |
| 6 | `pnpm build` / `eslint` / `pnpm test` | ผ่านทั้งหมด + build size เปลี่ยนเล็กน้อย (เทียบก่อน/หลัง) |

---

## 7. ความเสี่ยงและบทเรียนที่ใช้

- **array ถูกแทนทั้งก้อน** ใน `deepMerge` → ถ้า rebuild array ไม่ครบ entry ที่ UI ไม่รู้จักจะหาย (field อื่นทั้งหมดที่ทำมาก่อนเป็น object จึงไม่เคยเจอปัญหานี้)
- **token ไม่เหมือนกัน**: `"auto"` (assignmentMode) vs `"automatic"` (ของเดิม) — ถ้า reuse type ผิด ค่าจะถูก validate ไม่ผ่าน
- **ถ้าเพิ่ม subtree ที่เรียก RTK hook ครั้งแรกในหน้า settings** ต้อง mock `@/cms/store/api/serviceApi` ใน shell test (บทเรียน §14.5 ของ `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md`) — ตารางใหม่อาจทำให้เกิดซ้ำ
- **ห้ามเดา runtime semantics ของ "Not set"** — FE แค่ไม่เขียน entry; พฤติกรรมจริงเป็นของ backend (เหมือน `combineWithAnd`/`areaBased` ที่ `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md` §14.3 ระบุว่าไม่ validate)
- **ห้ามลบประวัติ**: criterion ที่เลิกใช้ต้องมี comment + บันทึกในเอกสาร (U6)

---

## 8. ลำดับที่เสนอ

1. **ก้อนที่ 1** (1.1–1.8) — หยุด drift ทันที และทำให้หน้าเดิมตรง contract ก่อน
2. **ก้อนที่ 2** (2.1–2.7) — เพิ่ม `assignmentMode` + ตาราง 2 คอลัมน์ + note D18
3. รัน `scripts/smoke-org-settings.mjs` กับ staging เพื่อยืนยันข้อ §6 ข้อ 1–4

---

## 9. บันทึกการลงมือ — ก้อนที่ 1 (2026-11-19)

### 9.1 ไฟล์ที่แก้

| ไฟล์ | สิ่งที่ทำ |
| --- | --- |
| `core/types/organization.ts` | `RoutingModes` เหลือ 5 key (`skillBased`, `availability`, `areaBased`, `unitProperty`, `combineWithAnd`) + comment ระบุ criterion ที่เลิกใช้พร้อมวันที่ · `OrgAssignmentRuleSettings` ไม่มี `mode` แล้ว · `AssignmentMode` คงไว้เป็น **RETIRED type** พร้อม comment (U6) · guard อัปเดตตาม contract ใหม่ (ไม่บังคับ `mode`, ยอมให้ `areaBased`/`unitProperty` หายได้) |
| `cms/utils/orgAssignmentRules.ts` | `DEFAULT_ROUTING_MODES` ใหม่ · ลบ `mode` ออกจาก default และ merge · `ROUTING_CRITERIA_KEYS` เหลือ 4 · **ลบ `validateOrgAssignmentRules`** (ไม่มี rule ที่ถูกต้องเหลืออยู่) คง `hasRoutingCriterion` ไว้ให้ก้อนที่ 2 ใช้ |
| `assignment/SmartRoutingSettings.tsx` | ลบ toggle Automatic/Manual, MultiSelect `caseTypeSubTypes`, 3 checkbox ที่เลิกใช้ · เพิ่ม `unitProperty` · note D18 ย้ายมาใต้หัวข้อ routing criteria |
| `assignment/AssignmentRulesSection.tsx` | ไม่ส่ง `mode` ต่อ · ยังส่ง `errors` (รอใช้ในก้อนที่ 2) |
| `assignment/AdvancedAssignmentSettings.tsx` | ไม่รับ `mode` — แสดงทั้ง 4 ตัวเลือกพร้อมกัน เพราะไม่มี org mode ให้แบ่งแล้ว |
| `settings/OrganizationSettingsManagement.tsx` | `handleSave` validate เฉพาะครึ่ง map (ไม่มี assignment rule แล้ว) · error → focus แท็บ map |
| `public/i18n/{en,th,cn}.json` | +`settings.assignment.routing.unit_property.{label,desc}` · **คง** key ของ criterion ที่เลิกใช้ไว้เป็นบันทึก (U6) |

### 9.2 พฤติกรรมที่ยืนยันด้วย test

1. Save **ไม่เพิ่ม** `mode` / `locationBased` / `department` / `caseType` / `caseTypeSubTypes` ลงในเอกสารที่ไม่มี key เหล่านั้น
2. key ที่ค้างอยู่ในเอกสารเดิม **ไม่ถูกลบ** — ยังเป็น merge ไม่ใช่ rebuild (มี test กำกับไว้เพื่อไม่ให้อ่านข้อ 1 ผิดว่า "Save ลบให้")
3. `unitProperty` ถูกเขียนลงเอกสารจริง (ค่าเริ่มต้น `false`)

### 9.3 สิ่งที่ตั้งใจไม่ทำ

- ไม่ลบ type `AssignmentMode` — เก็บเป็น RETIRED + comment (U6)
- ไม่ลบ i18n key ของ criterion ที่เลิกใช้
- ไม่ย้าย `advancedOptions` เข้า `assignmentMode` (U8 = org-level)
- ไม่แตะ `assignmentMode[]` เลย — เป็นก้อนที่ 2

### 9.4 ผลตรวจรับ

- `pnpm exec tsc -b` → 0 error
- `pnpm exec eslint` ไฟล์ที่แก้ → 0 problem
- `pnpm test` → **85 ไฟล์ / 922 tests** ผ่านทั้งหมด
- `pnpm build` → ผ่าน (1m 49s)

### 9.5 หมายเหตุที่ต้องรู้ก่อนทำก้อนที่ 2

- `validateOrgAssignmentRules` ถูกลบ ⇒ **shell validate เฉพาะครึ่ง map** จนกว่าก้อนที่ 2 จะใส่ rule ของ `assignmentMode` กลับมา (กติกาเดิม "auto ที่ไม่มี criterion = error" ยังไม่ได้ถูกใช้ที่ไหน)
- `hasRoutingCriterion` ไม่มีผู้เรียกแล้ว (มีแต่ test) — ตั้งใจเก็บไว้ให้ rule ในก้อนที่ 2 ใช้ ไม่ใช่โค้ดตกค้าง

---

## 10. บันทึกการลงมือ — ก้อนที่ 2 (2026-11-19)

### 10.1 ไฟล์ที่แตะ

| ไฟล์ | สิ่งที่ทำ |
| --- | --- |
| `core/types/organization.ts` | +`AssignmentModeTarget` (`pic` \| `assignment`), +`AssignmentModeToken` (`auto` \| `manual`), +`AssignmentModeEntry`, +`ASSIGNMENT_MODE_TOKENS` / `ASSIGNMENT_MODE_TARGETS`, +`OrgConfigPropertiesDoc.assignmentMode` |
| `cms/utils/orgAssignmentMode.ts` (**ใหม่**) | decode + normalize (1 sub-type ต่อ 1 stage, ค่าสุดท้ายชนะ) · `encodeOrgAssignmentMode` · `readUnknownAssignmentModeEntries` · `get/setAssignmentModeForSubType` · `collectAssignmentModeSubTypeIds` · `validateAssignmentMode` |
| `cms/utils/orgConfigProperties.ts` | decode เพิ่ม `assignmentMode` · encode **rebuild array เอง** (เพราะ `deepMerge` แทน array ทั้งก้อน) + ต่อ entry ที่ไม่รู้จักกลับท้าย + ไม่สร้าง key ว่างถ้าเอกสารเดิมไม่มี |
| `settings/assignment/AssignmentModeTable.tsx` (**ใหม่**) | ตาราง 2 คอลัมน์ (PIC / Case assignment) × แถว = case sub-type · ช่องละ Auto/Manual/Not set · note D18 · `errorKey` |
| `settings/assignment/AssignmentRulesSection.tsx` | รับ `assignmentMode` + `onAssignmentModeChange` · วางตารางไว้บนสุดของ section |
| `settings/OrganizationSettingsManagement.tsx` | +`onChangeAssignmentMode` ใน context · `handleSave` รวม `validateAssignmentMode` และ focus แท็บ assignment เมื่อพังที่ตาราง |
| `settings/useOrgConfigProperties.ts` | mock mode: `assignmentMode: []` ตอนโหลด, carry ค่าจากฟอร์มตอน save |
| `public/i18n/{en,th,cn}.json` | +`settings.assignment.mode_table.*` (9 คีย์) |
| `scripts/smoke-org-settings.mjs` | เพิ่ม `assignmentMode` + `unitProperty` ในเอกสารทดสอบ และ +4 check (round-trip, unitProperty, array, retired keys ต้องไม่กลับมา) |

### 10.2 กติกาที่บังคับใช้

- **"Not set" = ไม่มี entry** ไม่ใช่ token ที่สาม (เพราะ U2: ไม่มี org default ให้ inherit)
- **1 sub-type อยู่ในโหมดเดียวต่อ 1 stage** — ค่าสุดท้ายชนะตอนอ่าน, `setAssignmentModeForSubType` จัดการตอนเขียน
- **entry ที่ `type`/`mode` ไม่รู้จักรอด Save** — ต่อกลับท้าย array (มี test คุม)
- **array ถูกแทนทั้งก้อน** ⇒ ทุกครั้งที่เขียนต้อง rebuild ครบ
- **ไม่สร้าง `assignmentMode: []`** ในเอกสารที่ไม่เคยมี key นี้ (absence คือ "ไม่ตั้งค่า")
- แถวในตารางมาจาก **catalogue + id ที่เก็บไว้** ⇒ sub-type ที่ถูกลบออกจาก catalogue ยังเห็นและเคลียร์ได้

### 10.3 Validation ที่กลับมา

`validateAssignmentMode(entries, routingModes)` — ถ้ามี entry ใด `mode: "auto"` (stage ใดก็ได้) และไม่มี routing criterion เลย → error `settings.assignment.validation.no_criteria_selected` (copy เดิม มีครบ 3 ภาษา) ⇒ **`hasRoutingCriterion` กลับมามีผู้เรียกจริง** ตามที่ตั้งใจไว้ใน §9.5

### 10.4 ผลตรวจรับ

- `pnpm exec tsc -b` → 0 error · `pnpm exec eslint` ไฟล์ที่แก้ → 0 problem
- `pnpm test` → **86 ไฟล์ / 948 tests** ผ่านทั้งหมด (ใหม่: `orgAssignmentMode.test.ts` 21 เคส · adapter +3 · shell +2)
- `pnpm build` → ผ่าน (1m 42s)
- `node --check scripts/smoke-org-settings.mjs` → ผ่าน

### 10.5 Live smoke test กับ STAGING (2026-11-19, org BMA / user admin)

รัน `node scripts/smoke-org-settings.mjs --cleanup` ด้วย token จาก login จริง → **ALL CHECKS PASSED (exit 0)**

```text
1) GET smoke key before anything is stored
   status="-1" msg="Failure" desc="Config property not found" data=null   ← key ที่ยังไม่มี
   PASS  NOT_STORED_PATTERN recognises the wording
2) SET smoke key (upsert)   status="0" desc="Set successfully"             ← upsert ยืนยัน
3) GET smoke key after write
   PASS  map half / staff interval (number) / areaBased / unitProperty
   PASS  assignmentMode[] round-trips entry for entry
   PASS  the retired assignment keys stay out of the stored rules
   PASS  serviceSubType / __smokeMarker / no bookkeeping leak / structural equality
5) Cleanup DeleteConfigProperty   status="0" desc="Delete successfully"    ← ลบแถวทดสอบแล้ว (id 11)
```

### 10.6 สิ่งที่ของจริงเปิดเผย (สำคัญ)

`org.config.properties` ของ org นี้ **มีอยู่แล้ว** และเป็น **รูปร่างก่อน contract ใหม่**:

```text
top-level keys : assignmentRules, mapSettings          ← ไม่มี assignmentMode
routingModes   : areaBased, availability, caseType, caseTypeSubTypes,
                 combineWithAnd, department, locationBased, skillBased
                                                            ↑ 4 key ที่เลิกใช้ยังอยู่
                                                            ↑ ไม่มี unitProperty
```

ผลเมื่อ admin กด Save ครั้งถัดไป (ตามพฤติกรรมที่ test ปักไว้):

| key | ผล |
| --- | --- |
| `routingModes.unitProperty` | **ถูกเพิ่ม** (`false`) เพราะ typed model มีค่านี้ |
| `routingModes.locationBased` / `department` / `caseType` / `caseTypeSubTypes` | **คงอยู่** — merge ไม่ลบ key ที่ typed model ไม่รู้จัก |
| `assignmentMode` | **ยังไม่ถูกสร้าง** เว้นแต่ admin ตั้งค่าในตาราง (encode ไม่สร้าง key ว่าง) |

**ความเสี่ยงที่ต้องตัดสินใจ:** ถ้า routing engine ฝั่ง backend ยังอ่าน criterion ที่เลิกใช้อยู่ ค่าที่ค้างในเอกสาร (เช่น `locationBased: true`) จะยังมีผลต่อไป โดยที่ admin **ไม่มีทางเห็นหรือแก้ได้** ในหน้าจอใหม่ ⇒ ต้องเลือกทางใดทางหนึ่ง:

1. **backend รับประกันว่าละเว้น/ตัด 4 key นั้น** → ไม่ต้องทำอะไรฝั่ง FE (ต้องยืนยันกับทีม backend)
2. **FE ลบ key ที่เลิกใช้ตอน Save** — เป็นการฝ่าหลัก "merge ไม่ลบ" แต่ในกรณีนี้เรารู้แน่ชัดว่าเลิกใช้ (U6) จึงเป็นการ migration ที่ถูกต้อง
3. **แสดง read-only notice** ว่า "พบค่าตั้งเดิมที่เลิกใช้แล้ว" แล้วให้ admin กดล้าง

ผมยังไม่เลือกข้อใด — ต้องได้ decision ก่อน (ข้อ 1 ถูกที่สุดถ้า backend ยืนยันได้)

### 10.7 ยังไม่ได้ทำ

- เปิดดูหน้าเว็บจริงในเบราว์เซอร์ (ต้องใช้ session ที่ล็อกอิน)
- การจัดการค่า criterion ที่เลิกใช้ซึ่งค้างอยู่ในเอกสารจริง (ดู §10.6)

---
---

## 11. mock spec (`organizationSettings.sh`) — สถานะจริง + guard ที่ไม่แตะไฟล์ (2026-11-19)

> **ข้อตกลง:** `src/core/mocks/organizationSettings.sh` เป็นไฟล์ที่เจ้าของดูแลเอง — **ห้ามเขียนทับ/แก้**
> งานฝ่าย FE ทำได้คืออ่านแล้วรายงาน และวางสิ่งที่อยากเพิ่มไว้ในเอกสารนี้แทน
> (รอบก่อนผมเขียนทับเป็นสคริปต์ ต้องให้เจ้าของ restore — บทเรียนอยู่ใน `anti-regression`)

### 11.1 ไฟล์วันนี้มีอะไร

- 7 operation ครบชื่อ (`ListConfigProperty`, `GetConfigPropertyByKey`, `GetConfigPropertyById`,
  `CreateConfigProperty`, `SetConfigPropertyByKey`, `DeleteConfigProperty`, `UpdateConfigProperty`)
  พร้อม REST endpoint ของแต่ละตัว
- **มี curl 2 ตัว:** `GetConfigPropertyByKey` (query) และ `CreateConfigProperty` (mutation + payload เต็ม)
- payload ใน `CreateConfigProperty` = โครงสร้างล่าสุด (มี `assignmentMode[]`, `unitProperty`, ไม่มี `assignmentRules.mode`)

### 11.2 หน้าเว็บยังใช้ได้ (ตรวจแล้ว 2026-11-19)

| สิ่งที่เทียบ | ผล |
| --- | --- |
| `GetConfigPropertyByKey(input: ConfigPropertyKeyInput)` + select `status msg desc data` | **ตรงกับที่ FE ส่งจริงทุกตัวอักษร** (`configPropertyQueries.ts`) ⇒ ตัวอย่างที่เพิ่มมา *ยืนยัน* เส้นทางอ่านของแอป ไม่ได้เปลี่ยนมัน |
| โครงสร้าง payload | ตรงกับ `OrgConfigPropertiesDoc` และเท่ากับ canonical fixture (round-trip ผ่าน adapter จริง) |
| production code ที่อ่าน `assignmentRules.mode` (key ที่ถูกยกเลิก) | **ไม่มี** (เหลือแต่ comment/เทสต์ที่จงใจปักพฤติกรรม) |

⇒ **ไม่ต้องปรับโค้ด FE ตามไฟล์นี้** — สิ่งที่เปลี่ยนคือ "มีตัวอย่าง query เพิ่ม" ไม่ใช่ "payload เปลี่ยน"

### 11.3 ข้อสังเกตในไฟล์ (รายงานไว้ ไม่ได้แก้)

| # | เรื่อง | ผล |
| --- | --- | --- |
| 1 | `ListConfigProperty` ไม่ใช่ชื่อที่มีใน schema — ของจริงคือ **`GetConfigPropertyLists(input: ConfigPropertyListInput)`** (introspect `cc-bff-stg` 2026-11-19) | คัดลอกไปยิงจะได้ "Cannot query field" |
| 2 | 6/7 operation ยังไม่มี body; ตัวที่แอปใช้เขียนจริง (`SetConfigPropertyByKey` = upsert) ไม่มีตัวอย่าง | ต้องเดาเอง (ตัวอย่าง body อยู่ใน `scripts/smoke-org-settings.mjs`) |
| 3 | `caseSubTypes` เป็น UUID ชุดตัวอย่าง ไม่ใช่ sTypeId จริงของ tenant | ใส่จริงแล้วตาราง Assignment Mode จะโชว์ id ที่ resolve ไม่ได้ (fixture ใช้ id จริงของ BMA แล้ว) |
| 4 | ค่า seed 2 ตัวสร้างสถานะที่ดูเหมือนบั๊ก: `staff.routing.mode="auto"` (UI disable ตาม D2/D8) และ `tracking.autoIntervalSeconds=15` (ต่ำกว่า floor 30 ตาม D7) | เป็นค่าของ backend — เก็บไว้และอธิบาย ไม่ใช่แก้ |

***Response envelope ที่ client ใช้ตัดสิน (เก็บไว้ที่นี่แทนการแก้ไฟล์)***

| กรณี | envelope | ที่มา |
| --- | --- | --- |
| ยังไม่เคยบันทึก | `{ "status": "-1", "msg": "Failure", "desc": "Config property not found", "data": null }` | staging 2026-11-19 (`scripts/smoke-org-settings.mjs` step 1) → `useOrgConfigProperties` ตีความเป็น `empty` **ไม่ใช่ error** |
| เขียนสำเร็จ | `{ "status": "0", "msg": "...", "desc": "Set successfully", "data": <row หรือ document> }` | staging 2026-11-19 (step 2) |
| ไม่มี/หมดอายุ token | `{ "status": "401", "msg": "Unauthorized", "desc": "Missing Authorization header", "data": null }` | staging 2026-11-18 (`useOrgConfigProperties` header) |

`status` เป็นสัญญาณเดียวของความสำเร็จ: `"0"`/`"true"`/`"ok"` = สำเร็จ, `"-1"`/`"false"` = ล้มเหลว, ค่าที่ไม่รู้จัก
ต้องถือเป็นล้มเหลว (`readEnvelopeStatus`) — และ `data` กลับมาได้ทั้งแบบ ROW (`{ propKey, propVal }`) และแบบ document

### 11.4 Canonical fixture + guard 2 ชั้น (ไม่แตะ `.sh`)

| ไฟล์ | บทบาท |
| --- | --- |
| `src/core/mocks/orgConfigProperties.payload.json` | **payload กลาง 1 ไฟล์** (โครงสร้างเดียวกับ `.sh`, `caseSubTypes` เป็น sTypeId จริงของ BMA 6 ตัว จาก 67 รายการ) — ใช้โดยเทสต์ + `scripts/smoke-org-settings.mjs` |
| `src/cms/utils/orgConfigProperties.fixture.test.ts` (7) | **fixture ↔ client**: decode ไม่หาย/ไม่เติมเกิน · `routingModes` 5 key · `assignmentMode[]` round-trip · **`encode()` คืนเอกสารเท่าเดิม** · ผ่าน validator ของ client · ค่า seed `routing auto` / `tracking 15` ถูก pin ไว้ |
| `src/cms/utils/orgConfigProperties.mockSpec.test.ts` (3) | **`.sh` ↔ fixture** (อ่านเท่านั้น): เทียบ *shape* ทุก path (`path: type`, array ยุบเป็น `[]`) ไม่เทียบค่า · ตรวจ 3 section + ไม่มี criterion ที่เลิกใช้ · ถ้าอ่าน payload ในไฟล์ไม่ได้ → **fail ดัง ๆ** ไม่ข้ามเงียบ |
| `scripts/smoke-org-settings.mjs` | อ่าน fixture แล้วเบี่ยงเฉพาะ 2 ค่า: `serviceSubType: "emergency"` (ไม่ใช่ default เพื่อพิสูจน์ว่า client ไม่ reset ค่าที่ไม่มี UI) และ `__smokeMarker` |

**พิสูจน์ว่า guard ล้มเหลวได้** (negative control): คัดลอก `.sh` ไปไฟล์ชั่วคราว เติม `mapSettings.general.futureKnob`
แล้วรันด้วย `ORG_SETTINGS_MOCK_SPEC=<สำเนา>` → test fail พร้อม diff บรรทัด `+ "mapSettings.general.futureKnob: string"`
(ไฟล์จริงไม่ถูกแตะ และสำเนาถูกลบหลังรัน)

**ทำไมไม่จูนค่า seed ให้ "สวย":** fixture ต้องสะท้อน backend ไม่ใช่ความชอบของ UI — ถ้าแก้ `tracking` เป็น 60
การทดสอบ D7 (clamp ที่จุดใช้งาน) จะหายไปเงียบ ๆ

### 11.5 ตรวจแล้ว

- ✅ `npx tsc -b` → 0 error · `npx eslint` → 0 problem
- ✅ `npx vitest run` → **88 ไฟล์ / 958 เทสต์ ผ่านทั้งหมด** (ก่อนหน้าส่วนนี้ 86/948)
- ✅ `node --check scripts/smoke-org-settings.mjs` ผ่าน · negative control ของ mock-spec guard ผ่านตามคาด (fail เมื่อเพี้ยน)
- ❌ ไม่ได้รัน build ซ้ำในรอบนี้: ไฟล์ที่เพิ่มเป็นเทสต์/เอกสาร/JSON ที่ไม่มีใคร import จาก app code ⇒ bundle ไม่เปลี่ยน (build ล่าสุดก่อนหน้าส่วนนี้ผ่าน 2,698.74 KB)
- ❌ ยังไม่ได้ยิง `SetConfigPropertyByKey` ด้วย token จริงในรอบนี้

### 11.6 ยังค้าง

- ค่า criterion ที่เลิกใช้ซึ่งยังค้างในเอกสารจริงของ BMA (§10.6) — ต้องตัดสินกับ backend
- org ที่เคยตั้ง `assignmentRules.mode = "automatic"` ไว้: ความตั้งใจนั้นถูกเพิกเฉยเพราะไม่มี `assignmentMode[]`
  (BMA เป็น `manual` จึงไม่กระทบ) — ต้องตัดสินว่าจะ migration หรือแจ้ง tenant

---

## 12. Live smoke test — assignmentMode กับข้อมูลจริง (2026-11-19, BMA / admin)

### 12.1 baseline ที่พบ (เอกสารรูปร่างเก่าเต็มตัว)

```text
top-level keys : assignmentRules, mapSettings            <- ไม่มี assignmentMode
assignmentRules: mode = "manual"                          <- key ที่ถูกยกเลิก ยังอยู่
routingModes   : areaBased, availability, caseType, caseTypeSubTypes,
                 combineWithAnd, department, locationBased, skillBased   <- 8 key, ไม่มี unitProperty
                 (ทุกตัวเป็น false)
mapSettings    : general.mapProvider=longdo · staff.tracking manual/60 · layers.showPlace=false
```

### 12.2 ผลตรวจ

| เคส | ผล |
| --- | --- |
| หน้าอ่านเอกสารรูปร่างเก่าได้ | ✅ แท็บ Assignment Rules เปิดได้ · **ตาราง 66 แถว** (= 66 sub-type ของ BMA) · ทุกช่อง = "ยังไม่ตั้งค่า" (`none`) · ป้ายแถวแรก `001-BMTA-DEMO` (ชื่อจริงจาก catalogue) · note D18 อยู่ · `unitProperty` แสดงเป็นยังไม่ติ๊ก (ตรงกับ default) |
| negative: `pic = auto` โดยไม่มี criterion | ✅ **บล็อก**: error สีแดง "เลือกอย่างน้อยหนึ่งเกณฑ์…" · `บันทึกล่าสุด` ไม่เปลี่ยน · ค่าที่แก้ยังอยู่ (dirty) · แท็บไม่เปลี่ยน |
| positive: ติ๊ก `unitProperty` + ตั้ง `pic=auto`, `assignment=manual` แล้วบันทึก | ✅ สำเร็จ (lastSaved เปลี่ยน, dirty เคลียร์) |
| เอกสารหลังบันทึก | ✅ `assignmentMode` **ถูกสร้าง** = `[{pic,auto,[cda51f75…]}, {assignment,manual,[cda51f75…]}]` (id ของแถวที่เลือกจริง) · `routingModes.unitProperty = true` ถูกเพิ่ม · **key ที่เลิกใช้ 4 ตัว + `mode:"manual"` ยังอยู่** (merge ไม่ลบ) · ค่าอื่นทั้งหมดไม่เปลี่ยน · `updatedBy=admin` |
| อ่านกลับหลัง reload | ✅ แถวแรกแสดง `auto` / `manual` ตามที่บันทึก · ช่องอื่นยัง `none` |
| คืนค่า baseline | ✅ เขียนกลับโดยลบเฉพาะ 2 คีย์ที่ test นี้สร้าง (`assignmentMode`, `routingModes.unitProperty`) → top-level กลับเป็น 2 คีย์ · `routingModes` กลับเป็น 8 คีย์ · `mode:"manual"` · ค่าอื่นตรง baseline ทุกตัว |

### 12.3 บั๊กที่พบ (ไม่เกี่ยวกับ assignmentMode — เป็น shared component)

**อาการ:** criterion ที่เก็บค่า `true` ไว้ ต้อง **คลิก 2 ครั้ง** จึงจะปิดได้ — คลิกแรกไม่มีผลอะไรเลย

**หลักฐาน (วัดในหน้าเว็บ):** criterion `unitProperty` ที่เก็บค่า `true`

| สถานะ | DOM `.checked` | เครื่องหมายถูกที่เห็น | form dirty |
| --- | --- | --- | --- |
| หลัง reload | `false` | **เห็น** | ไม่ |
| คลิกครั้งที่ 1 | `true` | เห็น | **ไม่** (ไม่มีผล) |
| คลิกครั้งที่ 2 | `false` | ไม่เห็น | ใช่ |

**สาเหตุ:** `src/core/components/form/input/Checkbox.tsx:32` มี `// checked={checked}` ถูกคอมเมนต์ไว้ ⇒ `<input type="checkbox">` เป็น **uncontrolled** (DOM เริ่มที่ `false` เสมอ) แต่เครื่องหมายถูกวาดจาก prop ⇒ คลิกแรกอ่าน `e.target.checked = true` แล้วส่ง `onChange(true)` ทั้งที่ค่าจริงเป็น `true` อยู่แล้ว

**ขอบเขต:** component นี้ถูกใช้ ~20 จุด (unit status flags, advanced filters, table/grid selection, auth forms, routing criteria) — จุดที่ค่าเริ่มต้นเป็น `true` ได้จะเจออาการเดียวกัน · **ตัวสำเนาที่ `src/cms/components/form/input/Checkbox.tsx:32` เขียนถูก** (`checked={checked}`) ⇒ มี reference implementation อยู่แล้ว การแก้คือเปิดบรรทัดนั้น (1 บรรทัด) แต่ต้อง regression ทุกจุดที่ใช้

### 12.4 แก้แล้ว (2026-11-19)

| ไฟล์ | สิ่งที่ทำ |
| --- | --- |
| `src/core/components/form/input/Checkbox.tsx` | เปิด `checked={checked}` (ให้ตรงกับสำเนา `src/cms/…` ที่ถูกอยู่แล้ว) + comment กันการคอมเมนต์กลับ |
| `src/core/components/form/input/Checkbox.test.tsx` (ใหม่, 5 เทสต์) | controlled input: DOM ตรงกับ prop · เก็บ `true` → **คลิกเดียว** ได้ `onChange(false)` · ตั้งจาก false → คลิกเดียวได้ `true` · re-seed จาก prop (load/Cancel) · disabled ไม่เรียก onChange |
| call sites | ไล่ตรวจทั้ง 12 จุดที่ใช้งานจริง — ทุกจุดส่ง `checked` จาก state ที่ `onChange` อัปเดต (ไม่มีจุดไหนพึ่ง uncontrolled) ⇒ ปลอดภัย |

**Negative control:** คอมเมนต์บรรทัดนั้นกลับแล้วรันเทสต์ → **fail 3 เคส** (DOM ไม่ตรง prop · ต้องคลิก 2 ครั้ง · re-seed ไม่ตาม) แล้วคืนไฟล์ (ตรงเป๊ะ) → กลับมา 5/5 ผ่าน

ตรวจรวม: `tsc -b` 0 error · `eslint` 0 problem · `vitest` **89 ไฟล์ / 963 เทสต์** · `pnpm build` ผ่าน (2,698.75 KB)

---

## 13. UI rework — Hierarchy + segmented control (2026-11-19)

### 13.1 สิ่งที่เปลี่ยน

| ไฟล์ | สิ่งที่ทำ |
| --- | --- |
| `assignment/StageModeControl.tsx` (**ใหม่**) | segmented radiogroup 3 สถานะ (ไม่ตั้งค่า / อัตโนมัติ / กำหนดเอง) + ไอคอนต่อตัวเลือก |
| `assignment/AssignmentModeTable.tsx` | ตารางแบน → **hierarchy**: case type (พับ/ขยายได้) > case sub-type (leaf) |
| `assignment/AssignmentModeTable.test.tsx` (**ใหม่**) | 6 เคส (ดู §13.4) |
| `public/i18n/{en,th,cn}.json` | +`mode_table.column_sub_types`, +`mode_table.unknown_group` (รวม 11 คีย์ต่อภาษา) |

ไม่ได้แตะ `src/core/mocks/organizationSettings.sh` (ตามข้อตกลง §11) และไม่ได้แก้ §10–§12 ของเดิม

### 13.2 ทำไมเป็น Hierarchy

- `caseSubTypes` เป็น `sTypeId` ที่สังกัด **case type** — และผู้ดูแลคิดเป็นกลุ่มตามประเภทอยู่แล้ว
  รายการแบนทำให้ `001-BMTA-DEMO` 66 แถว (§12.2) เรียงติดกันโดยไม่บอกว่าอยู่ประเภทไหน
- ใช้ภาษาเดียวกับ hierarchy ที่มีในโปรเจกต์: chevron + folder/folder-open + ย่อหน้าแถวลูก
  (`ServiceHierarchyView` / `AreaHierarchyView` / `core/components/admin/HierarchyItem.tsx`)
- **ไม่ reuse `HierarchyView`/`HierarchyItem`** เพราะสองตัวนั้นเป็น CRUD tree (ปุ่ม delete/create child,
  action ต่อแถว, analytics, `loading` state) — ไม่มีช่องให้ controlled form control ต่อแถว
  การฝืนใช้ต้องส่ง prop ที่ไม่ใช้เป็นสิบตัว และแถวจะกลายเป็น `<div>` ที่ไม่มี semantics ของตาราง
- **กลุ่มเริ่มต้น = ขยายทั้งหมด** เพราะหน้านี้คือ *ตารางแก้ไข* ไม่ใช่ *ต้นไม้สำหรับเลือก*
  (ต่างจาก Area/Service ที่มีไว้เลือกแล้วเข้าไปดูรายละเอียด) — และก่อนหน้านี้ก็แสดง 66 แถวอยู่แล้ว
  การพับเป็นตัวเลือกเสริม ไม่ใช่ค่าเริ่มต้น

### 13.3 ทำไมเปลี่ยน Dropdown → Segmented radiogroup

- 3 ตัวเลือกคงที่ ไม่มี search ไม่มี label ยาว ⇒ ไม่ควรซ่อนหลังคลิก และตารางนี้มี **2 ช่องต่อแถว**
  (66 แถว × 2 = 132 dropdown ถ้าใช้แบบเดิม)
- semantics เป็น radiogroup จริง ไม่ใช่ปุ่ม 3 อัน:
  `role="radiogroup"` + `role="radio"` + `aria-checked` · roving tabindex (ทั้งกลุ่ม = 1 tab stop) ·
  ลูกศรขึ้น/ลง/ซ้าย/ขวา + Home/End เลื่อน selection · `aria-label` ต่อช่อง = `<ชื่อแถว> - <ชื่อ stage>`
  (ชุดปุ่ม `aria-pressed` ให้พฤติกรรมนี้ไม่ได้ และไม่ประกาศว่ามีตัวเลือกเดียว)
- หน้าตาใช้ shell เดียวกับ segmented control ที่มีอยู่แล้วในแอป (assign-officer view switch,
  `StaffMapControls`): ร่องสีเทา + ตัวที่เลือกยกขึ้นเป็นสีขาวมีเงา + ไอคอน (`CircleSlash` / `Bot` / `User`)
  ⇒ ไม่ดูเป็น radio จุดกลม และอ่านออกทันทีว่ามี 3 สถานะ

### 13.4 Test ที่ครอบ behaviour นี้

`AssignmentModeTable.test.tsx` (6):

1. จัดกลุ่มใต้ case type จริง (Fire/Flood + ชื่อย่อย)
2. พับกลุ่มแล้ว **ข้อมูลไม่เปลี่ยน** (เอา DOM ออก แต่ `onChange` ไม่ถูกเรียก)
3. radiogroup ต่อ stage มี 3 ตัวเลือก และ checked ตัวเดียว
4. เขียน stage หนึ่งแล้ว **อีก stage ไม่กระทบ** + ลำดับ array ถูก normalize (pic → assignment)
5. เคลียร์กลับเป็น "ไม่ตั้งค่า" ⇒ entry หายไป (ไม่ใช่ `caseSubTypes: []`)
6. ลูกศรขวาเลื่อน selection (radiogroup behaviour)

### 13.5 ผลตรวจรับ

- `pnpm exec tsc -b` → 0 error · `pnpm exec eslint` → 0 problem
- `pnpm test` → **90 ไฟล์ / 969 tests** ผ่านทั้งหมด (ก่อนส่วนนี้ 89/963)
- `pnpm build` → ผ่าน (1m 53s)

### 13.6 ยังไม่ได้ทำในรอบนี้

- ~~ยังไม่ได้เปิดดูในเบราว์เซอร์~~ → ทำแล้ว ดู §13.7
- ข้อค้างเดิมยังอยู่: ค่า criterion ที่เลิกใช้ในเอกสารจริง (§10.6) และ org ที่เคยตั้ง
  `assignmentRules.mode = automatic` (§11.6)

### 13.7 Browser smoke test ของ UI ใหม่ (2026-11-19, BMA / admin, dev server :5173)

วัดจาก DOM จริงและการใช้งานจริง (ไม่ใช่ภาพ) — **ไม่มีการเขียนข้อมูลลง staging ในรอบนี้**
(Save ถูกบล็อกด้วย validation แล้วกด Cancel ทิ้ง · `บันทึกล่าสุด` ยังเป็น 17:36:51 ของ §12)

| สิ่งที่ตรวจ | ผล |
|---|---|
| hierarchy เรนเดอร์จากข้อมูลจริง | 17 case-type group · **67 leaf** · 134 radiogroup (67×2 stage) · 402 radio (134×3) · หัวตาราง `ประเภทย่อยของเคส / ผู้รับผิดชอบ (PIC) / การมอบหมายเคส` |
| ป้ายแถว/กลุ่ม | `001-DEMO`, `1001-ตรวจสอบปัญหา`, … (ชื่อจริงจาก catalogue) · กลุ่มจริง เช่น `BMTA1`, `ประเภท 1`, `Service Request` |
| orphan group | ไม่มี — ถูกต้อง เพราะเอกสารจริงยังไม่มี `assignmentMode` จึงไม่มี id ที่หลุดจาก catalogue |
| พับ/ขยายกลุ่ม | `aria-expanded` true→false · leaf 67→66 · radiogroup 134→132 · **dirty ยังเป็น false** (การพับไม่แตะข้อมูล) · ขยายกลับได้ 67 |
| คลิก segmented (PIC = อัตโนมัติ) | dirty = true · PIC `aria-checked`: อัตโนมัติ=true (tabindex 0), ที่เหลือ -1 · **stage อีกช่องยัง "ไม่ตั้งค่า"** |
| `aria-label` ต่อช่อง | `001-DEMO - ผู้รับผิดชอบ (PIC)` / `001-DEMO - การมอบหมายเคส` |
| คีย์บอร์ด | โฟกัส "อัตโนมัติ" → `ArrowRight` → selection = "กำหนดเอง" และ focus ย้ายตาม |
| ไม่ใช่ plain radio / dropdown | `table input[type="radio"]` = 0 · `table select` = 0 · ตัวที่เลือกยกขึ้นด้วยพื้น `bg-white`/`gray-700` + shadow + ไอคอน (`svg`) |
| ธีม | dark: shell `rgb(29,41,57)` / selected `rgb(52,64,84)` · light: shell `rgb(242,244,247)` / selected `rgb(255,255,255)` + ข้อความ `rgb(16,24,40)` ⇒ ใช้ได้ทั้งสองธีม |
| negative: Save ตอน PIC=auto และไม่มี criterion | **บล็อก**: ข้อความแดง "เลือกอย่างน้อยหนึ่งเกณฑ์การกำหนดเส้นทางสำหรับโหมดอัตโนมัติ" · dirty ยังอยู่ · ไม่มี toast สำเร็จ · `บันทึกล่าสุด` ไม่เปลี่ยน · แท็บไม่เปลี่ยน |
| Cancel | dirty เคลียร์ · ข้อความแดงหาย · แถวกลับเป็น "ไม่ตั้งค่า" ทั้งช่อง · ไม่มีการเขียน |
| console | **0 error** (1 warning เดิม ไม่เกี่ยวข้อง) |

**ยังไม่ได้ทดสอบ positive path ผ่าน UI ใหม่ (Save จริง)** — §12 พิสูจน์ positive path ไว้แล้วตอนยังเป็นตารางแบน/Select และ `SetConfigPropertyByKey` ผ่าน smoke script มาแล้ว 2 รอบ; การทำผ่าน UI ใหม่จะเขียนลง staging จริงและต้อง restore baseline แบบ §12.2
