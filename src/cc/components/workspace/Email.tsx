// src/cc/components/workspace/Email.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useEmailData } from "./useEmailData";
import EmailInboxPanel from "./EmailInboxPanel";
import EmailReadingPane from "./EmailReadingPane";
import EmailAiCopilot from "./EmailAiCopilot";
import {
  useSendEmailReplyMutation,
  useMarkEmailReadMutation,
  useStarEmailMutation,
  useArchiveEmailMutation,
  useTrashEmailMutation,
  useGenerateAiSuggestionMutation,
} from "@/cc/store/api/emailApi";
import { aiSuggestionsFixture } from "@/cc/mocks/emailFixture";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EmailTab, AiSuggestion, EmailInboxItem, EmailMessage } from "@/cc/types/email";

/** Local mutations applied on top of fixture/API data in mock mode. */
type ThreadOverride = Partial<EmailInboxItem> & { trashed?: boolean };

const Email = () => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();

  const [searchParams] = useSearchParams();
  const composeTo = searchParams.get("to") || undefined;
  const composeMode = searchParams.get("compose") === "1";

  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [activeTab, setActiveTab] = useState<EmailTab>("inbox");
  const [search, setSearch] = useState("");
  const [generatedSuggestions, setGeneratedSuggestions] = useState<
    Record<string, AiSuggestion[]>
  >({});

  // Reply composer state (lifted from EmailReadingPane so EmailAiCopilot can populate it)
  const [replyBody, setReplyBody] = useState("");
  const [showReply, setShowReply] = useState(composeMode);

  // Mock-mode local overrides so star/archive/trash/read work without a backend
  const [threadOverrides, setThreadOverrides] = useState<
    Record<string, ThreadOverride>
  >({});

  // Simulated incoming emails (dev/mock mode only)
  const [simulatedThreads, setSimulatedThreads] = useState<EmailInboxItem[]>([]);
  const [simulatedMessages, setSimulatedMessages] = useState<Record<string, EmailMessage>>({});

  const { threads, message, isMock } = useEmailData(
    activeTab,
    search,
    selectedId
  );

  const [sendEmailReply, { isLoading: isSendingReply }] =
    useSendEmailReplyMutation();
  const [markEmailRead] = useMarkEmailReadMutation();
  const [starEmail] = useStarEmailMutation();
  const [archiveEmail] = useArchiveEmailMutation();
  const [trashEmail] = useTrashEmailMutation();
  const [generateAiSuggestion, { isLoading: isGenerating }] =
    useGenerateAiSuggestionMutation();

  // Derive suggestions for the selected email
  const suggestions = useMemo(() => {
    if (isMock && selectedId) {
      return aiSuggestionsFixture[selectedId] ?? [];
    }
    return selectedId ? (generatedSuggestions[selectedId] ?? []) : [];
  }, [isMock, selectedId, generatedSuggestions]);

  // Merge mock overrides into the thread list
  const displayedThreads = useMemo(() => {
    if (!threads) return [];
    let result = threads.map((t) => ({ ...t, ...threadOverrides[t.id] }));
    if (isMock) {
      result = result.filter((t) => !threadOverrides[t.id]?.trashed);
      result = result.filter((t) => t.folder === activeTab);
    }
    // Prepend simulated threads (they're already filtered by the generator)
    const simulatedForTab = simulatedThreads.filter((t) => t.folder === activeTab);
    return [...simulatedForTab, ...result];
  }, [threads, activeTab, isMock, threadOverrides, simulatedThreads]);

  // Merge mock overrides into the selected message
  const displayedMessage = useMemo(() => {
    if (selectedId && simulatedMessages[selectedId]) {
      return simulatedMessages[selectedId];
    }
    if (!message) return null;
    const override = selectedId ? threadOverrides[selectedId] : undefined;
    if (override && isMock) {
      return { ...message, ...override };
    }
    return message;
  }, [message, selectedId, threadOverrides, isMock, simulatedMessages]);

  const applyMockOverride = useCallback(
    (id: string, patch: ThreadOverride) => {
      setThreadOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    },
    []
  );

  const handleGenerateAnswer = useCallback(async () => {
    if (!selectedId || !message) return;

    if (isMock) {
      // In mock mode, suggestions come from the fixture directly
      return;
    }

    try {
      const result = await generateAiSuggestion({
        emailId: selectedId,
        context: message.subject,
      }).unwrap();
      if (result.data) {
        const suggestion = result.data;
        setGeneratedSuggestions((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), suggestion],
        }));
      }
    } catch {
      addToast("error", t("cc.email.generateAnswerFailed"));
    }
  }, [isMock, selectedId, message, generateAiSuggestion, addToast, t]);

  const handleSendReply = useCallback(async () => {
    if (!replyBody.trim()) return;

    if (isMock) {
      addToast("success", t("cc.email.replySent"));
      setReplyBody("");
      setShowReply(false);
      if (selectedId) {
        applyMockOverride(selectedId, { unread: false });
      }
      return;
    }

    if (!selectedId || !displayedMessage) return;

    try {
      await sendEmailReply({
        id: selectedId,
        to: [displayedMessage.from],
        subject: `Re: ${displayedMessage.subject}`,
        body: replyBody,
        inReplyTo: displayedMessage.id,
      }).unwrap();
      addToast("success", t("cc.email.replySent"));
      setReplyBody("");
      setShowReply(false);
    } catch {
      addToast("error", t("cc.email.replyFailed"));
    }
  }, [
    isMock,
    selectedId,
    displayedMessage,
    replyBody,
    sendEmailReply,
    addToast,
    t,
    applyMockOverride,
  ]);

  const handleUseSuggestion = useCallback((text: string) => {
    setReplyBody(text);
    setShowReply(true);
  }, []);

  const handleMarkRead = useCallback(
    (id: string) => {
      if (isMock) {
        applyMockOverride(id, { unread: false });
        return;
      }
      void markEmailRead(id);
    },
    [isMock, markEmailRead, applyMockOverride]
  );

  const handleStar = useCallback(
    (id: string, starred: boolean) => {
      if (isMock) {
        applyMockOverride(id, { starred: !starred });
        return;
      }
      void starEmail({ id, starred: !starred });
    },
    [isMock, starEmail, applyMockOverride]
  );

  const handleArchive = useCallback(
    (id: string) => {
      if (isMock) {
        applyMockOverride(id, { folder: "archive" });
        if (selectedId === id) setSelectedId(null);
        return;
      }
      void archiveEmail(id);
    },
    [isMock, archiveEmail, applyMockOverride, selectedId]
  );

  const handleTrash = useCallback(
    (id: string) => {
      if (isMock) {
        applyMockOverride(id, { trashed: true });
        if (selectedId === id) setSelectedId(null);
        return;
      }
      void trashEmail(id);
    },
    [isMock, trashEmail, applyMockOverride, selectedId]
  );

  const handleSimulateIncomingEmail = useCallback(() => {
    const id = `mock-email-${Date.now()}`;
    const now = new Date().toISOString();
    const thread: EmailInboxItem = {
      id,
      from: "demo@example.com",
      fromName: "Demo Customer",
      subject: "Simulated Support Request",
      preview: "This is a simulated incoming email for testing purposes.",
      time: now,
      unread: true,
      folder: "inbox",
      attachmentCount: 0,
      starred: false,
    };
    const msg: EmailMessage = {
      id,
      from: "demo@example.com",
      fromName: "Demo Customer",
      to: ["agent@company.com"],
      cc: [],
      bcc: [],
      subject: "Simulated Support Request",
      body: "This is a simulated incoming email for testing purposes. It was generated by the mock email simulator.",
      time: now,
      unread: true,
      folder: "inbox",
      attachments: [],
      starred: false,
    };
    setSimulatedThreads((prev) => [thread, ...prev]);
    setSimulatedMessages((prev) => ({ ...prev, [id]: msg }));
    setActiveTab("inbox");
    setSelectedId(id);
    addToast("success", "New email received");
  }, [addToast]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      // Auto-mark as read when opening
      const thread = displayedThreads.find((t) => t.id === id);
      if (thread?.unread) {
        handleMarkRead(id);
      }
    },
    [displayedThreads, handleMarkRead]
  );

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-black overflow-hidden">
      {isMock && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSimulateIncomingEmail}
            className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-3 py-1.5 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Simulate Incoming Email
          </button>
        </div>
      )}
      <div className="flex-1 flex h-full overflow-hidden">
        <EmailInboxPanel
          emails={displayedThreads}
          selectedId={selectedId}
          activeTab={activeTab}
          search={search}
          onSelect={handleSelect}
          onTabChange={setActiveTab}
          onSearchChange={setSearch}
        />

        <EmailReadingPane
          message={displayedMessage}
          replyBody={replyBody}
          showReply={showReply}
          isSendingReply={isSendingReply}
          onReplyBodyChange={setReplyBody}
          onShowReplyChange={setShowReply}
          onSendReply={handleSendReply}
          onStar={() =>
            displayedMessage &&
            handleStar(displayedMessage.id, displayedMessage.starred ?? false)
          }
          onArchive={() => displayedMessage && handleArchive(displayedMessage.id)}
          onTrash={() => displayedMessage && handleTrash(displayedMessage.id)}
          composeTo={composeTo}
        />

        <EmailAiCopilot
          suggestions={suggestions}
          onGenerateAnswer={handleGenerateAnswer}
          isGenerating={isGenerating}
          onUseSuggestion={handleUseSuggestion}
        />
      </div>
    </div>
  );
};

export default Email;
