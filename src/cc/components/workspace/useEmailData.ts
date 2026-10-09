// Data facade for the email workspace (`/cc/email`) — FE-10.
//
// Pattern follows `useCallCenterDashboard`
// (src/cc/components/dashboard/useCallCenterDashboard.ts):
// behind this facade sits either the real BFF endpoint (`emailApi`) or the
// static fixture under `VITE_MOCK_API`, selected by DEV_CONFIG.MOCK_API.
// The page's code is identical either way.
//
// The RTK Query hooks are always *called* (hook order must stay stable) but
// `skip`ped in mock mode. Every payload — fixture or API — passes through the
// same extractor, because a resolved response can still carry a
// truthy-but-unusable payload (`normalizeToApiResponse` coerces absent `data`
// to `[]` and `Boolean([]) === true`).
import { useMemo } from "react";
import { DEV_CONFIG } from "@/core/utils/constants";
import {
  useReadEmailInboxQuery,
  useReadEmailDetailQuery,
} from "@/cc/store/api/emailApi";
import {
  extractEmailInbox,
  extractEmailMessage,
  type EmailInboxItem,
  type EmailMessage,
  type EmailTab,
} from "@/cc/types/email";
import {
  emailInboxFixture,
  emailDetailsFixture,
} from "@/cc/mocks/emailFixture";

/** Coarse UI state derived by {@link useEmailData}. */
export type EmailDataStatus = "loading" | "ready" | "empty" | "invalid" | "error";

export interface UseEmailDataResult {
  /** Inbox thread list when status is "ready" or "empty"; null otherwise. */
  threads: EmailInboxItem[] | null;
  /** Full message for the selected id when available; null otherwise. */
  message: EmailMessage | null;
  status: EmailDataStatus;
  /** Background refetch in flight (non-mock mode only). */
  isFetching: boolean;
  /** True while running against the VITE_MOCK_API fixture. */
  isMock: boolean;
  /** Re-run the request (no-op that resolves immediately in mock mode). */
  refetch: () => void;
}

/**
 * Loads the email inbox for `folder` and optional `search`, plus the detail
 * for `selectedId`. Discriminates the non-happy outcomes the UI renders
 * distinctly (loading / empty-but-valid / resolved-but-malformed / failed),
 * so the page never has to inspect the raw envelope.
 */
export function useEmailData(
  folder: EmailTab,
  search: string,
  selectedId: string | null
): UseEmailDataResult {
  const isMock = DEV_CONFIG.MOCK_API;

  const {
    data: inboxResponse,
    isLoading: inboxLoading,
    isFetching: inboxFetching,
    isError: inboxError,
    refetch: inboxRefetch,
  } = useReadEmailInboxQuery(
    { folder, search: search || undefined },
    { skip: isMock }
  );

  const {
    data: detailResponse,
    isLoading: detailLoading,
    isFetching: detailFetching,
    isError: detailError,
    refetch: detailRefetch,
  } = useReadEmailDetailQuery(selectedId ?? "", {
    skip: isMock || selectedId === null,
  });

  // Fixture payloads are run through the same extractors as real API data so
  // a malformed fixture fails loudly in dev instead of poisoning the demo.
  const mockInbox = useMemo(
    () => extractEmailInbox({ data: emailInboxFixture }),
    []
  );

  const mockMessage = useMemo(() => {
    if (selectedId === null) return null;
    const candidate = emailDetailsFixture[selectedId];
    return candidate ?? null;
  }, [selectedId]);

  return useMemo<UseEmailDataResult>(() => {
    if (isMock) {
      return {
        threads: mockInbox?.threads ?? null,
        message: mockMessage,
        status: mockInbox === null ? "invalid" : "ready",
        isFetching: false,
        isMock: true,
        refetch: () => undefined,
      };
    }

    const inbox =
      inboxResponse === undefined ? null : extractEmailInbox(inboxResponse);
    const message =
      detailResponse === undefined ? null : extractEmailMessage(detailResponse);

    const isLoading = inboxLoading || (selectedId !== null && detailLoading);
    const isError = inboxError || (selectedId !== null && detailError);
    const isEmpty = inbox !== null && inbox.threads.length === 0;

    const status: EmailDataStatus = isLoading
      ? "loading"
      : isError
        ? "error"
        : inbox === null
          ? "invalid"
          : isEmpty
            ? "empty"
            : "ready";

    return {
      threads: inbox?.threads ?? null,
      message,
      status,
      isFetching: inboxFetching || detailFetching,
      isMock: false,
      refetch: () => {
        void inboxRefetch();
        if (selectedId !== null) {
          void detailRefetch();
        }
      },
    };
  }, [
    isMock,
    mockInbox,
    mockMessage,
    inboxResponse,
    detailResponse,
    inboxLoading,
    detailLoading,
    inboxError,
    detailError,
    inboxFetching,
    detailFetching,
    selectedId,
    inboxRefetch,
    detailRefetch,
  ]);
}
