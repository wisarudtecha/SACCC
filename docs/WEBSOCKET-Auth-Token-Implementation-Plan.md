# Notifications WebSocket — Access Token on Connect / Register

**Status:** Implemented on the FE (2026-11-17). Server-side validation pending — see BDR-10.
**Decision (2026-11-17):** the token travels as a **flat `access_token` field on the `SUBSCRIBE` frame**.
Request-header carriers were prototyped, verified and then removed the same day (see §4).
**Scope:** `src/core/components/websocket/` — how the browser presents the JWT to the socket
**Owner:** FE (`cloud-contact-center`); the server-side validation belongs to BE (`welcome-case`)

---

## 1. Intent

Every time the notifications socket registers, the client must prove who it is, so the server can stop
trusting the `orgId` / `username` the client claims.

Today it authenticates nothing: the register frame is the only thing that identifies the connection, and
anyone who can reach `wss://<host>/api/v1/notifications/register` can claim to be any user and receive
that user's notifications — mentions, case updates, incoming-call screen pops. This is an authorization
hole on a live channel.

---

## 2. Platform constraint — a browser cannot send a header on the WebSocket handshake

`new WebSocket(url, protocols)` is the entire browser API: no options object, no header parameter (MDN,
[`WebSocket()` constructor](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)).
Only non-browser clients — Node `ws`, gorilla/websocket dialers, curl — can set `Authorization` on the
upgrade request.

So "send `Authorization: Bearer <jwt>` when connecting" cannot be implemented from this app. The four
carriers that exist, and why the frame field won:

| # | Carrier | Browser-expressible | Verdict |
|---|---------|--------------------|---------|
| A | Flat `access_token` field on the `SUBSCRIBE` frame | yes | **Chosen.** One key, no handshake work, no URL logging, no proxy interaction |
| B | `Sec-WebSocket-Protocol: access_token, <jwt>` | yes (the only header value a page controls) | Built and verified, then **removed** — aborts the handshake unless the server echoes the protocol, and the header cannot be named `Authorization` (§4) |
| C | `?access_token=` on the upgrade URL | yes | Rejected: a JWT in a query string lands in nginx / proxy / APM access logs |
| D | Cookie | automatic | Rejected: `TokenManager` writes a `btoa()`-wrapped value with `SameSite=Strict`, and same-origin-ness is unverified |

---

## 3. Current state — evidence

| # | Fact | Evidence |
|---|------|----------|
| 1 | The socket is constructed with a URL only — no protocols, no credential | `websocket.tsx` — `new WebSocket(config.url)` |
| 2 | Register frame: `{ EVENT: "SUBSCRIBE", orgId, username, access_token }` | `buildRegisterFrame` in `websocketAuth.ts` |
| 3 | Identity comes from `TokenManager.getStoredUser()`, token from `TokenManager.getToken()` | `tokenManager.ts` — the only writer of both keys |
| 4 | No token → the socket is never opened, state `unauthorized` (fail closed) | `websocket.tsx` — `websocket(config)` |
| 5 | `4401`/`4403` → one refresh (`POST /auth/refresh`) + one reconnect, then terminal | `nextReconnectAction` + `recoverAfterAuthRejection` |
| 6 | Heartbeat and `DASHBOARD` frames carry no token (validation is per connection) | `STAMP_EVERY_OUTGOING_FRAME = false` |
| 7 | Contract docs publish the frame shape | the three `*-Websocket-Event-Contract.md`, §2.1 |

**Why not `localStorage.getItem("access_token")` directly** (the literal wording of the original request):
`TokenManager` is what writes that key, it stores the session in `sessionStorage` whenever `rememberMe` is
false (`tokenManager.ts:52`), and its `decrypt()` is part of the read path. Reading storage by hand
reproduces the `UserAuditLog` defect recorded in `changelog.json`.

---

## 4. Decision record — the header carrier (rejected 2026-11-17)

Built, verified against a local probe, and then removed at the product owner's decision, because the
frame field is simpler for both sides.

**What was built.** `Sec-WebSocket-Protocol: access_token, <jwt>` as an opt-in carrier
(`VITE_WS_TOKEN_CARRIER=subprotocol`), plus a `query` carrier, a carrier parser, and an RFC 7230 token
charset guard (a padded JWT makes `new WebSocket` throw).

**Why it was dropped.** Two hard costs for one benefit:

1. A browser that offers a subprotocol and receives a 101 without one **aborts the connection**:
   `Error during WebSocket handshake: Sent non-empty 'Sec-WebSocket-Protocol' header but no response was received`
   (reproduced in Chrome against a local probe). Enabling it before the server echoes the protocol takes
   realtime down completely.
2. The header still cannot be named `Authorization`, so it never actually resembles a REST request. Only a
   server-side component holding the socket could do that.

**Kept from that work** (both real defects found while testing the carrier):

- `onerror` used to zero the reconnect counter, so a handshake the browser keeps refusing retried forever,
  every 5 s, with no ceiling. The counter now resets on `SUBSCRIBE-SUCCESS` instead, so a broken
  configuration stops after `maxReconnectAttempts` and reports `error` (measured: no further attempts
  after the cap).
- The `profile.orgId` crash when `localStorage.profile` was absent, and the hand-rolled
  `JSON.parse(localStorage.profile)` that could never see `sessionStorage`.

---

## 5. Module API — `src/core/components/websocket/websocketAuth.ts`

Pure (no DOM, no React), so it is unit-tested directly under the default node test environment.

| Export | Purpose |
|--------|---------|
| `getAccessToken` / `hasRefreshToken` | `TokenManager` readers. Never `localStorage` directly. |
| `buildRegisterFrame(identity, token)` | `{ EVENT: "SUBSCRIBE", orgId, username, access_token }`. **Omits** the key when there is no token (not `""`, which a server may read as present). |
| `withAccessToken(payload, token)` | Non-mutating stamp for outgoing frames; used only when `STAMP_EVERY_OUTGOING_FRAME` is on. |
| `STAMP_EVERY_OUTGOING_FRAME` | `false` — validation is per connection, so only the register frame carries the credential. |
| `WS_CLOSE_UNAUTHORIZED` / `WS_CLOSE_FORBIDDEN` | `4401` / `4403`. |
| `isAuthRejectionCode(code)` | Whether a close is an auth decision rather than a dropped connection. |
| `nextReconnectAction(decision)` | `"retry" \| "refresh-and-retry" \| "stop"`, with a one-refresh guard. |

Tests: [`websocketAuth.test.ts`](../src/core/components/websocket/websocketAuth.test.ts) — 16 cases
(frame shape, omitted key, rotated-token read, stamping, close-code classification, every reconnect
branch) plus [`websocketProvider.test.tsx`](../src/core/components/websocket/websocketProvider.test.tsx) —
5 cases driving the real provider against a fake `WebSocket` and the real `TokenManager`.

---

## 6. Decisions — answered 2026-11-17

| ID | Question | Answer | Consequence |
|----|----------|--------|-------------|
| Q1 | Does the register endpoint validate anything today? | **It trusts `orgId`/`username` from the client** | The token is new information for the server. FE-only work cannot close the hole — BE must validate. |
| Q2 | Which carrier can the server read? | **Frame field, flat `access_token`** | Finalsed 2026-11-17 after the header experiment. No query string, no subprotocol. |
| Q3 | Frame shape? | **`access_token: "<jwt>"`** (not `headers: { Authorization }`) | Implemented exactly as `buildRegisterFrame` produces it. |
| Q4 | Per-message or per-connection validation? | **Per connection** | `STAMP_EVERY_OUTGOING_FRAME = false`. |
| Q5 | Close code, and timeout for an un-registered socket? | **"As appropriate, not too long"** | Proposal to BE: close `4401` / reason `unauthorized`, and close a socket that has not sent a valid `SUBSCRIBE` within **10 s**. The FE side of `4401`/`4403` is implemented and tested. |
| Q6 | Is there a token-refresh endpoint? | **Yes** | `AuthContext.refreshToken` → `AuthProvider.refreshToken` → `AuthService.refreshToken` → `POST /auth/refresh`. So `4401` becomes `"refresh-and-retry"` once, not a dead end. |

Note on Q6: `AuthProvider.refreshToken` returns `Promise<void>` and deliberately swallows failures
(`AuthProvider.tsx:346-353`), so the socket provider judges the outcome by re-reading the credential and
lets a second `4401` fall through to `"stop"`.

---

## 7. Verification

A captured frame proves what the client *sent*, not that the server *accepted* it.

### 7.1 Local harness (no backend needed) — `scripts/ws-probe.mjs`

Dependency-free WebSocket probe: completes the upgrade, logs the request and every frame, and answers
`SUBSCRIBE` with `SUBSCRIBE-SUCCESS` so the app reports "connected".

```bash
node scripts/ws-probe.mjs 8899                                    # terminal 1
VITE_WEBSOCKET_BASE_URL=ws://localhost:8899 pnpm dev              # terminal 2 (PowerShell: $env:…)
```

Pass (captured 2026-11-17 on localhost):

```text
[probe] UPGRADE path: /api/v1/notifications/register
[probe] UPGRADE authorization header: (none — expected, the browser cannot set it)
[probe] FRAME #1 RAW: {"EVENT":"SUBSCRIBE","orgId":"…","username":"…","access_token":"eyJ…"}
[probe] FRAME #1 access_token: (present)
[probe] REPLIED SUBSCRIBE-SUCCESS
[probe] FRAME #2 RAW: {"EVENT":"DASHBOARD","orgId":"…","username":"…"}   <- no token, by design
```

The probe prints `>>> NO CREDENTIAL ON THE REGISTER FRAME <<<` when the field is missing, and with no
token in storage the app opens **no socket at all**, so the probe logs nothing new.

Two traps when reading this in DevTools instead:
- The **upgrade request** never carries the token — expected, and the whole reason for the frame field.
  Look at Network → WS → **Messages**, the first outgoing (`↑`) entry.
- A socket opened **before** a code edit keeps its old handlers until the page reloads: HMR swaps the
  module but `wsRef` still holds the old socket, so the old frame keeps going out. Hard-reload
  (`Ctrl+Shift+R`) or restart the dev server before concluding anything.
- The `DASHBOARD` frame carries no token on purpose. If that is the frame you are looking at, nothing
  changed — correctly.

### 7.2 Against a real backend

1. First outgoing frame carries `access_token` with a well-formed JWT.
2. `SUBSCRIBE-SUCCESS` arrives, then a real `CASE-UPDATE` from another session reaches the app.
3. **The one that proves the fix:** tamper the token → the server closes `4401` → the app performs exactly
   one refresh, then stops with an `unauthorized` state and no retry storm.
4. A socket that connects and never sends `SUBSCRIBE` is closed by the server within 10 s (Q5).

### 7.3 Regression

`pnpm test`, `pnpm lint`, `pnpm build` (`tsc -b` is strict). Last run: **62 files / 721 tests passed**,
`tsc -b` exit 0, `eslint` exit 0.

---

## 8. Docs and contracts updated in the same change

- The three event-contract docs (`CALL_INCOMING`, `CALL-Lifecycle`, `CALL_CENTER_DASHBOARD_INVALIDATED`) —
  `Credential` transport row + §2.1 with the frame sample, the FE behaviour, and the explicit statement
  that the socket is **not** authenticated until the server validates.
- `docs/mention-notification-test-procedures.md` — prerequisite that the `SUBSCRIBE` frame carries
  `access_token`, plus troubleshooting rows (no `SUBSCRIBE-SUCCESS`; close `4401/4403`).
- `docs/backend-dependency-requests.md` — **BDR-10**.
- `CLAUDE.md` — the Real-time section records the frame-field contract and that server validation is
  pending.
- `changelog.json` — deliberately **not** touched: entries are batched into the weekly
  "docs: update weekly development records" commit together with the version bump, which is a release
  decision.

---

## 9. Adjacent defects found while exploring (out of scope, listed so they are not lost)

1. **`useRealTimeUpdates.ts:24`** opens a second, unauthenticated socket at a hardcoded
   `ws://localhost:5173/ws`, ignoring `VITE_WEBSOCKET_BASE_URL` — and `ws://` is blocked as mixed content
   on every HTTPS environment. It is currently **inert**: `enabled` defaults to `false`
   (`EnhancedCrudContainer.tsx:140`) and every call site passes `realTimeUpdates: false`. Delete it, or
   route it through the provider — do not "fix" it by adding a token to a socket nothing enables.
2. **`websocket.tsx`** — `if (isConnected === false && …)` reads `isConnected` from the render closure that
   created the socket, not from current state. It works because consumer effects usually re-invoke
   `websocket()` with fresh state first, but it is fragile around reconnects.
3. **`NotificationDropdown.tsx:78-81`** — a raw `localStorage.getItem("access_token")` helper (used only as
   a guard). Same class of bug as `UserAuditLog`; unrelated to the socket, but it is where someone will
   copy the wrong pattern from.
4. **`websocket.tsx`** — `switch (message.data.EVENT != null)` switches on a boolean whose `case` values are
   also booleans. It routes `CASE*` events correctly by coincidence.

---

## 10. Non-goals

- Changing the socket endpoint, envelope, or event names.
- Moving the credential into the upgrade request (impossible from a browser — §2).
- A general token-refresh overhaul: this work only *uses* the existing refresh path.
- Any server-side change in this repo (BE lives in `welcome-case`).
- Moving tokens out of web storage.

---

## 11. Progress

| Phase | What | State |
|-------|------|-------|
| 1 | `websocketAuth.ts` + tests (pure helpers) | ✅ 2026-11-17 |
| 2 | Provider wiring: fail-closed, register field, refresh-once policy, `unauthorized` state | ✅ 2026-11-17 |
| 3 | Contract docs, BDR-10, `CLAUDE.md`, test procedures | ✅ 2026-11-17 |
| — | Request-header carriers (`subprotocol`, `query`) | ✅ built, verified, ❌ **removed** per decision (§4) |
| 4 | Reverted to the frame field, docs re-synced, probe simplified | ✅ 2026-11-17 |

**Still owed:** server-side validation (BDR-10) and the live-environment checks in §7.2. Until those land,
"the FE sends a token" is not "the socket is authenticated".
