// src/cc/components/workspace/Email.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
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
import type { EmailTab, AiSuggestion, EmailInboxItem } from "@/cc/types/email";

/** Local mutations applied on top of fixture/API data in mock mode. */
type ThreadOverride = Partial<EmailInboxItem> & { trashed?: boolean };

const Email = () => {
  const { t } = useTranslation();
  const { addToast } = useToastContext();

  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [activeTab, setActiveTab] = useState<EmailTab>("inbox");
  const [search, setSearch] = useState("");
  const [generatedSuggestions, setGeneratedSuggestions] = useState<
    Record<string, AiSuggestion[]>
  >({});

  // Reply composer state (lifted from EmailReadingPane so EmailAiCopilot can populate it)
  const [replyBody, setReplyBody] = useState("");
  const [showReply, setShowReply] = useState(false);

  // Mock-mode local overrides so star/archive/trash/read work without a backend
  const [threadOverrides, setThreadOverrides] = useState<
    Record<string, ThreadOverride>
  >({});

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
    return result;
  }, [threads, activeTab, isMock, threadOverrides]);

  // Merge mock overrides into the selected message
  const displayedMessage = useMemo(() => {
    if (!message) return null;
    const override = selectedId ? threadOverrides[selectedId] : undefined;
    if (override && isMock) {
      return { ...message, ...override };
    }
    return message;
  }, [message, selectedId, threadOverrides, isMock]);

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
    if (!selectedId || !displayedMessage || !replyBody.trim()) return;

    if (isMock) {
      addToast("success", t("cc.email.replySent"));
      setReplyBody("");
      setShowReply(false);
      applyMockOverride(selectedId, { unread: false });
      return;
    }

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
    <div className="flex-1 flex h-full dark:bg-black overflow-hidden">
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
      />

      <EmailAiCopilot
        suggestions={suggestions}
        onGenerateAnswer={handleGenerateAnswer}
        isGenerating={isGenerating}
        onUseSuggestion={handleUseSuggestion}
      />
    </div>
  );
};

export default Email;
