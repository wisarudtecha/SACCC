// src/core/hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "@/core/context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
