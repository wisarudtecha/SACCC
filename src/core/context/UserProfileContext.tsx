// src/core/context/UserProfileContext.tsx
import { ReactNode, useCallback, useMemo } from "react";
import { UserProfileContext } from "@/core/context/UserProfileContextObject";
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCommandsQuery, useGetDepartmentsQuery, useGetStationsQuery } from "@/core/store/api/organizationApi";
import { useGetUserByUserNameQuery, useGetUserRolesQuery } from "@/core/store/api/userApi";
import type { Command, Department, Station } from "@/core/types/organization";
import type { Role } from "@/core/types/role";
import type { DropdownData, UserFormProfile, UserProfileContextType } from "@/core/types/user";

interface UserProfileProviderProps {
  children: ReactNode;
}

// List endpoints answer with a { data: [...] } envelope under REST, but the hybrid GraphQL layer
// (normalizeToApiResponse) can hand back an already-unwrapped array — accept either shape.
const toList = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }
  const data = (response as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? (data as T[]) : [];
};

// Roles/departments/commands/stations carry their display name in per-language columns. Only `en`
// and `th` exist, so a `cn` UI language falls back to English.
type NameColumn = "en" | "th";

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { language } = useTranslation();
  const { state: authState } = useAuth();

  // AuthProvider hydrates its reducer synchronously from TokenManager.getStoredUser(), so this is
  // populated on the first render — no need to re-parse localStorage["profile"] by hand.
  const username = authState.user?.username ?? "";
  const lang: NameColumn = language === "th" ? "th" : "en";

  const { data: roles, isLoading: rolesLoading } = useGetUserRolesQuery({ start: 0, length: 100 });
  const { data: departments, isLoading: departmentsLoading } = useGetDepartmentsQuery({ start: 0, length: 100 });
  const { data: commands, isLoading: commandsLoading } = useGetCommandsQuery({ start: 0, length: 1000 });
  const { data: stations, isLoading: stationsLoading } = useGetStationsQuery({ start: 0, length: 10000 });

  const {
    data: userResponse,
    isLoading: userLoading,
    error: userError,
    refetch
  } = useGetUserByUserNameQuery({ username }, { skip: !username });

  const rolesData: DropdownData[] = useMemo(
    () => toList<Role>(roles).map(role => ({
      id: String(role.id),
      name: role[lang] ?? role.roleName,
      roleName: role.roleName
    })),
    [roles, lang]
  );

  const departmentsData: DropdownData[] = useMemo(
    () => toList<Department>(departments).map(department => ({
      id: String(department.id),
      name: String(department[lang] ?? ""),
      deptId: String(department.deptId)
    })),
    [departments, lang]
  );

  const commandsData: DropdownData[] = useMemo(
    () => toList<Command>(commands).map(command => ({
      id: String(command.id),
      name: String(command[lang] ?? ""),
      commId: String(command.commId)
    })),
    [commands, lang]
  );

  const stationsData: DropdownData[] = useMemo(
    () => toList<Station>(stations).map(station => ({
      id: String(station.id),
      name: String(station[lang] ?? ""),
      stnId: String(station.stnId)
    })),
    [stations, lang]
  );

  // The endpoint is typed UserProfile while this context's consumers expect UserFormProfile. The
  // two have not been reconciled yet (deferred cleanup), so bridge them here rather than silently
  // widening UserProfileContextType.
  const userData = useMemo(
    () => (userResponse?.data ?? null) as unknown as UserFormProfile | null,
    [userResponse]
  );

  const loading = rolesLoading
    || departmentsLoading
    || commandsLoading
    || stationsLoading
    || userLoading;

  const error = useMemo(() => {
    if (!username) {
      return "Unauthorized";
    }
    if (userError) {
      return "Failed to fetch user data";
    }
    if (!userLoading && !userData) {
      return "No user data found";
    }
    return null;
  }, [username, userError, userLoading, userData]);

  const refetchUserData = useCallback(async () => {
    if (!username) {
      return;
    }
    await refetch();
  }, [refetch, username]);

  const value: UserProfileContextType = useMemo(
    () => ({
      commandsData,
      departmentsData,
      error,
      loading,
      rolesData,
      stationsData,
      userData,
      refetchUserData
    }),
    [commandsData, departmentsData, error, loading, rolesData, stationsData, userData, refetchUserData]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
