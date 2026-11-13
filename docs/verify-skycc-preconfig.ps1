# verify-skycc-preconfig.ps1
#
# Machine verification for docs/SKYCC-Pre-Config-JSON-Payloads.md.
#
# Three checks, each of which fails loudly with a non-zero exit code:
#
#   A  COVERAGE (both directions of provenance). Every expected data literal is asserted to be
#      present in a SOURCE document first, and only then in the artifact. A literal the sources do
#      not contain is reported as SOURCE-MISS, which is how a mistyped/transposed transcription is
#      caught: the eye reads an intended word, the script reads bytes.
#   B  FAITHFULNESS (artifact -> sources). Every Thai string in the artifact must be a substring of
#      one of the two source documents, so no Thai value was invented. Missing values must be
#      {{TH_*}} placeholders instead.
#   C  ARITHMETIC + PAYLOAD SYNTAX. The runbook's C.6 workflow table is re-summed from its own
#      per-node minute cells and compared with its printed total, then each title/total pair must
#      appear in the artifact; every ```json fenced block that starts with { or [ must parse.
#
# Re-run after any edit:  pwsh -File docs/verify-skycc-preconfig.ps1
# Exit code 1 on any failure.

[CmdletBinding()]
param(
  [string] $Artifact = (Join-Path $PSScriptRoot "SKYCC-Pre-Config-JSON-Payloads.md"),
  [string] $Runbook  = (Join-Path $PSScriptRoot "SKYCC-Tenant-Onboarding-Runbook.md"),
  [string] $Proto    = (Join-Path $PSScriptRoot "SKYCC-Service-Center-Project-Prototype.md")
)

$ErrorActionPreference = "Stop"

# ── normalisation ────────────────────────────────────────────────────────────────────────────────
# The prototype document is exported markdown with escaped punctuation (\&, \-, \.) and both files
# carry zero-width spaces. Strip both before any comparison, or every literal containing "&" fails.
function Get-Normalised([string] $text) {
  if ($null -eq $text) { return "" }
  $out = [regex]::Replace($text, '\\(.)', '$1')                    # unescape markdown punctuation
  $out = [regex]::Replace($out, '[\u200B-\u200D\uFEFF]', '')       # zero-width chars
  $out = [regex]::Replace($out, '[ \t]+', ' ')                     # collapse runs of spaces
  return $out
}

# Containment comparisons need a single-line form: the source documents wrap long table cells and
# prose across newlines ("*Escalation Matrix / Tier 2*"), so a literal that is visually one line in
# the artifact is two lines in the source. Line-based table parsing uses the per-line form above.
function Get-Flattened([string] $text) {
  return [regex]::Replace((Get-Normalised $text), '\s+', ' ')
}

foreach ($path in @($Artifact, $Runbook, $Proto)) {
  if (-not (Test-Path -LiteralPath $path)) { throw "missing input: $path" }
}

$docN   = Get-Flattened (Get-Content -LiteralPath $Artifact -Raw)
$srcN   = (Get-Flattened (Get-Content -LiteralPath $Runbook -Raw)) + " " +
          (Get-Flattened (Get-Content -LiteralPath $Proto   -Raw))

$failures = [System.Collections.Generic.List[string]]::new()

# ── A. COVERAGE ──────────────────────────────────────────────────────────────────────────────────
# Every entry is ASCII on purpose: the Thai side is covered by check B (faithfulness) and by the
# pair check below, so no Thai literal has to be re-typed into this script.
$expected = @(
  # C.1 organization (EN)
  "Inbound Customer Service", "Telesales", "Technical Support", "Back Office",
  "Client A Card Services", "Client B Policy Service", "Client C Retail CS",
  "Client C Telesales", "Client D Tele-survey", "Client B Tech Support",
  "Client A Document Processing", "Wave 1", "Wave 2",
  # C.2 user groups (EN)
  "Program A Delivery", "Program B Delivery", "Program C Delivery",
  "Telesales Desk", "QA & Compliance", "Workforce & Traffic", "Training & CX Academy",
  # C.3 roles + accounts
  "system_admin", "admin", "supervisor", "agent", "qa_analyst", "trainer", "client_viewer",
  "skycc.system", "skycc.admin", "sup.a.cs", "sup.c.tele", "sup.b.tech",
  "wfm.analyst", "qa.lead", "trainer.lead",
  "agent.a01", "agent.a02", "agent.c01", "agent.b01",
  # C.4 skills (EN)
  "Inbound Customer Service", "Billing & Payment", "Complaint Handling",
  "Retention & Cancellation", "Telesales", "Technical Support",
  "Back Office Processing", "English Service",
  # C.5 case types (EN) + every sTypeCode
  "Customer Service", "Complaint & Escalation", "Telesales", "Technical Support", "Back Office",
  "5001", "5002", "5003", "5004", "5005", "5006",
  "5101", "5102", "5103", "5201", "5202", "5203", "5301", "5302", "5303",
  "Product & Service Inquiry", "Order Status", "Billing & Payment", "Callback Request",
  "Complaint & Escalation", "Retention & Cancellation", "Lead Follow-up",
  "Upsell & Cross-sell", "Tele-survey", "Service Down / Outage", "App & Web Issue",
  "Device & Network Setup", "Email Response", "Document Processing", "Data Verification",
  # C.6 workflows + totals
  "SKYCC-Voice Inquiry", "SKYCC-Complaint", "SKYCC-Lead",
  "SKYCC-Tech Support", "SKYCC-Back Office",
  # C.7 forms
  "Voice Disposition Form", "Complaint & Retention Form",
  "Technical Support Form", "Back Office Case Form",
  # C.9 appointment types
  "Callback 15 min", "Callback 1 hour", "Follow-up Call", "Escalation Callback",
  # C.10 knowledge base (EN)
  "Operations", "Agent Scripts", "Greeting & Verification", "Escalation",
  "Tier 2 & Supervisor Matrix", "Program Briefs", "Client A", "Client C Telesales",
  "Compliance", "Do-Not-Say & PDPA",
  "Scripts", "Program Briefs", "Training", "Escalation Contacts", "Wave Handover",
  "Greeting & Identity Verification Script",
  "Client A Card Services — Program Brief", "Escalation Matrix Tier 2",
  # C.11 case results (EN)
  "Resolved on Call", "Callback Scheduled", "Transferred to Client", "Transferred to Tier 2",
  "Customer Disconnected", "Duplicate Contact", "No Action Required",
  # C.12 unit properties + seats
  "Voice Seat", "Chat Seat", "Email Seat", "Thai", "English", "Tier 2",
  "Supervisor Seat", "Back Office",
  "SEAT-001", "SEAT-002", "SEAT-003", "SEAT-004", "SEAT-005", "SEAT-006",
  # C.13 organization settings values
  "automatic", "load_balance", "skillBased", "combineWithAnd",
  "autoRequireAllSkills", "autoRespectShiftSchedule",
  # prototype document: the one unit-property pair both documents spell out
  "Not Spectify"
) | Select-Object -Unique

# Type names asserted by this package are verified against CODE, not against the two data
# documents: they are the create contracts the payloads are shaped for. They are listed separately
# so a genuine document literal and a code contract can never be confused for one another.
$codeContracts = @(
  "DepartmentCreateData", "CommandCreateData", "StationCreateData", "RoleCreateData",
  "RolePermissionsCreateData", "PermissionCreateData", "UserFormData", "ResetPasswordData",
  "UserGroupCreateData", "AssignUserGroupBatchData", "SkillCreateData", "PropertyCreateData",
  "UnitFormData", "UnitPropertyBulkAssignData", "CaseTypesCreateData", "CaseSubTypesCreateData",
  "WorkflowData", "CaseResultCreateData", "CustomerFormConfigType", "AppointmentTypeInsert",
  "IndividualFormField", "FormRule", "ArticleFormInput", "ArticleStatusInput",
  "SyncServiceTypeArticleInput", "MmdUnitInput", "OrgAssignmentRulesUpdateData"
)

$covered = 0
foreach ($e in $expected) {
  if (-not $srcN.Contains($e)) {
    $failures.Add("SOURCE-MISS  '$e' is not in either source document (transcription error?)")
    continue
  }
  if (-not $docN.Contains($e)) {
    $failures.Add("NOT-COVERED  '$e' is in the sources but missing from the artifact")
    continue
  }
  $covered++
}

# code contracts: the artifact must name every create type it claims to be shaped for
$contracts = 0
foreach ($c in $codeContracts) {
  if (-not $docN.Contains($c)) {
    $failures.Add("CONTRACT-MISS  create type '$c' is not named in the artifact")
    continue
  }
  $contracts++
}

# ── A2. PAIR COVERAGE (EN <-> TH), no Thai re-typed into this script ─────────────────────────────
# The C.2 groups table is the one table whose two name columns sit side by side in the source, so it
# can be paired mechanically: read the row's TH cell out of the SOURCE, then require the artifact to
# carry it. This is the coverage half of the Thai check without any Thai in this file.
$runbookRaw = Get-Content -LiteralPath $Runbook -Raw
$c2 = [regex]::Match($runbookRaw, '(?s)### C\.2 User groups.*?\n### C\.3')
$pairs = 0
if (-not $c2.Success) {
  $failures.Add("PARSE  could not locate runbook section C.2")
} else {
  foreach ($line in ($c2.Value -split "`n")) {
    if ($line -notmatch '^\|' -or $line -match '^\|\s*-+' -or $line -match 'Group EN') { continue }
    $cells = $line.Trim('|').Split('|') | ForEach-Object { Get-Normalised $_.Trim() }
    if ($cells.Count -lt 2) { continue }
    $en = $cells[0]; $th = $cells[1]
    if ([string]::IsNullOrWhiteSpace($en) -or $th -notmatch '[\u0E00-\u0E7F]') { continue }
    if (-not $docN.Contains($th)) {
      $failures.Add("PAIR-MISS  C.2 group '$en' -> Thai '$th' is not in the artifact")
      continue
    }
    if (-not $docN.Contains($en)) {
      $failures.Add("PAIR-MISS  C.2 group EN '$en' is not in the artifact")
      continue
    }
    $pairs++
  }
}

# ── B. FAITHFULNESS (artifact -> sources) ────────────────────────────────────────────────────────
# Rationale: an invented Thai value is indistinguishable from a transcribed one by reading. Every
# Thai run in the artifact must therefore be traceable to a source byte.
$thaiRuns = [regex]::Matches($docN, '[\u0E00-\u0E7F][\u0E00-\u0E7F\s]*[\u0E00-\u0E7F]|[\u0E00-\u0E7F]') |
            ForEach-Object { $_.Value.Trim() } |
            Where-Object { $_ -match '[\u0E00-\u0E7F]' } |
            Sort-Object -Unique

$faithful = 0
foreach ($t in $thaiRuns) {
  if ($srcN.Contains($t)) { $faithful++; continue }
  $failures.Add("NOT-FAITHFUL  Thai string '$t' does not occur in either source document")
}

# ── B2. CLOSED VOCABULARIES (artifact -> source) ─────────────────────────────────────────────────
# Coverage proves the right values are present; it cannot see an invented one sitting beside them.
# For code-shaped domains that are closed sets in the source, assert the reverse direction too: every
# such token in the artifact must be one of the source's tokens. This is the check that catches a
# plausible-looking code like 5299 or SEAT-007.
$srcCodes = @()
$c5 = [regex]::Match($runbookRaw, '(?s)### C\.5 Case types and sub-types.*?\n### C\.6')
if (-not $c5.Success) {
  $failures.Add("PARSE  could not locate runbook section C.5")
} else {
  foreach ($line in ($c5.Value -split "`n")) {
    if ($line -notmatch '^\|\s*\d+\s*\|') { continue }
    $cells = $line.Trim('|').Split('|') | ForEach-Object { (Get-Normalised $_.Trim()).Trim('`') }
    if ($cells.Count -lt 3) { continue }
    if ($cells[2] -match '^\d{4}$') { $srcCodes += $cells[2] }
  }
}
$srcCodes = $srcCodes | Sort-Object -Unique
if ($srcCodes.Count -ne 15) { $failures.Add("PARSE  expected 15 sTypeCodes in C.5, found $($srcCodes.Count)") }

$artifactCodes = [regex]::Matches($docN, '(?<![\d.])5\d{3}(?![\d])') |
                 ForEach-Object { $_.Value } | Sort-Object -Unique
foreach ($code in $artifactCodes) {
  if ($srcCodes -notcontains $code) {
    $failures.Add("INVENTED-CODE  sTypeCode-like '$code' is in the artifact but not in C.5")
  }
}

$srcSeats = [regex]::Matches($runbookRaw, 'SEAT-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
$artifactSeats = [regex]::Matches($docN, 'SEAT-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
foreach ($seat in $artifactSeats) {
  if ($srcSeats -notcontains $seat) {
    $failures.Add("INVENTED-ID  seat id '$seat' is in the artifact but not in C.12")
  }
}

# ── C. ARITHMETIC + JSON SYNTAX ──────────────────────────────────────────────────────────────────
$c6 = [regex]::Match($runbookRaw, '(?s)### C\.6 Workflows and SLA bands.*?\n### C\.7')
$workflows = 0
if (-not $c6.Success) {
  $failures.Add("PARSE  could not locate runbook section C.6")
} else {
  foreach ($line in ($c6.Value -split "`n")) {
    if ($line -notmatch '^\|\s*\d\s*\|') { continue }
    # columns: # | Workflow | New | Assigned | Acknowledge | In-progress | Done | Closed | Total SLA
    $cells = $line.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
    if ($cells.Count -lt 9) { continue }
    $title = Get-Normalised $cells[1]
    $minutes = @()
    for ($i = 2; $i -le 7; $i++) {
      if ($cells[$i] -notmatch '^\d+$') { $minutes = @(); break }
      $minutes += [int]$cells[$i]
    }
    if ($minutes.Count -ne 6) { continue }
    $sum = ($minutes | Measure-Object -Sum).Sum
    $printed = Get-Normalised ($cells[8] -replace '\*', '')
    if ($printed -notmatch '^\d+$') { continue }
    if ($sum -ne [int]$printed) {
      $failures.Add("ARITHMETIC  C.6 '$title' sums to $sum but the source prints $printed")
      continue
    }
    if (-not $docN.Contains("`"title`": `"$title`"")) {
      $failures.Add("NOT-COVERED  workflow body for '$title' is missing from the artifact")
      continue
    }
    if (-not $docN.Contains("`"totalSla`": $sum")) {
      $failures.Add("MISMATCH  artifact carries no totalSla $sum for '$title'")
      continue
    }
    $workflows++
  }
}

# every ```json fenced block that starts with { or [ must be valid JSON, with one stated exception:
# blocks carrying an UNQUOTED {{PLACEHOLDER}} are reference tables for numeric inputs (KMS artId /
# status_id, which the interfaces type as number) and cannot be valid JSON by construction. They are
# counted and reported as skipped rather than silently ignored.
$rawDoc = Get-Content -LiteralPath $Artifact -Raw
$jsonBlocks = 0
$skippedBlocks = 0
foreach ($m in [regex]::Matches($rawDoc, '(?s)```json\s*\n(.*?)```')) {
  $body = $m.Groups[1].Value
  $stripped = ($body -split "`n" | Where-Object { $_ -notmatch '^\s*//' }) -join "`n"
  $trimmed = $stripped.TrimStart()
  if (-not ($trimmed.StartsWith('{') -or $trimmed.StartsWith('['))) { continue }
  if ($trimmed -match ':\s*\{\{' -or $trimmed -match '\[\s*\{\{') {
    $skippedBlocks++
    continue
  }
  $jsonBlocks++
  try { $null = $trimmed | ConvertFrom-Json } catch {
    $snippet = ($trimmed -split "`n")[0]
    $failures.Add("JSON  a ```json block does not parse (first line: $snippet) -- $($_.Exception.Message)")
  }
}

# ── D. CROSS-REFERENCE INTEGRITY ─────────────────────────────────────────────────────────────────
# A "§N" reference is a claim like any other: it must resolve to a section that exists. This catches
# the failure mode where sections are renumbered during authoring while the prose keeps old numbers.
# References into a DIFFERENT document are marked ("Prototype §9", "SKYICT-Pre-Config… §11") and are
# excluded, so this check only governs this file's own numbering.
$headings = @{}
foreach ($m in [regex]::Matches($rawDoc, '(?m)^## (\d+)\.')) { $headings[[int]$m.Groups[1].Value] = $true }
$refs = 0
foreach ($m in [regex]::Matches($rawDoc, '§(\d+)')) {
  $n = [int]$m.Groups[1].Value
  $lineStart = $rawDoc.LastIndexOf("`n", $m.Index) + 1
  $lineEnd = $rawDoc.IndexOf("`n", $m.Index); if ($lineEnd -lt 0) { $lineEnd = $rawDoc.Length }
  $line = $rawDoc.Substring($lineStart, $lineEnd - $lineStart)
  if ($line -match 'Prototype §|prototype document|SKYICT-Pre-Config') { continue }
  if (-not $headings.ContainsKey($n)) {
    $failures.Add("XREF  '§$n' does not resolve to any '## $n.' heading -- $($line.Trim())")
    continue
  }
  $refs++
}

# ── report ───────────────────────────────────────────────────────────────────────────────────────
Write-Output "artifact : $([System.IO.Path]::GetFileName($Artifact))"
Write-Output "sources  : SKYCC-Tenant-Onboarding-Runbook.md + SKYCC-Service-Center-Project-Prototype.md"
Write-Output ""
Write-Output ("A  coverage        : {0}/{1} literals present in both source and artifact" -f $covered, $expected.Count)
Write-Output ("A  code contracts  : {0}/{1} create types named in the artifact" -f $contracts, $codeContracts.Count)
Write-Output ("A2 pair coverage   : {0} C.2 group rows verified EN+TH" -f $pairs)
Write-Output ("B  faithfulness    : {0}/{1} Thai strings traceable to a source document" -f $faithful, $thaiRuns.Count)
Write-Output ("B2 vocabularies    : {0} sTypeCodes + {1} seat ids, all from the source" -f $artifactCodes.Count, $artifactSeats.Count)
Write-Output ("C  workflow sums   : {0}/5 C.6 totals re-summed and matched in the artifact" -f $workflows)
Write-Output ("C  json blocks     : {0} parsed, {1} skipped (unquoted numeric placeholder)" -f $jsonBlocks, $skippedBlocks)
Write-Output ("D  cross-references: {0} §N references resolve to an existing section" -f $refs)
Write-Output ""

if ($failures.Count -gt 0) {
  Write-Output "RESULT: FAIL -- $($failures.Count) problem(s)"
  foreach ($f in $failures) { Write-Output "  - $f" }
  exit 1
}

Write-Output "RESULT: PASS -- 0 mismatches"
exit 0
