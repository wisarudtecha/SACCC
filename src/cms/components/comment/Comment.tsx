// Comment.tsx (Updated)

import Button from "@/core/components/ui/button/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaseHistory, useGetCaseHistoryQuery } from "@/cms/store/api/caseApi";
import { usePostAddCaseHistoryMutation } from "@/cms/store/api/caseApi";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { formatDate } from "@/core/utils/crud";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
    MentionInput,
    MentionPill,
    MentionUserPopover,
    parseMentionSegments,
    // extractMentionUserIds,
} from "@/cms/components/mention";
import type { MentionUser } from "@/cms/components/mention";
import type { UserProfile } from "@/core/types/user";
// import { Pencil } from "lucide-react";


interface CommentsProps {
    isOpen: boolean;
    caseId: string;
    currentUsername?: string;
    isModal?: boolean;
    /** Mention deep-link target (case history id as string): scroll to it. */
    highlightCommentId?: string;
}

export const Comments: React.FC<CommentsProps> = ({
    isOpen,
    caseId,
    isModal = false,
    highlightCommentId,
}) => {
    const [newCommentMessage, setNewCommentMessage] = useState<string>('');
    const commentsContainerRef = useRef<HTMLDivElement>(null);
    const [commentsData, setCommentsData] = useState<CaseHistory[]>([]);
    // Mention deep-link: the comment currently flashed with a highlight, and
    // the target already handled (so late comment appends don't re-flash).
    const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
    const highlightDoneRef = useRef<string | null>(null);
    // username -> user id, accumulated from autocomplete selections so the
    // submitted mentionedUserIds carry ids (not raw usernames). Hand-typed
    // handles without a selection are dropped (no id to send).
    // const [mentionIdMap, setMentionIdMap] = useState<Map<string, string>>(new Map());
    // username -> resolved user profile, cached after a popover lookup so
    // pills can render the mentioned user's avatar.
    const [resolvedUsers, setResolvedUsers] = useState<Record<string, UserProfile>>({});
    // The mention pill the detail popover is currently anchored to.
    const [activeMention, setActiveMention] = useState<{ username: string; rect: DOMRect } | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = JSON.parse(localStorage.getItem("profile") ?? "{}") as any;
    const { data: fetchedComments, isLoading: isFetchingComments, error: fetchError } = useGetCaseHistoryQuery(
        { caseId },
        {
            refetchOnMountOrArgChange: true,
            skip: !isOpen
        }
    );
    const { onMessage, isConnected, connectionState, websocket } = useWebSocket()
    const [addCaseHistory, { isLoading: isAddingComment, error: addCommentError }] = usePostAddCaseHistoryMutation();
    const { t } = useTranslation();
    useEffect(() => {
        const listener = onMessage((message) => {
            try {
                switch (message?.data?.EVENT) {
                    case "CASE-HISTORY": {
                        const data = message.data;
                        // "hidden" events (e.g. internal comments) must not flash
                        // into the visible feed; the refetched history remains the
                        // source of truth for what is actually visible.
                        if (
                            data?.additionalJson?.type === "comment" &&
                            data?.eventType !== "hidden" &&
                            caseId === data?.additionalJson?.caseId
                        ) {
                            const optimisticComment: CaseHistory = {
                                id: Date.now(),
                                orgId: data.additionalJson.orgId || "",
                                caseId: data?.additionalJson?.caseId,
                                username: data?.additionalJson?.username,
                                type: "comment",
                                fullMsg: data?.additionalJson?.fullMsg,
                                jsonData: "",
                                createdAt: data?.additionalJson?.createdAt,
                                createdBy: data?.additionalJson?.username,
                            };
                            setCommentsData((prevComments) => [...prevComments, optimisticComment]);
                        }
                        break;
                    }

                    case "CASE-STATUS-UPDATE": {
                        const data = message.data;
                        if (data?.additionalJson?.caseId === caseId) {
                            const optimisticComment: CaseHistory = {
                                id: Date.now(),
                                // Live CASE-STATUS-UPDATE payloads put the org in
                                // additionalJson.orgId; older ones carried data.org.
                                orgId: data?.additionalJson?.orgId || data?.org || "",
                                caseId: data?.additionalJson?.caseId,
                                username: data?.createdBy,
                                type: "comment",
                                fullMsg: data?.additionalJson?.ms_alert,
                                jsonData: "",
                                createdAt: data?.createdAt,
                                createdBy: data?.createdBy,
                            };
                            setCommentsData((prevComments) => [...prevComments, optimisticComment]);
                        }
                        break;
                    }

                    default:
                        break;
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        });

        return () => {
            listener();
        };
    }, [onMessage, websocket, caseId, connectionState, isConnected]);

    useEffect(() => {
        if (fetchedComments?.data) {
            setCommentsData(fetchedComments.data);
        }
    }, [fetchedComments]);

    // Mention deep-link: once the target comment is rendered, scroll it into
    // view inside the feed. Retries as commentsData arrives/grows until found.
    useEffect(() => {
        if (!highlightCommentId || commentsData.length === 0) {
            return;
        }
        if (highlightDoneRef.current === highlightCommentId) {
            return;
        }
        const target = commentsContainerRef.current?.querySelector<HTMLElement>(
            `[data-comment-id="${CSS.escape(highlightCommentId)}"]`
        );
        if (!target) {
            return;
        }
        highlightDoneRef.current = highlightCommentId;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedCommentId(highlightCommentId);
    }, [highlightCommentId, commentsData]);

    // Dismiss the highlight flash after a few seconds.
    useEffect(() => {
        if (!highlightedCommentId) {
            return;
        }
        const timer = setTimeout(() => setHighlightedCommentId(null), 4000);
        return () => clearTimeout(timer);
    }, [highlightedCommentId]);

    const handleMentionSelect = useCallback((user: MentionUser) => {
        if (user.id === undefined || user.id === null) return;
        // setMentionIdMap((prev) => {
        //     if (prev.get(user.username) === String(user.id)) {
        //         return prev;
        //     }
        //     const next = new Map(prev);
        //     next.set(user.username, String(user.id));
        //     return next;
        // });
    }, []);

    const handleMentionResolved = useCallback((username: string, user: UserProfile) => {
        setResolvedUsers((prev) =>
            prev[username]?.id === user.id ? prev : { ...prev, [username]: user }
        );
    }, []);

    const handleNewComment = async () => {
        if (newCommentMessage.trim() === '') {
            return;
        }

        try {
            // const mentionedUserIds = extractMentionUserIds(newCommentMessage.trim(), mentionIdMap);
            const newCommentData = {
                caseId: caseId,
                fullMsg: newCommentMessage.trim(),
                jsonData: "",
                type: "comment",
                username: profile?.username,
                // mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
            };

            await addCaseHistory(newCommentData).unwrap();

            setNewCommentMessage('');

        } catch (err) {
            console.error('Failed to add comment:', err);
        }
    };

    // const handleEditComment = async () => {
    //     if (newCommentMessage.trim() === '') {
    //         return;
    //     }

    //     try {
    //         const newCommentData = {
    //             caseId: caseId,
    //             fullMsg: newCommentMessage.trim(),
    //             jsonData: "",
    //             type: "comment",
    //             username: profile?.username
    //         };

    //         await addCaseHistory(newCommentData).unwrap();

    //         // const optimisticComment: CaseHistory = {
    //         //     id: Date.now(),
    //         //     orgId: commentsData[0]?.orgId || "",
    //         //     caseId: caseId,
    //         //     username: profile?.username,
    //         //     type: "comment",
    //         //     fullMsg: newCommentMessage.trim(),
    //         //     jsonData: "",
    //         //     createdAt: new Date().toISOString(),
    //         //     createdBy: profile?.username
    //         // };
    //         // setCommentsData((prevComments) => [...prevComments, optimisticComment]);

    //         setNewCommentMessage('');

    //     } catch (err) {
    //         console.error('Failed to add comment:', err);
    //     }
    // };

    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, [commentsData]);


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyDownComment = (event: any) => {
        if (event.key === 'Enter') {
            handleNewComment()
        }
    };

    const renderContent = () => {
        if (isFetchingComments) {
            return (
                <div className="flex justify-center items-center h-full text-gray-500">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t("common.loading")}</span>
                </div>
            );
        }

        if (fetchError) {
            return (
                <div className="flex justify-center items-center h-full text-red-500">
                    <p>{t("common.error")}</p>
                </div>
            );
        }

        if (commentsData.length === 0) {
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                        <svg className="mx-auto h-8 w-8 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No comment history available</p>
                    </div>
                </div>
            );
        }

        return commentsData.map((comment: CaseHistory) => (
            <div
                key={comment.id}
                data-comment-id={String(comment.id)}
                className={`p-4 border transition-colors duration-150 ${highlightedCommentId === String(comment.id) ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'} ${isModal ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">{comment.createdBy}</p>
                    <div className="flex space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                            {formatDate(new Date(new Date(comment.createdAt).getTime()))}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-2 justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap ml-2">
                        {parseMentionSegments(comment.fullMsg).map((segment, idx) =>
                            segment.type === "mention" ? (
                                <MentionPill
                                    key={idx}
                                    username={segment.username}
                                    photo={resolvedUsers[segment.username]?.photo ?? undefined}
                                    onClick={(username, event) =>
                                        setActiveMention({
                                            username,
                                            rect: event.currentTarget.getBoundingClientRect(),
                                        })
                                    }
                                />
                            ) : (
                                <span key={idx}>{segment.content}</span>
                            )
                        )}
                    </p>
                    {/* <Pencil className="w-4 text-xs text-gray-500 dark:text-gray-400" onClick={handleEditComment}/> */}
                </div>
            </div>
        ));
    };

    return (
        <div className={isModal ? "h-full flex flex-col" : ""}>
            <div
                className={`bg-gray-100 dark:bg-gray-800 my-2 rounded-lg overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 shadow-inner ${isModal ? 'flex-1 min-h-0' : ''
                    }`}
                style={isModal ? {} : { height: '10em' }}
                ref={commentsContainerRef}
            >
                {renderContent()}
            </div>

            {addCommentError && (
                <div className="text-red-500 text-sm mb-2">
                    {t("case.sop_card.fail_send_activity")}
                </div>
            )}

            <div className={`flex gap-3 ${isModal ? 'mt-4' : 'mt-3'}`}>
                <div className="flex-1">
                    <MentionInput
                        placeholder={t("case.sop_card.comment") + "..."}
                        value={newCommentMessage}
                        onChange={setNewCommentMessage}
                        onKeyDown={handleKeyDownComment}
                        onMentionSelect={handleMentionSelect}
                        disabled={isAddingComment}
                    />
                </div>
                <Button
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline-no-transparent"
                    onClick={handleNewComment}
                    disabled={newCommentMessage.trim() === '' || isAddingComment}
                >
                    <div className="flex text-gray-600 dark:text-gray-300">
                        <svg
                            className="w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                        <span>{t("case.sop_card.send_activity")}</span>
                    </div>
                </Button>
            </div>

            <MentionUserPopover
                username={activeMention?.username ?? null}
                anchorRect={activeMention?.rect ?? null}
                onClose={() => setActiveMention(null)}
                onResolved={handleMentionResolved}
            />
        </div>
    );
};