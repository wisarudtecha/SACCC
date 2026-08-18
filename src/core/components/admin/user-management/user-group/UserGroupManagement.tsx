// src/core/components/admin/user-management/user-group/UserGroupManagement.tsx
// Group management surface: list groups, create/edit/delete them, and manage each group's
// member users. Modeled on RoleManagement (EnhancedCrudContainer + MetricsView + Modal form).
//
// Persists via the real group endpoints (see src/core/mocks/userCURL.v2.sh): create/update/delete
// go through the RTK mutations and rely on "UserGroup" tag invalidation to refetch the list.
// The Members modal reads a group's member usernames directly from GetUserGroupById (via
// getUserGroupById), which returns the group's own record with a `users: string[]` field
// embedded (REST GET /user_groups/{grpId}, one call, no per-user derivation) — see
// UserGroupWithMembers. Saving relies on the same "UserGroup" tag invalidation to refetch.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { CheckLineIcon, CloseIcon, CloseLineIcon, GroupIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useIsSystemAdmin } from "@/core/hooks/useIsSystemAdmin";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useToast } from "@/core/hooks/useToast";
import {
  useCreateUserGroupMutation,
  useUpdateUserGroupMutation,
  useDeleteUserGroupMutation,
  useGetUserGroupByIdQuery,
  useAssignUserGroupBatchMutation,
} from "@/core/store/api/userApi";
import { formatDate } from "@/core/utils/crud";
import type { UserGroup, UserGroupCreateData, UserGroupMetrics, UserGroupWithMembers, UserProfile } from "@/core/types/user";
import MetricsView from "@/core/components/admin/MetricsView";
import GroupMembersView from "@/core/components/admin/user-management/user-group/GroupMembersView";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";

// grpId is server-generated and there is no description field (UserGroupInsertInput = active/en/th).
interface GroupFormState {
  en: string;
  th: string;
  active: boolean;
}

const emptyForm: GroupFormState = { en: "", th: "", active: true };

const UserGroupManagementComponent: React.FC<{
  groups: UserGroup[];
  users: UserProfile[];
}> = ({ groups, users }) => {
  const isSystemAdmin = useIsSystemAdmin();
  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [createUserGroup] = useCreateUserGroupMutation();
  const [updateUserGroup] = useUpdateUserGroupMutation();
  const [deleteUserGroup] = useDeleteUserGroupMutation();
  const [assignUserGroupBatch] = useAssignUserGroupBatchMutation();

  const [metrics, setMetrics] = useState<UserGroupMetrics>();
  useEffect(() => {
    setMetrics({
      totalGroups: groups.length,
      activeGroups: groups.filter(g => g.active).length,
      totalMembers: 0,
    });
  }, [groups]);

  // ===================================================================
  // Create / edit modal
  // ===================================================================

  const [groupSaveOpen, setGroupSaveOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>("");
  const [form, setForm] = useState<GroupFormState>(emptyForm);
  const [validateErrors, setValidateErrors] = useState<Partial<Record<keyof GroupFormState, string>>>({});

  const isEditAvailable = () => permissions.hasPermission("usergroup.update") || isSystemAdmin;
  const isDeleteAvailable = () => permissions.hasPermission("usergroup.delete") || isSystemAdmin;

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setValidateErrors({});
    setGroupSaveOpen(true);
  };

  // The group id used by update/delete/assign is its grpId (server-generated business key).
  const openEdit = (group: UserGroup) => {
    setEditingId(group.grpId);
    setForm({
      en: group.en || "",
      th: group.th || "",
      active: group.active,
    });
    setValidateErrors({});
    setGroupSaveOpen(true);
  };

  const handleFormReset = () => {
    setForm(emptyForm);
    setValidateErrors({});
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof GroupFormState, string>> = {};
    if (!form.en.trim()) {
      errors.en = t("crud.user_group.form.en.required");
    }
    if (!form.th.trim()) {
      errors.th = t("crud.user_group.form.th.required");
    }
    setValidateErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, t]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    if (!permissions.hasAnyPermission(["usergroup.create", "usergroup.update"]) && !isSystemAdmin) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    const payload: UserGroupCreateData = {
      active: form.active,
      en: form.en,
      th: form.th,
    };
    setLoading(true);
    try {
      const response = editingId
        ? await updateUserGroup({ id: editingId, data: payload }).unwrap()
        : await createUserGroup(payload).unwrap();
      if (response?.status) {
        addToast("success", editingId
          ? t("crud.user_group.action.group.update.success")
          : t("crud.user_group.action.group.create.success"));
        setGroupSaveOpen(false);
        handleFormReset();
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${editingId
        ? t("crud.user_group.action.group.update.error")
        : t("crud.user_group.action.group.create.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [validateForm, permissions, isSystemAdmin, addToast, t, editingId, form, createUserGroup, updateUserGroup]);

  // Real delete. apiConfig omits `delete`, so the container's confirm dialog calls this
  // (instead of a raw fetch), routing through the RTK mutation + tag invalidation.
  const handleDelete = async (id: string) => {
    if (!permissions.hasPermission("usergroup.delete") && !isSystemAdmin) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    try {
      const response = await deleteUserGroup(id).unwrap();
      if (response?.status) {
        addToast("success", t("crud.user_group.action.group.delete.success"));
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${t("crud.user_group.action.group.delete.error")}: ${error}`);
    }
  };

  // ===================================================================
  // Members modal
  // ===================================================================

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [memberList, setMemberList] = useState<string[]>([]);

  // One call gets the group's own record plus its member usernames (see file header). Skipped
  // until a group is actually selected and the modal is open.
  const { data: groupDetailData, isFetching: isMembersFetching } = useGetUserGroupByIdQuery(
    selectedGroup?.grpId ?? "",
    { skip: !membersOpen || !selectedGroup?.grpId }
  );
  const members = useMemo(
    () => (groupDetailData?.data as unknown as UserGroupWithMembers)?.users || [],
    [groupDetailData?.data]
  );
  // Seed the checklist whenever the fetched membership changes (new group selected, or a
  // refetch after save/invalidation); local toggles diverge from this until the next save.
  useEffect(() => {
    setMemberList(members);
  }, [members]);

  const openMembers = (group: UserGroup) => {
    setSelectedGroup(group);
    setMemberList([]);
    setMembersOpen(true);
  };

  const handleMemberToggle = useCallback((userName: string) => {
    setMemberList(prev => prev.includes(userName)
      ? prev.filter(u => u !== userName)
      : [...prev, userName]);
  }, []);

  const handleMembersSave = useCallback(async () => {
    if (!selectedGroup?.grpId) {
      return;
    }
    if (!permissions.hasPermission("usergroup.update") && !isSystemAdmin) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    setLoading(true);
    try {
      const response = await assignUserGroupBatch({
        grpId: selectedGroup.grpId,
        usernames: memberList,
      }).unwrap();
      if (response?.status) {
        addToast("success", t("crud.user_group.action.group.update.success"));
        setMembersOpen(false);
        // No manual cache update needed: this mutation invalidates the "UserGroup" tag, and
        // getUserGroupById provides that same tag, so the next open refetches fresh automatically.
      }
      else {
        throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
      }
    }
    catch (error) {
      addToast("error", `${t("crud.user_group.action.group.update.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [selectedGroup, permissions, isSystemAdmin, addToast, t, assignUserGroupBatch, memberList]);

  // ===================================================================
  // CRUD configuration
  // ===================================================================

  // Row id = grpId (the server-generated business key used by every group/membership endpoint).
  const data: (UserGroup & { id: string })[] = useMemo(
    () => groups.map(g => ({ ...g, id: g.grpId })),
    [groups]
  );

  const config = {
    entityName: t("crud.user_group.name"),
    entityNamePlural: t("crud.user_group.name"),
    apiEndpoints: {
      list: "/user_groups/all",
      create: "/user_groups/add",
      read: "/user_groups/:id",
      update: "/user_groups/:id",
      delete: "/user_groups/:id",
      export: "/user_groups/export",
    },
    columns: [
      {
        key: "name",
        label: t("crud.user_group.list.header.name"),
        sortable: true,
        render: (group: UserGroup) => (
          <div className="flex flex-col text-gray-900 dark:text-white">
            <span className="font-medium capitalize">{language === "th" && group.th || group.en || group.grpId}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{group.grpId}</span>
          </div>
        ),
      },
      {
        key: "status",
        label: t("crud.user_group.list.header.status"),
        sortable: true,
        render: (group: UserGroup) => {
          const statusConfig = group.active
            ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
            : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: CloseLineIcon };
          const Icon = statusConfig.icon;
          return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full justify-center ${statusConfig.color}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">
                {group.active ? t("crud.user.unit.status.active") : t("crud.user.unit.status.inactive")}
              </span>
            </div>
          );
        },
      },
      {
        key: "updatedAt",
        label: t("crud.user_group.list.header.updatedAt"),
        sortable: true,
        render: (group: UserGroup) => (
          <div className="text-gray-900 dark:text-white">{formatDate(group.updatedAt || "")}</div>
        ),
      },
    ],
    actions: [
      {
        key: "members",
        label: t("crud.user_group.list.header.members"),
        variant: "primary" as const,
        onClick: (group: UserGroup) => openMembers(group),
        condition: () => isEditAvailable(),
      },
      {
        key: "update",
        label: t("common.edit"),
        variant: "warning" as const,
        onClick: (group: UserGroup) => openEdit(group),
        condition: () => isEditAvailable(),
      },
      {
        key: "delete",
        label: t("common.delete"),
        variant: "outline" as const,
        onClick: (group: UserGroup) => setSelectedGroup(group),
        condition: () => isDeleteAvailable(),
      },
    ],
  };

  const attrMetrics = [
    { key: "totalGroups", title: t("crud.user_group.metrics.total"), icon: GroupIcon, color: "blue", className: "text-blue-600" },
    { key: "activeGroups", title: t("crud.user_group.metrics.active"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
  ];

  return (
    <>
      <MetricsView metrics={metrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            list: "/user_groups/all",
            create: "/user_groups/add",
            read: "/user_groups/:id",
            update: "/user_groups/:id",
            // `delete` intentionally omitted so the container's confirm dialog delegates to
            // onDelete (our RTK deleteUserGroup mutation) instead of a raw apiService fetch.
            export: "/user_groups/export",
          },
        }}
        config={config}
        data={data}
        displayModes={["table"]}
        displayModeDefault="table"
        enableDebug={true}
        features={{
          bulkActions: false,
          export: false,
          filtering: false,
          keyboardShortcuts: true,
          pagination: true,
          realTimeUpdates: false,
          search: true,
          sorting: true,
        }}
        module="usergroup"
        searchFields={["grpId", "en", "th"]}
        onCreate={openCreate}
        onDelete={handleDelete}
        onRefresh={() => window.location.reload()}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Create / edit group */}
      <Modal
        isOpen={groupSaveOpen}
        onClose={() => {
          setGroupSaveOpen(false);
          handleFormReset();
        }}
        className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {editingId && t("crud.user_group.form.header.update") || t("crud.user_group.form.header.create")}
          </h3>
          <Button onClick={() => setGroupSaveOpen(false)} variant="ghost" size="sm">
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="group-en" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.user_group.form.en.label")} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Input
                id="group-en"
                placeholder={t("crud.user_group.form.en.placeholder")}
                value={form.en}
                onChange={(e) => setForm(prev => ({ ...prev, en: e.target.value }))}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validateErrors.en}</span>
            </div>
            <div>
              <label htmlFor="group-th" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.user_group.form.th.label")} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Input
                id="group-th"
                placeholder={t("crud.user_group.form.th.placeholder")}
                value={form.th}
                onChange={(e) => setForm(prev => ({ ...prev, th: e.target.value }))}
              />
              <span className="text-red-500 dark:text-red-400 text-xs">{validateErrors.th}</span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("crud.user.unit.status.active")}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={handleFormReset} variant="outline">
              {t("crud.user_group.action.button.reset")}
            </Button>
            <Button onClick={handleSave} variant="primary" disabled={loading}>
              {t("crud.user_group.confirm.button.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Group members */}
      <Modal
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        className="max-w-3xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {t("crud.user_group.list.members.title")}
            {selectedGroup && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                {language === "th" && selectedGroup.th || selectedGroup.en || selectedGroup.grpId}
              </span>
            )}
          </h3>
          <Button onClick={() => setMembersOpen(false)} variant="ghost" size="sm">
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>

        <GroupMembersView
          loading={loading || isMembersFetching}
          users={users}
          memberList={memberList}
          grpId={selectedGroup?.grpId || ""}
          onMemberToggle={handleMemberToggle}
          onMembersSave={handleMembersSave}
        />
      </Modal>
    </>
  );
};

export default UserGroupManagementComponent;
