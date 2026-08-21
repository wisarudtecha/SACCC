# Dormant sections

Each section below is part of the full workflow-manager design but has **no data source in this repository today**. Do not emit findings from a dormant section. If asked about one, say it is dormant and name the activation condition.

Verified dormant as of 2026-08-20.

---

## D1 — Branch management

**Activate when:** more than one working branch exists.

Expected patterns once active:

```text
feature/<ref>-<short-description>
fix/<ref>-<short-description>
refactor/<ref>-<short-description>
perf/<ref>-<short-description>
chore/<ref>-<short-description>
hotfix/<ref>-<short-description>
```

Validate: type prefix, base branch, scope, naming consistency, branch age.

Flag ambiguous names: `dev`, `test`, `new-feature`, `backup`, `latest`, `temporary`, `my-branch`.

**Note:** the repo's only branch is currently `dev`, which is on that list. This is a known, accepted state for a single-developer repo — do not report it as a finding until a branch model is adopted.

---

## D2 — Pull request validation

**Activate when:** the first pull request is opened, and the session has GitHub API access to this repository.

Validate: correct base branch, valid branch name, valid PR title (Conventional Commits), linked work item, scope creep, unrelated modifications, CI status, required approvals, CODEOWNER approval, unresolved review comments, breaking changes.

Output:

```text
PR Readiness
Branch / Title / CI / Review / CODEOWNER / Critical Comments / Breaking Change / Risk
Recommendation: READY TO MERGE | CHANGES REQUIRED | BLOCKED
```

Never recommend merge while a required check or approval is missing.

---

## D3 — CI / GitHub Actions

**Activate when:** `.github/workflows/` exists and has run at least once.

Realistic first set for this repo, given no test runner exists:

```text
Lint       (pnpm lint)
Typecheck  (tsc -b)
Build      (pnpm build)
```

Do not list Unit Test or Integration Test as required checks until test files exist. On failure: identify workflow → job → root cause → whether code or infrastructure → affected scope → recommended action → owner. Recommend the fix; never implement it.

---

## D4 — Branch protection

**Activate when:** a branch model and PR flow exist (D1 + D2).

Then enforce: PR required, required status checks, required review, CODEOWNERS approval, no direct push, no force push, no deletion. Emergency bypass must be explicit and documented.

---

## D5 — Tag-based releases, CHANGELOG, Release Notes

**Activate when:** the repo starts creating git tags on version bumps.

This is the cheapest section to activate: one `git tag v<version>` per bump makes the whole release chain real.

Once active:

- `CHANGELOG.md` generated from Conventional Commits, grouped Features / Bug Fixes / Performance / Breaking Changes / Documentation. Not a file-change list.
- Release Note aimed at stakeholders, answering: what changed, why it matters, what is included, breaking changes, environment deployed, known limitations.
- Release readiness: version determined, CHANGELOG generated, Release Note prepared, no unresolved critical defects, deployment prerequisites satisfied, risks documented → `READY` | `READY WITH RISK` | `NOT READY`.

Until then, treat the `chore: bump version to X` commit plus `package.json` as the release record.

---

## D6 — Ticket / project management linkage

**Activate when:** a ticket system is adopted and ticket keys start appearing in commit messages or work-log entries.

Then: ticket becomes the requirement source of truth, commits and work items link by key, and progress reconciliation compares ticket status against delivered code.

Until then there is **no ticket layer**. Do not invent keys such as `CRM-123`; those appear only as illustrative examples in the original design document.

---

## D7 — Lark notification

**Activate when:** a Lark connector or incoming webhook is available to the session.

High-value events only: PR ready for review, CI failed, deployment started/failed/succeeded, release published, hotfix released, important blocker, overdue follow-up, important product decision.

Never: every commit, every CI success, every file change, every minor review comment.

Every notification answers: what happened, where, who is responsible, what is the impact, what action is required, where is the source.

Until active, produce the notification body as text for manual sending, clearly labelled as a draft.

---

## D8 — Multi-person reporting

**Activate when:** a second contributor appears in `git shortlog`.

Then: owner mapping table, per-person standup aggregation, and genuine resource/work utilization become meaningful. Until then, omit them — with one developer, any team-level split is fabricated.

---

## D9 — Incident / hotfix flow

**Activate when:** a production incident occurs and a branch model exists (D1).

```text
Incident → Hotfix Branch → Fix Commit → PR → CI → Review → Merge
→ Patch Release → Deployment → Notification → Post-Incident Follow-Up
```

Pair with the `post-mortem` skill for the engineering write-up. Emergency procedure must not permanently bypass normal governance.
