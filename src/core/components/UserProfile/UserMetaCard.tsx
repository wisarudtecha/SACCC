// src/core/components/UserProfile/UserMetaCard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockIcon, PencilIcon } from "@/core/icons";
// import { useUserProfile } from "@/core/context/UserProfileContext";
import { useUserProfile } from "@/core/context/UserProfileContextObject";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
// import { AuthService } from "@/cms/utils/authService";
import { formatAddress, isValidJsonString } from "@/core/utils/stringFormatters";
import type { Address, UserMetaCardProps } from "@/core/types/user";
import Toast from "@/core/components/toast/Toast";
import ChangePasswordModal from "@/core/components/UserProfile/ChangePasswordModal";
import ResetPasswordModal from "@/core/components/UserProfile/ResetPasswordModal";

export default function UserMetaCard({ userData: propUserData, loading: propLoading, error: propError }: UserMetaCardProps = {}) {
  // const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  // useEffect(() => {
  //   const fetchSystemAdminStatus = async () => {
  //     setIsSystemAdmin(await AuthService.isSystemAdmin());
  //   }
  //   fetchSystemAdminStatus();
  // }, [isSystemAdmin]);
  const isSystemAdmin = useIsSystemAdmin();
  
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();
  const { t } = useTranslation();

  // Always call useUserProfile, then fallback to props if context is null/undefined
  // const contextProfile = useUserProfile();
  // const userData = contextProfile.userData || propUserData;
  // const loading = contextProfile.loading || propLoading;
  // const error = contextProfile.error || propError;
  let userData, loading, error, selfProfile;
  try {
    const contextProfile = useUserProfile();
    userData = contextProfile.userData || propUserData;
    loading = contextProfile.loading || propLoading;
    error = contextProfile.error || propError;
    selfProfile = true;
  }
  catch {
    userData = propUserData || null;
    loading = propLoading || false;
    error = propError || null;
    selfProfile = false;
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
  
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const rawAddress: string = userData?.address || "";
  const location: Address = isValidJsonString(rawAddress) ? JSON.parse(rawAddress) : null;
  const address: string = location ? formatAddress(location) : rawAddress;

  const handlePasswordChangeSuccess = () => {
    addToast("success", t("userform.passwordChangeSuccessToast"));
  };

  useEffect(() => {
    if (userData) {
      const asRecord = userData as unknown as Record<string, string | undefined>;
      setSocialLinks({
        facebook: asRecord["facebook"] || "",
        twitter: asRecord["twitter"] || "",
        linkedin: asRecord["linkedin"] || "",
        instagram: asRecord["instagram"] || ""
      });
    }
  }, [userData]);

  // Set social links when userData changes
  // if (userData && socialLinks.facebook === "") {
  //   const asRecord = userData as unknown as Record<string, string | undefined>;
  //   setSocialLinks({
  //     // facebook: (userData as any).facebook || "https://www.facebook.com/(example)Del"pattaradanai",
  //     // twitter: (userData as any).twitter || "https://x.com/(example)Del"pattaradanai",
  //     // linkedin: (userData as any).linkedin || "https://www.linkedin.com/company/(example)Del"pattaradanai",
  //     // instagram: (userData as any).instagram || "https://instagram.com/(example)Del"pattaradanai"
  //     facebook: asRecord["facebook"] || "",
  //     twitter: asRecord["twitter"] || "",
  //     linkedin: asRecord["linkedin"] || "",
  //     instagram: asRecord["instagram"] || ""
  //   });
  // }

  const handleEdit = () => {
    if (userData?.id) {
      navigate(`/user/${userData.id}/edit`, { state: { from: "profile" } });
    }
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
    <div
      className="p-5 border border-gray-200 rounded-2xl dark:border-gray-700 lg:p-6"
      // className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          {userData?.photo ? (
            <div className="w-20 h-20 overflow-hidden border border-gray-100 rounded-full dark:border-gray-800 cursor-default">
              <img 
                src={userData.photo || "/images/notification/user.jpg"} 
                alt={t("userform.profilePhoto")} 
                // className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/notification/user.jpg";
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
              <span className="w-20 text-center uppercase">
                {userData.firstName[0]}{userData.lastName[0]}
              </span>
            </div>
          )}
          <div className="order-3 xl:order-2 cursor-default">
            <h4
              className="mb-2 text-lg font-semibold text-center text-gray-900 dark:text-white xl:text-left"
              // className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left"
            >
              {userData.displayName || `${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim()}
            </h4>
            {(userData.email || userData?.address) && (
              <div className="flex flex-col items-center xl:items-start gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {userData?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userData.email}
                  </p>
                )}
                {userData?.address && (
                  <>
                    <div
                      className="hidden h-3.5 w-px bg-gray-200 dark:bg-gray-700 xl:block"
                      // className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"
                    ></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {/* {userData.address} */}
                      {address}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Social Media Icons */}
          {(socialLinks?.facebook || socialLinks?.twitter || socialLinks?.linkedin || socialLinks?.instagram) && (
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"/>
                  </svg>
                </a>
              )}
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z"/>
                  </svg>
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z"/>
                  </svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463C18.3336 9.84055 18.3336 9.91888 18.3336 9.99972L18.3335 10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333C10.1594 18.333 10.0811 18.333 10.0002 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {/*
          {selfProfile && (
            <div className="flex items-center order-3 gap-2 grow xl:order-4 xl:justify-end">
              <button
                onClick={handleEdit}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
              >
                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="currentColor"/>
                </svg>
                {t("common.edit")}
              </button>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-theme-xs hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 lg:inline-flex lg:w-auto"
              >
                <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1C6.8925 1 6 1.8925 6 3V5H3C2.4475 5 2 5.4475 2 6V13C2 13.5525 2.4475 14 3 14H13C13.5525 14 14 13.5525 14 13V6C14 5.4475 13.5525 5 13 5H10V3C10 1.8925 9.1075 1 8 1ZM8 2C8.5525 2 9 2.4475 9 3V5H7V3C7 2.4475 7.4475 2 8 2ZM8 8.5C8.8284 8.5 9.5 9.1716 9.5 10C9.5 10.8284 8.8284 11.5 8 11.5C7.1716 11.5 6.5 10.8284 6.5 10C6.5 9.1716 7.1716 8.5 8 8.5Z" fill="currentColor"/>
                </svg>
                {t("userform.changePassword")}
              </button>
            </div>
          )}
          */}

          {(selfProfile || permissions.hasPermission("user.update") || permissions.hasPermission("user.reset_password") || isSystemAdmin) && (
            <div className={`${selfProfile && "flex items-center" || "text-right space-x-2 space-y-2"} order-3 gap-2 grow xl:order-4 xl:justify-end`}>
              {(selfProfile || permissions.hasPermission("user.update") || isSystemAdmin) && (
                <button
                  onClick={handleEdit}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white my-1 px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                >
                  <PencilIcon className="w-4 h-4" />
                  {t("common.edit")}
                </button>
              )}
              {(selfProfile || permissions.hasPermission("user.reset_password") || isSystemAdmin) && (
                <button
                  onClick={() => (
                      selfProfile && setShowChangePasswordModal(true)
                    ) || (
                      (permissions.hasPermission("user.reset_password") || isSystemAdmin) && setShowResetPasswordModal(true)
                    ) || {}
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-300 bg-blue-50 my-1 px-4 py-3 text-sm font-medium text-blue-700 shadow-theme-xs hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 lg:inline-flex lg:w-auto"
                >
                  <LockIcon className="w-4 h-4" />
                  {t("userform.changePassword")}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/*
        <button
          onClick={handleEdit}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="currentColor"/>
          </svg>
          {t("common.edit")}
        </button>
        */}
      </div>
      
      {/* Password Management Buttons */}
      {/*
      <div className="flex flex-col gap-2 mt-4 lg:flex-row lg:gap-3">
        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 lg:w-auto"
        >
          <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C6.8925 1 6 1.8925 6 3V5H3C2.4475 5 2 5.4475 2 6V13C2 13.5525 2.4475 14 3 14H13C13.5525 14 14 13.5525 14 13V6C14 5.4475 13.5525 5 13 5H10V3C10 1.8925 9.1075 1 8 1ZM8 2C8.5525 2 9 2.4475 9 3V5H7V3C7 2.4475 7.4475 2 8 2ZM8 8.5C8.8284 8.5 9.5 9.1716 9.5 10C9.5 10.8284 8.8284 11.5 8 11.5C7.1716 11.5 6.5 10.8284 6.5 10C6.5 9.1716 7.1716 8.5 8 8.5Z" fill="currentColor"/>
          </svg>
          {t("userform.changePassword") || "เปลี่ยนรหัสผ่าน"}
        </button>
      </div>
      */}

      {/* Modals */}
      {selfProfile && (
        <ChangePasswordModal 
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userId={userData?.id?.toString()}
          onSuccess={handlePasswordChangeSuccess}
        />
      ) || ((permissions.hasPermission("user.reset_password") || isSystemAdmin) && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          onSuccess={handlePasswordChangeSuccess}
        />
      )) || ""}
      
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type === "warning" ? "info" : toast.type as "success" | "error" | "info"}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
