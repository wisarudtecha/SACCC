// Extracts a human-readable rejection message from a failed call-control
// command (Supervisor-Call-Control-Command-Contract.md §4.4: business
// rejections answer HTTP 200 with status "-1" and a human-readable `msg`;
// `hybridBaseQuery` converts them to RTK errors whose `data` carries the
// envelope). Pure logic — unit-tested separately.
import type { ApiResponse } from "@/cms/types";

/** The envelope an RTK error carries when a command is business-rejected. */
type CommandErrorEnvelope = { data?: Partial<ApiResponse<unknown>> };

/**
 * Returns the rejection `msg` from a failed command's RTK error, or null
 * when the error carries no readable envelope (transport failure etc.).
 */
export function extractRejectionMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const msg = (error as CommandErrorEnvelope).data?.msg;
  return typeof msg === "string" && msg.trim().length > 0 ? msg : null;
}
