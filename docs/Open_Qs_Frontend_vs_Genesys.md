# คำถามเปิด: Frontend (cloud-contact-center) vs Genesys Cloud CX 2

บริบท: เอกสาร Features ส่วน "Welcome = cloud-contact-center" — คำถามทั้งหมดโฟกัสที่ขอบเขตการสร้าง
**ระบบ frontend นี้ vs ความสามารถของ Genesys platform** (อะไรสร้างเองใน C2C อะไรให้ Genesys ทำงานแทน)

## กลุ่ม 1 — เชิงธุรกิจ (Scope & Ownership)

1. **Telephony: C2C สร้าง UI softphone เอง หรือใช้ของ Genesys?**
   ตอนนี้ C2C มี UI softphone/supervision/screen pop เสร็จแล้ว แต่รันบน mock ทั้งหมด และไม่มี adapter
   ฝั่ง Genesys Cloud CX 2 เลย
   - ทาง A: สร้าง frontend C2C ให้ต่อ Genesys CX 2 SDK (agents ใช้ softphone ในหน้า C2C)
   - ทาง B: Agents ใช้ Genesys Desktop/Cloud contact center console ของ Genesys และ C2C ทำหน้าที่
     แสดง case/screen pop เท่านั้น
   **ใครยืนยันว่าใช้ทางไหน เพราะกำหนดโครงสร้าง frontend ทั้งระบบ (UI ~ทั้ง module `cc` ขึ้นอยู่กับการตัดสินใจนี้)**

2. **ระบบ Campaign: สร้าง frontend ใหม่ใน C2C หรือใช้หน้าของ Genesys?**
   ฟีเจอร์ Campaign ทั้ง 33 รายการไม่มีใน C2C เลย — dialer (Preview/Predictive/Progressive), Call List
   upload, Exclusion/Do-Not-Call, Campaign management
   - สร้างเป็นโมดูลใหม่ใน C2C (frontend ของ BFF/C2C) และเรียก Genesys dialer ผ่าน API
   - ใช้ Genesys CX 2 dialer console + Genesys reports เป็นเจ้าของทั้งหมด (C2C ไม่ต้องสร้าง)
   **ใครเป็นเจ้าของหน้า campaign ในระบบใหม่ และข้อมูล call list (แทน pipeline FINN1→OCM) มาจากแหล่งไหน**

3. **ข้อมูลลูกค้า 1P/Amque/Base24: frontend C2C อยู่ใน scope การเชื่อมหรือไม่**
   CAI เดิม agent lookup ลูกค้าจาก 1P (บัญชี/CIF/บัตร/ชื่อ/โทร), ดูบัตร ATM (Base24), อายัดบัตร,
   verify (IB04–IB07, IB13–IB17) — C2C ยังไม่มีจุดเชื่อมใดๆ
   **ทีม C2C ถูกให้สร้างหน้าจอ lookup + BFF ถูกให้เปิด CTAPI/API Gateway หรือไม่ ถ้าไม่ใช่ ฟังก์ชันเหล่านี้
   ยังอยู่ฝั่ง CIMB/ระบบเดิม และควรถูกลบออกจาก checklist (ออก scope)**

4. **การย้ายข้อมูล CAI (Migration)**
   SOW ระบุเป็น optional — **ย้ายหรือไม่** เพราะถ้าย้าย รายงานของ C2C ต้องแสดงผล case ของ CAI
   เก่าได้ด้วย (Jasper report ต้องมี data source เพิ่ม) ถ้าไม่ย้าย reports ขอบเขตแคบลงมาก

5. **Escalation เมื่อเกิน SLA: รูปแบบ role-based รับได้ไหม**
   CAI เดิมส่ง email ไปหาผู้รับรายบริการ (To/CC) ระบบใหม่ (frontend พร้อมแล้ว) escalation ตาม role
   (Supervisor/Org Admin/Dispatcher) **business ยืนยันว่า role-based พอ หรือต้อง config อีเมลรายบริการ
   เหมือนเดิม — ผลกระทบต่อ data model ของ SLA ใน BFF**

6. **Transfer งาน / Ticket pool: เป็น business requirement ของระบบใหม่หรือไม่**
   CAI โอน ticket ให้ supervisor/แผนกอื่น และลง central pool เมื่อติดต่อไม่ได้ (TK05/TK06/TE05)
   **ระบบใหม่ต้องการ transfer เป็นฟีเจอร์เต็มรูปแบบ (frontend ต้องสร้าง action + BFF endpoint)
   หรือ workflow engine ที่มีอยู่รองรับแล้ว และต้องการ ticket pool หรือไม่**

7. **รายงาน: ใครเป็นเจ้าของ**
   C2C วันนี้ embed Jasper report (8 case + 6 order) และนิยามรายงานอยู่นอก repo
   - Case/order reports: ยังใช้ Jasper ต่อ (นิยามอยู่ที่ไหน ใครดูแล)
   - Agent performance (F01.208), outbound/dialer reports (F01.221), raw data (F01.206):
     **Genesys Cloud CX 2 (Historic/analytics) ครอบคลุมแล้ว หรือต้องสร้างเองใน C2C/Jasper**
   **ใคร owns report ตัวไหน — เพื่อไม่ให้สร้างซ้ำกับรายงานของ Genesys**

## กลุ่ม 2 — เชิงเทคนิค (Integration Architecture)

1. **Adapter ของ `cc` module: 3CX หรือ Genesys Cloud CX 2?**
   โค้ดปัจจุบัน comment ระบุ "until the backend 3CX adapter exists" และ RFP พูดถึง Genesys Cloud CX 2
   — **adapter ตัวจริงคือตัวไหน และ contract ของ event (CALL_INCOMING ฯลฯ) มีกำหนดแล้วหรือยัง**
   ผลกระทบ: IB01, OB01, screen pop, F01.210, F01.212

2. **WebSocket contract สำหรับ SLA breach**
   Frontend escalation layer สร้างเสร็จแล้วต่อ contract websocket แต่ backend breach scheduler ยังไม่ ship
   (non-mock mode ตอบ empty) — **ETA ของ scheduler และใคร owns contract event (frontend หรือ backend)
   จะได้แก้ mismatch ได้ก่อน**

3. **Holiday calendar สำหรับคำนวณ SLA (business day)**
   ปัจจุบันไม่มี holiday config (มีแค่ field `holidays` ที่ unused) — **ต้องนับ business day ตัดวันหยุดราชการไทย
   หรือไม่ และ holiday data เข้ามาจากไหน (BFF endpoint / import static / Genesys schedule)**

4. **Auto-create case หลังจบสาย + journey consolidation (F01.212, F01.210)**
   ตอนนี้ screen pop แค่ prefill form แบบ manual (query params `phoneNo`/`customerId`) — **แผนทางเทคนิค:
   auto-create case จาก call event (frontend สร้างเมื่อได้รับ CALL_END?) หรือ Genesys voice bot / journey
   ทำฝั่ง platform แล้ว C2C แค่รับ? ใคร owns การบันทึกบทสนทนา/แปลงเสียง**

5. **Agent status dashboard**
   วันนี้ render จาก mock array — **live data มาจาก BFF endpoint หรือ Genesys (agent state API)
   และถ้าใช้ Genesys console เป็นหลัก หน้านี้ยังจำเป็นอยู่หรือไม่**

6. **ขอบเขตของ instance Genesys Cloud CX 2 ที่ซื้อ/ใช้**
   **ทีม Genesys มี instance/config ให้ดูบ้างไหม (modules ที่ enable: dialer, call recording, CX 2
   APIs, PureInsights?)** เพราะคำตอบของคำถามฝั่ง Genesys ทุกข้อขึ้นกับขอบเขต license/modules
   ที่มี — ถ้าไม่มีข้อมูลนี้ เราไม่สามารถ map ได้ว่า feature ไหน Genesys ครอบคลุมแล้ว
