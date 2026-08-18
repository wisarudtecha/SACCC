// /src/components/admin/user-management/role-privilege/RoleFormModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Permission, Role } from "@/core/types/role";

const RoleFormModalContent: React.FC<{
  role: Role;
  permissions: Permission[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Partial<Role>) => void;
  mode: "add" | "edit";
}> = ({ role, permissions, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState({
    orgId: "",
    roleName: "",
    active: false,
    permissions: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role && mode === "edit") {
      setFormData({
        orgId: role.orgId,
        roleName: role.roleName || "",
        active: role.active,
        permissions: role.permissions || [],
      });
    } else {
      setFormData({
        orgId: "",
        roleName: "",
        active: false,
        permissions: [],
      });
    }
    setErrors({});
  }, [role, mode, isOpen]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const groupName = permission.groupName?.replace(/ /g, "_");
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.orgId.trim()) {
      newErrors.name = "Organization ID is required";
    }

    if (!formData.roleName.trim()) {
      newErrors.name = "Role name is required";
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(formData);
      onClose();
    }
    catch (error) {
      console.error("Error saving role:", error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    const hasAll = categoryPermissions.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: hasAll
        ? prev.permissions.filter(p => !categoryPermissions.includes(p))
        : [...new Set([...prev.permissions, ...categoryPermissions])]
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === "add" ? "Add New Role" : "Edit Role"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            X
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.roleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter role name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions *
              </label>
              {errors.permissions && (
                <p className="mb-2 text-sm text-red-600 dark:text-red-400">{errors.permissions}</p>
              )}
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => {
                  const categoryCount = permissions.filter(p => formData.permissions.includes(p.id)).length;
                  const hasAll = categoryCount === permissions.length;
                  const hasPartial = categoryCount > 0 && categoryCount < permissions.length;

                  return (
                    <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {category.replace("_", " ")}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {categoryCount}/{permissions.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                hasAll
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : hasPartial
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {hasAll ? "All" : hasPartial ? "Partial" : "None"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {permission.permName}
                                </h4>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  Saving...
                </>
              ) : (
                <>
                  {mode === "add" ? "Create Role" : "Update Role"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleFormModalContent;
