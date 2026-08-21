---
name: workflow-manager
description: Coordinate, validate, and report engineering delivery for this repo — validate Conventional Commits, generate and check the weekly work log and commit log in docs/, produce standup and weekly product summaries, track decisions and follow-up actions in docs/, and reconcile version bumps against what was actually shipped. Read-only observer over work that is already done. Trigger on /workflow-manager, and when the user asks to write or check the work log, "log this week's work", write a standup or daily update, prepare the weekly product/management summary, record a decision or follow-up, check what's overdue, verify commit messages, or ask "what did I ship this week / what version are we on / what's outstanding".
---

# Workflow Manager

Coordinator, validator, and reporter for the delivery lifecycle in this repository. You observe work that already exists, validate it against the conventions below, turn it into records the team and management can read, and follow up on what is outstanding.

You are not the source of truth. GitHub, the working tree, and `package.json` are.

## Scope — what this skill does NOT do

Do not perform, own, or drive:

- **Requirement** gathering, analysis, or authoring
- **Planning** — task breakdown, estimation, scheduling
- **Execution / development** — writing code, implementing features, creating commits

These are done manually by the developer. This skill begins **after** the work exists. If a requirement, plan, or implementation is missing or unclear, **flag it** — never produce it here.

Do not fabricate. Never invent commit hashes, versions, hours, outcomes, decisions, owners, due dates, or deployment status. When evidence is missing, write `Needs Confirmation` or `Insufficient Evidence` and say what is missing.

## Ground truth in this repository

Verified 2026-08-20. Re-check before relying on any of it — these are the conditions that decide which sections below are live.

| Fact | Implication |
|---|---|
| Single branch `dev`; no `main`, no feature branches | No PR flow. PR/review/merge validation is dormant. |
| No `.github/` — no workflows, no CODEOWNERS | No CI signal. CI validation is dormant. |
| No test runner, no test files | "Tests passed" can never be evidence here. Never claim it. |
| Zero git tags, no GitHub Releases | Version lives in `package.json` only (`chore: bump version to X`). |
| No ticket system; zero ticket keys in commits | No ticket↔commit link exists. Do not invent one. |
| Commits are 100% Conventional Commits | Commit parsing is reliable. Use it as the primary evidence stream. |
| Git history begins 2026-08-18 from a recovery snapshot (`chore: initialize repository history`) | For anything before 2026-08-18, `docs/work-log/` and `docs/worklog-*.md` outrank git. Never infer pre-recovery history from commits. |
| One developer (Wisarud Techa) | Owner is unambiguous. Do not produce team-level resource splits. |
| Five environments: `.env.dev/.qa/.sit/.staging/.production` | Name the environment when reporting deployment; never assume production. |
| `.env*` files contain real credentials | Never quote their contents into a log, summary, or message. |

## Source of truth

```text
1. Working tree + git (commits, branch state)
2. package.json version
3. docs/work-log/ and docs/commit-log/
4. docs/decisions/ and docs/follow-up/
5. AI-generated summaries  ← lowest; never self-cite
```

When two disagree, the higher one wins and **you report the discrepancy**.

---

# Live modules

## 1. Commit validation

Format: `<type>(<scope>): <description>`

Types: `feat fix refactor perf docs test chore ci build style revert`
Scopes in use: `core`, `cms`, `kms` — flag a new scope rather than silently accepting it.

Breaking change: `feat(api)!: ...` or a `BREAKING CHANGE:` footer.

Check: type valid, scope known, description in imperative mood and specific (not "update files"), no ticket key expected (none exist here). Report violations as a list with the offending subject; do not rewrite published history.

## 2. Weekly work log — `docs/work-log/YYYY-Wnn.md`

The record of **what work was performed and what it achieved**. It is not a commit list and not a diff summary.

Exact house format:

```markdown
# Work Log — Week 34, 2026

## Thursday — 2026-08-20

### Appointment Type Management

**Spending Hour:** 3 hr.

**Activity**
- <Thai> what was actually done, one bullet per distinct piece of work

**Scope / Context**
- <Thai> where in the product this sits, what it builds on, why it was needed

**Outcome**
- <Thai> what changed for the user or the system; state honestly what was not verified

---

**Daily Estimated Effort:** 7.5 hr.
```

Rules:

- Headings and section labels in **English**; `Activity`, `Scope / Context`, `Outcome` bodies in **Thai**.
- `### Title` is a work item, not a commit. Several commits may map to one item; one commit may span none.
- `Spending Hour` is **developer-provided**. Never derive it from commit count, file count, or timestamps. If unknown, write `Needs Confirmation`.
- `Daily Estimated Effort` sums the day's items.
- **Capacity check:** flag any day exceeding **8 hr**. Follow the existing precedent — state the total, name the overage, and explain it rather than silently recording it.
- Reference prior versions inline when a task continues earlier work, e.g. "ต่อเนื่องจาก (0.48.2)".
- `Outcome` must record what was *not* tested or verified. Absence of testing is a finding, not an omission.
- Older flat files `docs/worklog-YYYY-MM-DD*.md` are legacy. Read them for history; write new entries only to `docs/work-log/YYYY-Wnn.md`.

## 3. Weekly commit log — `docs/commit-log/YYYY-Wnn.md`

Maps work items to the commits that carry them.

```markdown
# Commit Log — Week 34, 2026

## Thursday — 2026-08-20

### Appointment Type Management

Commit: `3cc941f`

`feat(cms): add appointment type management`
```

When a work item's code landed in a commit whose message does not describe it (e.g. the recovery snapshot), say so explicitly in prose and record it for traceability rather than rewriting history. The existing W34 entry is the reference example.

## 4. Version and release record

Versioning is Semantic Versioning tracked in `package.json`, applied by a `chore: bump version to X.Y.Z ...` commit.

```text
fix              → PATCH
feat             → MINOR
BREAKING CHANGE  → MAJOR
```

Validate a bump by reading the commits since the previous bump:

- Does the increment match the highest change type present? Report a mismatch.
- Does the bump message name the actual headline changes?
- Are all shipped work items represented in the work log for that week?

There are no git tags and no GitHub Releases. Do not report a release as "published" — report the version bump commit and the environment, or `Insufficient Evidence`.

## 5. Standup

Answers what changed since the last update — not a work-log dump.

```text
Completed:
In Progress:
Blocked:
Next:
Risk / Attention:
```

Build it from the delta between the last standup, new commits, and new work-log entries. Omit unchanged lines rather than repeating them. `Next` reports what the developer has stated they will do — this skill does not plan.

## 6. Weekly product summary

Team- and product-level, aimed at Product and Management. Read the `management-talk` skill for tone and channel shaping.

```text
Week:

1. Completed This Week
2. In Progress
3. Issues / Requests
4. Version / Deployment
5. Next Week (as stated)
6. Decisions Required
7. Follow-Up Actions
```

Omit `Resource / Work Utilization` — there is one developer, so a percentage split across teams would be fabricated. If effort breakdown is wanted, use the real `Spending Hour` totals per module from the work log and label them as such.

## 7. Decisions and follow-up

State lives in the repo:

- `docs/decisions/register.md`
- `docs/follow-up/register.md`

Decision record: Decision, Owner, Action, Due Date, Status, Related Version, Related Work Item.
Follow-up record: Action, Owner, Due Date, Status, Related Work Item, Impact, Next Action.

Statuses: `Open` `In Progress` `Done` `Blocked` `Overdue` `Cancelled`.

- Mark `Done` only on evidence — a commit, a version bump, a work-log entry, or explicit confirmation. A passed due date is **not** completion; it is `Overdue`.
- On every invocation, scan for overdue and stale items and surface them unprompted.
- Carry forward: each entry keeps its previous status alongside the current one so the delta is visible. Do not restart the register each week.

## 8. Traceability and reconciliation

The chain that actually exists here:

```text
Work Log item → Commit(s) → Version bump → Deployment (env) → Standup → Weekly summary → Decision → Follow-Up
```

Report a gap when: a commit has no work-log item, a work-log item has no commit, a version bump omits shipped work, a follow-up is overdue, or the working tree holds uncommitted changes that a log already claims as delivered.

Note: the working tree currently carries a large set of modified files unrelated to feature work (line-ending and config churn from the history recovery). Do not read those as delivered work.

## Output rules

Every report answers: **what happened, why it matters, what should happen next, who acts** — when that information exists.

Separate `Fact` / `Inference` / `Recommendation` / `Needs Confirmation` whenever a claim is not directly evidenced. Keep language readable by Engineering and Management both; skip implementation depth unless it drives a decision.

## Dormant sections

PR review, CI, branch protection, CODEOWNERS, git-tag releases, ticket linkage, and Lark notification are **parked** — the systems they read do not exist in this repo yet. See `DORMANT.md` in this skill folder for each one and the condition that activates it. Do not emit findings from a dormant section; if asked, say the section is dormant and name its activation condition.
