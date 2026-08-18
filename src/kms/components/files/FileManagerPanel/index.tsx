import React, { useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiCheck, FiChevronDown, FiChevronRight,
  FiCopy, FiDownload, FiEye, FiFile, FiFilePlus,
  FiFolder, FiFolderPlus, FiMoreVertical,
  FiSearch, FiTrash2, FiUploadCloud, FiX,
} from "react-icons/fi";
import type { FileItem, FolderItem, FileTreeNode } from "@/kms/files/dtos/files.dto";
import { useFileBlockData } from "@/kms/files/hook/useFilesData";
import { useUploadManager } from "@/kms/files/hook/useUploadManager";

import ConfirmModal from "@/kms/components/shared/ConfirmModal";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  getFileDownloadUrl,
  getFileCopyUrl,
  getFilePreviewUrl,
} from "../../../files/service/files.service";
import UploadTasksPanel from "../UploadTasksPanel";
import { extStyle, fileExt } from "../shared/fileUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileManagerPanelProps {
  /** select mode: shows checkboxes + confirm footer */
  selectable?: boolean;
  initialSelected?: string[];
  /** limit number of selectable files; 1 = single-select (replaces previous) */
  maxSelect?: number;
  /** filter files by extension, e.g. ["jpg","jpeg","png","webp","gif","svg"] */
  accept?: string[];
  onConfirm?: (items: { name: string; sizeLabel: string; path: string }[]) => void;
  onCancel?: () => void;
  /** height class applied to the outer wrapper; default: "min-h-[540px]" */
  heightCls?: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface MiniToast { id: number; ok: boolean; msg: string }

const useToasts = () => {
  const [toasts, setToasts] = useState<MiniToast[]>([]);
  const push = (ok: boolean, msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, ok, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  };
  return { toasts, push };
};

// ─── Sidebar tree node ────────────────────────────────────────────────────────

const SidebarNode: React.FC<{
  node: FileTreeNode; depth: number;
  active: string; onSelect: (p: string) => void;
}> = ({ node, depth, active, onSelect }) => {
  const [open, setOpen] = useState(depth === 0);
  const has = !!node.children?.length;
  const isActive = active === node.path;
  return (
    <div>
      <button
        type="button"
        onClick={() => { if (has) setOpen((p) => !p); onSelect(node.path); }}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left transition-colors ${isActive ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"}`}
      >
        <span className="w-3.5 shrink-0 text-slate-400">
          {has ? (open ? <FiChevronDown size={11} /> : <FiChevronRight size={11} />) : null}
        </span>
        <FiFolder size={12} className={isActive ? "text-indigo-500" : "text-amber-400 dark:text-amber-300"} />
        <span className="min-w-0 truncate text-xs">{node.name}</span>
      </button>
      {open && has && node.children!.map((c) => (
        <SidebarNode key={c.id} node={c} depth={depth + 1} active={active} onSelect={onSelect} />
      ))}
    </div>
  );
};

// ─── File card ────────────────────────────────────────────────────────────────

interface FileCardProps {
  item: FileItem;
  selectable: boolean;
  isChecked: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onCopyUrl: () => void;
  onDelete: () => void;
}

const FileCard: React.FC<FileCardProps> = ({
  item, selectable, isChecked, onToggle, onPreview, onDownload, onCopyUrl, onDelete,
}) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const ext = fileExt(item.path);
  const { color, bg, icon: Icon } = extStyle(ext);

  return (
    <div className={`group relative flex flex-col rounded-[18px] border p-3.5 transition-all duration-150 ${isChecked
      ? "border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-300/40 dark:border-indigo-500/50 dark:bg-indigo-500/10"
      : "border-slate-200/70 bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900/60"
      }`}>
      {/* Top row: icon + checkbox/menu */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        {/* File icon — click to preview */}
        <button type="button" onClick={onPreview} title="Preview"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95"
          style={{ background: "inherit" }}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
            <Icon size={22} className={color} />
          </div>
        </button>

        {/* Select checkbox (select mode) or ⋮ menu (manage mode) */}
        {selectable ? (
          <button type="button" onClick={onToggle}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isChecked ? "border-indigo-500 bg-indigo-500" : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
              }`}>
            {isChecked && <FiCheck size={10} className="text-white" strokeWidth={3} />}
          </button>
        ) : (
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((p) => !p)}
              className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100 dark:hover:bg-white/[0.07]">
              <FiMoreVertical size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 min-w-[152px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-slate-900">
                <button type="button" onClick={() => { setMenuOpen(false); onPreview(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.05]">
                  <FiEye size={13} /> ดูตัวอย่าง
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onDownload(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.05]">
                  <FiDownload size={13} /> {t("knowledge.files.buttons.download")}
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onCopyUrl(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.05]">
                  <FiCopy size={13} /> {t("knowledge.files.buttons.copyUrl")}
                </button>
                <div className="mx-2 my-0.5 h-px bg-slate-100 dark:bg-white/[0.06]" />
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/[0.07]">
                  <FiTrash2 size={13} /> {t("knowledge.files.buttons.delete")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Name + size — click to preview OR toggle */}
      <button type="button" onClick={selectable ? onToggle : onPreview} className="text-left">
        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{item.sizeLabel}</p>
        {item.lastModifiedLabel && (
          <p className="text-[10px] text-slate-400">{item.lastModifiedLabel}</p>
        )}
      </button>

      {/* Quick action bar (select mode: preview + copy; manage mode: hidden — menu handles it) */}
      {selectable && (
        <div className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-white/[0.04]">
          <button type="button" onClick={onPreview} title="Preview"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors dark:hover:bg-indigo-500/10">
            <FiEye size={11} />
          </button>
          <button type="button" onClick={onCopyUrl} title="Copy URL"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-500 transition-colors dark:hover:bg-sky-500/10">
            <FiCopy size={11} />
          </button>
          <button type="button" onClick={onDelete} title="Delete"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors dark:hover:bg-rose-500/10">
            <FiTrash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Folder card ──────────────────────────────────────────────────────────────

const FolderCard: React.FC<{
  folder: FolderItem;
  onSelect: (p: string) => void;
  onDelete: (f: FolderItem) => void;
}> = ({ folder, onSelect, onDelete }) => {
  return (
    <div className="group relative flex items-center gap-3 rounded-[18px] border border-slate-200/70 bg-white p-3.5 transition hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900/60">
      <button type="button" onClick={() => onSelect(folder.path)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
          <FiFolder size={20} className="text-amber-400 dark:text-amber-300" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{folder.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">{folder.fileCount} files · {folder.sizeLabel}</p>
        </div>
      </button>
      <button type="button" onClick={() => onDelete(folder)}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400">
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}




// ─── FileManagerPanel ─────────────────────────────────────────────────────────

//const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff"];

const FileManagerPanel: React.FC<FileManagerPanelProps> = ({
  selectable = false,
  initialSelected = [],
  maxSelect,
  accept,
  onConfirm,
  onCancel,
  heightCls = "min-h-[540px]",
}) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, push } = useToasts();

  const [path, setPath] = useState("");
  const [search, setSearch] = useState("");
  const [newFolderMode, setFolderMode] = useState(false);
  const [newFolderName, setFolderName] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set(initialSelected));
  const [checkedMeta, setCheckedMeta] = useState<Map<string, { name: string; sizeLabel: string }>>(new Map());
  const [pendingDeleteItem, setPendingDeleteItem] = useState<FolderItem | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["kb-files-block"] });

  const { tasks: uploadTasks, addUpload, dismissTask, clearDone } = useUploadManager(invalidate);

  // ── data ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, isFetching, refetch } = useFileBlockData("list", { prefix: path });
  const { data: treeData } = useFileBlockData("tree");
  const listResult = data?.data;
  const rawFolders = listResult?.folders ?? [];
  const rawFiles = listResult?.files ?? [];
  const recent = listResult?.recent ?? [];
  const treeNodes = (treeData?.data ?? []) as FileTreeNode[];

  const acceptExts = accept?.map((e) => e.toLowerCase());
  const filterByAccept = (f: { name: string; extension: string }) =>
    !acceptExts || acceptExts.includes(f.extension.toLowerCase()) ||
    acceptExts.includes(f.name.split(".").pop()?.toLowerCase() ?? "");

  const q = search.trim().toLowerCase();
  const folders = q ? rawFolders.filter((f) => f.name.toLowerCase().includes(q)) : rawFolders;
  const files = (q
    ? rawFiles.filter((f) => f.name.toLowerCase().includes(q) || f.extension.includes(q))
    : (path ? rawFiles : recent)
  ).filter(filterByAccept);

  // ── mutations ─────────────────────────────────────────────────────────────

  const deleteMut = useMutation({
    mutationFn: (p: string) => deleteFile(p),
    onSuccess: () => { void invalidate(); push(true, t("knowledge.files.toast.deleteSuccess")); },
    onError: () => push(false, t("knowledge.files.toast.deleteError")),
  });

  const deleteFolderMut = useMutation({
    mutationFn: (p: string) => deleteFolder(p),
    onSuccess: () => {
      void invalidate();
      push(true, t("knowledge.files.toast.folderDeleteSuccess"));
    },
    onError: () => {
      push(false, t("knowledge.files.toast.folderDeleteError"))
    },
  });

  const folderMut = useMutation({
    mutationFn: (name: string) => createFolder(`${path}${name}/`),
    onSuccess: () => { void invalidate(); push(true, t("knowledge.files.toast.folderCreated")); setFolderMode(false); setFolderName(""); },
    onError: () => push(false, t("knowledge.files.toast.folderError")),
  });



  const handleDeleteFolder = (f: FolderItem) => {
    setPendingDeleteItem(f)
    // if (!window.confirm(t("knowledge.files.confirm.deleteFolder", { name }))) return;
    // deleteFolderMut.mutate(folderPath);
  };

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleDelete = (f: FolderItem) => {
    setPendingDeleteItem(f)
    // if (!window.confirm(t("knowledge.files.confirm.delete", { name: filePath.split("/").pop() ?? filePath }))) return;
    // deleteMut.mutate(filePath);
    // setChecked((p) => { const n = new Set(p); n.delete(filePath); return n; });
    // setCheckedMeta((p) => { const n = new Map(p); n.delete(filePath); return n; });
  };



  const handlePreview = async (filePath: string) => {
    try {
      const url = await getFilePreviewUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch { push(false, t("knowledge.files.toast.downloadError")); }
  };

  const handleDownload = async (filePath: string, name: string) => {
    try {
      const url = await getFileDownloadUrl(filePath);
      const a = document.createElement("a"); a.href = url; a.download = name; a.target = "_blank"; a.rel = "noopener noreferrer"; a.click();
    } catch { push(false, t("knowledge.files.toast.downloadError")); }
  };

  const handleCopyUrl = async (filePath: string) => {
    try {
      const url = await getFileCopyUrl(filePath);
      await navigator.clipboard.writeText(url);
      push(true, t("knowledge.files.toast.copySuccess"));
    } catch { push(false, t("knowledge.files.toast.copyError")); }
  };



  const handleConfirmDelete = () => {
 
    if (pendingDeleteItem) {
      const isFolder = pendingDeleteItem?.path.endsWith('/');
      const isFile = !pendingDeleteItem?.path.endsWith('/');
      if (isFolder){
        deleteFolderMut.mutate(pendingDeleteItem?.path);
      }
      if (isFile) {
        deleteMut.mutate(pendingDeleteItem?.path);
        setChecked((p) => { const n = new Set(p); n.delete(pendingDeleteItem?.path); return n; });
        setCheckedMeta((p) => { const n = new Map(p); n.delete(pendingDeleteItem?.path); return n; });

      }
    }
    setPendingDeleteItem(null)
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void addUpload(file, path);
    e.target.value = "";
  };

  const createFolderCommit = () => {
    const name = newFolderName.trim().replace(/[/\\]/g, "");
    if (name) folderMut.mutate(name);
  };

  const toggle = (file: FileItem) => {
    if (maxSelect === 1) {
      const alreadyChecked = checked.has(file.path);
      setChecked(alreadyChecked ? new Set() : new Set([file.path]));
      setCheckedMeta(alreadyChecked ? new Map() : new Map([[file.path, { name: file.name, sizeLabel: file.sizeLabel }]]));
      return;
    }
    setChecked((prev) => { const n = new Set(prev); n.has(file.path) ? n.delete(file.path) : n.add(file.path); return n; });
    setCheckedMeta((prev) => {
      const n = new Map(prev);
      n.has(file.path) ? n.delete(file.path) : n.set(file.path, { name: file.name, sizeLabel: file.sizeLabel });
      return n;
    });
  };

  const uncheckPath = (p: string) => {
    setChecked((prev) => { const n = new Set(prev); n.delete(p); return n; });
    setCheckedMeta((prev) => { const n = new Map(prev); n.delete(p); return n; });
  };

  // breadcrumbs
  const crumbs = path ? path.replace(/\/$/, "").split("/") : [];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={`flex ${heightCls} overflow-hidden divide-x divide-slate-200/60 dark:divide-white/[0.07]`}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="flex w-52 shrink-0 flex-col bg-slate-50/60 dark:bg-white/[0.015]">
        <div className="border-b border-slate-200/60 px-4 py-3 dark:border-white/[0.07]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("knowledge.files.tree.title")}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* <button type="button" onClick={() => setPath("")}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
              path === "" ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                         : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05]"}`}>
            <FiFolder size={13} className={path === "" ? "text-indigo-500" : "text-amber-400 dark:text-amber-300"} />
            <span className="truncate text-xs">{t("knowledge.files.sections.recent.title")}</span>
          </button> */}
          {treeNodes.map((n) => (
            <SidebarNode key={n.id} node={n} depth={0} active={path} onSelect={setPath} />
          ))}
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Breadcrumb + toolbar */}
        <div className="border-b border-slate-200/60 px-4 py-2.5 dark:border-white/[0.07]">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-1 text-xs text-slate-400">
            <button type="button" onClick={() => setPath("")} className="hover:text-indigo-500 transition-colors">
              {t("knowledge.files.sections.recent.title")}
            </button>
            {crumbs.map((seg, i) => {
              const target = crumbs.slice(0, i + 1).join("/") + "/";
              return (
                <React.Fragment key={i}>
                  <span className="opacity-40">/</span>
                  <button type="button" onClick={() => setPath(target)} className="hover:text-indigo-500 transition-colors">{seg}</button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <FiSearch size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("knowledge.files.labels.noResults")}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-200" />
            </div>

            {/* New folder */}
            {newFolderMode ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus type="text" value={newFolderName} onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createFolderCommit(); if (e.key === "Escape") { setFolderMode(false); setFolderName(""); } }}
                  placeholder={t("knowledge.files.folder.namePlaceholder")}
                  className="w-32 rounded-xl border border-indigo-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-indigo-600 dark:bg-slate-900 dark:text-white" />
                <button type="button" onClick={createFolderCommit} disabled={folderMut.isPending}
                  className="rounded-xl bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                  {folderMut.isPending ? "…" : t("knowledge.files.buttons.create")}
                </button>
                <button type="button" onClick={() => { setFolderMode(false); setFolderName(""); }}
                  className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 dark:border-slate-700 transition-colors">
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setFolderMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300">
                <FiFolderPlus size={13} /> {t("knowledge.files.buttons.newFolder")}
              </button>
            )}

            {/* Refresh */}
            <button type="button" onClick={() => void refetch()} disabled={isFetching}
              className="rounded-xl border border-slate-200/70 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300">
              {isFetching ? t("knowledge.files.buttons.refreshing") : t("knowledge.files.buttons.refresh")}
            </button>

            {/* Upload */}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:bg-sky-50 dark:border-sky-500/40 dark:bg-slate-900 dark:text-sky-400">
              <FiUploadCloud size={14} /> {t("knowledge.files.buttons.upload")}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isError && (
            <p className="py-8 text-center text-sm text-rose-500">{t("knowledge.files.labels.loadFailed")}</p>
          )}

          {!isError && isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-[18px] bg-slate-100 dark:bg-white/[0.05]" />
              ))}
            </div>
          )}

          {!isError && !isLoading && (
            <div className="space-y-6">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("knowledge.files.sections.folders")}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {folders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onSelect={setPath}
                        onDelete={handleDeleteFolder} />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div>
                {folders.length > 0 && (
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("knowledge.files.sections.files")}</p>
                )}
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <FiFilePlus size={36} className="mb-3 opacity-25" />
                    <p className="text-sm">{q ? t("knowledge.files.labels.noResults") : t("knowledge.files.labels.empty")}</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors">
                      <FiUploadCloud size={13} /> {t("knowledge.files.buttons.upload")}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {files.map((file) => (
                      <FileCard
                        key={file.id}
                        item={file}
                        selectable={selectable}
                        isChecked={checked.has(file.path)}
                        onToggle={() => toggle(file)}
                        onPreview={() => void handlePreview(file.path)}
                        onDownload={() => void handleDownload(file.path, file.name)}
                        onCopyUrl={() => void handleCopyUrl(file.path)}
                        onDelete={() => handleDelete({
                          id: file.id,
                          name: file.name,
                          path: file.path,
                          fileCount: 0,
                          sizeLabel: "-"
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Select footer */}
        {selectable && (
          <div className="flex items-center justify-between border-t border-slate-200/60 px-5 py-3.5 dark:border-white/[0.07]">
            <span className="text-sm text-slate-500">
              {checked.size > 0 ? t("knowledge.files.labels.selectedCount", { count: checked.size }) : t("knowledge.files.labels.noneSelected")}
            </span>
            <div className="flex gap-2.5">
              {onCancel && (
                <button type="button" onClick={onCancel}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {t("knowledge.files.buttons.cancel")}
                </button>
              )}
              <button type="button" onClick={() => onConfirm?.([...checked].map(p => ({ path: p, name: checkedMeta.get(p)?.name ?? p.split("/").pop() ?? p, sizeLabel: checkedMeta.get(p)?.sizeLabel ?? "" })))} disabled={checked.size === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.5)] transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
                <FiCheck size={14} strokeWidth={2.5} />
                {checked.size > 0 ? t("knowledge.files.labels.selectedCount", { count: checked.size }) : t("knowledge.files.buttons.create")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected items panel (selectable mode only) */}
      {selectable && (
        <div className="flex w-56 shrink-0 flex-col divide-y divide-slate-200/60 border-l border-slate-200/60 dark:divide-white/[0.07] dark:border-white/[0.07]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t("knowledge.files.labels.selectedCount", { count: checked.size })}
            </p>
            {checked.size > 0 && (
              <button type="button"
                onClick={() => { setChecked(new Set()); setCheckedMeta(new Map()); }}
                className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors">
                {t("knowledge.files.buttons.cancel")}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {checked.size === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <FiFile size={28} className="mb-2 opacity-20" />
                <p className="text-xs">{t("knowledge.files.labels.noneSelected")}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...checked].map((p) => {
                  const meta = checkedMeta.get(p);
                  const name = meta?.name ?? p.split("/").pop() ?? p;
                  const size = meta?.sizeLabel ?? "";
                  const ext = fileExt(p);
                  const { color, bg, icon: Icon } = extStyle(ext);
                  return (
                    <div key={p} className="group flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-2 dark:border-white/[0.07] dark:bg-slate-900/60">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                        <Icon size={13} className={color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-100">{name}</p>
                        {size && <p className="text-[10px] text-slate-400">{size}</p>}
                      </div>
                      <button type="button" onClick={() => uncheckPath(p)}
                        className="shrink-0 rounded-md p-0.5 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600">
                        <FiX size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload tasks panel */}
      <UploadTasksPanel tasks={uploadTasks} onDismiss={dismissTask} onClearDone={clearDone} />

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.ok ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {toast.ok ? <FiCheck size={14} /> : <FiX size={14} />}
              {toast.msg}
            </div>
          ))}
        </div>
      )}



      <ConfirmModal
        isOpen={!!pendingDeleteItem}
        title={t("knowledge.broadcast.confirm.delete", { title: pendingDeleteItem?.name ?? "" })}
        description={t("knowledge.broadcast.confirm.deleteDescription")}
        confirmLabel={t("knowledge.files.confirm.delete", { name: pendingDeleteItem?.name ?? "" })}
        cancelLabel={t("knowledge.broadcast.buttons.cancel")}
        isLoading={deleteFolderMut.isPending || deleteMut.isPending}
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteItem(null)}
      />
    </div>
  );
};

export default FileManagerPanel;
