import React, { useEffect, useState } from "react";
import {
  FiDownload, FiExternalLink, FiLoader, FiX,
} from "react-icons/fi";
import { getFileDownloadUrl } from "../../../files/service/files.service";
import { extStyle, fileExt, previewType } from "./fileUtils";

interface PreviewModalProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ filePath, fileName, onClose }) => {
  const [url, setUrl]     = useState<string | null>(null);
  const [error, setError] = useState(false);

  const ext  = fileExt(filePath);
  const type = previewType(ext);
  const { color, bg, icon: Icon } = extStyle(ext);

  useEffect(() => {
    setUrl(null); setError(false);
    getFileDownloadUrl(filePath)
      .then(setUrl)
      .catch(() => setError(true));
  }, [filePath]);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.target = "_blank"; a.rel = "noopener noreferrer"; a.click();
  };

  const handleOpenNew = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white shadow-[0_40px_120px_-24px_rgba(0,0,0,0.6)] dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{fileName}</p>
              <p className="text-[10px] font-mono uppercase text-slate-400">.{ext}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 ml-3">
            <button type="button" onClick={handleOpenNew} title="Open in new tab"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800">
              <FiExternalLink size={14} />
            </button>
            <button type="button" onClick={handleDownload} title="Download"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800">
              <FiDownload size={14} />
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-rose-500 dark:border-slate-700 dark:hover:bg-slate-800">
              <FiX size={14} />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-50 dark:bg-slate-950/60" style={{ minHeight: "60vh" }}>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bg}`}>
                <Icon size={28} className={color} />
              </div>
              <p className="text-sm">ไม่สามารถโหลดไฟล์ได้</p>
              <button type="button" onClick={handleOpenNew}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
                <FiExternalLink size={14} /> เปิดในแท็บใหม่
              </button>
            </div>
          ) : !url ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
              <FiLoader size={24} className="animate-spin text-indigo-400" />
              <p className="text-sm">กำลังโหลด…</p>
            </div>
          ) : type === "image" ? (
            <img
              src={url}
              alt={fileName}
              className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
              onError={() => setError(true)}
            />
          ) : type === "pdf" ? (
            <iframe
              src={url}
              title={fileName}
              className="h-[70vh] w-full border-0"
              onError={() => setError(true)}
            />
          ) : type === "video" ? (
            <video
              src={url}
              controls
              className="max-h-[70vh] max-w-full rounded-lg"
              onError={() => setError(true)}
            />
          ) : type === "text" ? (
            <TextPreview url={url} onError={() => setError(true)} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-slate-400">
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${bg}`}>
                <Icon size={36} className={color} />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{fileName}</p>
              <p className="text-xs text-slate-400">ไฟล์ประเภทนี้ไม่รองรับการแสดงตัวอย่าง</p>
              <div className="flex gap-2.5">
                <button type="button" onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors">
                  <FiDownload size={14} /> ดาวน์โหลด
                </button>
                <button type="button" onClick={handleOpenNew}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
                  <FiExternalLink size={14} /> เปิดในแท็บใหม่
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Text file preview (fetches raw content)
const TextPreview: React.FC<{ url: string; onError: () => void }> = ({ url, onError }) => {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setText)
      .catch(onError);
  }, [url]);

  if (!text) return (
    <div className="flex items-center gap-2 py-12 text-slate-400">
      <FiLoader size={20} className="animate-spin text-indigo-400" />
      <span className="text-sm">กำลังโหลด…</span>
    </div>
  );

  return (
    <pre className="max-h-[70vh] w-full overflow-auto p-6 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
      {text}
    </pre>
  );
};

export default PreviewModal;
