import { useMemo } from "react";
import { User, Phone, Mail, Building, Briefcase, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog";
import {
  DepartmentCommandStationDataMerged,
  mergeDeptCommandStation,
} from "@/cms/store/api/caseApi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserRolesQuery } from "@/core/store/api/userApi";
import type { UserProfile } from "@/core/types/user";
import type { Role } from "@/core/types/role";

interface UserProfileModalProps {
  user: UserProfile | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function formatUserType(userType: string | number | undefined, t: (key: string) => string): string {
  if (userType === undefined || userType === null) return t("userform.na");
  const num = typeof userType === "string" ? parseInt(userType, 10) : userType;
  switch (num) {
    case 1: return t("userform.userTypeInternal") || "Internal";
    case 2: return t("userform.userTypeOutsource") || "Outsource";
    default: return t("userform.userTypeUnknown") || "Unknown";
  }
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const { t, language } = useTranslation();

  const { data: rolesResponse } = useGetUserRolesQuery(
    { start: 0, length: 100 },
    { skip: !isOpen }
  );

  const roles: Role[] = useMemo(() => {
    if (Array.isArray(rolesResponse)) return rolesResponse;
    return (rolesResponse as { data?: Role[] } | undefined)?.data ?? [];
  }, [rolesResponse]);

  const roleName = useMemo(() => {
    if (!user?.roleId) return "";
    const role = roles.find((r) => String(r.id) === String(user.roleId));
    if (!role) return "";
    const lang = language === "th" ? "th" : "en";
    return role[lang] ?? role.roleName ?? "";
  }, [roles, user?.roleId, language]);

  const deptCommandStations = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("DeptCommandStations") ?? "[]"
      ) as DepartmentCommandStationDataMerged[],
    []
  );

  const station = useMemo(() => {
    if (!user) return undefined;
    return deptCommandStations.find(
      (item) =>
        item.commId === user.commId &&
        item.stnId === user.stnId &&
        item.deptId === user.deptId
    );
  }, [deptCommandStations, user]);

  const fullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    [user]
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-2xl w-[90vw] md:w-[60vw] z-1000001 rounded-lg shadow-2xl overflow-y-auto custom-scrollbar flex flex-col"
      >
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            {t("userform.profile")}
          </DialogTitle>
        </DialogHeader>

        {!user ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("userform.noUserData")}
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Header: Avatar + Name + Status */}
            <div className="flex items-center gap-4">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-medium">
                  {(user.firstName?.[0] ?? user.username[0])?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {user.displayName || fullName || user.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{user.username}
                </p>
                <span
                  className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.active
                      ? "bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-300"
                  }`}
                >
                  {user.active ? t("status.active") : t("status.inactive")}
                </span>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-500 dark:text-blue-400 text-sm mb-3">
                {t("userform.contact")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.email")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5">
                    {user.email || "N/A"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.mobile")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5">
                    {user.mobileNo || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-500 dark:text-blue-400 text-sm mb-3">
                {t("userform.orgInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.role")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5 capitalize">
                    {roleName || t("userform.na")}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.orgInfo")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5">
                    {(station && mergeDeptCommandStation(station)) || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Employment */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-500 dark:text-blue-400 text-sm mb-3">
                {t("userform.employment")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.empId")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5">
                    {user.empId || "N/A"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      {t("userform.userType")}
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-5">
                    {formatUserType(user.userType, t)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
