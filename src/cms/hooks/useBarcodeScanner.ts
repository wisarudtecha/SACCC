// src/cms/hooks/useBarcodeScanner.ts
import { useEffect } from "react";

export const useBarcodeScanner = (onScan: (code: string) => void) => {
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer) {
          onScan(buffer);
          buffer = "";
        }
      }
      else {
        buffer += e.key;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onScan]);
}
