import React, { useState, useEffect } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  FiMessageCircle,
  FiSend,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiHeart,
} from "react-icons/fi";
import { getArticleComments, addComment, addReply, deleteComment, toggleLikeComment } from "@/kms/articles/service/articles.service";
import { formatCount } from "@/kms/common/common.transform.service";
import type { ArticleComment/*,ArticleCommentReply*/ } from "@/kms/articles/dtos/articles.dto";

interface Props {
  articleId: string;
  artId?: number;
  isLoading?: boolean;
  isComment?: boolean;
  isView?: boolean;
  isModeView?:boolean;
}

const ArticleComments: React.FC<Props> = ({ 
  articleId, 
  artId, 
  isLoading = false, 
  isComment = true, 
  isView = true,
  isModeView = true
 }) => {
  const {  t } = useTranslation();
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const data = await getArticleComments(articleId, artId);
        setComments(data);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [articleId, artId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await addComment({
        articleId,
        artId,
        content: newComment,
      });

      if (result.success && result.comment) {
        setComments([result.comment, ...comments]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || !replyingTo) return;

    setSubmitting(true);
    try {
      const result = await addReply({
        articleId,
        artId,
        commentId: replyingTo,
        content: replyText,
      });

      if (result.success && result.reply) {
        setComments(
          comments.map((c) =>
            c.id === replyingTo
              ? {
                ...c,
                replies: [...(c.replies || []), result.reply] as ArticleComment["replies"],
              }
              : c,
          ),
        );
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to add reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const toggleLike = async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;
    const newLiked = !target.likedByMe;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likedByMe: newLiked, likes: newLiked ? c.likes + 1 : c.likes - 1 }
          : c,
      ),
    );
    const res = await toggleLikeComment(commentId, newLiked);
    if (res) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: res.likecount, likedByMe: res.liked } : c,
        ),
      );
    }
  };

  const toggleReplyLikeHandler = async (commentId: string, replyId: string) => {
    const parentComment = comments.find((c) => c.id === commentId);
    const targetReply = parentComment?.replies?.find((r) => r.id === replyId);
    if (!targetReply) return;
    const newLiked = !targetReply.likedByMe;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
            ...c,
            replies: (c.replies || []).map((r) =>
              r.id === replyId
                ? { ...r, likedByMe: newLiked, likes: newLiked ? r.likes + 1 : r.likes - 1 }
                : r,
            ),
          }
          : c,
      ),
    );
    const res = await toggleLikeComment(replyId, newLiked);
    if (res) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
              ...c,
              replies: (c.replies || []).map((r) =>
                r.id === replyId ? { ...r, likes: res.likecount, likedByMe: res.liked } : r,
              ),
            }
            : c,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white p-5 dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
              <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            <FiMessageCircle
              size={16}
              className="text-slate-600 dark:text-slate-300"
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("knowledge.articles.comments.title")} ({comments.length})
          </p>
        </div>
      </div>

      {/* Content */}

      {(isView || isComment) && (
        <div className="p-5 space-y-4">
          {isComment && (
            <div className="space-y-2">
              <textarea
               disabled={isModeView}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("knowledge.articles.comments.writeComment")}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder-slate-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <FiSend size={13} />
                {submitting ? t("knowledge.articles.comments.sending") : t("knowledge.articles.comments.send")}
              </button>
            </div>

          )}


          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-white/[0.06]" />

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <FiMessageCircle size={24} className="opacity-30" />
                <p className="text-xs">{t("knowledge.articles.comments.noComments")}</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        {comment.authorInitials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {comment.author}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {comment.createdAt}
                        </p>
                      </div>
                    </div>

                    {isComment && (
                      <button
                        type="button"
                        onClick={async () => {
                          const { success } = await deleteComment(comment.id);
                          if (success) setComments((prev) => prev.filter((c) => c.id !== comment.id));
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}

                  </div>

                  {/* Comment Content */}
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Comment Footer */}
                  <div className="mt-2.5 flex items-center justify-between">

                    <button
                      disabled={!isComment}
                      onClick={() => toggleLike(comment.id)}
                      className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition"
                    >
                      <FiHeart
                        size={14}
                        className={
                          comment.likedByMe
                            ? "fill-red-500 text-red-500"
                            : ""
                        }
                      />
                      <span className={comment.likedByMe ? "text-red-500" : ""}>
                        ({formatCount(comment.likes)})
                      </span>
                    </button>

                    {isComment && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                      >
                        {t("knowledge.articles.comments.reply")}
                      </button>
                    )}


                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                      >
                        {expandedReplies.has(comment.id) ? (
                          <>
                            <FiChevronUp size={12} />
                            {t("knowledge.articles.comments.hideReplies")}
                          </>
                        ) : (
                          <>
                            <FiChevronDown size={12} />
                            {t("knowledge.articles.comments.viewReplies")}
                          </>
                        )}
                        ({comment.replies.length})
                      </button>

                      {expandedReplies.has(comment.id) && (
                        <div className="mt-2 space-y-2 border-l-2 border-slate-200 pl-2.5 dark:border-white/[0.08]">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="rounded bg-white p-2 dark:bg-white/[0.05]"
                            >
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                  {reply.authorInitials}
                                </div>
                                <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                  {reply.author}
                                </p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500">
                                  {reply.createdAt}
                                </p>
                              </div>
                              <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                {reply.content}
                              </p>
                              <div className="mt-1.5 flex items-center gap-1">
                                <button
                                  onClick={() => toggleReplyLikeHandler(comment.id, reply.id)}
                                  className="flex items-center gap-1 text-[9px] font-medium text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition"
                                >
                                  <FiHeart
                                    size={12}
                                    className={
                                      reply.likedByMe
                                        ? "fill-red-500 text-red-500"
                                        : ""
                                    }
                                  />
                                  <span className={reply.likedByMe ? "text-red-500" : ""}>
                                    ({formatCount(reply.likes)})
                                  </span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Input Section - Inside Comment */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2 rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-3 dark:bg-indigo-500/10">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          {t("knowledge.articles.comments.reply")}{"  ->  "}
                          <span className="text-indigo-600 dark:text-indigo-300">
                            {comment.author}
                          </span>
                        </p>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                        >
                          ✕
                        </button>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("knowledge.articles.comments.writeComment")}
                        rows={2}
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-500/30 dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder-slate-500"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {t("knowledge.articles.comments.cancel") || "ยกเลิก"}
                        </button>
                        <button
                          onClick={handleAddReply}
                          disabled={!replyText.trim() || submitting}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <FiSend size={12} />
                          {submitting ? t("knowledge.articles.comments.sending") : t("knowledge.articles.comments.send")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ArticleComments;
