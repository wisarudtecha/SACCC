// /src/components/admin/user-management/role-privilege/PrivilegeMatrixView.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  // AlertHexaIcon,
  CheckLineIcon,
  // DownloadIcon,
  LockIcon
} from "@/core/icons";
// import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type {
  Permission,
  Role,
  RolePermission,
  // LoadingStates
} from "@/core/types/role";
import Button from "@/core/components/ui/button/Button";
// import permissionCategories from "@/mocks/permissionCategories.json";
import { SYSTEM_ROLE } from "@/cms/utils/constants";
import { permissionsByRole } from "@/core/utils/dataMappers";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";

const PrivilegeMatrixContent: React.FC<{
  // loading: LoadingStates;
  loading: boolean;
  permissions: Permission[];
  roles: Role[];
  rolePermissions: RolePermission[];
  handlePermissionSave: () => void;
  onPermissionToggle: (roleId: string, permissionId: string) => Promise<void>;
}> = ({
  loading,
  permissions,
  roles,
  rolePermissions,
  handlePermissionSave,
  onPermissionToggle,
}) => {
  const { t } = useTranslation();
  const isSystemAdmin = useIsSystemAdmin();

  const selectedRole = "all";
  const filteredPermissions = useMemo(() => {
    if (selectedRole === "all") {
      return permissions;
    }
    const rolePerms = rolePermissions.filter(rp => rp.roleId === selectedRole).map(rp => rp.permId);
    return permissions.filter(p => rolePerms.includes(p.permId));
  }, [
    permissions,
    rolePermissions,
    selectedRole
  ]);

  // const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // const selectedCategory = "all";
  // const filteredPermissions = useMemo(() => {
  //   if (selectedCategory === "all") {
  //     return permissions;
  //   }
  //   return permissions.filter(p => p.categoryId === selectedCategory);
  // }, [permissions, selectedCategory]);

  // const permissionsByRole = useMemo(() => {
  //   return rolePermissions.map(rp => ({
  //     permissions: filteredPermissions.filter(p => p.permId === rp.permId)
  //   })).filter(item => item.permissions.length > 0);
  // }, [
  //   rolePermissions,
  //   filteredPermissions
  // ]);

  // const permissionsByRole = useMemo(() => {
  //   const grouped: Record<string, typeof filteredPermissions> = {};
  //   permissions.forEach(rp => {
  //     const matched = filteredPermissions.find(p => p.permId === rp.permId);
  //     if (matched) {
  //       const group = matched.groupName;
  //       if (!grouped[group]) {
  //         grouped[group] = [];
  //       }
  //       grouped[group].push(matched);
  //     }
  //   });
  //   return grouped;
  // }, [permissions, filteredPermissions]);

  // const permissionsByCategory = useMemo(() => {
  //   return permissionCategories.map(category => ({
  //     category,
  //     permissions: filteredPermissions.filter(p => p.categoryId === category.id)
  //   })).filter(item => item.permissions.length > 0);
  // }, [filteredPermissions]);

  // const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const handlePermissionToggle = async (roleId: string, permissionId: string) => {
    // const updateKey = `${roleId}-${permissionId}`;
    // setPendingUpdates(prev => new Set(prev.add(updateKey)));
    // console.log(hasPermission);
    
    try {
      onPermissionToggle(roleId, permissionId);
    }
    catch (error) {
      console.error("Error toggling permission:", error);
    }
    finally {
      // setPendingUpdates(prev => {
      //   const newSet = new Set(prev);
      //   newSet.delete(updateKey);
      //   return newSet;
      // });
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => {
      const calculated = (window.innerHeight * 0.7) - 210;
      setMaxHeight(calculated);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const [expandedGroupName, setExpandedGroupName] = useState<string | null>(null);
  useEffect(() => {
    if (permissions.length > 0) {
      setExpandedGroupName(permissions[0].groupName);
    }
  }, [permissions]);
  const toggleGroup = (groupName: string) => {
    setExpandedGroupName((prev) => (prev === groupName ? null : groupName));
  };

  // console.log(
  //   roles,
  //   rolePermissions,
  //   permissions,
  //   filteredPermissions,
  //   permissionsByRole
  // );

  return (
    <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
      {/*
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Permission Matrix</h3>
          <div className="flex items-center space-x-2">
            <Button variant="success" size="sm" onClick={() => handlePermissionSave()}>
              Save
            </Button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Categories</option>
              {permissionCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Matrix
            </button>
          </div>
        </div>
      </div>
      */}

      <div className="overflow-x-auto overflow-y-auto" ref={containerRef} style={{maxHeight}}>
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 cursor-default">
            <tr className="bg-gray-100 dark:bg-gray-800 z-100">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider sticky left-0 bg-gray-100 dark:bg-gray-800 z-100">
                {t("crud.role_privilege.list.header.permission")}
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-3 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider min-w-24 bg-gray-100 dark:bg-gray-800 z-100">
                  <div className="flex flex-col items-center">
                    <span className="tracking-wider max-w-20 capitalize">{role.roleName.replace(/_/g, " ")}</span>
                  </div>
                </th>
              ))}
              
              {/*
              {roles.map(role => (
                <th key={role.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider min-w-24">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded ${role.color} mb-1`} />
                    <span className="tracking-wider max-w-20">{role.name}</span>
                  </div>
                </th>
              ))}
              */}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(permissionsByRole(filteredPermissions)).map(([groupName, permissions], index) => (
              <React.Fragment key={index}>
                {groupName && (
                  <tr
                    className="text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer border-b-gray-300 dark:border-b-gray-600"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <td colSpan={roles.length} className="px-6 py-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{groupName?.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900 dark:text-white">{expandedGroupName === groupName ? '▲' : '▼'}</td>
                  </tr>
                )}

                {expandedGroupName === groupName && permissions.map(permission => (
                  <tr
                    key={permission.id}
                    // className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300`}
                  >
                    <td className="px-6 py-4 sticky left-0 bg-gray-100 dark:bg-gray-800 z-100">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize indent-6">
                            {permission.permName}
                          </span>
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasPermission = role?.permissions?.includes(permission.permId);
                      const isSystemRoleLocked = SYSTEM_ROLE === role.id && !isSystemAdmin;
                      return (
                        <td key={role.id} className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                !isSystemRoleLocked && handlePermissionToggle(role.id, permission.permId)
                                // handlePermissionToggle(role.id, permission.permId)
                              }
                              disabled={isSystemRoleLocked}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                hasPermission
                                  // ? "bg-green-500 border-green-500 text-white"
                                  ? (
                                    isSystemRoleLocked ? "bg-green-300 border-green-300 text-white" : "bg-green-500 border-green-500 text-white"
                                    // "bg-green-500 border-green-500 text-white"
                                  )
                                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                              } ${
                                isSystemRoleLocked ? "cursor-not-allowed" : "hover:border-green-400"}`
                                // "hover:border-green-400"}`
                              }
                            >
                              {hasPermission && <CheckLineIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/*
            {permissionsByRole.map(({ groupName, permissions }, index) => (
              <React.Fragment key={index}>
                {groupName && (
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={roles.length + 1} className="px-6 py-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{groupName?.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {permissions.map(permission => (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 sticky left-0">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {permission.permName}
                          </span>
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasPermission = role?.permissions?.includes(permission.permId);
                      // const updateKey = `${role.id}-${permission.permId}`;
                      // const isPending = pendingUpdates.has(updateKey);
                      return (
                        <td key={role.id} className="px-3 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              // onClick={() => onPermissionToggle(role.id, permission.id)}
                              onClick={() => handlePermissionToggle(role.id, permission.permId)}
                              // onClick={() => !isPending && handlePermissionToggle(role.id, permission.permId)}
                              // disabled={isPending}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                hasPermission 
                                  ? "bg-green-500 border-green-500 text-white" 
                                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                              } "hover:border-green-400"`}
                            >
                              {hasPermission && <CheckLineIcon className="w-4 h-4" />}
                              {isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : hasPermission ? (
                                <CheckLineIcon className="w-4 h-4" />
                              ) : null}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            */}

            {/*
            {permissionsByCategory.map(({ category, permissions }) => (
              <React.Fragment key={category.id}>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <td colSpan={roles.length + 1} className="px-6 py-3">
                    <div className="flex items-center">
                      <category.icon className={`w-5 h-5 mr-2 ${category.color}`} />
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    </div>
                  </td>
                </tr>
                {permissions.map(permission => (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 sticky left-0 bg-white dark:bg-gray-800">
                      <div>
                        <div className="flex items-center">
                          <span 
                            className="text-sm font-medium text-gray-900 dark:text-white"
                            title={`${permission.dangerous ? "Dangerous permission" : permission.name}`}
                          >
                            {permission.name}
                          </span>
                          {permission.dangerous && (
                            <AlertHexaIcon className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {permission.description}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            permission.level === "read" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                            permission.level === "write" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" :
                            permission.level === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" :
                            "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {permission.level}
                          </span>
                          {permission.dependencies && permission.dependencies.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400" title={`Depends on: ${permission.dependencies.join(", ")}`}>
                              Dependencies: {permission.dependencies.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasPermission = role.permissions.includes(permission.id);
                      const isDisabled = role.isSystem;
                      return (
                        <td key={role.id} className="px-3 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => !isDisabled && onPermissionToggle(role.id, permission.id)}
                              disabled={isDisabled}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                hasPermission 
                                  ? "bg-green-500 border-green-500 text-white" 
                                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                              } ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-green-400"}`}
                            >
                              {hasPermission && <CheckLineIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            */}
          </tbody>
        </table>
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("crud.common.zero_records")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t("crud.common.no_records").replace("_ENTITY_", t("crud.role_privilege.name"))}
          </p>
        </div>
      )}

      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-center">
          {/* <h3 className="text-lg font-medium text-gray-900 dark:text-white">{""}</h3> */}
          <div className="flex items-center space-x-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => !loading && handlePermissionSave()}
              disabled={loading}
              className={loading ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading ? t("crud.role_privilege.confirm.button.saving") : t("crud.role_privilege.action.button.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivilegeMatrixContent;
