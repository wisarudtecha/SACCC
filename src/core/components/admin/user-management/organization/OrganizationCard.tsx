// /src/components/admin/user-management/organization/OrganizationCard.tsx
import React, { useEffect, useState } from "react";
import { CheckLineIcon, CloseLineIcon } from "@/core/icons";
import { formatLastLogin } from "@/core/utils/crud";
import { isValidImageUrl, isValidImageUrlByContentType } from "@/core/utils/resourceValidators";
import type { Role } from "@/core/types/role";
import type { UserProfile } from "@/core/types/user";

const OrganizationCardContent: React.FC<{
  user: UserProfile;
  role: Role;
}> = ({ user, role }) => {
  const statusConfig = user.active
    ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
    : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: CloseLineIcon };
  const Icon = statusConfig.icon;

  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    const checkImageValidity = async () => {
      if (user.photo && (isValidImageUrl(user.photo) || await isValidImageUrlByContentType(user.photo))) {
        setPhoto(user.photo);
      }
    };
    checkImageValidity();
  }, [user.photo, user.firstName, user.lastName, user.email]);

  return (
    <>
      <div className={`xl:flex items-start justify-between mb-4`}>
        <div className="xl:flex items-center gap-3 min-w-0 xl:flex-1">
          {photo ? (
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src={photo} alt={user.displayName} />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
              <span className="w-20 text-center uppercase">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.firstName.trim()} {user.middleName?.trim()} {user.lastName.trim()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            <span className={`items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}>
              <Icon className="w-4 h-4 inline mr-1" />
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className={`xl:flex items-center justify-between`}>
        <div className="xl:flex items-center gap-4 text-xs">
          <div className="xl:flex items-center gap-1 min-h-4">
            <span className="text-gray-900 dark:text-white capitalize">{role?.roleName?.replace(/_/g, " ") || "Guest"}</span>
          </div>
        </div>
        
        {user.lastLogin && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Last Login {formatLastLogin(user.lastLogin)}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default OrganizationCardContent;
