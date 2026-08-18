// src/core/hooks/useImageValidator.ts
import { useEffect, useState } from "react";

type ImageStatus = "idle" | "loading" | "valid" | "invalid";

export const useImageValidator = (url?: string) => {
  const [status, setStatus] = useState<ImageStatus>("idle");
  useEffect(() => {
    if (!url) {
      setStatus("idle");
      return;
    }
    let isMounted = true;
    setStatus("loading");
    const img = new Image();
    img.onload = () => {
      if (!isMounted) {
        return;
      }
      if (img.naturalWidth > 0) {
        setStatus("valid");
      }
      else {
        setStatus("invalid");
      }
    };
    img.onerror = () => {
      if (!isMounted) {
        return;
      }
      setStatus("invalid");
    };
    img.src = url;
    return () => {
      isMounted = false;
    };
  }, [url]);
  return status;
};
