# Organization Settings — จาก Mockup สู่ Config Property จริง

สถานะ: **Phase 1 (data layer) + Phase 2 (UI) เสร็จ ตรวจรับแล้ว และทดสอบกับ STAGING ด้วย token จริงแล้ว (§13)**
วันที่สำรวจ: 2026-11-18 / ปิด Phase 1: 2026-11-18 / ปิด Phase 2: 2026-11-18
ขอบเขต: `/cms/settings/organization` — เฉพาะ section **Map Settings** และ **Assignment Rules**
งานต่อเนื่อง (ยังไม่เริ่ม): `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md` — ทำให้ค่าที่บันทึกได้มีผลตอนใช้งานจริง
งานสำรวจเพิ่มเติม (payload ใหม่ 2026-11-19): `docs/ORG-SETTINGS-Assignment-Mode-Survey.md` — field `assignmentMode`

---

## 1. สถานะปัจจุบัน

| ชั้น | สิ่งที่มีอยู่ |
|---|---|
| Route | `/cms/settings/organization` (`src/cms/App.tsx:208`) gate ด้วย `organization_settings.manage` (`src/cms/pages/Admin/OrganizationSettingsManagement.tsx:27`) |
| เมนู | `src/cms/layout/AppSidebar.tsx:287` + `src/core/layout/SuperTopbar.tsx:432` (มีครบทั้งคู่) |
| Shell | `src/cms/components/admin/system-configuration/settings/OrganizationSettingsManagement.tsx` — section registry 3 รายการ: `map`, `assignment-rules`, `subscription` |
| Hooks | `useOrgMapSettings.ts` (138 บรรทัด), `useOrgAssignmentRules.ts` (119 บรรทัด) |
| API | `src/core/store/api/organizationApi.ts` — 4 endpoint ที่ **สมมติขึ้นเอง**: `getOrgMapSettings`, `updateOrgMapSettings`, `getOrgAssignmentRules`, `updateOrgAssignmentRules` |
| GraphQL | `src/core/store/api/graphql/organizationQueries.ts` — 4 entry ชี้ `root: "Organization"` |
| Mock | `orgMapSettingsStub.ts`, `orgAssignmentRulesStub.ts` (session-scoped, ใช้เมื่อ `VITE_MOCK_API="true"`) |
| Types | `src/core/types/organization.ts` — `OrgMapSettings` (บรรทัด 229), `OrgAssignmentRuleSettings` (บรรทัด 319), `OrgSettings` (บรรทัด 118) |

### ทำไมถึงเรียกได้ว่าเป็น mockup

ยิง introspection ใส่ `https://cc-bff-stg.one-sky.ai/graphql` แล้ว: **`Organization` ไม่มีอยู่จริง** ทั้งบน `Query` และ `Mutation` (ไม่มี root ใดที่มีคำว่า `Organ`)

⇒ GraphQL mode (ทุก `.env*` ตั้ง `VITE_USE_GRAPHQL="true"`) ไม่มี REST fallback ⇒ สองหน้านี้ error ทุกครั้ง แล้ว `useOrgMapSettings` / `useOrgAssignmentRules` กลืน error เป็น schema defaults ⇒ หน้าแสดงผลได้แต่ไม่มีอะไรถูกบันทึกจริง

---

## 2. Backend contract (ยืนยันจาก schema จริง ไม่ใช่จากคอมเมนต์ใน `.sh`)

ที่มา: GraphQL introspection ต่อ `cc-bff-stg.one-sky.ai/graphql`, 2026-11-18. ส่วนที่ตรงกับ `src/core/mocks/config_property.go` คือ model ระดับ row และชนิดของ `propVal`

### 2.1 Operations

```
Query.ConfigProperty
  GetConfigPropertyLists(input: ConfigPropertyListInput)  -> ApiResponse
  GetConfigPropertyById(input: GetIdInput)                -> ApiResponse
  GetConfigPropertyByKey(input: ConfigPropertyKeyInput)   -> ApiResponse

Mutation.ConfigProperty
  CreateConfigProperty(input: ConfigPropertyInput!)       -> ApiResponse
  UpdateConfigProperty(input: ConfigPropertyUpdateInput!) -> ApiResponse
  DeleteConfigProperty(input: GetIdInput!)                -> ApiResponse
  SetConfigPropertyByKey(input: ConfigPropertySetInput!)  -> ApiResponse
```

### 2.2 Input types

```
ConfigPropertyListInput    { start: Int, length: Int }
ConfigPropertyKeyInput     { propKey: String! }
ConfigPropertyInput        { propKey: String!, propVal: JSON! }
ConfigPropertyUpdateInput  { id: ID!, propKey: String, propVal: JSON }
ConfigPropertySetInput     { propKey: String!, propVal: JSON! }
GetIdInput                 { id: String! }
ApiResponse                { status: String, msg: String, data: JSON, desc: String }
```

### 2.3 ข้อเท็จจริงที่ออกแบบจากตรงนี้

1. `propVal` เป็น scalar `JSON` → ส่ง/รับ object ทั้งก้อนได้ ไม่ต้องประกาศ `fields` ทีละ field
2. ไม่มี `orgId` ใน input ใด ๆ → server ผูก org จาก auth context; `propKey` เป็น unique ต่อ `(orgId, propKey)`
3. `GetConfigPropertyLists` ตัด `propVal` ออก (ตรงกับ `ConfigPropertyListItem` ใน Go) → 取值ต้องใช้ `GetConfigPropertyByKey` เท่านั้น
4. `SetConfigPropertyByKey` เป็น **upsert** → ครั้งแรกที่ Save จะสร้าง record เอง ไม่ต้องมี Create step
5. key ยังไม่มี → `status: "-1"` + `data: null` → `hybridBaseQuery` แปลงเป็น RTK error จริง ไม่ใช่ empty success

### 2.4 เอกสารที่เก็บ (propKey = `org.config.properties`)

อิง JSON payload ใน `src/core/mocks/organizationSettings.sh:38-99`:

```jsonc
{
  "mapSettings":     { "general": {...}, "layers": {...}, "incident": {...}, "staff": {...}, "assignment": {...} },
  "assignmentRules": { "mode": "...", "routingModes": {...}, "allocationMethod": "...", "advancedOptions": {...} }
}
```

---

## 3. Gap: payload vs FE

| payload field | FE type | UI control |
|---|---|---|
| `mapSettings.*` (16 field) | ✅ | ✅ ครบ |
| `assignmentRules.mode`, `allocationMethod` | ✅ | ✅ |
| `routingModes` 7 field ที่เหลือ | ✅ | ✅ |
| **`routingModes.areaBased`** | ❌ ไม่มี | ❌ ไม่มี |
| **`advancedOptions.serviceSubType`** | ✅ มี + มี default | ❌ ไม่มี control |
| `orgId` (อยู่ที่ row ไม่ได้อยู่ใน `propVal`) | type เดิมบังคับ `orgId: string` | type guard เช็ค `orgId` |

สองแถวล่างสุดคือกับดัก: ถ้า rebuild record จาก typed model ค่า `serviceSubType` จะถูกเขียนทับเป็น `"general"` และ guard ที่บังคับ `orgId` จะ reject payload จริงทุกครั้ง → fallback เงียบ

ความต่างเชิงโครงสร้างอีก 2 ข้อ:

- **1 เอกสาร ไม่ใช่ 2 record** — endpoint เดิมแยก map-settings / assignment-rules แต่ backend เก็บรวมกันใน key เดียว
- **Write เป็น whole-document Set** ไม่ใช่ partial PATCH ต่อ section

---

## 4. การตัดสินใจที่ล็อกแล้ว (จากผู้ใช้, 2026-11-18)

| # | ประเด็น | ข้อสรุป |
|---|---|---|
| D1 | `SetConfigPropertyByKey` เป็น upsert | **ใช่** — ใช้ Set เป็นทางเขียนเดียว |
| D2 | ขอบเขตของ `propKey` | unique ต่อ `(orgId, propKey)`; server ผูก org จาก JWT |
| D3 | key ยังไม่มี → response | `status: "-1"` + `data: null` (failure envelope) |
| D4 | โมเดลการบันทึก | **Save เดียวทั้งหน้า — ยิง Set ครั้งเดียว** |
| D5 | field ที่ payload มีแต่ UI ไม่มี | **เพิ่ม control ทั้ง `areaBased` และ `serviceSubType`** |
| D6 | ขอบเขตงาน | เฉพาะ Map + Assignment; Subscription/Cổng entitlements ไม่แตะ |

D4 ทำให้เกิดผลที่ต้องออกแบบต่อ: ฟอร์มทั้งหน้าต้องเป็น state ก้อนเดียว ⇒ Phase 1 ต้องส่ง hook ที่รับ whole document ก่อน แล้ว Phase 2 ย้าย state ขึ้น shell

---

## 5. Phase 1 — Data layer (hooks / store / api / graphql)

เป้าหมายสิ้นสุด Phase 1: **หน้าเดิม (UI ไม่เปลี่ยน, ยังมี 2 ปุ่ม Save) อ่านและบันทึกกับ backend จริงได้** และ `singleAssignOfficer` / `useOrgIncidentMapConfig` ไม่ต้องแก้แม้แต่บรรทัดเดียว

### 1.1 Types — `src/core/types/organization.ts`

- เพิ่ม `areaBased: boolean` ใน `RoutingModes`
- เพิ่ม type ของ row:
  ```ts
  interface ConfigPropertyRow { id: number|string; orgId: string; propKey: string;
    propVal: unknown; createdAt?: string; updatedAt?: string; createdBy?: string|null; updatedBy?: string|null }
  ```
  (`propVal: unknown` โดยเจตนา — ฝั่ง Go คืน decoded JSON หรือ string ก็ได้ ดู `ConfigPropVal.MarshalJSON`)
- เพิ่มเอกสารรวม:
  ```ts
  interface OrgConfigPropertiesDoc { mapSettings: OrgMapSettings; assignmentRules: OrgAssignmentRuleSettings }
  ```
- **แก้ type guard**: `isOrgMapSettings` / `isOrgAssignmentRuleSettings` ต้อง**ไม่**บังคับ `orgId` (payload ไม่มี) — ให้ตรวจ shape ของ section อย่างเดียว; ส่วน `orgId` เติมจาก auth ตอน build record
- คง `OrgMapSettings.orgId` ไว้ (ผู้บริโภคเดิมยังใช้ ไม่ต้องแก้) แต่ถือเป็น field ที่ FE เติมเอง

### 1.2 API — ไฟล์ใหม่ `src/core/store/api/configPropertyApi.ts`

2 endpoint ที่ใช้จริง:

```ts
getConfigPropertyByKey: builder.query<ApiResponse<ConfigPropertyRow>, string>({
  query: propKey => `/config_properties/key/${encodeURIComponent(propKey)}`,
  providesTags: ["OrgSettings"],
}),
setConfigPropertyByKey: builder.mutation<ApiResponse<ConfigPropertyRow>,
  { propKey: string; propVal: unknown }>({
  query: ({ propKey, propVal }) => ({
    url: `/config_properties/key/${encodeURIComponent(propKey)}`,
    method: "POST",
    body: { propVal },
  }),
  invalidatesTags: ["OrgSettings"],
}),
```

- tag `"OrgSettings"` **ต้องลงทะเบียนใน `commonTagTypes` ของ `src/core/store/api/baseApi.ts`** — tag ที่ไม่ลงทะเบียนจะถูกเมินเงียบ ๆ (เคยเกิดกับ `"Store"`, `"Organization"`)
- ไม่ใช้ `"Organization"` ซ้ำ เพราะจะทำให้ write ของ department/command/station refetch settings และกลับกัน
- `overrideExisting: import.meta.env.DEV` ตาม pattern ที่ทุกไฟล์ใน repo ใช้
- ไม่เพิ่ม `createConfigProperty` / `deleteConfigProperty` จนกว่าจะมีคนใช้จริง (Set upsert ครอบคลุมแล้ว)

### 1.3 GraphQL — ไฟล์ใหม่ `src/core/store/api/graphql/configPropertyQueries.ts`

```ts
const GET_CONFIG_PROPERTY_BY_KEY = {
  operationName: "GetConfigPropertyByKey",
  root: "ConfigProperty",
  inputType: "ConfigPropertyKeyInput",
  fields: `status msg data desc`,
};

const SET_CONFIG_PROPERTY_BY_KEY = {
  operationName: "SetConfigPropertyByKey",
  root: "ConfigProperty",
  inputType: "ConfigPropertySetInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CONFIG_PROPERTY = {
  "/config_properties/key/:propKey": {
    GET: GET_CONFIG_PROPERTY_BY_KEY,
    POST: SET_CONFIG_PROPERTY_BY_KEY,
  },
};
```

- register `...GQL_CONFIG_PROPERTY` ใน `GQL_MAP` (`src/core/utils/gqlMapper.ts`)
- **ลบ** 2 entry `/organizations/:orgId/map-settings` และ `/organizations/:orgId/assignment-rules` ออกจาก `organizationQueries.ts` (root `Organization` ไม่มีใน schema — พิสูจน์แล้ว)
- ตรวจว่า mapper สร้าง input ถูก: `POST` → `isMutation` true → `inputSource = body + pathParams` → `{ propVal, propKey }` ตรงกับ `ConfigPropertySetInput` ทั้งสอง field
- ถ้าอนาคตเพิ่ม `/config_properties` (list) หรือ `/config_properties/:id` → **`/config_properties/add` ต้องประกาศก่อน `/:id`** ตามกฎใน `organizationQueries.ts:186-190`
- ⚠️ ต้อง smoke test จริง 1 ครั้งว่า gateway ไม่ตีความ `.` ใน path segment (`/config_properties/key/org.config.properties`) เป็น file extension

### 1.4 Document adapter — ไฟล์ใหม่ `src/cms/utils/orgConfigProperties.ts` (pure, ไม่ import SDK)

- `PROP_KEY = "org.config.properties"` เป็นค่าคงที่เดียว
- `decodePropVal(propVal): unknown` — รับได้ทั้ง object และ string (string → `JSON.parse` แบบมี try/catch)
- `decodeOrgConfigProperties(raw, orgId): OrgConfigPropertiesDoc` — เติม default ทีละ field จาก `buildDefaultOrgMapSettings` / `buildDefaultOrgAssignmentRuleSettings`
- `encodeOrgConfigProperties(rawDoc, doc): Record<string, unknown>` — **merge ทับ raw เดิม ไม่ rebuild จาก typed model** เพื่อไม่ทำ field ที่ FE ยังไม่รู้จักหาย
- คง `mergeOrgMapSettings` / `mergeOrgAssignmentRuleSettings` ไว้ให้ stub และ adapter ใช้ต่อ
- เพิ่ม `areaBased: false` ใน `DEFAULT_ROUTING_MODES` (`src/cms/utils/orgAssignmentRules.ts`)
- unit test: `propVal` เป็น string / เป็น object / field หาย / key แปลกปลอม / `areaBased` default / `serviceSubType` ไม่ถูกทับ

### 1.5 Hooks

โครงที่เสนอ — hook ใหม่ 1 ตัวเป็นแหล่งความจริงเดียว แล้ว hook เดิมกลายเป็น facade:

```
useOrgConfigProperties()            ← query เดียว (GetByKey), save(doc) ยิง Set ครั้งเดียว
  ├─ useOrgMapSettings()            ← facade: loaded = doc.mapSettings
  └─ useOrgAssignmentRules()        ← facade: loaded = doc.assignmentRules
```

- **Phase 1 ยังคง contract เดิมของ facade ทั้งสอง** (`loaded` / `isLoading` / `isMock` / `isSaving` / `save`) เพื่อไม่ต้องแก้ผู้บริโภคที่มีอยู่นอกหน้าตั้งค่า — ตรวจแล้วมี 2 จุด: `src/cms/components/assignOfficer/singleAssignOfficer.tsx:465` และ `src/cms/components/case/formFields/useOrgIncidentMapConfig.ts:27`
- `save(patch)` ของ facade ใน Phase 1 = merge section ที่ตนรับผิดชอบลงใน raw document แล้ว Set ทั้งก้อน (ยังเป็น 2 ปุ่ม Save ตาม UI เดิม)
- **`isLoading` ต้องมาจาก flag ของ query จริงเท่านั้น** ห้ามใส่ literal หรือ condition ที่ตัด term ทิ้ง — เคยทำให้หน้าค้างที่ skeleton ตลอดกาล
- แยกสถานะ: `loadState: "ready" | "empty" | "error"` (D3 ทำให้ "ยังไม่เคยบันทึก" และ "backend พัง" มาในรูป error เหมือนกัน → ใช้ `msg` เป็นตัวช่วยแยก และ**ห้ามกลืน error เงียบ** ให้ส่ง `loadError` ขึ้นไปให้ UI ตัดสิน)
- `enabled` option ของ `useOrgMapSettings` ต้องคงไว้ (assign picker เปิด modal แบบ lazy)
- admin page ใช้ `refetchOnMountOrArgChange` เพื่อลด staleness; runtime readers ไม่ต้อง (เลี่ยง request เกินบนหน้า case)

### 1.6 ลบ endpoint ที่ตายแล้ว

ลบ (หรือ comment ตาม convention ของ repo ถ้าอยากเก็บ history) 4 endpoint ใน `organizationApi.ts` + export ของมัน และลบ GQL entry ที่คู่กัน — ไม่มีผู้ใช้รายอื่น (ตรวจแล้ว: มีแค่ 2 hook ในข้อ 1.5)

### 1.7 Tests

- แก้ `useOrgMapSettings.test.tsx` (mock ชื่อ RTK hook ใหม่)
- แก้ `MapSettingsSection.test.tsx` (mock path ของ hook เท่านั้น)
- เพิ่ม `src/cms/utils/orgConfigProperties.test.ts`
- ไม่แตะ `singleAssignOfficer.test.tsx` ถ้า contract ของ facade ไม่เปลี่ยน (นี่คือเหตุผลที่ต้องคง facade)

### 1.8 Mock mode

คง `VITE_MOCK_API` และ 2 stub ไว้ทั้งคู่ — repo ยังใช้ flag นี้กับหลายฟีเจอร์ การลบเป็นงานแยก ไม่ใช่ผลข้างเคียงของงานนี้

---

## 6. Phase 2 — UI enhancement

### 2.1 ย้าย state ขึ้น shell + Save เดียว (ผลจาก D4)

- `OrganizationSettingsManagement.tsx` ถือ `form: OrgConfigPropertiesDoc`, `loaded`, `isDirty`, Save/Cancel ตัวเดียว (sticky footer)
- `MapSettingsSection` / `AssignmentRulesSection` เปลี่ยนเป็น presentational: รับ `value` + `onChange` ของ slice ตัวเอง
- **ห้ามใช้ `{!isLoading && <Section/>}`** — ต้อง gate ที่ "ยังไม่มีข้อมูลเลย" ไม่ใช่ "กำลัง fetch" (การ refetch หลัง Save ต้องไม่ unmount และไม่ทำ `advancedOpen` / `errors` / ตัวอักษรที่พิมพ์ค้างหาย)
- สลับ tab ต้องไม่ทำให้ค่าที่แก้ไว้หาย (state อยู่ที่ shell แล้ว)
- facade `useOrgMapSettings` / `useOrgAssignmentRules` เหลือไว้เฉพาะผู้บริโภค runtime 2 ตัว หรือลดเป็น read-only

### 2.2 เติม field ที่ขาด (D5)

- `SmartRoutingSettings`: เพิ่ม checkbox **Area Based** — แก้ `MODE_OPTIONS` + i18n `settings.assignment.routing.area_based.{label,desc}` ใน **en / th / cn**
- `AdvancedAssignmentSettings`: เพิ่ม Select **Service Sub-Type** (4 ค่า: `general` / `emergency` / `maintenance` / `inspection`) + i18n 3 ไฟล์

### 2.3 Error / empty UX

- แยก 3 สถานะให้เห็นชัด: ยังไม่เคยบันทึก (แสดง defaults + ปุ่ม Save ได้) / โหลดไม่ได้ (แสดง `msg` + ปุ่ม Retry, **ไม่ใช่ defaults เงียบ ๆ**) / กำลังบันทึก
- **ต้อง disable Save เมื่อ `loadState === "error"`** — ถ้าโหลดไม่ได้ `loaded` จะเป็น schema defaults และ encode ทับลง raw ที่ว่าง ⇒ Save จะเขียน default ทับค่าจริงที่อ่านไม่ออก (มี test ยืนยันพฤติกรรมนี้ไว้ใน `orgConfigProperties.test.ts` แล้ว)
- แทน banner เดิม "not saved to server" ด้วย banner ที่สื่อความจริงใหม่

### 2.4 Provenance + concurrency

- แสดง `updatedAt` / `updatedBy` จาก row (มีใน response แล้ว)
- เอกสารบันทึกแบบ last-write-wins (ไม่มี version column) → ต้องเขียนกำกับไว้ใน UI ว่า Save จะทับค่าล่าสุด และใช้ `refetchOnMountOrArgChange` ตอนเปิดหน้าเพื่อลดโอกาสทับงานคนอื่น

### 2.5 Dirty-state ข้าม tab

- เตือนเมื่อสลับ tab ทั้งที่ `isDirty`

### 2.6 Escalation section

`EscalationRulesSection` + `useEscalationRules` + `escalationRulesStub` + i18n `settings.section.escalation_rules` มีอยู่ครบ แต่ **ไม่ได้ register ใน `SETTINGS_SECTIONS`** (`OrganizationSettingsManagement.tsx:21-35`) = dead code และไม่มี backend
→ ตาม D6: เก็บไว้นอกขอบเขต แต่บันทึกสถานะ "ยังไม่ผูก backend" ให้ชัด หรือแยก ticket เก็บกวาด

---

## 7. จุดที่จะพังง่าย (จากบทเรียนที่บันทึกไว้ใน repo)

| ความเสี่ยง | กันยังไง |
|---|---|
| type guard บังคับ `orgId` → reject payload จริงทุกครั้ง | แก้ guard ให้ตรวจ section shape เท่านั้น (ข้อ 1.1) |
| `propVal` rebuild จาก typed model → `serviceSubType` / key อนาคตหาย | encode = merge ทับ raw (ข้อ 1.4) |
| tag `"OrgSettings"` ไม่ลงทะเบียน → list ไม่ refresh หลัง Save | เพิ่มใน `commonTagTypes` (ข้อ 1.2) |
| ชื่อ endpoint ซ้ำกับที่อื่นใน slice เดียวกัน | grep ชื่อ endpoint ทุกตัวก่อนเพิ่ม (`src/**/store/api/**`) |
| GQL mapping ไม่ตรง schema → พังเฉพาะตอน user เปิดหน้า | `node scripts/validate-gql-map.mjs <url>` ก่อนแก้เก็บ baseline แล้วรันซ้ำหลังแก้ |
| `isLoading` เป็น literal / condition ที่ตัด term → หน้าค้าง skeleton | derive จาก flag ของ query จริง (ข้อ 1.5) |
| `{!isLoading && ...}` unmount ฟอร์มระหว่าง refetch | gate ที่ "ไม่มีข้อมูลเลย" (ข้อ 2.1) |
| `/config_properties/add` ประกาศหลัง `/:id` → ถูก `/:id` กลืน | ประกาศ literal ก่อนเสมอ |
| `t()` เป็น dependency ของ effect | ห้ามใส่ (useTranslation คืนฟังก์ชันใหม่ทุก render) |
| แก้ endpoint แล้วไม่เห็นผลตอน dev | RTK `overrideExisting` + hard reload ก่อนตั้งสมมติฐานใหม่ |

---

## 8. แผนตรวจรับ

| ขั้น | คำสั่ง / วิธี | ต้องได้ |
|---|---|---|
| type | `pnpm build` (`tsc -b`) | ผ่าน รวมถึง test files ที่ถูก exclude |
| lint | `pnpm lint` | ผ่าน |
| test | `pnpm test` | ทุกไฟล์เขียว รวม test ใหม่ |
| GQL mapping | `node scripts/validate-gql-map.mjs https://cc-bff-stg.one-sky.ai/graphql` | จำนวน entry ที่ reject **ไม่เพิ่ม** จาก baseline ก่อนแก้ |
| REST path | ยิง `GET /api/v1/config_properties/key/org.config.properties` ด้วย token จริง | ไม่ 404 เพราะเครื่องหมาย `.` |
| อ่านจริง | เปิดหน้า Map Settings ตอน key ยังไม่มี | แสดง defaults + สถานะ "ยังไม่เคยบันทึก" ไม่ใช่ error ดิบ |
| เขียนจริง | Save ครั้งแรก แล้วอ่านซ้ำ | `Set` upsert สร้าง row; เปิดหน้าใหม่ได้ค่าที่บันทึก |
| round-trip | Save แล้วอ่าน `propVal` ดิบ | ไม่มี field ใดหาย (โดยเฉพาะ `serviceSubType` และ key ที่ FE ไม่รู้จัก) |
| ผู้บริโภคเดิม | เปิดสร้างเคส + assignment picker | radius / คอลัมน์ ETA-TTL ยังทำงานเหมือนเดิม |

---

## 9. ลำดับลงมือที่เสนอ

1. 1.1 → 1.2 → 1.3 (types + api + graphql) แล้ว `pnpm build` ให้ผ่านก่อน
2. 1.4 + test ของ adapter
3. 1.5 + 1.6 (hooks + ลบ endpoint ตาย) แล้ว smoke กับ STAGING
4. 1.7 (แก้ test เดิม) + 1.8 (คง mock)
5. Phase 2 ตามลำดับ 2.1 → 2.2 → 2.3 → 2.4 → 2.5

---

## 10. ผลการตรวจรับ Phase 1 (รันจริง 2026-11-18)

| ขั้น | คำสั่งที่รัน | ผล |
|---|---|---|
| type + bundle | `pnpm build` (`tsc -b` + vite build) | ผ่าน (`✓ built in 1m 45s`) |
| lint | `pnpm exec eslint` บนไฟล์ที่แก้/เพิ่มทั้งหมดใน Phase 1 | ผ่าน ไม่มี output |
| test | `pnpm test` | 72 ไฟล์ / 830 tests ผ่านทั้งหมด (เพิ่ม 20 จาก adapter + 13 ใน hook test) |
| GQL mapping | `node scripts/validate-gql-map.mjs https://cc-bff-stg.one-sky.ai/graphql` | ตรวจ 332 entry; **`configPropertyQueries.ts` และ `organizationQueries.ts` ไม่มีในรายการที่ fail เลย** (ก่อนแก้ `organizationQueries.ts` เคย fail 2 entry จาก root `Organization`) |

รายการที่ validator ยัง fail (34 entry) เป็น backlog เดิมในไฟล์ที่ไม่เกี่ยวกับงานนี้: `cc/store/api/graphql/{callControlQueries,emailQueries}.ts` และ CRM mapping ที่ขอ field pagination ที่ `ApiResponse` ไม่มี

### ไฟล์ที่แตะใน Phase 1

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/core/types/organization.ts` | +`RoutingModes.areaBased`, +`ConfigPropertyRow`, +`isConfigPropertyRow`, +`OrgConfigPropertiesDoc`; type guard ทั้งสองเลิกบังคับ `orgId` และกัน `Array.isArray` |
| `src/core/store/api/configPropertyApi.ts` | ใหม่ — `getConfigPropertyByKey` (GET) + `setConfigPropertyByKey` (POST, upsert), tag `OrgSettings` |
| `src/core/store/api/baseApi.ts` | ลงทะเบียน tag `"OrgSettings"` |
| `src/core/store/api/graphql/configPropertyQueries.ts` | ใหม่ — `GetConfigPropertyByKey` / `SetConfigPropertyByKey` |
| `src/core/utils/gqlMapper.ts` | spread `GQL_CONFIG_PROPERTY` เข้า `GQL_MAP` |
| `src/core/store/api/graphql/organizationQueries.ts` | ถอด 2 entry ที่ชี้ root `Organization` (root ไม่มีใน schema) |
| `src/core/store/api/organizationApi.ts` | ถอด 4 endpoint ที่ตายแล้ว + export |
| `src/cms/utils/orgConfigProperties.ts` | ใหม่ — decode แบบ tolerant / encode แบบ deep-merge ทับ raw / `ORG_CONFIG_PROPERTIES_KEY` |
| `src/cms/utils/orgAssignmentRules.ts` | +`areaBased: false` ใน default |
| `useOrgConfigProperties.ts` | ใหม่ — hook ระดับเอกสาร (`loadState`, `loadError`, `save` ทั้งก้อน) |
| `useOrgMapSettings.ts` | เขียนใหม่เป็น projection; **public contract เดิมไม่เปลี่ยน** (ผู้บริโภค 2 จุดไม่ต้องแก้) |
| `useOrgAssignmentRules.ts` | เขียนใหม่เป็น projection — **ถูกลบใน Phase 2** เมื่อหน้าตั้งค่าไม่ใช้ facade ต่อ section แล้ว (ดู §11) |
| `src/cms/utils/orgConfigProperties.test.ts` | ใหม่ — 20 tests |
| `useOrgMapSettings.test.tsx` | อัปเดต mock มาที่ `configPropertyApi` + เพิ่มชุดทดสอบระดับเอกสาร (13 tests รวมของเดิม) |

### ยังไม่ได้ทำ (ต้องมี token จริง)

- ยิง `GET /api/v1/config_properties/key/org.config.properties` กับ STAGING เพื่อยืนยันว่า gateway ไม่ตีความ `.` เป็น file extension
- Save ครั้งแรกกับ key ที่ยังไม่มี เพื่อยืนยันว่า `SetConfigPropertyByKey` upsert จริง (ข้อ D1 เป็นคำตอบจากผู้ใช้ ไม่ได้ทดสอบด้วยตัวเอง)
- เปิดหน้า Map Settings / Assignment Rules ในเบราว์เซอร์กับ backend จริง

---

## 11. ผลการตรวจรับ Phase 2 (รันจริง 2026-11-18)

| ขั้น | คำสั่งที่รัน | ผล |
|---|---|---|
| type + bundle | `pnpm build` | ผ่าน (`✓ built in 1m 58s`) |
| lint | `pnpm exec eslint src/core/types/organization.ts "src/cms/components/admin/system-configuration/settings"` | ผ่าน ไม่มี output |
| test | `pnpm test` | 72 ไฟล์ / **833 tests** ผ่านทั้งหมด |

ยอด test เพิ่มจาก 830 → 833: +5 ใน `OrganizationSettingsManagement.test.tsx` (ใหม่), −2 ที่ย้ายมาจาก `map/MapSettingsSection.test.tsx` (ไฟล์เดิมถูกลบ เพราะ loading gate ย้ายขึ้น shell แล้ว)

### สิ่งที่ทำใน Phase 2

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `OrganizationSettingsManagement.tsx` | เขียนใหม่ — ถือ `form`/`errors`/dirty/Save ตัวเดียว, banner 3 สถานะ, provenance, `beforeunload` warning, section registry แบบ `render(ctx)` |
| `map/MapSettingsSection.tsx` | เป็น presentational (`value` / `errors` / `onChange`); เหลือ local state เฉพาะ `advancedOpen` + auto-open เมื่อมี `staff.*` error |
| `assignment/AssignmentRulesSection.tsx` | เป็น presentational (`value` / `onChange`) |
| `assignment/SmartRoutingSettings.tsx` | +checkbox **Area Based** |
| `assignment/AdvancedAssignmentSettings.tsx` | +`Select` **Service sub-type** (i18n มีอยู่แล้วทั้ง 3 ภาษา แต่ไม่มี control มาก่อน) |
| `useOrgConfigProperties.ts` | +`savedMeta` (updatedAt/updatedBy) และ `save` คืน `message` ของ server เมื่อล้มเหลว |
| `useOrgMapSettings.ts` | อัปเดต doc — หน้าเว็บไม่ใช้แล้ว เหลือผู้บริโภค runtime 2 จุด |
| `useOrgAssignmentRules.ts` | **ลบ** — 0 consumers หลังหน้าตั้งค่าเปลี่ยนไปใช้ hook ระดับเอกสาร (ถ้าเก็บไว้ จะชวนให้มีคนต่อ Save แยก section กลับมา ซึ่งคือดีไซน์ที่ D4 ปฏิเสธ) |
| `map/MapSettingsSection.test.tsx` | **ลบ** — เคสทั้ง 2 ถูกย้ายไป `OrganizationSettingsManagement.test.tsx` (contract ของมันย้ายขึ้น shell) |
| `core/types/organization.ts` | +`SERVICE_SUB_TYPES` (ไว้ให้ control iterate แทนการ hardcode) |
| `orgMapSettingsStub.ts`, `orgAssignmentRulesStub.ts`, `escalation/useEscalationRules.ts` | แก้ comment ที่อ้างถึง hook/endpoint ที่ไม่มีแล้ว |
| `public/i18n/{en,th,cn}.json` | +`settings.shell.*` (14 คีย์) และ +`settings.assignment.routing.area_based` |

i18n ใส่ด้วยสคริปต์ที่ assert ว่า anchor เจอครั้งเดียว, `JSON.parse` ผ่าน และคีย์ใหม่อยู่จริงในทั้ง 3 ไฟล์ แล้วลบสคริปต์ทิ้ง (ยืนยันซ้ำด้วย `node -e` อีกครั้ง)

### เบี่ยงจากแผน 1 ข้อ (พร้อมเหตุผล)

**2.5 (เตือนเมื่อสลับ tab ทั้งที่ dirty) ไม่ได้ทำตามตัวอักษร** — เพราะ state ย้ายขึ้น shell แล้ว การสลับ tab ไม่ทำให้อะไรหาย การเด้ง confirm ทุกครั้งที่สลับจะเป็นการรบกวนเปล่า ๆ จึงเปลี่ยนเป็น (ก) ตัวบ่งชี้ "มีการแก้ไขที่ยังไม่บันทึก" ใน footer และ (ข) `beforeunload` warning ซึ่งเป็นการป้องกันความเสี่ยงจริง (ปิดแท็บ/ออกจากหน้า)

### ความเสี่ยงที่เหลือ (ต้องดูกับของจริง)

- **ข้อความ "key ยังไม่มี" ต้องตรงกับ `NOT_STORED_PATTERN`** ใน `useOrgConfigProperties.ts` ถ้า BFF ใช้ถ้อยคำอื่น `loadState` จะเป็น `error` และปุ่ม Save จะถูก disable ⇒ tenant ที่ยังไม่เคยตั้งค่าจะบันทึกครั้งแรกไม่ได้ ถ้าเจอ симптомนี้แก้ที่ regex เดียว (เลือกทางนี้เพราะทางกลับกันคือเขียบค่า default ทับข้อมูลจริง)
- `GetConfigPropertyByKey` ตอน key มีค่าแล้ว: ต้องเห็นว่า `data` เป็น row หรือ document (hook รับได้ทั้งสอง) และ `propVal` กลับมาเป็น object
- หน้าเว็บจริงกับ backend จริง (ยังไม่ได้เปิดดูด้วยตา เพราะต้องมี session ที่ล็อกอิน)

---

## 12. สิ่งที่ probe กับ STAGING เปิดเผย (2026-11-18 — ยังไม่ต้องใช้ token)

ยิงด้วย request ที่ไม่แนบ token (หรือแนบ token ที่ใช้ไม่ได้) ไปที่ `https://cc-bff-stg.one-sky.ai`:

1. **host นี้เสิร์ฟเฉพาะ GraphQL** — `/api/v1/*` ตอบ `404 Cannot GET …` แม้แต่ `/api/v1/departments` ที่มีอยู่จริง ⇒ transport REST ไม่ได้ถูกใช้ในสภาพแวดล้อมนี้เลย (ตรงกับ `VITE_USE_GRAPHQL="true"` ทุก `.env*`) และประเด็น "gateway ตีความ `.` เป็น file extension" ไม่มีผลกับเส้นทางนี้
2. **operation / argument / field ที่ map ไว้ถูกต้องทั้งหมด** — ยิง inline document แล้วได้ envelope จริงกลับมา ไม่ใช่ GraphQL `errors` ⇒ `GetConfigPropertyByKey` และ `SetConfigPropertyByKey` มีอยู่จริงตาม input type ที่ introspect ไว้
3. **BFF ตอบ business failure ด้วย HTTP 200 + `status: "401"`** (`msg: "Unauthorized"`, `desc: "Missing Authorization header"`, `data: null`) ส่วน `"-1"` ยังเป็น failure token ตามปกติ
4. **defect ที่เจอจากข้อ 3 (แก้แล้ว):** `readEnvelopeStatus("401")` คืน `"unknown"` ⇒ `hybridBaseQuery` ไม่แปลงเป็น RTK error ⇒ query **resolve** ด้วย `data: null` ⇒ `isError === false` ⇒ hook เดิมอ่านเป็น `loadState: "empty"` ⇒ หน้าโชว์ default และ **เปิดปุ่ม Save** ทั้งที่ความจริงคือ session หมดอายุ/ไม่มีสิทธิ์ (ซึ่งจะเขียนทับค่าจริงทันทีที่กด)
   แก้โดยให้ `useOrgConfigProperties` อ่าน envelope เอง (`status` + `message/desc/msg`) แล้วแยก `empty` / `error` — มี regression test เพิ่ม 1 เคส (`does not present an unauthorised read as an empty document`)
5. **ช่องโหว่ระดับ shared ที่ยังเปิดอยู่:** `readEnvelopeStatus` ไม่รู้จัก token แบบเลข HTTP (401/403/500) ⇒ endpoint อื่นที่พึ่ง `hybridBaseQuery` ก็ "resolve" failure เหล่านี้แบบเดียวกัน ควรมี ticket แยก (แก้ใน util กลางกระทบทุก endpoint — ไม่ควรพ่วงมากับงานนี้)

ผลการตรวจรับหลังแก้: `pnpm build` ผ่าน (1m 51s), `pnpm eslint` ผ่าน, `pnpm test` = 72 ไฟล์ / **835 tests** ผ่าน

### ยังค้างอยู่: ต้องมี bearer token

~~สคริปต์พร้อมแล้ว~~ **รันจริงแล้ว — ดู §13**

---

## 13. ผลทดสอบกับ STAGING ด้วย token จริง (2026-11-18 16:28 +07)

Org `434c0f16-b7ea-4a7b-a74b-e2e0f859f549` · user `wisarud.tec` · รัน `node scripts/smoke-org-settings.mjs --cleanup` สองรอบ (รอบสองเริ่มจาก key ที่ไม่มีอยู่จริง)

```
1) GET smoke key before anything is stored
  status="-1" outcome=failure msg="Failure" desc="Config property not found" data=null
  PASS  the FE's NOT_STORED_PATTERN recognises the server's wording
2) SET smoke key (upsert)      -> status="0" desc="Set successfully" data=object
3) GET smoke key after write   -> status="0", payload shape: row, updatedAt=2026-11-18T09:28:08Z
  PASS  map half / staff interval (number) / areaBased / serviceSubType / unknown key
        / no bookkeeping leak / structurally identical round trip
4) GET real key org.config.properties -> status="-1" desc="Config property not found" data=null
5) Cleanup DeleteConfigProperty -> status="0" desc="Delete successfully"
ALL CHECKS PASSED (exit 0)
```

### ข้อสรุปที่ยืนยันจากของจริง

| ข้อ | ผล |
|---|---|
| D1 `SetConfigPropertyByKey` เป็น upsert | **ยืนยัน** — สร้าง row ใหม่ได้เองโดยไม่มี Create มาก่อน (`desc: "Set successfully"`) |
| รูปร่างของ `data` | **row** `{ id, orgId, propKey, propVal, timestamps }` — `propVal` กลับมาเป็น object ที่ decode แล้ว (โค้ดที่รองรับทั้ง row/document ยังคงไว้เป็นเกราะ) |
| `propVal` round-trip | ตรงกันเชิงโครงสร้าง 100% รวม `routingModes.areaBased`, `advancedOptions.serviceSubType` และ key ที่ FE ไม่รู้จัก (`__smokeMarker`) |
| ลำดับ key ใน `propVal` | **เปลี่ยน** (server re-serialize ด้วย key ที่เรียงแล้ว) ⇒ การเทียบแบบ string ไม่ใช้ได้ ต้องเทียบเชิงโครงสร้าง |
| `orgId` / `updatedAt` ไม่รั่วเข้า `propVal` | ยืนยัน |
| ถ้อยคำ key ที่ยังไม่มี | `status:"-1"` + `desc:"Config property not found"` → `readEnvelopeMessage` เลือก `desc` → ตรงกับ `NOT_STORED_PATTERN` → `loadState: "empty"` → **Save เปิด** ครั้งแรกสร้าง row ✅ |
| ค่าจริงของ org นี้ | ยังไม่มี `org.config.properties` ⇒ หน้าจะแสดง default + banner "ยังไม่มีการบันทึกค่า" และ Save ครั้งแรกจะสร้างให้ |
| `DeleteConfigProperty` | ใช้ได้ (ใช้ใน `--cleanup`) |

### ความเปราะที่ต้องรู้

การแยก "ยังไม่เคยบันทึก" ออกจาก "อ่านไม่สำเร็จ" พึ่ง `desc` ของ BFF (`readEnvelopeMessage` เลือกลำดับ message → desc → msg; ตอนนี้ `desc` = "Config property not found" จึงชนะ `msg` = "Failure" ที่เป็นคำกลาง ๆ)
ถ้า backend เปลี่ยนไปใช้ข้อความกลาง ๆ หน้าเว็บจะ **fail แบบดังและกู้ได้** คือขึ้น banner error + ปิด Save (ไม่ใช่เงียบ ๆ เขียนทับ) และแก้ด้วยการปรับ regex เดียว — เลือกทางนี้เพราะทางกลับกันคือเขียน default ทับข้อมูลจริง

### ที่ยังไม่ได้ทำ

- เปิดหน้าเว็บจริงในเบราว์เซอร์ด้วย session ที่ล็อกอิน (ผมสร้าง session ที่ถูกต้องไม่ได้ — route ถูก gate ด้วย `organization_settings.manage` และต้องมี profile/permission จาก login response จริง)
