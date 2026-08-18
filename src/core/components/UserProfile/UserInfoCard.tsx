// /src/components/UserProfile/UserInfoCard.tsx
// import { useUserProfile } from "@/core/context/UserProfileContext";
import { useUserProfile } from "@/core/context/UserProfileContextObject";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UserInfoCardProps } from "@/core/types/user";

// Helper function to format date
const formatDate = (dateString: string | undefined, t: (key: string) => string): string => {
  if (!dateString) return t("userform.na");
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return t("userform.na");
  }
};

// Helper function to format gender
const formatGender = (gender: number | undefined, t: (key: string) => string): string => {
  if (gender === undefined || gender === null) return t("userform.na");
  switch (gender) {
    case 1: return t("userform.genderMale");
    case 2: return t("userform.genderFemale");
    case 9: return t("userform.genderOther");
    default: return t("userform.na");
  }
};

export default function UserInfoCard({ userData: propUserData, loading: propLoading, error: propError }: UserInfoCardProps = {}) {
  const { t } = useTranslation();

  // Always call useUserProfile, then fallback to props if context is null/undefined
  // const contextProfile = useUserProfile();
  // const userData = contextProfile?.userData || propUserData;
  // const loading = contextProfile?.loading || propLoading;
  // const error = contextProfile?.error || propError;
  let userData, loading, error;
  try {
    const contextProfile = useUserProfile();
    userData = contextProfile.userData || propUserData;
    loading = contextProfile.loading || propLoading;
    error = contextProfile.error || propError;
  }
  catch {
    userData = propUserData || null;
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
  //     loading: propLoading || false,
  //     error: propError || null
  //   };
  // }
  
  // const { userData, loading, error } = contextData;

  if (loading) {
    return <div className="p-5 text-center text-gray-900 dark:text-white">{t("userform.loadingUserData")}</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-500 dark:text-red-400">{error}</div>;
  }

  if (!userData) {
    return <div className="p-5 text-center text-gray-500 dark:text-gray-400">{t("userform.noUserData")}</div>;
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6 cursor-default">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("userform.personal")}
        </h4>
      </div>

      <div>
        <div className="flex flex-col gap-6">
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.firstName")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.firstName || t("userform.na")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.lastName")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.lastName || t("userform.na")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.email")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.email || t("userform.na")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.mobile")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.mobileNo || t("userform.na")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.citizenId")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.citizenId || t("userform.na")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.dob")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(userData.bod, t)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.gender")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {/* {formatGender(typeof userData.gender === "number" ? userData.gender : undefined, t)} */}
                  {formatGender(typeof userData.gender === "number" ? userData.gender : (userData.gender ? parseInt(userData.gender, 10) : undefined), t)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("userform.blood")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userData.blood || t("userform.na")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
