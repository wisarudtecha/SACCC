# Organization Settings — Runtime Wiring Plan (ทำให้ค่ามีผลตอนใช้งาน)

สถานะ: **แผน + การตัดสินใจล็อกแล้ว — Phase 0, A, B, C และ D (FE scope) ลงมือครบ (ดู §11–§14) · Live smoke test บน staging ผ่าน (§15) · B6 เลื่อนตาม D14 · เหลือ backend routing engine**
วันที่: 2026-11-19 (rev 8: เพิ่ม §15 ผล live smoke test + การคืนค่า BMA)
ไฟล์ที่เกี่ยวข้อง: `docs/ORG-SETTINGS-Config-Property-Plan.md` (งานเสร็จแล้ว: mockup → settings ที่บันทึก/อ่านได้จริง)

---

## 1. ปัญหาที่แผนนี้แก้

งานก่อนหน้าทำให้ค่า **บันทึกและอ่านกลับได้จริง** (38 leaf value ใน `org.config.properties`) แต่มีผู้บริโภคเพียง 2 hook ⇒ มีผลจริงแค่ **7 จาก 38 ค่า** ที่เหลือ 31 ค่า "เก็บได้แต่ไม่มีใครใช้"

ตรวจด้วยการ grep call site ของ `useOrgMapSettings` / `useOrgConfigProperties` ทั้ง repo (2026-11-18):

| field | ผู้บริโภคตอน runtime | ผล |
|---|---|---|
| `incident.radiusMeters` | `useOrgIncidentMapConfig.ts:28` → `useServiceCenterMatch.ts:74` | ✅ มีผล |
| `incident.showRadius` | เดียวกัน | ✅ มีผล |
| `incident.autoLockServiceCenterOnMatch` | เดียวกัน | ✅ มีผล |
| `assignment.showWorkload` | `singleAssignOfficer.tsx:468` → `officerColumns.ts:128` | ✅ มีผล |
| `assignment.showAssignedCases` | `singleAssignOfficer.tsx:469` → `officerColumns.ts:136` | ✅ มีผล |
| `assignment.enableRecommendRanking` | `singleAssignOfficer.tsx:470` → `officerColumns.ts:65` | ✅ มีผล |
| `staff.etaTtl.applyToAssignmentPicker` | `singleAssignOfficer.tsx:471` → `officerColumns.ts:146` | ✅ มีผล |
| `general.*` (3) | — | ❌ |
| `layers.*` (5) | — | ❌ |
| `staff.showStaff`, `staff.showTrail`, `staff.routing`, `staff.tracking`, `staff.etaTtl` (mode/interval) | — | ❌ |
| `assignmentRules.*` (15) | — | ❌ |

> §5 แก้ความเข้าใจผิดของผมเองในฉบับก่อน: ผมเคยเขียนว่า "tracking ไม่มีกลไกให้ต่อ" — **ผิด** กลไกมีครบอยู่แล้ว (ดู C3)

---

## 2. การตัดสินใจที่ล็อกแล้ว (2026-11-18)

| # | ประเด็น | ข้อสรุป | ผลต่อแผน |
|---|---|---|---|
| **D1** | org override ของ map provider ใช้กับ surface ไหน | **ทุก surface** | แก้ทั้ง 5 ไฟล์ที่อ่าน `API_CONFIG.MAP_PROVIDER` ไม่ใช่เฉพาะหน้าเคส (§3 A3) |
| **D2** | `staff.routing.mode = auto` | **ยังไม่ทำ auto** | FE ต้อง **ปิด/ติดป้าย option `auto`** ของช่อง Staff Routing ในหน้าตั้งค่า ไม่ใช่ปล่อยให้เลือกแล้วไม่มีผล (§5 C2) |
| **D3** | `staff.tracking` | **ใช้ทั้ง websocket และ polling** (backend มีแล้ว) | ต่อค่า org เข้ากับกลไกที่มีอยู่แล้วทั้งสองทาง + ต้องเลือก interval ที่ไม่ถล่ม server (§5 C3) |
| **D4** | `layers.showPlace` | **Places พร้อมใช้งาน** | เปิด toggle (ถอด `disabled`) และต่อค่า org เข้า layer ที่มีอยู่จริง (§4 B9) |
| **D5** | org ตั้ง provider ที่ tenant ไม่มีสิทธิ์/ใช้งานไม่ได้ | **fallback ไป deployment default + แจ้งในหน้าตั้งค่า** — *แก้โดย D16: เฉพาะกรณี "ใช้ไม่ได้ใน build นี้" (`unsupported`); กรณีสิทธิ์เป็นหน้าที่ของ `EntitlementGate`* | `mapRuntimeConfig` ต้องคืนทั้ง "ค่าที่ใช้จริง" และ "เหตุผลที่ fallback" เพื่อให้หน้า settings แสดงได้ (§3 A1/A6) |
| **D6** (เดิม Q1) | `tracking.mode = "manual"` หมายถึงอะไร | **ปิด safety-net poll** แต่คง websocket + ปุ่ม refresh | C3: `manual` = ไม่ตั้ง timer poll เลย; `auto` = poll ตาม `autoIntervalSeconds` (§5 C3) |
| **D7** (เดิม Q2) | `tracking.autoIntervalSeconds` ต่ำสุดที่ยอมรับจริง | **≥ 30s สำหรับ poll** (schema floor 15s ไม่ใช้กับ poll) | C3: ต้อง clamp ที่ 30s — ค่าที่ต่ำกว่าถูกยกขึ้นเป็น 30s ไม่ใช่ปฏิเสธการ Save (§5 C3) |
| **D8** (เดิม Q3) | `staff.routing` ที่ถูก disable ต้องซ่อนหรือโชว์ | **โชว์พร้อม note "ยังไม่เปิดใช้งาน"** | C2: ไม่ซ่อนฟิลด์ แค่ disable + note + i18n 3 ไฟล์ (§5 C2) |
| **D9** (เดิม Q4) | `showPlace` ชนเพดาน 1000 รายการ | **แจ้งเตือน ไม่ตัดเงียบ** | B9: ใช้ `notice` ที่ `usePlaceLayer` มีอยู่แล้ว + แจ้งในหน้าตั้งค่า (§4 B9) |

### 2.1 การตัดสินใจรอบที่ 2 — ล็อกหลังตรวจทานกับโค้ด (2026-11-18)

รอบนี้เกิดจากคำถามที่ตรวจโค้ดจริงแล้วพบว่าคำตอบไม่ตรงกับที่แผนเดิมสมมติไว้ (ดู §2.2) ทุกข้อ
ผู้ใช้ยืนยันแล้ว — ห้ามเปิดถามซ้ำ

| # | ประเด็น | ข้อสรุป | ผลต่อแผน |
|---|---|---|---|
| **D10** | schema default (`showPlace` / `showStaff` / `showTrail` = `true` ใน `DEFAULT_ORG_MAP_SETTINGS`) ขัดกับพฤติกรรมวันนี้ (`false` ในโค้ด) | **ยึดพฤติกรรมเดิม** — เปลี่ยน `DEFAULT_ORG_MAP_SETTINGS` ของ 3 ฟิลด์นี้เป็น `false` เพื่อให้ "ค่าที่ฟอร์มแสดง" = "ค่าที่มีผลจริง" | แก้ `orgMapSettings.ts` + ฟอร์ม/สตับที่อิงค่าเดิม (§4 B2/B3/B9) |
| **D11** | `staff.tracking` default = `manual` และ D6 บอก manual = ไม่มี poll เลย ⇒ org ที่ไม่เคยตั้งค่าจะเสีย safety-net poll (วันนี้ 60s) | **เปลี่ยน default เป็น `auto` + `autoIntervalSeconds: 60`** | แก้ `DEFAULT_ORG_MAP_SETTINGS.staff.tracking` — ไม่ต้องแตะ D6 (ความหมายของ manual ยังเหมือนเดิม) |
| **D12** | `usePlaceLayer` seed `categoryVisibility` เป็นซ่อนทั้งหมด ⇒ เปิด `showPlace` แล้วก็ไม่มี marker | **`showPlace=true` → เปิดทุก category เป็นค่าเริ่มต้น** ผู้ใช้ยัง toggle ได้ตามปกติ | seed `categoryVisibility` ใน `usePlaceLayer` (ไม่ใช่แค่ `showPlace`) |
| **D13** | org `showStaff=false` ชนกับ rule "เคสที่มี staff assigned → เปิด layer" (`hasSettledStaffDefaultRef`) | **org เป็นเพียง seed** — rule เดิมยังทำงานตามเดิม | ไม่ต้องแก้ rule; seed `isStaffVisible` อย่างเดียว |
| **D14** | `layers.allowPlaceIncidentPin` ไม่มี seam จริง (ดู §2.2 ข้อ 3) | **เลื่อน B6 ออกไปเป็นงานต่างหาก** หลัง Phase A–C | ตัด B6 จากลำดับ §10 |
| **D15** | `general.defaultBasemapId` ใช้กับ surface ไหน | **ทุก surface** (ต่อเนื่องจาก D1) รวม dashboard heatmap + choropleth | B8 ต้องแก้ 6 ไฟล์ dashboard/provider map ไม่ใช่แค่หน้าเคส |
| **D16** | ข้อความ fallback `not-entitled` ในหน้าตั้งค่าแสดงไม่ได้ (ฟอร์มอยู่ใน `EntitlementGate`) | **ตัด `not-entitled` ออกจาก `MapProviderFallbackReason`** — ให้ `EntitlementGate` เป็นคำตอบเรื่องสิทธิ์เพียงที่เดียว | A1/A6: เหลือ `"not-configured" \| "unsupported" \| null` |
| **D17** | D9 ต้องใช้ request `useGetPlacesQuery` เพิ่มในหน้าตั้งค่าเพื่อนับเพดาน | **ยอมรับ** — แสดงทั้งใน layer notice และหน้าตั้งค่า | B9 มีงานฝั่ง settings page |
| **D18** | copy ของ Assignment Rules สัญญาว่าระบบจัดเส้นทางอัตโนมัติได้ แต่ยังไม่มี engine | **เพิ่ม note "ยังไม่เปิดใช้งาน (รอ engine)" ใน section** — ไม่ disable ฟิลด์ ไม่แตะค่าที่บันทึกไว้ (ตรงกับ D8 ที่ทำกับ `staff.routing`) | §14.2 |
| **D19** | หลัง Save ค่าที่เกี่ยวกับ Map Provider ยังไม่เปลี่ยนจนกว่าจะ reload | **apply ให้ทันทีหลัง Save + แจ้ง + ปุ่ม Reload ในแผง Config** — ไม่ reload ทั้งหน้าแบบเหวี่ยงแห | §16 |

### 2.2 ข้อแก้ไขเอกสารจากผลตรวจโค้ด (2026-11-18)

ตรวจทุก line reference ใน §3–§5 กับโค้ดจริงแล้ว: **A3 / A2 / C1 / C3 / B9 ตรงทั้งหมด** ส่วนต่อไปนี้
แผนเดิมเขียนไว้ไม่ตรงหรือยังไม่ครบ — แก้แล้วในที่ที่ระบุ

1. **B3 — ปิดคำถามได้แล้ว:** state ที่คุม trail **มีอยู่จริงแยกต่างหาก** คือ `isTrailVisible`
   (`CaseStaffMapField.tsx:214`) พร้อมปุ่มควบคุมของมันเอง (`StaffTrackingSection.tsx:108,130-160`)
   ⇒ `staff.showTrail` = seed ให้ state นี้ ไม่ต้องสร้าง UI ใหม่
2. **B5 — ทำได้แค่ฝั่ง expanded map:** `showLocationInfo` ถูกส่งเฉพาะ expanded instance
   (`AddressMapField.tsx:390`) เพราะ inline map (220-320px) ไม่มีที่ (`mapTypes.ts:395-400`)
   ⇒ ค่า org ใช้ "ระงับ" ได้เท่านั้น ห้ามเปิดให้ inline map
3. **B6 — seam ไม่มีตามที่เขียน:** `onIncidentSelect` (`mapTypes.ts:328`) คือ "คลิกที่ตัวหมุด" ไม่ใช่
   "วางหมุด"; การวางหมุดคือพฤติกรรมปกติของแผนที่ editable (`readOnly`, `mapTypes.ts:191`) และไม่มี
   prop ใดคุมมัน (grep ทั้ง repo) ⇒ ต้องเพิ่ม prop ใหม่ผ่าน 3 provider = งานใหญ่ → D14 เลื่อนออกไป
4. **B7 — ยังไม่มี call site:** ไม่มีไฟล์ใดส่ง `showBasemapSwitcher` เลย (grep ทั้ง repo ไม่กรอง path;
   พบแค่ declaration `mapTypes.ts:211` + อ่านใน 3 provider) ⇒ ต้อง thread prop หรืออ่านที่ provider
5. **A6 / D16 — ข้อความสิทธิ์แสดงไม่ได้:** `MapSettingsSection` ถูกครอบด้วย
   `EntitlementGate feature="entitlement.gis"` ทั้ง section (`MapSettingsSection.tsx:50`)
6. **§5 C3 "หยุด poll เมื่อแท็บไม่ active" เป็นงานใหม่:** วันนี้ effect กันแค่ `enabled && caseId`
   (`useStaffPositions.ts:426-432`) ยังไม่มีการเช็ค visibility ⇒ เพิ่มเข้าไปในงาน C3 (เฉพาะ poll)
7. **`BASEMAP_OPTIONS` เป็น module constant ที่หน้าตั้งค่าเองก็ใช้** (`GeneralMapSettings.tsx:4,57`)
   ⇒ เมื่อ provider กลายเป็น runtime ต้องแยก "options ของ provider ที่ org ตั้งไว้" (สำหรับหน้าตั้งค่า)
   ออกจาก "options ของ provider ที่ใช้จริง"; วันนี้ 3 ชุดเหมือนกัน (`basemaps.ts:40-47`) จึงยัง latent

### หลักการที่ยังต้องยึด

1. **การเลือก provider วันนี้เป็น build-time โดยเจตนา** — `AddressMap.tsx:9-11` ระบุว่าเลือกครั้งเดียวที่ module scope เพื่อไม่โหลด SDK ที่ไม่ได้ใช้ การรองรับ org override จึงต้องเป็น *static map ของ `lazy()` 3 ตัว + เลือกตอน render* (ยัง code-split: โหลดเฉพาะตัวที่เลือก) **ห้าม** เปลี่ยนเป็น import แบบ static ทั้งสามตัว (`@arcgis/core` ~12MB)
2. **"มีผลเมื่อโหลดครั้งถัดไป"** — resolve provider ครั้งเดียวต่อ session ห้าม live-swap กลาง session เพราะ map จะถูก unmount/remount และ sketch/pin ที่ยังไม่ commit จะหาย
3. **`entitlement.gis` ยังต้องเป็น chokepoint** (ดู `AddressMap.tsx:44-51`) — ค่า org ต้องไม่เปิดทางให้ tenant ที่ไม่มี add-on เรียก SDK/routing provider
4. **`null` = inherit** — org ที่ยังไม่เคยตั้งค่า/อ่านไม่ได้ ต้องได้พฤติกรรมเดิมทุกอย่าง
5. **`assignmentRules.*` ไม่ใช่งานของ FE** — ต้องมี routing engine ฝั่ง backend ก่อน (type เขียนไว้เองว่า "no engine consumes these values yet")

---

## 3. Phase A — Map runtime config foundation

เป้าหมาย: `general.mapProvider` / `general.defaultBasemapId` / `general.allowMapStyleChange` มีผลจริง **ทุก surface** (D1)

### A1. Module store กลาง `mapRuntimeConfig.ts` (ใหม่)

`src/cms/components/case/createCase/map/mapRuntimeConfig.ts` — pure module, ไม่ import SDK

```ts
type MapProviderFallbackReason = "not-configured" | "unsupported" | null;  // D16: no "not-entitled"

getMapRuntimeConfig(): {
  provider: MapProvider;                  // ค่าที่ "ใช้จริง" (fallback แล้ว)
  requestedProvider: MapProvider | null;  // ค่าที่ org ตั้งไว้ (null = ไม่ได้ตั้ง)
  fallbackReason: MapProviderFallbackReason;
  basemapId: BasemapOptionId | null;
  allowMapStyleChange: boolean;
}
setMapRuntimeConfig(input) // เขียนได้ครั้งเดียวต่อ session, ครั้งที่สอง ignore + warn (DEV)
```

- **ทำไมต้องเป็น module store**: `basemaps.ts:51,61` และ `routeService.ts:52-54` ถูกเรียกจากที่ไม่มี React context และ `AddressMap.tsx` ต้องรู้ค่าก่อน render `ProviderMap`
- **D5 อยู่ในนี้**: ถ้า `requestedProvider` ใช้ไม่ได้ (unsupported ใน build นี้ / tenant ไม่มีสิทธิ์) → คืน deployment default + `fallbackReason` ให้หน้า settings แสดง

### A2. Bootstrap provider (ใหม่)

`MapRuntimeConfigBootstrap.tsx` — render `null`
- เรียก `useOrgConfigProperties()` ครั้งเดียว **ใต้ `<AuthProvider>`**
- **ห้ามเรียก hook ที่อ่าน context ในคอมโพเนนต์ที่ provide context นั้น** (บทเรียนเดิม: เคย crash ด้วย `useAuth` ใน `AuthProvider`)
- ระหว่างรอ/อ่านไม่ได้ → ไม่ต้องทำอะไร (store คืน deployment default)

### A3. เปลี่ยนจุดที่อ่าน provider (5 ไฟล์ / 6 จุด — D1 = ทั้งหมด)

| ไฟล์:บรรทัด | เปลี่ยนเป็น |
|---|---|
| `AddressMap.tsx:17-22` | static map `{ arcgis: lazy(...), longdo: lazy(...), maptiler: lazy(...) }` + เลือกด้วย `getMapRuntimeConfig().provider` (memoise ให้ identity คงที่ต่อ session) |
| `DispatchHeatmap.tsx:19-21` | `getMapRuntimeConfig().provider` |
| `CaseAreaChoroplethMap.tsx:33-35` | เดียวกัน |
| `basemaps.ts:51` (options) และ `:61` (preference key) | เดียวกัน + key ต้องรวม orgId (A4) |
| `routeService.ts:52-54` | เดียวกัน |

> `api.ts:178-180` ยังคงเป็น "deployment default" — ไม่แก้

### A4. localStorage key ของ basemap

`basemaps.ts:61` วันนี้คือ `cms.map.basemap.${provider}` → ต้องเป็น `cms.map.basemap.${orgId}.${provider}` ไม่งั้นสอง org บนเครื่องเดียวกันใช้ค่าเลือก basemap ปนกัน (เหตุผลเดียวกับที่ `configPropertyApi` ใส่ orgId ใน cache key)

### A5. Tests

- `mapRuntimeConfig.test.ts` — default = deployment · org override ชนะ · `setOnce` ไม่ทับ · provider ที่ไม่รองรับ → fallback + `fallbackReason` · `null` → inherit
- ตรวจ `pnpm build` ว่า chunk ของแต่ละ SDK ยังแยกและขนาดไม่บวมเทียบก่อนแก้

### A6. UI แจ้ง fallback (D5)

ในหน้า settings (section Map) เพิ่มข้อความเมื่อ `fallbackReason !== null`:
- `unsupported` → "provider ที่เลือกไม่รองรับใน environment นี้ ระบบใช้ค่า default ของ deployment"
- ~~`not-entitled`~~ → **ตัดออกตาม D16**: สิทธิ์เป็นเรื่องของ `EntitlementGate` ที่ครอบ section อยู่แล้ว
- `not-configured` → ไม่ต้องแสดงข้อความ (เป็นสภาพปกติของ org ที่ยังไม่ตั้งค่า)
- ต้องมี i18n ครบ 3 ไฟล์ (`en` / `th` / `cn`)

---

## 4. Phase B — Layers / Staff / Basemap

ทุกข้อคือ "ค่า org กลายเป็นค่าเริ่มต้นของ state ที่มีอยู่แล้ว" ไม่ใช่สร้าง UI ใหม่

| # | field | seam ที่มีอยู่ | วิธีต่อ |
|---|---|---|---|
| B1 | `layers.showBoundaries` | `BoundaryMapField.tsx:167` → `useBoundarySelection({ startAllHidden: manualOnly })` | seed `startAllHidden` จาก `!showBoundaries` (ผู้ใช้ยัง toggle ต่อได้) |
| B2 | `staff.showStaff` | `CaseStaffMapField.tsx:197` `useState(false)` | `useState(orgValue)` + คง toggle เดิม |
| B3 | `staff.showTrail` | **ยืนยันแล้ว:** `CaseStaffMapField.tsx:214` `useState(false)` = `isTrailVisible` (คุม `showTrail` ที่ `:803`, ปุ่มอยู่ที่ `StaffTrackingSection.tsx:108`) | seed `isTrailVisible` จาก org value; `useStaffTrails(staff, isStaffLayerOn)` (`:246`) เป็นแค่ตัวสะสม ไม่ต้องแก้ |
| B4 | `layers.showSearch` | `AddressMapField.tsx:249-250` `resolvedSearchMode` | org value เป็นค่าเริ่มต้นของ mode |
| B5 | `layers.showAddressCoordinates` | `AddressMapField.tsx:390` ส่ง `showLocationInfo` แบบ literal | ส่งจาก org value |
| B6 | `layers.allowPlaceIncidentPin` | **ไม่มี seam** — `onIncidentSelect` (`mapTypes.ts:328`) คือคลิกที่ตัวหมุด ไม่ใช่การวางหมุด (ดู §2.2 ข้อ 3) | **เลื่อนออกไปตาม D14** — แยกเป็นงานต่างหากหลัง Phase A–C; ห้าม hijack `onIncidentSelect` |
| B7 | `general.allowMapStyleChange` | `mapTypes.ts:211` `showBasemapSwitcher` | ส่งจาก org value |
| B8 | `general.defaultBasemapId` | `basemaps.ts` + `mapTypes.ts:205` `basemapId` | ลำดับ: localStorage → org → provider default |
| **B9** | `layers.showPlace` (**D4 = เปิดใช้**) | `usePlaceLayer.ts:75` `const [showPlace, setShowPlace] = useState(false)` — layer นี้ fetch ข้อมูลจริงผ่าน `useGetPlacesQuery` (`placesApi`) และมี category filter/selection ครบ | เปลี่ยน seed เป็น org value **+ seed `categoryVisibility` เป็นเปิดทุก category ตาม D12** (ไม่งั้นเปิด layer แล้วไม่มี marker) **และ** ถอด `disabled` + ลบ comment ที่ล้าสมัยใน `LayerMapSettings.tsx:13-27` ("the Place map layer … does not exist yet" — ไม่จริงแล้ว) |

**หมายเหตุ B9 (D9 — ห้ามตัดเงียบ):** `usePlaceLayer.ts:25` มี `PLACE_FETCH_LIMIT = 1000` และคอมเมนต์ยอมรับว่า org ที่มี Place เกินจะถูกตัดเงียบ ๆ — ต้องแก้เป็น "แจ้ง" ทั้งสองที่:
1. **ใน layer:** `usePlaceLayer` มี `notice` mechanism อยู่แล้ว (`:141-149` คืนข้อความเมื่อ error / ไม่มีข้อมูล) ⇒ เพิ่มกรณี "แสดงไม่ครบ N รายการ" โดยคำนวณจาก `allMarkers.length === PLACE_FETCH_LIMIT` (ต้องถือว่า = limit แปลว่าอาจถูกตัด) และส่ง `isTruncated` ออกไปให้ UI ใช้ได้
2. **ในหน้าตั้งค่า:** แสดงตัวเลขจำนวน Place ที่โหลดได้เทียบเพดาน เพื่อให้ admin รู้ว่าต้องลด/แบ่งหมวด ไม่ใช่สงสัยว่าข้อมูลหาย (i18n 3 ไฟล์)

---

## 5. Phase C — Intervals / Routing / Tracking

### C1. `staff.etaTtl.autoIntervalSeconds` (พร้อมทำ)

cadence วันนี้ hardcode ไว้ 2 ที่:
- `OfficerEtaTtlCell.tsx:25` `TTL_TICK_MS = 30_000` (ใช้ที่ `:42`)
- `StaffEtaTtlSection.tsx:16` `TTL_TICK_MS = 30_000` (ใช้ที่ `:29`)

⇒ ย้ายไปเป็น hook เดียว `useEtaTtlTickMs()`:
- `mode === "manual"` → 30s (พฤติกรรมเดิม)
- `mode === "auto"` → `autoIntervalSeconds` (schema บังคับ ≥ 15s ผ่าน `AUTO_INTERVAL_MIN_SECONDS`)
- ค่าผิดรูป/ต่ำกว่าเพดาน → ถอยไป 30s (ห้ามให้เป็น 0/NaN เพราะจะกลายเป็น busy loop)

### C2. `staff.routing.mode` (D2 = ยังไม่ทำ auto, D8 = โชว์พร้อม note)

`useOfficerRouteSolves.ts:7` ระบุ decision เดิมว่า *"a MANUAL per-row 'Calculate' button (never automatic — Decision #3)"* และมี cooldown 10s ที่ `:30`

**งานที่ต้องทำ (D2 + D8):**
- **disable** ฝั่ง `auto` ของ switch ใน `StaffMapSettings` (ไม่ซ่อนฟิลด์ — D8) พร้อม note "ยังไม่เปิดใช้งาน"
- ค่าที่บันทึกไว้เป็น `auto` (ถ้ามีจาก payload เก่า) ต้องยัง **อ่าน/เก็บได้** ไม่ถูกเขียนทับเป็น `manual` เงียบ ๆ — แสดงสถานะว่าบันทึกไว้แต่ยังไม่ทำงาน
- i18n 3 ไฟล์ (`en` / `th` / `cn`)

ถ้าอนาคตจะเปิด: ต้องมีเพดาน (จำนวนแถว/รอบ, cooldown เดิม, หยุดเมื่อ modal ปิด) เพราะ 1 solve = 1 paid routing call

### C3. `staff.tracking` (D3 = websocket + polling — **มีอยู่แล้วทั้งคู่**)

**แก้ความเข้าใจผิดของผมในฉบับก่อน:** tracking ไม่ได้ขาดกลไก — `useStaffPositions.ts` ทำครบแล้ว:

| กลไก | ที่อยู่ | ค่าที่ hardcode |
|---|---|---|
| websocket: `MOB` event, `eventType` = `UNIT_SELECT` / `STATUS` / `TRACKING` | contract: `mobEvents.ts:26-28` (ที่มา `src/cms/mocks/MOB.sh`), ตัว consume: `useStaffPositions.ts:234` ผ่าน `useWebSocket().onMessage` | — |
| polling: safety-net refetch ของ `/dispatch/{caseId}/units` (`dispatch.ts:35`) | `useStaffPositions.ts:33` (`useGetUnitQuery`) | `ROSTER_SAFETY_REFETCH_MS = 60_000` (`:72`) |
| buffered flush ของ TRACKING patch | `:58` | `LIVE_POSITION_FLUSH_MS = 1_000` |
| debounce หลัง STATUS / UNIT_SELECT | `:47` | `MOB_RECONCILE_DEBOUNCE_MS = 2_000` |
| cooldown ปุ่ม refresh | `:40` | `STAFF_REFRESH_COOLDOWN_MS = 10_000` |
| re-evaluate ความเก่าของ marker | `:81` | `STALE_RECHECK_MS = 30_000` |

⇒ งานของแผนนี้คือ **ต่อค่า org เข้ากับ knob ที่มีอยู่** ไม่ใช่สร้าง transport ใหม่:

- **`tracking.mode = "auto"`** → เปิด safety-net poll และใช้ `tracking.autoIntervalSeconds` แทน `ROSTER_SAFETY_REFETCH_MS` (D6)
- **`tracking.mode = "manual"`** → **ปิด safety-net poll ทั้งหมด** (ไม่ตั้ง timer) เหลือ websocket `MOB` + ปุ่ม refresh ที่มีอยู่ (D6)
- **เพดานล่างของ poll = 30s (D7)** — schema ยอมรับ 15s แต่ 1 รอบ = 1 request ต่อเคสที่เปิดอยู่ ⇒ clamp ค่าที่ต่ำกว่า 30s ขึ้นเป็น 30s **ที่จุดใช้งาน** (ไม่ปฏิเสธการ Save และไม่แก้ค่าใน DB) แล้วแสดงค่า effective ให้ admin เห็น
- ค่า `LIVE_POSITION_FLUSH_MS` (1s), `MOB_RECONCILE_DEBOUNCE_MS` (2s), `STAFF_REFRESH_COOLDOWN_MS` (10s), `STALE_RECHECK_MS` (30s) **ไม่ผูกกับ org setting** — เป็น internal cadence ของกลไก ไม่ใช่ค่าที่ admin ควรตั้ง
- ต้องหยุด timer เมื่อแท็บไม่ active / layer ปิด (ไฟล์นี้ยึดหลัก "idle map runs no timers" ที่ `:55-58, 68-71` — รักษาไว้)

---

## 6. Phase D — Assignment Rules (backend-first)

`assignmentRules.*` ทั้ง 15 ค่า (mode, routingModes 8 ตัวรวม `areaBased`, allocationMethod, advancedOptions 5) **ไม่มี engine ฝั่ง FE และไม่ควรมี**

FE ทำได้ตอนนี้:
- แสดง/บันทึกค่า (เสร็จแล้ว)
- validation ขั้นต่ำให้สอดคล้อง (วันนี้ `SmartRoutingSettings.tsx` แค่เตือนเมื่อ `mode = automatic` แต่ไม่เลือก criterion — ไม่ block Save)
- ปิด/เปิด section ตาม entitlement ถ้ามี add-on ที่เกี่ยวข้อง

ต้องรอ backend:
- routing engine ที่อ่าน `org.config.properties`
- นิยาม semantics ของ `combineWithAnd`, `areaBased`, `caseTypeSubTypes`

---

## 7. คำถามเปิด — ปิดครบทั้งสองรอบ (2026-11-18)

**รอบ 1:** Q1–Q4 → ล็อกเป็น **D6–D9** (§2)
**รอบ 2:** 8 คำถามจากการตรวจโค้ด → ล็อกเป็น **D10–D17** (§2.1) พร้อมข้อแก้ไขเอกสาร 7 ข้อใน §2.2

ไม่มีคำถามค้างสำหรับ Phase A–C สองเรื่องที่ยัง **ไม่ใช่งานของแผนนี้**:
- **Phase D** (routing engine) — รอ backend
- **B6** (`allowPlaceIncidentPin`) — เลื่อนตาม D14 ต้องได้คำตอบเรื่องความหมายของค่าก่อน (ระงับการวางหมุดทั้งแผนที่? หรือเฉพาะ drag?) ซึ่งเป็นคำถามสินค้า ไม่ใช่คำถามเทคนิค

---

## 8. แผนตรวจรับต่อ phase

| Phase | ตรวจอะไร | วิธี |
|---|---|---|
| A | provider เปลี่ยนตาม org จริง **ทุก surface** | ตั้ง `mapProvider=longdo` → reload → เปิดหน้าเคส + dispatch heatmap + choropleth → ตรวจ network ว่าโหลด chunk Longdo และ **ไม่** โหลด ArcGIS |
| A | ไม่มี org record → พฤติกรรมเดิม | ลบ key ด้วย `node scripts/smoke-org-settings.mjs --cleanup` → reload → ยังใช้ `VITE_MAP_PROVIDER` |
| A (D5) | provider ที่ใช้ไม่ได้ → fallback + แจ้ง | ตั้ง provider ที่ build นี้ไม่รองรับ → ต้องเห็นข้อความในหน้าตั้งค่า และแผนที่ยังทำงานด้วย default |
| A | bundle | `pnpm build` เทียบขนาด chunk ของแต่ละ SDK ก่อน/หลัง (ห้ามรวมเป็นก้อนเดียว) |
| B | toggle มีผลจริงทีละตัว | ตั้งค่า → reload → เห็น layer/control ตามค่า; unset → กลับ default |
| B9 | Place layer + เพดาน (D9) | ตั้ง `showPlace=true` → เปิดหน้าเคส → marker Places ขึ้นโดยไม่ต้องกด toggle เอง; org ที่มี Place ≥ 1000 → เห็น notice ว่าแสดงไม่ครบ (ไม่ใช่เงียบ) |
| C1 | interval | ตั้ง `etaTtl auto/60` → tick ไม่ใช่ 30s และค่าที่ < 15 ถูกปฏิเสธ |
| C2 | routing ที่ยังไม่เปิด (D2/D8) | ฟิลด์ Staff Routing ยัง **มองเห็น** แต่ฝั่ง `auto` disabled + note "ยังไม่เปิดใช้งาน"; org ที่มีค่า `auto` ค้างอยู่ต้องแสดงค่านั้น ไม่ถูกเขียนทับ |
| C3 | tracking `auto` | ตั้ง `tracking auto/60` → เห็น request `/dispatch/{caseId}/units` ทุก ~60s ขณะ layer เปิด, หยุดเมื่อ layer ปิด/แท็บไม่ active; MOB `TRACKING` ยังขยับ marker ทันที |
| C3 | tracking `manual` (D6) | ตั้ง `tracking manual` → **ไม่มี** request poll เลย ขณะ layer เปิด; websocket + ปุ่ม refresh ยังทำงาน |
| C3 | เพดาน poll (D7) | ตั้ง `tracking auto/15` → ยิงจริงที่ 30s และหน้าตั้งค่าแสดงค่าที่ใช้จริงว่า 30s |
| ทั้งหมด | entitlement | login tenant ที่ไม่มี `entitlement.gis` → ต้องไม่มีการเรียก SDK/routing provider แม้ค่าถูกตั้งไว้ |

---

## 9. ความเสี่ยงและบทเรียนที่เกี่ยวข้อง

- **`AddressMap` เป็น module-scope โดยเจตนา** (bundle) — ถ้าแก้เป็น runtime แล้วเผลอ import SDK ทั้งสามแบบ static จะทำให้ bundle บวม ~12MB
- **provider เปลี่ยน = remount** — resolve ครั้งเดียวต่อ session
- **ห้ามใส่ `t` จาก `useTranslation` เป็น dependency ของ effect** และ **ห้ามใส่ `isLoading` แบบ literal** — ทั้งคู่เคยทำให้หน้า settings ค้าง/loop
- **อย่าใช้ `{!isLoading && ...}` กับ subtree ที่ถือ state** — map ถือ view/sketch state หนักกว่า form มาก
- **`basemaps.ts:51` คำนวณ `BASEMAP_OPTIONS_BY_PROVIDER[...]` ที่ module scope** — ถ้า provider กลายเป็น runtime ต้องตรวจว่าไม่มี top-level constant อื่นค้างค่าจาก provider เดิม
- **เงิน**: 1 route solve = 1 paid call, 1 poll = 1 request ⇒ ทุก interval ในแผนนี้ต้องมีเพดาน
- **ไฟล์นี้ยึดหลัก "idle map runs no timers"** — timer ที่เพิ่มต้องหยุดเมื่อไม่มีคนดู

---

## 10. ลำดับที่เสนอ

0. **Phase 0 — แก้ default ให้ตรงกับของจริง (D10/D11)** — `DEFAULT_ORG_MAP_SETTINGS`:
   `layers.showPlace` / `staff.showStaff` / `staff.showTrail` → `false`, `staff.tracking` →
   `{ mode: "auto", autoIntervalSeconds: 60 }` + unit test ที่ล็อกค่าเหล่านี้ (Phase B/C จะ seed
   จากค่านี้ จึงต้องถูกก่อน)
1. **Phase A ทั้งก้อน (A1–A6)** — ให้ `mapProvider` / `defaultBasemapId` / `allowMapStyleChange` มีผลทุก surface + banner fallback (เฉพาะ `unsupported` ตาม D16)
2. **Phase B1, B4, B5, B7, B9** (seam ชัด + D4 ปลดล็อกแล้ว + D12 category) → B8 (ทุก surface ตาม D15) → B2 (seed only, D13) → B3 (seed `isTrailVisible`)
   — **B6 ไม่อยู่ในลำดับแล้ว (D14)**
3. **Phase C1** (ETA/TTL tick) → **C2** (disable ฝั่ง `auto` + note ตาม D2/D8)
4. **Phase C3** — ต่อค่าเข้า `useStaffPositions` + clamp 30s ตาม D6/D7 + เพิ่มการหยุด poll เมื่อแท็บไม่ active (§2.2 ข้อ 6)
5. **Phase D** รอ backend routing engine · **B6** แยกงานต่างหากหลัง D14

---

## 11. บันทึกการลงมือ — Phase 0 + Phase A (2026-11-18)

### 11.1 Phase 0 (D10/D11)

| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `src/cms/utils/orgMapSettings.ts` | `DEFAULT_ORG_MAP_SETTINGS`: `layers.showPlace` → `false`, `staff.showStaff` → `false`, `staff.showTrail` → `false`, `staff.tracking` → `{ mode: "auto", autoIntervalSeconds: 60 }` + comment อธิบายว่าค่า default คือ "พฤติกรรมที่มีอยู่จริง" ไม่ใช่ "ค่าที่อยากให้เป็น" |
| `src/cms/utils/orgConfigProperties.test.ts` | แก้ expectation ของ "ค่าผิดชนิด → ตกไปใช้ default" จาก `true` เป็น `false` ตาม default ใหม่ (เจตนาของเทสต์คือ "ตกไป default" ไม่ใช่ "default ต้องเป็น true") |
| `src/cms/utils/orgMapSettings.test.ts` (ใหม่) | ล็อกค่า default ทั้งชุดไว้ไม่ให้ถูกแก้เงียบ ๆ ในอนาคต |

### 11.2 Phase A (A1–A6)

| # | ไฟล์ | สิ่งที่ทำ |
|---|---|---|
| A1 | `map/mapRuntimeConfig.ts` (ใหม่) | pure store: `provider` / `requestedProvider` / `fallbackReason` / `deploymentDefaultProvider` / `basemapId` / `allowMapStyleChange` / `orgId` / `settled`; `setOnce` ต่อ org, เปลี่ยน org ได้ (กันค่า tenant ปนกัน), เขียนซ้ำค่าเดิม = no-op เงียบ ๆ |
| A1 | `map/useMapRuntimeConfig.ts` (ใหม่) | `useSyncExternalStore` binding (อ่านตอน render ได้) |
| A2 | `map/MapRuntimeConfigBootstrap.tsx` (ใหม่) + `core/providers/AuthProvider.tsx` | bootstrap ที่ render null, mount เป็นลูกของ `AuthContext.Provider` ข้าง `EntitlementsBootstrap`; ทุก path settle (ไม่มี org / loading / ready / empty / error) |
| A3 | `map/AddressMap.tsx` | static `lazy()` 3 ตัว + เลือกด้วย `switch` ตอน render (ยัง code-split) + placeholder จนกว่า `settled` |
| A3 | `dashboard/map/heatmap/DispatchHeatmap.tsx`, `dashboard/map/CaseAreaChoroplethMap.tsx` | เหมือนกัน (choropleth คง guard `BOUNDARY_SOURCE === "local"` เดิม) |
| A3 | `map/basemaps.ts` | `BASEMAP_OPTIONS` (module const) → `basemapOptionsFor(provider)` + `getBasemapOptions()` |
| A3 | `map/services/routeService.ts` | provider จาก `getMapRuntimeConfig().provider` |
| A4 | `map/basemaps.ts` | preference key = `cms.map.basemap.${orgId}.${provider}` (ไม่มี org = key เดิม) — **ไม่ migrate key เก่า** เพราะจะลากค่าของ tenant หนึ่งไปให้อีก tenant |
| A4 | `map/useBasemapPreference.ts` (ใหม่) + `map/AddressMapField.tsx` | **แก้บั๊กที่เจอระหว่างทำ A4:** `AddressMapField` เคยอ่าน preference ด้วย `useState(readBasemapPreference)` ตอน mount แต่ key ต้องรู้ org+provider ที่ settle แล้ว ⇒ cold deep-link เข้าหน้าเคสจะอ่าน key ผิด แล้ว "จำค่า basemap ที่ผู้ใช้เลือกไม่ได้" เงียบ ๆ; hook ใหม่เลื่อนการอ่านจนกว่า `settled` แล้วอ่านซ้ำครั้งเดียวบน transition |
| A6 | `settings/map/GeneralMapSettings.tsx` + `public/i18n/{en,th,cn}.json` | แถบเตือนเมื่อ `fallbackReason === "unsupported"` (คีย์ `settings.map.field.map_provider.fallback_unsupported`) + dropdown basemap ใช้ options ของ provider ที่ **เลือกไว้** ไม่ใช่ตัวที่ใช้จริง |
| A5 | `map/mapRuntimeConfig.test.ts`, `map/basemaps.test.ts` (jsdom), `map/MapRuntimeConfigBootstrap.test.tsx` (jsdom), `map/useBasemapPreference.test.tsx` (jsdom) | 24 เทสต์: default/override/fallback ต่อเหตุผล/setOnce/เปลี่ยน org/notify/no-op/key ต่อ org/catalogue อ่านตอนเรียก/bootstrap settle ทุก path/อ่าน preference หลัง settle (regression ของบั๊กใน A4) |

**การตีความที่ต้องรู้:** `unsupported` หมายถึง "build นี้วาดด้วย provider นั้นไม่ได้" = provider ไม่รู้จัก หรือไม่มี API key ของมัน
(`LONGDO_API_KEY` / `MAPTILER_API_KEY`) — ArcGIS นับว่าใช้ได้เสมอ เพราะ basemap ของมันถอยไปใช้ legacy id ที่ไม่ต้องใช้ key ได้

### 11.3 สิ่งที่ตรวจแล้ว / ยังไม่ได้ตรวจ

- ✅ `npx tsc -b` → 0 error
- ✅ `npx eslint` ไฟล์ที่แก้ → 0 problem
- ✅ `npx vitest run` → **77 ไฟล์ / 864 เทสต์ ผ่านทั้งหมด** (ก่อนเริ่มงานมี 75 ไฟล์ / 855 เทสต์)
- ✅ `pnpm build` ผ่าน (build สุดท้ายหลังแก้ A4) และ **code splitting ยังอยู่**: `ArcgisAddressMap` 107.67 KB,
  `LongdoAddressMap` 40.73 KB, `MapTilerAddressMap` 44.91 KB เป็น chunk แยกของตัวเอง, entry `index` = 2,693.73 KB
  เท่าเดิมทั้งก่อนและหลังเพิ่ม bootstrap/store, `dist/index.html` preload เฉพาะ `index` + `vendor`
  (ไม่มี SDK ตัวใดถูกโหลดแบบ eager)
- ❌ **ยังไม่ได้ทดสอบสดในเบราว์เซอร์** ตาม §8 (ตั้ง `mapProvider=longdo` → reload → ดู network ว่าโหลด chunk Longdo
  และไม่โหลด ArcGIS) — ต้องมี session ที่ล็อกอินได้
- ⚠️ **ไม่มีตัวเลข before/after ของขนาด chunk**: `HEAD` (e5ce405) อยู่ก่อนงาน org-settings ทั้งก้อน (ไฟล์ส่วนใหญ่
  ยัง uncommitted) การ stash เพื่อ build baseline จึงไม่ใช่ "ก่อน Phase A" ที่ถูกต้อง — ตรวจได้แค่ว่า "ยังแยก chunk
  และไม่มี SDK เข้า eager bundle" ซึ่งเป็นข้อที่ §8 ห้ามละเมิด

---

## 12. บันทึกการลงมือ — Phase B (2026-11-19)

### 12.1 หลักที่ใช้ทั้ง phase

ทุกข้อคือ **"ค่า org เป็นค่าเริ่มต้น ไม่ใช่ล็อก"** และ implement ด้วย `override ?? orgValue`
**ไม่ใช่** `useState(orgValue)` — เพราะ component เหล่านี้ mount ก่อนที่เอกสาร settings จะถูกอ่าน
(บทเรียนเดียวกับบั๊ก A4) ถ้า seed ตอน mount ค่าจะติดอยู่ที่ default ตลอดกาล

| # | ไฟล์ | สิ่งที่ทำ |
|---|---|---|
| B1 | `map/BoundaryMapField.tsx` | `startAllHidden: resolveBoundaryStartAllHidden({ manualOnly, showBoundaries })` — `useBoundarySelection` re-seed เมื่อ prop เปลี่ยนอยู่แล้ว จึงรับค่าที่มาทีหลังได้ |
| B2 | `map/staff/CaseStaffMapField.tsx` | `isStaffVisible = staffVisibleOverride ?? staff.showStaff` (rule "เคสที่มีคนรับแล้ว" ยังชนะ ตาม D13 — เขียน override) |
| B3 | `map/staff/CaseStaffMapField.tsx` | `isTrailVisible = trailVisibleOverride ?? staff.showTrail` (seam ที่แผนเดิมไม่ยืนยัน — ยืนยันแล้วใน §2.2 ข้อ 1) |
| B4 | `map/AddressMapField.tsx` | `resolveSearchMode({ searchMode, readOnly, showSearch })` |
| B5 | `map/AddressMapField.tsx` | `showLocationInfo` ของ **expanded map เท่านั้น** = `layers.showAddressCoordinates` (inline map ยังปิดตายด้วยเหตุผลด้านพื้นที่) |
| B7 | `map/AddressMap.tsx` | `showBasemapSwitcher: props.showBasemapSwitcher ?? allowMapStyleChange` — แก้ที่ provider switch จุดเดียว เพราะไม่มี caller ส่ง prop นี้เลย (§2.2 ข้อ 4) |
| B8 | `map/basemaps.ts` | `readBasemapPreference()` = browser choice → **org default** → provider default (validate กับ catalogue ของ provider ที่ใช้จริงทุกขั้น) |
| B8 | dashboard maps 6 ไฟล์ (`arcgis`/`longdo`/`maptiler` × choropleth + heatmap) | เลิกใช้ `DEFAULT_BASEMAP_ID` ตรง ๆ เปลี่ยนเป็น `readBasemapPreference()` ตาม D15 |
| B9 | `map/place/usePlaceLayer.ts` | `showPlace`/`categoryVisibility` = override ?? org (D12: เปิดทุก category เมื่อ org เปิด layer), เพิ่ม `isTruncated` + `loadedCount` + notice "แสดงไม่ครบ" (D9) |
| B9 | `settings/map/LayerMapSettings.tsx` | ถอด `disabled` + comment "layer ยังไม่มี" ออก, แสดงจำนวน Place เทียบเพดาน + คำเตือนเมื่อชนเพดาน (D17) |
| — | `map/mapControlDefaults.ts` (ใหม่) | pure helper 3 ตัว (`resolveBoundaryStartAllHidden`, `resolveSearchMode`, `isPlaceLayerTruncated`) + `PLACE_FETCH_LIMIT` ย้ายมาที่นี่ เพื่อให้หน้าตั้งค่าและ hook อ้างเพดานเดียวกัน |

**i18n ที่เพิ่ม (ครบ 3 ไฟล์):** `case.display.map_place_truncated`, `settings.map.field.show_place.count`,
`.count_loading`, `.count_error`, `.truncated_warning`

### 12.2 Regression ที่เจอระหว่างทำ

`LayerMapSettings` เรียก `useGetPlacesQuery` เพิ่ม ⇒ `OrganizationSettingsManagement.test.tsx` (ที่ render
component นี้แบบไม่ mount Redux `<Provider>`) พังทั้งไฟล์ด้วย `could not find react-redux context value`
แก้โดยเพิ่ม `vi.mock("@/cms/store/api/placesApi")` ในเทสต์นั้น (พฤติกรรมของ query ถูกคุมที่ที่ข้อมูล Places
ถูกใช้จริงอยู่แล้ว) — บันทึกเป็นบทเรียนใน `.agents/skills/anti-regression/SKILL.md`

### 12.3 สิ่งที่ตรวจแล้ว

- ✅ `npx tsc -b` → 0 error · `npx eslint` ไฟล์ที่แก้ → 0 problem
- ✅ `npx vitest run` → **79 ไฟล์ / 880 เทสต์ ผ่านทั้งหมด** (ก่อน Phase B: 77 ไฟล์ / 864 เทสต์; เพิ่ม **16** เทสต์:
  `mapControlDefaults` 9, `usePlaceLayer` 4, `basemaps` +3)
- ✅ `pnpm build` ผ่าน · provider chunks ยังแยก (Arcgis 107.67 KB / Longdo 40.73 KB / MapTiler 44.91 KB) ·
  entry 2,694.37 KB (จาก 2,693.73 KB = +0.64 KB สำหรับ org-default wiring)
- ❌ ยังไม่ได้ทดสอบสดในเบราว์เซอร์เช่นเดิม (§8) — ต้องมี session ที่ล็อกอินได้

---

## 13. บันทึกการลงมือ — Phase C (2026-11-19)

### 13.1 หลักที่ใช้

ทั้งสามข้อคือ **"cadence มาจาก org แต่ต้องมีเพดาน"** — และทั้งสองค่ามีความหมายต่างกันจนใช้ resolver
ตัวเดียวกันไม่ได้ (ดู header ของ `staffCadence.ts`): `etaTtl` เป็น **display-only** (manual ยังต้อง tick),
`tracking` เป็น **request จริง** (manual = ไม่ตั้ง timer เลย)

| # | ไฟล์ | สิ่งที่ทำ |
|---|---|---|
| C1 | `map/staff/staffCadence.ts` (ใหม่) | `resolveEtaTtlTickMs`: manual → 30s · auto → interval · ค่าเสีย/ต่ำกว่า 15s → 30s (กัน busy loop) |
| C1 | `map/staff/useEtaTtlTickMs.ts` (ใหม่) | hook เดียวที่อ่าน `staff.etaTtl` จากเอกสาร |
| C1 | `workload/OfficerEtaTtlCell.tsx`, `map/staff/StaffEtaTtlSection.tsx` | ลบ `TTL_TICK_MS = 30_000` ที่ hardcode ไว้ทั้งสองที่ ใช้ hook แทน (เพิ่ม `tickMs` เป็น dep ของ effect) |
| C2 | `map/AutoManualField.tsx` | `AutoManualField` รับ `autoDisabled` + `note`; `IntervalField` รับ `note` |
| C2 | `settings/map/StaffMapSettings.tsx` | Staff Routing: ตัวเลือก `auto` ถูก disable + note "ยังไม่เปิดใช้งาน" (D8 — **ไม่ซ่อนฟิลด์** ค่า `auto` ที่บันทึกไว้ยังแสดง) |
| C2 | `core/components/form/Select.tsx` | เพิ่ม `Option.disabled` (เดิม placeholder ปิดได้อย่างเดียว ไม่มี way ปิดรายตัวเลือก) |
| C3 | `map/staff/staffCadence.ts` | `resolveTrackingPollMs`: manual → **null (ไม่มี timer)** · auto → interval clamp ≥ 30s (D7) · ค่าเสีย → 60s (ค่าเดิม) + `resolveTrackingEffectiveSeconds` สำหรับแสดงค่าจริง |
| C3 | `map/staff/useStaffPositions.ts` | poll effect ใช้ `trackingPollMs` + `isDocumentVisible`; `ROSTER_SAFETY_REFETCH_MS` ชี้ไปที่ `TRACKING_DEFAULT_POLL_MS` (ค่าเดิม 60s) |
| C3 | `core/hooks/useDocumentVisible.ts` (ใหม่) | หยุด poll เมื่อแท็บไม่ active (เดิมกันแค่ `enabled && caseId` — §2.2 ข้อ 6) |
| C3 | `settings/map/StaffMapSettings.tsx` | แสดง "ค่าที่ใช้จริง" ของ tracking interval เมื่อ mode = auto (D7: admin ที่กรอก 15 ต้องเห็นว่าใช้จริง 30) |

**i18n ที่เพิ่ม (ครบ 3 ไฟล์):** `settings.map.field.staff_routing.auto_unavailable`,
`settings.map.field.staff_tracking.effective_interval`

### 13.2 Test ที่เพิ่ม (ทั้งหมด 21 เทสต์)

- `map/staff/staffCadence.test.ts` — 12: manual/auto, floor 15s ของ ETA/TTL, ค่า 0/ติดลบ/NaN ต้องไม่กลายเป็น busy loop, D6 (manual = null), D7 (clamp 30s), ค่า effective
- `map/staff/useStaffPositions.test.tsx` — 4 (fake timers): auto/60 ยิงทุก 60s · auto/15 ยิงที่ 30s · manual ไม่ยิงเลย · แท็บซ่อนแล้วหยุด
- `core/hooks/useDocumentVisible.test.tsx` — 4: visible/hidden/กลับมา, และ **ไม่ re-render เมื่อ event ไม่เปลี่ยนค่า**
- `map/staff/useEtaTtlTickMs.test.tsx` — 2: อ่าน `etaTtl` ไม่ใช่น้อง (`routing`/`tracking` ตั้งค่าต่างกันไว้เพื่อให้จับได้ถ้าอ่านผิดตัว)
- `settings/OrganizationSettingsManagement.test.tsx` — +1: ตัวเลือก `auto` ของ Staff Routing ถูก disable แต่ฟิลด์ยังอยู่ (D8)

### 13.3 สิ่งที่ตรวจแล้ว

- ✅ `npx tsc -b` → 0 error · `npx eslint` ไฟล์ที่แก้ → 0 problem
- ✅ `npx vitest run` → **83 ไฟล์ / 903 เทสต์ ผ่านทั้งหมด** (ก่อน Phase C: 79 ไฟล์ / 880 เทสต์)
- ✅ `pnpm build` ผ่าน · provider chunks ยังแยก · entry 2,695.38 KB (จาก 2,694.37 KB = +1.01 KB)
- ❌ ยังไม่ได้ทดสอบสดในเบราว์เซอร์ตาม §8 (ต้องมี session) — ข้อที่ควรตรวจด้วยตาก่อนปิดงาน:
  ตั้ง `tracking auto/15` → Network ควรมียิงทุก 30s (ไม่ใช่ 15) และหน้าตั้งค่าต้องแสดง 30

---

## 14. บันทึกการลงมือ — Phase D (FE scope) (2026-11-19)

### 14.1 ขอบเขตจริงของ Phase D

§6 ระบุว่า `assignmentRules.*` (15 ค่า) **ไม่มี engine ฝั่ง FE และไม่ควรมี** ⇒ งาน FE มีสามข้อ
ตรวจแล้วได้ผลดังนี้

| ข้อใน §6 | สถานะ |
|---|---|
| แสดง/บันทึกค่า | เสร็จไปแล้วตั้งแต่ Phase 2 (ไม่ต้องแตะ) |
| validation ขั้นต่ำให้สอดคล้อง | **ทำในรอบนี้** — ดู 14.3 |
| เปิด/ปิด section ตาม entitlement ถ้ามี add-on | **ไม่มี add-on ที่เกี่ยวข้อง** — `featureSurfaces.ts:139-140` ระบุไว้แล้วว่า "No CAD (computer-aided dispatch) surface yet: assignment is manual (workload ranking)" ⇒ ไม่มีอะไรให้ gate (บันทึกไว้ ไม่เขียนโค้ด) |
| routing engine + semantics ของ `combineWithAnd` / `areaBased` / `caseTypeSubTypes` | **รอ backend** — ห้ามเดา (ดู 14.2) |

### 14.2 copy สัญญาสิ่งที่ยังไม่มี — **ล็อกแล้วเป็น D18**

`settings.assignment.field.mode.help` เขียนว่า *"Turn Automatic on to let the system route cases based
on selected criteria"* และ `routing_criteria.help` เขียนว่า *"the system will use to route cases
automatically"* — แต่ยังไม่มี engine อ่านค่าเหล่านี้ ผู้ดูแลที่เปิด Automatic จึงถูกบอกว่าจะได้ระบบ
จัดเส้นทางอัตโนมัติ ซึ่งยังไม่เกิดขึ้นจริง

**ทางเลือกที่พิจารณา แล้วเลือกข้อ 1 (D18):**
1. ✅ **เพิ่ม note "ยังไม่เปิดใช้งาน (รอ engine)" ใน section** — ตรงกับ D8 ที่ทำกับ `staff.routing`
   (ฟิลด์ยังแก้ได้ ค่ายังบันทึกได้ ไม่แตะข้อมูลเดิม) → implement ด้วย i18n key
   `settings.assignment.field.mode.engine_unavailable` ครบ 3 ไฟล์
2. ❌ disable ฝั่ง Automatic เหมือน D8 เป๊ะ ๆ — org ที่บันทึก `automatic` ไว้จะดูเหมือนตั้งค่าผิด
   และต้องตัดสินเรื่องการเขียนทับค่าเดิม ซึ่งไม่มีเหตุผลรองรับ
3. ❌ ไม่ทำอะไร — ปล่อยให้ copy โกหกต่อไปจนกว่า backend จะเสร็จ

### 14.3 Validation ที่เพิ่ม (ทำแล้ว)

| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `cms/utils/orgAssignmentRules.ts` | `hasRoutingCriterion()` + `validateOrgAssignmentRules()` — `mode = automatic` ที่ไม่เลือก criterion เลย = error (`settings.assignment.validation.no_criteria_selected` ซึ่งมี copy อยู่แล้วครบ 3 ภาษา) · `manual` ที่ไม่เลือก = ถูก (เป็น default เดิม) · **ไม่ validate** `combineWithAnd`/`areaBased`/`caseTypeSubTypes` เพราะเป็น semantics ของ backend |
| `settings/assignment/SmartRoutingSettings.tsx` | รับ `errorKey` · ข้อความเตือนเดิมโชว์แค่ตอน `mode === "automatic"` (เดิมโชว์ใน manual ด้วย ทั้งที่ manual ไม่ต้องใช้ criterion = เตือนผิด) · แดงเมื่อเป็น error จาก Save · เพิ่ม note `engine_unavailable` ใต้ช่องโหมด (D18) |
| `settings/assignment/AssignmentRulesSection.tsx` | ส่ง `errors` ต่อลงไป |
| `settings/OrganizationSettingsManagement.tsx` | `handleSave` validate **ทั้งสองครึ่ง** ของเอกสาร (หนึ่ง Save เขียนทั้งก้อน) แล้ว focus แท็บที่ผิด (`map` ก่อน เพราะเป็นแท็บเริ่มต้น) |

> **ถูกแทนที่ 2026-11-19 — contract เปลี่ยน:** `assignmentRules.mode` และอีก 4 criterion
> (`locationBased` / `department` / `caseType` / `caseTypeSubTypes`) ถูกถอดออกจาก payload,
> เพิ่ม `unitProperty`, และ auto/manual ย้ายไปเป็นราย case sub-type ใน `assignmentMode[]`
> ⇒ `validateOrgAssignmentRules` ถูกลบ · `hasRoutingCriterion` เหลือ 4 key · shell validate
> เฉพาะครึ่ง map · กติกา "Automatic ต้องมี criterion" จะกลับมาในรูปใหม่พร้อม `assignmentMode[]`
> ดู `docs/ORG-SETTINGS-Assignment-Mode-Survey.md` §9

### 14.4 Test

- `cms/utils/orgAssignmentRules.test.ts` (ใหม่) — **7**: `hasRoutingCriterion` นับ criterion ทีละตัวได้,
  ไม่นับ `combineWithAnd`/`caseTypeSubTypes` เป็น criterion, automatic+ไม่มี → error, automatic+มี → ผ่าน,
  manual+ไม่มี → ผ่าน (default), manual+มี → ผ่าน
- `settings/OrganizationSettingsManagement.test.tsx` — **+3** (รวมเป็น 9): automatic+ไม่มี criterion →
  Save ไม่ถูกเรียก + แท็บ assignment ขึ้น + เห็นเหตุผล · automatic+มี → บันทึกได้ · manual+ไม่มี → บันทึกได้

### 14.5 Regression ที่เจอระหว่างทำ

`SmartRoutingSettings` เรียก `useGetCaseTypesSubTypesQuery` (RTK) — เทสต์ของหน้า settings เดิมไม่เคย
render แท็บ assignment เลย (เพราะเปิดที่แท็บ map) พอ Phase D ทำให้ Save ที่ผิดพาไปแท็บ assignment
เทสต์จึงพังด้วย `could not find react-redux context value` แก้ด้วย `vi.mock("@/cms/store/api/serviceApi")`
— **เป็นตระกูลเดียวกับบทเรียน "A presentational component that gains a query gains a Provider
requirement" เป๊ะ ๆ** แต่รอบนี้ trigger คือ "subtree ที่ไม่เคยถูก render ถูก render ครั้งแรก" ไม่ใช่
"component ได้ query ใหม่" ⇒ เพิ่มบรรทัดขยายบทเรียนเดิม (ไม่สร้างใหม่)

### 14.6 สิ่งที่ตรวจแล้ว

- ✅ `npx tsc -b` → 0 error · `npx eslint` ไฟล์ที่แก้ → 0 problem
- ✅ `npx vitest run` → **84 ไฟล์ / 913 เทสต์ ผ่านทั้งหมด** (ก่อน Phase D: 83 ไฟล์ / 903 เทสต์)
- ✅ `pnpm build` ผ่าน · entry 2,695.87 KB (จาก 2,695.38 KB = +0.49 KB)
- ❌ ยังไม่ได้ทดสอบสดในเบราว์เซอร์ (§8) — ข้อที่ควรตรวจ: เปิด Automatic โดยไม่เลือก criterion → กด Save
  ต้องไม่บันทึก และต้องเด้งไปแท็บ Assignment Rules พร้อมข้อความสีแดง

---

## 15. Live smoke test — รันจริงบน staging (2026-11-19)

> ขั้นตอนทดสอบด้วยมือฉบับเต็ม (38 เคส พร้อมเกณฑ์ผ่าน/หลักฐาน/การคืนค่า) อยู่ที่
> **`docs/ORG-SETTINGS-Manual-Test-Steps.md`** — ส่วนด้านล่างคือสิ่งที่รันจริงแล้วในรอบนี้

สภาพแวดล้อม: `pnpm dev` (vite, mode development) → `http://localhost:5173` → BFF staging
`cc-bff-stg.one-sky.ai` · ผู้ใช้ `admin` องค์กร `BMA` (`orgId 434c0f16-…`) · เบราว์เซอร์ Playwright

### 15.1 ผลตรวจ (ผ่านทั้งหมด)

| ข้อ | วิธีตรวจ | ผล |
|---|---|---|
| **A3/D1** provider override + code splitting | ตั้ง `general.mapProvider = longdo` → บันทึก → reload → เปิดหน้า `/cms/case/creation` | `getMapRuntimeConfig()` = `{provider:"longdo", requested:"longdo", fallbackReason:null, deploymentDefault:"arcgis"}` และ network **โหลดเฉพาะ `LongdoAddressMap.tsx`** — `ArcgisAddressMap.tsx` ไม่ถูก request เลย · แผนที่ขึ้นเครดิต "Longdo Map © NuMAP" |
| **A3 (กลับทาง)** คืนค่าเดิม | คืน `mapProvider = arcgis` → reload | กลับมาโหลด `ArcgisAddressMap.tsx` (Longdo ไม่ถูก request) |
| **B4** `layers.showSearch` | หน้าเดิม | มีช่องค้นหา "ค้นหาสถานที่" |
| **B7** `general.allowMapStyleChange` | หน้าเดิม | มีปุ่ม "รูปแบบแผนที่" |
| **B9/D12** `layers.showPlace` + categories | หน้าเดิม | ปุ่ม "สถานที่" ถูกกดไว้แล้ว (`aria-pressed=true`) และ **มี marker 7 จุด** โดยไม่ต้องกด toggle เอง |
| **C2/D8** `staff.routing` = auto | หน้าตั้งค่า → แท็บ Map | `<option value="auto" disabled>` + note "โหมดอัตโนมัติยังใช้งานไม่ได้…" |
| **D18** engine note | หน้าตั้งค่า → แท็บ Assignment Rules | note ขึ้นครบ "การจัดเส้นทางอัตโนมัติยังไม่เปิดใช้งาน - engine ยังอยู่ระหว่างพัฒนา…" |
| **D** validation | เปิด Automatic โดยไม่เลือก criterion → กด Save | **ไม่มี request ใหม่** (lastSaved ยังเป็นค่าเดิม), ไม่มี toast สำเร็จ, ข้อความขึ้น**สีแดง** (`text-red-500`), แท็บ active = Assignment Rules |
| **C3/D6** `tracking = manual` | อ่าน `resolveTrackingPollMs(stored)` จากเอกสารจริง | `null` → ไม่มี safety-net timer |
| **C1** `etaTtl = manual` | เดียวกัน | `30000` ms (พฤติกรรมเดิม) |
| **C3/D7** clamp 30s | ตั้ง `tracking = auto/15` → บันทึก → reload | DB เก็บ **15** (ไม่เขียนทับ) แต่ effective = **30000 ms (30s)** และหน้าตั้งค่าแสดง "ค่าที่ใช้จริง: รีเฟรชทุก 30 วินาที (ต่ำสุด 30 วินาที)" |

### 15.2 ยังไม่ได้ตรวจด้วยตา (และเหตุผล)

- **B1** (`showBoundaries`) / **B5** (`showAddressCoordinates`) — ต้องเปิด "ดูแผนที่ขนาดใหญ่" และกดเปิดชั้นข้อมูลทีละตัว;
  ค่าเหล่านี้ seed ผ่าน hook เดียวกับ B4/B7/B9 ที่ตรวจผ่านแล้ว จึงถือว่าความเสี่ยงต่ำ
- **B2/B3** (`showStaff` / `showTrail`) — แผนที่ staff อยู่ใน modal ของหน้า case detail ซึ่งในเคสที่ทดลองไม่เปิด
  (ปุ่ม "มอบหมายงานให้เจ้าหน้าที่" ไม่เปิด modal บนเคสที่ assigned แล้ว) → ยังไม่ได้ยืนยันด้วยตา
  แต่มี unit test (`useStaffPositions.test.tsx`) คุม cadence ไว้แล้ว
- **การนับ request ของ poll จริง** ไม่ได้นับด้วย network log (GraphQL ยิงที่ `/graphql` จุดเดียว) — ตรวจด้วยค่า
  resolver ที่อ่านจากเอกสารจริงแทน ซึ่งเป็นค่าเดียวกับที่ hook ใช้ตั้ง timer

### 15.3 ข้อสังเกตจาก environment (ไม่เกี่ยวกับงานนี้)

- เปิดหน้าแผนที่ของ BMA จะเห็น **404 จาก object storage** หลายรายการ (`…/area-org-tree/<orgId>/TH/{20,21,22,…}.json.gz`,
  `BMA.json.gz`, `Roadside/center.json.gz`) และ log `Boundary geometry … is not a polygon ring set` — เป็นปัญหา
  ข้อมูล boundary ของ BMA บน staging ไม่ใช่ regression ของ Phase A–D

### 15.4 การคืนค่า (ทำแล้ว)

BMA ถูกแก้ระหว่างทดสอบ 2 ค่า (`general.mapProvider = longdo`, `staff.tracking = auto/15`) และ**คืนค่าเดิมแล้ว**
(`arcgis` / `manual`+`null`) พร้อมตรวจ documento เทียบกับค่าที่บันทึกไว้ก่อนเริ่ม (`mapSettingsRestored: true`,
ต่างกันเฉพาะ key order) — `updatedBy` ของแถวจะเป็น `admin` เพราะเป็นการเขียนทับ ไม่ใช่ของเดิม `wisarud.tec`






---

## 16. บันทึกการลงมือ — ให้ค่ามีผลทันทีหลัง Save (D19, 2026-11-19)

### 16.1 ปัญหาจริงมีแค่ 3 ค่า ไม่ใช่ "หลายค่า"

`setConfigPropertyByKey` มี `invalidatesTags: ["OrgSettings"]` และ `getConfigPropertyByKey`
`providesTags` เดียวกัน ⇒ **หลัง Save ค่าที่อ่านผ่าน `useOrgMapSettings()` ถูก refetch เองและมีผลทันที**
(incident radius, layers.search/boundaries/coordinates, staff.showStaff/showTrail, showPlace+categories,
etaTtl tick, tracking poll)

ค่าที่ค้างเพราะ **จงใจ freeze ไว้ต่อ session** (`mapRuntimeConfig`) มีแค่
`general.mapProvider`, `general.allowMapStyleChange`, `general.defaultBasemapId`
บวก cache ของ provider ใน `routeService` (`servicePromise`)

### 16.2 ทางเลือกที่ตัดสิน (D19)

| | วิธี | ผล |
|---|---|---|
| A | reload ทั้งหน้าหลัง Save | ❌ **พังใน mock mode** (`orgMapSettingsStub` เก็บใน memory ⇒ reload ทิ้งค่าที่เพิ่งบันทึก) + ทิ้ง toast สำเร็จ/แท็บ/ disclosure ที่ผู้ใช้กำลังดูอยู่ |
| **B** | **apply ค่าที่ freeze ทันทีหลัง Save** | ✅ เลือกใช้ |
| C | คงเดิม + note/pุ่ม reload | ✅ ใช้เฉพาะ *บางส่วน* ตามที่ผู้ใช้ขอ: note + ปุ่ม "โหลดหน้าใหม่" ในแผง Config |

### 16.3 สิ่งที่ทำ

| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `map/mapRuntimeConfig.ts` | `applyMapRuntimeConfig()` — เขียนทับ config ของ org เดิมได้ (ข้อยกเว้นเดียวของกฎ resolve-once) + `registerMountedMap()` นับจำนวน provider switch ที่ mount อยู่ · ถ้ามีแผนที่ mount → คืน `"deferred"` **ไม่สลับ provider ใต้แผนที่ที่เปิดอยู่** |
| `map/services/routeService.ts` | `resetRouteService()` — ล้าง `servicePromise` ไม่งั้นแผนที่วาด Longdo แต่ Calculate ยังยิง ArcGIS |
| `map/applyMapSettingsToSession.ts` (ใหม่) | orchestrator: apply + reset route cache เมื่อ apply จริง (แยกไฟล์เพราะ `routeService` import store → เรียกกลับจะ circular) |
| `map/AddressMap.tsx`, `dashboard/.../DispatchHeatmap.tsx`, `dashboard/.../CaseAreaChoroplethMap.tsx` | ลงทะเบียน `registerMountedMap()` ตอน mount (สาม provider switch เท่านั้น) |
| `settings/OrganizationSettingsManagement.tsx` | หลัง `result.ok` → `applyMapSettingsToSession(...)` · ถ้าได้ `"deferred"` → toast เตือนให้ reload · ส่ง `isDirty` ลง section |
| `settings/map/MapSettingsSection.tsx` → `GeneralMapSettings.tsx` | note อธิบายผลของการเปลี่ยน provider + ปุ่ม **"โหลดหน้าใหม่"** (disable ขณะมีค่าที่ยังไม่บันทึก เพื่อไม่ให้กดแล้วค่าหาย) |
| `public/i18n/{en,th,cn}.json` | `settings.map.field.map_provider.effect_note` / `.reload` / `.reload_disabled_hint` / `settings.shell.map_apply_deferred` |

**หมายเหตุกัน regression:** ปุ่ม reload นี้ **ไม่ใช่** cache invalidation — mutation ทุกตัวยังต้อง
`invalidatesTags` ตามปกติ (บทเรียน "A page reload is not a cache invalidation") ปุ่มนี้มีไว้เฉพาะค่า
ที่ถูก freeze ต่อ session ตามดีไซน์ และเขียน comment กำกับไว้ในโค้ดแล้ว

### 16.4 Test

- `map/mapRuntimeConfig.test.ts` +5 — apply เขียนทับ org เดิมได้ · notify subscribers · `unchanged` ไม่ emit ·
  `deferred` ขณะมีแผนที่ mount (provider ไม่เปลี่ยน) · apply ได้อีกครั้งเมื่อ unmount ครบ
- `map/applyMapSettingsToSession.test.ts` (ใหม่) 5 — apply provider/basemap/style · reset route cache
  เมื่อเปลี่ยนจริง · ไม่ reset เมื่อ `unchanged` · `deferred` แล้วไม่ reset · provider ที่ใช้ไม่ได้ →
  fallback + ยัง reset
- `settings/OrganizationSettingsManagement.test.tsx` +1 — กด Save แล้ว `getMapRuntimeConfig().provider`
  เปลี่ยนเป็นค่าที่บันทึกทันที (ไม่ต้อง reload)

### 16.5 สิ่งที่ตรวจแล้ว

- ✅ `npx tsc -b` → 0 error · `npx eslint` → 0 problem
- ✅ `npx vitest run` → **85 ไฟล์ / 924 เทสต์ ผ่านทั้งหมด** (ก่อนงานนี้: 84/913)
- ✅ `pnpm build` ผ่าน · entry 2,697.40 KB (+1.39 KB)
- ❌ ยังไม่ได้กดทดสอบสดในเบราว์เซอร์รอบนี้ — ขั้นตอนอยู่ใน `docs/ORG-SETTINGS-Manual-Test-Steps.md` (T-A10/T-A11)

---

## 17. Live smoke test รอบ 2 — apply-on-save / note / reload (2026-11-19)

ทดสอบ T-A10 และ T-A11 ด้วย user เดิม (`admin` @ `BMA`, `orgId 434c0f16-…`) บน dev server

### 17.1 ผลตรวจ (ผ่านทั้งสองเคส)

| เคส | วิธีตรวจ | ผล |
|---|---|---|
| **T-A11** note + ปุ่ม reload | แท็บ Map → ใต้ช่องผู้ให้บริการแผนที่ | มี note *"การเปลี่ยนผู้ให้บริการแผนที่จะมีผลกับแผนที่ที่จะเปิดหลังจากบันทึก …"* และปุ่ม **"โหลดหน้าใหม่"** |
| **T-A11** ปุ่มถูก disable ขณะ dirty | เปลี่ยน `รูปแบบแผนที่เริ่มต้น` (ฟอร์ม dirty) | ปุ่ม `disabled = true` + tooltip *"บันทึกหรือยกเลิกการแก้ไขก่อน - การโหลดหน้าใหม่จะทำให้ค่าที่แก้ไว้หาย"* · กลับมา clean → กดได้ |
| **T-A10** Save แล้วมีผลทันที ไม่ต้อง reload | baseline = `longdo` → เปลี่ยนเป็น `arcgis` → **บันทึก** → SPA navigate (`pushState` + `popstate`) ไป `/cms/case/creation` | **ไม่มีการ reload** (sentinel บน `window` ยังอยู่) แต่แผนที่เปลี่ยนเป็น **Esri** ทันที และ network โหลด **`ArcgisAddressMap.tsx` ตัวเดียว** (ไม่มี `LongdoAddressMap`) |
| **T-A10 (กลับทาง/คงอยู่)** | คืน provider = `longdo` → บันทึก → **full reload** | แผนที่กลับเป็น **"Longdo Map © NuMAP"** และโหลด `LongdoAddressMap.tsx` ตัวเดียว |

### 17.2 ยังไม่ได้ทดสอบสด (ครอบด้วย unit test)

- **`deferred` path** (มีแผนที่ mount อยู่ตอนกด Save → ไม่สลับ provider + toast เตือน) — ทดสอบด้วยมือไม่ได้
  เพราะหน้า Settings ไม่มีแผนที่; ครอบด้วย `mapRuntimeConfig.test.ts` และ `applyMapSettingsToSession.test.ts`

### 17.3 ข้อควรระวังในการ probe (เจอในรอบนี้)

การ `await import("/src/…/mapRuntimeConfig.ts")` จาก DevTools **อาจได้โมดูลคนละ instance** เมื่อ Vite โหลด
โมดูลของแอปด้วย query `?t=<timestamp>` (HMR) — รอบนี้ probe อ่านได้ `settled: false, orgId: null` ทั้งที่แอป settle แล้ว
⇒ **ห้ามสรุปว่า bootstrap ไม่ทำงานจาก probe แบบนี้** ให้ยืนยันด้วยพฤติกรรม (chunk ที่โหลด / เครดิตบนแผนที่ /
sentinel ที่ต้องรอดข้าม SPA navigation) หรืออ่านเอกสารผ่าน RTK store (ซึ่งยิง request จริงและได้ค่าจากเซิร์ฟเวอร์)

### 17.4 สถานะข้อมูล BMA

- **baseline ตอนเริ่มทดสอบไม่ตรงกับที่ผมคืนไว้เมื่อรอบก่อน**: เริ่มรอบนี้พบ `general.mapProvider = longdo`,
  `staff.tracking = { mode: "manual", autoIntervalSeconds: 60 }`, `layers.showPlace = false`
  （รอบก่อนหน้าผมคืนเป็น `arcgis` / `manual`+`null`) ⇒ มีการแก้ค่าหลังจากนั้นโดยผู้ใช้อื่น
- รอบนี้ผมแก้เฉพาะ `general.mapProvider` (longdo → arcgis → **longdo**) และ**คืนค่าเป็น `longdo` ตาม baseline
  ที่พบตอนเริ่ม** เรียบร้อย · ค่าอื่นไม่ถูกแตะ (`showPlace` ยังเป็น `false` ตามที่พบ) · `updatedBy = admin`

---

## 18. Live smoke test — ค่าที่ตั้งไว้มีผลตอนใช้งานจริง (2026-11-19, BMA / admin)

ทดสอบ **พฤติกรรม** ไม่ใช่หน้าตั้งค่า · **ไม่มีการแก้ค่าใด ๆ** (อ่านอย่างเดียว)

ค่าที่ BMA ตั้งไว้ตอนทดสอบ: `mapProvider=longdo` · `allowMapStyleChange=true` · `showPlace=false` ·
`showSearch/showBoundaries/showAddressCoordinates/allowPlaceIncidentPin=true` · `incident=900/true/true` ·
`staff.showStaff/showTrail=true`, `routing=manual`, `etaTtl=manual + applyToPicker=true`, `tracking=manual` ·
`assignment.show*=true, enableRecommendRanking=true` · ไม่มี `assignmentMode[]`

### 18.1 ผ่าน (เห็นผลจริงบนจอ)

| ค่า | หลักฐาน |
|---|---|
| `general.mapProvider=longdo` | หน้า `/cms/case/creation` เครดิตแผนที่ = **"Longdo Map © NuMAP, OpenStreetMap, Terms"** และ `/cms/dashboard/dispatch` (heatmap) ก็เป็น Longdo ด้วย ⇒ ครอบทุก surface ตาม D15 |
| `layers.showPlace=false` | ปุ่ม **สถานที่** `aria-pressed="false"` (tooltip = "สถานที่" คือกดเพื่อเปิด) และ **ไม่มี marker Place เลย** — ตรงข้ามกับตอนที่ค่าเป็น `true` (ปุ่มถูกกด + marker 7 จุด) |
| `layers.showSearch=true` | มีช่องค้นหา "ค้นหาสถานที่" |
| `general.allowMapStyleChange=true` | มีปุ่ม **รูปแบบแผนที่** |
| `assignment.showWorkload=true` | ใน modal มอบหมายงาน คอลัมน์ **"งานที่มี"** แสดงค่า `0` ต่อเจ้าหน้าที่ |
| `assignment.showAssignedCases=true` | คอลัมน์ **"เคสที่รับผิดชอบ"** แสดง "ไม่มี" |
| `staff.etaTtl.applyToAssignmentPicker=true` | คอลัมน์ **"เวลาถึง / เวลาที่เหลือ"** + ปุ่ม **คำนวณเส้นทาง** ต่อแถว |
| `assignment.enableRecommendRanking=true` | ปุ่มกรองใน modal: **ตามทักษะ / แสดงทั้งหมด** (โหมดเริ่มต้น = Recommend) |

หัวคอลัมน์ที่เห็นจริงใน picker: `ชื่อ · สถานะ · พื้นที่รับผิดชอบ · ทักษะ · งานที่มี · เคสที่รับผิดชอบ · เวลาถึง / เวลาที่เหลือ`

### 18.2 ยังยืนยันด้วยตาไม่ได้ (พร้อมเหตุผล)

| ค่า | ทำไม |
|---|---|
| `layers.showAddressCoordinates=true` | กล่องที่อยู่/พิกัดถูก gate ด้วย `showLocationInfo && value` — ฟอร์มสร้างเคสยังไม่มีพิกัด จึงไม่แสดงไม่ว่าจะตั้งค่าไว้อย่างไร **ต้องเปิดเคสที่มีพิกัด** |
| `layers.showBoundaries=true` | ปุ่มระดับ (ประเทศ/จังหวัด/เขต) ไม่มี `aria-pressed` ให้อ่าน และ `startAllHidden` เป็น `manualOnly \|\| !showBoundaries` ⇒ ต้องรู้ว่า surface นั้นส่ง `manualOnly` หรือไม่ก่อนจึงจะแยกผลได้ |
| `staff.showStaff/showTrail` + `tracking=manual` (นับ request) | ต้องเปิดเคส **ที่มีพิกัด** เพื่อให้แผนที่ staff mount — เคสที่สุ่มมา (`D261117-00001/00002`, `D261102-00013`) ไม่มีตำแหน่งบนแผนที่ (picker ขึ้น "เคสนี้ไม่มีตำแหน่งที่สามารถระบุบนแผนที่ได้") |
| `incident.radiusMeters=900` / `showRadius` / `autoLockServiceCenterOnMatch` | ต้องเกิดเหตุการณ์ "Service Center ไม่ match" จึงจะเห็นวงกลม fallback |

### 18.3 ข้อสังเกต

1. **เคสที่ไม่มีพิกัด** ทำให้ปุ่ม "คำนวณเส้นทาง" ใน picker ถูก disable — ถูกต้องตามออกแบบ แต่หมายความว่าคอลัมน์ ETA/TTL
   (จาก `applyToAssignmentPicker`) มีประโยชน์เฉพาะเคสที่มีตำแหน่ง
2. ข้อมูล staging ของ BMA ตอนนี้ **เคสล่าสุดไม่มีพิกัด** ⇒ surface ที่ต้องใช้แผนที่ staff (showStaff/showTrail/tracking poll)
   ต้องเตรียมเคสที่มีพิกัดก่อนจึงจะทดสอบด้วยมือได้
