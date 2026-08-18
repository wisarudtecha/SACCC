// "Personal information" section of the staff detail panel.
//
// Deliberately the same four fields as the officer detail modal
// (assignOfficer/officerSkillModal.tsx), from the same endpoint and the same
// translation keys: a dispatcher who opens an officer from the map and from the
// assign flow must not be shown two different versions of that person.
//
// The unit list on the map carries no personal data, so this is the one section
// that fetches. It only mounts while the section is expanded, which is what
// keeps that request off the panel's normal path.
import { memo, useMemo } from "react";
import { Building, Phone, Tag, User } from "lucide-react";
import {
  mergeDeptCommandStation,
  type DepartmentCommandStationDataMerged
} from "@/cms/store/api/caseApi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetUserByUserNameQuery } from "@/core/store/api/userApi";
import type { StaffMarker } from "./staffTypes";

interface StaffPersonalInfoSectionProps {
  marker: StaffMarker;
}

interface StaffInfoRowProps {
  icon: typeof User;
  label: string;
  value: string;
  /** Ids and phone numbers read better monospaced, names do not. */
  isMonospace?: boolean;
}

function StaffInfoRow({ icon: Icon, label, value, isMonospace = false }: StaffInfoRowProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={`mt-0.5 break-words font-medium text-gray-900 dark:text-white ${
          isMonospace ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StaffPersonalInfoSectionBase({ marker }: StaffPersonalInfoSectionProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useGetUserByUserNameQuery(
    { username: marker.username },
    { skip: !marker.username }
  );

  const deptCommandStations = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("DeptCommandStations") ?? "[]"
      ) as DepartmentCommandStationDataMerged[],
    []
  );

  const user = data?.data;

  // Matched on all three ids, as officerSkillModal does - a station id is only
  // unique within its command, and a command only within its department.
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

  if (isLoading) {
    return <p>{t("common.loading")}</p>;
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      <StaffInfoRow
        icon={User}
        label={t("case.officer_detail.fullname")}
        value={fullName || marker.unitName || "-"}
      />
      <StaffInfoRow
        icon={Phone}
        label={t("case.officer_detail.mobile_number")}
        value={user?.mobileNo || "-"}
        isMonospace
      />
      <StaffInfoRow
        icon={Tag}
        label={t("case.officer_detail.vehicle")}
        value={marker.unitId || "-"}
        isMonospace
      />
      <StaffInfoRow
        icon={Building}
        label={t("userform.orgInfo")}
        value={(station && mergeDeptCommandStation(station)) || "-"}
      />
    </div>
  );
}

export const StaffPersonalInfoSection = memo(StaffPersonalInfoSectionBase);
StaffPersonalInfoSection.displayName = "StaffPersonalInfoSection";

export default StaffPersonalInfoSection;
