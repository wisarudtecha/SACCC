-- =====================================================================================
-- SKYICT — diagnose "only some of the users were created"
--
-- Read-only. No temp tables, no psql meta-commands: paste the whole file into any SQL client and
-- read top to bottom. Each step prints the evidence the next step needs.
--
--   ① which organizations actually exist in um_users (find the real org id)
--   ② per-user: where does this username live, and how many rows carry it
--   ③ summary: expected vs found, and whether any username has duplicate rows
--
-- Reading the result:
--   where_found = this tenant   -> the row exists here; §4 of the seed keeps role/dept in line
--   where_found = OTHER org …   -> this person also has an account under another tenant. That is NOT
--                                  an error and NOT blocking: the seed adds a second account for this
--                                  tenant. It only becomes a problem if the table has a GLOBAL unique
--                                  index on username or email — then the INSERT fails and names the
--                                  constraint, which is the database answering "can one person belong
--                                  to two tenants here?".
--   where_found = not found     -> the INSERT never created it; read the error from that statement.
--
-- ⚠ STEP ① IS NOT OPTIONAL. If the org id used below is not the one the rows actually carry, every
--   row looks like "another org" and the report is meaningless. Copy the id from ① into ②/③.
-- =====================================================================================


-- =====================================================================================
-- ① Every organization present in um_users, with its row count.
--
-- The tenant you are seeding is the one whose users you are looking for. A value of 0 rows for the
-- id you have been using means the id in the script is NOT what the rows carry.
-- =====================================================================================

SELECT "orgId"::text AS org_id,
       count(*)     AS users,
       min("createdAt")::date AS first_created,
       max("createdAt")::date AS last_created
  FROM public.um_users
 GROUP BY "orgId"
 ORDER BY users DESC;


-- =====================================================================================
-- ② Per-user report.
--
-- ADAPT: org_id below must be copied from ① (the tenant being seeded).
-- ADAPT: the username list — this is the 16 users of the SKYICT seed; extend it if your file does.
-- =====================================================================================

WITH cfg AS (
    SELECT 'c53d14b6-8464-4ece-b15f-8abdc0d1c43c'::uuid AS org_id
),
expected (username) AS (
    VALUES
    ('watee.tha'), ('apiwat.rod'), ('wisarud.tec'),
    ('sompith.kit'), ('chutikan.kon'), ('chatchanan.dul'), ('chamrat.mee'),
    ('agent1'), ('agent2'),
    ('responder1'), ('responder2'), ('generalservice'),
    ('emergencyservice1'), ('emergencyservice2'),
    ('dispatcher1'), ('dispatcher2')
)
SELECT e.username,
       CASE
           WHEN count(*) FILTER (WHERE u."orgId" = cfg.org_id) > 0 THEN 'this tenant'
           WHEN count(*) > 0                                        THEN 'OTHER org: ' || string_agg(DISTINCT u."orgId"::text, ', ')
           ELSE 'not found'
       END                                     AS where_found,
       count(*)                                AS rows_found,   -- >1 means the username is NOT unique
       string_agg(DISTINCT u."orgId"::text, ', ') AS org_ids,
       max(u.id)                               AS sample_row_id,
       max(u."roleId"::text)                   AS sample_role_id,
       max(u.email)                            AS sample_email
  FROM expected e
  CROSS JOIN cfg
  LEFT JOIN public.um_users u ON u.username = e.username
 GROUP BY e.username, cfg.org_id
 ORDER BY 2, e.username;


-- =====================================================================================
-- ③ Summary — counts DISTINCT usernames (not joined rows), so a duplicated username shows up as
--   duplicate_rows instead of silently inflating the total.
--
-- ADAPT: org_id and the username list, same as ②.
-- =====================================================================================

WITH cfg AS (
    SELECT 'c53d14b6-8464-4ece-b15f-8abdc0d1c43c'::uuid AS org_id
),
expected (username) AS (
    VALUES
    ('watee.tha'), ('apiwat.rod'), ('wisarud.tec'),
    ('sompith.kit'), ('chutikan.kon'), ('chatchanan.dul'), ('chamrat.mee'),
    ('agent1'), ('agent2'),
    ('responder1'), ('responder2'), ('generalservice'),
    ('emergencyservice1'), ('emergencyservice2'),
    ('dispatcher1'), ('dispatcher2')
),
per_user AS (
    SELECT e.username,
           count(*) FILTER (WHERE u."orgId" = cfg.org_id) AS rows_here,
           count(*) FILTER (WHERE u."orgId" <> cfg.org_id OR u.id IS NULL) AS rows_elsewhere_all,
           count(*)                                        AS rows_any
      FROM expected e
      CROSS JOIN cfg
      LEFT JOIN public.um_users u ON u.username = e.username
     GROUP BY e.username, cfg.org_id
)
SELECT (SELECT count(*) FROM expected)                                    AS expected_usernames,
       count(*) FILTER (WHERE rows_here > 0)                              AS in_this_tenant,
       count(*) FILTER (WHERE rows_here = 0 AND rows_any > 0)            AS only_in_another_org,
       count(*) FILTER (WHERE rows_any = 0)                               AS missing_entirely,
       count(*) FILTER (WHERE rows_any > 1)                               AS usernames_with_duplicate_rows,
       (SELECT count(*) FROM public.um_users
         WHERE "orgId" = (SELECT org_id FROM cfg))                        AS rows_in_this_tenant
  FROM per_user;
