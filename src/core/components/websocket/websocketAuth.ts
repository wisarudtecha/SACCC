// src/core/components/websocket/websocketAuth.ts
//
// Token carrier for the notifications websocket. DECIDED 2026-11-17.
//
// The access token travels as a plain field on the SUBSCRIBE frame:
//
//   { "EVENT": "SUBSCRIBE", "orgId": "…", "username": "…", "access_token": "<jwt>" }
//
// WHY NOT A REQUEST HEADER
// ---------------------------------------------------------------------------
// The browser API is `new WebSocket(url, protocols)` — no options object and no
// header parameter, so `Authorization: Bearer …` cannot be set on the upgrade the way
// it can on a REST call. The one header value a page can influence is
// `Sec-WebSocket-Protocol`, and that carrier was implemented and verified, then
// dropped the same day: it aborts the whole handshake unless the server echoes the
// protocol back, and the header still cannot be named `Authorization`. A flat field
// on the frame needs no handshake work on the server at all.
//
// The cost of this choice is that the credential is part of the first frame rather
// than the connection request, so the server must (a) read it from the frame, and
// (b) close sockets that never send a valid SUBSCRIBE. Until it does, the socket is
// not authenticated server-side — see docs/backend-dependency-requests.md BDR-10.
//
// Everything here is pure (no DOM, no React) so it can be unit-tested directly.
import { TokenManager } from "@/core/utils/tokenManager";

/**
 * Also attach the token to every other outgoing frame (heartbeat, `DASHBOARD`).
 *
 * Off by default: the server validates the credential once, when the connection
 * registers, so repeating it adds nothing except another place a JWT can be captured
 * in a frame dump. Flip to true only if the backend starts validating per frame.
 */
export const STAMP_EVERY_OUTGOING_FRAME = false;

/** Socket close codes for an authentication failure. Anything else is transient. */
export const WS_CLOSE_UNAUTHORIZED = 4401;
export const WS_CLOSE_FORBIDDEN = 4403;

const AUTH_CLOSE_CODES: readonly number[] = [WS_CLOSE_UNAUTHORIZED, WS_CLOSE_FORBIDDEN];

/**
 * True when the close means "the server rejected this credential" rather than a
 * transient network drop. Callers use it to decide whether to surface a terminal
 * unauthorized state; `nextReconnectAction` uses it to pick the refresh path.
 */
export const isAuthRejectionCode = (closeCode: number): boolean => AUTH_CLOSE_CODES.includes(closeCode);

/**
 * The sanctioned token reader.
 *
 * Never `localStorage.getItem("access_token")` directly: `TokenManager` writes to
 * `sessionStorage` whenever `rememberMe` is false (`tokenManager.ts` line 52) and its
 * `decrypt()` is part of the read path. Reading storage directly reproduces the
 * `UserAuditLog` defect recorded in `changelog.json` — it throws for any session whose
 * token is not in localStorage.
 */
export const getAccessToken = (): string | null => TokenManager.getToken();

/** Whether a refresh is even possible. Used to decide 4401 handling. */
export const hasRefreshToken = (): boolean => Boolean(TokenManager.getRefreshToken());

/**
 * The SUBSCRIBE payload the server authenticates the connection with.
 *
 * The token is a flat `access_token` field (not a nested `headers` object): one key the
 * server reads directly, nothing to unwrap. It is OMITTED entirely when there is no
 * token, so the server sees "no credential" rather than an empty string it might treat
 * as present.
 *
 * Read the token at call time, never once at mount: a refresh may have rotated it.
 */
export const buildRegisterFrame = (
  identity: { orgId?: string; username?: string },
  token: string | null
): Record<string, unknown> => {
  const frame: Record<string, unknown> = {
    EVENT: "SUBSCRIBE",
    orgId: identity.orgId,
    username: identity.username
  };

  if (token) {
    frame.access_token = token;
  }

  return frame;
};

/** Stamps an outgoing frame with the token. Used only when STAMP_EVERY_OUTGOING_FRAME is on. */
export const withAccessToken = (
  payload: Record<string, unknown>,
  token: string | null
): Record<string, unknown> => (token ? { ...payload, access_token: token } : payload);

export type ReconnectAction = "stop" | "retry" | "refresh-and-retry";

export interface ReconnectDecisionInput {
  /** The refresh has already been attempted once for this close. */
  alreadyRefreshed: boolean;
  attempts: number;
  closeCode: number;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  maxAttempts: number;
}

/**
 * What to do after the socket closes.
 *
 * The three "stop" branches exist because retrying cannot change their outcome:
 *   - 1000 is a deliberate close.
 *   - An auth rejection with no refresh token, or a second rejection after one
 *     refresh, means the credential is not going to become valid by waiting.
 *   - With no access token there is nothing to authenticate with.
 */
export const nextReconnectAction = ({
  alreadyRefreshed,
  attempts,
  closeCode,
  hasAccessToken,
  hasRefreshToken,
  maxAttempts
}: ReconnectDecisionInput): ReconnectAction => {
  if (closeCode === 1000) {
    return "stop";
  }

  if (isAuthRejectionCode(closeCode)) {
    // One refresh per auth failure: without this guard a server that keeps
    // rejecting would drive an endless refresh/retry loop.
    return hasRefreshToken && !alreadyRefreshed ? "refresh-and-retry" : "stop";
  }

  if (!hasAccessToken || attempts >= maxAttempts) {
    return "stop";
  }

  return "retry";
};
