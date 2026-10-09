// Detail popover for a mentioned user. Opened by clicking a MentionPill in the
// comment history; resolves the user through the exact-lookup endpoint
// (GET /users/username/{username}) and shows avatar, name and org info — the
// same fields the officer detail modal shows, from the same endpoint.
import React, { useEffect, useMemo, useRef } from "react";
import { Building, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useGetUserByUserNameQuery } from "@/core/store/api/userApi";
import {
  DepartmentCommandStationDataMerged,
  mergeDeptCommandStation,
} from "@/cms/store/api/caseApi";
import type { UserProfile } from "@/core/types/user";

const POPOVER_WIDTH = 288; // w-72
const VIEWPORT_MARGIN = 8;

interface MentionUserPopoverProps {
  username: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  /** Called once the user record resolves, so callers can cache it (e.g. pill avatars). */
  onResolved?: (username: string, user: UserProfile) => void;
}

export const MentionUserPopover: React.FC<MentionUserPopoverProps> = ({
  username,
  anchorRect,
  onClose,
  onResolved,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const { data, isLoading } = useGetUserByUserNameQuery(
    { username: username ?? "" },
    { skip: !username }
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const user = data?.data;

  // The /user/:id/edit page is gated by user.create/user.update — only link
  // out when the viewer can actually open it.
  const canOpenProfilePage = hasAnyPermission(["user.update", "user.create"]);

  useEffect(() => {
    if (user && username) {
      onResolved?.(username, user);
    }
  }, [user, username, onResolved]);

  useEffect(() => {
    if (!username) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [username, onClose]);

  const deptCommandStations = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("DeptCommandStations") ?? "[]"
      ) as DepartmentCommandStationDataMerged[],
    []
  );

  const station = useMemo(() => {
    if (!user) {
      return undefined;
    }
    return deptCommandStations.find(
      (item) =>
        item.commId === user.commId &&
        item.stnId === user.stnId &&
        item.deptId === user.deptId
    );
  }, [deptCommandStations, user]);

  if (!username || !anchorRect) {
    return null;
  }

  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchorRect.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN)
  );
  const top = anchorRect.bottom + 6;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={fullName || username}
      style={{ position: "fixed", top, left, width: POPOVER_WIDTH }}
      className="z-1000000 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3"
    >
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("common.loading")}
        </p>
      ) : !user ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("case.sop_card.mention_user_not_found")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user.photo ? (
              <img
                src={user.photo}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {(user.firstName?.[0] ?? user.username[0])?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {fullName || user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{user.username}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("userform.orgInfo")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 wrap-break-word">
                {(station && mergeDeptCommandStation(station)) || "-"}
              </p>
            </div>
          </div>

          {canOpenProfilePage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/user/${user.id}/edit`);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("case.sop_card.mention_view_profile")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
