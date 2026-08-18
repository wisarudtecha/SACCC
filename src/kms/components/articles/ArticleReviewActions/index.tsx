import React, { useState, useEffect } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  FiCheck,
  // FiMessageSquare,
  // FiThumbsDown,
  FiThumbsUp,
  FiX,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import type { ArticleDetail, ArticleNextStatusEntry } from "@/kms/articles/dtos/articles.dto";

import { useSaveArticleStatus } from "@/kms/articles-create-update/hook/useArticleForm";

type Decision = "approve" | "changes" | "reject" | "draft" | "wait_publish" | "wait_approve" | "wait_publish" | "publish" | "unpublished";

interface Props {
  article?: ArticleDetail | null;
  currentStatus?: string;
  isLoading?: boolean;
  onSubmit?: (data: {
    id: number;
    value: string;
    seq: number;
    action_name_th: string;
    action_name_en: string;
    next_status_id: number;
    comment?: string
  }) => void;
  isChangeStatus?:boolean;
  // onSubmit?: (decision: Decision, note: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  published:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  review:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-slate-400",
  archived:
    "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500",
};

const DECISION_CONFIG: Record<
  Decision,
  {
    icon: React.ReactNode;
    activeRing: string;
    activeBg: string;
    activeText: string;
    hoverBg: string;
    descKey?: string;
  }
> = {

  draft: {
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-emerald-400",
    activeBg:
      "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/40",
    activeText: "text-emerald-700 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-50/60 dark:hover:bg-emerald-500/[0.06]",
    // descKey: "review.approveDesc",
  },
  wait_publish: {
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-emerald-400",
    activeBg:
      "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/40",
    activeText: "text-emerald-700 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-50/60 dark:hover:bg-emerald-500/[0.06]",
    // descKey: "review.approveDesc",
  },
  wait_approve: {
    //icon: <FiMessageSquare size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-amber-400",
    activeBg:
      "bg-amber-50 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/40",
    activeText: "text-amber-700 dark:text-amber-400",
    hoverBg: "hover:bg-amber-50/60 dark:hover:bg-amber-500/[0.06]",
    // descKey: "review.changesDesc",
  },

  publish: {
    //icon: <FiMessageSquare size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-amber-400",
    activeBg:
      "bg-amber-50 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/40",
    activeText: "text-amber-700 dark:text-amber-400",
    hoverBg: "hover:bg-amber-50/60 dark:hover:bg-amber-500/[0.06]",
    // descKey: "review.changesDesc",
  },


  unpublished: {
    //icon: <FiMessageSquare size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-amber-400",
    activeBg:
      "bg-amber-50 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/40",
    activeText: "text-amber-700 dark:text-amber-400",
    hoverBg: "hover:bg-amber-50/60 dark:hover:bg-amber-500/[0.06]",
    //descKey: "review.changesDesc",
  },

  approve: {
    //icon: <FiThumbsUp size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-emerald-400",
    activeBg:
      "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/40",
    activeText: "text-emerald-700 dark:text-emerald-400",
    hoverBg: "hover:bg-emerald-50/60 dark:hover:bg-emerald-500/[0.06]",
    //descKey: "review.approveDesc",
  },
  changes: {
    //icon: <FiMessageSquare size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-amber-400",
    activeBg:
      "bg-amber-50 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/40",
    activeText: "text-amber-700 dark:text-amber-400",
    hoverBg: "hover:bg-amber-50/60 dark:hover:bg-amber-500/[0.06]",
    //descKey: "review.changesDesc",
  },
  reject: {
    //icon: <FiThumbsDown size={15} />,
    icon: <FiThumbsUp size={15} />,
    activeRing: "ring-2 ring-rose-400",
    activeBg:
      "bg-rose-50 border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/40",
    activeText: "text-rose-600 dark:text-rose-400",
    hoverBg: "hover:bg-rose-50/60 dark:hover:bg-rose-500/[0.06]",
    //descKey: "review.rejectDesc",
  },
};







interface FormToast { id: number; tone: "success" | "error"; message: string }
let _toastSeq = 0;
const FormToastStack: React.FC<{ toasts: FormToast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl transition-all ${t.tone === "success"
          ? "border-emerald-200/80 bg-white text-slate-700 dark:border-emerald-500/20 dark:bg-slate-950/95 dark:text-slate-200"
          : "border-rose-200/80 bg-white text-slate-700 dark:border-rose-500/20 dark:bg-slate-950/95 dark:text-slate-200"
          }`}
      >
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-sm ${t.tone === "success"
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
          }`}>
          {t.tone === "success" ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
        </span>
        <span className="text-sm font-medium">{t.message}</span>
        <button onClick={() => onDismiss(t.id)} className="ml-2 mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <FiX size={14} />
        </button>
      </div>
    ))}
  </div>
);




const ArticleReviewActions: React.FC<Props> = ({
  article,
  currentStatus,
  isLoading,
  onSubmit,
  isChangeStatus=true
}) => {
  const { t, language } = useTranslation();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const i18n = { language: language }
  //const [submittext, setSubmitText] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<ArticleNextStatusEntry | null>(null);
  const [toasts, setToasts] = useState<FormToast[]>([]);


  const { mutate, /*isPending, isError, error: mutationError,*/ } = useSaveArticleStatus();
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const addToast = (tone: FormToast["tone"], message: string) => {
    const id = ++_toastSeq;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      setError(t("knowledge.articles.review.selectDecision"));
      return;
    }
    setError("");
    setSubmitting(true);
    //console.log("[ArticleForm] save payload:", JSON.stringify(form, null, 2));
    // if (!form.title.trim()) {
    //   setValidationError(t("form.validation.titleRequired"));
    //   setActiveTab("basic");
    //   return;
    // }
    mutate(
      {
        input: {
          id: article?.articleId ?? 0,
          comment: note,
          status_id: selectedStatus.id
        }
      },
      {
        onSuccess: (/*res*/) => {
          setNote("")
          setDone(true);
          onSubmit?.({
            ...selectedStatus,
            comment: note
          });
          setError("");
          setSubmitting(false);
          setTimeout(() => {
            setDone(false);
          }, 2000);
        },
        onError: (err) => {
          addToast("error", err instanceof Error ? err.message : t("knowledge.articles.form.errorGeneric"));
        },
      },
    );
  };

  useEffect(() => {
    if (!selectedStatus) return;

    // setSubmitText(
    //   i18n.language.startsWith("th")
    //     ? selectedStatus.action_name_th
    //     : selectedStatus.action_name_en
    // );
  }, [i18n.language, selectedStatus]);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="mb-3 h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="my-2.5 h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  const statusKey = currentStatus ?? article?.status ?? "";

  if (!article && !currentStatus) return null;

  if (done) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <FiCheck
            size={22}
            className="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {t("knowledge.articles.review.success")}
        </p>
        {note && (
          <p className="mt-2 text-xs text-emerald-600/70 dark:text-emerald-400/60">
            {note}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("knowledge.articles.review.panel")}
          </p>
          {/* Current status */}
          {statusKey && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.draft}`}
            >
              {t(`knowledge.articles.statusBadge.${statusKey}`)}
            </span>
          )}
        </div>

        <div className="space-y-3 p-4">
          {/* Decision options */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("knowledge.articles.review.decisionLabel")}
          </p>

          {/* {(["approve", "changes", "reject"] as Decision[]).map((d) => { */}

          {/* {(article?.nextstatus?.map((m) => m.value as Decision) as Decision[]).map((d) => { */}
          {article?.nextstatus?.map((m) => {
            const d = m.value as Decision;
            const cfg = DECISION_CONFIG[d];
            const isActive = decision === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setSelectedStatus(m);
                  // const actionNameText =
                  //   i18n.language.startsWith("th")
                  //     ? m.action_name_th
                  //     : m.action_name_en;
                  // setActionName
                 // setSubmitText(actionNameText)
                  setDecision(d);
                  setError("");
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${isActive
                  ? `${cfg.activeBg} ${cfg.activeRing}`
                  : `border-slate-200/70 bg-slate-50/40 dark:border-white/[0.08] dark:bg-white/[0.02] ${cfg.hoverBg}`
                  }`}
              >
                <span
                  className={`shrink-0 ${isActive ? cfg.activeText : "text-slate-400"}`}
                >
                  {cfg.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${isActive ? cfg.activeText : "text-slate-700 dark:text-slate-200"}`}
                  >
                    {t(`knowledge.articles.review.${d}`)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {/* {t(`knowledge.articles.${cfg.descKey}`)} */}
                  </p>
                </div>
                {isActive && (
                  <span
                    className={`ml-auto shrink-0 rounded-full p-0.5 ${cfg.activeBg} ${cfg.activeText}`}
                  >
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Note */}
          <div className="pt-1">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t("knowledge.articles.review.note")}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("knowledge.articles.review.notePlaceholder")}
              className="w-full resize-none rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-500">
              <FiX size={12} /> {error}
            </p>
          )}

          { isChangeStatus && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {
              `${submitting ? t("knowledge.articles.review.submitting") : t("knowledge.articles.review.submit")}`
            }
            {/* {submitting ? t("review.submitting")  : t("review.submit")}  */}
          </button>
          )}

        </div>
      </div>
      <FormToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};





export default ArticleReviewActions;