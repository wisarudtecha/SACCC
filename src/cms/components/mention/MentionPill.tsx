import React from "react";

interface MentionPillProps {
  username: string;
  /** Optional avatar URL — rendered as a 16px thumb when available. */
  photo?: string;
  /** Receives the originating mouse/keyboard event so the caller can anchor a popover. */
  onClick?: (username: string, event: React.SyntheticEvent<HTMLSpanElement>) => void;
}

export const MentionPill: React.FC<MentionPillProps> = ({ username, photo, onClick }) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
      onClick={(e) => onClick?.(username, e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(username, e);
        }
      }}
    >
      {photo && (
        <img
          src={photo}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      @{username}
    </span>
  );
};
