// src/core/components/admin/user-management/user-group/GroupMembersView.tsx
// Group-side membership view: for the selected group, toggle which users belong to it.
//
// Presentational: the parent (UserGroupManagement) seeds `memberList` from GetUserGroupById's
// embedded `users` field (one call, see getUserGroupById) and persists the full set on save via
// assignUserGroupBatch.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckLineIcon, LockIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UserProfile } from "@/core/types/user";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

const GroupMembersView: React.FC<{
  loading: boolean;
  users: UserProfile[];
  memberList: string[];
  grpId: string;
  onMemberToggle: (userName: string) => void;
  onMembersSave: () => void;
}> = ({
  loading,
  users,
  memberList,
  grpId,
  onMemberToggle,
  onMembersSave,
}) => {
  const { t } = useTranslation();

  const [search, setSearch] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => setMaxHeight((window.innerHeight * 0.7) - 250);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      (u.username || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  }, [users, search]);

  // Disabled while there's no selected group, or while the derived member list is loading
  // (initial fetch) or a save is in flight — both share the `loading` prop.
  const isDisabled = !grpId || loading;

  return (
    <div className="bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wider cursor-default">
            {t("crud.user_group.list.members.title")}
          </span>
          <div className="w-56">
            <Input
              placeholder={t("crud.user.list.toolbar.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto" ref={containerRef} style={{ maxHeight }}>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredUsers.map(user => {
            const isMember = memberList.includes(user.username);
            return (
              <div
                key={user.username}
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
              >
                <button
                  onClick={() => onMemberToggle(user.username)}
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
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {user.firstName?.trim()} {user.lastName?.trim()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user.username}{user.email ? ` • ${user.email}` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredUsers.length === 0 && (
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
            onClick={() => !loading && onMembersSave()}
            disabled={loading || !grpId}
            className={loading || !grpId ? "opacity-50 cursor-not-allowed" : ""}
          >
            {loading ? t("crud.user_group.list.members.button.saving") : t("crud.user_group.list.members.button.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersView;
