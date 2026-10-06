// Agent-state command domain types (FE softphone / 3CX) — actual-calling plan
// Phase FE-1.3.
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT — READ BEFORE WIRING TO A LIVE ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
// Full wire-level contract (command vocabulary, request/response envelope,
// confirmation semantics, test vectors, open questions):
// docs/Agent-State-Command-Contract.md — keep this file and that document in
// sync when the contract changes.
//
// The command vocabulary (`ready` / `not_ready` / `break`, BRD FR-07) is
// deliberately distinct from the AGENT_STATE_CHANGED event vocabulary
// (`available` / `on_call` / `busy` / `break` / `after_call_work` /
// `offline`, lifecycle contract §5.2): commands are the agent's intent,
// events are the platform's facts. The mapping between them is the command
// contract's open question Q2 — treat AGENT_STATE_COMMAND_EVENT_EQUIVALENTS
// as provisional until sign-off.
//
// The backend 3CX integration adapter is not built yet; the FE is built
// against the dev-only mock emitter (`mockCallLifecycle.ts`), whose
// agentState() fires the same AGENT_STATE_CHANGED event the adapter will.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agent-selectable presence commands the softphone offers (BRD FR-07:
 * Ready / Not Ready / Break). System-driven event states (`on_call`,
 * `after_call_work`, `offline`) are deliberately NOT commands.
 */
export const AGENT_STATE_COMMANDS = ["ready", "not_ready", "break"] as const;

/** Union of the command values, derived from the tuple above. */
export type AgentStateCommand = (typeof AGENT_STATE_COMMANDS)[number];

/**
 * Canonical AGENT_STATE_CHANGED event state each command is expected to
 * produce (command contract §5.1, provisional pending Q2/Q4). Used only for
 * label/highlight equivalence — the event's own value always wins on screen.
 */
export const AGENT_STATE_COMMAND_EVENT_EQUIVALENTS: Record<
  AgentStateCommand,
  string
> = {
  ready: "available",
  not_ready: "busy",
  break: "break",
};

/**
 * i18n label keys for both vocabularies: the command values and the
 * lifecycle contract's canonical event states. Unknown states have no entry
 * and render as-is (forward compatible, same rule as the event contract).
 */
const AGENT_STATE_LABEL_KEYS: Readonly<Record<string, string>> = {
  ready: "cc.softphone.state_ready",
  not_ready: "cc.softphone.state_not_ready",
  break: "cc.softphone.state_break",
  available: "cc.softphone.state_available",
  on_call: "cc.softphone.state_on_call",
  busy: "cc.softphone.state_busy",
  after_call_work: "cc.softphone.state_after_call_work",
  offline: "cc.softphone.state_offline",
};

/**
 * Normalizes a candidate command value: trims, lowercases, and checks
 * membership in AGENT_STATE_COMMANDS. Returns null for anything the selector
 * must not send — empty strings, unknown values, non-strings, and the
 * system-driven event states (`on_call` etc. are valid *event* values but
 * not *command* values, command contract §6).
 */
export function normalizeAgentStateCommand(
  value: unknown
): AgentStateCommand | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return (AGENT_STATE_COMMANDS as readonly string[]).includes(normalized)
    ? (normalized as AgentStateCommand)
    : null;
}

/**
 * i18n label key for a state string (either vocabulary), or null when the
 * value is not known — callers render unknown values as-is.
 */
export function agentStateLabelKey(state: string): string | null {
  return AGENT_STATE_LABEL_KEYS[state] ?? null;
}

/**
 * True when `currentAgentState` (the latest AGENT_STATE_CHANGED payload
 * value) corresponds to `command` — either because the event echoed the
 * command value (contract Q4, mock path) or its canonical equivalent
 * (§5.1). Used to highlight the selector's active option; a system-driven
 * or unknown state highlights nothing.
 */
export function isAgentStateSelected(
  command: AgentStateCommand,
  currentAgentState: string | null
): boolean {
  if (currentAgentState === null) {
    return false;
  }
  return (
    currentAgentState === command ||
    currentAgentState === AGENT_STATE_COMMAND_EVENT_EQUIVALENTS[command]
  );
}
