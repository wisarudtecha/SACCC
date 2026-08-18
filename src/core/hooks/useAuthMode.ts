// src/hooks/useAuthMode.ts
import { useRef } from "react";
import { isSSOAvailable } from "@/core/config/api";

export type AuthMode = "SSO" | "STANDALONE";

export const useAuthMode = (): AuthMode => {
  const modeRef = useRef<AuthMode | null>(null);

  if (!modeRef.current) {
    modeRef.current = isSSOAvailable() ? "SSO" : "STANDALONE";
  }

  return modeRef.current;
};
