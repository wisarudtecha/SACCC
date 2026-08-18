// /src/components/auth/PermissionGate.tsx
// import { useEffect, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
// import { AuthService } from "@/cms/utils/authService";
import { PermissionManager } from "@/core/utils/permissionManager";

export const PermissionGate: React.FC<{
  permission?: string;
  permissions?: string[];
  requireAny?: boolean;
  module?: string;
  // action?: "view" | "create" | "update" | "delete";
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ 
  permission, 
  permissions = [], 
  requireAny = false, 
  module, 
  action = "view", 
  children, 
  fallback = null 
}) => {
  const { state } = useAuth();

  // const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  // useEffect(() => {
  //   const fetchAuthService = async () => {
  //     setIsSystemAdmin(await AuthService.isSystemAdmin());
  //   }
  //   fetchAuthService();
  // }, [isSystemAdmin]);
  const isSystemAdmin = useIsSystemAdmin();

  if (!state.user) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (module) {
    hasAccess = PermissionManager.hasPermission(state.user, `${module}.${action}`);
  }
  else if (permission) {
    hasAccess = PermissionManager.hasPermission(state.user, permission);
  }
  else if (permissions.length > 0) {
    hasAccess = requireAny 
      ? PermissionManager.hasAnyPermission(state.user, permissions)
      : PermissionManager.hasAllPermissions(state.user, permissions);
  }

  return hasAccess || isSystemAdmin ? <>{children}</> : <>{fallback}</>;
};
