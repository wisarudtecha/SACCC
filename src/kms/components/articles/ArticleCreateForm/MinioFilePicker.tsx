import React, { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import FileManagerPanel from "@/kms/components/files/FileManagerPanel";

export interface MinioFilePickerProps {
  open: boolean;
  selected: string[];
  maxSelect?: number;
  accept?: string[];
  onConfirm: (items: { name: string; sizeLabel: string; path: string }[]) => void;
  onClose: () => void;
}

const MinioFilePicker: React.FC<MinioFilePickerProps> = ({ open, selected, maxSelect, accept, onConfirm, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex h-[90vh] w-full max-w-[1200px] overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_32px_96px_-24px_rgba(15,23,42,0.45)] dark:border-white/[0.08] dark:bg-slate-900">
        {/* Close button overlay */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-5 z-10 rounded-xl border border-slate-200 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <FiX size={15} />
        </button>

        <FileManagerPanel
          selectable
          initialSelected={selected}
          maxSelect={maxSelect}
          accept={accept}
          onConfirm={onConfirm}
          onCancel={onClose}
          heightCls="h-full"
        />
      </div>
    </div>
  );
};

export default MinioFilePicker;
