// src/cms/components/admin/user-management/role-privilege/RoleManagement.tsx
import React, { useCallback, useEffect, useState }
from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import {
  CheckLineIcon,
  CloseIcon,
  GroupIcon,
  // LockIcon,
  // PencilIcon,
  PieChartIcon,
  // ShootingStarIcon
} from "@/core/icons";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { Modal } from "@/core/components/ui/modal";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useToast } from "@/core/hooks/useToast";
import {
  // RolePermissionsCreateData,
  // useCreateUserRolePermissionsMutation,
  useUpdateUserRolesPermissionsMutation,
  // useLazyGetUserRolesPermissionsByRoleIdQuery,
  // useGetUserRolesPermissionsByIdQuery,
  // useDeleteUserRolePermissionsMutation,
  // useUpdateUserRolePermissionsMutation,
  useCreateUserRolesMutation,
  useUpdateUserRolesMutation,
  // useDeleteUserRolesMutation
} from "@/core/store/api/userApi";
// import { AuthService } from "@/cms/utils/authService";
import { SYSTEM_ROLE } from "@/cms/utils/constants";
import { formatDate } from "@/core/utils/crud";
import { permissionsByRole } from "@/core/utils/dataMappers";
// import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { Permission, Role, RoleAnalytics, RoleCreateData, RoleUpdateData, RolePermission, RolesPermissionsUpdateData } from "@/core/types/role";
import MetricsView from "@/core/components/admin/MetricsView";
import PrivilegeMatrixContent from "@/core/components/admin/user-management/role-privilege/PrivilegeMatrixView";
import RoleCardContent from "@/core/components/admin/user-management/role-privilege/RoleCard";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

// ===================================================================
// Utility Functions
// ===================================================================

// const buildRoleHierarchy = (roles: Role[]): RoleHierarchy[] => {
//   // const roleMap = new Map(roles.map(role => [role.id, role]));
//   const hierarchy: RoleHierarchy[] = [];
//   const buildTree = (role: Role, parentPermissions: string[] = []): RoleHierarchy => {
//     const inheritedPermissions = [...new Set([...parentPermissions, ...role.permissions])];
//     const children: RoleHierarchy[] = [];
//     roles.forEach(childRole => {
//       if (childRole.parentRole === role.id) {
//         children.push(buildTree(childRole, inheritedPermissions));
//       }
//     });
//     return {
//       role,
//       children,
//       inheritedPermissions
//     };
//   };
//   roles.forEach(role => {
//     if (!role.parentRole) {
//       hierarchy.push(buildTree(role));
//     }
//   });
//   return hierarchy;
// };

const RoleManagementComponent: React.FC<{
  role: Role[];
  rolesPerms: RolePermission[];
  perms: Permission[];
}> = ({ role, rolesPerms, perms }) => {
  // const isSystemAdmin = AuthService.isSystemAdmin();
  const isSystemAdmin = useIsSystemAdmin();

  const navigate = useNavigate();
  const permissions = usePermissions();
  const { t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  // const [trigger] = useLazyGetUserRolesPermissionsByRoleIdQuery();
  // const [createRolePermissions] = useCreateUserRolePermissionsMutation();

  const [updateUserRolesPermissions] = useUpdateUserRolesPermissionsMutation();
  const [createUserRoles] = useCreateUserRolesMutation();
  const [updateUserRoles] = useUpdateUserRolesMutation();
  // const [deleteUserRoles] = useDeleteUserRolesMutation();

  // const [updateUserRolesPermissionsResponse, setUpdateUserRolesPermissionsResponse] = useState<ApiResponse<RolePermission[]>>();

  const [roleAnalytics, setRoleAnalytics] = useState<RoleAnalytics>();

  // const [roleDeleteOpen, setRoleDeleteOpen] = useState(false);
  const [roleSaveOpen, setRoleSaveOpen] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleValidateErrors, setRoleValidateErrors] = useState("");

  // ===================================================================
  // Loading State
  // ===================================================================

  // const [loading, setLoading] = useState<LoadingStates>({
  //   roles: true,
  //   permissions: true,
  //   analytics: true,
  //   permissionUpdate: null,
  //   roleCreate: false,
  //   roleUpdate: false,
  //   roleDelete: false
  // });

  const [loading, setLoading] = useState(false);

  const isDeleteAvailable = (roleItem: Role) => {
    const canDelete = permissions.hasPermission("role.delete") || isSystemAdmin;
    // console.log("🚀 ~ isDeleteAvailable ~ canDelete:", canDelete);
    return canDelete && roleItem.id !== SYSTEM_ROLE;
  }

  const isEditAvailable = () => {
    const canEdit = permissions.hasPermission("role.update");
    // console.log("🚀 ~ isEditAvailable ~ canEdit:", canEdit);
    return canEdit || isSystemAdmin;
  }

  // ===================================================================
  // Mock Data
  // ===================================================================

  // const mockMetrics: RoleMetrics = {
  //   totalRoles: 6,
  //   activeRoles: 6,
  //   systemRoles: 2,
  //   customRoles: 4,
  //   avgPermissions: 11,
  //   mostUsed: "Agent"
  // };

  // const mockAnalytics: RoleAnalytics = {
  //   totalRoles: role.length,
  //   activeRoles: role.filter(r => r.userCount > 0).length,
  //   systemRoles: role.filter(r => r.isSystem).length,
  //   customRoles: role.filter(r => !r.isSystem).length,
  //   averagePermissions: Math.round(role.reduce((sum, r) => sum + r.permissions.length, 0) / role.length),
  //   mostUsedRole: roles.reduce((prev, current) => (prev.userCount > current.userCount) ? prev : current),
  //   mostUsedRole: "Agent",
  //   recentChanges: 3
  // };

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const data: Role[] = role as Role[];

  const [roleList, setRoles] = useState<Role[]>(data);
  
  useEffect(() => {
    setRoles(data);
  }, [data]);

  useEffect(() => {
    // const mostUsedRole = (arr: { roleName: string }[]) => Object.entries(
    //   arr.reduce((acc, { roleName }) => ((acc[roleName] = (acc[roleName] || 0) + 1), acc), {} as Record<string, number>)
    // ).reduce((a, b) => (b[1] > a[1] ? b : a), ["", 0])[0];

    // const maxPermissions = Math.max(...role.map(r => r.permissions?.length || 0));
    // const roleWithMax = role.find(r => r.permissions?.length === maxPermissions);

    setRoleAnalytics({
      totalRoles: role.length,
      activeRoles: role.filter(r => r.active).length,
      // systemRoles: role.filter(r => r.id === SYSTEM_ROLE).length,
      // customRoles: role.filter(r => r.id !== SYSTEM_ROLE).length,
      averagePermissions: Math.round(role.reduce(sum => sum + perms.length, 0) / role.length),
      // mostUsedRole: mostUsedRole(role).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      // mostUsedRole: roleWithMax?.roleName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || "0",
      // recentChanges: 0
    });
  }, [perms.length, role]);

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  const config = {
    entityName: t("crud.role_privilege.name"),
    entityNamePlural: t("crud.role_privilege.name"),
    apiEndpoints: {
      list: "/api/v1/role",
      create: "/api/v1/role",
      read: "/api/v1/role/:id",
      update: "/api/v1/role/:id",
      delete: "/api/v1/role/:id",
      bulkDelete: "/api/v1/role/bulk",
      export: "/api/v1/role/export"
    },
    columns: [
      {
        key: "user",
        label: t("crud.role_privilege.list.header.user"),
        sortable: true,
        render: (roleItem: Role) => {
          return (
            <div className="flex items-center gap-3 capitalize text-gray-900 dark:text-white">
              {roleItem.roleName.replace(/_/g, " ")}
            </div>
          )
        }
      },
      {
        key: "permission",
        label: t("crud.role_privilege.list.header.permission"),
        sortable: false,
        render: (roleItem: Role) => {
          return (
            <div className="text-gray-900 dark:text-white">
              {roleItem.permissions?.length || 0}
            </div>
          )
        }
      },
      {
        key: "updatedAt",
        label: t("crud.role_privilege.list.header.updatedAt"),
        sortable: true,
        render: (roleItem: Role) => {
          return (
            <div className="text-gray-900 dark:text-white">
              {/* {new Date(roleItem.updatedAt || "").toLocaleDateString()} */}
              {formatDate(roleItem.updatedAt || "")}
            </div>
          )
        }
      },
      {
        key: "groupName",
        label: t("crud.role_privilege.list.header.groupName"),
        sortable: false,
        render: (roleItem: Role) => {
          const permissionByRole = Object.values(permissionsByRole(perms.filter(p => (roleItem.permissions || []).includes(p.permId)))) || [];
          return (
            <div className="flex items-center space-x-2 min-h-6">
              {permissionByRole.slice(0, 2).map((item, key) => {
                if (item[key]) {
                  return (
                    <div
                      key={`${item[key]?.permId}-${key}`}
                      className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item[key]?.groupName}</span>
                    </div>
                  );
                }
              })}
              {permissionByRole.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{permissionByRole.length - 2} {t("crud.role_privilege.unit.more")}
                </span>
              )}
            </div>
          )
        }
      },
    ],
    actions: [
      // {
      //   key: "view",
      //   label: "View",
      //   variant: "primary" as const,
      //   // icon: EyeIcon,
      //   onClick: (roleItem: Role) => navigate(`/cms/role/${roleItem.id}`),
      //   condition: () => (permissions.hasPermission("role.view") || isSystemAdmin) as boolean
      // },
      {
        key: "update",
        label: t("common.edit"),
        variant: "warning" as const,
        // icon: PencilIcon,
        // onClick: (roleItem: Role) => navigate(`/cms/role/${roleItem.id}/edit`),
        onClick: (roleItem: Role) => {
          setRoleSaveOpen(true);
          setRoleId(roleItem.id);
          setRoleName(roleItem.roleName);
        },
        // condition: () => (permissions.hasPermission("role.update") || isSystemAdmin) as boolean
        condition: () => isEditAvailable()
      },
      {
        key: "delete",
        label: t("common.delete"),
        variant: "outline" as const,
        // icon: TrashBinIcon,
        // onClick: (roleItem: Role) => {
        //   setRoleDeleteOpen(true);
        //   setRoleId(roleItem.id);
        //   setRoleName(roleItem.roleName);
        // },
        onClick: (roleItem: Role) => console.log(`Delete role: ${roleItem.id}`),
        // condition: (roleItem: Role) => (roleItem.id !== SYSTEM_ROLE) as boolean
        condition: (roleItem: Role) => isDeleteAvailable(roleItem)
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  // const previewConfig: PreviewConfig<Role> = {
  //   // title: () => "Role Information",
  //   title: (roleItem: Role) => {
  //     return (
  //       <div className="flex items-center gap-3">
  //         <div className={`w-3 h-3 rounded-full ${roleItem.active
  //           ? "bg-green-500 dark:bg-green-400"
  //           : "bg-red-500 dark:bg-red-400"
  //         }`}></div>
  //         <div>
  //           <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">{roleItem.roleName}</h2>
  //           {/* <p className="text-sm text-gray-500 dark:text-gray-400">Level {role.level} • {role.userCount} users</p> */}
  //         </div>
  //       </div>
  //     );
  //   },
  //   size: "xl",
  //   enableNavigation: true,
  //   tabs: [
  //     {
  //       key: "role",
  //       label: "Role",
  //       // icon: InfoIcon,
  //       render: (
  //         // userItem: UserEntity
  //         // userItem: UserProfile
  //       ) => {
  //         return (
  //           <></>
  //         )
  //       }
  //     }
  //   ],
  //   actions: [
  //     {
  //       key: "view",
  //       label: "View",
  //       // icon: EyeIcon,
  //       variant: "primary",
  //       onClick: (roleItem: Role, closePreview: () => void) => {
  //         closePreview();
  //         navigate(`/cms/role/${roleItem.id}`);
  //       },
  //       condition: () => (permissions.hasPermission("role.view") || isSystemAdmin) as boolean
  //     },
  //     {
  //       key: "update",
  //       label: "Edit",
  //       // icon: PencilIcon,
  //       variant: "warning",
  //       onClick: (roleItem: Role, closePreview: () => void) => {
  //         closePreview();
  //         navigate(`/cms/role/${roleItem.id}/edit`);
  //       },
  //       condition: () => (permissions.hasPermission("role.update") || isSystemAdmin) as boolean
  //     },
  //     {
  //       key: "delete",
  //       label: "Delete",
  //       // icon: CheckLineIcon,
  //       variant: "outline",
  //       onClick: (roleItem: Role, closePreview: () => void) => {
  //         console.log("Delete role:", roleItem.id);
  //         closePreview();
  //       },
  //       condition: (roleItem: Role) => (roleItem.id !== SYSTEM_ROLE) as boolean
  //     }
  //   ]
  // };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  // const advancedFilters = [
  //   {
  //     key: "id",
  //     label: "Role",
  //     type: "select" as const,
  //     options: role.map(role => ({ value: role.id, label: role.roleName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) })),
  //     placeholder: "Select role"
  //   }
  // ];

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  // ===================================================================
  // Export Options
  // ===================================================================

  // ===================================================================
  // Custom Filter Function for Enhanced MultiSelect Support
  // ===================================================================

  const customCaseFilterFunction = (roleItem: Role, filters: unknown): boolean => {
    return Object.entries(filters as Record<string, unknown>).every(([key, value]) => {
      if (!value) {
        return true;
      }

      // Handle search
      if (key === "search" && typeof value === "string") {
        const searchTerm = value.toLowerCase();
        return roleItem.roleName.toLowerCase().includes(searchTerm)
      }

      // Handle multiselect arrays
      if (Array.isArray(value) && value.length > 0) {
        switch (key) {
          case "permissions":
            // Check if role has any of the selected permissions
            // return value.some(permission => roleItem.permissions.includes(permission));
            return false;
            
          default:
            return (value as string[]).includes(roleItem[key as keyof Role] as string);
        }
      }

      // Handle number ranges
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const range = value as { min?: number; max?: number };
        if ((range.min !== undefined || range.max !== undefined) && typeof roleItem[key as keyof Role] === "number") {
          const roleValue = roleItem[key as keyof Role] as unknown as number;
          if (range.min !== undefined && roleValue < range.min) return false;
          if (range.max !== undefined && roleValue > range.max) return false;
          return true;
        }
      }

      // Handle boolean
      if (typeof value === "boolean" && typeof roleItem[key as keyof Role] === "boolean") {
        return roleItem[key as keyof Role] === value;
      }

      // Handle regular values
      return roleItem[key as keyof Role] === value;
    });
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // const [selectedView, setSelectedView] = useState<"cards" | "matrix" | "hierarchy">("cards");
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  // const [showRoleEditor, setShowRoleEditor] = useState(false);

  // const filteredRoles = useMemo(() => {
  //   return roleList.filter(role =>
  //     role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     role.description.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [roleList, searchTerm]);

  // const roleHierarchy = useMemo(() => buildRoleHierarchy(roleList), [roleList]);

  const handlePermissionToggle = useCallback(async (roleId: string, permId: string) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        const permissions = role?.permissions?.includes(permId)
          ? role.permissions.filter(p => p !== permId)
          : [...role.permissions || [], permId];
        return {
          ...role,
          permissions,
          lastModified: new Date().toISOString()
        };
      }
      return role;
    }));
  }, []);

  const handlePermissionSave = async () => {
    try {
      if (permissions.hasAnyPermission(["role.update"])) {
        setLoading(true);
        const payload: RolesPermissionsUpdateData = {
          body: (roleList).map(rl => {
            return {
              roleId: rl.id,
              permissions: (rl.permissions || []).map(p => {
                return { permId: p, active: true };
              })
            };
          }
        )};
        const response = await updateUserRolesPermissions(payload).unwrap();

        // setUpdateUserRolesPermissionsResponse(response);

        if (response?.status) {
          // addToast("success", `Roles Permissions Management: ${response?.desc || response?.msg || "Update successfully"}`);
          addToast("success", t("crud.role_privilege.action.privilege.update.success"));
        }
        else {
          // throw new Error(response?.desc || response?.msg || "Unknown error");
          throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
        }

        // for (const [, rl] of roleList.entries()) {
        //   trigger(rl.id);
        //   const { data: rpsData } = await trigger(rl.id);
        //   const rps = rpsData as unknown as RolePermission[] || [];
        //   if (rps.length === 0) {
        //     const ps = (rl.permissions || []).map(p => {
        //       return { permId: p, active: true };
        //     });
        //     const payload: RolePermissionsCreateData = {
        //       roleId: rl.id,
        //       permissions: ps,
        //     };
        //     try {
        //       const response = await createRolePermissions(payload).unwrap();
        //       console.log("Created role permissions:", response);
        //     }
        //     catch (err) {
        //       console.error("Error creating role permissions:", err);
        //     }
        //   }
        // };
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
    }
    catch (error) {
      // addToast("error", `Roles Permissions Management: ${error}`);
      addToast("error", `${t("crud.role_privilege.action.privilege.update.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  };

  // const handlePermissionToggle = useCallback(( roleId: string, permId: string ) => {
  //   setRoles(prevRoles => prevRoles.map(role => {
  //     if (role.id === roleId) {
  //       const permissions = role?.permissions?.includes(permId)
  //         ? role.permissions.filter(p => p !== permId)
  //         : [...role.permissions || [], permId];
  //       return {
  //         ...role,
  //         permissions,
  //         lastModified: new Date().toISOString()
  //       };
  //     }
  //     return role;
  //   }));
  // }, []);

  // const handlePermissionToggle = useCallback(async (roleId: string, permId: string) => {
  //   const roles = role.find(r => r.id === roleId);
  //   if (!roles) {
  //     return;
  //   }
  //   const hasPermission = roles?.permissions?.includes(permId);
  //   const newPermissions = hasPermission
  //     ? roles?.permissions?.filter(p => p !== permId)
  //     : [...roles?.permissions || [], permId];
  //   // Optimistic update
  //   setRoles(prevRoles => prevRoles.map(role => 
  //     role.id === roleId 
  //       ? { ...role, permissions: newPermissions, lastModified: new Date().toISOString() }
  //       : role
  //   ));
  //   try {
  //     const result = await RoleManagementAPI.toggleRolePermission(roleId, permissionId, !hasPermission);
  //     if (result.success && result.data) {
  //       // Update with server response
  //       setRoles(prevRoles => prevRoles.map(r => 
  //         r.id === roleId ? result.data! : r
  //       ));
  //       showNotification(
  //         "success", 
  //         "Permission Updated", 
  //         `Permission ${hasPermission ? "removed from" : "granted to"} ${roles.roleName}`
  //       );
  //     }
  //     else {
  //       // Revert optimistic update
  //       setRoles(prevRoles => prevRoles.map(r => 
  //         r.id === roleId ? roles : r
  //       ));
  //       showNotification("error", "Update Failed", result.error || "Failed to update permission");
  //     }
  //     setRoles(prevRoles => prevRoles.map(r => 
  //       r.id === roleId ? roles : r
  //     ));
  //   }
  //   catch {
  //     // Revert optimistic update
  //     setRoles(prevRoles => prevRoles.map(r => 
  //       r.id === roleId ? roles : r
  //     ));
  //     showNotification("error", "Update Failed", "Network error occurred");
  //   }
  // }, [
  //   role,
  //   showNotification
  // ]);

  // const handleEdit = useCallback((role: Role) => {
  //   setSelectedRole(role);
  //   setShowRoleEditor(true);
  // }, []);

  // const handleClone = useCallback((role: Role) => {
  //   const newRole: Role = {
  //     ...role,
  //     id: `role_${Date.now()}`,
  //     name: `${role.name} (Copy)`,
  //     isSystem: false,
  //     userCount: 0,
  //     createdAt: new Date().toISOString(),
  //     lastModified: new Date().toISOString(),
  //     createdBy: "current_user@company.com"
  //   };
  //   setRoles(prevRoles => [...prevRoles, newRole]);
  // }, []);

  // const handleView = useCallback((role: Role) => {
  //   setSelectedRole(role);
  //   // Could open a detailed permissions modal
  //   console.log("View permissions for role:", role);
  // }, []);

  // Handle deletion and other actions
  const handleAction = (actionKey: string, roleItem: Role) => {
    console.log(`Action ${actionKey} triggered for role:`, roleItem.id);
    // Add custom role-specific action handling
  };

  // const handleAction = async (actionKey: string, roleItem: RolePermission) => {
  //   console.log(updateUserRolesPermissionsResponse);
  // };

  // Handle deletion
  const handleDelete = (roleId: string) => {
    console.log("Role deleted:", roleId);
    // Handle role delete
    setTimeout(() => {
      window.location.replace(`/role-privilege`);
    }, 1000);
  };

  // const handleDelete = useCallback((role: Role) => {
  //   if (role.userCount > 0) {
  //     console.error("Cannot delete role with assigned users. Please reassign users first.");
  //     return;
  //   }
  //   if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
  //     setRoles(prevRoles => prevRoles.filter(r => r.id !== role.id));
  //   }
  // }, []);

  // ===================================================================
  // Validation before saving
  // ===================================================================

  // Validate department
  const validateRole = useCallback((): string => {
    if (!roleName.trim()) {
      const errors: string = t("crud.role_privilege.form.roleName.required");
      setRoleValidateErrors(errors);
      return errors;
    }
    return "";
  }, [roleName, t]);

  // ===================================================================
  // Role CRUD
  // ===================================================================

  // Delete Role
  // const handleRoleDelete = useCallback(async (id: string) => {
  //   if (!id) {
  //     throw new Error("Role ID not found");
  //   }
  //   try {
  //     setLoading(true);
  //     let response;
  //     if (permissions.hasAnyPermission(["role.update"])) {
  //       response = await deleteUserRoles(id).unwrap();
  //     }
  //     else {
  //       throw new Error("Permission denied");
  //     }
  //     if (response?.status) {
  //       addToast("success", `Role & Privilege Management: ${response?.desc || response?.msg || "Delete successfully"}`);
  //       setTimeout(() => {
  //         window.location.replace(`/role-privilege`);
  //       }, 1000);
  //     }
  //     else {
  //       throw new Error(response?.desc || response?.msg || "Unknown error");
  //     }
  //   }
  //   catch (error) {
  //     addToast("error", `Role & Privilege Management: ${error}`);
  //   }
  //   finally {
  //     setLoading(false);
  //   }
  // }, [permissions, addToast, deleteUserRoles]);

  // Reset Department
  const handleRoleReset = () => {
    setRoleId("");
    setRoleName("");
    setRoleValidateErrors("");
  };

  // Create / Update Department
  const handleRoleSave = useCallback(async () => {
    const errors = validateRole();
    if (errors) {
      return; // Don"t save if there are validation errors
    }
    const roleData: RoleCreateData | RoleUpdateData = {
      active: true,
      roleName: roleName,
    };
    try {
      setLoading(true);
      let response;
      if (permissions.hasAnyPermission(["role.create", "role.update"])) {
        if (roleId) {
          response = await updateUserRoles({
            id: roleId, data: roleData
          }).unwrap();
        }
        else {
          response = await createUserRoles(roleData).unwrap();
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
      if (response?.status) {
        // addToast("success", `Role & Privilege Management: ${response?.desc || response?.msg || "Save successfully"}`);
        addToast("success", roleId && t("crud.role_privilege.action.role.update.success") || t("crud.role_privilege.action.role.create.success"));
        setTimeout(() => {
          window.location.replace(`/role-privilege`);
        }, 1000);
      }
      else {
        // throw new Error(response?.desc || response?.msg || "Unknown error");
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      // addToast("error", `Role & Privilege Management: ${error}`);
      addToast("error", `${roleId && t("crud.role_privilege.action.role.update.error") || t("crud.role_privilege.action.role.create.error")}: ${error}`);
    }
    finally {
      setRoleSaveOpen(false);
      setLoading(false);
    }
  }, [roleId, roleName, permissions, addToast, createUserRoles, t, updateUserRoles, validateRole]);

  // ===================================================================
  // Custom Rendering
  // ===================================================================

  const renderCard = (roleItem: Role) => {
    const roleConfig = role.find(r => r.id === roleItem.id);
    return <RoleCardContent
      role={roleConfig as Role}
      // rolePermissions={rolesPerms as RolePermission[]}
      permission={perms as Permission[]}
      onEdit={() => navigate(`/cms/role/${roleItem.id}/edit`)}
      onDelete={() => console.log("Delete role:", roleItem.id)}
      onClone={() => console.log("Clone role:", roleItem.id)}
      onViewPermissions={() => console.log("View permissions for role:", roleItem.id)}
    />
  };

  // const renderMatrix = (roleItem: Role[], permissionItem: Permission[], onPermissionToggle: (roleId: string, permissionId: string) => void) => {
  //   return <PermissionMatrixView
  //     roles={roleItem}
  //     permissions={permissionItem}
  //     onPermissionToggle={onPermissionToggle}
  //   />
  // };

  const renderMatrix = () => {
    return <PrivilegeMatrixContent
      roles={roleList}
      rolePermissions={rolesPerms as RolePermission[]}
      permissions={perms as Permission[]}
      onPermissionToggle={handlePermissionToggle}
      handlePermissionSave={handlePermissionSave}
      loading={loading}
    />
  };

  // ===================================================================
  // Render Component
  // ===================================================================

  const attrMetrics = [
    { key: "totalRoles", title: t("crud.role_privilege.metrics.total"), icon: GroupIcon, color: "blue-light", className: "text-blue-light-600" },
    { key: "activeRoles", title: t("crud.role_privilege.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    // { key: "systemRoles", title: "System Roles", icon: LockIcon, color: "purple", className: "text-purple-600" },
    // { key: "customRoles", title: "Custom Roles", icon: PencilIcon, color: "orange", className: "text-orange-600" },
    { key: "averagePermissions", title: t("crud.role_privilege.metrics.avg"), icon: PieChartIcon, color: "blue", className: "text-blue-600" },
    // { key: "mostUsedRole", title: "Most Used", icon: ShootingStarIcon, color: "yellow", className: "text-yellow-600" },
  ];

  return (
    <>
      <MetricsView metrics={roleAnalytics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        // advancedFilters={advancedFilters}
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            list: "/role",
            create: "/role",
            read: "/role/:id",
            update: "/role/:id",
            delete: "/role/:id",
            bulkDelete: "/role/bulk",
            export: "/role/export"
          }
        }}
        // bulkActions={bulkActions}
        config={config} 
        customFilterFunction={customCaseFilterFunction}
        data={role}
        // displayModes={["card", "matrix", "hierarchy"]}
        // displayModes={["card", "matrix"]}
        displayModes={["card", "table", "matrix"]}
        // displayModes={["matrix"]}
        displayModeDefault="matrix"
        enableDebug={true} // Enable debug mode to troubleshoot
        // error={null}
        // exportOptions={exportOptions}
        features={{
          bulkActions: false,
          export: false,
          filtering: true,
          keyboardShortcuts: true,
          pagination: true,
          realTimeUpdates: false, // Disabled for demo
          search: false,
          sorting: true,
        }}
        // keyboardShortcuts={[]}
        // loading={false}
        module="role"
        // previewConfig={previewConfig}
        // previewConfig={previewConfig as PreviewConfig<Role & { id: string }>}
        // searchFields={["name", "description"]}
        searchFields={["roleName"]}
        // customFilterFunction={() => true}
        // onCreate={() => navigate("/cms/role/create")}
        onCreate={() => setRoleSaveOpen(true)}
        onDelete={handleDelete}
        onItemAction={handleAction}
        // onItemClick={(item) => navigate(`/cms/role/${item.id}`)}
        onRefresh={() => window.location.reload()}
        // onUpdate={() => {}}
        renderCard={renderCard}
        renderMatrix={renderMatrix}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Modal
        isOpen={roleSaveOpen}
        onClose={() => {
          setRoleSaveOpen(false);
          handleRoleReset();
        }}
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {roleId && t("crud.role_privilege.form.header.update") || t("crud.role_privilege.form.header.create")}
          </h3>
          <Button
            onClick={() => setRoleSaveOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="roleName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.role_privilege.form.roleName.label")}
            </label>
            <Input
              id="roleName"
              placeholder={t("crud.role_privilege.form.roleName.placeholder")}
              value={roleName}
              onChange={(e) => setRoleName && setRoleName(e.target.value)}
            />
            <span className="text-red-500 dark:text-red-400 text-xs">{roleValidateErrors}</span>
          </div>
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleRoleReset} variant="outline">
              {t("crud.role_privilege.action.button.reset")}
            </Button>
            <Button onClick={handleRoleSave} variant="primary">
              {t("crud.role_privilege.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RoleManagementComponent;
