import { CalendarDays, ChartColumnStacked, ClockArrowUp, Contact, MapPin, MapPinHouse, Phone, Share2, Siren, Ticket } from "lucide-react";
import FormViewer from "../form/dynamic-form/FormViewValue";
// import { getTextPriority } from "../function/Prioriy";
import { mergeArea } from "@/cms/store/api/area";
import { CaseDetails } from "@/cms/types/case";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDate } from "@/core/utils/crud";
import { cancelAndCloseStatus, closeStatus } from "../ui/status/status";
import AttachedFiles from "@/cms/components/Attachment/AttachmentPreviewList";
import Badge from "@/core/components/ui/badge/Badge";
import SOPMetaData from "./CaseSopMetaData";
import { lazy, Suspense, useMemo } from "react";
import Loading from "@/core/components/common/Loading";
// Type-only import - it carries no runtime code, so the staff map stays lazy.
import type { StaffAssignmentOverlay } from "./createCase/map/staff/CaseStaffMapField";

// Heavy @arcgis/core SDK - lazy-loaded so it stays out of the initial bundle.
// BoundaryMapField rather than the bare map: this is the small map in the Case
// Preview modal, and it gets the same boundary controls as everywhere else -
// collapsed to icons, since there is very little room at 220px.
const BoundaryMapField = lazy(() => import("./createCase/map/BoundaryMapField"));
// Same map plus the dispatch staff overlay; only the case assignment page asks
// for it, so it is a separate lazy chunk rather than a flag on the plain map.
const CaseStaffMapField = lazy(() => import("./createCase/map/staff/CaseStaffMapField"));

const requireElements = <span className=" text-red-500 text-sm font-bold">*</span>
interface FormFieldValueDisplayProps {
    caseData?: CaseDetails;
    isCreate?: boolean;
    /** Render a read-only map of the case location (needs stored coordinates). */
    showMap?: boolean;
    /**
     * Case assignment only: also draw the case's dispatch units on the map.
     * Opt-in by design - the creation form and the preview modal share this
     * component and must not show officer positions.
     *
     * `assignment` is a pure pass-through: this component owns no dispatch
     * logic, it only hands the wiring from CaseDetailView down to the map.
     */
    staffOverlay?: { caseId: string; assignment: StaffAssignmentOverlay };
}

// Read-only map never emits a selection, but the prop is required upstream.
const noopSelect = () => { };

const FormFieldValueDisplay: React.FC<FormFieldValueDisplayProps> = ({ caseData, isCreate, showMap = false, staffOverlay }) => {

    const { t, language } = useTranslation();

    // NOT masked, deliberately. `caseData.customerData` is the case's own contact snapshot -
    // the number the caller actually rang from, typed in via `CaseCustomerInput` - not the
    // linked customer's registered `mobileNo`. A caller can open a case from somebody else's
    // phone, so this is case-owned data and stays readable. The customer's own contact
    // details, shown in `CasePanel` from the `Customer` record, remain masked.

    // Only show the map once real coordinates exist - cases saved before the map
    // feature have empty caseLat/caseLon, and an unmarked default-centred map
    // would imply a location the case doesn't actually have.
    const mapValue = useMemo(() => {
        const lat = parseFloat(caseData?.caseLat ?? "");
        const lon = parseFloat(caseData?.caseLon ?? "");
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { latitude: lat, longitude: lon };
        }
        return null;
    }, [caseData?.caseLat, caseData?.caseLon]);


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">

            {caseData?.workOrderRef && <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg col-span-2">
                <span className=" text-md text-blue-500 dark:text-blue-400 " >WorkOrder Infomation</span>
                <div className="mb-2">
                    <span className="text-md text-gray-500 dark:text-gray-400">WorkOrder No # {caseData?.workOrderRef || "-"} </span>
                    {/* <div className="text-md font-medium text-gray-900 dark:text-white">{caseData?.workOrderNummber||"-"}</div> */}
                </div>



            </div>}
            <div className={`bg-gray-50 dark:bg-gray-900 p-4 space-x-2 space-y-2 rounded-lg ${caseData?.workOrderRef ? "" : "col-span-2 sm:col-span-1"}`}>
                <span className=" text-md text-blue-500 dark:text-blue-400 " >{t("case.display.case_information")}</span>
                {caseData?.requireSchedule && <Badge variant="outline" size="sm" >
                    {t(`case.display.request_schedule_date`)}
                </Badge>}
                {!isCreate ? (
                    <div className="flex mb-2 text-gray-500 dark:text-gray-400">
                        <Ticket />
                        <div className="mx-2">
                            <span className="text-md text-gray-500 dark:text-gray-400">
                                {t("case.display.no")} # <span className="text-md font-medium text-gray-900 dark:text-white">
                                    {caseData?.workOrderNummber || "-"}
                                </span>
                            </span>

                        </div>
                    </div>
                ) : null}
                <div className="flex mb-2 text-gray-500 dark:text-gray-400">
                    <ChartColumnStacked />
                    <div className="ml-2">
                        <span className="text-md text-gray-500 dark:text-gray-400">{t("case.display.types")} : </span>
                        <div className="text-md font-medium text-gray-900 dark:text-white">{caseData?.caseType?.caseType || "-"}</div>
                        {caseData?.caseType && <FormViewer formData={caseData.caseType.formField} />}
                    </div>

                </div>



                {/* <div>
                    <span className="text-md text-gray-500 dark:text-gray-400">Priority</span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{caseData?.caseType?.priority ? getTextPriority(caseData.caseType.priority).level : "-"}</div>

                </div> */}
                <div className="flex mb-2 text-gray-500 dark:text-gray-400">
                    <MapPinHouse />
                    <div className="ml-2">
                        <span className="text-md text-gray-500 dark:text-gray-400">{t("case.display.service_center")}</span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white"> {caseData?.area && mergeArea(caseData?.area, language) || "-"}</div>
                    </div>
                </div>
                {caseData?.iotDate &&
                    <div className="flex  text-gray-500 dark:text-gray-400 mb-2">
                        <Siren />
                        <div className="ml-2">
                            <span className="text-md text-gray-500 dark:text-gray-400">{t("case.display.iot_alert_date")}</span>
                            <div className="text-sm font-medium text-gray-900 dark:text-white"> {formatDate(caseData?.iotDate) || "-"}</div>
                        </div>
                    </div>
                }
                {!isCreate && <div className="">
                    {/* <div className=" col-span-1">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <UserPen className="h-4 w-4 mr-2" />
                            <span>{t("case.display.updateBy")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.updateBy || "-"}
                        </div>
                    </div> */}

                    <div className="">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <ClockArrowUp className="h-4 w-4 mr-2" />
                            <span className="text-red-400">{t("case.display.updateAt")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.lastUpdate ? `${formatDate(caseData?.lastUpdate)} ${t("userform.by")} ${caseData?.updateBy}` : "-"}
                        </div>
                    </div>
                </div>}
                <div className="mb-2">
                    <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        <span>{t("case.display.request_schedule_date")} {requireElements}</span>
                    </div>
                    <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                        {caseData?.scheduleDate != "" && caseData?.scheduleDate != null ?
                            formatDate(caseData.scheduleDate, { includeTime: false }) :
                            "-"
                        }
                    </div>
                </div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col h-full">
                <div className="mb-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex-1">
                    <div className="flex mb-2 text-blue-500 dark:text-blue-400">
                        <MapPin /><span className=" mx-1 text-md  " >{t("case.display.area")}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex  gap-x-2 gap-y-1 ">
                            <div>
                                {caseData?.location ? caseData.location : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Read-only location map - view only, so it has no search box
                        and clicking it can't change the case location. */}
                    {showMap && mapValue && (
                        <div className="mt-3">
                            <Suspense fallback={<Loading />}>
                                {staffOverlay ? (
                                    <CaseStaffMapField
                                        caseId={staffOverlay.caseId}
                                        value={mapValue}
                                        onSelect={noopSelect}
                                        address={caseData?.location}
                                        readOnly
                                        height={320}
                                        assignment={staffOverlay.assignment}
                                    />
                                ) : (
                                    <BoundaryMapField
                                        value={mapValue}
                                        onSelect={noopSelect}
                                        address={caseData?.location}
                                        readOnly
                                        height={220}
                                        showPlaceButton
                                    />
                                )}
                            </Suspense>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {t("case.display.location_coordinates")}: {caseData?.caseLat}, {caseData?.caseLon}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center mb-2 text-blue-500 dark:text-blue-400">
                        <Contact className="h-5 w-5 mr-2" />
                        <span className="text-md">{t("case.display.contact")}</span>
                    </div>

                    {/* Phone Number */}
                    <div className="mb-4">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{t("case.display.phone_number")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.customerData?.mobileNo || "-"}
                        </div>
                    </div>

                    {/* Contact Method */}
                    <div className="mb-4">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <Share2 className="h-4 w-4 mr-2" />
                            <span>{t("case.display.contact_method")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.source?.name || "-"}
                        </div>
                    </div>

                    {/* IoT Device */}
                    {/* <div className="mb-4">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <Cpu className="h-4 w-4 mr-2" />
                            <span>{t("case.display.iot_device")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.iotDevice || "-"}
                        </div>
                    </div> */}

                    {/* Schedule Date */}
                    {/* {caseData?.requireSchedule && (
                        <div className="mb-2">
                            <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                                <CalendarDays className="h-4 w-4 mr-2" />
                                <span>{t("case.display.request_schedule_date")} {requireElements}</span>
                            </div>
                            <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                                {caseData?.scheduleDate != "" && caseData?.scheduleDate != null ?
                                    formatDate(caseData.scheduleDate) :
                                    "-"
                                }
                            </div>
                        </div>
                    )} */}
                </div>
            </div>

            {/* {!isCreate && caseData?.requireSchedule &&
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg col-span-2 mb-3">
                    <div className="flex items-center mb-2 text-blue-500 dark:text-blue-400">
                    <SquarePen className="h-5 w-5 mr-2" />
                    <span className="text-md">{t("case.display.edit")}</span>
                </div>
                <div className=" grid grid-cols-2">
                    <div className=" col-span-1 mb-4">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <UserPen className="h-4 w-4 mr-2" />
                            <span>{t("case.display.updateBy")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.updateBy || "-"}
                        </div>
                    </div>

                    <div className=" col-span-1 mb-4">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <ClockArrowUp className="h-4 w-4 mr-2" />
                            <span>{t("case.display.updateAt")}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.lastUpdate ? formatDate(caseData?.lastUpdate) : "-"}
                        </div>
                    </div>
                </div>

                    
                    <div className="mb-2">
                        <div className="flex items-center text-md text-gray-500 dark:text-gray-400">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            <span>{t("case.display.request_schedule_date")} {requireElements}</span>
                        </div>
                        <div className="pl-6 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.scheduleDate != "" && caseData?.scheduleDate != null ?
                                formatDate(caseData.scheduleDate,{includeTime:false}) :
                                "-"
                            }
                        </div>
                    </div>
                    
                </div>} */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg col-span-2">
                <div className="mb-2">
                    <span className="flex mb-2 text-blue-500 dark:text-blue-400"><span>{t("case.display.detail")} <span>{requireElements}</span></span></span>
                    <div className="text-md font-medium text-gray-900 dark:text-white">
                        {caseData?.description || "-"}
                    </div>
                </div>
            </div>
            {caseData?.sopMetaData && caseData?.sopMetaData.length != 0 &&
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg col-span-2">
                    <div className="mb-2">
                        <span className="flex mb-2 text-blue-500 dark:text-blue-400"><span>{t("case.display.audit")} </span></span>
                        <SOPMetaData sopMetadata={caseData?.sopMetaData} />
                    </div>
                </div>
            }

            {cancelAndCloseStatus.includes(caseData?.status || "") &&
                <div className=" col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3">
                    <h3 className="text-blue-500 dark:text-blue-400">{closeStatus === caseData?.status ? t("case.display.result") : t("case.display.cancel_case")}</h3>
                    <div className=" space-y-1">

                        <div className="text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.resultId || "-"}
                        </div>
                        <div className="text-md font-medium text-gray-900 dark:text-white">
                            {t("case.display.detail")}
                        </div>
                        <div className="pl-3 text-md font-medium text-gray-900 dark:text-white">
                            {caseData?.resultDetail || "-"}
                        </div>
                    </div>
                    <AttachedFiles
                        files={caseData?.attachFile}
                        editFormData={false}
                        type={"close"}
                    />
                </div>
            }

            {/* <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg col-span-1 md:col-span-2">
                <div className="mb-2">
                    <span className="text-md text-blue-500 dark:text-blue-400">Attachments</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(attachments) && attachments.length > 0 ? (
                        attachments.map((attachment, index) => {
                            const imageUrl = attachment instanceof File
                                ? URL.createObjectURL(attachment)
                                : String(attachment);
                            return (
                                <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={imageUrl}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                                    />
                                </a>
                            );
                        })
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No attachments found.</div>
                    )}
                </div>
            </div> */}

            <div>
            </div>

        </div >
    );
};
export default FormFieldValueDisplay


