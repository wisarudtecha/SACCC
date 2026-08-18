// src/core/components/admin/user-management/user/UserGroupsView.tsx
// User-side membership view: for the previewed user, toggle which groups they belong to.
//
// Presentational. The parent (UserManagement) seeds `groupList` from the user's current groups
// (getUserGroupsByUsername) and persists changes on save (assign/deleteAssign). This view calls
// `onUserChange` once when the previewed user changes so the parent can point its query at them.
import React, { useEffect, useRef, useState } from "react";
import { CheckLineIcon, LockIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UserGroup } from "@/core/types/user";
import Button from "@/core/components/ui/button/Button";

const UserGroupsView: React.FC<{
  loading: boolean;
  groups: UserGroup[];
  groupList: string[];
  userName: string;
  onGroupToggle: (grpId: string) => void;
  onUserGroupsSave: () => void;
  onUserChange: (userName: string) => void;
}> = ({
  loading,
  groups,
  groupList,
  userName,
  onGroupToggle,
  onUserGroupsSave,
  onUserChange,
}) => {
  const { language, t } = useTranslation();

  // The preview modal supports navigating between users while open. Detect the previewed
  // user actually changing and let the parent clear its selection.
  const [trackedUser, setTrackedUser] = useState<string>("");
  useEffect(() => {
    if (userName && userName !== trackedUser) {
      onUserChange(userName);
      setTrackedUser(userName);
    }
  }, [userName, trackedUser, onUserChange]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => setMaxHeight((window.innerHeight * 0.7) - 210);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const isDisabled = !userName;

  return (
    <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-default">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider">
          {t("crud.user.list.group.update.title")}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto" ref={containerRef} style={{ maxHeight }}>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {groups.map(group => {
            const isMember = groupList.includes(group.grpId);
            return (
              <div
                key={group.grpId}
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                <button
                  onClick={() => onGroupToggle(group.grpId)}
                  disabled={isDisabled}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0
                    ${
                      isMember
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-green-400 cursor-pointer"}`}
                >
                  {isMember && <CheckLineIcon className="w-4 h-4" />}
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">
                    {language === "th" && group.th || group.en || group.grpId}
                  </span>
                  {group.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{group.description}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("crud.common.zero_records")}
          </h3>
        </div>
      )}

      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={() => !loading && onUserGroupsSave()}
            disabled={loading || !userName}
            className={loading || !userName ? "opacity-50 cursor-not-allowed" : ""}
          >
            {loading ? t("crud.user.list.group.update.button.saving") : t("crud.user.list.group.update.button.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserGroupsView;
