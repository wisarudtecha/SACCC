# Mention Notification Flow — Manual Test Procedures

Date: 2026-10-20. Covers the implementation in `docs/mention-frontend-notification-plan.md`
Phases 1 + 3: bell/dropdown integration (`NotificationDropdown`, `mentionEvent.ts`,
`mentionNotification.ts`) and the `CASE-HISTORY` comment-feed fixes (`Comment.tsx`).

## Current behavior under test

- A comment containing `@username` (added by User A, mentioning User B) makes the
  backend emit a per-agent `MENTION` websocket event to User B only.
- On User B's session the event surfaces **only** through the notification bell:
  slide-in popup (with sound, per notification preferences), a bell-list entry,
  and the unread badge. The old standalone toast is retired — verify it does
  **not** appear.
- Clicking the popup or the list entry navigates to `/cms/case/{caseId}`.
- Unread state resets on reload (expected until backend Option B).
- Self-mention is **not suppressed** (neither backend nor frontend — Phase 2 is
  not implemented; do not file a bug for it).

## Prerequisites

- [ ] Backend running with mention events enabled (server-side `@username`
      parsing; DDL for `case_history_mention` applied if you want to inspect rows).
- [ ] Two test accounts in the **same org**, both active, both able to open the
      app in separate browser profiles / incognito windows:
      **User A** (author) and **User B** (mention target — pick a username matching
      the mention parser charset `[a-zA-Z0-9_.-]+`).
- [ ] Both sessions show the websocket as connected (bell connection dot, or
      `SUBSCRIBE-SUCCESS` in the Network/WS tab).
- [ ] Both sessions' first outgoing `SUBSCRIBE` frame carries an `access_token` field.
      A session whose frame has no `access_token`, or an expired token, never reaches
      `SUBSCRIBE-SUCCESS` — see
      [`WEBSOCKET-Auth-Token-Implementation-Plan.md`](./WEBSOCKET-Auth-Token-Implementation-Plan.md).
- [ ] Devtools open on User B's session — the WS frame inspector (Network → WS)
      is the fastest way to confirm a `MENTION` event arrived when a UI step fails.

Reference `MENTION` payload (live traffic, 2026-10-20): `EVENT: "MENTION"` with
fields `caseId`, `commentId`, `mentionedByUserId`, `mentionedByUsername`,
`mentionedByDisplayName`, `mentionedUserId`, `mentionedUsername`, `timestamp`.

## Test cases

### TC-1 — Mention happy path (other user, online)

1. User B: log in, stay on any page (the bell is global — verify on a non-case
   page to prove the popup is not case-view-dependent).
2. User A: open any case detail → comment box → type `@`, pick User B from the
   autocomplete (or type their exact username), add text, send.
3. User A also sees their own comment appear in that case's comment feed
   (optimistic `CASE-HISTORY` append, `eventType` not `hidden`).

**Expected (User B):**
- [ ] Slide-in popup: "{A displayName} mentioned you in case {caseId}" — no
      separate round toast anywhere.
- [ ] Notification sound plays (if preferences → sound enabled).
- [ ] Bell badge count +1; opening the bell shows an unread "Mention" entry
      with the same message.
- [ ] "Mention" appears in the bell's type filter list once the entry exists.

### TC-2 — Click-through navigation

1. From TC-1, User B clicks the popup (or the bell list entry).

**Expected:**
- [ ] Navigates to `/cms/case/{caseId}` — the case from the comment.
- [ ] The comment containing `@UserB` renders with a mention pill on the
      username (existing rendering, regression check).
- [ ] The popup dismisses on click; other queued popups (if any) still behave.

### TC-3 — Read state

1. From TC-1 (popup auto-dismissed, unread badge at least 1), User B opens the
   bell and marks the entry (or all) as read.

**Expected:**
- [ ] Badge clears; the entry stays in the list.
- [ ] Reload the page → badge is 0 and the mention entry is gone (unread and
      list are in-memory only until backend Option B — expected, not a bug).

### TC-4 — Comment without a mention

1. User A sends a plain comment (no `@`) on any case.

**Expected (User B):**
- [ ] No popup, no badge change. (If User B has that case's detail open, the
      comment still appears in the feed — `CASE-HISTORY` path, unchanged.)

### TC-5 — Mention of an offline user

1. User B logs out (or closes the browser).
2. User A mentions User B in a comment.
3. User B logs back in.

**Expected:**
- [ ] No popup on login (transient event, Option A).
- [ ] If User B opens that case, the comment with the mention pill is visible
      (the comment text is the source of truth).

### TC-6 — Dedupe / repeat

1. User A mentions User B in a comment (popup fires on B).
2. User A mentions User B again in a **new** comment on the same case.

**Expected:**
- [ ] Two popups over time, two bell entries, badge = 2 (stable ids differ per
      `commentId`).
3. If practical, force a websocket reconnect on B (devtools → Network → WS →
   close the connection) shortly after step 1 — the backend does not replay
   transient events, so no duplicate popup is expected.

### TC-7 — Self-mention (documents current behavior)

1. User A mentions their own username in a comment.

**Expected:**
- [ ] User A receives the popup/badge for their own mention (no suppression —
      Phase 2 policy pending; verify only that nothing crashes and the entry
      navigates correctly).

### TC-8 — Hidden eventType comment (Phase 3)

1. If the backend can produce a comment event with top-level
   `eventType: "hidden"` (e.g. internal comment UI, if wired): send one while
   User B has that case's detail open.

**Expected:**
- [ ] The hidden comment is **not** optimistically appended to the visible
      feed (no flash-in).
- [ ] No popup/badge for it (the bell's generic path already filtered `hidden`).
- [ ] After a feed refetch, visibility matches the server's answer.

### TC-9 — Optimistic comment org field (Phase 3, regression)

1. User B has a case detail open; User A comments on that case (non-hidden).

**Expected:**
- [ ] The optimistic comment row renders normally. The `orgId` read now uses
      `additionalJson.orgId`; confirm in the WS frame that the event carries
      `additionalJson.orgId` and that the appended comment's org is non-empty
      (a wrong-field read previously produced an empty org with no visible
      symptom, so this is partly a code-inspection check).

### TC-10 — i18n

1. Switch language (th / en / cn) on User B's session.
2. Repeat TC-1.

**Expected:**
- [ ] Popup message uses the selected language: "ได้กล่าวถึงคุณในเคส {caseId}" /
      "mentioned you in case {caseId}" / "在案件 {caseId} 中提到了你".

## Quick troubleshooting

| Symptom | Check |
| --- | --- |
| No popup on B | WS frame inspector: did the `MENTION` frame arrive? Targeting is per (orgId, username) — B's SUBSCRIBE payload must match. |
| B's socket never shows `SUBSCRIBE-SUCCESS` | First outgoing WS frame: does it carry `access_token`? A missing field (no/expired token) is the usual cause; the connection then closes without registering, so no event is ever routed to B. |
| Socket drops right after connecting (close code 4401/4403) | The server rejected the credential. The app refreshes once and retries once; a second rejection is terminal by design — check the token in `localStorage.access_token` / `sessionStorage.access_token`. |
| Frame arrived, nothing shown | Notification preferences (`localStorage.notification_preferences`) — `popupEnabled` / `pushEnabled`. |
| Popup but no badge | Known in-memory state; confirm the bell list has the entry. |
| Double alert (popup + toast) | Regression — the standalone toast was retired; check `websocket.tsx` for a reintroduced `MENTION` case. |
