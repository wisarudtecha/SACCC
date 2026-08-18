// /src/utils/permissionManager.ts
import type { User } from "@/core/types/auth";
import type { Permission } from "@/core/types/role";

export class PermissionManager {
  // Flatten permissions from object structure to array
  private static flattenPermissions(permissions: Record<string, string[]>): string[] {
    return Object.values(permissions).flat();
  }
  
  // Extract permission IDs from permission objects
  static extractPermissionIds(permissions: Permission[]): string[] {
    return permissions.filter(p => p.active).map(p => p.permId);
  }

  // Check if user has specific permission
  static hasPermission(user: User | null, permissionId: string): boolean {
    if (!user || !user.permission) {
      return false;
    }
    // return user.permission.includes(permissionId);

    const flatPermissions = this.flattenPermissions(user.permission);
    return flatPermissions.includes(permissionId);
  }

  // Check if user has any of the specified permissions
  static hasAnyPermission(user: User | null, permissionIds: string[]): boolean {
    if (!user || !user.permission) {
      return false;
    }
    // return permissionIds.some(permId => user.permission.includes(permId));

    const flatPermissions = this.flattenPermissions(user.permission);
    return permissionIds.some(permId => flatPermissions.includes(permId));
  }

  // Check if user has all specified permissions
  static hasAllPermissions(user: User | null, permissionIds: string[]): boolean {
    if (!user || !user.permission) {
      return false;
    }
    // return permissionIds.every(permId => user.permission.includes(permId));

    const flatPermissions = this.flattenPermissions(user.permission);
    return permissionIds.every(permId => flatPermissions.includes(permId));
  }

  // Group permissions by module (e.g., dispatch, user, report)
  static groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((groups, permission) => {
      const module = permission.permId.split(".")[0];
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(permission);
      return groups;
    }, {} as Record<string, Permission[]>);
  }

  // Get permission level for a module (view, create, update, delete)
  static getModulePermissions(user: User | null, module: string): string[] {
    if (!user || !user.permission) {
      return [];
    }
    // return user.permission.filter(permId => permId.startsWith(`${module}.`)).map(permId => permId.split(".")[1]);

    const flatPermissions = this.flattenPermissions(user.permission);
    return flatPermissions.filter(permId => permId.startsWith(`${module}.`)).map(permId => permId.split(".")[1]);
  }

  // Get permissions by category (e.g., "cms")
  static getPermissionsByCategory(user: User | null, category: string): string[] {
    if (!user || !user.permission) {
      return [];
    }
    return user.permission[category] || [];
  }

  // Get all permission categories
  static getPermissionCategories(user: User | null): string[] {
    if (!user || !user.permission) {
      return [];
    }
    return Object.keys(user.permission);
  }

  // Check if user can perform CRUD operations on a module
  static canView(user: User | null, module: string): boolean {
    return this.hasPermission(user, `${module}.read`) || this.hasPermission(user, `${module}.view`);
  }

  static canCreate(user: User | null, module: string): boolean {
    return this.hasPermission(user, `${module}.create`) || this.hasPermission(user, `${module}.add`);
  }

  static canUpdate(user: User | null, module: string): boolean {
    return this.hasPermission(user, `${module}.update`) || this.hasPermission(user, `${module}.edit`);
  }

  static canDelete(user: User | null, module: string): boolean {
    return this.hasPermission(user, `${module}.delete`) || this.hasPermission(user, `${module}.remove`);
  }
}
