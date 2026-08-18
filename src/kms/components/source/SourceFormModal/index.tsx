import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiDatabase } from "react-icons/fi";

import { Modal } from "@/kms/components/shared/Modal";
import type {
  SourceItem,
  SourceMutationInput,
} from "@/kms/source/dtos/source.dto";

interface SourceFormModalProps {
  isOpen: boolean;
  item: SourceItem | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: SourceMutationInput) => Promise<void> | void;
}

interface FormState {
  name_th: string;
  name_en: string;
  seq: string;
}

const emptyFormState: FormState = {
  name_th: "",
  name_en: "",
  seq: "1",
};

const SourceFormModal = ({
  isOpen,
  item,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: SourceFormModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!item) {
      setForm(emptyFormState);
      setValidationError(null);
      return;
    }
    setForm({
      name_th: item.name_th,
      name_en: item.name_en,
      seq: String(item.seq),
    });
    setValidationError(null);
  }, [isOpen, item]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    const trimmedTh = form.name_th.trim();
    if (!trimmedTh) {
      setValidationError(t("knowledge.source.form.validationNameTh"));
      return;
    }
    const trimmedEn = form.name_en.trim();
    if (!trimmedEn) {
      setValidationError(t("knowledge.source.form.validationNameEn"));
      return;
    }
    const seq = Number(form.seq);
    if (!Number.isFinite(seq) || seq < 1) {
      setValidationError(t("knowledge.source.form.validationSeq"));
      return;
    }
    await onSubmit({ name_th: trimmedTh, name_en: trimmedEn, seq });
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/10";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 max-w-[560px] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-[0_32px_96px_-32px_rgba(15,23,42,0.5)] dark:border-white/[0.08] dark:bg-slate-900"
    >
      <div className="h-1 w-full bg-[linear-gradient(90deg,#38bdf8_0%,#818cf8_50%,#34d399_100%)]" />

      <div className="flex items-start gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-600 dark:border-sky-500/20 dark:from-sky-500/20 dark:to-indigo-500/15 dark:text-sky-300">
          <FiDatabase className="text-xl" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {t("knowledge.source.page.title")}
          </p>
          <h5 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {item ? t("knowledge.source.form.editTitle") : t("knowledge.source.form.createTitle")}
          </h5>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("knowledge.source.form.description")}
          </p>
        </div>
      </div>

      <div className="mx-6 border-t border-slate-100 dark:border-white/[0.06] sm:mx-7" />

      <div className="grid gap-4 px-6 py-5 sm:px-7 sm:py-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("knowledge.source.form.nameTh")}
          </label>
          <input
            type="text"
            value={form.name_th}
            onChange={(e) => handleChange("name_th", e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("knowledge.source.form.nameEn")}
          </label>
          <input
            type="text"
            value={form.name_en}
            onChange={(e) => handleChange("name_en", e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("knowledge.source.form.seq")}
          </label>
          <input
            type="number"
            min={1}
            value={form.seq}
            onChange={(e) => handleChange("seq", e.target.value)}
            className={inputCls}
          />
        </div>

        {(validationError ?? errorMessage) ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{validationError ?? errorMessage}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-6 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-end sm:px-7">
        <button
          onClick={onClose}
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t("knowledge.source.buttons.cancel")}
        </button>
        <button
          onClick={() => { void handleSubmit(); }}
          type="button"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(14,165,233,0.7)] transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          {isSubmitting
            ? t("knowledge.source.buttons.saving")
            : item
              ? t("knowledge.source.buttons.update")
              : t("knowledge.source.buttons.create")}
        </button>
      </div>
    </Modal>
  );
};

export default SourceFormModal;
