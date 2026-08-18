import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDrag, useDrop } from "react-dnd";
import { FiX, FiLink, FiCopy, FiCheck, FiSave, FiLoader } from "react-icons/fi";
import type { BannerItem } from "@/kms/banner/dtos/banner.dto";
import { getFileDownloadUrl } from "@/kms/files/service/files.service";

const DRAG_TYPE = "BANNER_CARD";

// ─── Banner Card (draggable + droppable) ──────────────────────────────────────

interface BannerCardProps {
  banner: BannerItem;
  index: number;
  onRemove: (id: string) => void;
  isRemoving: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  isDelete?: boolean;
}

const BannerCard: React.FC<BannerCardProps> = ({
  banner,
  index,
  onRemove,
  isRemoving,
  onMove,
  isDelete = true
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!banner.coverImage) return;
    if (banner.coverImage.startsWith("http")) {
      setImgUrl(banner.coverImage);
      return;
    }
    getFileDownloadUrl(banner.coverImage)
      .then(setImgUrl)
      .catch(() => setImgUrl(null));
  }, [banner.coverImage]);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<
    { index: number },
    void,
    { isOver: boolean }
  >({
    accept: DRAG_TYPE,
    hover(item) {
      if (item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  drag(drop(ref));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(banner.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${isDragging
          ? "cursor-grabbing opacity-40 shadow-lg"
          : "cursor-grab border-slate-200/70 dark:border-white/[0.08]"
        } ${isOver ? "ring-2 ring-violet-400 ring-offset-1" : ""}`}
    >
      {/* Drag handle hint */}
      <div className="absolute left-1/2 top-1.5 z-10 flex -translate-x-1/2 gap-0.5 opacity-0 transition group-hover:opacity-60">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="h-1 w-1 rounded-full bg-white shadow" />
        ))}
      </div>

      {/* Order badge */}
      <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 text-[11px] font-bold text-white backdrop-blur-sm">
        {index + 1}
      </div>

      {isDelete && (
        <button
          type="button"
          onClick={() => onRemove(banner.id)}
          disabled={isRemoving}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Remove banner"
        >
          <FiX size={12} />
        </button>
      )}

      {/* Cover image */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={banner.title}
            draggable={false}
            className="h-full w-full select-none object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiLink size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-700 dark:text-slate-200">
          {banner.title}
        </p>
        {/* <p className="line-clamp-1 text-[10px] text-slate-400 dark:text-slate-500">
          {banner.url}
        </p> */}
      </div>

      {/* Copy URL button */}
      <div className="border-t border-slate-100 px-3 py-2 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-[11px] font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          {copied ? (
            <>
              <FiCheck size={11} className="text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <FiCopy size={11} />
              Copy URL
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Banner Grid ──────────────────────────────────────────────────────────────

interface Props {
  banners: BannerItem[];
  isLoading?: boolean;
  removingId?: string | null;
  isSaving?: boolean;
  isDirty?: boolean;
  onRemove: (id: string) => void;
  onReorder: (reordered: BannerItem[]) => void;
  onSave: () => void;
  isDelete?: boolean;
}

const BannerGrid: React.FC<Props> = ({
  banners,
  isLoading,
  removingId,
  isSaving,
  isDirty,
  onRemove,
  onReorder,
  onSave,
  isDelete = true
}) => {
  const { t } = useTranslation();
  const handleMove = (fromIndex: number, toIndex: number) => {
    const next = [...banners];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
        <FiLink
          size={28}
          className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
        />
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("knowledge.banner.grid.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {banners.map((banner, index) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            index={index}
            onRemove={onRemove}
            isRemoving={removingId === banner.id}
            onMove={handleMove}
            isDelete={isDelete}
          />
        ))}
      </div>

      {/* Save button — only visible when order changed */}
      {isDirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <FiLoader size={15} className="animate-spin" />
            ) : (
              <FiSave size={15} />
            )}
            {isSaving ? t("knowledge.banner.grid.saving") : t("knowledge.banner.grid.save")}
          </button>
        </div>
      )}
    </div>
  );
};

export default BannerGrid;
