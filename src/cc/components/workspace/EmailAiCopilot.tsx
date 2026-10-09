// src/cc/components/workspace/EmailAiCopilot.tsx
"use client";

import { useState } from "react";
import { Sparkles, BookOpen, Pencil } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { cn } from "@/cc/utils/cn";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AiSuggestion } from "@/cc/types/email";

type CopilotTab = "suggestions" | "aiChat" | "sop";

interface EmailAiCopilotProps {
  suggestions: AiSuggestion[];
  onGenerateAnswer?: () => void;
  isGenerating?: boolean;
  onUseSuggestion?: (text: string) => void;
}

export default function EmailAiCopilot({
  suggestions,
  onGenerateAnswer,
  isGenerating,
  onUseSuggestion,
}: EmailAiCopilotProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CopilotTab>("suggestions");

  const TABS: { id: CopilotTab; label: string; count?: number }[] = [
    {
      id: "suggestions",
      label: t("cc.email.suggestions"),
      count: suggestions.length,
    },
    { id: "aiChat", label: t("cc.email.aiChat") },
    { id: "sop", label: t("cc.email.sop") },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm font-semibold text-black dark:text-white">
            {t("cc.email.aiCopilot")}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <BookOpen className="w-3.5 h-3.5" />
          KB
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "suggestions" && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("cc.email.noSuggestionsYet")}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t("cc.email.generateAnswerHint")}
                </p>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-black dark:text-white leading-relaxed">
                      {suggestion.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => onUseSuggestion?.(suggestion.text)}
                      className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                      aria-label={t("cc.email.useSuggestion")}
                      title={t("cc.email.useSuggestion")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {suggestion.tool && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Tool: {suggestion.tool}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "aiChat" && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("cc.email.aiChat")} coming soon.
            </p>
          </div>
        )}

        {activeTab === "sop" && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("cc.email.sop")} guidelines coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white"
          size="sm"
          onClick={onGenerateAnswer}
          disabled={isGenerating}
          startIcon={<Sparkles className="w-4 h-4" />}
        >
          {isGenerating
            ? `${t("cc.email.generateAnswer")}...`
            : t("cc.email.generateAnswer")}
        </Button>
      </div>
    </div>
  );
}
