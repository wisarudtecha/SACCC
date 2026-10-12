// src/cc/store/api/graphql/callControlQueries.ts
//
// GraphQL mappings for the 3CX call-control commands (capability-matrix Phase 2,
// Track B4; REST endpoints in `src/cc/store/api/callControlApi.ts`).
//
// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDERS PENDING BFF SIGN-OFF — READ BEFORE RELYING ON THESE
// ─────────────────────────────────────────────────────────────────────────────
// The backend 3CX adapter does not exist yet, so every operationName, inputType,
// and the root namespace below is the FE's *proposal*, modeled on the 3CX Call
// Control API operations the capability matrix lists (make call, answer, hold,
// resume, transfer, terminate) plus the agent-state command contract, and —
// for the four monitoring mutations — the supervisor call-control command
// contract. Only these names may change at sign-off — see
// `docs/Make-Call-Command-Contract.md` (Q2 covers the makeCall response
// shape), `docs/Agent-State-Command-Contract.md`,
// `docs/Supervisor-Call-Control-Command-Contract.md` (Q-S1 covers the
// monitoring paths), and `docs/3CX-Integration-Capability-Matrix.md` §3.2 +
// Decision 3/4.
//
// Until the BFF ships these operations, a call through one of these mappings
// fails at the BFF (unknown operation) in any `VITE_USE_GRAPHQL === "true"`
// environment — the hybrid base query has no REST fallback. `callControlApi.ts`
// documents the same precondition in its banner.
//
// Notes on shape, per the conventions in the sibling *Queries.ts files:
//   - Method-keyed `{ POST: ... }` entries (never bare — a bare config would
//     satisfy matchUrl's definesMethod guard for every method; see the warning
//     in areaQueries.ts).
//   - Command mutations that return no data use the standard `status msg data
//     desc` envelope fields; makeCall additionally returns the new leg's
//     `callId` in the envelope's `data` (contract §3.2, shape proposed).
//   - The `:callId` path placeholder lands in `input.callId` via the mapper's
//     pathParams merge. The matching REST mutations carry an explicit
//     `body: { callId }` because buildGraphQLQuery bails out on a POST
//     mutation with no body (hard error, no REST fallback) — see
//     `callControlApi.ts` and the area.ts precedent.
//   - `root: "CallControl"` is a placeholder namespace; per matrix Decision 4
//     the BFF hides 3CX-specific naming, hence `TerminateCall` (FE surface
//     vocabulary), not 3CX's `DropCall`.
const MAKE_CALL_MUTATION = {
  operationName: "MakeCall",
  root: "CallControl",
  inputType: "MakeCallInput!",
  fields: `status msg data { callId } desc`,
  mutation: true,
};

const ANSWER_CALL_MUTATION = {
  operationName: "AnswerCall",
  root: "CallControl",
  inputType: "AnswerCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const HOLD_CALL_MUTATION = {
  operationName: "HoldCall",
  root: "CallControl",
  inputType: "HoldCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const RESUME_CALL_MUTATION = {
  operationName: "ResumeCall",
  root: "CallControl",
  inputType: "ResumeCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const TRANSFER_CALL_MUTATION = {
  operationName: "TransferCall",
  root: "CallControl",
  inputType: "TransferCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const TERMINATE_CALL_MUTATION = {
  operationName: "TerminateCall",
  root: "CallControl",
  inputType: "TerminateCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const SET_AGENT_STATE_MUTATION = {
  operationName: "SetAgentState",
  root: "CallControl",
  inputType: "SetAgentStateInput!",
  fields: `status msg data desc`,
  mutation: true,
};

// Supervisor monitoring commands — placeholders pending
// docs/Supervisor-Call-Control-Command-Contract.md sign-off (its Q-S1
// confirms/corrects the paths; operation names may change with them).
const LISTEN_CALL_MUTATION = {
  operationName: "ListenCall",
  root: "CallControl",
  inputType: "ListenCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const WHISPER_CALL_MUTATION = {
  operationName: "WhisperCall",
  root: "CallControl",
  inputType: "WhisperCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const BARGE_IN_CALL_MUTATION = {
  operationName: "BargeInCall",
  root: "CallControl",
  inputType: "BargeInCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const STOP_MONITOR_CALL_MUTATION = {
  operationName: "StopMonitorCall",
  root: "CallControl",
  inputType: "StopMonitorCallInput!",
  fields: `status msg data desc`,
  mutation: true,
};

export const GQL_CALL_CONTROL = {
  "/call-control/calls": { POST: MAKE_CALL_MUTATION },
  "/call-control/calls/:callId/answer": { POST: ANSWER_CALL_MUTATION },
  "/call-control/calls/:callId/hold": { POST: HOLD_CALL_MUTATION },
  "/call-control/calls/:callId/resume": { POST: RESUME_CALL_MUTATION },
  "/call-control/calls/:callId/transfer": { POST: TRANSFER_CALL_MUTATION },
  "/call-control/calls/:callId/terminate": { POST: TERMINATE_CALL_MUTATION },
  "/call-control/agent-state": { POST: SET_AGENT_STATE_MUTATION },
  "/call-control/calls/:callId/listen": { POST: LISTEN_CALL_MUTATION },
  "/call-control/calls/:callId/whisper": { POST: WHISPER_CALL_MUTATION },
  "/call-control/calls/:callId/barge-in": { POST: BARGE_IN_CALL_MUTATION },
  "/call-control/calls/:callId/stop-monitor": { POST: STOP_MONITOR_CALL_MUTATION },
};
