// /src/components/admin/user-management/role-privilege/RoleCard.tsx
import React
  // , 
  // {
  //   useMemo,
  //   useState
  // }
from "react";
// import { mapPermissionsWithCategories } from "@/cms/utils/dataMappers";
import {
  CheckLineIcon,
  CloseLineIcon,
  LockIcon,
  // PencilIcon,
  // TimeIcon
} from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import { SYSTEM_ROLE } from "@/cms/utils/constants";
import { formatDate } from "@/core/utils/crud";
import { permissionsByRole } from "@/core/utils/dataMappers";
import type {
  Permission,
  Role,
  // RolePermission
} from "@/core/types/role";
// import Button from "@/core/components/ui/button/Button";
// import permissionCategories from "@/mocks/permissionCategories.json";

// ===================================================================
// Utility Functions
// ===================================================================

// const GetPermissionsByCategory = (permissions: string[]) => {
//   const allPermissions: Permission[] = useMemo(() => mapPermissionsWithCategories(), []);
//   return permissionCategories.map(category => ({
//     category,
//     permissions: allPermissions.filter(p => 
//       p.category?.id === category.id && permissions.includes(p.id)
//     )
//   })).filter(item => item.permissions.length > 0);
// };

const RoleCardContent: React.FC<{
  role: Role;
  // rolePermissions: RolePermission[];
  permission: Permission[];
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onClone?: (role: Role) => void;
  onViewPermissions?: (role: Role) => void;
}> = ({
  role,
  // rolePermissions,
  permission,
  // onEdit,
  // onDelete,
  // onClone,
  // onViewPermissions
}) => {
  const { t } = useTranslation();

  // const [showActions, setShowActions] = useState(false);

  const permissionByRole = Object.values(permissionsByRole(permission.filter(p => (role.permissions || []).includes(p.permId)))) || [];

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/*
          <div
            // className={`p-2 rounded-lg ${role.color}`}
            className={`p-2 rounded-lg`}
          >
            <LockIcon className="w-5 h-5 text-gray-900 dark:text-white" />
          </div>
          */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
              {role.roleName.replace(/_/g, " ")}
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.active
                  ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                  : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                }`}>
                {role.active ? <CheckLineIcon className="w-3 h-3 mr-1" /> : <CloseLineIcon className="w-3 h-3 mr-1" />}
                {role.active ? t("common.active") : t("common.inactive")}
              </span>

              {role.id === SYSTEM_ROLE && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <LockIcon className="w-3 h-3 mr-1" />
                  {t("crud.role_privilege.unit.system")}
                </span>
              )}

              {/*
              {role.isSystem && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <LockIcon className="w-3 h-3 mr-1" />
                  System
                </span>
              )}
              */}
            </h3>

            {/* <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 min-h-15 xl:min-h-0">{role.description}</p> */}
          </div>
        </div>

        {/* <div className="relative">
          <Button
            onClick={() => setShowActions(!showActions)}
            // className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            variant="outline"
            size="xs"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          {showActions && (
            <div className="absolute top-14 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              {onEdit && (
                <button
                  onClick={() => { onEdit(role); setShowActions(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit Role
                </button>
              )}
              {onViewPermissions && (
                <button
                  onClick={() => { onViewPermissions(role); setShowActions(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  View Permissions
                </button>
              )}
              {onClone && (
                <button
                  onClick={() => { onClone(role); setShowActions(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clone Role
                </button>
              )}
              {!role.isSystem && onDelete && (
                <>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => { onDelete(role); setShowActions(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Role
                  </button>
                </>
              )}
            </div>
          )}
        </div> */}
      </div>

      <div className="space-y-3">
        {/*
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Level:</span>
          <span className="text-gray-900 dark:text-white">{role.level}</span>
        </div>
        */}
        {/*
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Users:</span>
          <span className="text-gray-900 dark:text-white">{role.userCount}</span>
        </div>
        */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t("crud.role_privilege.list.header.permission")}:</span>
          <span className="text-gray-900 dark:text-white">{role?.permissions?.length || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t("crud.role_privilege.list.header.updatedAt")}:</span>
          <span className="text-gray-900 dark:text-white">
            {/* {new Date(role.updatedAt || "").toLocaleDateString()} */}
            {formatDate(role.updatedAt || "")}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 min-h-6">
          {permissionByRole.slice(0, 2).map((item, key) => {
            if (item[key]) {
              return (
                <div
                  key={`${item[key]?.permId}-${key}`}
                  className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                  // title={item[key].groupName}
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
      </div>

      {/*
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {GetPermissionsByCategory(role.permissions).slice(0, 3).map(item => {
            return (
              <div
                key={item.category.id}
                className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                title={item.category.name}
              >
                <span className="text-gray-700 dark:text-gray-300">{item.category.name[0]}</span>
              </div>
            );
          })}
          {GetPermissionsByCategory(role.permissions).length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{GetPermissionsByCategory(role.permissions).length - 3} more
            </span>
          )}
        </div>
      </div>
      */}
    </>
  );
};

export default RoleCardContent;
