# CC Screen Pop & Softphone — Step-by-Step Test Walkthrough

| Item | Detail |
| --- | --- |
| Status | Current — verified against code 2026-10-06 (incl. the FE-1.2 dialpad and FE-1.3 agent-state selector) |
| Audience | QA running a single scripted session; new team members onboarding to the cc module |
| Scope | One continuous, in-order walkthrough of the screen pop → softphone → call↔case linkage flow, driven entirely by the dev-only mock emitters |
| Companion | `docs/CC-Integration-Dev-Test-Guide.md` — the full **per-behavior catalog** (isolated test cases incl. negative/error paths). Use that for regression sweeps; use **this** for a session script and demo script. Real-adapter testing: `docs/CALL_INCOMING-Mock-Cutover-Checklist.md` |

> Every step gives the exact action and the expected result. Anything else is a bug. Steps are ordered — each one assumes the state left by the previous. Total time ≈ 18 minutes.

---

## Part 0 — Setup (once)

1. `.env` line 34: `VITE_MOCK_API="true"` (mocks exist only on the dev server — they are compiled out of production builds).
2. Start the dev server:

   ```cmd
   pnpm dev
   ```

3. Open `http://localhost:5173`. Log in as a user holding at least one of `case.view`, `contact.view`, `cc.screenpop.view`.
4. Keep the browser devtools **console** open — the whole walkthrough drives the app from there.

**Prerequisite data:** one real customer phone number and id in your environment's data (referred to below as `<PHONE>` / `<CUST-ID>`), ideally with at least one existing case. A customer id with several cases gives the richest screen-pop card.

**Optional preflight:** confirm both console utils are installed:

```js
typeof window.emitMockIncomingCall   // "function"
typeof window.mockCall               // "object"
```

If either is `undefined`, mock mode is not active — recheck Part 0 step 1 and restart the dev server.

---

## Part 1 — The call arrives (screen pop)

### Step 1.1 — Wait for the auto-demo

- **Action:** After login, touch nothing for ~8 seconds.
- **Expected:** An **Incoming Call** card slides in, bottom-right, showing caller number `+66811223344` and a lookup result — either a customer profile or "No customer linked to this number".
- **Checkpoint:** the card appeared on its own; you did not type anything.

### Step 1.2 — The known customer

- **Action:**

  ```js
  window.emitMockIncomingCall({ ani: "<PHONE>" })
  ```

- **Expected:** New card. After a brief lookup it shows the customer — avatar or initials, name, mobile, email — plus up to **3 recent cases** with status chips. The newest case rows are clickable.
- **Checkpoint:** customer block rendered; case list has ≤ 3 rows.
- **Leave this card on screen** — Step 3.1 uses it.

### Step 1.3 — The unknown caller

- **Action:** `window.emitMockIncomingCall()`
- **Expected:** A second card appears and settles in the unknown-caller state after its lookup attempt. Two cards are now visible simultaneously (Step 1.2's + this one).

### Step 1.4 — Card hygiene: expiry, dedupe, cap

Run these three quick checks in any order:

1. **Auto-expiry:** leave any card untouched for **30 seconds** — it disappears on its own.
2. **Dedupe:** redeliver an existing leg:

   ```js
   const id = window.emitMockIncomingCall()   // returns the generated callId
   window.emitMockIncomingCall({ callId: id })
   ```

   Exactly one card appears. Dismiss it, redeliver the same id again — it must **not** come back.
3. **Cap:** fire `window.emitMockIncomingCall()` 5 times, rapidly. At most **4 cards** are visible; the 5th is dropped, not queued. (Dismiss the leftovers afterwards — `Ctrl`-click **Dismiss** on each, or wait 30 s.)

- **Checkpoint:** no console errors at any point. Malformed input (e.g. `window.emitMockIncomingCall({ customerId: null })`) likewise produces **no card and no error** — the guard silently drops it.

---

## Part 2 — The call is answered (softphone)

Navigate to **Workspace → Softphone** in the sidebar (or `/cc/softphone` directly).

> Note: the screen pop and the softphone are independent consumers of the socket — Part 1's cards keep ticking down while you work here, and that coexistence is itself the behavior under test (catalog guide §2.9).

### Step 2.1 — A call becomes active

- **Action:** `window.mockCall.start()`
- **Expected:** The active-call panel appears: phone icon, call id starting `mock-leg-`, a green **Active** chip, and toolbar buttons enabled. Header shows a mock-mode hint.

### Step 2.2 — Hold and resume

- **Action:** Click **Hold**, then **Resume** (the button relabels).
- **Expected:** Status chip goes Active → amber **On hold** → Active. Console equivalents: `window.mockCall.hold()` / `.resume()`.

### Step 2.3 — Mute (device toggle only)

- **Action:** Click **Mute**.
- **Expected:** The button flips to **Unmute**. The call's status chip does **not** change — mute is a local device toggle, not a lifecycle event.

### Step 2.4 — Rich linkage chips

- **Action:** Start a call carrying customer/case linkage:

  ```js
  window.mockCall.start({ customerId: "<CUST-ID>", caseId: "<CASE-ID>" })
  ```

  (any real case id works; the mock displays whatever it is given).

- **Expected:** The active panel shows `Customer: <CUST-ID>` and `Case: <CASE-ID>` chips.

### Step 2.5 — Transfer

- **Action:** Click **Transfer**, or `window.mockCall.transfer("agent-202")`.
- **Expected:** Blue **Transferred** chip, "Transferred to: agent-202" (or your target). All toolbar controls disable — the leg has left this agent's hands.

### Step 2.6 — End of call

- **Action:** Click **Hang Up**, or `window.mockCall.end("completed")`.
- **Expected:** A gray **ended** panel: "Call ended — </callId>", the reason, and **Dismiss**. Duration is absent with the mock (the real adapter supplies it). Dismiss clears the panel.

### Step 2.7 — Terminal is terminal

- **Action:** With the call ended, run `window.mockCall.hold()`.
- **Expected:** Nothing happens. A non-terminal event after `CALL_ENDED` is ignored — the call never resurrects.

### Step 2.8 — Agent state

- **Action:** Click the **Agent state: Unknown** pill on the softphone header (right of the title) — it opens a dropdown — and choose **Break**.
- **Expected:** The pill changes to the localized **Break** label and the check mark sits on the Break option. The change lands only when the confirming `AGENT_STATE_CHANGED` event arrives (command+confirm split) — the mock fires it synchronously, so it appears instant.
- Console equivalents: `window.mockCall.agentState("break")`, or an event state such as `window.mockCall.agentState("available")` — which shows the localized Available label and checks the **Ready** option (event `available` ≡ command `ready`).

### Step 2.9 — Dial out from the dialpad

- **Action:** With no call active, type `0811223344` into the dialpad's destination field (or use the keypad) and press **Call** (or **Enter**).
- **Expected:** The input clears and the active-call panel opens for the new leg — call id `mock-out-…`, green **Active** chip; an outbound connect, never a ring. A status line appears under the keypad reading **Connected** (green dot). Its **X** clears the line without ending the call.

  Console equivalent: `window.mockCall.dial("0811223344")` — same leg, but **no status line** (the status line only tracks dials initiated from the UI, the sole path that receives the correlation `callId`). The amber "Calling…" state is what a real adapter's connect delay would show; the mock connects synchronously.

### Step 2.10 — The dialed leg is a full citizen

- **Action:** With the dialed call connected, click **Hold**, then **Hang Up**.
- **Expected:** Exactly the inbound behavior — amber **On hold** chip, then the gray ended panel ("Call ended — mock-out-…"). The dialpad status line disappears on its own when the leg ends. One state machine, both directions.

### Step 2.11 — Dialpad guards

- **Action:** Dial a fresh number (Step 2.9). While it is connected, look at the **Call** button; then type `08a` into the destination field.
- **Expected:** While a call is active the **Call** button is disabled with the hint "Finish the current call before dialing again" (a second dial would be consult/conference — out of scope this release). Typing `08a` immediately shows "Only digits, +, *, # and separators are allowed"; an over-20-significant-character input shows "Destination is too long". End the call to clean up.

---

## Part 3 — The call becomes a case (linkage)

Navigate back to wherever your Step 1.2 card still lives (or emit a fresh known-customer call: `window.emitMockIncomingCall({ ani: "<PHONE>" })` and wait for resolution).

### Step 3.1 — Create Case from the card

- **Action:** On the card, click **Create Case**.
- **Expected:** The Create Case screen opens with a URL of the shape:

  ```url
  /cms/case/creation?phoneNo=<PHONE>&customerId=<CUST-ID>&callId=<id>&ani=%2B66…&callTimestamp=2026-…
  ```

  The phone field is prefilled; the known customer loads automatically.

- **Checkpoint:** all five params present in the URL. The `callId` / `ani` / `callTimestamp` values are captured into the form's call-linkage state (held client-side until the backend adds the persistence field — by design; the attach point is noted in `saveCase`'s payload comment).

### Step 3.2 — Open an existing case from the card

- **Action:** Go back (or emit another known-customer call), then click one of the recent-case rows on the card.
- **Expected:** Direct navigation to that case's detail view.

---

## Part 4 — Negative-space sweep (5 minutes)

A compact pass over the guards — the full matrix is in the catalog guide §1.8–1.9 and §2:

1. **No permissions, no pop:** log in as a user with none of the three view permissions; emit a call. No card, no error.
2. **Malformed event:** `window.emitMockIncomingCall({ customerId: null })` — silent drop (the classic null-field integration bug the contract forbids).
3. **Mock exclusion from prod-build path:** set `VITE_MOCK_API="false"`, restart `pnpm dev`, open `/cc/softphone` — empty state, no mock hint, toolbar shows the "backend 3CX adapter required" note, the dialpad's **Call** button and the agent-state selector are disabled with their unavailable hints, and `window.mockCall` / `window.emitMockIncomingCall` are `undefined`. Restore `"true"` afterwards.

---

## Part 5 — What this walkthrough cannot cover

Mock mode exercises the FE event path only. These live in the [cutover checklist](./CALL_INCOMING-Mock-Cutover-Checklist.md) for when the real adapter ships:

- Websocket disconnect/reconnect redelivery end-to-end
- Real per-agent event targeting (mock events are self-emitted)
- The dedupe memory cap across a real session (>100 distinct calls)
- Real 3CX `endReason` / `durationSeconds` values on `CALL_ENDED`

**Automated gates before merging any change to these areas:**

```cmd
pnpm test     # full suite incl. the cc guard/reducer/dedupe suites
npx tsc -b    # tests are excluded from tsc — vitest green ≠ types green
pnpm lint
```

---

## Quick command reference

| Goal | Console command |
| --- | --- |
| Unknown-caller card | `window.emitMockIncomingCall()` |
| Known-customer card | `window.emitMockIncomingCall({ ani: "<PHONE>" })` |
| Instant-resolve card | `window.emitMockIncomingCall({ customerId: "<CUST-ID>" })` |
| Dedupe demo | capture the returned callId, re-emit with `{ callId: id }` |
| Start softphone call | `window.mockCall.start()` / `.start({ customerId, caseId })` |
| Outbound dial | `window.mockCall.dial("0811223344")` |
| Lifecycle | `window.mockCall.hold()` / `.resume()` / `.transfer("agent-202")` / `.end("completed")` |
| Agent state | `window.mockCall.agentState("break")` |
