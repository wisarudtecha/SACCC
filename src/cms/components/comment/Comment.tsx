// Comment.tsx (Updated)

import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import { useEffect, useRef, useState } from "react";
import { CaseHistory, useGetCaseHistoryQuery } from "@/cms/store/api/caseApi";
import { usePostAddCaseHistoryMutation } from "@/cms/store/api/caseApi";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { formatDate } from "@/core/utils/crud";
import { useTranslation } from "@/core/hooks/useTranslation";
// import { Pencil } from "lucide-react";


interface CommentsProps {
    isOpen: boolean;
    caseId: string;
    currentUsername?: string;
    isModal?: boolean;
}

export const Comments: React.FC<CommentsProps> = ({
    isOpen,
    caseId,
    isModal = false
}) => {
    const [newCommentMessage, setNewCommentMessage] = useState<string>('');
    const commentsContainerRef = useRef<HTMLDivElement>(null);
    const [commentsData, setCommentsData] = useState<CaseHistory[]>([]);
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
                        if (data?.additionalJson?.type === "comment" && caseId === data?.additionalJson?.caseId) {
                            const optimisticComment: CaseHistory = {
                                id: Date.now(),
                                orgId: data.additionalJson.org || "",
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
                                orgId: data.org || "",
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
    }, [onMessage, websocket, connectionState, isConnected]);

    useEffect(() => {
        if (fetchedComments?.data) {
            setCommentsData(fetchedComments.data);
        }
    }, [fetchedComments]);

    const handleNewComment = async () => {
        if (newCommentMessage.trim() === '') {
            return;
        }

        try {
            const newCommentData = {
                caseId: caseId,
                fullMsg: newCommentMessage.trim(),
                jsonData: "",
                type: "comment",
                username: profile?.username
            };

            await addCaseHistory(newCommentData).unwrap();

            // const optimisticComment: CaseHistory = {
            //     id: Date.now(),
            //     orgId: commentsData[0]?.orgId || "",
            //     caseId: caseId,
            //     username: profile?.username,
            //     type: "comment",
            //     fullMsg: newCommentMessage.trim(),
            //     jsonData: "",
            //     createdAt: new Date().toISOString(),
            //     createdBy: profile?.username
            // };
            // setCommentsData((prevComments) => [...prevComments, optimisticComment]);

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
                className={`p-4 border border-gray-200 dark:border-gray-700  transition-colors duration-150 ${isModal ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
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
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap ml-2">{comment.fullMsg}</p>
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
                    <Input
                        placeholder={t("case.sop_card.comment") + "..."}
                        value={newCommentMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCommentMessage(e.target.value)}
                        onKeyDown={handleKeyDownComment}
                        className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
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
        </div>
    );
};