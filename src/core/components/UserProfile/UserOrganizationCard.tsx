// /src/components/UserProfile/UserOrganizationCard.tsx
// import { useUserProfile } from "@/core/context/UserProfileContext";
import { useUserProfile } from "@/core/context/UserProfileContextObject";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UserOrganizationCardProps } from "@/core/types/user";

// Helper function to format user type
const formatUserType = (userType: number | undefined, t: (key: string) => string, language: string | undefined): string => {
  if (userType === undefined || userType === null) return t("userform.na");
  switch (userType) {
    // case 0: return t("userform.userTypeRegular");
    // case 1: return t("userform.userTypeAdmin");
    // case 2: return t("userform.userTypeSuperAdmin");
    case 1: return language === "th" && "ภายใน" || "Internal";
    case 2: return language === "th" && "ภายนอก" || "Outsource";
    default: return t("userform.userTypeUnknown");
  }
};

export default function UserOrganizationCard({ 
  userData: propUserData, 
  rolesData: propRolesData, 
  departmentsData: propDepartmentsData, 
  commandsData: propCommandsData, 
  stationsData: propStationsData, 
  loading: propLoading, 
  error: propError 
}: UserOrganizationCardProps = {}) {
  const { language, t } = useTranslation();

  // Always call useUserProfile, then fallback to props if context is null/undefined
  // const contextProfile = useUserProfile();
  // const userData = contextProfile.userData || propUserData;
  // const rolesData = contextProfile.rolesData || propRolesData;
  // const departmentsData = contextProfile.departmentsData || propDepartmentsData;
  // const commandsData = contextProfile.commandsData || propCommandsData;
  // const stationsData = contextProfile.stationsData || propStationsData;
  // const loading = contextProfile.loading || propLoading;
  // const error = contextProfile.error || propError;
  let userData, rolesData, departmentsData, commandsData, stationsData, loading, error;
  try {
    const contextProfile = useUserProfile();
    userData = contextProfile.userData || propUserData;
    rolesData = contextProfile.rolesData || propRolesData;
    departmentsData = contextProfile.departmentsData || propDepartmentsData;
    commandsData = contextProfile.commandsData || propCommandsData;
    stationsData = contextProfile.stationsData || propStationsData;
    loading = contextProfile.loading || propLoading;
    error = contextProfile.error || propError;
  }
  catch {
    userData = propUserData || null;
    rolesData = propRolesData || [];
    departmentsData = propDepartmentsData || [];
    commandsData = propCommandsData || [];
    stationsData = propStationsData || [];
    loading = propLoading || false;
    error = propError || null;
  }
  
  // // Try to use context first, fallback to props
  // let contextData;
  // try {
  //   contextData = useUserProfile();
  // } catch {
  //   // Context not available, use props or defaults
  //   contextData = {
  //     userData: propUserData || null,
  //     rolesData: propRolesData || [],
  //     departmentsData: propDepartmentsData || [],
  //     commandsData: propCommandsData || [],
  //     stationsData: propStationsData || [],
  //     loading: propLoading || false,
  //     error: propError || null
  //   };
  // }
  
  // const { userData, rolesData, departmentsData, commandsData, stationsData, loading, error } = contextData;

  // Get display names for current values
  const getCommandName = (commId: string | undefined): string => {
    if (!commId) return t("userform.na");
    const command = commandsData.find((c) => c.commId === commId || c.id === commId);
    return command?.name || t("userform.na");
  };

  const getDepartmentName = (deptId: string | undefined): string => {
    if (!deptId) return t("userform.na");
    const department = departmentsData.find((d) => d.deptId === deptId || d.id === deptId);
    return department?.name || t("userform.na");
  };

  const getStationName = (stnId: string | undefined): string => {
    if (!stnId) return t("userform.na");
    const station = stationsData.find((s) => s.stnId === stnId || s.id === stnId);
    return station?.name || t("userform.na");
  };

  const getRoleName = (roleId: string | undefined) => {
    if (!roleId) return t("userform.na");
    const role = rolesData.find((r) => r.id === roleId);
    return role?.name || t("userform.na");
  };

  if (loading) {
    return <div className="p-5 text-center text-gray-900 dark:text-white">{t("userform.loadingUserData")}</div>;
  }

  if (error && !userData) {
    return <div className="p-5 text-center text-red-500 dark:text-red-400">{error}</div>;
  }

  if (!userData) {
    return <div className="p-5 text-center text-gray-500 dark:text-gray-400">{t("userform.noUserData")}</div>;
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 cursor-default">
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white lg:mb-6">
            {t("userform.orgInfo")}
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.empId")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userData.empId || t("userform.na")}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.userType")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {/* {formatUserType(typeof userData.userType === "number" ? userData.userType : undefined, t, language)} */}
                {formatUserType(typeof userData.userType === "number" ? userData.userType : (userData.userType ? parseInt(userData.userType, 10) : undefined), t, language)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.command")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getCommandName(userData.commId)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.department")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getDepartmentName(userData.deptId)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.station")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getStationName(userData.stnId)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("userform.role")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {getRoleName(userData.roleId).replace(/_/g, " ")}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("status.status")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  userData.active 
                    ? "bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-300" 
                    : "bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-300"
                }`}>
                  {userData.active ? t("status.active") : t("status.inactive")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
