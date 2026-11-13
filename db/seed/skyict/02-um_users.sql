-- =====================================================================================
-- Tenant seed: SKYICT — public.um_users
--
-- Source data : docs/SKYICT-Service-Center-Project-Prototype-v2.md, §3 "User Management"
-- Generated   : 2026-11-05 (rev 4 — role assignment, repair of existing rows, verify last)
-- Rows        : 16 (the two struck-through rows in the source document are excluded — see §7)
--
-- PORTABILITY — plain SQL only: no `\set`, `\if`, `\gset`. Runs unchanged in psql, DBeaver,
-- pgAdmin, DataGrip or a CI job. Parameters live in session TEMP TABLES (§1).
--
-- Quick Start Guide
--   1. Verify the values ​​in §1 (org / role IDs / dept-comm-stn / password) — this is the only place that needs configuration.
--   2. Execute the entire SQL script: §3 to create new users → §4 to repair existing users → §5 to verify the results.
--   3. Review the output in §5.2: Every row should show 'ok' (if you see 'ROLE DIFFERS', it means §4 has not been executed).
--
-- ⚠ WHY §4 EXISTS — read this before concluding "the role did not change":
--   §3 only INSERTs usernames that do not exist yet (a seed must never duplicate users). So on a
--   database where these 16 users already exist, **editing a role name in §2 changes nothing**: the
--   existing rows keep their old "roleId", no error is raised, and the role you added simply does not
--   appear. §4 is the step that applies changed role / department / command / station to rows that
--   already exist — it touches only these 16 usernames, only inside this tenant, and only where a
--   value actually differs (so it is a no-op on a second run).
--
-- WHY SOME COLUMNS LOOK UNUSUAL:
--   * `id` is NOT inserted. The captured API contract shows user ids as small numbers
--     (`GET /users/{id}` "id": "1", PATCH "200", DELETE "195", src/core/mocks/userCURL.v2.sh:27,275,320),
--     i.e. a serial column, while every *foreign* id is a UUID (:236-249). Omitting `id` lets the
--     column default apply; writing into a serial column by hand desynchronises its sequence.
--   * `password` is not part of `CreateUserInput` (src/core/mocks/userCURL.v2.sh:230-262) — it is set
--     through the change-password/reset endpoints (:326,:342). §3b explains the options.
--   * `citizenId` is NULL, not ''. Sixteen empty strings would collide on any unique index over it;
--     NULLs do not.
-- =====================================================================================

-- =====================================================================================
-- §0 — Preflight: confirm the ids you pasted into §1
-- =====================================================================================

-- 0.1 The tenant's organization id
-- SELECT id, name FROM public.<organization_table> WHERE name = 'SKYICT';

-- 0.2 The tenant's roles — the "roleName" strings must match §1b EXACTLY (case, underscores, spacing)
--     All five are confirmed for this tenant (2026-11-05) and are snake_case:
--       system_admin · admin · agent · dispatcher · responder
--     Run this query anyway when the role table is rebuilt or another tenant is cloned from it; §2b
--     then fails loudly on any name that no longer exists, instead of silently inserting a NULL role.
-- SELECT id, "roleName" FROM public.<role_table>
--  WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid
--  ORDER BY "roleName";

-- 0.3 The organization unit shared by all 16 users (from 02-sec_org-structure.sql §5.4)
-- SELECT "deptId", en FROM public.sec_departments WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid;
-- SELECT "commId", en FROM public.sec_commands    WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid;
-- SELECT "stnId",  en FROM public.sec_stations    WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid;

-- =====================================================================================
-- §1 — PARAMETERS — the only block you edit
-- =====================================================================================

DROP TABLE IF EXISTS _seed_cfg;

CREATE TEMP TABLE _seed_cfg (
    org_id              uuid    NOT NULL,
    role_system_admin   uuid    NOT NULL,
    role_admin          uuid    NOT NULL,
    role_agent          uuid    NOT NULL,
    role_dispatcher     uuid    NOT NULL,
    role_responder      uuid    NOT NULL,
    dept_id             uuid    NOT NULL,
    comm_id             uuid    NOT NULL,
    stn_id              uuid    NOT NULL,
    actor               text    NOT NULL,   -- written to createdBy / updatedBy
    user_type           integer NOT NULL,   -- um_users."userType"; 1 = value in the captured contract sample
    gender              integer NOT NULL,   -- document has no gender; 1 = value in the captured sample
    pw_hash             text    NOT NULL,   -- '' -> NULL. Put a ready-made hash here, or use §3b.
    reassign_other_org  boolean NOT NULL    -- false -> leave users of other tenants alone (default);
                                            -- true  -> move them into THIS tenant (§4b). See §2c.
);

INSERT INTO _seed_cfg (org_id, role_system_admin, role_admin, role_agent, role_dispatcher, role_responder,
                       dept_id, comm_id, stn_id, actor, user_type, gender, pw_hash, reassign_other_org)
VALUES (
    'c53d14b6-8464-4ece-b15f-8abdc0d1c43c'::uuid,           -- org_id               (ADAPT §0.1)
    '519d5de4-cc0d-4a55-9fec-76d01ac39297'::uuid,           -- role_system_admin    (ADAPT §0.2)
    '838f6233-782b-45f5-b24f-57856ae202d3'::uuid,           -- role_admin           (ADAPT §0.2)
    '98869510-6a8d-4ac4-aa3a-e3c73c70c997'::uuid,           -- role_agent           (ADAPT §0.2)
    'df249682-29dd-4f7a-81f7-d7a86383ea9c'::uuid,           -- role_dispatcher      (ADAPT §0.2)
    '673d01f9-2504-49c8-8639-601abc7a8c69'::uuid,           -- role_responder       (ADAPT §0.2)
    '97719370-3cd1-4bc7-8fa2-0820cd4ce5f8'::uuid,           -- dept_id              (ADAPT §0.3)
    '62caa35b-ee85-4a88-bf51-685068207a2e'::uuid,           -- comm_id              (ADAPT §0.3)
    'fdb708e1-f4b5-4bb2-b660-f6613a5f4404'::uuid,           -- stn_id               (ADAPT §0.3)
    'system',                                               -- actor
    1,                                                      -- user_type
    1,                                                      -- gender
    'pBF2OTfT7uantNGYA1clt26bHo5xjtbsZZu1Sur87VIPsD2jHMs=', -- pw_hash ('' => NULL; required if password is NOT NULL)
    false                                                   -- reassign_other_org (see §2c / §4b)
);

-- Sanity check: confirm these values before letting the script continue.
SELECT org_id, role_system_admin, role_admin, role_agent, role_dispatcher, role_responder,
       dept_id, comm_id, stn_id, actor, user_type, gender,
       CASE WHEN pw_hash = '' THEN '(null)' ELSE '(set)' END AS password,
       reassign_other_org
  FROM _seed_cfg;

-- =====================================================================================
-- §1b — ROLE MAP: the role ids above, labelled by the exact "roleName" they belong to.
--
-- `role_name` must be the literal "roleName" stored in the tenant's role table. All five are
-- confirmed for this tenant (2026-11-05) and are snake_case: system_admin, admin, agent,
-- dispatcher, responder. Keep this block and §2 in the same vocabulary.
--
-- A role name used in §2 but missing here resolves to NULL, and a NULL "roleId" violates the column's
-- NOT NULL constraint — the whole INSERT aborts, and the only visible symptom is "the users did not
-- appear". §2b checks this first and names the offending role.
-- =====================================================================================

DROP TABLE IF EXISTS _role_map;

CREATE TEMP TABLE _role_map (
    role_name text PRIMARY KEY,
    role_id   uuid NOT NULL
);

INSERT INTO _role_map (role_name, role_id)
SELECT v.role_name, v.role_id
FROM _seed_cfg cfg
CROSS JOIN LATERAL (VALUES
    ('system_admin', cfg.role_system_admin),   -- confirmed "roleName"
    ('admin',        cfg.role_admin),          -- confirmed "roleName"
    ('agent',        cfg.role_agent),          -- confirmed "roleName"
    ('dispatcher',   cfg.role_dispatcher),     -- confirmed "roleName"
    ('responder',    cfg.role_responder)       -- confirmed "roleName"
) AS v (role_name, role_id);

SELECT * FROM _role_map ORDER BY role_name;

-- =====================================================================================
-- §2 — THE SEED LIST: 16 users and the role each one gets
--
-- Single source of truth: §2b validates it, §3 inserts from it, §4 repairs from it, §5 verifies it.
-- The last column is the tenant's literal "roleName" — to move a user to another role, put one of the
-- values that exist in §1b there.
-- =====================================================================================

DROP TABLE IF EXISTS _seed_users;

CREATE TEMP TABLE _seed_users (
    username    text PRIMARY KEY,
    title       text NOT NULL,
    first_name  text NOT NULL,
    middle_name text NOT NULL,
    last_name   text NOT NULL,
    email       text NOT NULL,
    emp_id      text NOT NULL,
    role_name   text NOT NULL
);

INSERT INTO _seed_users (username, title, first_name, middle_name, last_name, email, emp_id, role_name)
VALUES
    -- ── system_admin (3) ──────────────────────────────────────────────────────────
    ('watee.tha',           '', 'Watee',                '', 'Thaiprasonk',  'watee.tha@skyai.co.th',            'AI680013', 'system_admin'),
    ('apiwat.rod',          '', 'Apiwat',               '', 'Rodchuajeen',  'apiwat.rod@skyai.co.th',           'AI680018', 'system_admin'),
    ('wisarud.tec',         '', 'Wisarud',              '', 'Techa',        'wisarud.tec@skyai.co.th',          'AI680021', 'system_admin'),
    -- ── admin (4) ─────────────────────────────────────────────────────────────────
    ('sompith.kit',         '', 'Sompith',              '', 'Kitcharoen',   'sompith.kit@skyict.co.th',         'SK690394', 'admin'),
    ('chutikan.kon',        '', 'Chutikan (Pimm)',      '', 'Kongton',      'chutikan.kon@skyict.co.th',        'SK690375', 'admin'),
    ('chatchanan.dul',      '', 'Chatchanan (Petch)',   '', 'Dulyakometh',  'chatchanan.dul@skyict.co.th',      'SK680123', 'admin'),
    ('chamrat.mee',         '', 'Chamrat (Tieung)',     '', 'Meedam',       'chamrat@skyict.co.th',             'SK63035',  'admin'),
    -- ── agent (2) ─────────────────────────────────────────────────────────────────
    ('agent1',              '', 'Agent',                '', '1',            'agent1@skyict.co.th',              'SK699001', 'agent'),
    ('agent2',              '', 'Agent',                '', '2',            'agent2@skyict.co.th',              'SK699002', 'agent'),
    -- ── responder (5) ─────────────────────────────────────────────────────────────
    ('responder1',          '', 'Responder',            '', '1',            'responder1@skyict.co.th',          'SK699003', 'responder'),
    ('responder2',          '', 'Responder',            '', '2',            'responder2@skyict.co.th',          'SK699004', 'responder'),
    ('generalservice',      '', 'General Service',      '', '1',            'generalservice1@skyict.co.th',     'SK699005', 'responder'),
    ('emergencyservice1',   '', 'Emergency Service',    '', '1',            'emergencyservice1@skyict.co.th',   'SK699006', 'responder'),
    ('emergencyservice2',   '', 'Emergency Service',    '', '2',            'emergencyservice2@skyict.co.th',   'SK699007', 'responder'),
    -- ── dispatcher (2) ────────────────────────────────────────────────────────────
    ('dispatcher1',         '', 'Dispatcher',           '', '1',            'dispatcher1@skyict.co.th',         'SK699008', 'dispatcher'),
    ('dispatcher2',         '', 'Dispatcher',           '', '2',            'dispatcher2@skyict.co.th',         'SK699009', 'dispatcher');

-- =====================================================================================
-- §2b — VALIDATION: every role name in the seed list must exist in §1b
-- =====================================================================================

DO $$
DECLARE
    unmapped text;
BEGIN
    SELECT string_agg(DISTINCT s.role_name, ', ' ORDER BY s.role_name)
      INTO unmapped
      FROM _seed_users s
     WHERE NOT EXISTS (SELECT 1 FROM _role_map rm WHERE rm.role_name = s.role_name);

    IF unmapped IS NOT NULL THEN
        RAISE EXCEPTION 'Role name(s) used in the seed list but missing from _role_map (§1b): %. Use the exact "roleName" from the role table (see §0.2), then re-run.', unmapped;
    END IF;

    -- Two different role names pointing at the same id is a copy-paste error in §1 and would make
    -- every user of one role silently become the other.
    IF EXISTS (
        SELECT 1 FROM _role_map GROUP BY role_id HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Two role names in §1b share the same role id: %. Check the ids pasted in §1.',
            (SELECT string_agg(role_name, ', ' ORDER BY role_name)
               FROM _role_map
              WHERE role_id IN (SELECT role_id FROM _role_map GROUP BY role_id HAVING count(*) > 1));
    END IF;

    RAISE NOTICE 'Role map OK: % distinct role(s) used by % seeded users.',
        (SELECT count(DISTINCT role_name) FROM _seed_users),
        (SELECT count(*) FROM _seed_users);
END $$;

-- =====================================================================================
-- §2c — WHAT ALREADY EXISTS, PER USER — read this if "only some users were created"
--
-- A username can legitimately exist for several tenants; whether THIS database allows it is decided
-- by the unique index on um_users, which is not visible from here. So §3 is scoped to this tenant only
-- (it inserts when the username does not exist *in this org*), and this report tells you what is
-- already out there before it runs:
--
--   in_this_tenant  = yes  -> already here; §4 keeps role/dept in line, nothing to insert
--   elsewhere       = text -> the person already has an account under another tenant. That does NOT
--                             stop §3: a second account is created for this tenant. It only matters if
--                             the table has a GLOBAL unique index (username or email) — then the INSERT
--                             fails with a duplicate-key error naming the constraint, which is the
--                             answer to "can one person belong to two tenants in this database?".
--   (not found)            -> §3 will create it
--
-- ⚠ This report never changes anything; it exists so the INSERT's outcome is predictable rather than
--   surprising. Nothing here moves an account between tenants — see §4b, which is off by default, is
--   *not* needed to add users, and contradicts the intent of this seed (add, do not relocate).
-- =====================================================================================

SELECT s.username,
       s.role_name,
       s.email,
       CASE WHEN u.id IS NOT NULL THEN 'yes' ELSE 'no' END AS in_this_tenant,
       CASE WHEN u.id IS NOT NULL THEN NULL ELSE o."orgId"::text END AS elsewhere_id,
       CASE WHEN u.id IS NOT NULL THEN u."roleId"::text ELSE o."roleId"::text END AS existing_role_id,
       (SELECT count(*) FROM public.um_users e
         WHERE e.email = s.email AND e."orgId" <> cfg.org_id) AS same_email_other_org
  FROM _seed_users s
  CROSS JOIN _seed_cfg cfg
  LEFT JOIN public.um_users u ON u.username = s.username AND u."orgId" = cfg.org_id
  LEFT JOIN public.um_users o ON o.username = s.username AND o."orgId" <> cfg.org_id
 ORDER BY 4 DESC, 5, s.username;

-- =====================================================================================
-- §3 — Insert the users this tenant does not have yet
--
-- The guard is scoped to THIS org: an account that exists under another tenant does not block the
-- creation of an account here (that is the whole point of "add users for the new tenant"). If the
-- table's unique index is global, this INSERT fails loudly with the constraint name instead of
-- skipping rows silently — see §2c, and the "Do not weaken this" note in §7 D6.
-- =====================================================================================

INSERT INTO public.um_users (
    "orgId",            "displayName",  title,          "firstName",      "middleName",
    "lastName",         "citizenId",    bod,            blood,            gender,
    "mobileNo",         address,        photo,          username,         password,
    email,              "roleId",       "userType",     "empId",          "deptId",
    "commId",           "stnId",        active,         "activationToken", "lastActivationRequest",
    "lostPasswordRequest", "signupStamp", islogin,     "lastLogin",      "createdAt",
    "updatedAt",        "createdBy",    "updatedBy",    "deviceInfo",     "deviceToken"
)
SELECT
    cfg.org_id,                                                 -- orgId
    CASE                                                        -- displayName
        WHEN s.middle_name = '' THEN s.first_name || ' ' || s.last_name
        ELSE s.first_name || ' ' || s.middle_name || ' ' || s.last_name
    END,
    s.title,
    s.first_name,
    s.middle_name,
    s.last_name,
    NULL,                                                       -- citizenId: NULL, not '' (see §7 D4)
    NULL,                                                       -- bod: not in the source document
    NULL,                                                       -- blood: not in the source document
    cfg.gender,
    '',                                                         -- mobileNo: not in the source document
    '',                                                         -- address
    NULL,                                                       -- photo
    s.username,
    NULLIF(cfg.pw_hash, ''),                                    -- password: empty param -> NULL; see §3b
    s.email,
    rm.role_id,                                                 -- roleId, resolved through _role_map
    cfg.user_type,
    s.emp_id,
    cfg.dept_id,
    cfg.comm_id,
    cfg.stn_id,
    TRUE,                                                       -- active
    NULL,                                                       -- activationToken
    NULL,                                                       -- lastActivationRequest
    NULL,                                                       -- lostPasswordRequest
    NULL,                                                       -- signupStamp
    FALSE,                                                      -- islogin
    NULL,                                                       -- lastLogin
    now(),                                                      -- createdAt
    now(),                                                      -- updatedAt
    cfg.actor,
    cfg.actor,
    NULL,                                                       -- deviceInfo
    NULL                                                        -- deviceToken
FROM _seed_users s
JOIN _role_map rm ON rm.role_name = s.role_name
CROSS JOIN _seed_cfg cfg
WHERE NOT EXISTS (
    SELECT 1 FROM public.um_users existing
     WHERE existing.username = s.username
       AND existing."orgId"  = cfg.org_id      -- scoped to THIS tenant: a second account elsewhere is fine
)
RETURNING username, "empId", "roleId";

-- =====================================================================================
-- §3b — Password (separate step: it is not part of the create-user contract)
--
-- The pw_hash in §1 is the value this tenant's backend expects — confirmed by the tenant owner
-- (2026-11-05). Keep it as is; do not substitute a bcrypt hash unless the backend changes.
-- It is a 44-character base64 value (32 bytes), which is why it does not look like `$2a$…`.
--
-- If the value ever has to be regenerated, use whichever of these the backend owner confirms:
--
--   (a) put the new pre-computed hash in §1 pw_hash (whatever format the backend stores); or
--   (b) compute it here, if the backend uses bcrypt and pgcrypto is installed:
--         UPDATE public.um_users
--            SET password = crypt('Skyict@123', gen_salt('bf')), "updatedAt" = now()
--          WHERE username IN (SELECT username FROM _seed_users);
--   (c) leave password NULL and use the backend's own flow:
--         PATCH /users/change_password/{id}, POST /users/reset_password.
-- =====================================================================================

-- =====================================================================================
-- §4 — REPAIR existing rows: apply role / department / command / station changes
--
-- This is what makes a role change take effect on users that already exist (§3 skipped them).
-- Only the 16 usernames in §2, only inside this tenant, and only where a value differs — so a second
-- run is a no-op.
-- =====================================================================================

-- 4.1 Preview (safe): who will change, and from what to what
SELECT s.username,
       coalesce(rm2.role_name, '(none/unknown)') AS current_role,
       s.role_name                                AS new_role,
       (u."deptId" IS DISTINCT FROM cfg.dept_id)  AS dept_changes,
       (u."commId" IS DISTINCT FROM cfg.comm_id)  AS comm_changes,
       (u."stnId"  IS DISTINCT FROM cfg.stn_id)   AS stn_changes
  FROM _seed_users s
  JOIN _role_map rm ON rm.role_name = s.role_name
  CROSS JOIN _seed_cfg cfg
  JOIN public.um_users u ON u.username = s.username AND u."orgId" = cfg.org_id
  LEFT JOIN _role_map rm2 ON rm2.role_id = u."roleId"
 WHERE u."roleId" IS DISTINCT FROM rm.role_id
    OR u."deptId" IS DISTINCT FROM cfg.dept_id
    OR u."commId" IS DISTINCT FROM cfg.comm_id
    OR u."stnId"  IS DISTINCT FROM cfg.stn_id
 ORDER BY s.username;

-- 4.2 Apply
UPDATE public.um_users u
   SET "roleId"    = rm.role_id,
       "deptId"    = cfg.dept_id,
       "commId"    = cfg.comm_id,
       "stnId"     = cfg.stn_id,
       "updatedAt" = now(),
       "updatedBy" = cfg.actor
  FROM _seed_users s
  JOIN _role_map rm ON rm.role_name = s.role_name
  CROSS JOIN _seed_cfg cfg
 WHERE u.username = s.username
   AND u."orgId"  = cfg.org_id
   AND (u."roleId" IS DISTINCT FROM rm.role_id
     OR u."deptId" IS DISTINCT FROM cfg.dept_id
     OR u."commId" IS DISTINCT FROM cfg.comm_id
     OR u."stnId"  IS DISTINCT FROM cfg.stn_id);

-- =====================================================================================
-- §4b — OPTIONAL, and NOT part of adding a tenant: relocate an account from another tenant
--
-- Leave `reassign_other_org = false` (§1) unless someone explicitly asks to MOVE a person's account.
-- Adding users to this tenant never needs this section — §3 already creates a second account for a
-- username that exists elsewhere, and §2c/§5.2 report those cases without touching them.
--
-- Only acts when the flag is true; otherwise both statements are no-ops.
--
-- ⚠ Moving a row changes which tenant the person logs into. Their password hash, groups, units and
--   case history do not move with them. Decide deliberately, record it in the tenant document, and
--   prefer asking the backend owner before doing it on a shared environment.
-- =====================================================================================

-- 4b.1 Who would move
SELECT s.username, o."orgId" AS current_org, cfg.org_id AS new_org, o.email
  FROM _seed_users s
  CROSS JOIN _seed_cfg cfg
  JOIN public.um_users o ON o.username = s.username AND o."orgId" <> cfg.org_id
 WHERE cfg.reassign_other_org
 ORDER BY s.username;

-- 4b.2 Apply the move (no-op unless reassign_other_org = true)
UPDATE public.um_users o
   SET "orgId"     = cfg.org_id,
       "roleId"    = rm.role_id,
       "deptId"    = cfg.dept_id,
       "commId"    = cfg.comm_id,
       "stnId"     = cfg.stn_id,
       "updatedAt" = now(),
       "updatedBy" = cfg.actor
  FROM _seed_users s
  JOIN _role_map rm ON rm.role_name = s.role_name
  CROSS JOIN _seed_cfg cfg
 WHERE o.username   = s.username
   AND o."orgId"   <> cfg.org_id
   AND cfg.reassign_other_org;

-- =====================================================================================
-- §5 — Verification (runs AFTER the repair, so a single pass ends in a truthful state)
-- =====================================================================================

-- 5.1 How many users each configured role has. Expected with the list above:
--     system_admin 3 · admin 4 · responder 5 · agent 2 · dispatcher 2
SELECT rm.role_name, count(u.id) AS users
  FROM _role_map rm
  CROSS JOIN _seed_cfg cfg
  LEFT JOIN public.um_users u
         ON u."roleId" = rm.role_id
        AND u."orgId"  = cfg.org_id
 GROUP BY rm.role_name
 ORDER BY users DESC, rm.role_name;

-- 5.2 THE IMPORTANT ONE: intent (§2) vs. what is stored in THIS tenant, user by user.
--     'ok'           = this tenant has the user with the intended role
--     'ROLE DIFFERS' = the row exists here with another role; §4 should have fixed it
--     'NOT IN DB'    = this tenant has no such user. Either the INSERT failed (read its error — most
--                      likely a duplicate key on username/email, meaning the unique index is global)
--                      or the script never reached §3.
--     `also_in_other_org` is information only: a second account for the same person in another tenant
--     is expected when a tenant is being added, and is not an error.
SELECT s.username,
       s.role_name                                AS intended_role,
       coalesce(rm2.role_name, '(none/unknown)')  AS stored_role,
       CASE WHEN o.id IS NOT NULL THEN o."orgId"::text END AS also_in_other_org,
       u."updatedAt",
       CASE
           WHEN u.id IS NULL                                            THEN 'NOT IN DB'
           WHEN u."roleId" IS DISTINCT FROM rm.role_id                  THEN 'ROLE DIFFERS'
           ELSE 'ok'
       END                                        AS state
  FROM _seed_users s
  JOIN _role_map rm ON rm.role_name = s.role_name
  CROSS JOIN _seed_cfg cfg
  LEFT JOIN public.um_users u
         ON u.username = s.username
        AND u."orgId"  = cfg.org_id
  LEFT JOIN public.um_users o
         ON o.username = s.username
        AND o."orgId" <> cfg.org_id
  LEFT JOIN _role_map rm2 ON rm2.role_id = u."roleId"
 ORDER BY state DESC, s.username;

-- 5.3 Anything unexpected in this tenant: users whose role is not one of the configured five.
SELECT u.username, u."roleId", u.active, u."createdAt"
  FROM public.um_users u
 CROSS JOIN _seed_cfg cfg
 WHERE u."orgId" = cfg.org_id
   AND u."roleId" NOT IN (SELECT role_id FROM _role_map)
 ORDER BY u.username;

-- 5.4 Duplicates / unresolved references — every count must be 0
SELECT
  (SELECT count(*) FROM public.um_users, _seed_cfg cfg
    WHERE "orgId" = cfg.org_id
      AND ("roleId" IS NULL OR "deptId" IS NULL OR "commId" IS NULL OR "stnId" IS NULL)) AS null_refs,
  (SELECT count(*) FROM (
      SELECT username FROM public.um_users, _seed_cfg cfg
       WHERE "orgId" = cfg.org_id
       GROUP BY username HAVING count(*) > 1) d)                                          AS dup_usernames,
  (SELECT count(*) FROM (
      SELECT email FROM public.um_users, _seed_cfg cfg
       WHERE "orgId" = cfg.org_id
       GROUP BY email HAVING count(*) > 1) d)                                             AS dup_emails;

-- =====================================================================================
-- §6 — Rollback (run by hand if needed)
-- =====================================================================================

-- Preview what would be deleted:
-- SELECT id, username, email FROM public.um_users
--  WHERE "orgId" = '00000000-0000-0000-0000-000000000000'::uuid
--    AND username IN ('watee.tha','apiwat.rod','wisarud.tec','sompith.kit','chutikan.kon',
--                     'chatchanan.dul','chamrat.mee','agent1','agent2','responder1',
--                     'responder2','generalservice','emergencyservice1','emergencyservice2',
--                     'dispatcher1','dispatcher2');
-- Then:
-- DELETE FROM public.um_users WHERE id IN (...ids printed above...);

-- =====================================================================================
-- §7 — Data-quality decisions and behaviours
-- =====================================================================================
--
-- D1  Excluded 2 of the 18 listed rows: "kittipong.mue" and "krittaya.ple" are struck through
--     (~~…~~) in the source table and carry no role — they are not seeded. Re-add them by
--     un-commenting this block inside §2 if the strikethrough was a mistake:
--       -- ('kittipong.mue',   '', 'Kittipong',    '', 'Muengrod',      'kittipong.mue@skyai.co.th',   'AI680110', 'admin'),
--       -- ('krittaya.ple',    '', 'Krittaya',     '', 'Plengwithaya',  'krittaya.ple@skyai.co.th',    'AI680012', 'admin'),
--
-- D2  Corrected 4 email typos, otherwise the run either fails on a unique email index or creates
--     addresses nobody can receive mail at:
--       responder1        respinder1@skyict.co.th         -> responder1@skyict.co.th
--       responder2        respinder2@skyict.co.th         -> responder2@skyict.co.th
--       generalservice    generalsrvice1@skyict.co.th     -> generalservice1@skyict.co.th
--       emergencyservice1 emergencyservice2@skyict.co.th  -> emergencyservice1@skyict.co.th
--                         (the documented value duplicated emergencyservice2's address)
--
-- D3  department / command / station: the document gives "Central Call Center / Central Call Center /
--     Call Center" for all 16 users, but its own §1 builds a "SKYICT / <zone> / <station>" ladder.
--     The script takes the three ids as parameters (§1) instead of hard-coding either reading.
--
-- D4  citizenId is NULL, not ''. Same for bod/blood/mobileNo/address/photo/title/middle_name where
--     the source document has no data: seeding plausible values would fabricate personal data.
--
-- D5  gender = 1 and userType = 1 come from the captured `CreateUserInput` sample
--     (src/core/mocks/userCURL.v2.sh:242,251) — the document has no such columns.
--
-- D6  Role assignment is name-based on purpose: ids live in §1, §2 only names roles, and §2b fails
--     loudly on a name §1b does not know — instead of a NULL "roleId" aborting the INSERT with a
--     message about a column nobody was editing. The names are the tenant's literal "roleName"
--     values, all confirmed snake_case (2026-11-05): system_admin, admin, agent, dispatcher,
--     responder. A copy of this tenant with a differently-cased role table is caught by §2b, not
--     silently mis-roled.
--
-- D7  §3 never updates an existing user; §4 does. That split is deliberate (a seed must not silently
--     overwrite live accounts on every run, but a role change has to land somewhere). §5.2 is the
--     query that tells you which of the two you are looking at.
--
-- D7b DO NOT WEAKEN THE §3 SCOPE. Its NOT EXISTS is deliberately scoped to `(username, orgId)`, not to
--     username alone: the tenant is being *added*, and a person who already has an account under
--     another organization is supposed to get a second one here. The earlier, globally-scoped guard is
--     what produced "only 6 of 16 users were created" while the script reported success — those users
--     had accounts under another orgId and were skipped without a word. If the INSERT then fails with
--     a duplicate key on `username` or `email`, that is the database telling you the unique index is
--     global and one person cannot belong to two tenants — a product decision to escalate, never
--     something to work around by silently rewriting usernames or emails.
--
-- D8  A role is not a permission set. Creating a user with a role id gives them the role; what they
--     can see is granted separately through role ↔ permission rows (RBAC). A brand-new role with no
--     permissions logs in to an empty menu — see docs/SKYICT-Tenant-Onboarding-Runbook.md §5 S3.
--
-- D9  Not covered by this script, and required before the demo works:
--     * user ↔ user-group membership (the document's §4 groups) — separate join table;
--     * unit ↔ user binding ("responder1" owns UNIT-001 etc.) — mdm units, not this table;
--     * the tenant + organization record itself, and its entitlement record (runbook §4).
--
-- D10 No transaction wrapper: some GUI editors autocommit each statement. §3 and §4 are individually
--     idempotent, so the script is correct either way. For all-or-nothing use
--     `psql --single-transaction -f`, or paste inside an explicit transaction.
