// /src/utils/permissionMigration.ts
export class PermissionMigration {
  // Convert old format to new format
  static migrateToObjectFormat(oldPermissions: string[], category: string = "cms"): Record<string, string[]> {
    return {
      [category]: oldPermissions.sort()
    };
  }

  // Convert new format to old format (for backward compatibility)
  static migrateToArrayFormat(newPermissions: Record<string, string[]>): string[] {
    return Object.values(newPermissions).flat().sort();
  }
}

// Usage example:
// const newFormat = PermissionMigration.migrateToObjectFormat(oldPermissions, "cms");
// const oldFormat = PermissionMigration.migrateToArrayFormat(newPermissions);
