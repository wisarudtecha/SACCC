import React, { useEffect, useRef, useState } from "react";
import { useMentionSearch } from "./useMentionSearch";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { MentionUser } from "./types";

interface MentionAutocompleteProps {
  query: string;
  enabled: boolean;
  onSelect: (user: MentionUser) => void;
  onClose: () => void;
  /**
   * Reports whether the popover currently shows selectable results (or a
   * loading state). MentionInput uses this to decide whether to hand
   * Arrow/Enter/Escape keys to the autocomplete or let them reach the
   * comment composer.
   */
  onVisibilityChange?: (visible: boolean) => void;
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  query,
  enabled,
  onSelect,
  onClose,
  onVisibilityChange,
}) => {
  const { users, isLoading, isTyping } = useMentionSearch(query, enabled);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Loading and typing rows are not selectable, but Enter must not submit the comment
  // while the popover is visibly fetching or debouncing either.
  const visible = enabled && (isLoading || isTyping || users.length > 0);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [users.length]);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (enabled) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [enabled, onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!enabled || users.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % users.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev === 0 ? users.length - 1 : prev - 1
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        onSelect(users[highlightedIndex]);
      } else if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, users, highlightedIndex, onSelect, onClose]);

  if (!enabled) {
    return null;
  }

  if (!isLoading && !isTyping && users.length === 0) {
    // Informational only — keys are not swallowed in this state, so Enter
    // still submits the comment.
    return (
      <div className="absolute z-50 mt-1 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          {t("case.sop_card.mention_no_results")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
    >
      {isTyping && (
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          {t("case.sop_card.mention_typing")}
        </div>
      )}
      {isLoading && (
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          {t("case.sop_card.mention_loading")}
        </div>
      )}
      {users.map((user, index) => (
        <button
          key={user.username}
          type="button"
          className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
            index === highlightedIndex
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setHighlightedIndex(index)}
        >
          {user.photo ? (
            <img
              src={user.photo}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
              {(user.firstName?.[0] ?? user.username[0]).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">
              {user.displayName ?? (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
