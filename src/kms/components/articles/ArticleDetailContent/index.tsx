import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiExternalLink, FiFilePlus, FiStar, FiX } from "react-icons/fi";
import type { ArticleAttachment } from "@/kms/articles/dtos/articles.dto";
import { extStyle } from "@/kms/components/files/shared/fileUtils";
import { getFileDownloadUrl } from "@/kms/files/service/files.service";
import { getArticleRating, addRating, updateRating } from "@/kms/articles/service/articles.service";
import ArticleComments from "@/kms/components/articles/ArticleComments";

interface Props {
  isLoading: boolean;
  apiContent?: string | null;
  apiAttachments?: ArticleAttachment[];
  artId?: number;
  isComment?: boolean;
  isView?: boolean,
  isUpdate?: boolean,
  onRateSubmit?: () => void;
  isModeView?: boolean,
  rateRang?: number[]
}

const card =
  "overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-sm dark:border-white/[0.08] dark:bg-slate-900/80";
const cardHeader =
  "border-b border-slate-100 px-5 py-3.5 dark:border-white/[0.06]";
const sectionLabel =
  "text-[10px] font-bold uppercase tracking-widest text-slate-400";

const AttachmentCard: React.FC<{
  name: string;
  path: string;
  sizeLabel: string;
  ext: string;
}> = ({ name, path, sizeLabel, ext }) => {
  const { color, bg, icon: Icon } = extStyle(ext);

  const handleOpen = async () => {
    try {
      const url = await getFileDownloadUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* silent */
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="group flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/[0.06]"
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon size={14} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{name}</p>
        <p className="text-[10px] text-slate-400">{sizeLabel}</p>
      </div>
      <FiExternalLink size={11} className="shrink-0 text-slate-300 transition group-hover:text-indigo-400 dark:text-slate-600" />
    </button>
  );
};

const ArticleDetailContent: React.FC<Props> = ({
  isLoading,
  apiContent,
  apiAttachments,
  artId,
  isView,
  isComment,
  isUpdate = true,
  isModeView = true,
  rateRang = [],
  onRateSubmit
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = React.useState(0);
  const [savedRating, setSavedRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [artRatingId, setArtRatingId] = React.useState<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [ratingLoaded, setRatingLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!artId) return;
    getArticleRating(artId)
      .then((data) => {
        if (data?.myRating) {
          setRating(data.myRating.rating);
          setSavedRating(data.myRating.rating);
          setArtRatingId(data.myRating.artRatingId);
        }
        setRatingLoaded(true);
      })
      .catch(() => setRatingLoaded(true));
  }, [artId]);

  const handleSubmitRating = async () => {
    if (rating === 0 || !artId) return;
    setSubmitting(true);
    try {
      if (artRatingId) {
        await updateRating(artRatingId, rating);
      } else {
        const res = await addRating(artId, rating);
        if (res.artRatingId) setArtRatingId(res.artRatingId);
      }
      if (onRateSubmit) {
        onRateSubmit();
      }
      setSavedRating(rating);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Lightbox: คลิกที่รูป / video ภายใน content → เปิด modal ดูใหญ่ ──
  const [lightbox, setLightbox] = React.useState<{ type: "image" | "video" | "iframe"; src: string } | null>(null);

  const openLightboxFor = (t: Element | null) => {
    if (!t) return;
    const tagName = t.tagName;
    if (tagName === "IMG") {
      const img = t as HTMLImageElement;
      const src = img.currentSrc || img.src || img.getAttribute("src") || "";
      if (src) setLightbox({ type: "image", src });
    } else if (tagName === "VIDEO") {
      const v = t as HTMLVideoElement;
      const src = v.currentSrc || v.getAttribute("src") || "";
      if (src) setLightbox({ type: "video", src });
    } else if (tagName === "IFRAME") {
      const f = t as HTMLIFrameElement;
      const src = f.getAttribute("src") || "";
      if (src) setLightbox({ type: "iframe", src });
    }
  };

  // ฟังก์ชัน handle คลิกที่ media (img/video/iframe)
  // const handleMediaClick = React.useCallback((e: Event) => {
  //   console.log("🔥 content click", e.target);
  //   const ev = e as MouseEvent;
  //   const t = (ev.target as HTMLElement)?.closest?.("img, video, iframe");
  //   console.log("media =", t);
  //   if (!t) return;
  //   ev.preventDefault();
  //   ev.stopPropagation();
  //   openLightboxFor(t);
  // }, []);
 
  // attach native click ติดตัว div เนื้อหา (เรียกเมื่อ div mount ทันที ไม่พึ่ง useEffect timing)
  // const contentRef = React.useCallback(
  //   (node: HTMLDivElement | null) => {

  //     if (bodyRef.current) {
  //       bodyRef.current.removeEventListener("click", handleMediaClick, true);
  //       bodyRef.current = null;
  //     }
  //     if (node) {
  //       node.addEventListener("click", handleMediaClick, true);
  //       bodyRef.current = node;
  //     }
  //   },
  //   [handleMediaClick]
  // );



  //   React.useEffect(() => {
  //   const node = document.querySelector(".prose");

  //   if (!node) return;

  //   const observer = new MutationObserver((mutations) => {
  //     mutations.forEach((mutation) => {
  //       console.log("🔥 MUTATION", {
  //         type: mutation.type,
  //         target: mutation.target,
  //         addedNodes: mutation.addedNodes,
  //         removedNodes: mutation.removedNodes,
  //         attributeName: mutation.attributeName,
  //       });
  //     });
  //   });

  //   observer.observe(node, {
  //     childList: true,
  //     subtree: true,
  //     attributes: true,
  //   });

  //   return () => observer.disconnect();
  // }, []);

  // React.useEffect(() => {
  //   console.log("🔥 apiContent changed");
  // }, [apiContent]);

  // React.useEffect(() => {
  //   console.log("🟢 PROSE MOUNT");

  //   return () => {
  //     console.log("🔴 PROSE UNMOUNT");
  //   };
  // }, []);





  // ปิด lightbox ด้วยปุ่ม Esc
  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[240, 120].map((h, i) => (
          <div key={i} className={`${card} p-5`}>
            <div className="h-4 w-28 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
            <div className="mt-4 space-y-2.5">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  style={{ height: h / 4 }}
                  className="animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!apiContent && !apiAttachments) return null;

  const contentRef = React.useRef<HTMLDivElement>(null);

  const html = apiContent ?? "";

  React.useEffect(() => {
    const element = contentRef.current;

    if (!element) return;

    // อัปเดต HTML เฉพาะตอน html เปลี่ยน
    if (element.innerHTML !== html) {
      element.innerHTML = html;
    }
  }, [html]);

  const attachments = apiAttachments ?? [];
  return (
    <div className="space-y-5">
      {/* Content */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.detail.content")}</p>
        </div>
        <div className="p-5">
          {html ? (
            <div
              ref={contentRef}
                            className="
                              prose 
        prose-sm 
        max-w-none 
        min-h-[300px] 
        bg-white 
        p-4 
        text-sm   
        text-gray-900 
        focus:outline-none 
        dark:prose-invert 
        dark:bg-gray-900 
        dark:text-gray-200 
        [&_h1]:text-xl 
        [&_h1]:font-bold 
        [&_h2]:text-lg 
        [&_h2]:font-semibold 
        [&_h3]:text-base 
        [&_h3]:font-semibold 
        [&_h1]:mb-2 
        [&_h2]:mb-2 
        [&_h3]:mb-1 
        [&_a]:text-blue-600 
        [&_a]:underline 
        [&_a]:underline-offset-2 
        dark:[&_a]:text-blue-400
        min-h-[200px]
        outline-none
        [&_ul]:list-disc
        [&_ul]:pl-6
        [&_ul]:my-2
        [&_ol]:list-decimal
        [&_ol]:pl-6
        [&_ol]:my-2
        [&_li]:my-1
        [&_table]:w-auto
        [&_table]:border-collapse
        [&_table]:my-2
        [&_table]:text-sm
        [&_td]:border
        [&_td]:border-gray-300
        [&_td]:px-3
        [&_td]:py-1.5
        [&_td]:align-top
        [&_th]:border
        [&_th]:border-gray-300
        [&_th]:px-3
        [&_th]:py-1.5
        [&_th]:bg-gray-100
        [&_th]:font-semibold
        [&_th]:text-left
        [&_th]:align-top
                dark:[&_table]:text-slate-200
                dark:[&_td]:border-slate-600
                dark:[&_th]:border-slate-600
                dark:[&_th]:bg-slate-700
                [&_table]:relative

                [&_img]:cursor-pointer
        [&_img]:select-none
        [&_img]:[-webkit-user-drag:none]

        [&_iframe]:block
        [&_iframe]:pointer-events-auto
              "
              onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                const img = target.closest("img");

                if (!img) return;

                e.preventDefault();
                e.stopPropagation();

                openLightboxFor(img);
              }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              {t("knowledge.articles.detail.noContent")}
            </p>
          )}
        </div>


        {/* <div className="p-5">
          {(() => {
            // const html = apiContent !== undefined ? apiContent : '';
            // console.log("🔥 HTML VALUE", html);
            const html = apiContent ?? '';
            return html ? (
              <div  className="prose 
                prose-sm 
                max-w-none 
                text-slate-700 
                dark:prose-invert 
                dark:text-slate-300 
                prose-headings:font-semibold 
                prose-headings:text-slate-800 
                dark:prose-headings:text-white 
                prose-a:text-indigo-600 
                prose-strong:text-slate-800 
                dark:prose-strong:text-slate-100 
                [&_a]:text-indigo-600 
                [&_a]:underline 
                [&_a]:underline-offset-2
                [&_a]:cursor-pointer 
                [&_a:hover]:text-indigo-800 
                dark:[&_a]:text-indigo-400 
                dark:[&_a:hover]:text-indigo-300 
                [&_table]:w-auto 
                [&_table]:border-collapse 
                [&_table]:my-2 
                [&_table]:text-sm 
                [&_table]:overflow-x-auto 
                [&_td]:border 
                [&_td]:border-gray-300 
                [&_td]:px-3 
                [&_td]:py-1.5 
                [&_td]:align-top 
                [&_th]:border 
                [&_th]:border-gray-300 
                [&_th]:px-3 
                [&_th]:py-1.5 
                [&_th]:bg-gray-100 
                [&_th]:font-semibold 
                [&_th]:text-left 
                [&_th]:align-top 
                dark:[&_table]:text-slate-200 
                dark:[&_td]:border-slate-600 
                dark:[&_th]:border-slate-600 
                dark:[&_th]:bg-slate-700
                [&_img]:cursor-pointer
                [&_img]:select-none
                [&_img]:[-webkit-user-drag:none]
                [&_iframe]:block
                [&_iframe]:pointer-events-auto">
              <div
                // onPointerUpCapture={(e) => {
                //   const target = e.target as HTMLElement;
                //   const media = target.closest("img, video, iframe");
                //   if (!media) return;
                //   e.preventDefault();
                //   e.stopPropagation();
                //   openLightboxFor(media);
                // }}
                onPointerUpCapture={(e) => {
                  const target = e.target as HTMLElement;
                  const img = target.closest("img");

                  if (!img) return;

                  e.preventDefault();
                  e.stopPropagation();

                  openLightboxFor(img);
                }}
               
                dangerouslySetInnerHTML={{ __html: html }}
              />
           </div>
              // <div
              //   ref={contentRef}
              //   onClickCapture={handleMediaClick}
              //   className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-300 prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-white prose-a:text-indigo-600 prose-strong:text-slate-800 dark:prose-strong:text-slate-100 [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer [&_a:hover]:text-indigo-800 dark:[&_a]:text-indigo-400 dark:[&_a:hover]:text-indigo-300 [&_table]:w-auto [&_table]:border-collapse [&_table]:my-2 [&_table]:text-sm [&_table]:overflow-x-auto [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-1.5 [&_td]:align-top [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-gray-100 [&_th]:font-semibold [&_th]:text-left [&_th]:align-top dark:[&_table]:text-slate-200 dark:[&_td]:border-slate-600 dark:[&_th]:border-slate-600 dark:[&_th]:bg-slate-700"
              //   dangerouslySetInnerHTML={{ __html: html }}
              // />



            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                {t("knowledge.articles.detail.noContent")}
              </p>
            );
          })()}
        </div> */}
      </div>

      {/* Attachments */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.detail.attachments")}</p>
        </div>
        <div className="p-5">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <FiFilePlus size={28} className="opacity-30" />
              <p className="text-sm">{t("knowledge.articles.detail.noAttachments")}</p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {attachments.map((att, i) => (
                  <AttachmentCard key={`${att.path}-${i}`} {...att} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className={card}>
        <div className={cardHeader}>
          <p className={sectionLabel}>{t("knowledge.articles.rating.title")}</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {t("knowledge.articles.rating.yourRating")}:
            </span>
            <div className="flex gap-1">
              {rateRang?.map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition hover:scale-110"
                    disabled={isModeView ? isModeView : !ratingLoaded}
                  >
                    <FiStar
                      size={22}
                      className={
                        active
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }
                    />
                  </button>
                );
              })}
            </div>
            {(isUpdate && (ratingLoaded && rating > 0 && rating !== savedRating)) && (
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={submitting}
                className="ml-2 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? t("knowledge.articles.rating.submitting") : t("knowledge.articles.rating.submit")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <ArticleComments isView={isView}
        isModeView={isModeView}
        isComment={isComment}
        articleId={artId ? artId.toString() : ''}
        artId={artId}
        isLoading={isLoading} />

      {/* Lightbox modal: ดูรูป / วิดีโอขนาดใหญ่ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
          <div
            className="max-h-[90vh] max-w-[95vw] overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === "image" ? (
              <img
                src={lightbox.src}
                alt="preview"
                className="max-h-[88vh] w-auto rounded-xl object-contain"
              />
            ) : lightbox.type === "video" ? (
              <video
                src={lightbox.src}
                controls
                autoPlay
                className="max-h-[88vh] max-w-[90vw] rounded-xl"
              />
            ) : (
              <iframe
                src={lightbox.src}
                title="embedded content"
                className="aspect-video w-[90vw] max-w-4xl rounded-xl"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetailContent;
