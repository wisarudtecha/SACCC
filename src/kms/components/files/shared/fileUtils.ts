import { FiFile, FiFileText, FiImage } from "react-icons/fi";
import type { ElementType } from "react";

// ─── Extension style map ──────────────────────────────────────────────────────

export const EXT_STYLE: Record<string, { color: string; bg: string; icon: ElementType }> = {
  pdf:  { color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-500/10",       icon: FiFileText },
  xls:  { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: FiFile },
  xlsx: { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: FiFile },
  csv:  { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: FiFile },
  psd:  { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  png:  { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  jpg:  { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  jpeg: { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  gif:  { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  webp: { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  svg:  { color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-500/10",         icon: FiImage },
  zip:  { color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-500/10",   icon: FiFile },
  txt:  { color: "text-slate-400",   bg: "bg-slate-100 dark:bg-white/[0.06]",    icon: FiFileText },
  json: { color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-500/10",     icon: FiFileText },
  docx: { color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",       icon: FiFileText },
  doc:  { color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",       icon: FiFileText },
  mp4:  { color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-500/10",       icon: FiFile },
  mov:  { color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-500/10",       icon: FiFile },
  webm: { color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-500/10",       icon: FiFile },
};

const FALLBACK = { color: "text-slate-400", bg: "bg-slate-100 dark:bg-white/[0.06]", icon: FiFile };

export const extStyle = (ext: string) => EXT_STYLE[ext.toLowerCase()] ?? FALLBACK;

export const fileExt = (path: string) => path.split(".").pop()?.toLowerCase() ?? "";

// ─── Preview type ─────────────────────────────────────────────────────────────

export type PreviewType = "image" | "pdf" | "video" | "text" | "other";

const IMAGE_EXTS  = new Set(["png","jpg","jpeg","gif","webp","svg","psd"]);
const PDF_EXTS    = new Set(["pdf"]);
const VIDEO_EXTS  = new Set(["mp4","mov","webm"]);
const TEXT_EXTS   = new Set(["txt","csv","json","md","log","xml","yaml","yml"]);

export const previewType = (ext: string): PreviewType => {
  const e = ext.toLowerCase();
  if (IMAGE_EXTS.has(e))  return "image";
  if (PDF_EXTS.has(e))    return "pdf";
  if (VIDEO_EXTS.has(e))  return "video";
  if (TEXT_EXTS.has(e))   return "text";
  return "other";
};
