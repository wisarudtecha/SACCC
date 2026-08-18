// /src/types/role.ts
export interface Permission {
  id: string;
  groupName: string;
  permId: string;
  permName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PermissionCreateData {
  permId: string;
  active: boolean;
}

export interface PermissionQueryParams {
  start?: number;
  length?: number;
}

export interface Role {
  id: string;
  th?: string;
  en?: string;
  orgId: string;
  roleName: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  permissions?: string[];
}

export interface RoleAnalytics {
  totalRoles: number;
  activeRoles: number;
  // systemRoles: number;
  // customRoles: number;
  averagePermissions: number;
  // mostUsedRole: string;
  // recentChanges?: number;
}

export interface RoleHierarchy {
  role: Role;
  children: RoleHierarchy[];
  inheritedPermissions: string[];
}

export interface RoleMetrics {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  customRoles: number;
  avgPermissions: number;
  mostUsed: string;
}

export interface RolePermission {
  id: number;
  orgId: string;
  roleId: string;
  permId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface RolePermissionsCreateData {
  roleId: string;
  permissions: PermissionCreateData[];
}

export interface RolePermissionQueryParams {
  start?: number;
  length?: number;
  id?: number;
  roleId?: string;
}

export interface RolePermissionsUpdateData {
  permissions: RolePermissionsCreateData[];
}

export interface RolesPermissionsUpdateData {
  body: RolePermissionsCreateData[];
}

export interface RoleCreateData {
  active: boolean;
  roleName: string;
}

export interface RoleUpdateData {
  active: boolean;
  roleName: string;
}

export interface RoleQueryParams {
  start?: number;
  length?: number;
}

export interface LoadingStates {
  roles: boolean;
  permissions: boolean;
  analytics: boolean;
  permissionUpdate: string | null;
  roleCreate: boolean;
  roleUpdate: boolean;
  roleDelete: boolean;
}
