// src/cc/store/api/graphql/emailQueries.ts
//
// GraphQL mappings for the email workspace API (FE-10).
// REST endpoints live in `src/cc/store/api/emailApi.ts`.
//
// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDERS PENDING BFF SIGN-OFF — READ BEFORE RELYING ON THESE
// ─────────────────────────────────────────────────────────────────────────────
// The backend email integration adapter does not exist yet (backend task BE-09).
// Every operationName, inputType, and the root namespace below is the FE's
// *proposal* pending backend sign-off.
//
// Until the BFF ships these operations, a call through one of these mappings
// fails at the BFF (unknown operation) in any `VITE_USE_GRAPHQL === "true"`
// environment — the hybrid base query has no REST fallback. `emailApi.ts`
// documents the same precondition in its banner.
//
// Notes on shape, per the conventions in the sibling *Queries.ts files:
//   - Method-keyed `{ GET: ... }` / `{ POST: ... }` entries (never bare).
//   - The `:id` path placeholder lands in `input.id` via the mapper's
//     pathParams merge.
//   - Standard envelope fields are `status msg data desc`.

const READ_EMAIL_INBOX_QUERY = {
  operationName: "ReadEmailInbox",
  root: "Email",
  inputType: "ReadEmailInboxInput!",
  fields: `status msg data { threads { id from fromName subject preview time unread folder attachmentCount } } desc`,
  mutation: false,
};

const READ_EMAIL_DETAIL_QUERY = {
  operationName: "ReadEmailDetail",
  root: "Email",
  inputType: "ReadEmailDetailInput!",
  fields: `status msg data { id from fromName to cc bcc subject body time unread folder attachments { id filename url size mimeType } } desc`,
  mutation: false,
};

const SEND_EMAIL_REPLY_MUTATION = {
  operationName: "SendEmailReply",
  root: "Email",
  inputType: "SendEmailReplyInput!",
  fields: `status msg data desc`,
  mutation: true,
};

const GENERATE_AI_SUGGESTION_MUTATION = {
  operationName: "GenerateAiSuggestion",
  root: "Email",
  inputType: "GenerateAiSuggestionInput!",
  fields: `status msg data { text tool } desc`,
  mutation: true,
};

export const GQL_EMAIL = {
  "/email/inbox": { GET: READ_EMAIL_INBOX_QUERY },
  "/email/:id": { GET: READ_EMAIL_DETAIL_QUERY },
  "/email/:id/reply": { POST: SEND_EMAIL_REPLY_MUTATION },
  "/email/ai-suggest": { POST: GENERATE_AI_SUGGESTION_MUTATION },
};
