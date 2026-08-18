// /src/context/UserProfileContextObject.tsx
import { createContext, useContext } from "react";
import type { UserProfileContextType } from "@/core/types/user";

export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
