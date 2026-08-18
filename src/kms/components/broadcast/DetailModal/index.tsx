import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import useFirstVisitNotice from "@/kms/hooks/useFirstVisitNotice";
import {
  acceptBroadcastItems,
  getBroadcastPopupList,
} from "@/kms/broadcast/service/broadcast.service";
import SharedDetailModal from "@/kms/components/shared/DetailModal";

import { useTranslation } from "@/core/hooks/useTranslation";

const DetailModal = () => {
  const { t } = useTranslation();

  const popupQuery = useQuery({
    queryKey: ["broadcast-popup-list"],
    queryFn: getBroadcastPopupList,
    staleTime: 1000 * 60 * 5,
  });

  const contentSignature = useMemo(() => {
    const items = popupQuery.data;
    if (!items || items.length === 0) return null;
    return [...items]
      .map((i) => i.broadcastId)
      .sort((a, b) => a - b)
      .join(",");
  }, [popupQuery.data]);

  const notice = useFirstVisitNotice("kb:broadcast:popup-notice", contentSignature);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    const ids = (popupQuery.data ?? []).map((i) => i.broadcastId);
    try {
      await acceptBroadcastItems(ids);
    } catch {
      // accept locally even if API fails
    }
    notice.accept();
    setIsAccepting(false);
  };

  const fallbackData = useMemo(() => {
    const items = popupQuery.data;
    if (!items || items.length === 0) return undefined;
    return {
      title: t("knowledge.broadcast.labels.entryNotice"),
      eyebrow: t("knowledge.broadcast.labels.entryNotice"),
      items: items.map((item) => ({
        label: item.title,
        value: item.description ?? "",
        variant: "content" as const,
      })),
    };
  }, [popupQuery.data, t]);

  return (
    <SharedDetailModal
      isOpen={notice.isOpen}
      onClose={() => undefined}
      resourceId={null}
      queryKey={["broadcast-popup-display"]}
      loadDetail={() => Promise.resolve({ title: "", items: [] })}
      fallbackData={fallbackData}
      loadingText={t("knowledge.broadcast.labels.loadingNotice")}
      errorText={t("knowledge.broadcast.labels.loadNoticeFailed")}
      retryText={t("knowledge.broadcast.buttons.retry")}
      showCloseButton={false}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("knowledge.broadcast.labels.noticeAcknowledgement")}
          </p>
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={isAccepting}
            className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#0284c7_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(2,132,199,0.75)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_48px_-20px_rgba(2,132,199,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAccepting ? t("knowledge.broadcast.buttons.saving") : t("knowledge.broadcast.buttons.accept")}
          </button>
        </div>
      }
    />
  );
};

export default DetailModal;
