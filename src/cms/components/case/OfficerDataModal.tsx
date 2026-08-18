import { Dialog, DialogContent, DialogHeader } from "@/core/components/ui/dialog/dialog"
import { useGetUserByUserNameForCaseInfoQuery } from "@/core/store/api/userApi"
import { mapSopToOrderedProgress } from "./sopStepTranForm"
import { useMemo } from "react"
import { DialogTitle } from "@radix-ui/react-dialog"
import ProgressStepPreviewUnit from "./activityTimeline/officerActivityTimeline"
import { useTranslation } from "@/core/hooks/useTranslation"
import { DepartmentCommandStationDataMerged, mergeDeptCommandStation } from "@/cms/store/api/caseApi"
import { User, Phone, Tag, Building, CheckCircle } from "lucide-react"
import { usePermissions } from "@/core/hooks/usePermissions"
import ProgressSummary from "./activityTimeline/sumaryUnitProgress"
import { UnitWithSop } from "@/cms/types/dispatch"

interface OfficerDataModal {
    officer: UnitWithSop
    onOpenChange: () => void
}

export default function OfficerDataModal({
    officer,
    onOpenChange,
}: OfficerDataModal) {
    const { data: userData, isLoading } = useGetUserByUserNameForCaseInfoQuery({ username: officer.unit.username })
    const { data: assigneeData, isLoading: isLoadingAssignee } = useGetUserByUserNameForCaseInfoQuery({ username: officer.unit.createdBy })
    const { t, language } = useTranslation();
    const permissions = usePermissions();
    const progressSteps = useMemo(() => {
        return mapSopToOrderedProgress(officer.Sop, language);
    }, [officer]);
    const deptComStn = useMemo(() =>
        JSON.parse(localStorage.getItem("DeptCommandStations") ?? "[]") as DepartmentCommandStationDataMerged[], []
    );
    const userStation = deptComStn.find((items) => {
        return items.commId === userData?.data?.commId && items.stnId === userData?.data?.stnId && items.deptId === userData.data.deptId;
    });
    const assigneerStation = deptComStn.find((items) => {
        return items.commId === assigneeData?.data?.commId && items.stnId === assigneeData?.data?.stnId && items.deptId === assigneeData.data.deptId;
    });

    if (isLoading || isLoadingAssignee) {
        return (
            <Dialog open={!!officer} onOpenChange={onOpenChange}>
                <DialogContent aria-describedby="" className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-4xl w-[90vw] md:w-[70vw] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                    <DialogHeader>
                        <DialogTitle hidden={true}>

                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{t("common.loading")}</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={!!officer} onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogTitle hidden={true}>

                </DialogTitle>
            </DialogHeader>
            <DialogContent aria-describedby="" className=" dark:text-white bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-4xl w-[90vw] md:w-[70vw] max-h-[90vh] overflow-y-auto custom-scrollbar z-999999 rounded-xl shadow-2xl">

                {/* Header */}
                {/* <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4  top-0  rounded-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Officer Information
                    </h2>
                </div> */}

                {/* Officer Details Section */}
                <div className=" md:grid-cols-2 grid gap-3">
                    <div className=" dark:border-gray-700 rounded-2xl">
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full bg-gray-50 dark:bg-gray-900 rounded-lg"> */}
                        <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-lg">
                            {/* Personal Information */}
                            <div className="space-y-4 ">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg  ">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-blue-500 dark:text-blue-400">{t("case.officer_detail.personal_title")}</h3>
                                    </div>

                                    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.fullname")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                                {userData?.data?.firstName && userData?.data?.lastName
                                                    ? `${userData.data.firstName} ${userData.data.lastName}`
                                                    : "N/A"
                                                }
                                            </p>
                                        </div>

                                        {/* <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AtSign className="w-3 h-3 text-gray-600 dark:text-gray-300" />                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.username")}</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 font-mono ml-6">
                                            {officer?.unit?.username || "N/A"}
                                        </p>
                                    </div> */}

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">                                                <Phone className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.mobile_number")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 font-mono ml-6">
                                                {userData?.data?.mobileNo || "N/A"}
                                            </p>
                                        </div>

                                        {/* <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.email")}</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                            {userData?.data?.email || "N/A"}
                                        </p>
                                    </div> */}

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Tag className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.vehicle")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                                {officer?.unit?.unitId || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Building className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("userform.orgInfo")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                                {userStation && mergeDeptCommandStation(userStation) || "N/A"}
                                            </p>
                                        </div>
                                        {/* <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Department</label>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 mt-1">
                                            {userData?.data?.commId || "N/A"}
                                        </p>
                                    </div> */}
                                    </div>
                                </div>
                            </div>

                            {/* Service Information */}
                            {/* <div className="flex flex-col h-full">
                            <div className="space-y-4 mb-3">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg  ">
                                    <div className="flex items-center gap-2 mb-3 text-blue-500 dark:text-blue-400">
                                        <Truck className="w-4 h-4  " />
                                        <h3 className="font-semibold ">{t("case.officer_detail.service_title")}</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Tag className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.vehicle")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                                {officer?.unit?.unitId || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3 text-blue-500 dark:text-blue-400">
                                        <Building className="w-4 h-4" />
                                        <h3 className="font-semibold">{t("userform.orgInfo")}</h3>
                                    </div>

                                    <div className="flex-1 flex ">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
                                            {userStation && mergeDeptCommandStation(userStation) || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div> */}
                        </div>




                        {/* Address Section - Full Width */}
                        {/* {userData?.data?.address && (
                        <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg  ">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <span className="text-gray-600 dark:text-gray-300 text-xs">📍</span>
                                </div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("case.officer_detail.address")}</label>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-8">
                                {userData.data.address}
                            </p>
                        </div>
                    )} */}


                    </div>

                    {/* assigneer Data */}
                    <div className=" dark:border-gray-700 rounded-2xl">
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full bg-gray-50 dark:bg-gray-900 rounded-lg"> */}
                        <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-lg">
                            {/* Personal Information */}
                            <div className="space-y-4 ">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg  ">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-blue-500 dark:text-blue-400">{t("case.officer_detail.assignee_title")}</h3>
                                    </div>

                                    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.fullname")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                                {assigneeData?.data?.firstName && assigneeData?.data?.lastName
                                                    ? `${assigneeData.data.firstName} ${assigneeData.data.lastName}`
                                                    : "N/A"
                                                }
                                            </p>
                                        </div>

                                        {/* <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AtSign className="w-3 h-3 text-gray-600 dark:text-gray-300" />                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.username")}</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 font-mono ml-6">
                                            {assigneeData?.data?.username || "N/A"}
                                        </p>
                                    </div> */}

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">                                                <Phone className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.mobile_number")}</label>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 font-mono ml-6">
                                                {assigneeData?.data?.mobileNo || "N/A"}
                                            </p>
                                        </div>

                                        {/* <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("case.officer_detail.email")}</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                            {assigneeData?.data?.email || "N/A"}
                                        </p>
                                    </div> */}


                                        <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">{t("userform.orgInfo")}</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-400 ml-6">
                                            {assigneerStation && mergeDeptCommandStation(assigneerStation) || "N/A"}
                                        </p>
                                    </div>
                                    </div>
                                </div>
                            </div>

                        </div>




                        {/* Address Section - Full Width */}
                        {/* {userData?.data?.address && (
                        <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg  ">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <span className="text-gray-600 dark:text-gray-300 text-xs">📍</span>
                                </div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("case.officer_detail.address")}</label>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-8">
                                {userData.data.address}
                            </p>
                        </div>
                    )} */}


                    </div>
                </div>
                {/* Progress Steps Section */}
                <div className="rounded-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{t("case.officer_detail.service_progress_title")}</h3>
                    </div>

                    {permissions.hasPermission("case.view_timeline") && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                            <div className="lg:col-span-2">
                                <ProgressStepPreviewUnit progressSteps={progressSteps} />
                            </div>
                            <div className="lg:col-span-1">
                                <ProgressSummary progressSteps={progressSteps} />
                            </div>
                        </div>
                    )}
                </div>




                {/* Footer with additional details */}
                {/* <div className="bg-gray-100 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated: {new Date().toLocaleString()} • Officer ID: {officer?.unit?.unitId}
                        </p>
                    </div>
                </div> */}
            </DialogContent>


        </Dialog>
    )
}