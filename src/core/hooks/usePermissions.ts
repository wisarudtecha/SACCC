// /src/hooks/usePermissions.ts
import { PermissionManager } from "@/core/utils/permissionManager";
import { useAuth } from "@/core/hooks/useAuth";

export const usePermissions = () => {
  const { state } = useAuth();

  // Flatten permissions for backward compatibility
  const flatPermissions = state.user?.permission ? Object.values(state.user.permission).flat() : [];

  return {
    user: state.user,
    // permissions: state.user?.permission || [],
    permissions: flatPermissions, // Flattened for backward compatibility
    permissionsByCategory: state.user?.permission || {}, // New: categorized permissions
    
    // Permission checking methods
    hasPermission: (permission: string) => PermissionManager.hasPermission(state.user, permission),
    hasAnyPermission: (permissions: string[]) => PermissionManager.hasAnyPermission(state.user, permissions),
    hasAllPermissions: (permissions: string[]) => PermissionManager.hasAllPermissions(state.user, permissions),
    
    // Module-based permission checking
    canView: (module: string) => PermissionManager.canView(state.user, module),
    canCreate: (module: string) => PermissionManager.canCreate(state.user, module),
    canUpdate: (module: string) => PermissionManager.canUpdate(state.user, module),
    canDelete: (module: string) => PermissionManager.canDelete(state.user, module),
    
    // Get all permissions for a module
    getModulePermissions: (module: string) => PermissionManager.getModulePermissions(state.user, module),

    // Get permissions by category (e.g., "cms")
    getPermissionsByCategory: (category: string) => PermissionManager.getPermissionsByCategory(state.user, category),

    // Get all permission categories
    getPermissionCategories: () => PermissionManager.getPermissionCategories(state.user),
    
    // Group permissions by module
    getGroupedPermissions: () => {
      // const role = state.user?.role;
      // return role ? PermissionManager.groupPermissionsByModule(role.permissions) : {};

      const userPermissions = state.user?.permission;
      
      // return userPermissions ? PermissionManager.groupPermissionsByModule(userPermissions.map(permId => ({
      //   id: permId,
      //   permId,
      //   groupName: "",
      //   permName: "",
      //   active: true,
      //   createdAt: "",
      //   updatedAt: "",
      //   createdBy: "",
      //   updatedBy: ""
      // }))) : {};

      if (!userPermissions) {
        return {};
      }
      const flatPerms = Object.values(userPermissions).flat();
      return PermissionManager.groupPermissionsByModule(
        flatPerms.map(permId => ({
          id: permId,
          permId,
          groupName: "",
          permName: "",
          active: true,
          createdAt: "",
          updatedAt: "",
          createdBy: "",
          updatedBy: ""
        }))
      );
    }
  };
};
