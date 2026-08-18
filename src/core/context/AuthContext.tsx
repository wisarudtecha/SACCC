// /src/context/AuthContext.tsx
import { createContext } from "react";
import type { AuthState, LoginCredentials, RegisterData } from "@/core/types/auth";

export const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
} | null>(null);
