"use client"

import { useCallback, useMemo, useState, useEffect, memo, useRef } from "react"
import { ArrowLeft, Paperclip } from "lucide-react"
import Button from "@/core/components/ui/button/Button"
import PageMeta from "@/core/components/common/PageMeta"
import { FormFieldWithNode } from "@/cms/components/interface/FormField"
// import AssignOfficerModal from "@/cms/components/assignOfficer/AssignOfficerModel"
import { getAvatarIconFromString } from "../avatar/createAvatarFromString"
import type { Custommer } from "@/cms/types";
import React from "react"
import FormFieldValueDisplay from "./CaseDisplay"
import PreviewDataBeforeSubmit from "./PreviewCaseData"
import { Customer, useLazyGetCustommerByPhoneNoQuery } from "@/cms/store/api/custommerApi"
import { CreateCase, usePatchUpdateCaseMutation } from "@/cms/store/api/caseApi" // REMOVED: usePostCreateCaseMutation
import { mergeCaseTypeAndSubType } from "../caseTypeSubType/mergeCaseTypeAndSubType"
import { findCaseTypeSubTypeByTypeIdSubTypeId } from "../caseTypeSubType/findCaseTypeSubTypeByMergeName"
import { useGetCaseSopQuery, useLazyGetSopUnitQuery, usePostCancelCaseMutationMutation, usePostCancelUnitMutationMutation, usePostDispacthMutationMutation } from "@/cms/store/api/dispatch"
import { Area } from "@/cms/store/api/area"
import { CaseCard } from "./sopCard"
import { CaseDetails, CaseEntity, caseResults, FileItem } from "@/cms/types/case"
import CreateSubCaseModel from "./subCase/subCaseModel"
import dispatchUpdateLocate from "./caseLocalStorage.tsx/caseLocalStorage"
import { useNavigate, useParams } from "react-router-dom"
import Panel from "./CasePanel"
import OfficerDataModal from "./OfficerDataModal"
import { AcknowledgedStatus, cancelAndCloseStatus, CaseStatusInterface, doneStatus, RequestCloesStage } from "../ui/status/status"
import { ConfirmationModal } from "./modal/ConfirmationModal"
import { CaseDetailsModal } from "./modal/CaseDetailsModal"
import { useWebSocket } from "@/core/components/websocket/websocket"
import { useTranslation } from "@/core/hooks/useTranslation";
import { COMMON_INPUT_CSS, resultStringLimit, source } from "./constants/caseConstants";
import { CaseFormFields } from "./caseFormFields";
import { CaseTypeSubType } from "../interface/CaseType"
import { getDaysDifference, getLocalISOString, TodayDate } from "../date/DateToString"
import { validateCaseForSubmission } from "./caseDataValidation/caseDataValidation"
import { SearchableSelect } from "../SearchInput/SearchSelectInput"
import { usePermissions, useToast } from "@/core/hooks"
import { ToastContainer } from "@/core/components/crud/ToastContainer"
import AssignOfficerModal from "../assignOfficer/singleAssignOfficer"
import TextAreaWithCounter from "@/core/components/form/input/TextAreaWithCounter"
import { UnitWithSop, Unit, CaseSopUnit, dispatchInterface, CancelCase, CancelUnit } from "@/cms/types/dispatch"
import removeCaseFromLocalStore from "./caseLocalStorage.tsx/removeCaseFromLocalStore"
// Type-only: the staff map itself stays behind CaseDisplay's lazy import.
import type { StaffMarker } from "./createCase/map/staff/staffTypes"
import AttachedFiles from "@/cms/components/Attachment/AttachmentPreviewList"
import { isAttachment, validateFile } from "@/cms/components/Attachment/AttachmentConv"
import { useDeleteFileMutationMutation, usePostUploadFileMutationMutation } from "@/core/store/api/file"
import { updateCaseInLocalStorage } from "./caseLocalStorage.tsx/caseListUpdate"
import RetryButton from "@/core/components/form/input/RetryButton"

interface schedule {
    isSchedule: boolean,
    scheduleDate: string
}

/**
 * A staff member picked on the map, waiting for the dispatcher to confirm.
 * Carries only what the confirmation dialog and the two existing mutations need,
 * so the map never has to hand a full `Unit` back up.
 */
interface MapStaffAction {
    action: "assign" | "cancel";
    unitId: string;
    username: string;
    /** Display name, for the confirmation dialog only. */
    unitName: string;
}

const CaseHeader = memo(({
    disablePageMeta,
    onBack,
    onOpenCustomerPanel,
}: {
    disablePageMeta?: boolean;
    onBack?: () => void;
    onOpenCustomerPanel: () => void;
}) => {
    const { t } = useTranslation()
    return (
        <div className="shrink-0">
            <div>
                <div className="flex items-center justify-between">
                    {!disablePageMeta && (
                        <div className="flex items-center space-x-4">
                            {onBack && (
                                <Button variant="ghost" size="sm" onClick={onBack}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t("case.back")}
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="md:hidden">
                        <Button
                            className="mb-2"
                            variant="outline"
                            size="sm"
                            onClick={onOpenCustomerPanel}
                        >
                            {t("case.panel.details_panel")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CaseHeader.displayName = 'CaseHeader';


const OfficerItem = memo(({
    officer,
    onSelectOfficer,
    handleDispatch,
    unitStatus,
    handleCancel,
    canCancel,
    caseStatus,
    schedule,
}: {
    officer: UnitWithSop;
    onSelectOfficer: (officer: UnitWithSop) => void;
    handleDispatch: (officer: UnitWithSop, setDisableButton: React.Dispatch<React.SetStateAction<boolean>>) => void;
    handleCancel: (officer: UnitWithSop) => void;
    unitStatus: CaseStatusInterface[]
    canCancel: boolean,
    caseStatus: string,
    schedule: schedule
}) => {
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const hasAction = officer.Sop?.nextStage?.nodeId && officer.Sop?.nextStage?.data?.data?.config?.action;
    useEffect(() => {
        setDisableButton(false);
    }, [officer.Sop?.nextStage?.nodeId]);
    const { t, language } = useTranslation();
    const permissions = usePermissions();
    const scheduleDisable = schedule.isSchedule && (schedule.scheduleDate ?
        getDaysDifference(new Date(), new Date(schedule.scheduleDate)) >= 0
        : false)
    const handleOfficerClick = useCallback(() => {
        if (permissions.hasPermission("case.view_timeline")) {
            onSelectOfficer(officer);
        }
    }, [permissions, officer, onSelectOfficer]);

    const fullname = officer.unit.firstName + " " + officer.unit.lastName

    return (
        <div
            key={officer.unit.unitId + "-" + officer.Sop.currentStage.nodeId}
            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-900 text-blue-700 dark:text-blue-200 text-xs font-medium"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {getAvatarIconFromString(fullname, "bg-blue-600 dark:bg-blue-700 mx-1")}
                    <span className="ml-2 cursor-pointer" onClick={handleOfficerClick}>
                        {fullname}
                    </span>
                </div>
                {permissions.hasPermission("case.assign") &&
                    <div className="flex items-end justify-end">
                        <Button
                            onClick={async () => {
                                if (hasAction) {
                                    handleDispatch(officer, setDisableButton);
                                }
                            }}
                            size="xxs"
                            className={`mx-1 ${!hasAction ? 'cursor-default' : ''}`}
                            variant="success"
                            disabled={disableButton || !hasAction || cancelAndCloseStatus.includes(caseStatus) || (caseStatus != AcknowledgedStatus && scheduleDisable)}
                        >
                            {unitStatus.find((item) =>
                                officer?.Sop?.nextStage?.data?.data?.config?.action === item.statusId
                            )?.[language === "th" ? "th" : "en"] || t("case.assign_officer_modal.end_of_action")}
                        </Button>
                        {canCancel && <Button
                            className="ml-2"
                            title="Remove"
                            variant="outline-no-transparent"
                            size="xxs"
                            onClick={() => handleCancel(officer)}
                        >
                            {t("case.display.cancel")}
                        </Button>}
                    </div>
                }
            </div>
        </div>
    );
});
OfficerItem.displayName = 'OfficerItem';


const AssignedOfficers = memo(({
    SopUnit,
    onSelectOfficer,
    handleDispatch,
    unitStatus,
    handleCancel,
    canCancel,
    caseStatus,
    schedule
}: {
    SopUnit: UnitWithSop[] | null;
    onSelectOfficer: (officer: UnitWithSop) => void;
    onRemoveOfficer: (officer: UnitWithSop) => void;
    handleDispatch: (officer: UnitWithSop, setDisableButton: React.Dispatch<React.SetStateAction<boolean>>) => void;
    handleCancel: (officer: UnitWithSop) => void;
    unitStatus: CaseStatusInterface[];
    canCancel: boolean;
    caseStatus: string;
    schedule: schedule
}) => {
    const { t } = useTranslation();
    if (!SopUnit?.length) return null;
    // const { t } = useTranslation();
    return (
        <div className="mb-4 gap-2 flex flex-wrap items-center">
            <div className="mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                    {t("case.display.Assigned Officer" + (SopUnit.length > 1 ? "s" : ""))}:
                </span>
            </div>
            {SopUnit.map(officer => (
                <OfficerItem
                    key={officer.unit.unitId + "-" + officer.Sop.currentStage.caseId}
                    officer={officer}
                    onSelectOfficer={onSelectOfficer}
                    handleDispatch={handleDispatch}
                    unitStatus={unitStatus}
                    handleCancel={handleCancel}
                    canCancel={canCancel}
                    caseStatus={caseStatus}
                    schedule={schedule}
                />
            ))}
        </div>
    );
});
AssignedOfficers.displayName = 'AssignedOfficers';


export default function CaseDetailView({ onBack, caseData, disablePageMeta = false, isSubCase = false, isScheduleDate = false }: { onBack?: () => void, caseData?: CaseEntity, disablePageMeta?: boolean, isSubCase?: boolean, isScheduleDate?: boolean }) {
    const permissions = usePermissions();
    const caseStatus = JSON.parse(localStorage.getItem("caseStatus") ?? "[]") as CaseStatusInterface[]
    const navigate = useNavigate()
    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            navigate('/cms/case/assignment');
        }
    }, [onBack, navigate]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    const [showCloseCaseModal, setShowCloseCaseModal] = useState<boolean>(false)
    const [showCancelUnitModal, setShowCancelUnitModal] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [showCancelCaseModal, setShowCancelCaseModal] = useState<boolean>(false)
    const [unitToCancel, setUnitToCancel] = useState<UnitWithSop | null>(null);
    // Assign / remove requested from the staff card on the map.
    const [mapStaffAction, setMapStaffAction] = useState<MapStaffAction | null>(null);
    // Full case record, opened from the staff card on the map.
    const [showCaseDetailsModal, setShowCaseDetailsModal] = useState<boolean>(false);
    // Scoped per unit rather than a widget-wide flag, so an in-flight request
    // disables only the affected card instead of freezing the whole map.
    const [submittingUnitId, setSubmittingUnitId] = useState<string | null>(null);
    const { caseId: paramCaseId } = useParams<{ caseId: string }>();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialCaseData: CaseEntity | undefined = caseData || (paramCaseId ? { caseId: paramCaseId } as CaseEntity : undefined);
    const [caseState, setCaseState] = useState<CaseDetails | undefined>(undefined);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateSupCase, setShowCreateSupCase] = useState(false);
    const [editFormData, setEditFormData] = useState<boolean>(false);
    const [assignedOfficers, setAssignedOfficers] = useState<Unit[]>([]);
    const [showOfficersData, setShowOFFicersData] = useState<UnitWithSop | null>(null);
    const [dispatchUnit, setDispatchUnit] = useState<CaseSopUnit[] | null>(null);
    const [unitWorkOrder, setUnitWorkOrder] = useState<UnitWithSop[]>([]);
    const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
    const [showPreviewData, setShowPreviewData] = useState(false);
    const [listCustomerData, setListCustomerData] = useState<Customer[]>([])
    const [isInitialized, setIsInitialized] = useState(false);
    const { onMessage, isConnected, connectionState, websocket } = useWebSocket()
    const { t, language } = useTranslation();
    const closeCaseOption = useMemo(() =>
        JSON.parse(localStorage.getItem("caseResultsList") ?? "[]") as caseResults[], []
    );
    const { toasts, addToast, removeToast } = useToast();
    const isCloseStage = RequestCloesStage.find(status => status === caseState?.status);
    const [disableButton, setDisableButton] = useState<boolean>(false);
    const [disableCloseCancelForm, setDisableCloseCancelForm] = useState<boolean>(false);
    const caseTypeSupTypeData = useMemo(() =>
        JSON.parse(localStorage.getItem("caseTypeSubType") ?? "[]") as CaseTypeSubType[], []
    );

    const areaList = useMemo(() =>
        JSON.parse(localStorage.getItem("area") ?? "[]") as Area[], []
    );

    const profile = useMemo(() =>
        JSON.parse(localStorage.getItem("profile") ?? "{}"), []
    );

    const { data: sopData, isError, isLoading, refetch } = useGetCaseSopQuery(
        { caseId: initialCaseData?.caseId || "" },
        {
            refetchOnMountOrArgChange: true,
            skip: !initialCaseData?.caseId
        }
    );
    const [delFileApi] = useDeleteFileMutationMutation();
    const [updateCase] = usePatchUpdateCaseMutation();
    const [postDispatch] = usePostDispacthMutationMutation();
    const [postCancelCase] = usePostCancelCaseMutationMutation();
    const [postCancelUnit] = usePostCancelUnitMutationMutation();
    const [getCustomerByPhone] = useLazyGetCustommerByPhoneNoQuery();
    const [getSopUnit] = useLazyGetSopUnitQuery();
    const [refetchTriggerUnit, setRefetchTriggerUnit] = useState(Boolean);
    const canCancelUnit = sopData?.data?.dispatchStage?.data?.data?.config?.action === sopData?.data?.currentStage?.data?.data?.config?.action
    useEffect(() => {
        if (!isInitialized) {
            const customerList = JSON.parse(localStorage.getItem("customer_data") ?? "[]") as Customer[];
            setListCustomerData(customerList);
            setIsInitialized(true);
        }
    }, [isInitialized]);

    const updateCaseState = useCallback((updates: Partial<CaseDetails>) => {
        setCaseState(prev => prev ? { ...prev, ...updates } : prev);
    }, [setCaseState]);

    useEffect(() => {
        const listener = onMessage((message) => {
            try {
                if (message?.data) {
                    const data = message.data;
                    if (data.EVENT === "CASE-UPDATE") {
                        (async () => {
                            const caseIdFromUrl = data.redirectUrl.split('/case/')[1];
                            if (caseIdFromUrl && caseState?.workOrderNummber === caseIdFromUrl) {
                                await refetch();
                            }
                        })();
                    } else if (data?.EVENT === "CASE-STATUS-UPDATE") {
                        (async () => {
                            if (data?.additionalJson?.caseId && caseState?.workOrderNummber === data?.additionalJson?.caseId) {
                                await refetch();
                            }
                        })();
                    }
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        });

        return () => {
            listener();
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onMessage, websocket, connectionState, isConnected, caseState]);


    useEffect(() => {
        if (sopData?.data && initialCaseData) {
            if (sopData.data.unitLists) {
                setDispatchUnit(sopData.data.unitLists)
            }
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sopData?.data, initialCaseData?.caseId]);


    const triggerRefetchUnit = useCallback(async () => {
        const result = await refetch();
        setRefetchTriggerUnit(prev => !prev);
        return result;
    }, [refetch]);

    const [postUploadFile] = usePostUploadFileMutationMutation();

    const handleRusultFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!files || files.length === 0) {
            return;
        }
        const newFilesArray = Array.from(files);
        const uploadedFiles: FileItem[] = [];

        try {
            for (const file of newFilesArray) {
                try {
                    if (!validateFile(file)) {
                        addToast("error", `File "${file.name}" is too large.`)
                        continue
                    }
                    const result = await postUploadFile({
                        path: "close",
                        file: file,
                        caseId: caseState?.workOrderNummber
                    }).unwrap();

                    if (result.data) {
                        uploadedFiles.push(result.data);
                        console.log(`✅ Uploaded ${file.name}`);
                    } else {
                        console.error(`❌ Failed to upload ${file.name}`);
                        addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Error uploading ${file.name}:`, error);
                    addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                }
            }

            if (uploadedFiles.length > 0) {

                // const currentFiles = prev.attachFile ?? [];

                updateCaseState({ attachFile: [...(caseState?.attachFile || []), ...uploadedFiles] })
                // addToast?.("success", t("case.display.toast.upload_file_success"));
            }
        } catch (error) {
            console.error("Error during file upload process:", error);
            addToast?.("error", t("case.display.toast.upload_file_fail"));
        } finally {
            e.target.value = '';
        }
    };


    useEffect(() => {
        if (!dispatchUnit || dispatchUnit.length === 0) {
            setUnitWorkOrder([]);
            return;
        }

        const fetchData = async () => {
            const results = await Promise.all(
                dispatchUnit.map(async (item) => {
                    try {
                        const data = await getSopUnit({
                            caseId: initialCaseData?.caseId || "",
                            unitId: item.unitId,
                        }).unwrap();

                        if (data?.data) {
                            return { unit: item, Sop: data.data };
                        }
                    } catch (err) {
                        console.error("Error fetching SOP unit:", err);
                    }
                    return null;
                })
            );

            setUnitWorkOrder(results.filter((r): r is UnitWithSop => r !== null));
        };

        fetchData();
    }, [dispatchUnit, sopData, getSopUnit, refetchTriggerUnit, initialCaseData?.caseId]);

    const handleCancelUnitClick = useCallback((officer: UnitWithSop) => {
        setUnitToCancel(officer);
        setShowCancelUnitModal(true);
    }, []);

    const handleConfirmCancelUnit = useCallback(async (unit: CaseSopUnit) => {
        const cancelUnitJson: CancelUnit = {
            caseId: initialCaseData!.caseId,
            unitId: unit.unitId,
            unitUser: unit.username,
        };
        try {
            if (!(cancelUnitJson.caseId && cancelUnitJson.unitId && cancelUnitJson.unitUser)) {
                throw new Error("No data found in cancel unit object");
            }
            const payload = await postCancelUnit(cancelUnitJson).unwrap();
            if (payload.msg?.toLocaleLowerCase() !== "success") {
                throw Error
            }
            addToast("success", t("case.display.toast.cancel_unit_success"));
        } catch (error) {
            addToast("error", t("case.display.toast.cancel_unit_fail") + ` ${error}`);
            setDisableButton(false);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postCancelUnit, initialCaseData])

    const handleOnChickCloseButton = useCallback(async () => {
        const closeCaseData = closeCaseOption.find(items => caseState?.resultId === items[language === "th" ? "th" : "en"])
        const dispatchjson = {
            caseId: caseState?.workOrderNummber,
            status: sopData?.data?.nextStage?.data?.data?.config?.action,
            resId: closeCaseData?.resId,
            resDetail: caseState?.resultDetail
        } as dispatchInterface;
        try {
            if (!dispatchjson ||
                !dispatchjson.caseId ||
                !dispatchjson.status ||
                dispatchjson.resId === undefined ||
                Object.keys(dispatchjson).length === 0) {
                console.log(dispatchjson)
                throw t("case.display.toast.missing_close_case_data");
            }
            const payload = await postDispatch(dispatchjson).unwrap();
            if (payload.msg?.toLocaleLowerCase() !== "success") {
                throw Error
            }
            addToast("success", t("case.display.toast.close_case_success"));
        } catch (error) {
            addToast("error", t("case.display.toast.close_case_fail") + ` ${error}`);
            setDisableButton(false);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postDispatch, caseData, caseState])

    const handleConfirmCancelCase = useCallback(async () => {
        const cancelCaseData = closeCaseOption.find(items => caseState?.resultId === items[language === "th" ? "th" : "en"])
        const canceljson = {
            caseId: caseState?.workOrderNummber,
            resId: cancelCaseData?.resId,
            resDetail: caseState?.resultDetail
        } as CancelCase;
        try {
            if (!canceljson ||
                !canceljson.caseId ||
                canceljson.resId === undefined ||
                Object.keys(canceljson).length === 0) {
                console.log(canceljson)
                throw t("case.display.toast.missing_close_case_data");
            }
            const payload = await postCancelCase(canceljson).unwrap();
            if (payload.msg?.toLocaleLowerCase() !== "success") {
                throw Error
            }
            addToast("success", t("case.display.toast.cancel_case_success"));
            removeCaseFromLocalStore(canceljson.caseId)
            // navigate(-1)
        } catch (error) {
            addToast("error", t("case.display.toast.cancel_case_fail") + ` ${error}`);
            setDisableButton(false);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postCancelCase, caseData, caseState])


    useEffect(() => {
        if (sopData?.data && areaList.length > 0 && caseTypeSupTypeData.length > 0) {
            const utcTimestamp: string | undefined = sopData.data?.createdAt;
            const area = areaList.find((items) =>
                sopData?.data?.provId === items.provId &&
                sopData?.data?.distId === items.distId &&
                sopData?.data?.countryId === items.countryId
            );

            const initialCaseTypeData = findCaseTypeSubTypeByTypeIdSubTypeId(
                caseTypeSupTypeData,
                sopData.data.caseTypeId,
                sopData.data.caseSTypeId
            ) ?? {} as CaseTypeSubType;

            const initialMergedCaseType = mergeCaseTypeAndSubType(initialCaseTypeData, language);
            const newCaseState: CaseDetails = {
                location: sopData.data?.caseLocAddr || "",
                caseLat: sopData.data?.caseLat || "",
                caseLon: sopData.data?.caseLon || "",
                date: utcTimestamp ? getLocalISOString(utcTimestamp) : "",
                caseType: {
                    ...initialCaseTypeData,
                    caseType: initialMergedCaseType,
                    formField: sopData.data?.formAnswer || {} as FormFieldWithNode,
                },
                priority: sopData.data?.priority || 0,
                description: sopData.data?.caseDetail || "",
                workOrderNummber: sopData.data?.caseId || "",
                workOrderRef: sopData.data?.referCaseId || "",
                iotDevice: sopData.data?.deviceId || "",
                iotDate: getLocalISOString(sopData.data?.startedDate) || "",
                area: area,
                source: {
                    id: sopData?.data?.source || "",
                    name: source.find((items) => items.id === sopData?.data?.source)?.name || ""
                },
                status: sopData.data?.statusId || "",
                lastUpdate: sopData.data?.updatedAt,
                updateBy: sopData.data?.updatedBy,
                attachFile: sopData.data?.attachments as FileItem[],
                attachFileResult: [] as File[],
                requireSchedule: sopData.data?.scheduleFlag || false,
                scheduleDate: sopData.data?.scheduleDate || "",
                deviceMetaData: sopData.data.deviceMetaData,
                resultDetail: sopData.data.resDetail,
                sopMetaData: sopData.data.sop_metadata,
                resultId: closeCaseOption.find(result => {
                    if (sopData.data?.resId === result.resId) return result
                })?.[language == "th" ? "th" : "en"]
            } as CaseDetails;
            setDisableCloseCancelForm(cancelAndCloseStatus.includes(sopData.data.statusId))
            setCaseState(newCaseState);
        }
        else if (isSubCase) {
            const newCaseState: CaseDetails = {
                workOrderNummber: initialCaseData?.caseId || "",
                workOrderRef: initialCaseData?.referCaseId || "",
            } as CaseDetails;
            setCaseState(newCaseState);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sopData?.data, areaList.length, caseTypeSupTypeData, isSubCase, language]);


    useEffect(() => {
        if (sopData?.data) {
            // sopData.data.customerId is the server's authoritative link - prefer it over
            // a phone-number match in the (stale, localStorage-cached) listCustomerData,
            // which can point at a different customer who happens to share that number.
            const linkedId = sopData?.data?.customerId ? String(sopData.data.customerId) : undefined;
            const result = linkedId
                ? listCustomerData.find(items => String(items.id) === linkedId)
                : listCustomerData.find(items => items.mobileNo === sopData?.data?.phoneNo);
            const customerData = result ? {
                ...result,
                name: `${result.firstName} ${result.lastName}`,
                contractMethod: {
                    id: sopData?.data?.source || "",
                    name: source.find((items) => items.id === sopData?.data?.source)?.name || ""
                }
            } as Custommer : {
                id: linkedId,
                mobileNo: sopData?.data?.phoneNo,
            } as Custommer;
            setCaseState(prev => prev ? {
                ...prev,
                customerData: customerData,
                status: prev.status || "",
            } as CaseDetails : prev);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listCustomerData.length, sopData?.data]);


    const handleRemoveCaseFile = useCallback(async (index: number) => {
        if (!caseState?.attachFile) {
            console.warn("No attach file");
            return;
        }
        const fileToRemove = caseState.attachFile[index];
        if (isAttachment(fileToRemove)) {
            try {
                const result = await delFileApi({
                    attId: fileToRemove.attId,
                    caseId: caseState.workOrderNummber || "",
                    filename: fileToRemove.attName,
                    path: "case"
                });

                if (!result.data) {
                    console.error(`Failed to delete ${fileToRemove.attName}`);
                    addToast("error", `${t("case.display.toast.upload_file_fail")}: ${fileToRemove}`);
                    return;
                }

                console.log(`Successfully deleted ${fileToRemove.attName}`);
            } catch (error) {
                console.error(`Failed to delete ${fileToRemove.attName}:`, error);
                addToast("error", `${t("case.display.toast.upload_file_fail")}: ${fileToRemove}`);
                return;
            }
        }

        setCaseState((prev) => {
            if (!prev) return prev;

            const updatedFiles = (prev.attachFile ?? []).filter((_file, i) => i !== index);

            return {
                ...prev,
                attachFile: updatedFiles,
            };
        });


    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseState?.attachFile]);

    const handleSelectOfficer = useCallback((selectedOfficer: UnitWithSop) => {
        setShowOFFicersData(prev => (prev?.unit.unitId === selectedOfficer.unit.unitId ? null : selectedOfficer));
    }, []);

    const handleRemoveOfficer = useCallback((officerToRemove: UnitWithSop) => {
        setAssignedOfficers(prev => prev.filter(o => o.unitId !== officerToRemove.unit.unitId));
        if (showOfficersData?.unit.unitId === officerToRemove.unit.unitId) {
            setShowOFFicersData(null);
        }
    }, [showOfficersData?.unit.unitId]);




    // const handleFileChangeToServer = async (
    //     newFiles: FileItem[],
    //     oldFiles: FileItem[],
    //     caseId: string
    // ) => {
    //     const results: any[] = [];
    //     const oldAttachments = oldFiles.filter(isAttachment);
    //     const newAttachments = newFiles.filter(isAttachment);

    //     const attachmentsToDelete = oldAttachments.filter(
    //         oldFile => !newAttachments.some(newFile => newFile.attId === oldFile.attId)
    //     );

    //     for (const fileToDelete of attachmentsToDelete) {
    //         try {
    //             const result = await delFileApi({
    //                 attId: fileToDelete.attId,
    //                 caseId: caseId,
    //                 filename: fileToDelete.attName,
    //                 path: "case"
    //             });

    //             if (!result?.data) {
    //                 console.error(`❌ Failed to delete ${fileToDelete.attName}`);
    //                 continue;
    //             }

    //             console.log(`✅ Deleted ${fileToDelete.attName}`);
    //         } catch (error) {
    //             console.error(`❌ Error deleting ${fileToDelete.attName}:`, error);
    //         }
    //     }

    //     const newFilesToUpload = newFiles.filter((file): file is File => !isAttachment(file));

    //     for (const file of newFilesToUpload) {
    //         try {
    //             const result = await postUploadFile({
    //                 path: "case",
    //                 file,
    //                 caseId: caseId
    //             }).unwrap();

    //             if (result.data) {
    //                 results.push(result.data);
    //                 console.log(`✅ Uploaded ${file.name}`);
    //             } else {
    //                 console.error(`❌ Failed to upload ${file.name}`);
    //             }
    //         } catch (error) {
    //             console.error(`❌ Error uploading ${file.name}:`, error);
    //         }
    //     }

    //     return results;
    // };

    const handleSaveChanges = useCallback(async () => {
        setShowPreviewData(false)
        setIsSaving(true)
        // Fall back to the server's last-known link (sopData.data.customerId) rather than
        // null when the form's customerData.id is unset - there's no explicit "unlink"
        // action yet, so an absent id here must never be read as an intentional detach.
        let customerId: string | number | null = caseState?.customerData?.id || sopData?.data?.customerId || null;

        // Only fall back to a phone-number lookup when no customer has been resolved yet
        // (e.g. via "Link existing customer" / "Add new customer") - otherwise a phone
        // number that legitimately belongs to someone else must not clear the linked customer.
        if (!customerId && caseState?.customerData?.mobileNo) {
            try {
                const custRes = await getCustomerByPhone({
                    id: caseState.customerData.mobileNo,
                    // phoneNo: caseState.customerData.mobileNo
                }).unwrap();

                if (custRes?.data?.id) {
                    customerId = custRes.data.id;
                }

            } catch (error) {
                console.warn("Failed to fetch customer by phone:", error);
            }
        }
        const updateJson = {
            ...sopData?.data,
            caseId: caseState?.workOrderNummber,
            formData: caseState?.caseType?.formField,
            customerName: caseState?.customerData?.name,
            caseDetail: caseState?.description || "",
            caseDuration: 0,
            caseLat: caseState?.caseLat || "",
            caseLon: caseState?.caseLon || "",
            createdDate: caseState?.status === "S000" ? new Date(TodayDate()).toISOString() : undefined,
            caseSTypeId: caseState?.caseType?.sTypeId || "",
            caseTypeId: caseState?.caseType?.typeId || "",
            caseVersion: caseState?.status === "S000" ? "publish" : sopData?.data?.caseVersion,
            caselocAddr: caseState?.location || "",
            countryId: caseState?.area?.countryId || "",
            distId: caseState?.area?.distId,
            extReceive: "",
            phoneNoHide: true,
            phoneNo: caseState?.customerData?.mobileNo || "",
            priority: caseState?.caseType?.priority || 0,
            provId: caseState?.area?.provId || "",
            referCaseId: caseState?.workOrderRef || "",
            resDetail: "",
            caseSla: caseState?.caseType?.caseSla || "",
            deviceId: caseState?.iotDevice || "",
            source: caseState?.source?.id || "",
            statusId: caseState?.status === "S000" ? "S001" : sopData?.data?.statusId,
            userarrive: "",
            userclose: "",
            usercommand: caseState?.serviceCenter?.commandTh || "",
            usercreate: profile?.username || "",
            userreceive: "",
            nodeId: caseState?.caseType?.formField?.nextNodeId || "",
            wfId: caseState?.caseType?.wfId || "",
            versions: caseState?.caseType?.formField.versions || "",
            deptId: caseState?.serviceCenter?.deptId || undefined,
            commId: caseState?.serviceCenter?.commId || undefined,
            stnId: caseState?.serviceCenter?.stnId || undefined,
            scheduleFlag: caseState?.requireSchedule,
            customerId: customerId ? parseInt(String(customerId), 10) : null,
        } as CreateCase;

        try {

            // await handleFileChangeToServer(caseState?.attachFile || [], sopData?.data?.attachments || [], caseState?.workOrderNummber || "");
            await updateCase({ caseId: caseState?.workOrderNummber || "", updateCase: updateJson }).unwrap();
            updateCaseInLocalStorage(updateJson, updateJson.caseId);
            if (caseState?.status === "S000") {
                setCaseState(prev => prev ? { ...prev, status: "S001" } : prev);
                if (caseState?.workOrderNummber) navigate("/cms/case/" + caseState?.workOrderNummber);
            }

            addToast("success", t("case.display.toast.save_change_sucess"));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.log(error)
            addToast('error', t("case.display.toast.save_change_fail"));
        }
        setEditFormData(false);
        setIsSaving(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseState, sopData?.data, updateCase, updateCaseInLocalStorage, profile, navigate, isScheduleDate, getCustomerByPhone]);

    const handlePreviewShow = useCallback(() => {
        const errorMessage = validateCaseForSubmission(caseState);
        if (errorMessage) {
            addToast('error', errorMessage);
            return;
        }
        setShowPreviewData(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validateCaseForSubmission, caseState]);

    const handleEditClick = useCallback(() => {
        setEditFormData(prev => !prev);
    }, []);

    const handleUnitSopDispatch = useCallback(async (officer: UnitWithSop, setDisableButton: React.Dispatch<React.SetStateAction<boolean>>) => {
        setDisableButton(true)
        const dispatchjson = {
            unitId: officer.unit.unitId,
            caseId: initialCaseData!.caseId,
            nodeId: officer.Sop?.nextStage?.nodeId,
            status: officer.Sop?.nextStage?.data?.data?.config?.action,
            unitUser: officer.unit?.username
        };
        try {
            if (!(dispatchjson.caseId && dispatchjson.nodeId && dispatchjson.status && dispatchjson?.unitId)) {
                throw new Error("No data found in dispatch object");
            }
            const payload = await postDispatch(dispatchjson).unwrap();
            if (payload.msg?.toLocaleLowerCase() !== "success") {
                throw Error
            }
            addToast("success", `${caseStatus.find(items => officer.Sop?.nextStage?.data?.data?.config?.action === items.statusId)?.[language === "th" ? "th" : "en"] || ""} ${t("common.success")}`);
            dispatchUpdateLocate(dispatchjson)
            setCaseState(prev => prev ? { ...prev, status: dispatchjson.status } : prev);
            await triggerRefetchUnit();
            return true
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            addToast("error", `${caseStatus.find(items => officer.Sop?.nextStage?.data?.data?.config?.action === items.statusId)?.[language === "th" ? "th" : "en"] || ""} ${t("status.failed")}`)
            setDisableButton(false);
            return false
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCaseData, postDispatch, triggerRefetchUnit]);

    // Runs the SOP dispatch stage for one officer. No toast and no refetch here:
    // a case can be handed to several officers in one go, and the caller decides
    // whether that means one message per officer or a single summary.
    const dispatchOfficer = useCallback(async (officer: Unit) => {
        const dispatchjson = {
            unitId: officer.unitId,
            caseId: initialCaseData!.caseId,
            nodeId: sopData?.data?.dispatchStage?.nodeId,
            status: sopData?.data?.dispatchStage?.data?.data?.config?.action,
            unitUser: officer.username
        };
        try {
            if (!(dispatchjson.caseId && dispatchjson.nodeId && dispatchjson.status && dispatchjson?.unitId)) {
                throw new Error("No data found in dispatch object");
            }
            await postDispatch(dispatchjson).unwrap();
            dispatchUpdateLocate(dispatchjson)
            setCaseState(prev => prev ? { ...prev, status: dispatchjson.status } : prev);
            return true
        } catch (error) {
            console.error('Dispatch failed:', error);
            return false
        }
    }, [initialCaseData, postDispatch, sopData?.data]);

    const handleDispatch = useCallback(async (officer: Unit) => {
        const isDispatched = await dispatchOfficer(officer);
        if (isDispatched) {
            addToast("success", t("case.display.toast.dispatch_success"));
            refetch()
        } else {
            addToast("error", t("case.display.toast.dispatch_fail"));
        }
        return isDispatched

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatchOfficer, refetch]);

    // Officers are dispatched one at a time so the backend applies the SOP stage
    // sequentially, but the case is refetched once at the end rather than per officer.
    const handleAssignOfficers = useCallback(async (selectedOfficers: Unit[]) => {
        if (selectedOfficers.length === 0) {
            setShowAssignModal(false);
            return;
        }

        const failedOfficerNames: string[] = [];
        for (const officer of selectedOfficers) {
            const isDispatched = await dispatchOfficer(officer);
            if (!isDispatched) {
                failedOfficerNames.push(officer.unitName);
            }
        }

        if (failedOfficerNames.length === 0) {
            addToast("success", t("case.display.toast.dispatch_success"));
        } else if (failedOfficerNames.length < selectedOfficers.length) {
            addToast("error", `${t("case.display.toast.dispatch_fail")}: ${failedOfficerNames.join(", ")}`);
        } else {
            addToast("error", t("case.display.toast.dispatch_fail"));
        }

        await refetch();
        setShowAssignModal(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatchOfficer, refetch]);

    // --- Assign / remove straight from the staff card on the map -------------
    //
    // The map only reports which marker was pressed; everything else - payload,
    // SOP stage, confirmation, toasts, refetch - stays here, and both mutations
    // are the ones the assign modal already uses, so the two paths cannot drift.

    // The SOP unit list is the single source of truth for "already assigned",
    // the same rule AssignOfficerModal applies to build its available officers.
    const assignedUnitIds = useMemo(
        () => new Set((sopData?.data?.unitLists ?? []).map((unit) => unit.unitId)),
        [sopData?.data?.unitLists]
    );

    // Each assigned unit's status ON THIS CASE - distinct from their global duty
    // status (StaffMarker.statusId), which is already shown elsewhere. An absent
    // key means "not assigned to this case", same as assignedUnitIds.has() would say.
    const assignedUnitStatusById = useMemo(
        () => new Map((sopData?.data?.unitLists ?? []).map((unit) => [unit.unitId, unit.statusId])),
        [sopData?.data?.unitLists]
    );

    const handleRequestAssignFromMap = useCallback((marker: StaffMarker) => {
        setMapStaffAction({
            action: "assign",
            unitId: marker.unitId,
            username: marker.username,
            unitName: marker.unitName
        });
    }, []);

    const handleRequestCaseDetails = useCallback(() => {
        setShowCaseDetailsModal(true);
    }, []);

    const handleRequestCancelFromMap = useCallback((marker: StaffMarker) => {
        setMapStaffAction({
            action: "cancel",
            unitId: marker.unitId,
            username: marker.username,
            unitName: marker.unitName
        });
    }, []);

    // No optimistic update: whether a unit ends up assigned is decided by the SOP
    // workflow on the backend, so the card waits for the refetched data instead
    // of flipping ahead of it and then contradicting itself.
    const handleConfirmMapStaffAction = useCallback(async () => {
        if (!mapStaffAction) {
            return;
        }
        const { action, unitId, username } = mapStaffAction;
        setSubmittingUnitId(unitId);
        try {
            if (action === "assign") {
                // handleDispatch reads only unitId / username off the Unit.
                await handleDispatch({ unitId, username } as Unit);
            } else {
                await handleConfirmCancelUnit({ unitId, username } as CaseSopUnit);
            }
        } finally {
            setSubmittingUnitId(null);
        }
    }, [mapStaffAction, handleDispatch, handleConfirmCancelUnit]);

    // Turns on the map's staff layer. Same caseId the assign modal uses, since
    // both read /dispatch/{caseId}/units.
    const staffOverlay = useMemo(
        () => (initialCaseData?.caseId
            ? {
                caseId: initialCaseData.caseId,
                assignment: {
                    caseLabel: caseState?.workOrderNummber || initialCaseData.caseId,
                    assignedUnitIds,
                    assignedUnitStatusById,
                    // Same gate as the modal's `canDispatch`.
                    canAssign: sopData?.data?.dispatchStage?.data ? true : false,
                    canCancel: canCancelUnit,
                    submittingUnitId,
                    onRequestAssign: handleRequestAssignFromMap,
                    onRequestCancel: handleRequestCancelFromMap,
                    onRequestCaseDetails: handleRequestCaseDetails
                }
            }
            : undefined),
        [
            initialCaseData?.caseId,
            caseState?.workOrderNummber,
            assignedUnitIds,
            assignedUnitStatusById,
            sopData?.data?.dispatchStage?.data,
            canCancelUnit,
            submittingUnitId,
            handleRequestAssignFromMap,
            handleRequestCancelFromMap,
            handleRequestCaseDetails
        ]
    );

    if (initialCaseData && isLoading) {
        return (
            <div className="relative flex-1 min-h-screen ">
                <div className="absolute inset-0 flex items-center justify-center dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70 z-50 rounded-2xl">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <div className="text-lg text-gray-700 dark:text-gray-200 font-semibold">{t("common.loading")}</div>
                    </div>
                </div>
            </div>
        );
    }

    if ((sopData === undefined || isError)) {
        return (
            <div className="flex flex-col h-screen">
                {!disablePageMeta && <PageMeta title="Case Detail" description="Case Detail Page" />}
                <CaseHeader
                    disablePageMeta={disablePageMeta}
                    onBack={handleBack}
                    onOpenCustomerPanel={() => setIsCustomerPanelOpen(true)}
                />
                <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 md:flex rounded-2xl">
                    <div className="flex items-center justify-center h-full w-full">
                        <div className="text-center px-6 py-12">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t("common.error")}</h3>
                            {/* <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                The case you're looking for doesn't exist or couldn't be loaded.
                            </p> */}
                            <RetryButton refetch={refetch} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-screen">
            {!disablePageMeta && <PageMeta title="Case Detail" description="Case Detail Page" />}
            <CaseHeader
                disablePageMeta={disablePageMeta}
                onBack={handleBack}
                onOpenCustomerPanel={() => setIsCustomerPanelOpen(true)}
            />
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 md:flex rounded-2xl custom-scrollbar">
                <div className="flex flex-col md:flex-row h-full gap-1 w-full">
                    <div className="overflow-y-auto w-full md:w-2/3 lg:w-3/4 custom-scrollbar">
                        <div className="pr-0">
                            <div className="px-4 pt-6">
                                {(initialCaseData && sopData?.data) && (
                                    <CaseCard
                                        onAddSubCase={() => setShowCreateSupCase(true)}
                                        onAssignClick={() => setShowAssignModal(true)}
                                        onEditClick={handleEditClick}
                                        caseData={sopData.data}
                                        editFormData={editFormData}
                                        setCaseData={setCaseState}
                                    />
                                )}
                                <AttachedFiles
                                    files={caseState?.attachFile}
                                    editFormData={false}
                                    onRemove={handleRemoveCaseFile}
                                    type={"case"}
                                />
                                <AssignedOfficers
                                    SopUnit={unitWorkOrder}
                                    onSelectOfficer={handleSelectOfficer}
                                    onRemoveOfficer={handleRemoveOfficer}
                                    handleDispatch={handleUnitSopDispatch}
                                    unitStatus={caseStatus}
                                    handleCancel={handleCancelUnitClick}
                                    canCancel={canCancelUnit}
                                    caseStatus={caseState?.status || ""}
                                    schedule={{
                                        isSchedule: caseState?.requireSchedule || false
                                        , scheduleDate: caseState?.scheduleDate || ""
                                    }}
                                />
                                {showOfficersData && <OfficerDataModal officer={showOfficersData} onOpenChange={() => setShowOFFicersData(null)} />}
                            </div>
                            <div className="px-4">
                                {editFormData && caseState ? (
                                    <div>
                                        <CaseFormFields
                                            caseState={caseState}
                                            onCaseChange={updateCaseState}
                                            isCreate={false}
                                            listCustomerData={listCustomerData}
                                        />
                                        <div className="flex justify-end items-center m-3">
                                            <Button onClick={handlePreviewShow} disabled={isSaving}>
                                                {t("case.display.save_change")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <FormFieldValueDisplay
                                            caseData={caseState}
                                            showMap
                                            staffOverlay={staffOverlay}
                                        />
                                        {!disableCloseCancelForm &&
                                            <div className=" col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3">
                                                <h3 className="text-blue-500 dark:text-blue-400">{t("case.display.result")}</h3>
                                                <div>
                                                    <div className="grid  grid-cols-[70%_30%] xl:grid-cols-[80%_20%] space-x-3">
                                                        <SearchableSelect
                                                            options={closeCaseOption.map(result => result[language == "th" ? "th" : "en"])}
                                                            value={caseState?.resultId || ""}
                                                            onChange={(e) => updateCaseState({ resultId: e })} placeholder={t("case.display.result_placeholder")}
                                                            className="  mb-2 items-center"
                                                        />
                                                        {permissions.hasPermission("case.attach_file") && <div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-full"
                                                                onClick={handleButtonClick}
                                                            >
                                                                <Paperclip className="w-4 h-4 mr-2" />
                                                                {t("case.sop_card.attach_file")}
                                                            </Button>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                ref={fileInputRef}
                                                                multiple
                                                                onChange={handleRusultFileChange}
                                                                style={{ display: "none" }}
                                                            />
                                                        </div>}
                                                    </div>

                                                    <div className="mb-3">
                                                        {/* <h3 className="text-gray-900 dark:text-gray-400 mx-3">Result Details</h3> */}
                                                        <TextAreaWithCounter
                                                            value={caseState?.resultDetail || ""}
                                                            maxLength={resultStringLimit}
                                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                            onChange={(e: any) => updateCaseState({ resultDetail: e.target.value })}
                                                            placeholder={t("case.display.result_detail_placeholder")} className={`w-full h-20 p-2 appearance-none rounded bg-gray-200!  dark:bg-gray-800! ${COMMON_INPUT_CSS}`}
                                                        />
                                                    </div>
                                                    <AttachedFiles
                                                        files={caseState?.attachFile}
                                                        editFormData={false}
                                                        onRemove={handleRemoveCaseFile}
                                                        type={"close"}
                                                    />
                                                </div>
                                                {/* <DragDropFileUpload
                                                    files={caseState?.attachFile || []}
                                                    onFilesChange={handleFilesChange}
                                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                                    maxSize={1}
                                                    className="mb-4"
                                                    type="close"
                                                    disableDelImageButton={true}
                                                    caseId={caseState?.workOrderNummber}
                                                /> */}
                                                <div className="flex justify-end items-end space-x-3">
                                                    {caseState?.status !== doneStatus && <div className="justify-end items-end flex">
                                                        <Button size="sm" onClick={() => setShowCancelCaseModal(true)} variant="outline">{t("case.display.cancel_case")}</Button>
                                                    </div>}
                                                    {permissions.hasPermission("case.close") &&
                                                        <div className="ml-2">
                                                            <Button size="sm" variant="primary" onClick={() => setShowCloseCaseModal(true)} disabled={!isCloseStage || disableButton}>{t("case.display.close_case")}</Button>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={`
                        fixed top-0 right-0 h-full w-[90%] max-w-md z-40
                        transition-transform duration-300 ease-in-out
                        md:relative md:h-auto md:w-1/3 lg:w-1/4 md:translate-x-0 md:z-auto
                        md:border-l md:border-gray-200 md:dark:border-gray-800 px-1
                        ${isCustomerPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}>
                        <Panel
                            onClose={() => setIsCustomerPanelOpen(false)}
                            caseWorkOrderNumber={caseState?.workOrderNummber}
                            iotDevice={caseState?.iotDevice}
                            deviceMetaData={caseState?.deviceMetaData}
                            customerNumber={caseState?.customerData?.mobileNo}
                            customerId={caseState?.customerData?.id}
                            referCaseList={sopData?.data?.referCaseLists}
                            caseData={sopData?.data}
                            setCaseState={setCaseState}
                        />



                    </div>
                </div>
            </div>
            {isCustomerPanelOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setIsCustomerPanelOpen(false)}
                />
            )}
            <PreviewDataBeforeSubmit
                caseData={{ ...caseState, updateBy: profile.username, lastUpdate: new Date().toISOString() } as CaseDetails}
                submitButton={handleSaveChanges}
                isOpen={showPreviewData}
                isCreate={false}
                onClose={() => setShowPreviewData(false)}
            />
            <CreateSubCaseModel
                caseData={initialCaseData}
                open={showCreateSupCase}
                onOpenChange={setShowCreateSupCase}
            />
            <AssignOfficerModal
                open={showAssignModal}
                onOpenChange={setShowAssignModal}
                caseId={initialCaseData?.caseId || ""}
                caseData={sopData?.data}
                onAssign={handleAssignOfficers}
                assignedOfficers={assignedOfficers}
                canDispatch={sopData?.data?.dispatchStage?.data ? true : false}
                sopUnitLists={sopData?.data?.unitLists || []}
            />
            <ConfirmationModal
                isOpen={showCancelUnitModal}
                onClose={() => setShowCancelUnitModal(false)}
                onConfirm={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    unitToCancel &&
                        handleConfirmCancelUnit(unitToCancel?.unit)
                }
                }
                title={t("case.display.cancel_case_assignment_title")}
                description={<>{t("case.display.cancel_case_assignment_detail")} <strong>{unitToCancel?.unit.username}</strong>?</>}
                confirmButtonText={t("common.confirm")}
                confirmButtonVariant="error"
                cancelButtonText={t("common.cancel")}
            />
            <CaseDetailsModal
                isOpen={showCaseDetailsModal}
                onClose={() => setShowCaseDetailsModal(false)}
                caseData={caseState}
            />
            {/* Assign / remove requested from the map. Rendered here, not inside
                the map: the map container is overflow-hidden and would clip a
                dialog, and the app already has a dialog stack to respect. */}
            <ConfirmationModal
                isOpen={mapStaffAction !== null}
                onClose={() => setMapStaffAction(null)}
                onConfirm={handleConfirmMapStaffAction}
                title={mapStaffAction?.action === "cancel"
                    ? t("case.display.map_staff_cancel_confirm_title")
                    : t("case.display.map_staff_assign_confirm_title")}
                description={t(
                    mapStaffAction?.action === "cancel"
                        ? "case.display.map_staff_cancel_confirm_message"
                        : "case.display.map_staff_assign_confirm_message",
                    {
                        name: mapStaffAction?.unitName ?? "",
                        caseId: caseState?.workOrderNummber ?? initialCaseData?.caseId ?? ""
                    }
                )}
                confirmButtonText={t("common.confirm")}
                confirmButtonVariant={mapStaffAction?.action === "cancel" ? "error" : "primary"}
                cancelButtonText={t("common.cancel")}
            />
            <ConfirmationModal
                isOpen={showCancelCaseModal}
                onClose={() => setShowCancelCaseModal(false)}
                onConfirm={handleConfirmCancelCase}
                title={t("case.display.cancel_case_title")}
                description={t("case.display.cancel_case_detail")}
                confirmButtonText={t("common.confirm")}
                confirmButtonVariant="error"
                cancelButtonText={t("common.cancel")}
            />
            <ConfirmationModal
                isOpen={showCloseCaseModal}
                onClose={() => setShowCloseCaseModal(false)}
                onConfirm={handleOnChickCloseButton}
                title={t("case.display.close_case_title")}
                description={t("case.display.close_case_detail")}
                confirmButtonText={t("common.confirm")}
                confirmButtonVariant="outline"
                cancelButtonText={t("common.cancel")}
            />

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}