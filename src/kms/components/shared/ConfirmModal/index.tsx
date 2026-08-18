import { Modal } from "antd";
import { FiAlertTriangle } from "react-icons/fi";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={isLoading ? undefined : onCancel}
      footer={null}
      centered
      width={420}
      closable={!isLoading}
      maskClosable={!isLoading}
    >
      <div className="flex flex-col gap-5 py-2">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDanger
                ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400"
                : "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            <FiAlertTriangle className="text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h6 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h6>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? "bg-rose-500 hover:bg-rose-400"
                : "bg-sky-500 hover:bg-sky-400"
            }`}
          >
            {isLoading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
