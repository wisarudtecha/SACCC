# Organization Settings — Manual Test Steps (Runtime Wiring)

คู่มือทดสอบด้วยมือสำหรับฟีเจอร์ **Organization Settings → Runtime Wiring**
(Phase 0, A, B, C, D) ใช้คู่กับ `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md`

- เวอร์ชัน: 1.0 · 2026-11-19
- ผู้ทดสอบที่ต้องการ: 1 คน + สิทธิ์ system admin ของ tenant
- เวลาที่ใช้: **2.5–3 ชั่วโมง** (40 เคส + เวลารอ poll ตามรอบจริง ~6 นาที)

---

## 0. สิ่งที่ชุดทดสอบนี้พิสูจน์

| กลุ่ม | ตัดสินใจที่ผูกอยู่ | จำนวนเคส |
| --- | --- | --- |
| A — Map runtime config (provider / basemap / style) | D1, D5, D16, D19, A1–A6 | 11 |
| B — Layers / Staff / Basemap | D4, D9, D10, D12, D13, D15 | 11 |
| C — Intervals / Routing / Tracking | D2, D6, D7, D8, D11 | 7 |
| D — Assignment rules (validation + copy) | D2, D8, D18 | 4 |
| E — Regression / negative / transport | — | 5 |
| F — Entitlement (chokepoint) | — | 2 |

**กฎสำคัญ:** ทุกเคสที่ต้อง "บันทึกค่า" ให้จดค่าเดิมไว้ก่อน (ข้อ 2.2) แล้วคืนค่าหลังจบ (ข้อ 11)

---

## 1. สภาพแวดล้อม

| อะไร | ค่า |
| --- | --- |
| Frontend | `pnpm dev` → `http://localhost:5173` (หรือ environment ที่ต้องการทดสอบ) |
| Backend | ตาม `.env` ของ environment นั้น (staging: `cc-bff-stg.one-sky.ai`) |
| Browser | Chrome/Edge ล่าสุด เปิด DevTools (Console + Network) |
| Extensions | ปิดทุกตัว (ad-block อาจตัด request ของ map/tile) |

### 1.1 บัญชีที่ใช้

| ใช้ทำอะไร | username | หมายเหตุ |
| --- | --- | --- |
| เคสส่วนใหญ่ | `admin` / `BMA` | system admin ของ tenant (แก้ค่า org settings ได้) |
| เคส entitlement (F) | ต้องใช้ tenant ที่ plan **ไม่มี** `entitlement.gis` | fixture ปัจจุบัน: `SKY-AI` = essential (ไม่มี GIS), `BMA` = enterprise (มี) — ดู `src/core/mocks/entitlements/` |

> ถ้าไม่มี user ของ tenant ที่ไม่มี GIS ให้ข้าม F ไป และบันทึกว่า "ไม่ได้ทดสอบ" (ห้ามถือว่าผ่าน)

---

## 2. เตรียมตัวก่อนเริ่ม

### 2.1 เปิดหน้า settings

1. เข้า `http://localhost:5173/` → กรอก `admin` / รหัสผ่าน / องค์กร `BMA` → **เข้าสู่ระบบ**
2. ไปที่ **การตั้งค่าองค์กร** (`/cms/settings/organization`)
3. จะเห็นแท็บ 3 แท็บ: **การตั้งค่าแผนที่** · **กฎการมอบหมายงาน** · **การสมัครสมาชิกและสิทธิ์การใช้งาน**

### 2.2 Backup ค่าเดิม (บังคับ)

ทำก่อนแก้ค่าอะไรทั้งสิ้น — เปิด DevTools Console แล้วรัน (dev only):

```js
const { store } = await import("/src/core/store/index.ts");
const { configPropertyApi } = await import("/src/core/store/api/configPropertyApi.ts");
const cfg = (await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")).getMapRuntimeConfig();
const row = await store.dispatch(
  configPropertyApi.endpoints.getConfigPropertyByKey.initiate({
    propKey: "org.config.properties",
    orgId: cfg.orgId,
  })
).unwrap();
copy(JSON.stringify(row.data.propVal, null, 2)); // คัดลอกเก็บไว้ในไฟล์
console.log("orgId =", cfg.orgId);
```

- จด **`orgId`** ไว้ (ใช้ในข้อ 2.4 และข้อ 11)
- เก็บ JSON ที่ copy ไว้ในไฟล์ เช่น `bma-org-settings-before.json`

### 2.3 รู้จักตัวช่วยอ่านค่าที่มีผลจริง (dev only)

ค่าที่ "บันทึกไว้" กับ "ค่าที่ระบบใช้จริง" ต่างกันได้ (fallback / clamp) — ใช้ snippet นี้ตรวจ:

```js
// provider ที่ใช้จริง + เหตุผล fallback
(await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")).getMapRuntimeConfig();

// cadence ที่มีผลจริง
const { resolveTrackingPollMs, resolveEtaTtlTickMs } =
  await import("/src/cms/components/case/createCase/map/staff/staffCadence.ts");
```

### 2.4 เคส "org ยังไม่เคยบันทึก" (T-A2)

ต้องมี tenant ที่ **ไม่มีแถว** `org.config.properties` ถ้าไม่มี ให้ใช้ script ที่เขียนเฉพาะ smoke key:

```powershell
$env:ORG_SETTINGS_TOKEN = "<bearer token ของ user>"
node scripts/smoke-org-settings.mjs            # เขียน/อ่านเฉพาะ org.config.properties.smoke
node scripts/smoke-org-settings.mjs --cleanup  # ลบ smoke key ทิ้ง
```

> script นี้ **ไม่แตะ** key จริง `org.config.properties` — ถ้าต้องทดสอบ "ยังไม่เคยบันทึก" จริง ๆ ต้องใช้ environment/tenant ใหม่

---

## 3. ชุดทดสอบ A — Map runtime config

### T-A1 · org override ชนะ deployment default (D1)

**เงื่อนไข:** login `BMA` · อยู่แท็บ **การตั้งค่าแผนที่**

1. ช่อง **ผู้ให้บริการแผนที่** (General) เลือก `Longdo`
2. กด **บันทึก** → รอ toast สำเร็จ (บรรทัด "บันทึกล่าสุดโดย …" ต้องเปลี่ยนเวลา)
3. กด **F5** (reload ทั้งหน้า)
4. เปิด Console รัน snippet ข้อ 2.3 (getMapRuntimeConfig)

***คาดหวัง***

- `requestedProvider: "longdo"` · `provider: "longdo"` · `fallbackReason: null`
- `deploymentDefaultProvider: "arcgis"` (คือ `.env` ยังเป็น arcgis — แสดงว่า org ชนะจริง)

### T-A2 · ไม่มี org record → พฤติกรรมเดิม (D5/principle 4)

**เงื่อนไข:** tenant ที่ไม่เคยบันทึก `org.config.properties`

1. เปิดหน้า **สร้างเคส** (`/cms/case/creation`)
2. รัน snippet getMapRuntimeConfig

***คาดหวัง***

- `requestedProvider: null` · `provider` = ค่าของ `VITE_MAP_PROVIDER` (ปกติ `arcgis`) · `fallbackReason: "not-configured"`
- แผนที่ยังใช้งานได้ปกติ (ไม่ค้าง placeholder)

### T-A3 · provider ที่ build นี้ใช้ไม่ได้ → fallback + แจ้ง (D5/D16)

**เงื่อนไข:** environment ที่ **ไม่มี** key ของ provider หนึ่ง (เช่น ไม่ได้ตั้ง `VITE_LONGDO_API_KEY`)

1. ตั้ง **ผู้ให้บริการแผนที่** = `Longdo` → บันทึก → reload
2. เปิดหน้า **สร้างเคส**
3. กลับไปหน้า settings แท็บ **การตั้งค่าแผนที่**

***คาดหวัง***

- `getMapRuntimeConfig()` → `provider` = deployment default · `fallbackReason: "unsupported"` · `requestedProvider: "longdo"`
- ใต้ช่อง **ผู้ให้บริการแผนที่** มีแถบสีเหลืองข้อความ *"ผู้ให้บริการแผนที่ที่เลือกใช้ไม่ได้ในสภาพแวดล้อมนี้ ระบบจึงวาดแผนที่ด้วย …"*
- แผนที่ยังวาดได้ด้วย provider default (ไม่จอขาว)

### T-A4 · code splitting: โหลดเฉพาะ SDK ที่ใช้ (A3)

**เงื่อนไข:** dev server · DevTools → Network → filter `AddressMap`

1. ตั้ง provider = `Longdo` → บันทึก → reload → เปิด `/cms/case/creation`
2. กลับไปตั้ง provider = `Arcgis` → บันทึก → reload → เปิด `/cms/case/creation` อีกครั้ง

***คาดหวัง*** (production build ดูชื่อ chunk `LongdoAddressMap-*.js` / `ArcgisAddressMap-*.js`)

- รอบ longdo: มี request ของ `LongdoAddressMap` **และไม่มี** `ArcgisAddressMap`
- รอบ arcgis: ตรงกันข้าม
- ข้อความเครดิตใต้แผนที่ตรงกับ provider (Longdo Map / Esri)

### T-A5 · provider ถูก resolve ครั้งเดียวต่อ session

> อ้างอิงหลักการใน `docs/ORG-SETTINGS-Runtime-Wiring-Plan.md` §2.2 ข้อ 2

1. เปิด `/cms/case/creation` (แผนที่แสดงแล้ว)
2. ไปแก้ provider ในอีกแท็บ/session อื่น (หรือแก้ DB)
3. กลับมาแท็บเดิม **ไม่ reload** แล้วดู Console

***คาดหวัง***

- แผนที่เดิมยังใช้ provider เดิม (ไม่ remount/ไม่กระพริบ ไม่เสีย pan/zoom)
- Console (dev) มี warning `[mapRuntimeConfig] ignored a changed configuration for org …`

### T-A6 · basemap preference ผูกกับ org + provider (A4)

1. เปิด `/cms/case/creation` → กด **รูปแบบแผนที่** → เลือก `ดาวเทียม` (satellite)
2. Console รัน `Object.keys(localStorage).filter(k => k.startsWith("cms.map.basemap"))`

***คาดหวัง***

- มี key รูปแบบ `cms.map.basemap.<orgId>.<provider>` (ต้องมี orgId)
- reload แล้วแผนที่ยังเป็น satellite
- login ด้วย tenant อื่น (เครื่องเดียวกัน) → ต้องไม่ได้ satellite ของ BMA

### T-A7 · default basemap จาก org (B8/D15)

1. แท็บ **การตั้งค่าแผนที่** → **รูปแบบแผนที่เริ่มต้น** = `ดาวเทียม` → บันทึก
2. ล้าง preference ส่วนตัว: `Object.keys(localStorage).filter(k=>k.startsWith("cms.map.basemap")).forEach(k=>localStorage.removeItem(k))`
3. reload → เปิดหน้า **สร้างเคส**

***คาดหวัง***

- แผนที่เปิดมาเป็น satellite (มาจาก org)
- ถ้าผู้ใช้เลือก street เองแล้ว reload → ต้องเป็น street (localStorage ชนะ org)

### T-A8 · ลำดับ: ค่าไม่ถูกต้อง → provider default

1. ตั้ง **รูปแบบแผนที่เริ่มต้น** เป็นค่าที่ไม่มีใน catalogue (ผ่าน API/DB เช่น `"terrain"`)
2. reload → เปิดหน้าเคส

***คาดหวัง***

- ใช้ `street` (DEFAULT_BASEMAP_ID) · ไม่มี dropdown ที่ไม่มี active option · ไม่มี error ใน console

### T-A9 · surface อื่นได้ค่าเดียวกัน (D15)

1. ตั้ง provider = `Longdo` → บันทึก
2. เปิด **แดชบอร์ด → dispatch (heatmap)** และ **dashboard/case-summary-by-area (choropleth)**

***คาดหวัง***

- ทั้งสองหน้าใช้ Longdo (เครดิต/รูปแบบแผนที่) ไม่ใช่ ArcGIS

---

### T-A10 · Save แล้วค่ามีผลทันที ไม่ต้อง reload (D19)

**เงื่อนไข:** อยู่แท็บ **การตั้งค่าแผนที่** · ยังไม่ reload หน้า

1. จดค่าปัจจุบันจาก Console: `(await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")).getMapRuntimeConfig()`
2. เปลี่ยน **ผู้ให้บริการแผนที่** เป็น `Longdo` (หรือสลับเป็นค่าอื่นที่ต่างจากเดิม) → กด **บันทึก**
3. รอ toast สำเร็จ แล้วรัน snippet ของขั้นตอนที่ 1 ซ้ำ **โดยไม่ reload**
4. ไปเปิดหน้า **สร้างเคส** (SPA navigation ปกติ ไม่ต้อง F5)

**คาดหวัง**
- หลังบันทึก `provider` / `requestedProvider` เปลี่ยนเป็นค่าใหม่ทันทีใน session เดิม
- หน้าเคสที่เปิดหลังจากนั้นใช้ provider ใหม่ (เครดิต Longdo / chunk `LongdoAddressMap`)
- ถ้ามีแผนที่เปิดค้างอยู่ตอนกด Save → ค่า**ไม่**เปลี่ยน (ระบบเลี่ยงไม่สลับ provider ใต้แผนที่ที่เปิดอยู่) และมี toast เตือนให้ reload

### T-A11 · note + ปุ่ม "โหลดหน้าใหม่" ในแผง Config (D19)

1. อยู่แท็บ **การตั้งค่าแผนที่** → ดูใต้ช่อง **ผู้ให้บริการแผนที่**
2. แก้อะไรก็ได้ให้ฟอร์ม dirty (เช่น เปลี่ยน **รูปแบบแผนที่เริ่มต้น**) → ไปดูที่ปุ่ม **โหลดหน้าใหม่**
3. กด **ยกเลิก** (ให้กลับมา clean) → ดูที่ปุ่มอีกครั้ง

**คาดหวัง**
- มี note อธิบายว่าการเปลี่ยนผู้ให้บริการมีผลกับแผนที่ที่จะเปิดหลังจากบันทึก และแผนที่ที่เปิดค้างอยู่ต้อง reload
- ปุ่ม **โหลดหน้าใหม่** ถูก disable ขณะมีค่าที่ยังไม่บันทึก (hover แล้วมี tooltip บอกให้บันทึก/ยกเลิกก่อน)
- เมื่อ clean แล้วกดปุ่มได้ และกดแล้วหน้าโหลดใหม่จริง

## 4. ชุดทดสอบ B — Layers / Staff / Basemap

> ทุกเคสในชุดนี้: ค่า org เป็น **ค่าเริ่มต้น** ผู้ใช้ยัง toggle ต่อได้

### T-B1 · `layers.showPlace` = true → Places เปิดเอง + ทุกหมวดเปิด (D4/D12)

**เงื่อนไข:** แท็บ **การตั้งค่าแผนที่** → **แสดงสถานที่** = เปิด → บันทึก

1. เปิด `/cms/case/creation`
2. ดู toolbar ของแผนที่

***คาดหวัง***

- ปุ่ม **สถานที่** ถูกกดไว้ (`aria-pressed="true"`, tooltip เป็น "ซ่อนสถานที่")
- มี marker ของ Place ขึ้นทันที **โดยไม่ต้องกด toggle เอง** และไม่ต้องเลือกหมวดก่อน
- กด **สถานที่** อีกครั้ง → ซ่อนได้ (ค่า org ไม่ล็อกผู้ใช้)

### T-B2 · `layers.showPlace` = false → ไม่มี marker

1. ตั้ง **แสดงสถานที่** = ปิด → บันทึก → reload → เปิดหน้าเคส

**คาดหวัง:** ไม่มี marker Place และปุ่ม **สถานที่** ไม่ถูกกด

### T-B3 · Places ถูกตัดที่เพดาน 1000 → ต้องแจ้ง (D9)

**เงื่อนไข:** org มี Place ≥ 1000 รายการ (ถ้าไม่มี ให้บันทึกว่า "ทดสอบไม่ได้" ห้ามถือว่าผ่าน)

1. แท็บ **การตั้งค่าแผนที่** → ดู note ใต้ **แสดงสถานที่**

***คาดหวัง***

- แสดงจำนวน เช่น `จะแสดงสถานที่ 1000 จากเพดาน 1000 รายการ`
- มีบรรทัดเตือนสีเหลือง *"มีสถานที่มากกว่าเพดานนี้ …"*
- เปิดหน้าเคส → status line ของ layer แสดง *"แสดง 1000 จากเพดาน 1000 รายการ - อาจมีบางรายการไม่ครบ"* (ไม่เงียบ)

### T-B4 · `layers.showBoundaries` (B1)

1. ตั้ง **แสดงขอบเขตและโพลิกอน** = ปิด → บันทึก → reload → เปิดหน้าเคส
2. เปิด **ดูแผนที่ขนาดใหญ่** → กด **ชั้นข้อมูล** → ดูตัวเลือกขอบเขต

**คาดหวัง:** เริ่มต้นด้วย "ยังไม่เลือกพื้นที่" (ไม่มีโพลิกอนวาด) — ค่า org เป็นเพียงค่าเริ่มต้น ผู้ใช้ยังเลือกเองได้

### T-B5 · `layers.showSearch` (B4)

1. ตั้ง **ค้นหาสถานที่** = ปิด → บันทึก → reload → เปิดหน้าเคส

**คาดหวัง:** ไม่มีช่องค้นหา (ทั้งแผนที่เล็กและใหญ่) · เปิดกลับเป็น true → มีช่อง "ค้นหาสถานที่"

### T-B6 · `layers.showAddressCoordinates` (B5)

1. ตั้ง **แสดงที่อยู่และพิกัด** = ปิด → บันทึก → reload → เปิดหน้าเคส → **ดูแผนที่ขนาดใหญ่**

**คาดหวัง:** แผนที่ใหญ่ไม่มีกล่องที่อยู่/พิกัดมุมล่างซ้าย · เปิดค่า → มี

### T-B7 · `general.allowMapStyleChange` (B7)

1. ตั้ง **เปลี่ยนรูปแบบแผนที่** = ปิด → บันทึก → reload → เปิดหน้าเคส

**คาดหวัง:** ไม่มีปุ่ม **รูปแบบแผนที่** ใน toolbar · เปิดค่า → มี

### T-B8 · `staff.showStaff` (B2/D13)

**เงื่อนไข:** ใช้เคสที่ **ยังไม่ assign** และเปิด modal มอบหมายงาน (`/cms/case/<caseId>` → **มอบหมายงานให้เจ้าหน้าที่**)

1. ตั้ง **แสดงเจ้าหน้าที่** = เปิด → บันทึก → reload → เปิด modal
2. ตั้ง = ปิด → บันทึก → reload → เปิด modal อีกครั้ง
3. (เคสที่มีเจ้าหน้าที่ assigned อยู่แล้ว) ตั้ง = ปิด → reload → เปิด modal

***คาดหวัง***

- (1) layer เจ้าหน้าที่เปิดทันที
- (2) layer ปิด
- (3) **เปิด** เพราะ rule "เคสที่มีคนรับแล้วแสดงเจ้าหน้าที่" ชนะค่า org (D13)

### T-B9 · `staff.showTrail` (B3)

1. ตั้ง **แสดงเส้นทางย้อนหลัง (trail)** = เปิด → บันทึก → เปิด modal มอบหมาย → เลือกเจ้าหน้าที่ → เปิด section **การติดตาม**
2. ตั้ง = ปิด → ทำซ้ำ

**คาดหวัง:** (1) ปุ่ม trail ถูกกดไว้ตั้งแต่เปิด (2) ไม่ถูกกด — และยังกด toggle เองได้

### T-B10 · `assignment.showWorkload` / `showAssignedCases` / `enableRecommendRanking`

1. ปิดทั้งสามค่า → บันทึก → เปิด **ตัวเลือกการมอบหมาย** (assignment picker)

**คาดหวัง:** คอลัมน์ workload / assigned cases / อันดับ recommend หายไปตามค่า · เปิดกลับ → กลับมา

### T-B11 · `staff.etaTtl.applyToAssignmentPicker`

1. ตั้ง **ใช้การตั้งค่า ETA / TTL กับตัวเลือกการมอบหมาย** = ปิด → บันทึก
2. เปิด assignment picker

**คาดหวัง:** คอลัมน์ ETA/TTL หายไปจาก picker (แต่ยังอยู่ใน map staff panel)

---

## 5. ชุดทดสอบ C — Intervals / Routing / Tracking

### T-C1 · ETA/TTL tick ตามค่า org (C1)

1. แท็บ **การตั้งค่าแผนที่** → **ETA / TTL ของเจ้าหน้าที่** = `อัตโนมัติ` → เปิด **ขั้นสูง** → ใส่ `60` → บันทึก
2. เปิดหน้าเคส → เปิด **Staff Panel** → คำนวณเส้นทาง (ปุ่ม Calculate) ให้มีผลลัพธ์
3. จับเวลาการเปลี่ยนของตัวเลข TTL

**คาดหวัง:** ตัวเลข TTL รีเฟรชทุก ~60 วินาที (ไม่ใช่ 30) · ตั้ง `กำหนดเอง` → กลับไป 30 วินาที

### T-C2 · ค่า interval ต่ำกว่า 15 ถูกปฏิเสธ (C1)

1. ตั้ง mode = `อัตโนมัติ` → ใส่ `5` → กด **บันทึก**

**คาดหวัง:** บันทึกไม่ผ่าน + ข้อความ validation ใต้ช่อง (และเปิด disclosure ให้เห็นเองถ้าพับอยู่)

### T-C3 · `staff.routing` = auto ถูกปิด (D2/D8)

1. แท็บ **การตั้งค่าแผนที่** → **การกำหนดเส้นทางเจ้าหน้าที่**

***คาดหวัง***

- เห็นฟิลด์ (ไม่ถูกซ่อน) · ตัวเลือก `อัตโนมัติ` **กดไม่ได้** (disabled)
- มี note *"โหมดอัตโนมัติยังใช้งานไม่ได้ …"*
- ถ้า DB เดิมเป็น `auto` อยู่ → dropdown ยังแสดง `อัตโนมัติ` (ไม่ถูกเขียนทับเป็น manual เงียบ ๆ)

### T-C4 · `tracking` = manual → ไม่มี poll เลย (D6)

1. ตั้ง **การติดตามเจ้าหน้าที่** = `กำหนดเอง` → บันทึก → reload
2. เปิดหน้าเคส → เปิด modal มอบหมาย (ให้ layer staff เปิด) → เปิด DevTools Network → filter `graphql`
3. ทิ้งไว้ **2 นาที**

***คาดหวัง***

- **ไม่มี** request ที่มี operation `GetUnitDispatch` เพิ่มขึ้นตามรอบเวลา (ที่มีคือตอนเปิดครั้งแรกเท่านั้น)
- ปุ่ม refresh และ websocket ยังทำงาน (กด refresh ได้)

### T-C5 · `tracking` = auto/15 → ยิงจริงที่ 30 วินาที (D7)

1. ตั้ง **การติดตามเจ้าหน้าที่** = `อัตโนมัติ` → เปิด **ขั้นสูง** → ใส่ `15` → บันทึก
2. **คาดหวังที่หน้า settings ทันที:** note *"ค่าที่ใช้จริง: รีเฟรชทุก 30 วินาที (ต่ำสุด 30 วินาที)"*
3. reload → เปิดหน้าเคส + modal มอบหมาย → Network filter `graphql` → นับ request ที่มี `GetUnitDispatch` ใน 70 วินาที
4. ตรวจ DB: ค่าที่บันทึกต้องยังเป็น `15` (ไม่ถูกเขียนเป็น 30)

**คาดหวัง:** ได้ประมาณ 2 ครั้งใน 70 วินาที (ทุก 30s) — ไม่ใช่ทุก 15s และค่าใน DB ยังเป็น 15

### T-C6 · หยุด poll เมื่อแท็บไม่ active (C3)

1. ตั้ง tracking = `อัตโนมัติ` / `60` → บันทึก → เปิดหน้าเคสที่ layer staff เปิด
2. สลับไปแท็บอื่น (หรือย่อหน้าต่าง) ทิ้งไว้ 3 นาที แล้วกลับมา

**คาดหวัง:** ระหว่างที่ซ่อนอยู่ไม่มี request `GetUnitDispatch` ตามรอบ · กลับมาแล้วเริ่มใหม่

### T-C7 · `tracking` = auto ที่ไม่มีค่า interval (D11)

1. ผ่าน API/DB ตั้ง `tracking = { mode: "auto", autoIntervalSeconds: null }` → reload

**คาดหวัง:** ระบบใช้ค่า default 60 วินาที (ไม่ crash / ไม่ busy loop)

---

## 6. ชุดทดสอบ D — Assignment rules

### T-D1 · Automatic ที่ไม่เลือก criterion → บันทึกไม่ได้ (Phase D)

1. แท็บ **กฎการมอบหมายงาน**
2. เปิดสวิตช์ **โหมดการมอบหมาย** เป็น `อัตโนมัติ` (ยังไม่ติ๊กเกณฑ์ใด)
3. กด **บันทึก**

***คาดหวัง***

- **ไม่มี** request เขียนค่า (Network ไม่มี `SetConfigPropertyByKey` ใหม่) · ไม่มี toast สำเร็จ · เวลา "บันทึกล่าสุด" ไม่เปลี่ยน
- ข้อความ *"เลือกอย่างน้อยหนึ่งเกณฑ์การกำหนดเส้นทางสำหรับโหมดอัตโนมัติ"* ขึ้น**สีแดง**
- แท็บที่ active = **กฎการมอบหมายงาน** (ไม่กระโดดไปแท็บอื่น)

### T-D2 · Automatic ที่เลือก criterion แล้ว → บันทึกได้

1. ติ๊กเกณฑ์อย่างน้อย 1 ข้อ (เช่น `อ้างอิงทักษะ`) → กด **บันทึก**

**คาดหวัง:** บันทึกสำเร็จ · toast สำเร็จ · เวลา "บันทึกล่าสุด" เปลี่ยน · reload แล้วค่ายังอยู่

### T-D3 · Manual ที่ไม่เลือก criterion → บันทึกได้ (default เดิม)

1. ตั้งโหมด = `กำหนดเอง` (ไม่ติ๊กเกณฑ์) → กด **บันทึก**

**คาดหวัง:** บันทึกสำเร็จ (ห้ามบล็อก — เป็นค่าเริ่มต้นของ org ใหม่)

### T-D4 · note "engine ยังไม่เปิดใช้งาน" (D18)

1. อยู่แท็บ **กฎการมอบหมายงาน** → ดูใต้ช่อง **โหมดการมอบหมาย**

**คาดหวัง:** มีข้อความ *"การจัดเส้นทางอัตโนมัติยังไม่เปิดใช้งาน - engine ยังอยู่ระหว่างพัฒนา เกณฑ์ที่เลือกจะถูกบันทึกไว้ แต่ยังไม่มีอะไรนำไปจัดเส้นทางเคส"*

---

## 7. ชุดทดสอบ E — Regression / negative / transport

### T-E1 · Save ป้องกันเอกสารที่อ่านไม่ได้

1. เปิด DevTools → Network → block request ที่ไป `/graphql` (หรือตัดเน็ตชั่วคราว) แล้ว reload หน้า settings **ขณะ** ที่ request เอกสารล้มเหลว
2. ดูแถบ error ด้านบน + ปุ่ม **บันทึก**

**คาดหวัง:** มีแถบ "อ่านค่าไม่ได้" + ปุ่ม **บันทึก** ถูก disable (กดไม่ได้) — ต้องไม่เขียนทับด้วยค่า default

### T-E2 · ไม่มี placeholder ค้าง

1. reload หน้า settings 3 ครั้งติดกัน

**คาดหวัง:** skeleton ขึ้นเพียงช่วงแรก แล้วฟอร์มขึ้นทุกครั้ง (ไม่ค้างที่ skeleton)

### T-E3 · ฟอร์มไม่ถูก unmount ระหว่าง refetch หลัง Save

1. เปิด disclosure **ขั้นสูง** ค้างไว้ + พิมพ์ค่าอะไรก็ได้ (ยังไม่บันทึก)
2. กด **บันทึก** (ให้ผ่าน validation)

**คาดหวัง:** หลังบันทึก disclosure ยังเปิด และค่าที่ยังไม่ได้บันทึกไม่หายไปทั้งหน้าจอ (ฟอร์มไม่ remount)

### T-E4 · i18n ครบ 3 ภาษา

1. สลับภาษาที่ปุ่ม **ภาษา** (มุมขวาบน) ระหว่าง `th` / `en` / `cn`
2. ตรวจข้อความใหม่: note ของ routing, note ของ assignment mode, note "ค่าที่ใช้จริง", ข้อความ validation

**คาดหวัง:** ไม่มีคีย์ดิบหลุดมาบนจอ (เช่น `settings.map.field...`) ทั้งสามภาษา

### T-E5 · บันทึกแล้วค่าที่ไม่เกี่ยวกับหน้านี้ไม่หาย

1. เก็บ backup (ข้อ 2.2) → แก้เฉพาะ **ผู้ให้บริการแผนที่** → บันทึก
2. เปิด backup เทียบกับค่าปัจจุบัน (ใช้ snippet ข้อ 2.2)

**คาดหวัง:** ต่างกันเฉพาะ `general.mapProvider` — ค่าอื่น (assignmentRules, advancedOptions, incident ฯลฯ) เท่าเดิมทุกตัว

---

## 8. ชุดทดสอบ F — Entitlement (chokepoint)

### T-F1 · tenant ที่ไม่มี `entitlement.gis`

**เงื่อนไข:** login ด้วย tenant ที่ plan ไม่มี GIS (fixture: `SKY-AI` = essential)

1. เปิด `/cms/case/creation`
2. เปิด `/dashboard/dispatch` และ `/dashboard/case-summary-by-area`

***คาดหวัง***

- ไม่มี `<map>` / SDK ถูกโหลดเลย (Network ไม่มี chunk ของ ArcGIS/Longdo/MapTiler)
- เห็น lock/upsell (หรือไม่เห็นอะไรเลยถ้าตั้ง `VITE_SHOW_ENTITLEMENT_UPSELL=false`) — **ห้าม** เห็นแผนที่ว่าง
- หน้า settings แท็บ **การตั้งค่าแผนที่** ถูก gate ด้วย `EntitlementGate` (ไม่มีฟอร์ม)

### T-F2 · tenant ที่มี GIS

1. login `BMA` (enterprise) → เปิดหน้าเดียวกับ T-F1

**คาดหวัง:** แผนที่ทำงานปกติ + ฟอร์ม settings แสดง

---

## 9. หลักฐานที่ต้องแนบใน ticket

| เคส | หลักฐาน |
| --- | --- |
| ทุกเคส | ระบุ environment + orgId + username + เวลาที่ทดสอบ |
| A1–A4, A9 | screenshot Console (getMapRuntimeConfig) + screenshot Network ที่กรอง `AddressMap` |
| A3 | screenshot แถบ fallback ในหน้า settings |
| B1–B11 | screenshot toolbar/layer ก่อน–หลัง (2 ภาพต่อเคส) |
| C4–C6 | screenshot Network (กรอง `graphql`) ที่แสดงจำนวน request + ช่วงเวลา |
| D1–D4 | screenshot ข้อความ validation สีแดง + Network ที่ไม่มี write request |
| F | screenshot หน้า locked + Network ที่ไม่มี SDK chunk |

**เกณฑ์ผ่าน:** ทุกเคสใน A–D ผ่าน · F ผ่าน (ถ้ามี user) · ไม่มี ❌ ในข้อ 10 ถูกยกมาอ้างว่าเป็น failure

---

## 10. Known issues ที่ **ไม่ใช่** failure ของงานนี้

1. **boundary geometry 404 บน staging** — เปิดหน้าแผนที่จะเห็น 404 ของ
   `…/area-org-tree/<orgId>/TH/{20,21,…}.json.gz`, `BMA.json.gz`, `Roadside/center.json.gz`
   และ log `Boundary geometry … is not a polygon ring set` → เป็นปัญหาข้อมูล boundary ของ tenant ไม่ใช่โค้ด
2. **`basemap preference` ไม่ migrate ค่าเก่า** — key เปลี่ยนเป็น `cms.map.basemap.<orgId>.<provider>` (A4)
   ผู้ใช้เดิมจะกลับไปใช้ค่า default 1 ครั้ง (ยอมรับได้ มากกว่าปล่อยให้ tenant ปนกัน)
3. **`allowPlaceIncidentPin` (B6) ยังไม่ผูกกับ UI** — เลื่อนตาม D14: ฟิลด์บันทึกได้แต่ยังไม่มีผล
4. **`assignmentRules` ไม่มี engine** — ตัวเลข/เกณฑ์ถูกเก็บแต่ยังไม่มีการจัดเส้นทางจริง (มี note เตือนตาม D18)

---

## 11. คืนค่า / Rollback

ทำทุกข้อหลังจบการทดสอบ:

1. **คืนค่า settings** — ใช้ UI ตั้งค่ากลับเป็นค่าใน backup (ข้อ 2.2) แล้วกด **บันทึก**
   หรือ (ถ้าจำนวนค่าที่แก้เยอะ) เขียนทับทั้งเอกสาร:

   ```js
   const { store } = await import("/src/core/store/index.ts");
   const { configPropertyApi } = await import("/src/core/store/api/configPropertyApi.ts");
   const { encodeOrgConfigProperties } = await import("/src/cms/utils/orgConfigProperties.ts");
   const cfg = (await import("/src/cms/components/case/createCase/map/mapRuntimeConfig.ts")).getMapRuntimeConfig();
   const row = await store.dispatch(configPropertyApi.endpoints.getConfigPropertyByKey.initiate({ propKey: "org.config.properties", orgId: cfg.orgId })).unwrap();
   const current = row.data.propVal;
   const restored = /* JSON จาก backup */;
   await store.dispatch(configPropertyApi.endpoints.setConfigPropertyByKey.initiate({
     propKey: "org.config.properties",
     propVal: encodeOrgConfigProperties(current, { ...restored, orgId: cfg.orgId }),
   })).unwrap();
   ```

2. **ตรวจว่าคืนครบ** — เทียบ documento กับ backup แบบเทียบค่า (ไม่ใช่เทียบ string เพราะลำดับ key ต่างได้)

   ```js
   const norm = (v) => Array.isArray(v) ? v.map(norm)
     : v && typeof v === "object" ? Object.keys(v).sort().reduce((a, k) => ({ ...a, [k]: norm(v[k]) }), {})
     : v;
   JSON.stringify(norm(currentDoc)) === JSON.stringify(norm(backupDoc)); // ต้องได้ true
   ```

3. **ล้าง localStorage ที่ทดสอบ** — `Object.keys(localStorage).filter(k=>k.startsWith("cms.map.basemap")).forEach(k=>localStorage.removeItem(k))`
4. **ลบ smoke key** — `node scripts/smoke-org-settings.mjs --cleanup` (ถ้าได้รัน)
5. บันทึกใน ticket ว่า **คืนค่าแล้ว** + `updatedBy` ของแถวจะกลายเป็น user ที่ทดสอบ (ไม่ใช่ของเดิม)

---

## 12. Traceability (decision → เคสทดสอบ)

| Decision | ความหมาย | เคส |
| --- | --- | --- |
| D1 | org override provider ทุก surface | T-A1, T-A9 |
| D2 / D8 | routing `auto` ยังไม่ทำ → disable + note | T-C3 |
| D4 / D12 | เปิด Places ได้ + ทุกหมวดเปิด | T-B1 |
| D5 / D16 | fallback + แจ้งเฉพาะ `unsupported` | T-A3 |
| D6 | `tracking manual` = ไม่มี poll | T-C4 |
| D7 | clamp poll ≥ 30s | T-C5 |
| D9 / D17 | Places ถูกตัด → แจ้งทั้ง layer + หน้าตั้งค่า | T-B3 |
| D10 | default = พฤติกรรมเดิม | T-B1, T-B2, T-D3 |
| D11 | tracking default 60s | T-C7 |
| D13 | org showStaff เป็น seed, rule assigned ชนะ | T-B8 |
| D14 | B6 เลื่อน | §10 ข้อ 3 |
| D15 | defaultBasemapId ทุก surface | T-A7, T-A9 |
| D18 | note engine ยังไม่เปิดใช้งาน | T-D4 |
| D19 | Save แล้วค่ามีผลทันที + note/ปุ่ม reload | T-A10, T-A11 |
| A4 | basemap key ผูก org | T-A6 |
| — | Save ต้อง validate ทั้งสองครึ่ง | T-D1, T-D2, T-D3 |
