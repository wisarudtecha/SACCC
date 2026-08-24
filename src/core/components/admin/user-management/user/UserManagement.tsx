// src/cms/components/admin/user-management/user/UserManagement.tsx
import 
  React
  ,
  {
    useCallback,
    useEffect,
    // useEffect,
    useMemo,
    useState
  }
from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedCrudContainer } from "@/core/components/crud/EnhancedCrudContainer";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { CheckLineIcon, ChevronUpIcon, CloseIcon, CloseLineIcon, UserIcon } from "@/core/icons";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useToast } from "@/core/hooks/useToast";
import {
  useGetUserSkillsByUsernameQuery,
  useUpdateUserWithSkillsBatchMutation,
  useGetUserAreaByUsernameQuery,
  useUpdateUserAreaMutation,
  useGetUserGroupsByUsernameQuery,
  useAssignUserGroupMutation,
  useDeleteAssignUserGroupMutation,
} from "@/core/store/api/userApi";
import { AuthService } from "@/core/utils/authService";
import { formatLastLogin } from "@/core/utils/crud";
import { isValidImageUrl } from "@/core/utils/resourceValidators";
// import { isEnglish } from "@/cms/utils/stringFormatters";
// import type { CrudConfig } from "@/core/types/crud";
import type { PreviewConfig } from "@/core/types/enhanced-crud";
import type { Command, Department, Station } from "@/core/types/organization";
import type { Role } from "@/core/types/role";
import type { Skill } from "@/cms/types/skill";
import type { AreaCountryTree } from "@/cms/types/area";
import type {
  // Address,
  // Department,
  // Meta,
  UserArea,
  UserGroup,
  UserGroupMember,
  UserMetrics,
  UserProfile,
  UserSkill,
  UserWithSkillsBatchUpdateData
} from "@/core/types/user";
// import AuditTrailViewer from "@/cms/components/admin/user-management/audit-log/AuditTrailViewer";
import MetricsView from "@/core/components/admin/MetricsView";
import UserCardContent from "@/core/components/admin/user-management/user/UserCard";
import SkillMatrixContent from "@/core/components/admin/user-management/user/SkillsMatrixView";
import AreaAssignmentContent from "@/core/components/admin/user-management/user/AreaAssignmentView";
import UserGroupsView from "@/core/components/admin/user-management/user/UserGroupsView";
import UserAuditLog from "@/core/components/UserProfile/UserAuditLog";
import UserInfoCard from "@/core/components/UserProfile/UserInfoCard";
import UserMetaCard from "@/core/components/UserProfile/UserMetaCard";
import UserOrganizationCard from "@/core/components/UserProfile/UserOrganizationCard";

const UserManagementComponent: React.FC<{
  usr: UserProfile[];
  dept: Department[];
  cmd: Command[];
  stn: Station[];
  role: Role[];
  skill?: Skill[];
  groups?: UserGroup[];
  /** The org's nested country trees, used by the area-assignment tab. */
  trees?: AreaCountryTree[];
}> = ({ usr, dept, cmd, stn, role, skill, groups, trees }) => {
  const isSystemAdmin = AuthService.isSystemAdmin();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { language, t } = useTranslation();
  const { toasts, addToast, removeToast } = useToast();

  // const [filterValues, setFilterValues] = useState<FilterConfig>({});
  // const [filteredData, setFilteredData] = useState<UserProfile[]>(usr);
  // const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);

  // ===================================================================
  // Mock Data
  // ===================================================================

  // ===================================================================
  // Real Functionality Data
  // ===================================================================

  const countUsersByMonth = (users: UserProfile[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(thisYear, thisMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    users.forEach((user) => {
      const createdDate = new Date(user.createdAt);
      const month = createdDate.getMonth();
      const year = createdDate.getFullYear();

      if (year === thisYear && month === thisMonth) {
        thisMonthCount++;
      }
      else if (year === lastYear && month === lastMonth) {
        lastMonthCount++;
      }
    });

    return {
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
      difference: thisMonthCount - lastMonthCount,
      growthRate: lastMonthCount === 0 ? null : ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100,
    };
  };

  const mockMetrics: UserMetrics = {
    totalUsers: usr?.length?.toLocaleString() || 0,
    activeUsers: usr?.filter(u => u?.active)?.length?.toLocaleString() || 0,
    newThisMonth: countUsersByMonth(usr)?.thisMonth?.toLocaleString() || 0,
    suspendedUsers: usr?.filter(u => !u?.active).length?.toLocaleString() || 0,
    lastMonthGrowth: countUsersByMonth(usr)?.lastMonth?.toLocaleString() || 0
  };

  const data: (UserProfile & { id: string })[] = usr.map(u => ({
    ...u,
    id: typeof u.id === "string" ? u.id : u.id?.toString?.() ?? u.id?.toString?.() ?? "",
  }));

  const [userName, setUserName] = useState<string>("");

  const { data: userWithSkillsData } = useGetUserSkillsByUsernameQuery(userName, { skip: !userName });
  // const userWithSkills = userWithSkillsData?.data as unknown as UserSkill[] || [];
  const userWithSkills = useMemo(
    () => (userWithSkillsData?.data as unknown as UserSkill[]) || [],
    [userWithSkillsData?.data]
  );

  const [skillList, setSkills] = useState<string[]>([]);

  useEffect(() => {
    // setSkills(userWithSkills);
    const skillIds: string[] = [];
    userWithSkills?.map(s => {
      skillIds.push(s.skillId);
    });
    setSkills(skillIds);
  }, [userWithSkills]);

  // useEffect(() => {
  //   console.log("🚀 ~ UserManagementComponent ~ skillList:", skillList);
  // }, [skillList]);

  // Called once when the previewed user genuinely changes (see useSyncPreviewedIdentity in
  // SkillsMatrixView.tsx). Mirrors handleGroupUserChange/handleAreaUserChange: point the shared
  // query at the new user and clear the stale selection until the seed effect above catches up.
  const handleSkillsUserChange = useCallback((username: string) => {
    setUserName(username);
    setSkills([]);
  }, []);

  // userName param kept to match onUserSkillsToggle's (userName, skillId) signature shared with
  // SkillMatrixContent's click handler; the user is now tracked solely via handleSkillsUserChange.
  const handleSkillsToggle = useCallback(async (_userName: string, skillId: string) => {
    setSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  }, []);

  // const handleSkillsToggle = useCallback(async (roleId: string, permId: string) => {
  //   setRoles(prevRoles => prevRoles.map(role => {
  //     if (role.id === roleId) {
  //       const permissions = role?.permissions?.includes(permId)
  //         ? role.permissions.filter(p => p !== permId)
  //         : [...role.permissions || [], permId];
  //       return {
  //         ...role,
  //         permissions,
  //         lastModified: new Date().toISOString()
  //       };
  //     }
  //     return role;
  //   }));
  // }, []);

  const [updateUserWithSkillsBatchMutation] = useUpdateUserWithSkillsBatchMutation();

  const handleUserSkillsSave = async () => {
    try {
      if (permissions.hasAnyPermission(["user.update"])) {
        setLoading(true);
        const payload: UserWithSkillsBatchUpdateData = {
          active: true,
          skillIds: skillList,
          userName: userName
        };
        const response = await updateUserWithSkillsBatchMutation(payload).unwrap();
        if (response?.status) {
          addToast("success", t("crud.user.list.skill.update.success"));
        }
        else {
          throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
    }
    catch (error) {
      addToast("error", `${t("crud.user.list.skill.update.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // Area Assignment
  // ===================================================================

  const { data: userAreaData } = useGetUserAreaByUsernameQuery(userName, { skip: !userName });
  const userAreas = useMemo(
    () => (userAreaData?.data as unknown as UserArea[]) || [],
    [userAreaData?.data]
  );

  const [areaList, setAreaList] = useState<string[]>([]);

  useEffect(() => {
    setAreaList(userAreas.map(a => a.distId));
  }, [userAreas]);

  // Called once when the previewed user genuinely changes (see useSyncPreviewedIdentity in
  // AreaAssignmentView.tsx). Reusing the shared userName state triggers the query/seed effects
  // above for the newly previewed user; clear the stale selection until the seed effect catches up.
  const handleAreaUserChange = useCallback((username: string) => {
    setUserName(username);
    setAreaList([]);
  }, []);

  const handleAreaToggle = useCallback((distId: string) => {
    setAreaList(prev =>
      prev.includes(distId)
        ? prev.filter(id => id !== distId)
        : [...prev, distId]
    );
  }, []);

  // Scope ids are the business codes the tree renders with, so resolve them
  // through the tree rather than by filtering flat lists. The previous version
  // matched districts on provId alone, which pulled in another country's
  // districts whenever two countries shared a province code.
  const handleAreaCascadeToggle = useCallback((
    scopeType: "country" | "province",
    scopeId: string,
    countryId?: string
  ) => {
    const scopedDistrictIds = scopeType === "country"
      ? (trees || [])
        .filter(country => country.countryId === scopeId)
        .flatMap(country => (country.provinces || []).flatMap(p => p.districts || []))
        .map(d => d.distId)
      : (trees || [])
        // countryId narrows to the province's own country. Province codes repeat
        // across countries, so without it a cascade would reach into another
        // country's districts.
        .filter(country => !countryId || country.countryId === countryId)
        .flatMap(country => country.provinces || [])
        .filter(province => province.provId === scopeId)
        .flatMap(province => province.districts || [])
        .map(d => d.distId);

    setAreaList(prev => {
      const allSelected = scopedDistrictIds.length > 0 && scopedDistrictIds.every(id => prev.includes(id));
      return allSelected
        ? prev.filter(id => !scopedDistrictIds.includes(id))
        : [...new Set([...prev, ...scopedDistrictIds])];
    });
  }, [trees]);

  const [updateUserAreaMutation] = useUpdateUserAreaMutation();

  const handleUserAreaSave = async () => {
    try {
      if (permissions.hasAnyPermission(["user.update"])) {
        setLoading(true);
        const response = await updateUserAreaMutation({ id: userName, distIds: areaList }).unwrap();
        if (response?.status) {
          addToast("success", t("crud.user.list.area.update.success"));
        }
        else {
          throw new Error(response?.desc || response?.msg || t("errors.unknownApi"));
        }
      }
      else {
        throw new Error(t("crud.common.permission_denied"));
      }
    }
    catch (error) {
      addToast("error", `${t("crud.user.list.area.update.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // Group Assignment (user side of the membership join)
  // ===================================================================

  const { data: userGroupsData } = useGetUserGroupsByUsernameQuery(userName, { skip: !userName });
  const userGroups = useMemo(
    () => (userGroupsData?.data as unknown as UserGroupMember[]) || [],
    [userGroupsData?.data]
  );

  const [groupList, setGroupList] = useState<string[]>([]);

  // Seed the checklist from the user's current groups whenever that data changes.
  useEffect(() => {
    setGroupList(userGroups.map(m => m.grpId));
  }, [userGroups]);

  // Called once when the previewed user genuinely changes (see useSyncPreviewedIdentity in
  // UserGroupsView.tsx). Point the shared userName state at the newly previewed user so the
  // query above refetches, and clear the selection so stale groups don't flash before the new
  // data arrives.
  const handleGroupUserChange = useCallback((username: string) => {
    setUserName(username);
    setGroupList([]);
  }, []);

  const handleGroupToggle = useCallback((grpId: string) => {
    setGroupList(prev =>
      prev.includes(grpId)
        ? prev.filter(id => id !== grpId)
        : [...prev, grpId]
    );
  }, []);

  const [assignUserGroupMutation] = useAssignUserGroupMutation();
  const [deleteAssignUserGroupMutation] = useDeleteAssignUserGroupMutation();

  const handleUserGroupsSave = async () => {
    if (!userName) {
      return;
    }
    if (!permissions.hasAnyPermission(["usergroup.update"]) && !isSystemAdmin) {
      addToast("error", t("crud.common.permission_denied"));
      return;
    }
    const original = userGroups.map(m => m.grpId);
    const toAdd = groupList.filter(grpId => !original.includes(grpId));
    const toRemove = original.filter(grpId => !groupList.includes(grpId));
    try {
      setLoading(true);
      // Membership is keyed by (grpId, username): add via AssignUserGroup, remove via DeleteAssignUserGroup.
      await Promise.all([
        ...toAdd.map(grpId => assignUserGroupMutation({ grpId, username: userName }).unwrap()),
        ...toRemove.map(grpId => deleteAssignUserGroupMutation({ grpId, username: userName }).unwrap()),
      ]);
      addToast("success", t("crud.user.list.group.update.success"));
    }
    catch (error) {
      addToast("error", `${t("crud.user.list.group.update.error")}: ${error}`);
    }
    finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // CRUD Configuration
  // ===================================================================

  // const IsValidImage = ({ photo }: { photo: string; }) => {
  //   const [isValidImage, setIsValidImage] = useState<boolean | null>(null);
  //   useEffect(() => {
  //     let isMounted = true;
  //     if (photo) {
  //       isImageAvailable(photo).then((result) => {
  //         if (isMounted) {
  //           setIsValidImage(result);
  //         }
  //       });
  //     }
  //     return () => {
  //       isMounted = false;
  //     };
  //   }, [photo]);
  //   if (!photo || !isValidImage) {
  //     return null;
  //   }
  //   return isValidImage;
  // };

  const config = {
    entityName: t("crud.user.name"),
    entityNamePlural: t("crud.user.name"),
    apiEndpoints: {
      list: "/api/users",
      create: "/api/users",
      read: "/api/users/:id",
      update: "/api/users/:id",
      delete: "/api/users/:id",
      bulkDelete: "/api/users/bulk",
      export: "/api/users/export"
    },
    columns: [
      {
        key: "user",
        label: t("crud.user.list.header.user"),
        sortable: true,
        render: (userItem: UserProfile) => {
          // let name = `${userItem.firstName[0]}${userItem.lastName[0]}`;
          // if (!isEnglish(name)) {
          //   const tmpName = userItem.email.split(".");
          //   name = `${tmpName[0][0]}${tmpName[1][0]}`;
          // }
          return (
            <div
              className={`flex items-center gap-3`}
              // className={`flex items-center gap-3 ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}
            >
              {userItem.photo && isValidImageUrl(userItem.photo as string) ? (
                <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                  <img src={userItem.photo} alt={userItem.displayName} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                  <span className="w-20 text-center uppercase">
                    {userItem.firstName[0]}{userItem.lastName[0]}
                    {/* {name} */}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {userItem.firstName.trim()} {userItem.middleName?.trim()} {userItem.lastName.trim()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {userItem.email}
                </div>
              </div>
            </div>
          )
        }
      },
      {
        key: "role",
        label: t("crud.user.list.header.role"),
        sortable: true,
        render: (userItem: UserProfile) => {
          const roleConfig = role.find(r => r.id === userItem.roleId);
          return (
            // <Badge className={`text-white capitalize ${roleConfig?.color} ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}>
            //   {roleConfig?.roleName || ""}
            // </Badge>
            <span
              // className={`px-2 py-1 rounded-full text-xs font-medium mr-2 xl:mr-0 text-white capitalize ${roleConfig?.color} ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}
              className={`px-2 py-1 rounded-full text-xs font-medium mr-2 xl:mr-0 text-gray-900 dark:text-white capitalize`}
            >
              {roleConfig?.roleName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || ""}
            </span>
          );
        }
      },
      {
        key: "department",
        label: t("crud.user.list.header.department"),
        sortable: true,
        render: (userItem: UserProfile) => {
          const department = dept.find(d => d.deptId === userItem.deptId);
          return (
            <span
              // className={`text-gray-900 dark:text-white ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}
              className={`text-gray-900 dark:text-white`}
            >
              {language === "th" && department?.th || department?.en || ""}
            </span>
          );
        }
      },
      {
        key: "status",
        label: t("crud.user.list.header.status"),
        sortable: true,
        render: (userItem: UserProfile) => {
          const statusConfig = userItem.active
            ? { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", icon: CheckLineIcon }
            : { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", icon: CloseLineIcon };
          const Icon = statusConfig.icon;
          return (
            <div
              // className={`flex items-center gap-1 ${statusConfig.color} ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-full justify-center ${statusConfig.color}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{userItem.active ? t("crud.user.unit.status.active") : t("crud.user.unit.status.inactive")}</span>
            </div>
          );
        }
      },
      {
        key: "lastLogin",
        label: t("crud.user.list.header.last_login"),
        sortable: true,
        render: (userItem: UserProfile) => (
          <span
            // className={`text-sm text-gray-500 dark:text-gray-400 ${userItem.status === "suspended" ? "opacity-50 dark:opacity-60" : ""}`}
            className={`text-sm text-gray-500 dark:text-gray-400`}
          >
            {formatLastLogin(userItem.lastLogin)}
          </span>
        )
      }
    ],
    actions: [
      {
        key: "view",
        label: t("crud.common.read"),
        variant: "primary" as const,
        // icon: EyeIcon,
        onClick: (userItem: UserProfile) => navigate(`/user/${userItem.id}`),
        condition: () => (permissions.hasPermission("user.view") || isSystemAdmin) as boolean
      },
      {
        key: "update",
        label: t("crud.common.update"),
        variant: "warning" as const,
        // icon: PencilIcon,
        onClick: (userItem: UserProfile) => navigate(`/user/${userItem.id}/edit`),
        condition: () => (permissions.hasPermission("user.update") || isSystemAdmin) as boolean
      },
      {
        key: "delete",
        label: t("crud.common.delete"),
        variant: "outline" as const,
        // icon: TrashBinIcon,
        onClick: (userItem: UserProfile) => {
          console.log("Delete user:", userItem.id);
        },
        condition: () => (permissions.hasPermission("user.delete") || isSystemAdmin) as boolean
      }
    ]
  };

  // ===================================================================
  // Preview Configuration
  // ===================================================================

  const previewConfig: PreviewConfig<
    // UserEntity
    UserProfile
  > = {
    title: () => t("crud.user.list.preview.header"),
    size: "xl",
    enableNavigation: true,
    tabs: [
      {
        actions: [
          {
            key: "update",
            label: t("crud.common.update"),
            // icon: PencilIcon,
            variant: "warning",
            onClick: (userItem: UserProfile, closePreview: () => void) => {
              closePreview();
              navigate(`/user/${userItem.id}/edit`);
            },
            condition: () => (permissions.hasPermission("user.update") || isSystemAdmin) as boolean
          },
          {
            key: "delete",
            label: t("crud.common.delete"),
            // icon: CheckLineIcon,
            variant: "outline",
            onClick: (userItem: UserProfile, closePreview: () => void) => {
              closePreview();
              console.log("Delete user:", userItem.id);
            },
            condition: () => (permissions.hasPermission("user.delete") || isSystemAdmin) as boolean
          }
        ],
        key: "profile",
        label: t("crud.user.list.preview.tab.header.profile"),
        // icon: InfoIcon,
        render: (
          userItem: UserProfile
        ) => {
          // const roleConfig: Role = role?.find(r => r.id === userItem.roleId) as Role;
          // const rawAddress: string = userItem?.address || "";
          // const location: Address = isValidJsonString(rawAddress) ? JSON.parse(rawAddress) : {};
          // const meta: Meta = {
          //   ...userItem || {},
          //   photo: userItem?.photo || "",
          //   roleName: roleConfig?.roleName || "",
          //   province: location?.province || "",
          //   country: location?.country || "",
          // };
          // const info: UserProfile = userItem || {};
          // const address: string = location ? formatAddress(location) : "";
          return (
            <div className="space-y-6">
              <UserMetaCard userData={userItem as UserProfile} />
              <UserInfoCard userData={userItem as UserProfile} />
              <UserOrganizationCard
                userData={userItem as UserProfile}
                departmentsData={dept.map(d => ({ id: d.deptId, name: language === "th" && d.th || d.en }))}
                commandsData={cmd.map(c => ({ id: c.commId, name: language === "th" && c.th || c.en }))}
                stationsData={stn.map(s => ({ id: s.stnId, name: language === "th" && s.th || s.en }))}
                rolesData={role.map(r => ({ id: r.id, name: r.roleName }))}
              />
            </div>
          )
        }
      },
      {
        key: "skills",
        label: t("crud.user.list.preview.tab.header.skills"),
        // icon: InfoIcon,
        render: (userItem: UserProfile) => {
          return (
            <div className="space-y-6">
              <SkillMatrixContent
                loading={loading}
                skills={skill || []}
                skillList={skillList || []}
                userName={userItem.username || ""}
                trackedUsername={userName}
                handleUserSkillsSave={handleUserSkillsSave}
                onUserSkillsToggle={handleSkillsToggle}
                onUserChange={handleSkillsUserChange}
              />
            </div>
          );
        }
      },
      // {
      //   key: "activity",
      //   label: "Activity",
      //   // icon: PieChartIcon,
      //   render: (userItem: UserProfile) => (
      //     <pre>{JSON.stringify(userItem, null, 2)}</pre>
      //   )
      // },
      {
        key: "area",
        label: t("crud.user.list.preview.tab.header.area"),
        // icon: InfoIcon,
        render: (userItem: UserProfile) => {
          return (
            <div className="space-y-6">
              <AreaAssignmentContent
                loading={loading}
                trees={trees || []}
                areaList={areaList || []}
                userName={userItem.username || ""}
                trackedUsername={userName}
                onAreaToggle={handleAreaToggle}
                onAreaCascadeToggle={handleAreaCascadeToggle}
                onUserAreaSave={handleUserAreaSave}
                onUserChange={handleAreaUserChange}
              />
            </div>
          );
        }
      },
      {
        key: "groups",
        label: t("crud.user.list.preview.tab.header.groups"),
        // icon: InfoIcon,
        render: (userItem: UserProfile) => {
          return (
            <div className="space-y-6">
              <UserGroupsView
                loading={loading}
                groups={groups || []}
                groupList={groupList || []}
                userName={userItem.username || ""}
                trackedUsername={userName}
                onGroupToggle={handleGroupToggle}
                onUserGroupsSave={handleUserGroupsSave}
                onUserChange={handleGroupUserChange}
              />
            </div>
          );
        }
      },
      {
        key: "auditLog",
        label: t("crud.user.list.preview.tab.header.audit_log"),
        // icon: FileIcon,
        render: (userItem: UserProfile) => (
          // <AuditTrailViewer user={userItem as UserProfile} isOpen={true} />
          <UserAuditLog username={userItem.username} />
        )
      }
    ],
    actions: [
      // {
      //   key: "view",
      //   label: "View",
      //   // icon: EyeIcon,
      //   variant: "primary",
      //   onClick: (userItem: UserProfile, closePreview: () => void) => {
      //     closePreview();
      //     navigate(`/user/${userItem.id}`);
      //   },
      //   condition: () => (permissions.hasPermission("user.view") || isSystemAdmin) as boolean
      // },
      // {
      //   key: "update",
      //   label: t("crud.common.update"),
      //   // icon: PencilIcon,
      //   variant: "warning",
      //   onClick: (userItem: UserProfile, closePreview: () => void) => {
      //     closePreview();
      //     navigate(`/user/${userItem.id}/edit`);
      //   },
      //   condition: () => (permissions.hasPermission("user.update") || isSystemAdmin) as boolean
      // },
      // {
      //   key: "delete",
      //   label: t("crud.common.delete"),
      //   // icon: CheckLineIcon,
      //   variant: "outline",
      //   onClick: (userItem: UserProfile, closePreview: () => void) => {
      //     closePreview();
      //     console.log("Delete user:", userItem.id);
      //   },
      //   condition: () => (permissions.hasPermission("user.delete") || isSystemAdmin) as boolean
      // }
    ]
  };

  // ===================================================================
  // Advanced Filters
  // ===================================================================

  const advancedFilters = [
    {
      key: "roleId",
      label: t("crud.user.list.toolbar.advanced_filter.roleId.label"),
      type: "select" as const,
      options: role.map(role => ({ value: role.id, label: role.roleName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) })),
      placeholder: t("crud.user.list.toolbar.advanced_filter.roleId.placeholder"),
    },
    {
      key: "deptId",
      label: t("crud.user.list.toolbar.advanced_filter.deptId.label"),
      type: "select" as const,
      options: dept.map(department => ({ value: department.deptId, label: language === "th" && department.th || department.en })),
      placeholder: t("crud.user.list.toolbar.advanced_filter.deptId.placeholder"),
    },
    // {
    //   key: "active",
    //   label: "Status",
    //   type: "checkbox" as const,
    //   placeholder: "Show only active users",
    // },
    // {
    //   key: "status",
    //   label: "Status",
    //   type: "boolean" as const,
    //   options: [
    //     { value: "active", label: "Active" },
    //     { value: "inactive", label: "Inactive" },
    //     { value: "suspended", label: "Suspended" }
    //   ]
    // },
    // {
    //   key: "lastLogin",
    //   label: "Last Login",
    //   type: "date-range" as const
    // }
  ];

  // ===================================================================
  // Bulk Actions
  // ===================================================================

  // const bulkActions = [
  //   {
  //     key: "bulk-activate",
  //     label: "Activate",
  //     variant: "success" as const,
  //     onClick: async (items: { id: string }[]) => {
  //       console.log("Bulk activate user:", items.map(c => c.id));
  //     }
  //   },
  //   {
  //     key: "bulk-deactivate",
  //     label: "Deactivate",
  //     variant: "warning" as const,
  //     onClick: async (items: { id: string }[]) => {
  //       console.log("Bulk deactivate user:", items.map(c => c.id));
  //     }
  //   },
  //   // {
  //   //   key: "bulk-suspend",
  //   //   label: "Suspend",
  //   //   variant: "error" as const,
  //   //   onClick: async (items: { id: string }[]) => {
  //   //     console.log("Bulk suspend user:", items.map(c => c.id));
  //   //   }
  //   // },
  //   {
  //     key: "bulk-export",
  //     label: "Export",
  //     variant: "light" as const,
  //     onClick: async (items: { id: string }[]) => {
  //       console.log("Bulk export user:", items.map(c => c.id));
  //     }
  //   }
  // ];

  // ===================================================================
  // Export Options
  // ===================================================================

  // const exportOptions = [
  //   {
  //     key: "csv-summary",
  //     label: "Summary Report (CSV)",
  //     format: "csv" as const,
  //     columns: ["firstname", "lastname"]
  //   },
  //   {
  //     key: "csv-detailed",
  //     label: "Detailed Report (CSV)",
  //     format: "csv" as const,
  //     columns: ["firstname", "lastname", "address", "createdAt"]
  //   },
  //   {
  //     key: "json-full",
  //     label: "Complete Data (JSON)",
  //     format: "json" as const
  //   }
  // ];

  // ===================================================================
  // Custom Card Rendering
  // ===================================================================

  const renderCard = (userItem: UserProfile) => {
    const roleData = role.find(r => r.id === userItem.roleId);
    return <UserCardContent user={userItem as UserProfile} role={roleData as Role} />;
  };

  // ===================================================================
  // Event Handlers
  // ===================================================================

  // Handle deletion and other actions
  const handleAction = (actionKey: string, userItem: UserProfile) => {
    // Add custom user-specific action handling
    console.log(`Action ${actionKey} triggered for user:`, userItem.id);
    
  };

  // Handle deletion
  const handleDelete = (caseId: string) => {
    // Handle user delete
    console.log("User deleted:", caseId);
  };

  // Filter Logic Implementation
  // const applyFilters = useCallback(() => {
  //   let filtered = [...usr];
  //   // Apply search filter
  //   if (searchTerm.trim()) {
  //     const search = searchTerm.toLowerCase().trim();
  //     filtered = filtered.filter(user => 
  //       `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
  //       user.username.toLowerCase().includes(search)
  //     );
  //   }
  //   // Apply advanced filters
  //   Object.entries(filterValues).forEach(([key, value]) => {
  //     if (!value || (Array.isArray(value) && value.length === 0)) return;
  //     switch (key) {
  //       case "search":
  //         if (typeof value === 'string' && value.trim()) {
  //           const searchTerm = value.toLowerCase().trim();
  //           filtered = filtered.filter(user => 
  //             `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm) ||
  //             user.email.toLowerCase().includes(searchTerm)
  //           );
  //         }
  //         break;
  //       case "deptId":
  //         if (typeof value === 'string') {
  //           filtered = filtered.filter(user => user.deptId === value);
  //         }
  //         break;
  //       case "roleId":
  //         if (typeof value === 'string') {
  //           filtered = filtered.filter(user => user.roleId === value);
  //         }
  //         break;
  //       case "active":
  //         if (typeof value === 'boolean') {
  //           filtered = filtered.filter(user => user.active === value);
  //         }
  //         break;
  //       default:
  //         break;
  //     }
  //   });
  //   setFilteredData(filtered);
  // }, [searchTerm, filterValues]);
  // useEffect(() => {
  //   applyFilters();
  // }, [applyFilters]);

  // ===================================================================
  // Render Component
  // ===================================================================

  const attrMetrics = [
    { key: "totalUsers", title: t("crud.user.metrics.total_users"), icon: UserIcon, color: "blue", className: "text-blue-600" },
    { key: "activeUsers", title: t("crud.user.metrics.active_users"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    { key: "suspendedUsers", title: t("crud.user.metrics.inactive_users"), icon: CloseIcon, color: "red", className: "text-red-600" },
    { key: "newThisMonth", title: t("crud.user.metrics.new_this_month"), icon: ChevronUpIcon, color: "purple", className: "text-purple-600", trend: mockMetrics.lastMonthGrowth },
  ];

  return (
    <>
      <MetricsView metrics={mockMetrics} attrMetrics={attrMetrics} />

      <EnhancedCrudContainer
        advancedFilters={advancedFilters}
        apiConfig={{
          baseUrl: "/api",
          endpoints: {
            create: "/users",
            read: "/users/:id",
            list: "/users",
            update: "/users/:id",
            delete: "/users/:id",
            bulkDelete: "/users/bulk",
            export: "/users/export"
          }
        }}
        // bulkActions={bulkActions}
        // config={config as unknown as CrudConfig<{ id: string; }>}
        config={config}
        // data={usr as unknown as { id: string }[]}
        data={data}
        displayModes={["card", "table"]}
        enableDebug={true} // Enable debug mode to troubleshoot
        // error={null}
        // exportOptions={exportOptions}
        features={{
          bulkActions: false,
          export: false,
          filtering: true,
          keyboardShortcuts: true,
          pagination: true,
          realTimeUpdates: false, // Disabled for demo
          search: true,
          sorting: true,
        }}
        // keyboardShortcuts={[]}
        loading={!usr}
        module="user"
        // previewConfig={previewConfig as unknown as PreviewConfig<{ id: string }>}
        previewConfig={previewConfig as PreviewConfig<UserProfile & { id: string }>}
        searchFields={["username", "firstName", "lastName", "email"]}
        // customFilterFunction={() => true}
        onCreate={() => navigate("/user/create")}
        onDelete={handleDelete}
        onItemAction={handleAction as unknown as (action: string, item: { id: string }) => void}
        // onItemClick={(item) => navigate(`/user/${item.id}`)}
        onRefresh={() => window.location.reload()}
        // onUpdate={() => {}}
        renderCard={renderCard as unknown as (item: { id: string }) => React.ReactNode}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default UserManagementComponent;
