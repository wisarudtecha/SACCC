# BE Routing Email — CALL_INCOMING Contract Sign-off

> Draft for sending. Placeholders in [brackets]. Doc under review:
> `docs/CALL_INCOMING-Websocket-Event-Contract.md` (DRAFT v0.9).

---

**To:** [BE lead — 3CX adapter owner]
**CC:** [product owner], [FE lead]
**Subject:** Sign-off needed: CALL_INCOMING websocket contract (screen pop) — 7 open questions

---

Hi [BE lead],

The frontend for the incoming-call screen pop (3CX → agent popup → customer/case) is implemented and tested, currently running against a dev-only mock emitter. Before you start the 3CX Integration Adapter, we need your sign-off on the event contract and decisions on **7 open questions**:

Full contract with wire format, validation table, and test vectors:
`docs/CALL_INCOMING-Websocket-Event-Contract.md` (DRAFT v0.9). Summary below — answers can be replied inline.

**Q1 — Event targeting (biggest decision).** The FE does *not* filter by `agentId`; whatever connection receives the event shows a popup. So the adapter must decide delivery: per-agent-connection (ringing extension's user), per agent-group, or org-wide broadcast. Org-wide = every agent gets a card on every call. *FE proposal: per-agent-connection.*

**Q2 — `callId` source.** The FE dedupes on `callId` for the whole session; a reused id makes the second call invisible to that agent. Does the 3CX Call Control API expose a stable call-leg id we can use? *FE proposal: 3CX leg id verbatim, prefixed `3cx-<legId>`.*

**Q3 — Pre-resolution.** Will the adapter populate `customerId`/`caseId`, or leave caller resolution to the FE (both paths are built and tested)? Note: a `customerId` that fails to resolve renders an error card — worse than a clean unknown-caller card. *FE proposal: hybrid — send ids only when matched with confidence, omit otherwise.*

**Q4 — Anonymous callers.** What does 3CX deliver when the number is withheld, and should we emit the event at all? Current contract drops events with empty `ani`; supporting an "Unknown caller" card would be a small contract v1.1 change.

**Q5 — Multi-tab.** One event per user or per connection? A user with two tabs open: per-connection delivery is fine — each tab dedupes independently and shows one card.

**Q6 — No replay.** Confirm calls are transient: no backlog replay after a socket reconnect (deliberate contrast with SLA-ESCALATION). A missed popup is acceptable; the call still exists in 3CX.

**Q7 — Timestamp.** Confirm server-clock ISO 8601 with `Z`/offset, e.g. `2026-10-02T10:30:00.000Z`.

Two implementation traps worth flagging early (events are **silently dropped**, no error surfaced):

1. Optional fields (`customerId`, `caseId`, `agentId`) must be **omitted when unknown — never JSON `null`**.
2. Event name is `CALL_INCOMING` — underscore, not the `SLA-ESCALATION` hyphen style.

Could you review the doc and answer Q1–Q7 by [date]? Happy to walk through it in a 30-min call if easier — the questions, especially Q1/Q2, are quicker to settle live.

Thanks,
[your name]
