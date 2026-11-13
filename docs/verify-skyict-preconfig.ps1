# Machine verification for docs/SKYICT-Pre-Config-JSON-Payloads.md
#
# Two checks (anti-regression: no eyeballing):
#   1. COVERAGE  - every data literal transcribed from the source docs must appear in
#                  the payload document verbatim (whitespace-normalized).
#   2. FAITHFUL  - every Thai (non-ASCII) string in the payload document must be a
#                  substring of one of the two source documents, i.e. no invented
#                  Thai literal. Documented deliberate expansions go in $allowed.
#
# Usage:  pwsh -File docs/verify-skyict-preconfig.ps1   (exit 1 on any failure)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$doc  = (Get-Content -Raw -Encoding UTF8 "$root/docs/SKYICT-Pre-Config-JSON-Payloads.md")
$v3   = (Get-Content -Raw -Encoding UTF8 "$root/docs/SKYICT-Service-Center-Project-Prototype-v3.md")
$rb   = (Get-Content -Raw -Encoding UTF8 "$root/docs/SKYICT-Tenant-Onboarding-Runbook-v2.md")

$docN = ($doc -replace '\s+', ' ')
$srcN = ($v3 + "`n" + $rb) -replace '\s+', ' '

# Deliberate, documented deviations / non-transcribed prose (each is flagged in the doc or is
# a template example, not a literal copied from the source tables).
$allowed = @(
  "เครื่องพิมพ์"          # v3 §7 prints the truncated "พิมพ์" (printer); expanded in doc with a note
  "กล้องวงจรปิด"         # device-template example only (§28) — not in the source tables
)

# ---- 1. COVERAGE: literals that MUST be present in the payload document -------
$expected = @()

# §1 user groups (v3 §4 = runbook C.2 + 2)
$expected += "General", "Dispatch Group 1", "Dispatch Group 2", "Order Approval",
  "Technical", "Agent", "Dispatcher", "Operation",
  "ทั่วไป", "กลุ่มกระจายงาน 1", "กลุ่มกระจายงาน 2", "อนุมัติคำสั่งซื้อ",
  "สายเทคนิค", "นักโทรฯ", "ผู้กระจายงาน", "การปฏิบัติการ"

# §2 skills (v3 §8 EN + runbook C.4 TH)
$expected += "Investigation", "Repair", "Service", "Maintenance", "General Support", "Outsource",
  "ตรวจสอบ", "ซ่อมแซม", "บริการ", "บำรุงรักษา", "สนับสนุนทั่วไป", "ส่งต่อภายนอก"

# §3 area (v3 §9 = runbook C.8)
$expected += "THAILAND", "ไทย", "BANGKOK", "กรุงเทพมหานคร",
  "01", "พระนคร", "PHRA NAKHON",
  "02", "ดุสิต", "DUSIT",
  "03", "หนองจอก", "NONG CHOK",
  "04", "บางรัก", "BANG RAK",
  "05", "บางเขน", "BANG KHEN",
  "06", "บางกะปิ", "BANG KAPI"

# §4 case types (v3 §5 = runbook C.6)
$expected += "IT Service", "บริการ IT", "ซ่อมแซม", "บริการทั่วไป", "ซ่อมบำรุง", "ส่งต่อภายนอก",
  "แจ้งเหตุฉุกเฉิน"

# §5 workflows (v3 §6 = runbook C.6)
$expected += "SKYICT-Investigation Flow", "SKYICT-Repair Flow", "SKYICT-Service Flow",
  "SKYICT-Maintenance Flow", "SKYICT-Outsourced Flow", "Order Part"

# §6 sub-types (v3 §5 table: codes, en, th, device/work-order, SLA)
$expected += "3001", "Telephony Hardware & IT Service", "อุปกรณ์โทรศัพท์และระบบ IT",
  "3002", "Hardware Repair", "ซ่อมแซมฮาร์ดแวร์",
  "3003", "General IT Service", "บริการ IT ทั่วไป (ติดตั้ง/จัดเตรียม)",
  "3101", "Preventive Maintenance", "บำรุงรักษาเชิงป้องกัน",
  "3201", "Outsourced Service", "งานส่งต่อหน่วยงานภายนอก",
  "3901", "Emergency Outage", "เหตุขัดข้องวิกฤต",
  "TEL", "Telephony Hardware", "HW", "IT Hardware", "IT", "General IT",
  "PM", "OUT", "Outsourced", "EMG", "Emergency"

# §7 case results (v3 §11 = runbook C.12)
$expected += "Work Completed", "ปิดงานเรียบร้อย", "Resolved Remote", "แก้ปัญหาทางไกล",
  "Customer Cancelled", "ลูกค้ายกเลิก", "Transferred to Vendor", "ส่งต่อผู้ขาย/ผู้ผลิต",
  "Duplicate Case", "เคสซ้ำ"

# §8 unit properties (v3 §10)
$expected += "Not Spectify", "ไม่ระบุ", "General Service", "งานบริการทั่วไป",
  "Emergency Response", "ตอบเหตุฉุกเฉิน", "Telephony", "ระบบโทรศัพท์",
  "Network", "ระบบเครือข่าย", "Hardware", "ฮาร์ดแวร์", "Software", "ซอฟต์แวร์"

# §9 units (v3 §10 = runbook C.5)
$expected += "UNIT-001", "UNIT-002", "UNIT-003", "UNIT-004", "UNIT-005",
  "responder1", "responder2", "generalservice", "emergencyservice1", "emergencyservice2"

# §11 brands (v3 §12)
$expected += "Grandstream", "Cisco", "Avaya"

# §12 categories (v3 §12)
$expected += "Telephony", "ระบบโทรศัพท์", "Network", "เครือข่าย", "IT Hardware"

# §13 stores (v3 §12)
$expected += "HQ", "ร้านค้าสำนักงานใหญ่", "Store 1", "คลังสินค้า 1", "Store 2", "คลังสินค้า 2"

# §14 products (v3 §12: code, en, th, price, mfd, warranty)
$expected += "P-0001", "IP Phone", "โทรศัพท์ IP", "3500",
  "P-0002", "VoIP Gateway", "15900",
  "P-0003", "Network Switch", "12000",
  "P-0004", "Access Point", "8500",
  "P-0005", "PBX Server", "120000", "2025"

# §15 spare parts (v3 §12: en, th, price, warranty)
$expected += "Phone Cable RJ11", "สายโทรศัพท์ RJ11", "150",
  "IP Phone Power Adapter", "อะแดปเตอร์ไฟ IP Phone", "250",
  "SFP Transceiver", "โมดูล SFP", "2500",
  "CAT6 Cable", "สาย LAN Cat6", "60",
  "HDMI Cable", "สาย HDMI", "200"

# §23 appointment types (v3 §13 = runbook C.11)
$expected += "General", "ทั่วไป", "Consult", "ปรึกษา", "Product Advise", "แนะนำสินค้า"

# §19 customers (v3 §13 = runbook C.3)
$expected += "Watee Thaiprasonk", "watee.tha@skyai.co.th", "AI680013",
  "Wisarud Techa", "wisarud.tec@skyai.co.th", "AI680021",
  "Apiwat Rodchuajeen", "apiwat.rod@skyai.co.th", "AI680018"

# §27 KB (v3 §14 = runbook C.11)
$expected += "Operations", "การแก้ไขปัญหา", "Procedures", "ขั้นตอนการตรวจสอบ",
  "No Audio Troubleshooting", "ขั้นตอนการแก้ไขปัญหาโทรศัพท์ไม่มีเสียง",
  "User Manual", "คู่มือใช้งาน", "Emergency Procedures", "การแจ้งเหตุฉุกเฉิน",
  "SKYICT", "Document", "Training", "HandOver", "Emergency Contact List",
  "No Audio on IP Phone Troubleshooting", "โทรศัพท์", "ไม่มีเสียง", "VoIP",
  "Replacing LAN Cable & SFP Module", "การเปลี่ยนสาย", "โมดูล", "LAN", "SFP", "Switch",
  "PBX Quick Start Guide", "คู่มือ", "เบื้องต้น", "PBX"

# workflow SLA figures (v3 §6 / runbook C.6).
# The Investigation body is full JSON -> "sla"/"totalSla" pairs; the other four flows
# live in the markdown delta table -> quoted cell values + the totals column.
# Only the Investigation flow is a full JSON body (sla 1/3/5/45, totalSla 64); the other
# four flows appear as the markdown delta table rows checked below (90/60/240/180/10).
$expected += '"sla": "1"', '"sla": "3"', '"sla": "5"', '"sla": "45"',
  '"totalSla": 64', "3,059", "2880",
  '| SKYICT-Repair Flow | "1" | "3" | "5" | "90" | "5" | "5" | 109 |',
  '| SKYICT-Service Flow | "1" | "3" | "5" | "60" | "5" | "5" | 79 |',
  '| SKYICT-Maintenance Flow | "1" | "3" | "10" | "240" | "10" | "5" | 269 |',
  '| SKYICT-Outsourced Flow | "1" | "3" | "5" | "180" | "5" | "5" | 199 |'

# ---- run checks ---------------------------------------------------------------
$fail = 0

Write-Host "== 1. Coverage: source literals present in the payload document =="
foreach ($e in $expected) {
  if (-not $docN.Contains($e)) {
    Write-Host ("  MISSING: {0}" -f $e)
    $fail++
  }
}

Write-Host "== 2. Faithfulness: Thai literals in the document exist in the sources =="
$seen = New-Object System.Collections.Generic.HashSet[string]
# Only match sequences that actually contain a Thai letter (skips symbols like –, ≤, §).
$thai = [regex]::Matches($docN, '[^\u0000-\u007F]+') | Where-Object {
  $_.Value -match '[\u0E00-\u0E7F]'
} | ForEach-Object { $_.Value.Trim() }
foreach ($t in $thai) {
  if (-not $seen.Add($t)) { continue }
  if ($allowed -contains $t) { continue }
  if (-not $srcN.Contains($t)) {
    Write-Host ("  NOT IN SOURCES: {0}" -f $t)
    $fail++
  }
}

$thaiCount = $seen.Count
Write-Host ""
if ($fail -eq 0) {
  Write-Host ("PASS: {0} expected literals covered, {1} Thai literals faithful, 0 mismatches" -f $expected.Count, $thaiCount)
} else {
  Write-Host ("FAIL: {0} mismatch(es) found" -f $fail)
  exit 1
}
