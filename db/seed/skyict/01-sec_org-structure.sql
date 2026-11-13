-- =====================================================================================
-- Tenant seed: SKYICT — organization structure
--   public.sec_departments → public.sec_commands → public.sec_stations
--
-- Source data : docs/SKYICT-Service-Center-Project-Prototype-v2.md, §1 "Organization
--               Information" (7 rows) — the SKYICT / <zone> / <station> ladder
-- Generated   : 2026-11-05 (rev 3)
-- Rows        : 1 department, 6 commands, 7 stations
-- Depends on  : the tenant's organization record must exist (its id is the parameter in §1)
-- Consumed by : db/seed/skyict/02-um_users.sql — copy the ids printed by §5.4 into that
--               script's parameter block
--
-- PORTABILITY — plain SQL only.
--   This file contains NO client meta-commands (`\set`, `\if`, `\gset`, …). rev 2 used them and
--   failed with `syntax error at or near "\"` (SQLSTATE 42601) when pasted into a GUI SQL editor.
--   Parameters live in a session TEMP TABLE (§1), so the file runs unchanged in psql, DBeaver,
--   pgAdmin, DataGrip, Azure Data Studio, or a CI job.
--
-- Quick Start Guide
--   1. Update the values ​​in §1 (INSERT INTO _seed_cfg) — this is the only place that needs editing.
--   2. Execute the entire file (SQL script), or run: psql -v ON_ERROR_STOP=1 -f 02-sec_org-structure.sql
--   3. Copy the `deptId`, `commId`, and `stnId` values ​​from the output of §5.4 and paste them into §1 of `02-um_users.sql`.
--   The script can be re-run without creating duplicate data.
--
-- ID POLICY — read before editing:
--   * The business keys deptId / commId / stnId are NOT chosen by this script. The product treats
--     them as server-assigned (the frontend's DepartmentCreateData / CommandCreateData /
--     StationCreateData carry only {active, en, th} plus the parent id —
--     src/core/types/organization.ts:25-84), so the database mints them with gen_random_uuid() and
--     the rows are linked BY NAME, never by a literal id. Do not introduce a hard-coded identifier
--     here: a value invented by a seed script can collide with a real row, drift from what the app
--     would generate, and has no owner in the tenant.
--   * `id` is likewise not inserted — it is the surrogate and takes its column default. Writing into
--     a serial column by hand desynchronises its sequence.
--   * ASSUMPTIONS (adapt §3/§4 if either is false for the target database):
--       1. the three business-key columns are uuid (they are UUIDs in every captured API payload,
--          src/core/mocks/userCURL.v2.sh:236-249) and gen_random_uuid() exists (PostgreSQL 13+);
--       2. within one organization, `en` is unique per level — the parent lookup matches on it.
-- =====================================================================================

-- =====================================================================================
-- §0 — Preflight (run these two queries first, then continue)
-- =====================================================================================

-- 0.1 The tenant's organization id (ADAPT the table name if it differs)
-- SELECT id, name FROM public.<organization_table> WHERE name = 'SKYICT';

-- 0.2 Does this tenant already have organization rows? If it does, decide whether to reuse them
--     instead of running §2–§4 (see §8 D4).
-- SELECT count(*) FROM public.sec_departments WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid;

-- =====================================================================================
-- §1 — PARAMETERS — the only block you edit
--
-- A session temp table is used instead of client variables so the same file runs everywhere.
-- It is recreated each run; it disappears when the session ends.
-- =====================================================================================

DROP TABLE IF EXISTS _seed_cfg;

CREATE TEMP TABLE _seed_cfg (
    org_id             uuid    NOT NULL,
    actor              text    NOT NULL,
    use_en_for_th      boolean NOT NULL,   -- true -> "th" = the English name (no Thai in the source)
    create_call_center boolean NOT NULL    -- true -> §6 also creates the "Central Call Center" unit
);

INSERT INTO _seed_cfg (org_id, actor, use_en_for_th, create_call_center)
VALUES ('c53d14b6-8464-4ece-b15f-8abdc0d1c43c'::uuid, 'system', true, false);

-- Sanity check: confirm these four values before letting the script continue.
SELECT org_id, actor, use_en_for_th, create_call_center FROM _seed_cfg;

-- =====================================================================================
-- §2 — Department (1 row)
--      Source: "Organization Information" — column "Level 1" = SKYICT for all 7 rows
-- =====================================================================================

INSERT INTO public.sec_departments ("deptId", "orgId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT
    gen_random_uuid(),
    cfg.org_id,
    v.en,
    CASE WHEN cfg.use_en_for_th THEN v.en ELSE NULL END,
    TRUE,
    now(), now(), cfg.actor, cfg.actor
FROM (VALUES ('SKYICT')) AS v (en)
CROSS JOIN _seed_cfg cfg
WHERE NOT EXISTS (
    SELECT 1 FROM public.sec_departments d
     WHERE d."orgId" = cfg.org_id
       AND d.en = v.en
);

-- =====================================================================================
-- §3 — Commands (6 rows)
--      Source: column "Level 2" of the 7 rows, de-duplicated in document order:
--              Center Zone, North Zone, Northeast Zone, South Zone, East Zone, West Zone
--      Parent resolved by name (§2); commId is generated by the database.
-- =====================================================================================

INSERT INTO public.sec_commands ("deptId", "orgId", "commId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT
    d."deptId",
    d."orgId",
    gen_random_uuid(),
    v.en,
    CASE WHEN cfg.use_en_for_th THEN v.en ELSE NULL END,
    TRUE,
    now(), now(), cfg.actor, cfg.actor
FROM (VALUES
    ('Center Zone'),
    ('North Zone'),
    ('Northeast Zone'),
    ('South Zone'),
    ('East Zone'),
    ('West Zone')
) AS v (en)
CROSS JOIN _seed_cfg cfg
JOIN public.sec_departments d
  ON d."orgId" = cfg.org_id
 AND d.en = 'SKYICT'
WHERE NOT EXISTS (
    SELECT 1 FROM public.sec_commands c
     WHERE c."orgId" = d."orgId"
       AND c."deptId" = d."deptId"
       AND c.en = v.en
);

-- =====================================================================================
-- §4 — Stations (7 rows)
--      Source: column "Level 3" of the 7 rows, plus the zone each station belongs to:
--              Station 1 → Center Zone        Station 5 → South Zone
--              Station 2 → Center Zone        Station 6 → East Zone
--              Station 3 → North Zone         Station 7 → West Zone
--              Station 4 → Northeast Zone
-- =====================================================================================

INSERT INTO public.sec_stations ("orgId", "deptId", "commId", "stnId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT
    d."orgId",
    d."deptId",
    c."commId",
    gen_random_uuid(),
    v.en,
    CASE WHEN cfg.use_en_for_th THEN v.en ELSE NULL END,
    TRUE,
    now(), now(), cfg.actor, cfg.actor
FROM (VALUES
    ('Station 1', 'Center Zone'),
    ('Station 2', 'Center Zone'),
    ('Station 3', 'North Zone'),
    ('Station 4', 'Northeast Zone'),
    ('Station 5', 'South Zone'),
    ('Station 6', 'East Zone'),
    ('Station 7', 'West Zone')
) AS v (en, command_en)
CROSS JOIN _seed_cfg cfg
JOIN public.sec_departments d
  ON d."orgId" = cfg.org_id
 AND d.en = 'SKYICT'
JOIN public.sec_commands c
  ON c."orgId" = d."orgId"
 AND c."deptId" = d."deptId"
 AND c.en = v.command_en
WHERE NOT EXISTS (
    SELECT 1 FROM public.sec_stations s
     WHERE s."orgId" = d."orgId"
       AND s."commId" = c."commId"
       AND s.en = v.en
);

-- =====================================================================================
-- §5 — Verification
-- =====================================================================================

-- 5.1 Expected: department 1 · commands 6 · stations 7
SELECT 'departments' AS level, count(*) AS rows FROM public.sec_departments, _seed_cfg cfg WHERE "orgId" = cfg.org_id
UNION ALL
SELECT 'commands',  count(*) FROM public.sec_commands,  _seed_cfg cfg WHERE "orgId" = cfg.org_id
UNION ALL
SELECT 'stations',  count(*) FROM public.sec_stations,  _seed_cfg cfg WHERE "orgId" = cfg.org_id;

-- 5.2 The hierarchy as the UI's Organization screen renders it — expected 7 rows
SELECT d.en AS department, c.en AS command, s.en AS station
  FROM public.sec_stations s
  JOIN public.sec_commands    c ON c."commId" = s."commId" AND c."orgId" = s."orgId"
  JOIN public.sec_departments d ON d."deptId" = s."deptId" AND d."orgId" = s."orgId"
  CROSS JOIN _seed_cfg cfg
 WHERE s."orgId" = cfg.org_id
 ORDER BY s.en;

-- 5.3 Broken links / duplicate ids — every count must be 0
SELECT
  (SELECT count(*) FROM public.sec_commands c, _seed_cfg cfg
    WHERE c."orgId" = cfg.org_id
      AND NOT EXISTS (SELECT 1 FROM public.sec_departments d
                       WHERE d."orgId" = c."orgId" AND d."deptId" = c."deptId")) AS commands_without_dept,
  (SELECT count(*) FROM public.sec_stations s, _seed_cfg cfg
    WHERE s."orgId" = cfg.org_id
      AND NOT EXISTS (SELECT 1 FROM public.sec_commands c
                       WHERE c."orgId" = s."orgId" AND c."commId" = s."commId")) AS stations_without_command,
  (SELECT count(*) FROM (
      SELECT "deptId" FROM public.sec_departments, _seed_cfg cfg
       WHERE "orgId" = cfg.org_id
       GROUP BY "deptId" HAVING count(*) > 1) x) AS duplicate_dept_ids;

-- 5.4 The ids 01-um_users.sql needs — copy the row for the station you want
SELECT d."deptId", c."commId", s."stnId", d.en AS dept, c.en AS command, s.en AS station
  FROM public.sec_stations s
  JOIN public.sec_commands    c ON c."commId" = s."commId" AND c."orgId" = s."orgId"
  JOIN public.sec_departments d ON d."deptId" = s."deptId" AND d."orgId" = s."orgId"
  CROSS JOIN _seed_cfg cfg
 WHERE s."orgId" = cfg.org_id
 ORDER BY s.en;

-- =====================================================================================
-- §6 — OPTIONAL: the call-centre unit the *user* list names (see §8 D5)
--
--   RUN THIS SECTION ONLY IF `create_call_center` is true in §1, i.e. you decided that the seeded
--   users belong to "Central Call Center / Central Call Center / Call Center" instead of one of the
--   zone stations. It creates a SECOND department alongside SKYICT — a hierarchy decision, not a
--   technical one. The section is idempotent, so running it accidentally is harmless as long as the
--   decision was intended.
-- =====================================================================================

INSERT INTO public.sec_departments ("deptId", "orgId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT gen_random_uuid(), cfg.org_id, 'Central Call Center',
       CASE WHEN cfg.use_en_for_th THEN 'Central Call Center' ELSE NULL END,
       TRUE, now(), now(), cfg.actor, cfg.actor
FROM _seed_cfg cfg
WHERE cfg.create_call_center
  AND NOT EXISTS (
      SELECT 1 FROM public.sec_departments d
       WHERE d."orgId" = cfg.org_id AND d.en = 'Central Call Center');

INSERT INTO public.sec_commands ("deptId", "orgId", "commId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT d."deptId", d."orgId", gen_random_uuid(), 'Central Call Center',
       CASE WHEN cfg.use_en_for_th THEN 'Central Call Center' ELSE NULL END,
       TRUE, now(), now(), cfg.actor, cfg.actor
FROM public.sec_departments d
CROSS JOIN _seed_cfg cfg
WHERE d."orgId" = cfg.org_id
  AND d.en = 'Central Call Center'
  AND cfg.create_call_center
  AND NOT EXISTS (
      SELECT 1 FROM public.sec_commands c
       WHERE c."orgId" = d."orgId" AND c."deptId" = d."deptId" AND c.en = 'Central Call Center');

INSERT INTO public.sec_stations ("orgId", "deptId", "commId", "stnId", en, th, active, "createdAt", "updatedAt", "createdBy", "updatedBy")
SELECT d."orgId", d."deptId", c."commId", gen_random_uuid(), 'Call Center',
       CASE WHEN cfg.use_en_for_th THEN 'Call Center' ELSE NULL END,
       TRUE, now(), now(), cfg.actor, cfg.actor
FROM public.sec_departments d
JOIN public.sec_commands c
  ON c."orgId" = d."orgId" AND c."deptId" = d."deptId" AND c.en = 'Central Call Center'
CROSS JOIN _seed_cfg cfg
WHERE d."orgId" = cfg.org_id
  AND d.en = 'Central Call Center'
  AND cfg.create_call_center
  AND NOT EXISTS (
      SELECT 1 FROM public.sec_stations s
       WHERE s."orgId" = d."orgId" AND s."commId" = c."commId" AND s.en = 'Call Center');

-- Ids for 01-um_users.sql when §6 was used (empty result = the section did nothing)
SELECT d."deptId" AS dept_id, c."commId" AS comm_id, s."stnId" AS stn_id
  FROM public.sec_departments d
  JOIN public.sec_commands c ON c."orgId" = d."orgId" AND c."deptId" = d."deptId"
  JOIN public.sec_stations s ON s."orgId" = d."orgId" AND s."commId" = c."commId"
  CROSS JOIN _seed_cfg cfg
 WHERE d."orgId" = cfg.org_id AND d.en = 'Central Call Center' AND s.en = 'Call Center';

-- =====================================================================================
-- §7 — Rollback (run by hand if needed; deletes by NAME because this script never knew the ids)
--
-- Children first, then the parent. One statement per line on purpose: a commented-out multi-line
-- statement is easy to copy incompletely, which turns the rollback itself into an error.
-- Replace '00000000-0000-0000-0000-000000000000' with the tenant's org id.
-- =====================================================================================

-- DELETE FROM public.sec_stations WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid AND "commId" IN (SELECT "commId" FROM public.sec_commands WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid AND en IN ('Center Zone','North Zone','Northeast Zone','South Zone','East Zone','West Zone','Central Call Center'));
-- DELETE FROM public.sec_commands WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid AND en IN ('Center Zone','North Zone','Northeast Zone','South Zone','East Zone','West Zone','Central Call Center');
-- DELETE FROM public.sec_departments WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid AND en IN ('SKYICT','Central Call Center');

-- =====================================================================================
-- §8 — Decisions and assumptions
-- =====================================================================================
--
-- D1  Mapping. The document's §1 table lists 7 (department, command, station) triples; the rows
--     here are the de-duplicated levels they imply — 1 department, 6 commands, 7 stations — with
--     each station attached to the zone the document pairs it with (Center holds Station 1 and 2).
--
-- D2  Thai names. The document supplies English names only. `use_en_for_th = true` copies the
--     English string into `th` so the Thai UI is not blank; it is not a translation. Set it to
--     false once reviewed Thai names are available — and if sec_*.th is NOT NULL, provide them
--     in the same change (verified: the insert then fails with
--     `null value in column "th" ... violates not-null constraint`).
--
-- D3  Identifiers are database-generated. deptId / commId / stnId come from gen_random_uuid();
--     this script contains no literal ids, so there is nothing to collide with an existing row and
--     nothing to reconcile with what the application would have produced. Rows are linked by
--     resolving the parent on (orgId, en) — hence assumption 2 in the header.
--
-- D4  Re-runnability. Every insert is guarded by NOT EXISTS on the natural key (orgId + parent +
--     en), so running the file twice is a no-op and the generated ids stay stable across runs.
--     It does NOT update an existing row: if a name or `active` flag changed, edit the row in-app
--     or write an explicit UPDATE — silently overwriting live organization data from a seed script
--     is worse than a stale seed.
--
-- D5  Mismatch with the user seed (carried over from 01-um_users.sql D3). The document's user list
--     assigns every user to "Central Call Center / Central Call Center / Call Center", which is a
--     DIFFERENT unit from this SKYICT/zone/station ladder. Two acceptable resolutions:
--       (a) point 01-um_users.sql at one of the rows §5.4 prints (e.g. SKYICT / Center Zone /
--           Station 1) — simplest, keeps one hierarchy; or
--       (b) set create_call_center = true in §1, run §6, and point 01 at the three ids it prints.
--     Decide deliberately and record the decision in the tenant document.
--
-- D6  No transaction wrapper. Some GUI editors autocommit each statement, so a BEGIN/COMMIT that
--     spans a whole script depends on how the editor sends the batch. Every statement here is
--     individually safe and idempotent, so the script is correct either way — but if you want
--     all-or-nothing, paste it inside an explicit transaction in a client that runs the batch as
--     one unit (or use `psql --single-transaction -f`).
--
-- D7  Not covered here: area (geo) hierarchy is a different model from the organization ladder —
--     see docs/SKYICT-Tenant-Onboarding-Runbook.md §5 S9. Organization levels are also copied into
--     no other table by this script; anything the backend derives per department stays its job.
