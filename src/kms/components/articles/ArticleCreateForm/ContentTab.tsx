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
 const { t } = useTranslation();

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; text: string; url: string }>({
    open: false, text: "", url: "",
  });
  const [videoDialog, setVideoDialog] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const [tableDialog, setTableDialog] = useState<{ open: boolean; rows: number; cols: number }>({
    open: false, rows: 3, cols: 3,
  });

  // --- Table cell selection / color / resize state ---
  // เก็บ "block" ที่เลือกไว้ (Excel-style) จาก shift+click
  const selectedBlockRef = useRef<{
    table: HTMLTableElement;
    r1: number; c1: number; r2: number; c2: number;
  } | null>(null);
  //const [showTableColorPicker, setShowTableColorPicker] = useState(false);
  const [tableColorTarget, setTableColorTarget] = useState<"cell" | "row" | "col">("cell");
  //const [showTableMenu, setShowTableMenu] = useState(false);
  //const [showBorderMenu, setShowBorderMenu] = useState(false);
  // ◾ Right-click context menu บน cell/table (table actions + border + fill color)
  const [tableContextMenu, setTableContextMenu] = useState<{ x: number; y: number } | null>(null);
  // เก็บ cell ที่คลิกขวา เพื่อใช้กับ border/fill color (เลือกเฉพาะ cell นั้น)
  const ctxMenuCellRef = useRef<HTMLTableCellElement | null>(null);
  // state ของ border ที่เลือกใน context menu ณ ขณะนี้ (เพื่อรวม style+width+color ครั้งเดียว)
  const [ctxBorder, setCtxBorder] = useState<{ style: "solid" | "dashed" | "dotted" | "none"; width: number; color: string }>({
    style: "solid", width: 1, color: "#d1d5db",
  });

    // ── Image resize state (จับมุมแล้วลาก resize รูปภาพ) ──
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [imgBox, setImgBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const imgResizeRef = useRef<{
    img: HTMLImageElement;
    dir: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    startX: number; startY: number;
    startW: number; startH: number;
  } | null>(null);

    // ── Image drag-move state (ลากรูปภายใน editor เพื่อย้ายตำแหน่ง) ──
  // ใช้ custom mouse drag (ไม่ใช้ HTML5 DnD เพราะ mousedown บนรูปมี preventDefault
  // กัน native drag/text selection ทำให้ onDragStart ไม่ถูกเรียก)
  // → mousedown เริ่มจับ → mousemove เกิน threshold = กำลังลาก → mouseup วางรูป
    const imgDragRef = useRef<{
    img: HTMLImageElement;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  // ── Visual ขณะลาก: ghost รูป (ตามเมาส์) + indicator ตำแหน่งที่จะแทรก ──
  const dragGhostRef = useRef<HTMLImageElement | null>(null);
  const dropBarRef = useRef<HTMLDivElement | null>(null);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);



  const execute = useCallback(
    (command: string, arg?: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      console.log("command:", command);
      console.log("selection:", window.getSelection()?.toString());

      editor.focus();

      const result = document.execCommand(command, false, arg);

      console.log("result:", result);
      console.log("html:", editor.innerHTML);

      onChange(editor.innerHTML);
    },
    [onChange]
  );



  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // —— Excel/HTML paste: ซ่อม table ให้สมบูรณ์ก่อนแทรก ——
  const preparePastedHtml = (doc: Document): string => {
    const tables = doc.querySelectorAll<HTMLTableElement>("table");
    if (!tables.length) return doc.body.innerHTML;

    tables.forEach((table) => {
      // ห่อ table เพื่อกัน overflow บนจอเล็ก
      const wrapper = doc.createElement("div");
      wrapper.style.cssText = "overflow-x:auto;margin:10px 0;";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      table.style.borderCollapse = "collapse";
      table.style.width = "auto";

      // ใส่ border/padding เป็น default เฉพาะ cell ที่ Excel ไม่ได้ให้ style มา
      table.querySelectorAll<HTMLTableCellElement>("td, th").forEach((cell) => {
        if (!cell.style.border) cell.style.border = "1px solid #d1d5db";
        if (!cell.style.padding) cell.style.padding = "6px 10px";
      });
    });

    return doc.body.innerHTML;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const htmlToInsert = preparePastedHtml(doc);

      document.execCommand("insertHTML", false, htmlToInsert);
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
    restoreSelection();
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

  // ===========================================================================
  //  Table Editor (Insert / Row / Column / Delete) — ทำงานที่ cursor
  // ===========================================================================

  // หา cell/row/table ที่ cursor อยู่ในตำแหน่งปัจจุบัน
  const getTableCellContext = (): { cell: HTMLTableCellElement; row: HTMLTableRowElement; table: HTMLTableElement } | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;

    // เดินขึ้นหา <td> หรือ <th>
    let cell: HTMLTableCellElement | null = null;
    while (node && node !== editorRef.current && node !== document.body) {
      if (node instanceof HTMLTableCellElement) { cell = node; break; }
      node = node.parentNode;
    }
    if (!cell) return null;

    const row = cell.closest("tr") as HTMLTableRowElement | null;
    const table = cell.closest("table") as HTMLTableElement | null;
    if (!row || !table) return null;

    return { cell, row, table };
  };

  // ส่งกลับจำนวนคอลัมน์สูงสุด (เพื่อแทรกแถวให้เท่ากันทุก rows)
  const getMaxColumns = (table: HTMLTableElement): number =>
    Array.from(table.rows).reduce(
      (max, r) => Math.max(max, r.cells.length),
      1
    );

  const insertTable = (rows: number, cols: number) => {
    editorRef.current?.focus();
    restoreSelection();

    let html = `<table cellspacing="0" style="border-collapse:collapse;width:auto;margin:10px 0;">`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid #d1d5db;padding:6px 10px;">&nbsp;</td>`;
      }
      html += `</tr>`;
    }
    html += `</table>`;
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setTableDialog((p) => ({ ...p, open: false }));
  };

  const insertTableRow = (above: boolean) => {
    const ctx = getTableCellContext();
    if (!ctx) return;

    const { table, row } = ctx;
    const maxCols = getMaxColumns(table);
    const newRow = table.insertRow(row.rowIndex + (above ? 0 : 1));

    // สร้าง cell ให้จำนวนเท่ากับ max
    for (let i = 0; i < maxCols; i++) {
      const td = newRow.insertCell();
      td.style.border = "1px solid #d1d5db";
      td.style.padding = "6px 10px";
      td.innerHTML = "&nbsp;";
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertTableColumn = (before: boolean) => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    const { table, row, cell } = ctx;
    // ตำแหน่งแทรก: ถ้า before → แทรกหน้าตำแหน่ง cell, ถ้า after → แทรกหลัง cell
    const colCellIdx = Array.from(row.cells).indexOf(cell) + (before ? 0 : 1);

    for (const r of Array.from(table.rows)) {
      const td = r.insertCell();
      td.style.border = "1px solid #d1d5db";
      td.style.padding = "6px 10px";
      td.innerHTML = "&nbsp;";
      // ย้าย cell ไปยังตำแหน่งที่ถูกต้องเสมอ (ทั้ง before และ after)
      r.insertBefore(td, r.cells[colCellIdx] || null);
    }

    // ◉ อัปเดต <colgroup> ให้มี <col> ครบตามจำนวนคอลัมน์ใหม่ และคง width ของ col เดิมไว้
    const colgroup = table.querySelector(":scope > colgroup");
    if (colgroup) {
      let colCount = 0;
      for (const rr of Array.from(table.rows)) {
        let n = 0;
        for (const cc of Array.from(rr.cells)) n += cc.colSpan;
        colCount = Math.max(colCount, n);
      }
      const cols = Array.from(colgroup.querySelectorAll(":scope > col"));
      while (cols.length < colCount) {
        const c = document.createElement("col");
        c.style.width = "auto";
        colgroup.appendChild(c);
        cols.push(c);
      }
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const deleteTableRow = () => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    ctx.row.remove();
    // ถ้าลบแถวสุดท้ายแล้ว table ว่าง → ลบ table ทิ้ง
    if (ctx.table.rows.length === 0) ctx.table.remove();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const deleteTableColumn = () => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    const { table, row, cell } = ctx;
    const colCellIdx = Array.from(row.cells).indexOf(cell);

    // ลบ cell idx เดียวกันจากทุกแถว
    for (const r of Array.from(table.rows)) {
      const target = r.cells[colCellIdx];
      if (target) target.remove();
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const deleteTable = () => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    ctx.table.remove();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

 // const tableButtonCls ="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700";

  // ===========================================================================
  //  Table: cell selection (Excel-style shift+click), merge/split, color
  // ===========================================================================

  // สร้าง "grid จริง" ของ cell (expanded โดย colSpan/rowSpan) สำหรับหาตำแหน่ง (r,c)
  const buildGrid = (
    table: HTMLTableElement
  ): { table: HTMLTableElement; rows: number; cols: number; grid: (HTMLTableCellElement | null)[][] } => {
    // นับจำนวนคอลัมน์จริง
    const rows = table.rows.length;
    let cols = 0;
    for (const row of Array.from(table.rows)) {
      let colCount = 0;
      for (const cell of Array.from(row.cells)) colCount += cell.colSpan;
      cols = Math.max(cols, colCount);
    }
    // สร้าง grid เติม null
    const grid: (HTMLTableCellElement | null)[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(null)
    );
    for (let r = 0; r < rows; r++) {
      let c = 0;
      for (const cell of Array.from(table.rows[r].cells)) {
        while (c < cols && grid[r][c] !== null) c++;
        for (let dr = 0; dr < cell.rowSpan; dr++) {
          for (let dc = 0; dc < cell.colSpan; dc++) {
            if (r + dr < rows && c + dc < cols) grid[r + dr][c + dc] = cell;
          }
        }
        c += cell.colSpan;
      }
    }
    return { table, rows, cols, grid };
  };

  // หา anchor (cell แรก) จากการคลิกใน cell — เก็บ range ให้แทน
  const captureAnchorFromSelection = () => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    const { table, cell } = ctx;
    const { grid, rows, cols } = buildGrid(table);
    // หา (r,c) ของ cell นี้
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === cell) {
          selectedBlockRef.current = { table, r1: r, c1: c, r2: r, c2: c };
          return;
        }
      }
    }
  };

  // เมื่อ shift+click ใน cell เป้าหมาย → ขยาย block ถึง cell นั้น
  const extendBlockToCellAt = (
    ctx: { cell: HTMLTableCellElement; row: HTMLTableRowElement; table: HTMLTableElement } | null
  ) => {
    const anchor = selectedBlockRef.current;
    if (!anchor || !ctx || ctx.table !== anchor.table) return;
    const { grid, rows, cols } = buildGrid(ctx.table);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === ctx.cell) {
          selectedBlockRef.current = {
            ...anchor,
            r2: r,
            c2: c,
            table: ctx.table,
          };
          return;
        }
      }
    }
  };

  // ทำ highlight selection บน block ผ่าน class-based outline (ใช้ data attr)
  const applyBlockHighlight = () => {
    // เคลียร์ของเก่าก่อน
    if (editorRef.current) {
      editorRef.current.querySelectorAll("[data-sel-mark='1']").forEach((el) =>
        el.removeAttribute("data-sel-mark")
      );
    }
    const blk = selectedBlockRef.current;
    if (!blk) return;
    const { grid } = buildGrid(blk.table);
    const marks = new Set<HTMLTableCellElement>();
    const r1 = Math.min(blk.r1, blk.r2), r2 = Math.max(blk.r1, blk.r2);
    const c1 = Math.min(blk.c1, blk.c2), c2 = Math.max(blk.c1, blk.c2);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = grid[r][c];
        if (cell) marks.add(cell);
      }
    }
    marks.forEach((cell) => cell.setAttribute("data-sel-mark", "1"));
  };

  const clearBlockSelection = () => {
    selectedBlockRef.current = null;
    if (editorRef.current) {
      editorRef.current.querySelectorAll("[data-sel-mark='1']").forEach((el) =>
        el.removeAttribute("data-sel-mark")
      );
    }
  };

  // ── Image resize: อัปเดตตำแหน่งกรอบของรูปที่เลือกเพื่อวาด handles ──
  const updateImgBox = () => {
    const img = selectedImgRef.current;
    if (!img) { setImgBox(null); return; }
    const r = img.getBoundingClientRect();
    const er = editorRef.current?.getBoundingClientRect();
    if (!er) return;
    setImgBox({
      left: r.left - er.left,
      top: r.top - er.top,
      width: r.width,
      height: r.height,
    });
  };

  const onImgResizeMove = (e: MouseEvent) => {
    const st = imgResizeRef.current;
    if (!st) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    let w = st.startW, h = st.startH;
    if (st.dir.includes("e")) w = st.startW + dx;
    if (st.dir.includes("s")) h = st.startH + dy;
    if (st.dir.includes("w")) w = st.startW - dx;
    if (st.dir.includes("n")) h = st.startH - dy;
    // รักษาสัดส่วน ตอนกด shift
    if (e.shiftKey) {
      const ratio = st.startW / st.startH;
      if (st.dir.includes("e")) { h = w / ratio; }
      else if (st.dir.includes("w")) { h = w / ratio; }
      else if (st.dir.includes("s")) { w = h * ratio; }
      else if (st.dir.includes("n")) { w = h * ratio; }
    }
    w = Math.max(20, w);
    h = Math.max(20, h);
    const img = st.img;
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    img.style.maxWidth = "none"; // กันไม่ให้ถูกจำกัดจาก prose
    updateImgBox();
  };

  const onImgResizeUp = () => {
    imgResizeRef.current = null;
    window.removeEventListener("mousemove", onImgResizeMove);
    window.removeEventListener("mouseup", onImgResizeUp);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const clearImgSelection = () => {
    selectedImgRef.current = null;
    setImgBox(null);
  };

      // ===========================================================================
  //  Image Drag-Move ภายใน Editor (ย้ายตำแหน่งรูป เข้า/ออก Table ได้)
  // ===========================================================================
  //  หมายเหตุ: ใช้ custom mouse drag แทน HTML5 DnD เพราะ mousedown บนรูป
  //  มี e.preventDefault() (กัน native drag / text selection) ทำให้ onDragStart
  //  ของ HTML5 DnD ไม่ถูกเรียก → เลยต้องจัดการด้วย mouse event เอง
  //
  //  หลักการ:
  //  - mousedown บนรูป → เริ่ม "ติดตามการลาก" (จับ startX/startY + ref รูป)
  //  - mousemove (window) → ถ้าขยับเกิน 5px ถือว่า "กำลังลาก" (ทำให้รูปโปร่งแสง)
  //  - mouseup (window) → หาตำแหน่ง cursor จากพิกัดเมาส์ แล้ว insertHTML รูปใหม่
  //     พร้อมลบรูปต้นฉบับ (ย้ายจริง) — รองรับการวางทั้งใน cell และนอก cell
  //
  //  จุดเริ่มต้นตั้งค่าไว้ใน handleEditorMouseDown (ตอนคลิกที่ img)
    const onImgDragMove = (e: MouseEvent) => {
    const st = imgDragRef.current;
    const editor = editorRef.current;
    if (!st || !editor) return;

    // ขยับเกิน 5px → เริ่มลากจริง (กันการกดคลิกเฉยๆ)
    if (!st.dragging) {
      const dx = Math.abs(e.clientX - st.startX);
      const dy = Math.abs(e.clientY - st.startY);
      if (dx + dy < 5) return;
      st.dragging = true;
      // Visual feedback: รูปต้นฉบับโปร่งแสง + cursor grabbing
      st.img.style.opacity = "0.4";
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      clearImgSelection(); // ซ่อน overlay resize ขณะลาก

      // สร้าง "ghost" (รูปโปร่งแสง) ตามเมาส์ แทนภาพ native drag
      const ghost = document.createElement("img");
      ghost.src = st.img.currentSrc || st.img.src;
      ghost.draggable = false;
      ghost.style.cssText =
        "position:fixed;top:0;left:0;z-index:99999;pointer-events:none;" +
        "opacity:0.65;border:1px dashed #3b82f6;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.15);";
      // รักษาขนาดที่เลือกไว้ (width/height เดิม)
      const w = parseFloat(st.img.style.width) || st.img.getBoundingClientRect().width;
      const h = parseFloat(st.img.style.height) || st.img.getBoundingClientRect().height;
      ghost.style.width = `${w}px`;
      ghost.style.height = `${h}px`;
      document.body.appendChild(ghost);
      dragGhostRef.current = ghost;

                  // สร้าง "indicator" เส้นบอกตำแหน่งแทรก (ใน flow) อยู่ภายใน editor
      const bar = document.createElement("div");
      bar.className = "kms-dropbar";
      bar.style.cssText =
        "position:absolute;left:0;top:0;height:3px;z-index:40;pointer-events:none;" +
        "background:#3b82f6;box-shadow:0 0 0 1px #fff;border-radius:2px;";
      editor.appendChild(bar);
      dropBarRef.current = bar;
    }

    // ย้าย ghost ตามเมาส์ (ชดเชยเล็กน้อย เพื่อไม่บัง cursor)
    if (dragGhostRef.current) {
      dragGhostRef.current.style.left = `${e.clientX + 12}px`;
      dragGhostRef.current.style.top = `${e.clientY - 12}px`;
    }

    // อัปเดต indicator ตำแหน่งที่จะแทรก (ทั้งแนวตั้งและแนวนอน)
    updateDropIndicator(e.clientX, e.clientY);
  };

    // ── อัปเดต "เส้น indicator" ว่ากำลังจะแทรก (ใน flow) ที่ตำแหน่งไหน ──
    const updateDropIndicator = (cx: number, cy: number) => {
        cx = cx;
      const editor = editorRef.current;
      const bar = dropBarRef.current;
      if (!editor || !bar) return;

      const er = editor.getBoundingClientRect();

      // หา block ที่อยู่ "เหนือ" จุด drop → วาดเส้นแนวนอนไว้ที่ขอบล่าง
      let anchor: HTMLElement | null = null;
      const blocks = Array.from(editor.children) as HTMLElement[];
      for (const b of blocks) {
        if (b.className && b.className.split(" ").includes("kms-dropbar")) continue; // ข้ามตัว indicator เอง
        if (b.contains(dragGhostRef.current)) continue;
        const r = b.getBoundingClientRect();
        if (r.top + r.height / 2 <= cy) anchor = b;
        else break;
      }
      let y: number;
      if (anchor) {
        const ar = anchor.getBoundingClientRect();
        y = ar.bottom - er.top;
      } else {
        y = 0;
      }

      // วาดเส้นแนวนอน (เต็มความกว้าง) ที่ตำแหน่งแทรก
      bar.style.display = "block";
      bar.style.left = "0px";
      bar.style.top = `${Math.round(y)}px`;
      bar.style.width = `${editor.clientWidth}px`;
      bar.style.height = "3px";
    };

  // วางภาพที่ตำแหน่ง cursor (ย้ายรูปไปตำแหน่งใหม่)
  const onImgDragUp = (e: MouseEvent) => {
    const st = imgDragRef.current;
    imgDragRef.current = null;
    window.removeEventListener("mousemove", onImgDragMove);
    window.removeEventListener("mouseup", onImgDragUp);
    if (!st) return;

        // คืนค่า visual หลังลาก
    st.img.style.opacity = "";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    clearDragVisual();

    // ถ้าแค่คลิก (ไม่ได้ลาก) → ให้ selection รูปค้างไว้ (เป็น behavior เดิม)
    if (!st.dragging) return;

    const editor = editorRef.current;
    if (!editor) return;

    // ถ้าวางนอกพื้นที่ editor → ยกเลิก (รูปอยู่ที่เดิม)
    const er = editor.getBoundingClientRect();
    if (
      e.clientX < er.left || e.clientX > er.right ||
      e.clientY < er.top || e.clientY > er.bottom
    ) return;

        const { img } = st;
        const src = img.currentSrc || img.src;
        const width = img.style.width || (img.getAttribute("width") || "");
        const height = img.style.height || (img.getAttribute("height") || "");

        let styleAttr = "max-width:100%;";
        if (width) styleAttr += `width:${width};`;
        if (height) styleAttr += `height:${height};`;
        if (img.getAttribute("srcset")) styleAttr += `srcset:${img.getAttribute("srcset")};`;
        const imgHtml = `<img src="${src}" style="${styleAttr}" draggable="false" />`;

        // ─────────────────────────────────────────────────────────────
        // แทรกรูป "ในช่องว่าง/flow" (ไม่ทับ/บังข้อความ)
        //   • ใช้ caretRangeFromPoint หาตำแหน่งแทรก ณ พิกัดที่ปล่อย
        //     → รูปถูกแทรกเป็น inline ใน flow (วางได้ตามแนวข้อความ ไม่บัง)
        //   • ถ้าเป็นที่ว่างระหว่างย่อหน้า → สร้าง <p> ใหม่ (รูปเป็นย่อหน้าของตนเอง)
        //   • ไม่ลบ/แก้ block อื่นใดใน editor เลย → video/ข้อความไม่หาย
        // ─────────────────────────────────────────────────────────────
        editor.focus();

        // วาง cursor ที่จุด drop
        let insertRange: Range | null = null;
        if (document.caretRangeFromPoint) {
          insertRange = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if ((document as any).caretPositionFromPoint) {
          const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
          if (pos) {
            insertRange = document.createRange();
            insertRange.setStart(pos.offsetNode, pos.offset);
            insertRange.collapse(true);
          }
        }

        const rangeOk =
          insertRange &&
          insertRange.startContainer &&
          editor.contains(insertRange.startContainer) &&
          insertRange.startContainer !== editor;

        if (rangeOk) {
          // ◉ แทรกรูปเป็น inline ที่ cursor (อยู่ใน flow เดียวกับข้อความ)
          //    ใส่ zero-width space (U+200B) คั่นหน้า/หลังรูป เพื่อให้วาง cursor
          //    แล้วพิมพ์ข้อความได้ทั้งหน้าและหลังรูป
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(insertRange!);
          document.execCommand("insertHTML", false, `\u200B${imgHtml}\u200B`);

          // ลบรูปต้นฉบับ (ย้ายจริง)
          if (img && img.isConnected) img.remove();
          onChange(editor.innerHTML);
          clearImgSelection();
          return;
        }

        // ◉ ปล่อยในที่ว่าง (ไม่มี text node ตรงจุด) → แทรกเป็น <p> ใหม่ ระหว่าง block
        const blocks = Array.from(editor.children) as HTMLElement[];
        let anchor: HTMLElement | null = null;
        for (const b of blocks) {
          if (b.contains(img)) continue;
          const r = b.getBoundingClientRect();
          if (r.top + r.height / 2 <= e.clientY) anchor = b;
          else break;
        }
                const newBlock = document.createElement("p");
        newBlock.style.margin = "8px 0";
        // ◉ <br> คั่นท้าย + ZWSP คั่นหน้า/หลังรูป ให้วาง cursor พิมพ์ได้ทั้งหน้า/หลัง
        //    (ไม่มี <br> → cursor วางไม่ง่าย เพราะคลิกโดนรูปตลอด)
        newBlock.innerHTML = `\u200B${imgHtml}\u200B<br/>`;
        if (!anchor) {
          editor.insertBefore(newBlock, editor.firstChild);
        } else {
          anchor.after(newBlock);
        }

        // วาง cursor ต่อท้ายรูป (หลัง <br>) ให้พิมพ์ข้อความตามได้ทันที
        const insertedImg = newBlock.querySelector("img");
        if (insertedImg) {
          const range = document.createRange();
          range.setStartAfter(insertedImg); // ระหว่าง img กับ <br> → พิมพ์ต่อท้ายรูปในบรรทัดเดียวกัน
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          editor.focus();
        }

        // ลบรูปต้นฉบับ (ย้ายจริง)
        if (img && img.isConnected) img.remove();

        onChange(editor.innerHTML);
        clearImgSelection();
  };

  // ── ล้าง visual ขณะลาก (ghost + indicator) ──
  const clearDragVisual = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
    if (dropBarRef.current) {
      dropBarRef.current.remove();
      dropBarRef.current = null;
    }
  };

  // อนุญาตให้วางไฟล์/HTML/Text จากภายนอกได้ (ลากมาจากนอก editor)
  const handleEditorDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

    // จัดการการวางเนื้อหาจากภายนอก (ไฟล์/HTML/Text) → แทรกเข้า editor
  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const editor = editorRef.current;
    if (!editor) return;

    // ▸ กรณีลากมาจากภายนอก (ไฟล์/HTML/Text) → แทรกใหม่
    const { files } = e.dataTransfer;
    if (files && files.length) {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            const styleAttr = "max-width:100%;";
            const data = typeof reader.result === "string" ? reader.result : "";
            document.execCommand("insertHTML", false, `<img src="${data}" style="${styleAttr}" draggable="false" />`);
            onChange(editorRef.current.innerHTML);
          };
          reader.readAsDataURL(file);
        }
      }
      return;
    }

    const html = e.dataTransfer.getData("text/html");
    const text = e.dataTransfer.getData("text/plain");
    if (html) {
      // ลบ wrapper ที่ไม่จำเป็น แล้ว insert HTML ที่ถูกต้องลงไป
      const trimmed = html.trim();
      editor.focus();
      document.execCommand("insertHTML", false, trimmed);
      onChange(editor.innerHTML);
    } else if (text) {
      editor.focus();
      document.execCommand("insertText", false, text);
      onChange(editor.innerHTML);
    }
  };

  // Handler: คลิกใน editor -> จับว่าเป็น cell-table หรือไม่
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // ถ้าคลิกที่ img → เลือกรูป (ถ้ายังไม่ถูก mousedown จัดการ)
    if ((e.target as HTMLElement).closest?.("img")) {
      const img = (e.target as HTMLElement).closest("img") as HTMLImageElement;
      selectedImgRef.current = img;
      updateImgBox();
      return;
    }
    // ถ้าคลิกตำแหน่งว่างใน editor → เคลียร์การเลือกรูป
    if (!(e.target as HTMLElement).closest(".img-resize-overlay")) {
      clearImgSelection();
    }
    // ถ้าคลิกนอกตาราง → เคลียร์ selection
    const inTable = !!(e.target as HTMLElement).closest("table");
    if (!inTable) {
      clearBlockSelection();
      return;
    }
    // shift+click มีการจัดการใน mousedown แล้ว — อย่า overwrite
    if (e.shiftKey) return;
    captureAnchorFromSelection();
    applyBlockHighlight();
  };

  // หา cell โดยตรงจาก target ของ event (แม่นกว่าการอ่าน selection ตอน mousedown)
  const cellFromTarget = (target: EventTarget | null): {
    cell: HTMLTableCellElement;
    row: HTMLTableRowElement;
    table: HTMLTableElement;
  } | null => {
    const cell = (target as HTMLElement)?.closest?.("td, th") as HTMLTableCellElement | null;
    if (!cell) return null;
    const row = cell.closest("tr") as HTMLTableRowElement | null;
    const table = cell.closest("table") as HTMLTableElement | null;
    if (!row || !table) return null;
    return { cell, row, table };
  };

  // Handler: mousedown บน editor — ลาก resize ที่ขอบ cell / ลาก resize รูปภาพ
  const handleEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // ◉ ถ้ากำลังลาก resize รูปอยู่ (จับจุดฉุดของรูป) → เริ่ม resize รูป
    if (imgResizeRef.current) return;

    // ถ้าคลิกที่จุดฉุด resize รูป (ใน overlay) → เริ่ม drag resize รูป
    const handleEl = (e.target as HTMLElement).closest?.("[data-img-handle]") as HTMLElement | null;
    if (handleEl && selectedImgRef.current) {
      const dir = handleEl.getAttribute("data-img-handle") as
        "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
      const rect = selectedImgRef.current.getBoundingClientRect();
      imgResizeRef.current = {
        img: selectedImgRef.current,
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: rect.width,
        startH: rect.height,
      };
      e.preventDefault();
      e.stopPropagation();
      window.addEventListener("mousemove", onImgResizeMove);
      window.addEventListener("mouseup", onImgResizeUp);
      return;
    }

        // ถ้าคลิกที่ img → เลือกรูป + เริ่ม "ติดตามการลากย้ายรูป"
    if ((e.target as HTMLElement).closest?.("img")) {
      const img = (e.target as HTMLElement).closest("img") as HTMLImageElement;
      selectedImgRef.current = img;
      updateImgBox();
      // เริ่ม tracking การลาก (คลิกเฉยๆ จะไม่ลาก ถ้าไม่ขยับเมาส์เกิน 5px)
      imgDragRef.current = {
        img,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false,
      };
      window.addEventListener("mousemove", onImgDragMove);
      window.addEventListener("mouseup", onImgDragUp);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // ถ้าอยู่ที่ขอบ cell → เริ่ม resize cell
    const cctx = cellFromTarget(e.target);
    if (cctx) {
      const started = beginResizeIfNearEdgeOn(cctx, e);
      if (started) {
        e.preventDefault();
        e.stopPropagation();
        window.addEventListener("mousemove", onResizeMove);
        window.addEventListener("mouseup", onResizeUp);
        return;
      }
    }
    // shift+click -> ขยาย block
    if (e.shiftKey) {
      e.preventDefault(); // ป้องกัน browser เลือก text
      extendBlockToCellAt(cctx);
      applyBlockHighlight();
    }
  };

  // ◾ Right-click บน cell/table → เปิด context menu (table actions + border + fill)
  const handleTableContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest?.("td, th");
    if (!cell) return; // คลิกขวาที่ไม่ใช่ cell → ปิดเมนู
    e.preventDefault(); // ห้ามแสดง context menu ของเบราว์เซอร์

        // เก็บ cell ที่คลิกขวา ไว้ใช้กับ single-cell (กรณีไม่มี block selection)
        const td = cell as HTMLTableCellElement;
        ctxMenuCellRef.current = td;

    // ◉ ถ้ามี block selection (shift+select) อยู่ → ให้ context menu ทำงานกับทั้ง block
    //    (merge / border / fill จะใช้ selectedBlockRef ทำงานกับทั้งบล็อกที่เลือกไว้)
    if (selectedBlockRef.current) {
      // ตรวจว่า cell ที่คลิกขวาอยู่ในตารางเดียวกับ block ที่เลือกหรือไม่
      const blk = selectedBlockRef.current;
      if (blk.table.contains(td)) {
        // วาง cursor ใน cell ที่คลิกขวา (เพื่อให้ getTableCellContext ยังได้ cell นี้)
        const range = document.createRange();
        range.setStart(td, 0);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        editorRef.current?.focus();
        setTableContextMenu({ x: e.clientX, y: e.clientY });
        return;
      }
      // คลิกขวาที่ย้ายไปตารางอื่น → เคลียร์ block เดิม แล้วใช้ cell เดียว
      clearBlockSelection();
    }

    // ✘ ไม่มี block selection → วาง cursor ที่ cell ที่คลิกขวา (ใช้กับ cell เดียว)
    clearImgSelection();
    const range = document.createRange();
    range.setStart(td, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    editorRef.current?.focus();

    setTableContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Handler: mouseover – เปลี่ยน cursor เป็น resize เมื่อชิดขอบขวา/ซ้าย/ล่างของ cell
    const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // ถ้ากำลังลาก resize อยู่ หรือกำลังลากย้ายรูป ไม่ต้องยุ่ง
    if (resizeStateRef.current) return;
    if (imgDragRef.current?.dragging) return;
    const cctx = cellFromTarget(e.target);
    if (!cctx) { document.body.style.cursor = ""; return; }
    const rect = cctx.cell.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const threshold = 8;
    const nearRight = rect.width - offsetX < threshold;
    const nearBottom = rect.height - offsetY < threshold;
    const nearLeft = offsetX < threshold;
    if (nearRight || nearLeft) document.body.style.cursor = "col-resize";
    else if (nearBottom) document.body.style.cursor = "row-resize";
    else document.body.style.cursor = "";
  };

  // ================= Merge / Split =================

  const mergeSelectedCells = () => {
    const blk = selectedBlockRef.current;
    if (!blk) return;
    const { grid } = buildGrid(blk.table);
    const r1 = Math.min(blk.r1, blk.r2), r2 = Math.max(blk.r1, blk.r2);
    const c1 = Math.min(blk.c1, blk.c2), c2 = Math.max(blk.c1, blk.c2);
    const colsSpan = c2 - c1 + 1;
    const rowsSpan = r2 - r1 + 1;

    const target = grid[r1][c1];
    if (!target) return;

    // รวบรวม cell ที่จะถูกลบ (ใน block, ไม่ใช่ target)
    const toRemove = new Set<HTMLTableCellElement>();
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = grid[r][c];
        if (cell && cell !== target) toRemove.add(cell);
      }
    }

    // ถ้า target เป็น part ของ merge เดิมอยู่แล้ว กันไม่ให้เกิด overlap
    // ตรวจ block ทับไปยัง neighboring cell ที่มี span เกิน block
    target.colSpan = colsSpan;
    target.rowSpan = rowsSpan;

    toRemove.forEach((cell) => cell.remove());

    // เก็บข้อความที่เหลือมารวม (Optional: concat text)
    clearBlockSelection();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const splitCellAtCursor = () => {
    const ctx = getTableCellContext();
    if (!ctx) return;
    const { cell, table } = ctx;
    const cs = cell.colSpan, rs = cell.rowSpan;
    if (cs === 1 && rs === 1) return; // ไม่มี span → ไม่ต้อง split

    // หาตำแหน่งเริ่มต้น (startRow, startCol) ที่ cell นี้เริ่ม ใน grid จริง
    const { grid, rows, cols } = buildGrid(table);
    let startRow = -1, startCol = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === cell) { startRow = r; startCol = c; break; }
      }
      if (startRow >= 0) break;
    }
    if (startRow < 0 || startCol < 0) return;

    const html = cell.innerHTML;
    const styleBorder = "border:1px solid #d1d5db;padding:6px 10px;";
    const origTag = cell.tagName; // "TD" หรือ "TH"

    // เก็บข้อความเดิมไว้ที่ cell แรก
    const mkCell = (isFirst: boolean): HTMLTableCellElement => {
      const td = document.createElement(origTag) as HTMLTableCellElement;
      td.style.cssText = styleBorder;
      td.innerHTML = isFirst ? html : "&nbsp;";
      return td;
    };

    // ใช้ข้อเท็จจริงว่า cell ที่ merge เป็น rectangular ใน grid
    // วาง cell เดี่ยว cs ตัวในแต่ละแถว rs ที่ cell ครอบคลุม
    cell.remove();

    // จำนวน cell ที่ควรต้องใส่ต่อแถว ให้ตารางคงรูป
    // แต่ละแถวที่ cell ผ่าน จะมี cs cell เดี่ยว
    for (let rr = 0; rr < rs; rr++) {
      const tr = table.rows[startRow + rr];
      if (!tr) break;
      // หาตำแหน่งแทรก: นับ colSpan ก่อนตัว startCol ใน grid
      // ทำแบบง่าย: แทรก cell ทุกตัวที่ startCol (หลัง cell ก่อนหน้า)
      const insertIdx = Math.min(startCol, tr.cells.length);
      for (let cc = 0; cc < cs; cc++) {
        const td = mkCell(rr === 0 && cc === 0);
        tr.insertBefore(td, tr.cells[insertIdx]);
      }
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // ================= Color ของ cell/row/col =================
  const applyTableColor = (color: string) => {
    const blk = selectedBlockRef.current;
    const ctx = getTableCellContext();
    const mode = tableColorTarget;
    const cells = new Set<HTMLTableCellElement>();

    if (mode === "row" && ctx) {
      Array.from(ctx.row.cells).forEach((c) => cells.add(c));
    } else if (mode === "col" && ctx) {
      const { grid, rows, cols } = buildGrid(ctx.table);
      // หา col ของ cursor
      for (let c = 0; c < cols; c++) {
        if (grid[ctx.row.rowIndex]?.[c] === ctx.cell) {
          for (let r = 0; r < rows; r++) {
            if (grid[r][c]) cells.add(grid[r][c] as HTMLTableCellElement);
          }
          break;
        }
      }
    } else if (mode === "cell" && blk) {
      // ใช้ block selection หรือ cell เดียว
      const { grid } = buildGrid(blk.table);
      const r1 = Math.min(blk.r1, blk.r2), r2 = Math.max(blk.r1, blk.r2);
      const c1 = Math.min(blk.c1, blk.c2), c2 = Math.max(blk.c1, blk.c2);
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) {
          const cell = grid[r][c];
          if (cell) cells.add(cell);
        }
    } else if (mode === "cell" && ctx) {
      cells.add(ctx.cell);
    }

    cells.forEach((cell) => { cell.style.backgroundColor = color; });
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    //setShowTableColorPicker(false);
    applyBlockHighlight();
  };

  // ================= จัดตำแหน่งข้อความใน cell (ซ้าย/กลาง/ขวา) =================
  // ใช้ block selection (shift+click) เป็นหลัก เหมือนฟีเจอร์ fill color
  // รองรับทั้ง: จัดข้อความใน cell และ จัดรูปภาพที่ถูกเลือกอยู่
  const alignSelectedCells = (align: "left" | "center" | "right") => {
    // ◉ ถ้ากำลังเลือกรูปอยู่ → จัดตำแหน่งรูป (ใน cell ใช้ text-align ของ cell / นอก cell ใช้ margin)
    const img = selectedImgRef.current;
    if (img) {
      const cell = img.closest("td, th") as HTMLElement | null;
      if (cell) {
        // อยู่ใน cell: จัดผ่าน text-align ของ cell + รูปเป็น inline-block
        img.style.display = "inline-block";
        img.style.margin = "0";
        img.style.float = "none";
        cell.style.textAlign = align;
      } else {
        // อยู่นอกตาราง: ใช้ display:block + margin เพื่อจัดกลาง/ขวา
        img.style.display = "block";
        img.style.float = "none";
        if (align === "center") img.style.margin = "0 auto";
        else if (align === "right") img.style.margin = "0 0 0 auto";
        else img.style.margin = "0";
      }
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      updateImgBox();
      return;
    }

    const blk = selectedBlockRef.current;
    const ctx = getTableCellContext();
    const cells = new Set<HTMLTableCellElement>();

    if (blk) {
      // มี block selection → ปรับทั้ง block
      const { grid } = buildGrid(blk.table);
      const r1 = Math.min(blk.r1, blk.r2), r2 = Math.max(blk.r1, blk.r2);
      const c1 = Math.min(blk.c1, blk.c2), c2 = Math.max(blk.c1, blk.c2);
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) {
          const cell = grid[r][c];
          if (cell) cells.add(cell);
        }
    } else if (ctx) {
      // ไม่มี block → ปรับ cell ปัจจุบันที่ cursor อยู่
      cells.add(ctx.cell);
    }

    cells.forEach((cell) => { cell.style.textAlign = align; });
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // ============ ปรับ Border style/width/color ให้ cell (เลือก block หรือ cell ปัจจุบัน) ============
  const applyTableBorder = (
    style: string,
    width: number,
    color: string
  ) => {
    const blk = selectedBlockRef.current;
    const ctx = getTableCellContext();
    const cells = new Set<HTMLTableCellElement>();

    if (blk) {
      // มี block selection → ปรับทั้ง block
      const { grid } = buildGrid(blk.table);
      const r1 = Math.min(blk.r1, blk.r2), r2 = Math.max(blk.r1, blk.r2);
      const c1 = Math.min(blk.c1, blk.c2), c2 = Math.max(blk.c1, blk.c2);
      for (let r = r1; r <= r2; r++)
        for (let c = c1; c <= c2; c++) {
          const cell = grid[r][c];
          if (cell) cells.add(cell);
        }
    } else if (ctx) {
      // ไม่มี block → ปรับ cell ปัจจุบันที่ cursor อยู่
      cells.add(ctx.cell);
    }

    cells.forEach((cell) => {
      cell.style.borderStyle = style === "none" ? "none" : style;
      if (style !== "none") {
        cell.style.borderWidth = `${width}px`;
        cell.style.borderColor = color;
      }
    });
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // ===========================================================================
  //  Table: Resize (drag) — ตัวจับที่ขอบขวา/ล่างของ cell
  // ===========================================================================

  const resizeStateRef = useRef<{
    cell: HTMLTableCellElement;
    row: HTMLTableRowElement;
    table: HTMLTableElement;
    mode: "col" | "row";
    colIdx: number;      // grid col ที่ resize อยู่
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // หา grid col index ของ cell (รองรับ colspan/rowspan) โดยใช้ buildGrid
  const getCellStartCol = (table: HTMLTableElement, cell: HTMLTableCellElement): number => {
    const { grid, rows, cols } = buildGrid(table);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === cell) return c;
      }
    }
    return 0;
  };

  // เริ่ม resize: ตรวจว่า pointer อยู่ใกล้ขอบขวา/ล่างของ cell แค่ไหน (ใน resize mode)
  const beginResizeIfNearEdgeOn = (
    ctx: { cell: HTMLTableCellElement; row: HTMLTableRowElement; table: HTMLTableElement },
    e: React.MouseEvent
  ) => {
    const rect = ctx.cell.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const threshold = 8;
    const nearRight = rect.width - offsetX < threshold;
    const nearBottom = rect.height - offsetY < threshold;
    const nearLeft = offsetX < threshold;   // รองรับการลากจากขอบซ้ายด้วย

    // เลือก mode ตามที่ใกล้ขอบสุด (มองทั้งขอบขวา/ซ้าย/ล่าง)
    if (nearRight || nearBottom || nearLeft) {
      const mode =
        (nearRight && rect.width - offsetX < offsetY) ||
          (nearLeft && offsetX < offsetY)
          ? "col"
          : "row";
      // lock layout เพื่อให้ width/height ที่ set เป็นไปตามที่ลากได้จริง
      ctx.table.style.tableLayout = "fixed";
      let colIdx = getCellStartCol(ctx.table, ctx.cell);
      // ถ้าจับขอบซ้าย → resize คอลัมน์ทางซ้ายของ cell นี้
      if (nearLeft && !nearRight) {
        colIdx = Math.max(0, colIdx - 1);
      }

      // หา width ปัจจุบันของคอลัมน์ที่จะ resize (colIdx) จาก grid จริง
      // ใช้เป็น startW เพื่อให้ resize ไปซ้าย/ขวาได้สมดุลทั้ง 2 ทิศ
      let startW = rect.width;
      if (mode === "col") {
        const { grid, rows } = buildGrid(ctx.table);
        let sum = 0, count = 0;
        for (let rr = 0; rr < rows; rr++) {
          const cell = grid[rr]?.[colIdx];
          if (cell) {
            const cr = (cell as HTMLTableCellElement).getBoundingClientRect();
            sum += cr.width;
            count++;
          }
        }
        if (count) startW = sum / count;
      }

      // ◉ ปลดล็อก width ที่ Excel ฝังไว้บน cell (ทำครั้งเดียวต่อ table ตรวจผ่าน data attr)
      //    เก็บ width ของ columns ที่ลากไปแล้วไว้บน <colgroup> ของเราให้ "ค้าง" ต่อเนื่อง
      if (mode === "col" && ctx.table.getAttribute("data-resize-unlocked") !== "1") {
        // ลบเฉพาะ width ที่ฝังบน cell (attribute + inline) แต่ไม่แตะ <colgroup> ที่เราสร้าง
        Array.from(ctx.table.rows).forEach((row) => {
          Array.from(row.cells).forEach((cell) => {
            cell.removeAttribute("width");
            cell.style.width = "";
            cell.style.minWidth = "0";
          });
        });
        ctx.table.style.tableLayout = "fixed";
        ctx.table.style.width = "";
        ctx.table.setAttribute("data-resize-unlocked", "1");
      }

      resizeStateRef.current = {
        cell: ctx.cell,
        row: ctx.row,
        table: ctx.table,
        mode,
        colIdx,
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH: rect.height,
      };
      document.body.style.cursor = mode === "col" ? "col-resize" : "row-resize";
      return true;
    }
    return false;
  };

  const onResizeMove = (e: MouseEvent) => {
    const rs = resizeStateRef.current;
    if (!rs) return;
    if (rs.mode === "col") {
      const delta = e.clientX - rs.startX;
      const newW = Math.max(40, rs.startW + delta);

      // หา/สร้าง <colgroup> (สร้างครั้งแรกตอนเริ่ม resize) แล้ว set width ของ col เป้า
      let colgroup = rs.table.querySelector<HTMLTableColElement>(":scope > colgroup");
      if (!colgroup) {
        colgroup = document.createElement("colgroup");
        let colCount = 0;
        for (const row of Array.from(rs.table.rows)) {
          let n = 0;
          for (const cell of Array.from(row.cells)) n += cell.colSpan;
          colCount = Math.max(colCount, n);
        }
        // บันทึก width ปัจจุบันของแต่ละคอลัมน์ "ค้าง" ไว้ที่ <col> ตั้งแต่ต้น
        // เพื่อให้ columns ที่ยังไม่ถูกลากคงขนาดเดิมไว้ (ไม่หดแคบจาก content)
        const { grid, rows, cols: gridCols } = buildGrid(rs.table);
        const colWidths: number[] = [];
        for (let ci = 0; ci < gridCols; ci++) {
          let sum = 0, cnt = 0;
          for (let ri = 0; ri < rows; ri++) {
            const cell = grid[ri]?.[ci];
            if (cell) { sum += (cell as HTMLTableCellElement).getBoundingClientRect().width; cnt++; }
          }
          colWidths.push(cnt ? sum / cnt : 0);
        }
        for (let i = 0; i < Math.max(colCount, 1); i++) {
          const c = document.createElement("col");
          if (colWidths[i]) c.style.width = `${Math.round(colWidths[i])}px`;
          colgroup.appendChild(c);
        }
        rs.table.insertBefore(colgroup, rs.table.firstChild);
      }
      const cols = Array.from(colgroup.querySelectorAll<HTMLTableColElement>(":scope > col"));
      const targetCol = cols[rs.colIdx];
      if (targetCol) targetCol.style.width = `${newW}px`;
    } else {
      const delta = e.clientY - rs.startY;
      const newH = Math.max(20, rs.startH + delta);
      // set height ให้ทุก cell ในแถวเดียวกัน (row resize)
      const startRow = rs.row.rowIndex;
      const { grid, cols: gridCols } = buildGrid(rs.table);
      const targets = new Set<HTMLTableCellElement>();
      for (let cc = 0; cc < gridCols; cc++) {
        const cell = grid[startRow]?.[cc];
        if (cell) targets.add(cell as HTMLTableCellElement);
      }
      targets.forEach((cell) => { cell.style.height = `${newH}px`; });
    }
  };

  const onResizeUp = () => {
    const rs = resizeStateRef.current;
    if (!rs) return;
    resizeStateRef.current = null;
    document.body.style.cursor = "";
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };











  //   const colorInputRef = useRef<HTMLInputElement>(null);

  //   const saveSelection = () => {
  //   const selection = window.getSelection();

  //   if (
  //     selection &&
  //     selection.rangeCount > 0 &&
  //     !selection.isCollapsed &&
  //     editorRef.current?.contains(selection.anchorNode)
  //   ) {
  //     savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  //   }
  // };
  // const openColorPicker = () => {
  //   // Save selection ก่อน
  //   saveSelection();

  //   // เปิด native color picker
  //   colorInputRef.current?.click();
  // };

  //   const restoreSelection = () => {
  //     if (!savedRangeRef.current) return;

  //     const selection = window.getSelection();

  //     selection?.removeAllRanges();
  //     selection?.addRange(savedRangeRef.current);
  //   };



  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#6b7280",
  ];

  const saveSelection = () => {
    const selection = window.getSelection();

    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      savedRangeRef.current = selection
        .getRangeAt(0)
        .cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return;

    const selection = window.getSelection();

    selection?.removeAllRanges();
    selection?.addRange(savedRangeRef.current);
  };











  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]); // intentionally only on mount

  // ◉ ปิด dropdown ทั้งหมด (font color / table action / border / fill color)
  //    เมื่อคลิกที่ใดก็ได้นอกเมนูหรือตัว toggle ปุ่มแต่ละตัว
  React.useEffect(() => {
        const closeAll = () => {
      setShowColorPicker(false);
      // setShowTableMenu(false);
      // setShowBorderMenu(false);
      // setShowTableColorPicker(false);
      setTableContextMenu(null);
    };
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // ไม่ปิดเมื่อคลิกภายใน toolbar dropdown หรือ context menu (table context menu)
      const insideAnyMenu =
        target.closest("[data-toolbar-dropdown]") !== null ||
        target.closest("[data-table-context-menu]") !== null;
      if (!insideAnyMenu) closeAll();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

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
        {/* 
        <label title="Font color" className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          <span className="relative">
            <span className="font-bold text-sm">A</span>
            <span className="absolute bottom-0 left-0 right-0 h-1 rounded-sm bg-rose-400" />
          </span>
          <input type="color" className="sr-only" onChange={(e) => exec("foreColor", e.target.value)} /> 
        </label> */}



        <div className="relative" data-toolbar-dropdown>
          <button
            type="button"
            title="Font color"
            onMouseDown={(e) => {
              e.preventDefault();
              // เก็บ Selection ก่อน
              saveSelection();
              setShowColorPicker((prev) => !prev);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <span className="relative">
              <span className="font-bold text-sm">A</span>
              <span className="absolute bottom-0 left-0 right-0 h-1 rounded-sm bg-rose-400" />
            </span>
          </button>

          {showColorPicker && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onMouseDown={(e) => {
                      e.preventDefault();

                      restoreSelection();

                      document.execCommand(
                        "foreColor",
                        false,
                        color
                      );

                      editorRef.current?.focus();

                      if (editorRef.current) {
                        onChange(editorRef.current.innerHTML);
                      }

                      setShowColorPicker(false);
                    }}
                    className="h-6 w-6 rounded-full border border-gray-300 hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 
<button
  type="button"
  title="Font color"
  onMouseDown={(e) => {
    e.preventDefault();
    saveSelection();
  }}
  onClick={openColorPicker}
  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
>
  <span className="relative">
    <span className="font-bold text-sm">AB</span>
    <span className="absolute bottom-0 left-0 right-0 h-1 rounded-sm bg-rose-400" />
  </span>
</button>

<input
  ref={colorInputRef}
  type="color"
className="sr-only" 
  onChange={(e) => {
    // Restore selection
    if (savedRangeRef.current) {
      const selection = window.getSelection();

      selection?.removeAllRanges();
      selection?.addRange(savedRangeRef.current);
    }

    // Apply color
    document.execCommand(
      "foreColor",
      false,
      e.target.value
    );

    // Focus กลับเข้า editor
    editorRef.current?.focus();

    // Update HTML
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }}
/> */}






        <Divider />

        <ToolbarBtn onClick={() => exec("bold")} title="Bold"><strong>B</strong></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic"><em>I</em></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("underline")} title="Underline"><span className="underline">U</span></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("strikethrough")} title="Strikethrough"><span className="line-through">S</span></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("subscript")} title="Subscript">x<sub>2</sub></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("superscript")} title="Superscript">x<sup>2</sup></ToolbarBtn>

        <Divider />

        {/* <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1h10a1 1 0 110 2H7a1 1 0 110-2z" /></svg>
        </ToolbarBtn> */}

        <ToolbarBtn onClick={() => execute("insertUnorderedList")} title="Bullet list">
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
            if (url) {
              exec("insertHTML", `<img src="${url}" style="max-width:100%;" draggable="false" />`);
            }
          }}
          title="Insert image"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => { saveSelection(); setVideoDialog({ open: true, url: "" }); }} title="Insert video">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal rule">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
        </ToolbarBtn>

        <Divider />

        {/* ============ Table controls ============ */}
        <ToolbarBtn
          onClick={() => {
            saveSelection();
            setTableDialog((p) => ({ ...p, open: true }));
          }}
          title="Insert table"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6zm0 4h16M9 10v8" /></svg>
        </ToolbarBtn>
        {/* Table actions dropdown (row/col/delete/merge/split) */}
        {/* <div className="relative" data-toolbar-dropdown>
          <button
            type="button"
            title="Table actions"
            onMouseDown={(e) => { e.preventDefault(); setShowTableMenu((p) => !p); }}
            className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v2h12V6H6zm12 4H6v2h12v-2zm0 4H6v2h12v-2z" clipRule="evenodd" /></svg>
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 7.5L10 12l4.5-4.5H5.5z" /></svg>
          </button>
          {showTableMenu && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              onMouseDown={(e) => e.preventDefault()}
            >
              {[
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h16v2H0zM0 7h16v2H0zM2 2h1v3H2zM13 2h1v3h-1zM2 7h1v4H2z" /></svg>, label: "Insert row above", fn: () => insertTableRow(true) },
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h1v3H2zM13 2h1v3h-1zM2 7h1v4H2zM13 7h1v4h-1zM0 12h16v2H0zM2 10h1v2H2z" /></svg>, label: "Insert row below", fn: () => insertTableRow(false) },
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h2v6H0zM7 0h2v6H7zM4 0h1v6H4zM11 0h1v6h-1zM14 0h2v16h-2z" /></svg>, label: "Insert col left", fn: () => insertTableColumn(true) },
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h2v16H0zM5 0h2v16H5zM10 0h1v16h-1zM13 0h2v16h-2zM5 0h1v6H5z" /></svg>, label: "Insert col right", fn: () => insertTableColumn(false) },
                { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4h22v16H1zM1 8h22M8 8v12" /></svg>, label: "Delete row", fn: () => deleteTableRow() },
                { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4h22v16H1zM1 8h22M8 8v12M8 4v16M8 8v12" /></svg>, label: "Delete column", fn: () => deleteTableColumn() },
                { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18v16H3zM3 4h18M3 8h18M11 8v12" /></svg>, label: "Delete table", fn: () => deleteTable() },
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h8v8H0zM8 8h8v8H8zM0 8h4v8H0zM8 0h4v8H8z" /></svg>, label: "Merge cells", fn: () => mergeSelectedCells() },
                { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h4v4H0zM4 0h4v4H4zM8 0h4v4H8zM0 4h6v4H0z" /></svg>, label: "Split cell", fn: () => splitCellAtCursor() },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    item.fn();
                    setShowTableMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div> */}

        {/* Border style dropdown */}
        {/* <div className="relative" data-toolbar-dropdown>
          <button
            type="button"
            title="Border style (cell/selection)"
            onMouseDown={(e) => { e.preventDefault(); setShowBorderMenu((p) => !p); }}
            className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 8h16M4 12h16M4 16h16" /></svg>
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 7.5L10 12l4.5-4.5H5.5z" /></svg>
          </button>
          {showBorderMenu && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              onMouseDown={(e) => e.preventDefault()}
            >
              <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-200">Border Style</p>
              <div className="mb-2 flex gap-1">
                {([
                  { s: "solid", label: "Solid", w: "border-solid" },
                  { s: "dashed", label: "Dashed", w: "border-dashed" },
                  { s: "dotted", label: "Dotted", w: "border-dotted" },
                  { s: "none", label: "None", w: "" },
                ] as Array<{ s: "solid" | "dashed" | "dotted" | "none"; label: string; w: string }>).map((opt) => (
                  <button
                    key={opt.s}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyTableBorder(opt.s, 1, "#d1d5db"); setShowBorderMenu(false); }}
                    className="flex-1 rounded border border-gray-300 px-1 py-1 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <span className="block border-b-2 border-gray-500 pb-1" style={{ borderBottomStyle: opt.s === "none" ? "none" : opt.s }} />
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Width</p>
              <div className="mb-2 flex gap-1">
                {[1, 2, 3].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyTableBorder("solid", w, "#d1d5db"); setShowBorderMenu(false); }}
                    className="flex-1 rounded border border-gray-300 py-1 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <span className="block border-b-2 border-gray-500" style={{ borderBottomWidth: w }} />
                    {w}px
                  </button>
                ))}
              </div>
              <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Color</p>
              <div className="grid grid-cols-6 gap-1">
                {["#000000", "#ffffff", "#d1d5db", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899", "#6b7280"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyTableBorder("solid", 1, c); setShowBorderMenu(false); }}
                    className="h-5 w-full rounded-sm border border-gray-200"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div> */}

        {/* Align selected cells: ซ้าย/กลาง/ขวา */}
        {/* <Divider />
        <span className="mr-0.5 text-[10px] text-gray-400">Align</span>
        <button type="button" title="Align left" onMouseDown={(e) => { e.preventDefault(); alignSelectedCells("left"); }} className={tableButtonCls}>
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2h16v2H0zM0 7h10v2H0zM0 12h16v2H0z" /></svg>
        </button>
        <button type="button" title="Align center" onMouseDown={(e) => { e.preventDefault(); alignSelectedCells("center"); }} className={tableButtonCls}>
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h12v2H2zM5 7h6v2H5zM2 12h12v2H2z" /></svg>
        </button>
        <button type="button" title="Align right" onMouseDown={(e) => { e.preventDefault(); alignSelectedCells("right"); }} className={tableButtonCls}>
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2h16v2H0zM6 7h10v2H6zM0 12h16v2H0z" /></svg>
        </button> */}

        {/* Table color picker toggle */}
        {/* <div className="relative" data-toolbar-dropdown>
          <button
            type="button"
            title="Fill color (cell/row/col)"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowTableColorPicker((p) => !p);
            }}
            className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: tableColorTarget === "cell" ? "#ef4444" : tableColorTarget === "row" ? "#22c55e" : "#3b82f6" }} />
            Fill
          </button>
          {showTableColorPicker && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="mb-2 flex gap-1">
                {(["cell", "row", "col"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setTableColorTarget(m); }}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${tableColorTarget === m ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                  >
                    {m === "cell" ? "Cell" : m === "row" ? "Row" : "Column"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onMouseDown={(e) => { e.preventDefault(); applyTableColor(color); }}
                    className="h-6 w-6 rounded-full border border-gray-300 hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); applyTableColor("transparent"); }}
                className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Clear color
              </button>
            </div>
          )}
        </div> */}


      </div>

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          onContextMenu={handleTableContextMenu}
                    onMouseDown={(e) => { handleEditorMouseDown(e); setTableContextMenu(null); }}
                    onMouseMove={handleEditorMouseMove}
                    onDragStart={(e) => { e.preventDefault(); }}
          onDragOver={handleEditorDragOver}
          onDrop={handleEditorDrop}
          onKeyDown={(e) => { if (e.key === "Escape") { clearBlockSelection(); clearImgSelection(); setTableContextMenu(null); } }}
                    className="
        prose 
        prose-sm 
        max-w-none 
        min-h-[300px] 
        relative
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
                [&_[data-sel-mark]]:outline
        [&_[data-sel-mark]]:outline-2
        [&_[data-sel-mark]]:outline-blue-500
        [&_[data-sel-mark]]:outline-offset-[-2px]
        "
        />

        {/* ◉ Image resize overlay: กรอบ + จุดฉุด สำหรับรูปที่เลือก */}
        {imgBox && selectedImgRef.current && (
          <div
            className="img-resize-overlay pointer-events-none absolute z-20"
            style={{ left: imgBox.left, top: imgBox.top, width: imgBox.width, height: imgBox.height }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ border: "2px solid #3b82f6" }}
            />
            {[
              "nw", "n", "ne", "e", "se", "s", "sw", "w",
            ].map((dir) => (
              <button
                key={dir}
                type="button"
                data-img-handle={dir}
                onMouseDown={(e) => {
                  const img = selectedImgRef.current;
                  if (!img) return;
                  const r = img.getBoundingClientRect();
                  imgResizeRef.current = {
                    img,
                    dir: dir as "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
                    startX: e.clientX,
                    startY: e.clientY,
                    startW: r.width,
                    startH: r.height,
                  };
                  e.preventDefault();
                  e.stopPropagation();
                  window.addEventListener("mousemove", onImgResizeMove);
                  window.addEventListener("mouseup", onImgResizeUp);
                }}
                className="pointer-events-auto absolute h-2.5 w-2.5 rounded-full"
                style={{
                  background: "#3b82f6",
                  border: "1px solid #fff",
                  cursor: dir.includes("w") || dir.includes("e") ? "ew-resize" : dir.includes("n") || dir.includes("s") ? "ns-resize" : "nwse-resize",
                  ...(dir.includes("n") ? { top: -5 } : {}),
                  ...(dir.includes("s") ? { bottom: -5 } : {}),
                  ...(dir.includes("w") ? { left: -5 } : {}),
                  ...(dir.includes("e") ? { right: -5 } : {}),
                }} />
            ))}
          </div>
        )}
      </div>

      {/* ◾ Table context menu (right-click บน cell) */}
      {tableContextMenu && (
                <div
          data-table-context-menu
          className="fixed z-[60] max-h-[70vh] w-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{ left: Math.min(tableContextMenu.x, window.innerWidth - 260), top: Math.min(tableContextMenu.y, window.innerHeight - 80) }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
           {t("knowledge.editor.tableActions")}
          </p>
          {[
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h16v2H0zM0 7h16v2H0zM2 2h1v3H2zM13 2h1v3h-1zM2 7h1v4H2z" /></svg>, label: t("knowledge.editor.insertRowAbove"), fn: () => insertTableRow(true) },
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h1v3H2zM13 2h1v3h-1zM2 7h1v4H2zM13 7h1v4h-1zM0 12h16v2H0zM2 10h1v2H2z" /></svg>, label: t("knowledge.editor.insertRowBelow"), fn: () => insertTableRow(false) },
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h2v6H0zM7 0h2v6H7zM4 0h1v6H4zM11 0h1v6h-1zM14 0h2v16h-2z" /></svg>, label:  t("knowledge.editor.insertColumnLeft"), fn: () => insertTableColumn(true) },
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h2v16H0zM5 0h2v16H5zM10 0h1v16h-1zM13 0h2v16h-2zM5 0h1v6H5z" /></svg>, label:t("knowledge.editor.insertColumnRight"), fn: () => insertTableColumn(false) },
            { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4h22v16H1zM1 8h22M8 8v12" /></svg>, label:t("knowledge.editor.deleteRow"), fn: () => deleteTableRow() },
            { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4h22v16H1zM1 8h22M8 8v12M8 4v16M8 8v12" /></svg>, label: t("knowledge.editor.deleteColumn"), fn: () => deleteTableColumn() },
            { icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18v16H3zM3 4h18M3 8h18M11 8v12" /></svg>, label: t("knowledge.editor.deleteTable"), fn: () => deleteTable() },
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h8v8H0zM8 8h8v8H8zM0 8h4v8H0zM8 0h4v8H8z" /></svg>, label: t("knowledge.editor.mergeCells"), fn: () => mergeSelectedCells() },
            { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h4v4H0zM4 0h4v4H4zM8 0h4v4H8zM0 4h6v4H0z" /></svg>, label: t("knowledge.editor.splitCell"), fn: () => splitCellAtCursor() },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={() => { item.fn(); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t("knowledge.editor.align")}
          </p>
          <div className="flex gap-1 px-2 pb-1">
            <button
              type="button"
              title={t("knowledge.editor.left")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={() => { alignSelectedCells("left"); }}
              className="flex flex-1 items-center justify-center gap-1 rounded border border-gray-300 px-1 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2h16v2H0zM0 7h10v2H0zM0 12h16v2H0z" /></svg>
              {t("knowledge.editor.left")}
            </button>
            <button
              type="button"
              title={t("knowledge.editor.center")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={() => { alignSelectedCells("center"); }}
              className="flex flex-1 items-center justify-center gap-1 rounded border border-gray-300 px-1 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2h12v2H2zM5 7h6v2H5zM2 12h12v2H2z" /></svg>
              {t("knowledge.editor.center")}
            </button>
            <button
              type="button"
              title={t("knowledge.editor.right")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={() => { alignSelectedCells("right"); }}
              className="flex flex-1 items-center justify-center gap-1 rounded border border-gray-300 px-1 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2h16v2H0zM6 7h10v2H6zM0 12h16v2H0z" /></svg>
              {t("knowledge.editor.right")}
            </button>
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t("knowledge.editor.borderStyle")}
          </p>
                    <div className="flex gap-1 px-2 pb-1">
            {(["solid", "dashed", "dotted", "none"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseUp={() => { setCtxBorder((p) => { const nb = { ...p, style: s }; applyTableBorder(nb.style, nb.width, nb.color); return nb; }); }}
                className={`flex-1 rounded border px-1 py-1 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${ctxBorder.style === s ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}`}
              >
                <span className="block border-b-2 border-gray-500 pb-1" style={{ borderBottomStyle: s === "none" ? "none" : s }} />
                {/* {s === "none" ? "None" : s[0].toUpperCase() + s.slice(1)} */}
                 {t(`knowledge.editor.${s}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 px-2 pb-1">
            {[1, 2, 3].map((w) => (
              <button
                key={w}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseUp={() => { setCtxBorder((p) => { const nb = { ...p, width: w }; applyTableBorder(nb.style, nb.width, nb.color); return nb; }); }}
                className={`flex-1 rounded border py-1 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${ctxBorder.width === w ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}`}
              >
                <span className="block border-b-2 border-gray-500" style={{ borderBottomWidth: w }} />
                {w}px
              </button>
            ))}
          </div>

          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t("knowledge.editor.borderColor")}
          </p>
          <div className="grid grid-cols-6 gap-1 px-2 pb-1">
            {["#000000", "#ffffff", "#d1d5db", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899", "#6b7280"].map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onMouseUp={() => { setCtxBorder((p) => { const nb = { ...p, color: c }; applyTableBorder(nb.style, nb.width, nb.color); return nb; }); }}
                className="h-5 w-full rounded-sm border border-gray-200"
                style={{ backgroundColor: c, ...(ctxBorder.color === c ? { outline: "2px solid #3b82f6" } : {}) }}
              />
            ))}
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
             {t("knowledge.editor.fillColor")}
          </p>
          <div className="grid grid-cols-6 gap-1 px-2 pb-1">
            {["#000000", "#ffffff", "#d1d5db", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899", "#6b7280"].map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onMouseUp={() => { setTableColorTarget("cell"); applyTableColor(c); }}
                className="h-5 w-full rounded-sm border border-gray-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onMouseUp={() => { setTableColorTarget("cell"); applyTableColor("transparent"); }}
            className="mx-2 mb-1 w-[calc(100%-16px)] rounded border border-gray-200 px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {t("knowledge.editor.clearFillColor")}
          </button>
        </div>
      )}

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
      {/* Table dialog */}
      {tableDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) setTableDialog((p) => ({ ...p, open: false })); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Insert Table</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableDialog.rows}
                  onChange={(e) => setTableDialog((p) => ({ ...p, rows: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Columns</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableDialog.cols}
                  onChange={(e) => setTableDialog((p) => ({ ...p, cols: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setTableDialog((p) => ({ ...p, open: false }))} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button type="button" onClick={() => insertTable(tableDialog.rows, tableDialog.cols)} className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600">Insert</button>
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
