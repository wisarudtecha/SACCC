// /src/utils/dataMappers.ts
// import rawAllPermissions from "@/mocks/allPermissions.json";
// import rawPermissionCategories from "@/mocks/permissionCategories.json";
// import rawRoles from "@/mocks/roleList.json";
// import rawUsers from "@/mocks/userList.json";
import type {
  Permission,
  // RolePermission,
  // PermissionCategory
} from "@/core/types/role";
// import type { Role, UserEntity } from "@/core/types/user";

// ===================================================================
// Permission and Permission Category Mapping
// ===================================================================

// Cache permission categories in a Map for O(1) lookup
// const permissionCategoriesById = new Map<string, PermissionCategory>(
//   (rawPermissionCategories as PermissionCategory[]).map((pc) => [pc.id, pc])
// );

// const permissionCategoriesById  = (rawPermissionCategories as PermissionCategory[]).map(c => c.id);

/**
 * Returns the permission list with the full category object attached to each permission.
 */
// export function mapPermissionsWithCategories(): Permission[] {
//   return (rawAllPermissions as Permission[]).map((p) => ({
//     ...p,
//     category: permissionCategoriesById.get(p.categoryId ?? ""),
//   }));
// }

// ===================================================================
// User and Role Mapping
// ===================================================================

// Cache roles in a Map for O(1) lookup
// const rolesById = new Map<string, Role>(
//   (rawRoles as Role[]).map((r) => [r.id, r])
// );

/**
 * Returns the user list with the full Role object attached to each user.
 * Falls back to the “Viewer” role (id 6) if the roleId is missing or unknown.
 */
// export function mapUsersWithRoles(): UserEntity[] {
//   const fallbackRole = rolesById.get("6")!; // Viewer
//   return (rawUsers as Omit<UserEntity, "role">[]).map((u) => ({
//     ...u,
//     role: rolesById.get((u).roleId as string) ?? fallbackRole,
//   })) as UserEntity[];
// }

export const permissionsByRole = (permissions: Permission[]) => {
  const grouped: Record<string, typeof permissions> = {};
  permissions.forEach(rp => {
    const matched = permissions.find(p => p.permId === rp.permId);
    if (matched) {
      const group = matched.groupName;
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(matched);
    }
  });
  return grouped;
}
