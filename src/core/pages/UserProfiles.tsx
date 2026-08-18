// src/core/pages/UserProfiles.tsx
import { useEffect, useState } from "react";
import { UserProfileProvider } from "@/core/context/UserProfileContext";
import { useTranslation } from "@/core/hooks/useTranslation";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import UserAuditLog from "@/core/components/UserProfile/UserAuditLog";
import UserInfoCard from "@/core/components/UserProfile/UserInfoCard";
import UserMetaCard from "@/core/components/UserProfile/UserMetaCard";
import UserOrganizationCard from "@/core/components/UserProfile/UserOrganizationCard";

const UserProfiles = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUsername, setCurrentUsername] = useState<string>("");

  // Debug translation
  // useEffect(() => {
  //   console.log("Translation test:", t("navigation.home"));
  // }, [t]);

  // Get current user"s username from localStorage
  useEffect(() => {
    try {
      const profileString = localStorage.getItem("profile");
      if (profileString) {
        const profile = JSON.parse(profileString);
        setCurrentUsername(profile?.username || "");
      }
    }
    catch (error) {
      console.error("Error parsing profile from localStorage:", error);
    }
  }, []);

  const tabs = [
    { key: "profile", label: t("userform.profile") || "Profile" },
    // { key: "activity", label: t("userform.activity") || "Activity" },
    { key: "auditLog", label: t("userform.auditLog") || "Audit Log" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserOrganizationCard />
          </div>
        );
      // case "activity":
      //   return (
      //     <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      //       {"Activity data Here"}
      //     </div>
      //   );
      case "auditLog":
        return currentUsername ? (
          <UserAuditLog username={currentUsername} />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t("userform.cannotLoadUserData")}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <UserProfileProvider>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb 
        items={[
          { label: t("navigation.home"), href: "/" },
          { label: t("navigation.sidebar.menu.user_profile") }
        ]} 
      />
      
      <div className="space-y-6">
        {/* Tab Navigation and Content */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-500 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
}

export default UserProfiles;
