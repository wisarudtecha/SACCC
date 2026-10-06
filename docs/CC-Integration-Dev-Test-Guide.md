# CC Integration — Dev Test Guide (mock mode)

| Item | Detail |
| --- | --- |
| Status | Current — covers everything built in capability-matrix Tracks A + B, incl. the FE-1.2 dialpad and FE-1.3 agent-state selector |
| Date | 2026-10-06 |
| Audience | FE devs, QA running the app locally |
| Related | `docs/CC-ScreenPop-Softphone-Test-Walkthrough.md` (a single scripted session through the same features — use it for QA runs and demos, this catalog for regression sweeps); `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` (testing against the **real** backend adapter — use that once it ships); `docs/CALL-Lifecycle-Websocket-Event-Contract.md`; `docs/CALL_INCOMING-Websocket-Event-Contract.md`; `docs/Make-Call-Command-Contract.md` (the outbound dial command the mock `dial` stands in for); `docs/Agent-State-Command-Contract.md` (the selector's command vocabulary and confirm semantics) |

This guide tests the incoming-call screen pop, the softphone, and the call↔case linkage using the **dev-only mock emitters** — no telephony backend required. Every step lists the exact action and the expected result; anything else is a bug.

---

## 0. Setup

1. In `.env` (line 34) set:

   ```env
   VITE_MOCK_API="true"
   ```

   (The mocks additionally require the Vite dev server — they are compiled out of production builds entirely, so no production risk.)
2. Start the dev server:

   ```cmd
   pnpm dev
   ```

3. Open `http://localhost:5173` and log in as a user who holds at least one of: `case.view`, `contact.view`, `cc.screenpop.view`. (A user with none of these should never see a popup — that's Test 1.8.)
4. Open the browser devtools console — every test below drives the app from there.

> Phone numbers in the tests below must exist in the environment's customer data for the "known customer" scenarios. Replace `08112223344` / `42` with a real phone/customer id from your target environment.

---

## 1. Incoming-call screen pop (`CALL_INCOMING`)

### 1.1 Auto-demo fires after login

- **Action:** After login, do nothing for ~8 seconds.
- **Expected:** An "Incoming Call" card slides in bottom-right with the mock caller number `+66811223344` and a lookup result (customer, or "No customer linked to this number" if that number has no match).

### 1.2 Manual unknown-caller popup

- **Action:** `window.emitMockIncomingCall()`
- **Expected:** New card, unknown-caller state after the lookup attempt.

### 1.3 Known customer resolves

- **Action:** `window.emitMockIncomingCall({ ani: "<real customer phone>" })`
- **Expected:** Card shows the customer (avatar/initials, name, mobile, email) and up to 3 recent cases with status chips; the newest case rows are clickable.

### 1.4 Backend-resolved ids skip the lookup

- **Action:** `window.emitMockIncomingCall({ customerId: "<real id>" })`
- **Expected:** Card resolves instantly (no visible lookup), customer profile shown.

### 1.5 Duplicate callId is deduped

- **Action:**

  ```js
  const id = window.emitMockIncomingCall()   // returns the generated callId
  window.emitMockIncomingCall({ callId: id }) // redeliver the same leg
  ```

- **Expected:** Exactly one card. Dismiss it, then redeliver the same id again — the card must **not** come back.

### 1.6 Fifth concurrent call is dropped, not queued

- **Action:** Fire 4 calls with distinct ids (just call `emitMockIncomingCall()` four times), then a 5th.
- **Expected:** 4 cards visible max; the 5th shows nothing.

### 1.7 Cards auto-expire after 30 s

- **Action:** Leave a card untouched for 30 seconds.
- **Expected:** It disappears on its own. (Cards you are actively using actions on follow the same clock — the timer is not reset by interaction, by design.)

### 1.8 Malformed events are silently dropped

- **Action:**

  ```js
  window.emitMockIncomingCall({ customerId: null })   // null optional = classic integration bug
  ```

- **Expected:** **No card, no console error.** The event is dropped by the type guard. (This is the behavior the backend contract forbids triggering — see contract §4 sharp edges.)

### 1.9 Permission gating

- **Action:** Log in as a user with none of the three view permissions and emit a call.
- **Expected:** No card, no error.

---

## 2. Softphone (`/cc/softphone`)

Navigate via the sidebar (**Workspace → Softphone**) or go to `/cc/softphone` directly. The old dead link is gone; the page loads with an empty state and a mock-mode hint. The page also carries the dialpad (§2.10–2.13) and the header agent-state selector (§2.7).

### 2.1 Active call from a mock pickup

- **Action:** `window.mockCall.start()`
- **Expected:** Active-call panel appears: phone icon, call id (`mock-leg-…`), green **Active** chip. Toolbar buttons enabled.

### 2.2 Hold / Resume

- **Action:** Click **Hold**, then **Resume** (the button relabels between them).
- **Expected:** Status chip switches Active → amber **On hold** → Active. (Console equivalent: `window.mockCall.hold()` / `.resume()`.)

### 2.3 Mute is local-only

- **Action:** Click **Mute**.
- **Expected:** Button toggles to **Unmute**. No status change on the call — mute is a device toggle, not a lifecycle event.

### 2.4 Transfer

- **Action:** Click **Transfer** (or `window.mockCall.transfer("agent-202")`).
- **Expected:** Blue **Transferred** chip + "Transferred to: mock-agent-2" (or your target). All toolbar controls disable — the leg is out of this agent's hands until it ends.

### 2.5 Hang up and the ended notice

- **Action:** Click **Hang Up** (or `window.mockCall.end("completed")`).
- **Expected:** Gray **ended** panel: "Call ended — </callId>", reason, and (when the adapter supplies it — the mock doesn't) a duration. **Dismiss** clears it. With the mock, add a duration by ending via a hand-built event, or accept its absence.

### 2.6 Customer/case chips

- **Action:** `window.mockCall.start({ customerId: "42", caseId: "D260708-00001" })`
- **Expected:** The active panel shows `Customer: 42` and `Case: D260708-00001` chips.

### 2.7 Agent state pill and selector

- **Action:** Click the **Agent state: …** pill on the softphone header (right of the title) — it is the dropdown trigger. Choose **Not Ready**.
- **Expected:** The dropdown offers Ready / Not Ready / Break. The pill and the option's check mark move to the localized **Not Ready** label only when the confirming `AGENT_STATE_CHANGED` event arrives (command+confirm split — agent-state command contract §4: the command response never moves the pill). With the mock the event fires synchronously, so the change appears instant. Before any event the pill reads the localized "Unknown" placeholder.
- **Console equivalents:** `window.mockCall.agentState("not_ready")` (a command value) or any event state, e.g. `.agentState("available")`. Event-vocabulary states also render localized and highlight their equivalent command option with the check mark — `ready` ↔ `available`, `not_ready` ↔ `busy`, `break` ↔ `break` — so `.agentState("available")` checks **Ready**. Unknown states (e.g. `"out_to_lunch"`) render as-is and highlight nothing; system-driven states like `"offline"` render localized but check no option.

### 2.8 Terminal-sticky ended state

- **Action:** End the call, then run `window.mockCall.hold()`.
- **Expected:** Nothing changes — a non-terminal event after `CALL_ENDED` is ignored, never resurrects the call.

### 2.9 Screen pop and softphone coexist

- **Action:** Emit an incoming call (screen pop) and start a mock softphone call.
- **Expected:** Both work independently — the popup owns ringing, the softphone owns the post-answer lifecycle.

### 2.10 Outbound dial via the dialpad (UI)

- **Action:** With no active call, type `0811223344` into the destination field (keypad clicks and the backspace button work too) and press the green **Call** button — or press **Enter**.
- **Expected:** The input clears and the active-call panel opens for the new leg: call id `mock-out-…`, green **Active** chip — an outbound connect (`CALL_ANSWERED`), never a ring (make-call command contract §4). The status line under the keypad appears and reads **Connected** with a green dot. Note: the amber **Calling 0811223344…** state is the pre-connect state a real adapter would show — the mock emits the connect synchronously, so it is effectively not observable in mock mode. The status line's **X** clears the line only; the call continues.

### 2.11 Outbound dial via the console

- **Action:** `window.mockCall.dial("0811223344")`
- **Expected:** Same result as 2.10 minus the status line: the leg opens in the active-call panel (`mock-out-…`) and the toolbar acts on it, but **no dialpad status line appears** — the status line only tracks dials initiated from the UI, which is the only path that receives the command response's correlation `callId` (contract §3.2). This asymmetry is by design, not a bug.

### 2.12 Dialpad guards

- **Action (busy):** With any call active (inbound or dialed), look at the **Call** button.
- **Expected:** It is disabled with the hint "Finish the current call before dialing again" — a second dial while connected is consult/conference semantics, out of scope this release (plan Q7).
- **Action (invalid input):** Type `08a`, then a destination of more than 20 significant characters (e.g. 21 digits).
- **Expected:** The error "Only digits, +, *, # and separators are allowed" appears as you type; the over-long input shows "Destination is too long". The **Call** button is disabled in both cases (also when the input is simply empty — no message then). Valid destinations: digits, `*`, `#`, an optional single leading `+`, separators (space, `-`, `(`, `)`, `.`), 1–20 significant characters.

### 2.13 Toolbar commands act on the dialed leg

- **Action:** Dial a number (2.10), then use **Hold** / **Hang Up** on it.
- **Expected:** The dialed leg rides the same state machine as an inbound leg — **Hold** shows the amber **On hold** chip, **Hang Up** the gray ended panel ("Call ended — mock-out-…"). When the dialed leg ends, the dialpad status line disappears on its own (the ended notice takes over).

---

## 3. Call↔case linkage (Create Case prefill)

### 3.1 Prefilled creation from a popup card

- **Action:** On a screen-pop card, click **Create Case**.
- **Expected:** The create-case screen opens with a URL like:

  ```url
  /cms/case/creation?phoneNo=0811223344&customerId=42&callId=<id>&ani=%2B66811223344&callTimestamp=2026-10-05T…
  ```

  The phone field is prefilled; a known customer loads automatically. The `callId`/`ani`/`callTimestamp` params are captured into the form's call-linkage state (kept client-side until the backend adds the persistence field — by design, see `saveCase`'s payload note).

### 3.2 Open a case from the card

- **Action:** Click a recent-case row on the card.
- **Expected:** Navigates to that case's detail view.

---

## 4. Non-mock sanity check (optional but recommended)

1. Set `VITE_MOCK_API="false"` (or comment it out) in `.env`, restart `pnpm dev`.
2. Open `/cc/softphone`.

- **Expected:** Empty state with *no* mock hint; toolbar shows the note "Call control actions require the backend 3CX adapter…"; the dialpad's **Call** button is disabled with its own unavailable hint and the agent-state selector is disabled with the note that it reflects live events only; `window.mockCall` and `window.emitMockIncomingCall` are `undefined` in the console.

1. Restore `VITE_MOCK_API="true"` afterwards.

---

## 5. What mock mode cannot cover

These need the real adapter — they are in the [cutover checklist](./CALL_INCOMING-Mock-Cutover-Checklist.md) instead:

- Websocket **disconnect/reconnect redelivery** behavior end-to-end
- Real event **targeting** (per-agent delivery, not self-emitted)
- The 100-id dedupe cap in a real session (>100 distinct calls)
- Real 3CX `endReason`/`durationSeconds` values on `CALL_ENDED`

---

## 6. Automated regression gates

Before merging any change to these areas:

```cmd
pnpm test     # 485 tests total, 165 of them across the cc integration areas
npx tsc -b    # type check (tests are excluded from tsc — vitest green ≠ types green)
pnpm lint
```
