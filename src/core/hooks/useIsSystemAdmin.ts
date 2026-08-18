// /src/hooks/useIsSystemAdmin.ts
import { useEffect, useState } from "react";
import { AuthService } from "@/core/utils/authService";

export function useIsSystemAdmin() {
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  useEffect(() => {
    const fetchAuthService = async () => {
      const result = await AuthService.isSystemAdmin();
      setIsSystemAdmin(result);
    };

    fetchAuthService();
  }, []);

  return isSystemAdmin;
}
