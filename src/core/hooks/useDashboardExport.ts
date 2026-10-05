// Dashboard export hook — shared capture-to-PNG/PDF logic for dashboard pages.
//
// Extracted from the inline implementation in
// `src/cms/components/dashboard/ServiceDashboard.tsx` (remaining-scope plan E4,
// `docs/3CX-FE-Development-Plan-Remaining-Scope.md`) with deliberate
// improvements over the original:
//   1. the hidden control area is restored in a `finally` — the original never
//      restores it if `toPng` throws, leaving an invisible toolbar behind;
//   2. failures surface as a global error toast (in addition to the console
//      log) instead of propagating as unhandled rejections through the
//      caller's `onExport` — a silently failed download reads as a no-op
//      button.
//
// `html-to-image` and `jspdf` are dynamic imports so they stay out of the
// module graph until an export actually runs (same as ServiceDashboard).
import { useCallback, useRef, useState } from "react";
import { useToastContext } from "@/core/components/crud/ToastGlobal";

/** Formats offered by `ExportReportModal`. */
export type DashboardExportType = "pdf" | "image";

export interface UseDashboardExportOptions {
  /**
   * Download filename base without extension, e.g.
   * `call-center-dashboard-2026-10`. `.png` / `.pdf` is appended per type.
   */
  filename: string;
  /**
   * i18n key shown as an error toast when the export fails. Defaults to
   * `common.export_failed`; dashboards with a map canvas should pass a
   * map-specific key (CORS-blocked map tiles are the most common failure —
   * see DispatchDashboard).
   */
  failureMessageKey?: string;
}

export interface UseDashboardExportResult {
  /** Attach to the element that defines the exported area. */
  captureRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Attach to the container of controls (toolbar, hints) that must NOT appear
   * in the capture. It is hidden for the capture and restored afterwards.
   */
  hideDuringCaptureRef: React.RefObject<HTMLDivElement | null>;
  /** True while a capture/download is in flight — disable the trigger button. */
  isExporting: boolean;
  /** Runs the export; never throws. */
  exportDashboard: (type: DashboardExportType) => Promise<void>;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadPdf(dataUrl: string, filename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load the captured image for PDF conversion"));
  });
  // Captured at pixelRatio 2 — halve the dimensions back to CSS pixels so the
  // PDF page matches the on-screen layout.
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [img.width / 2, img.height / 2],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
  pdf.save(filename);
}

const DEFAULT_FAILURE_MESSAGE_KEY = "common.export_failed";

export function useDashboardExport({
  filename,
  failureMessageKey,
}: UseDashboardExportOptions): UseDashboardExportResult {
  const captureRef = useRef<HTMLDivElement>(null);
  const hideDuringCaptureRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToastContext();

  const exportDashboard = useCallback(
    async (type: DashboardExportType): Promise<void> => {
      const element = captureRef.current;
      if (element === null || isExporting) {
        return;
      }
      setIsExporting(true);
      if (hideDuringCaptureRef.current !== null) {
        hideDuringCaptureRef.current.style.visibility = "hidden";
      }
      try {
        // Give the browser time to commit the visibility change before
        // capturing (same delay the original implementation uses).
        await new Promise((resolve) => setTimeout(resolve, 350));
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        if (type === "image") {
          downloadDataUrl(dataUrl, `${filename}.png`);
        } else {
          await downloadPdf(dataUrl, `${filename}.pdf`);
        }
      } catch (error) {
        console.error("Dashboard export failed:", error);
        // User-facing feedback — a silently failed download looks like a
        // no-op button. Global toast (ToastProvider in main.tsx).
        addToast(
          "error",
          failureMessageKey ?? DEFAULT_FAILURE_MESSAGE_KEY,
          6000,
          true
        );
      } finally {
        if (hideDuringCaptureRef.current !== null) {
          hideDuringCaptureRef.current.style.visibility = "visible";
        }
        setIsExporting(false);
      }
    },
    [filename, failureMessageKey, isExporting, addToast]
  );

  return { captureRef, hideDuringCaptureRef, isExporting, exportDashboard };
}
