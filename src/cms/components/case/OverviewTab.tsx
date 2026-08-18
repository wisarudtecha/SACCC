// /src/components/case/OverviewTab.tsx
import React, { memo, useMemo } from "react";
import {
  Building,
  ChartColumnStacked,
  CheckCircle,
  ClockArrowUp,
  Contact,
  Cpu,
  MapPin,
  MapPinHouse,
  Phone,
  Share2,
  Siren,
  Tag,
  Ticket,
  User
} from "lucide-react";
import { PermissionGate } from "@/core/components/auth/PermissionGate";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCaseSopQuery } from "@/cms/store/api/dispatch";
import { useGetUserByUserNameQuery } from "@/core/store/api/userApi";
import { Area } from "@/cms/store/api/area";
import { CaseEntity } from "@/cms/types/case";
import { CaseSop } from "@/cms/types/dispatch";
import { mapSopToOrderedProgress } from "@/cms/components/case/sopStepTranForm";
import { source } from "@/cms/components/case/constants/caseConstants";
import { mergeDeptCommandStation } from "@/cms/store/api/caseApi";
// import Badge from "@/core/components/ui/badge/Badge";
import AttachedFiles from "@/cms/components/Attachment/AttachmentPreviewList";
import FormViewer from "@/cms/components/form/dynamic-form/FormViewValue";
import ProgressStepPreview from "@/cms/components/case/activityTimeline/caseActivityTimeline";
import ProgressStepPreviewUnit from "@/cms/components/case/activityTimeline/officerActivityTimeline";
import ProgressSummary from "@/cms/components/case/activityTimeline/sumaryUnitProgress";
import { formatDate } from "@/core/utils/crud";

interface Props {
  caseItem: CaseEntity;
  areas: Area[];
  caseTitle: (caseItem: CaseEntity) => string | React.ReactNode;
}

const OverviewTab: React.FC<Props> = ({ caseItem, areas, caseTitle }) => {
  const { t, language } = useTranslation();

  /* ==============================
     DATA (NO DERIVED STATE)
  ============================== */

  const caseId = caseItem.caseId;

  const { data: sopResponse } = useGetCaseSopQuery(
    { caseId },
    { skip: !caseId }
  );

  const sopData = sopResponse?.data as CaseSop | null;

  const unitUsername = sopData?.unitLists?.[0]?.username;
  const assigneeUsername = sopData?.unitLists?.[0]?.createdBy;

  const { data: unitResponse } = useGetUserByUserNameQuery(
    { username: unitUsername ?? "" },
    { skip: !unitUsername }
  );

  const { data: assigneeResponse } = useGetUserByUserNameQuery(
    { username: assigneeUsername ?? "" },
    { skip: !assigneeUsername }
  );

  /* ==============================
     MEMOIZED DERIVED VALUES
  ============================== */

  const progressSteps = useMemo(() => {
    if (!sopData) {
      return [];
    }
    return mapSopToOrderedProgress(sopData, language);
  }, [sopData, language]);

  const deptStations = useMemo(() => {
    return JSON.parse(
      localStorage.getItem("DeptCommandStations") ?? "[]"
    );
  }, []);

  const unitStation = useMemo(() => {
    if (!unitResponse?.data) {
      return null;
    }
    return deptStations.find((d: { commId: string; stnId: string; deptId: string }) =>
      d.commId === unitResponse?.data?.commId &&
      d.stnId === unitResponse?.data?.stnId &&
      d.deptId === unitResponse?.data?.deptId
    );
  }, [unitResponse, deptStations]);

  const assigneeStation = useMemo(() => {
    if (!assigneeResponse?.data) {
      return null;
    }
    return deptStations.find(
      (d: { commId: string; stnId: string; deptId: string }) =>
        d.commId === assigneeResponse?.data?.commId &&
        d.stnId === assigneeResponse?.data?.stnId &&
        d.deptId === assigneeResponse?.data?.deptId
    );
  }, [assigneeResponse, deptStations]);

  const contactMethod =
    source.find(s => s.id === sopData?.source) ?? { name: "-" };

  /* ==============================
     AREA DISPLAY
  ============================== */

  const areaDisplay = useMemo(() => {
    if (!sopData?.distId) {
      return "-";
    }

    const area = areas.find(a => a.distId === sopData.distId);
    if (!area) {
      return "-";
    }

    return `${language === "th" ? area.countryTh : area.countryEn}-
      ${language === "th" ? area.provinceTh : area.provinceEn}-
      ${language === "th" ? area.districtTh : area.districtEn}`;
  }, [areas, sopData, language]);

  /* ==============================
     RENDER
  ============================== */

  // return (
  //   <>
  //     <ProgressStepPreview progressSteps={progressSteps} />

  //     <div className="grid grid-cols-1 gap-6">

  //       {/* CASE INFO */}
  //       <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
  //         <h4 className="font-medium text-blue-500 mb-4">
  //           {t("case.display.case_information")}
  //         </h4>

  //         <InfoRow icon={<Ticket />} label={t("case.display.no")} value={caseItem.caseId} />
  //         <InfoRow icon={<MapPinHouse />} label={t("case.display.service_center")} value={areaDisplay} />
  //         <InfoRow icon={<Siren />} label={t("case.display.iot_alert_date")} value={formatDate(sopData?.startedDate ?? "")} />
  //         <InfoRow
  //           icon={<ClockArrowUp />}
  //           label={t("case.display.updateAt")}
  //           value={`${formatDate(sopData?.updatedAt ?? "")} ${t("userform.by")} ${sopData?.updatedBy ?? "-"}`}
  //         />

  //         <AttachedFiles files={sopData?.attachments} editFormData={false} type="case" />
  //       </section>

  //       {/* LOCATION */}
  //       <Section title={t("case.display.area")} icon={<MapPin />}>
  //         {caseItem.caselocAddrDecs || caseItem.caselocAddr || "-"}
  //       </Section>

  //       {/* CONTACT */}
  //       <Section title={t("case.display.contact")} icon={<Contact />}>
  //         <InfoRow icon={<Phone />} label={t("case.display.phone_number")} value={sopData?.phoneNo} />
  //         <InfoRow icon={<Share2 />} label={t("case.display.contact_method")} value={contactMethod.name} />
  //         <InfoRow icon={<Cpu />} label={t("case.display.iot_device")} value={sopData?.deviceId} />
  //       </Section>

  //       {/* DETAIL */}
  //       <Section title={t("case.display.detail")}>
  //         {caseItem.caseDetail || "-"}
  //       </Section>

  //       {/* UNIT */}
  //       <Section title={t("case.display.Assigned Officer")}>
  //         <InfoRow
  //           icon={<User />}
  //           label={t("case.officer_detail.fullname")}
  //           value={`${unitResponse?.data?.firstName ?? ""} ${unitResponse?.data?.lastName ?? ""}`}
  //         />
  //         {unitStation && <InfoRow icon={<Building />} label={t("userform.orgInfo")} value={mergeDeptCommandStation(unitStation)} />}
  //       </Section>

  //       {/* ASSIGNEE */}
  //       <Section title={t("case.officer_detail.assignee_title")}>
  //         <InfoRow
  //           icon={<User />}
  //           label={t("case.officer_detail.fullname")}
  //           value={`${assigneeResponse?.data?.firstName ?? ""} ${assigneeResponse?.data?.lastName ?? ""}`}
  //         />
  //         {assigneeStation &&<InfoRow icon={<Building />} label={t("userform.orgInfo")} value={mergeDeptCommandStation(assigneeStation)} />}
  //       </Section>

  //       {/* PROGRESS */}
  //       <Section title={t("case.officer_detail.service_progress_title")} icon={<CheckCircle />}>
  //         <ProgressStepPreviewUnit progressSteps={progressSteps} sliceIndex={false} />
  //         <ProgressSummary progressSteps={progressSteps} sliceIndex={false} />
  //         <AttachedFiles files={sopData?.attachments} editFormData={false} type="close" />
  //       </Section>
  //     </div>
  //   </>
  // );

  return (
    <>
      <PermissionGate module="case" action="view_timeline">
        {/* Progress Timeline and Progress Line */}
        <ProgressStepPreview progressSteps={progressSteps} />
      </PermissionGate>

      {/* Content */}
      <div>
        <div className="grid grid-cols-1 gap-6">
          {/* Case Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
              {t("case.display.case_information")}
            </h4>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.display.no")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {caseItem.caseId || "-"}
                </div>
              </div>
              <div className="xl:flex items-start justify-left gap-1">
                <ChartColumnStacked className="xl:block hidden w-4 h-4 text-gray-900 dark:text-white" />
                <div>
                  <div className="xl:flex items-center justify-left gap-1">
                    <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                      <ChartColumnStacked className="block xl:hidden w-4 h-4" />
                      <div className="text-sm font-medium">{t("case.display.types")}:</div>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">{caseTitle(caseItem) || "-"}</div>
                  </div>
                  <div className="xl:flex items-center justify-left gap-1 text-sm">
                    {sopData?.formAnswer && <FormViewer formData={sopData.formAnswer} /> || "-"}
                  </div>
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <MapPinHouse className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.display.service_center")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {areaDisplay || "-"}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Siren className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.display.iot_alert_date")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {formatDate(sopData?.startedDate as string) || "-"}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1">
                  <ClockArrowUp className="w-4 h-4 text-gray-900 dark:text-white" />
                  <span className="text-red-500 dark:text-red-400 text-sm font-medium">{t("case.display.updateAt")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {formatDate(sopData?.updatedAt as string) || ""} {t("userform.by")} {sopData?.updatedBy || "-"}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-1">
                <AttachedFiles files={sopData?.attachments} editFormData={false} type={"case"} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="xl:flex items-left justify-left gap-2 mb-4">
              <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
                <MapPin className="w-4 h-4" />
                <h4>{t("case.display.area")}</h4>
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left">
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {caseItem.caselocAddrDecs || caseItem.caselocAddr || caseItem.caseLocAddr || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="xl:flex items-left justify-left gap-2 mb-4">
              <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
                <Contact className="w-4 h-4" />
                <h4>{t("case.display.contact")}</h4>
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium xl:mr-2">{t("case.display.phone_number")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.phoneNo || "-"}
                </div>
              </div>
              <div className="xl:flex items-left justify-left">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium xl:mr-2">{t("case.display.contact_method")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {contactMethod?.name || "-"}
                </div>
              </div>
              <div className="xl:flex items-left justify-left">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium xl:mr-2">{t("case.display.iot_device")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.deviceId || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Detail */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
              {t("case.display.detail")}
            </h4>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left">
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {caseItem.caseDetail || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Unit Information */}
          <div className="relative my-4 text-center w-full">
            <div className="absolute bg-gray-300 dark:bg-gray-600 h-px w-full left-0 top-1/2 -translate-y-1/2" />
            <span className="relative bg-white dark:bg-gray-900 font-medium px-4 text-gray-600 dark:text-gray-300">
              {t("case.display.Assigned Officer")}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
              {t("case.officer_detail.personal_title")}
            </h4>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.officer_detail.fullname")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && `${unitResponse?.data?.firstName ?? ""} ${unitResponse?.data?.lastName ?? ""}` || ""}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.officer_detail.mobile_number")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && unitResponse?.data?.mobileNo || ""}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.officer_detail.vehicle")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && sopData?.unitLists[0]?.unitId || ""}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("userform.orgInfo")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && unitStation && mergeDeptCommandStation(unitStation) || ""}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-500 dark:text-blue-400 mb-4">
              {t("case.officer_detail.assignee_title")}
            </h4>
            <div className="grid grid-cols-1 space-y-3">
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.officer_detail.fullname")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && `${assigneeResponse?.data?.firstName || ""} ${assigneeResponse?.data?.lastName || ""}` || ""}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("case.officer_detail.mobile_number")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && assigneeResponse?.data?.mobileNo || ""}
                </div>
              </div>
              <div className="xl:flex items-left justify-left gap-2">
                <div className="flex items-center justify-left gap-1 text-gray-900 dark:text-white">
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("userform.orgInfo")}:</span>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {sopData?.unitLists?.length && assigneeStation && mergeDeptCommandStation(assigneeStation) || ""}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 pt-4">
            <div className="xl:flex items-left justify-left gap-2 mb-4">
              <div className="flex items-center justify-left gap-1 font-medium text-blue-500 dark:text-blue-400">
                <CheckCircle className="w-4 h-4" />
                {t("case.officer_detail.service_progress_title")}
              </div>
            </div>
            <div className="grid grid-cols-1 space-y-3">
              <ProgressStepPreviewUnit progressSteps={progressSteps} sliceIndex={false} />
              <ProgressSummary progressSteps={progressSteps} sliceIndex={false} />
              <AttachedFiles files={sopData?.attachments} editFormData={false} type={"close"} />
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {/*
        {caseItem.attachments.length && (
          <div className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-medium text-blue-500 dark:text-blue-400">
                  Attachments ({caseItem.attachments.length})
                </h4>
              </div>
              
              {caseItem.attachments.length > 0 ? (
                <div className="space-y-2">
                  {caseItem.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.filename}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(attachment.size / 1024).toFixed(1)} KB • {attachment.uploadedBy}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
              )}
            </div>
          </div>
        )}
        */}
      </div>
    </>
  );
};

/* ==============================
   SMALL PURE COMPONENTS
============================== */

// const Section: React.FC<React.PropsWithChildren<{ title: string; icon?: React.ReactNode }>> = ({ title, icon, children }) => (
//   <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
//     <h4 className="font-medium text-blue-500 mb-4 flex items-center gap-2">
//       {icon}
//       {title}
//     </h4>
//     {children}
//   </section>
// );

// const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null | undefined }> = ({ icon, label, value }) => (
//   <div className="flex gap-2 text-sm">
//     {icon}
//     <span className="font-medium">{label}:</span>
//     <span className="text-gray-600">{value || "-"}</span>
//   </div>
// );

export default memo(OverviewTab);
