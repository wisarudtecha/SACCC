import React, { useCallback, useEffect, useRef, useState } from "react";
import { MentionAutocomplete } from "./MentionAutocomplete";
import type { MentionUser } from "./types";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Fired when the user picks someone from the mention autocomplete. */
  onMentionSelect?: (user: MentionUser) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const INACTIVE_MENTION_STATE = {
  active: false,
  query: "",
  startIndex: -1,
} as const;

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onMentionSelect,
  placeholder,
  disabled,
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionState, setMentionState] = useState<{
    active: boolean;
    query: string;
    startIndex: number;
  }>({ active: false, query: "", startIndex: -1 });
  // Whether the autocomplete popover currently shows results (or is loading).
  // Only then are Arrow/Enter handed to it; otherwise keys reach the composer.
  const [popoverVisible, setPopoverVisible] = useState(false);

  // A cleared value (e.g. after submitting the comment) must also dismiss any
  // still-open mention popover — the mention context no longer exists.
  useEffect(() => {
    if (!value && mentionState.active) {
      setMentionState(INACTIVE_MENTION_STATE);
    }
  }, [value, mentionState.active]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart ?? 0;
      onChange(newValue);

      // Detect if we're in a mention context
      const textBeforeCursor = newValue.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Only an "@" that starts the text or follows whitespace opens the
        // autocomplete — the "@" of an email address must not trigger it.
        const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : "";
        const isMentionTrigger =
          lastAtIndex === 0 || /\s/.test(charBeforeAt);
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Mention query is valid if no whitespace between @ and cursor
        if (isMentionTrigger && !/\s/.test(textAfterAt)) {
          setMentionState({
            active: true,
            query: textAfterAt,
            startIndex: lastAtIndex,
          });
          return;
        }
      }

      setMentionState(INACTIVE_MENTION_STATE);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (user: MentionUser) => {
      if (!textareaRef.current) return;
      const { startIndex } = mentionState;
      const before = value.slice(0, startIndex);
      const after = value.slice(textareaRef.current.selectionStart);
      const newValue = `${before}@${user.username} ${after}`;
      onChange(newValue);
      setMentionState(INACTIVE_MENTION_STATE);
      onMentionSelect?.(user);

      // Restore focus and place cursor after the inserted mention
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = startIndex + user.username.length + 2; // +2 for @ and space
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [mentionState, value, onChange, onMentionSelect]
  );

  const handleKeyDownWrapped = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionState.active) {
        // Escape always dismisses the open mention context — it must never
        // reach the composer or clear the draft.
        if (event.key === "Escape") {
          setMentionState(INACTIVE_MENTION_STATE);
          return;
        }
        // While the popover shows (loading) results, ArrowUp/Down/Enter
        // belong to the autocomplete, not the composer: Enter selects the
        // highlighted user instead of submitting the comment.
        if (
          popoverVisible &&
          ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)
        ) {
          return;
        }
      }
      onKeyDown?.(event);
    },
    [mentionState.active, popoverVisible, onKeyDown]
  );

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDownWrapped}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className={`w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      />
      <div className="absolute left-0 right-0 top-full">
        <MentionAutocomplete
          query={mentionState.query}
          enabled={mentionState.active}
          onSelect={handleSelect}
          onClose={() => setMentionState(INACTIVE_MENTION_STATE)}
          onVisibilityChange={setPopoverVisible}
        />
      </div>
    </div>
  );
};
