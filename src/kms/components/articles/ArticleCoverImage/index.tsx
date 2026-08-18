import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiEdit2, FiImage } from "react-icons/fi";
import { getFileCopyUrl } from "@/kms/files/service/files.service";
import MinioFilePicker from "@/kms/components/articles/ArticleCreateForm/MinioFilePicker";
import { GraphQL } from "@/kms/constant";

interface Props {
  coverImage?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  version?: string;
  isLoading?: boolean;
  mode?: "view" | "review";
  articleId?: string;
  actions?: React.ReactNode;
  backLabel?: string;
  editLabel?: string;
  reviewLabel?: string;
  /** show Edit button — default false */
  showEdit?: boolean;
  changeLabel?:string,
  changeTitle?:string,
  notFoundimg?:string,
  /** called when cover image is changed — previewUrl = resolved http URL, minioPath = raw MinIO path for saving */
  onChangeCoverImage?: (previewUrl: string, minioPath: string) => void;
  isUpdate?:boolean;
}

const ArticleCoverImage: React.FC<Props> = ({
  coverImage,
  title = "",
  description,
  category,
  status,
  version,
  isLoading,
  mode = "view",
  articleId,
  actions,
  backLabel = "Back",
  editLabel = "Edit",
  reviewLabel = "พิจารณาบทความ",
  showEdit = false,
  changeLabel="Change",
  changeTitle = "Change cover image",
  notFoundimg="Image not found",
  onChangeCoverImage,
  isUpdate = true
}) => {
  changeTitle = changeTitle || "Change cover image";
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [showMinioModal, setShowMinioModal] = useState(false);

  useEffect(() => {
    setUrl(null);
    setImgErr(false);
    if (!coverImage) return;
    if (coverImage.startsWith("http") || coverImage.startsWith("blob:")) {
      setUrl(coverImage);
      return;
    }
    if (coverImage.startsWith("/")) {
      const origin = new URL(GraphQL.URL).origin;
      setUrl(origin + coverImage);
      return;
    }
    getFileCopyUrl(coverImage)
      .then(setUrl)
      .catch(() => setImgErr(true));
  }, [coverImage]);

  const handleMinioConfirm = async (items: { name: string; sizeLabel: string; path: string }[]) => {
    if (items.length === 0) return;
    const minioPath = items[0].path;
    try {
      const previewUrl = await getFileCopyUrl(minioPath);
      setUrl(previewUrl);
      setImgErr(false);
      onChangeCoverImage?.(previewUrl, minioPath);
    } catch {
      onChangeCoverImage?.(minioPath, minioPath);
    }
    setShowMinioModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-52 animate-pulse rounded-[24px] bg-slate-100 dark:bg-white/[0.05]" />
    );
  }

  return (
    <>
      <div className="relative flex min-h-[200px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-slate-800 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.5)] dark:bg-slate-900">
        {/* Subtle noise/dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Soft glow top-left */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />

        {/* ── Left image ─────────────────────────────────────────────── */}
        <div
          className="relative hidden shrink-0 sm:block"
          style={{ width: 236 }}
        >
          {url && !imgErr ? (
            <img
              src={url}
              alt={title}
              draggable={false}
              onError={() => setImgErr(true)}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <FiImage size={28} className="text-white/20" />
              <span className="text-center text-[10px] font-medium text-white/25">
                {notFoundimg}
              </span>
            </div>
          )}
          {/* Right-side fade so image blends into bg */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-800 to-transparent dark:from-slate-900" />
        </div>

        {/* ── Right content ───────────────────────────────────────────── */}
        <div className="relative flex flex-1 flex-col px-6 py-5">
          {/* Nav row */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.14] hover:text-white"
            >
              <FiArrowLeft size={13} /> {backLabel}
            </button>

            <div className="flex items-center gap-2">
              {/* Change Cover Image button */}
              {(onChangeCoverImage && isUpdate) && (
            
                <button
                  type="button"
                  onClick={() => setShowMinioModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.14] hover:text-white"
                  title={changeLabel}
                >
              
                  <FiImage size={12} /> {changeLabel}
                </button>
              )}
              {mode === "view" && showEdit && articleId && (
                <button
                  type="button"
                  onClick={() => navigate(`/kms/articles/edit/${articleId}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.09] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.16] hover:text-white"
                >
                  <FiEdit2 size={12} /> {editLabel}
                </button>
              )}

              {mode === "review" && (
                <span className="rounded-xl border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                  {reviewLabel}
                </span>
              )}
            </div>
          </div>

          {/* Eyebrow */}
          {category && (
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {category}
            </p>
          )}

          {/* Title */}
          <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p className="mt-2.5 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/55">
              {description}
            </p>
          )}

          {/* Badges */}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            {status && (
              <span className="rounded-full border border-white/15 bg-white/[0.09] px-3 py-1 text-xs font-semibold text-white/80">
                {status}
              </span>
            )}
            {version && (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-xs text-white/55">
                v{version}
              </span>
            )}
            {actions}
          </div>
        </div>
      </div>

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

export default ArticleCoverImage;
