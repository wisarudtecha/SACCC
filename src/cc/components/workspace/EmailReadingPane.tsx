// src/cc/components/workspace/EmailReadingPane.tsx
"use client";

import {
  Star,
  Trash2,
  Archive,
  MoreHorizontal,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  FileText,
  Image,
} from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { Avatar, AvatarFallback } from "@/cc/components/ui/Avatar";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { EmailMessage, EmailAttachment } from "@/cc/types/email";

interface EmailReadingPaneProps {
  message: EmailMessage | null;
  replyBody: string;
  showReply: boolean;
  isSendingReply?: boolean;
  onReplyBodyChange: (value: string) => void;
  onShowReplyChange: (value: boolean) => void;
  onSendReply: () => void;
  onStar?: () => void;
  onArchive?: () => void;
  onTrash?: () => void;
  composeTo?: string;
}

function AttachmentCard({ attachment }: { attachment: EmailAttachment }) {
  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[200px]"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        {isImage ? (
          <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : isPdf ? (
          <FileText className="w-5 h-5 text-red-500" />
        ) : (
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-black dark:text-white truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {attachment.mimeType === "application/pdf"
            ? "PDF"
            : attachment.mimeType.split("/")[1]?.toUpperCase() || "File"}{" "}
          &bull; Download
        </p>
      </div>
    </a>
  );
}

export default function EmailReadingPane({
  message,
  replyBody,
  showReply,
  isSendingReply,
  onReplyBodyChange,
  onShowReplyChange,
  onSendReply,
  onStar,
  onArchive,
  onTrash,
  composeTo,
}: EmailReadingPaneProps) {
  const { t } = useTranslation();

  if (!message && !composeTo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t("cc.email.selectEmailToRead")}
        </p>
      </div>
    );
  }

  const initials = message
    ? (message.fromName || message.from).charAt(0).toUpperCase()
    : "?";
  const isStarred = message?.starred ?? false;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black h-full overflow-hidden">
      {/* Sender Header */}
      {message && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-3">
            {message.subject}
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-300 dark:bg-blue-600 text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  {message.fromName || message.from}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {message.from} &bull; {message.time}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onStar}
                className={`p-2 rounded-md transition-colors ${
                  isStarred
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                aria-label={isStarred ? "Unstar" : "Star"}
              >
                <Star
                  className="w-4 h-4"
                  fill={isStarred ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={onArchive}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onTrash}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="More"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose-only header */}
      {!message && composeTo && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            {t("cc.email.newMessage")}
          </h2>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {message && (
            <>
              <div className="text-sm text-black dark:text-white leading-relaxed whitespace-pre-wrap">
                {message.body}
              </div>

              {/* Attachments */}
              {message.attachments.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-black dark:text-white">
                      {message.attachments.length} {t("cc.email.attachments")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {message.attachments.map((att) => (
                      <AttachmentCard key={att.id} attachment={att} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onShowReplyChange(true)}
                >
                  <Reply className="w-4 h-4 mr-1.5" />
                  {t("cc.email.reply")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onShowReplyChange(true)}
                >
                  <ReplyAll className="w-4 h-4 mr-1.5" />
                  {t("cc.email.replyAll")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onShowReplyChange(true)}
                >
                  <Forward className="w-4 h-4 mr-1.5" />
                  {t("cc.email.forward")}
                </Button>
              </div>
            </>
          )}

          {/* Reply / Compose Composer */}
          {showReply && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
                {composeTo ? t("cc.email.newMessage") : t("cc.email.reply")}
              </h3>
              {composeTo && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    To
                  </label>
                  <input
                    type="email"
                    value={composeTo}
                    readOnly
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:outline-none"
                  />
                </div>
              )}
              <textarea
                placeholder={t("cc.email.replyPlaceholder")}
                value={replyBody}
                onChange={(e) => onReplyBodyChange(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 resize-none"
                rows={4}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  size="sm"
                  onClick={onSendReply}
                  disabled={isSendingReply || !replyBody.trim()}
                >
                  {isSendingReply
                    ? t("cc.email.sendingReply")
                    : t("cc.email.sendReply")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                  onClick={() => {
                    onShowReplyChange(false);
                    onReplyBodyChange("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
