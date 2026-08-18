import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiTrash2,
  FiCopy,
  FiDownload,
  FiEdit3,
  FiAlertCircle,
} from "react-icons/fi";
import { getFileCopyUrl } from "../../../files/service/files.service";
import MinioFilePicker from "../ArticleCreateForm/MinioFilePicker";

interface Props {
  coverImage?: string;
  title?: string;
  onCoverImageChange?: (newImagePath: string) => void;
  onImageAction?: (
    action: "delete" | "copy" | "download" | "edit",
    imagePath?: string,
  ) => void;
  isLoading?: boolean;
}

interface ActionState {
  action: "delete" | "copy" | "download" | "edit" | null;
  confirmOpen: boolean;
  loading: boolean;
}

const CoverImageWithActions: React.FC<Props> = ({
  coverImage,
  title = "Article",
  onCoverImageChange,
  onImageAction,
  isLoading = false,
}) => {
  const { t } = useTranslation("articles");
  const [url, setUrl] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({
    action: null,
    confirmOpen: false,
    loading: false,
  });
  const [showMinioModal, setShowMinioModal] = useState(false);
  const [error, setError] = useState("");
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setUrl(null);
    setImgErr(false);
    if (!coverImage) return;
    if (coverImage.startsWith("http")) {
      setUrl(coverImage);
      return;
    }
    getFileCopyUrl(coverImage)
      .then(setUrl)
      .catch(() => setImgErr(true));
  }, [coverImage]);

  const handleActionClick = (
    action: "delete" | "copy" | "download" | "edit",
  ) => {
    setActionState({ action, confirmOpen: true, loading: false });
    setError("");
  };

  const handleConfirmAction = async () => {
    if (!actionState.action) return;

    setActionState((prev) => ({ ...prev, loading: true }));
    setError("");

    try {
      switch (actionState.action) {
        case "delete":
          onImageAction?.(actionState.action, coverImage);
          setActionState({ action: null, confirmOpen: false, loading: false });
          break;

        case "copy":
          if (coverImage && navigator.clipboard) {
            await navigator.clipboard.writeText(coverImage);
            onImageAction?.(actionState.action, coverImage);
            setActionState({
              action: null,
              confirmOpen: false,
              loading: false,
            });
          } else {
            setError(t("coverImage.copyError"));
          }
          break;

        case "download":
          if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = `${title}-cover-${new Date().getTime()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            onImageAction?.(actionState.action, coverImage);
            setActionState({
              action: null,
              confirmOpen: false,
              loading: false,
            });
          } else {
            setError(t("coverImage.downloadError"));
          }
          break;

        default:
          break;
      }
    } catch (err) {
      setError(t("coverImage.actionFailed"));
      setActionState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleMinioConfirm = (items: { name: string; sizeLabel: string; path: string }[]) => {
    if (items.length > 0) {
      const newImagePath = items[0].path;
      onCoverImageChange?.(newImagePath);
      onImageAction?.("edit", newImagePath);
      setShowMinioModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-[24px] bg-slate-100 dark:bg-white/[0.05]" />
    );
  }

  const getActionLabel = (action: string | null): string => {
    switch (action) {
      case "delete":
        return t("coverImage.deleteCoverImage");
      case "copy":
        return t("coverImage.copyPath");
      case "download":
        return t("coverImage.downloadImage");
      default:
        return "";
    }
  };

  const getActionDescription = (action: string | null): string => {
    switch (action) {
      case "delete":
        return t("coverImage.deleteConfirmDescription");
      case "copy":
        return t("coverImage.copyConfirmDescription");
      case "download":
        return t("coverImage.downloadConfirmDescription");
      default:
        return "";
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80">
        {/* Image Container */}
        <div
          className="relative min-h-[240px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 cursor-pointer transition-opacity hover:opacity-80"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={() => setShowMinioModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setShowMinioModal(true);
            }
          }}
        >
          {url && !imgErr ? (
            <>
              <img
                src={url}
                alt={title}
                draggable={false}
                onError={() => setImgErr(true)}
                className="h-full w-full object-cover"
              />
              {hovering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-900">
                    {t("coverImage.clickToEdit")}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <div className="text-center opacity-30">
                <div className="mb-3 text-4xl">🖼️</div>
                <p className="text-sm text-slate-500">{t("coverImage.noCoverImage")}</p>
                {hovering && (
                  <p className="mt-2 text-xs text-slate-400">
                    {t("coverImage.clickToAdd")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Below Image */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 bg-slate-50/50 px-4 py-3 dark:border-white/[0.08] dark:bg-slate-800/30">
          <button
            type="button"
            onClick={() => handleActionClick("delete")}
            disabled={!coverImage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={t("coverImage.deleteCoverImage")}
          >
            <FiTrash2 size={14} /> {t("coverImage.delete")}
          </button>
          <button
            type="button"
            onClick={() => handleActionClick("copy")}
            disabled={!coverImage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={t("coverImage.copyPath")}
          >
            <FiCopy size={14} /> {t("coverImage.copy")}
          </button>
          <button
            type="button"
            onClick={() => handleActionClick("download")}
            disabled={!url}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={t("coverImage.downloadImage")}
          >
            <FiDownload size={14} /> {t("coverImage.download")}
          </button>
          <button
            type="button"
            onClick={() => setShowMinioModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-700"
            title={t("coverImage.editImage")}
          >
            <FiEdit3 size={14} /> {t("coverImage.edit")}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 border-t border-slate-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-white/[0.08] dark:bg-red-500/10 dark:text-red-400">
            <FiAlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {actionState.confirmOpen && actionState.action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-xl dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {getActionLabel(actionState.action)}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {getActionDescription(actionState.action)}
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-200/70 bg-slate-50 px-6 py-4 dark:border-white/[0.08] dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() =>
                  setActionState({
                    action: null,
                    confirmOpen: false,
                    loading: false,
                  })
                }
                disabled={actionState.loading}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t("coverImage.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionState.loading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition ${
                  actionState.action === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {actionState.loading ? t("coverImage.processing") : t("coverImage.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minio File Picker */}
      <MinioFilePicker
        open={showMinioModal}
        selected={coverImage ? [coverImage] : []}
        maxSelect={1}
        accept={["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"]}
        onConfirm={handleMinioConfirm}
        onClose={() => setShowMinioModal(false)}
      />
    </>
  );
};

export default CoverImageWithActions;
