import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiFile, FiFileText, FiImage, FiPaperclip, FiX, FiExternalLink, FiCopy, FiCheck } from "react-icons/fi";
import type { ArticleFormInput } from "@/kms/articles-create-update/dtos/article-form.dto";
import type { FileExtension } from "@/kms/files/dtos/files.dto";
import { getFilePreviewUrl, getFileCopyUrl } from "@/kms/files/service/files.service";
import MinioFilePicker from "@/kms/components/articles/ArticleCreateForm/MinioFilePicker";

// ─── Extension icon helpers ───────────────────────────────────────────────────

const EXT_ICON_MAP: Partial<
  Record<FileExtension, { icon: React.ElementType; color: string; bg: string }>
> = {
  pdf: { icon: FiFileText, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
  xls: { icon: FiFile, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  xlsx: { icon: FiFile, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  csv: { icon: FiFile, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  png: { icon: FiImage, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
  jpg: { icon: FiImage, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
  jpeg: { icon: FiImage, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
  docx: { icon: FiFileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  doc: { icon: FiFileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  zip: { icon: FiFile, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
};

const getFileIcon = (path: string) => {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_ICON_MAP[ext as FileExtension] ?? { icon: FiFile, color: "text-gray-500", bg: "bg-gray-100 dark:bg-white/[0.06]" };
};

//const fileName = (path: string) => path.split("/").pop() ?? path;

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}

const ToolbarBtn: React.FC<ToolbarButtonProps> = ({ onClick, title, children, active }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${active
      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {


  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; text: string; url: string }>({
    open: false, text: "", url: "",
  });
  const [videoDialog, setVideoDialog] = useState<{ open: boolean; url: string }>({ open: false, url: "" });

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // ได้:
      // &lt;h1&gt;Test&lt;/h1&gt;
      const encoded = doc.body.innerHTML;

      // Decode:
      // <h1>Test</h1>
      const textarea = document.createElement("textarea");
      textarea.innerHTML = encoded;

      const decodedHtml = textarea.value;

      document.execCommand("insertHTML", false, decodedHtml);
    } else {
      document.execCommand("insertText", false, text);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const openLinkDialog = () => {
    const sel = window.getSelection();
    savedRangeRef.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    const selectedText = sel?.toString() ?? "";

    // detect existing <a> at cursor
    let existingAnchor: HTMLAnchorElement | null = null;
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeName === "A") { existingAnchor = node as HTMLAnchorElement; break; }
        node = node.parentNode;
      }
    }

    setLinkDialog({
      open: true,
      text: existingAnchor?.textContent ?? selectedText,
      url: existingAnchor?.href ?? "",
    });
  };

  const getInternalFileExt = (url: string): string => {
    try {
      const match = url.match(/\/files\/view\/([^?#]+)/);
      if (!match) return "";
      const decoded = atob(decodeURIComponent(match[1]));
      return decoded.split(".").pop()?.toLowerCase() ?? "";
    } catch { return ""; }
  };

  const toEmbedUrl = (url: string): { src: string; type: "youtube" | "video" | "iframe" } => {
    try {
      const u = new URL(url);
      // YouTube
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        return { src: id ? `https://www.youtube.com/embed/${id}` : url, type: "youtube" };
      }
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.slice(1).split("?")[0];
        return { src: id ? `https://www.youtube.com/embed/${id}` : url, type: "youtube" };
      }
      // Internal files/view URL
      if (/\/files\/view\//.test(url)) {
        const ext = getInternalFileExt(url);
        if (/^(mp4|webm|ogg|mov)$/.test(ext)) return { src: url, type: "video" };
        return { src: url, type: "iframe" };
      }
      // Direct video file
      if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return { src: url, type: "video" };
      return { src: url, type: "iframe" };
    } catch { return { src: url, type: "iframe" }; }
  };

  const insertVideo = () => {
    const { url } = videoDialog;
    if (!url.trim()) { setVideoDialog({ open: false, url: "" }); return; }
    editorRef.current?.focus();
    const { src, type } = toEmbedUrl(url);
    let html: string;
    if (type === "video") {
      html = `<video src="${src}" controls style="max-width:100%;border-radius:8px;margin:8px 0"></video>`;
    } else {
      html = `<iframe src="${src}" width="560" height="315" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:8px 0"></iframe>`;
    }
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setVideoDialog({ open: false, url: "" });
  };

  const insertLink = () => {
    const { text, url } = linkDialog;
    if (!url.trim()) { setLinkDialog((p) => ({ ...p, open: false })); return; }
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    const label = text.trim() || url;
    const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setLinkDialog({ open: false, text: "", url: "" });
  };

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]); // intentionally only on mount

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900">
        <ToolbarBtn onClick={() => exec("undo")} title="Undo">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("redo")} title="Redo">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
        </ToolbarBtn>

        <Divider />

        <select
          onChange={(e) => exec("formatBlock", e.target.value)}
          className="h-7 rounded border-0 bg-transparent py-0 pl-1 pr-5 text-xs text-gray-600 focus:outline-none focus:ring-0 dark:text-gray-400"
          defaultValue="p"
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="pre">Code</option>
        </select>

        <Divider />

        <label title="Font color" className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          <span className="relative">
            <span className="font-bold text-sm">A</span>
            <span className="absolute bottom-0 left-0 right-0 h-1 rounded-sm bg-rose-400" />
          </span>
          <input type="color" className="sr-only" onChange={(e) => exec("foreColor", e.target.value)} />
        </label>

        <Divider />

        <ToolbarBtn onClick={() => exec("bold")} title="Bold"><strong>B</strong></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic"><em>I</em></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("underline")} title="Underline"><span className="underline">U</span></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("strikethrough")} title="Strikethrough"><span className="line-through">S</span></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("subscript")} title="Subscript">x<sub>2</sub></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("superscript")} title="Superscript">x<sup>2</sup></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h1v3H3V4zm1 7H3v-1l2-2H3V7h3v1l-2 2h2v1zm-1 3h1v1h1v1H3v-1h1v-2zM7 5h10a1 1 0 110 2H7a1 1 0 110-2zm0 5h10a1 1 0 110 2H7a1 1 0 110-2zm0 5h10a1 1 0 110 2H7a1 1 0 110-2z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("outdent")} title="Outdent">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M4 12h16" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("indent")} title="Indent">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h16" /></svg>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={openLinkDialog} title="Insert link">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => {
            const url = window.prompt("Image URL:");
            if (url) exec("insertImage", url);
          }}
          title="Insert image"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setVideoDialog({ open: true, url: "" })} title="Insert video">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal rule">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
        </ToolbarBtn>
      </div>

      {/* Editable area */}


      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="prose prose-sm max-w-none min-h-[300px] bg-white p-4 text-sm text-gray-900 focus:outline-none dark:prose-invert dark:bg-gray-900 dark:text-gray-200 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-1 [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-blue-400"
      />

      {/* Link dialog */}
      {linkDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) setLinkDialog((p) => ({ ...p, open: false })); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Insert Link</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Display text</label>
                <input
                  autoFocus
                  type="text"
                  value={linkDialog.text}
                  onChange={(e) => setLinkDialog((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Link text"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">URL</label>
                <input
                  type="url"
                  value={linkDialog.url}
                  onChange={(e) => setLinkDialog((p) => ({ ...p, url: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") insertLink(); }}
                  placeholder="https://"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setLinkDialog((p) => ({ ...p, open: false }))} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button type="button" onClick={insertLink} disabled={!linkDialog.url.trim()} className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50">Insert</button>
            </div>
          </div>
        </div>
      )}
      {/* Video dialog */}
      {videoDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoDialog({ open: false, url: "" }); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Insert Video</p>
            <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">YouTube URL หรือ direct video link (.mp4, .webm)</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">URL</label>
              <input
                autoFocus
                type="url"
                value={videoDialog.url}
                onChange={(e) => setVideoDialog((p) => ({ ...p, url: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") insertVideo(); }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setVideoDialog({ open: false, url: "" })} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button type="button" onClick={insertVideo} disabled={!videoDialog.url.trim()} className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50">Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ContentTab ───────────────────────────────────────────────────────────────

interface ContentTabProps {
  form: ArticleFormInput;
  onChange: <K extends keyof ArticleFormInput>(key: K, value: ArticleFormInput[K]) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({ form, onChange }) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyUrl = async (path: string) => {
    try {
      const url = await getFileCopyUrl(path);
      await navigator.clipboard.writeText(url);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch { /* silent */ }
  };

  const removeFile = (name: string) =>
    onChange("attachments", form.attachments.filter((a) => a.name !== name));

  const handlePickerConfirm = (items: { name: string; sizeLabel: string; path: string }[]) => {
    onChange("attachments", items);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* File Attachment */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("knowledge.articles.form.content.attachmentLabel")}
        </label>

        {/* MinIO picker trigger */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600 dark:hover:bg-blue-500/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
            <FiPaperclip size={20} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {t("knowledge.articles.form.content.pickFromMinio")}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {form.attachments.length > 0
                ? t("knowledge.articles.form.picker.selectedCount", { count: form.attachments.length })
                : t("knowledge.articles.form.content.noFiles")}
            </p>
          </div>
        </button>

        {/* Attached file list — 2-column grid */}
        {form.attachments.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {form.attachments.map((att, i) => {
              const { icon: Icon, color, bg } = getFileIcon(att.name);
              const handlePreview = async () => {
                if (!att.path) return;
                try {
                  const url = await getFilePreviewUrl(att.path);
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch { /* silent */ }
              };
              return (
                <div
                  key={`${i}-${att.name}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon size={14} className={color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!att.path}
                      className="truncate text-sm font-medium text-blue-600 hover:underline disabled:cursor-default disabled:no-underline dark:text-blue-400"
                    >
                      {att.name}
                    </button>
                    {att.sizeLabel && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{att.sizeLabel}</p>
                    )}
                  </div>
                  {att.path && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(att.path!)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100"
                      >
                        {copiedPath === att.path
                          ? <><FiCheck size={11} className="text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
                          : <><FiCopy size={11} />Copy URL</>}
                      </button>
                      <button
                        type="button"
                        onClick={handlePreview}
                        className="shrink-0 rounded-lg p-1 text-gray-300 transition hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100"
                        title="Preview"
                      >
                        <FiExternalLink size={13} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(att.name)}
                    className="shrink-0 rounded-lg p-1 text-gray-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-gray-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100"
                  >
                    <FiX size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content rich text */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("knowledge.articles.form.content.contentLabel")}
        </label>
        <RichTextEditor
          value={form.content}
          onChange={(html) => onChange("content", html)}
        />
      </div>

      {/* MinIO picker modal */}
      <MinioFilePicker
        open={pickerOpen}
        selected={form.attachments.map((a) => a.path ?? a.name)}
        onConfirm={handlePickerConfirm}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
};

export default ContentTab;
