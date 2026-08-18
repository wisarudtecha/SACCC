"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { FileText } from "lucide-react"
import Button from "@/core/components/ui/button/Button"
import { FormFieldWithNode } from "@/cms/components/interface/FormField"
import { getLocalISOString, TodayDate } from "../../date/DateToString"
import { CaseTypeSubType } from "../../interface/CaseType"
import type { Custommer } from "@/cms/types";
import PreviewDataBeforeSubmit from "../PreviewCaseData"
import { Customer } from "@/cms/store/api/custommerApi"
import { CreateCase, usePatchUpdateCaseMutation, usePostCreateCaseMutation } from "@/cms/store/api/caseApi"
import { mergeCaseTypeAndSubType } from "../../caseTypeSubType/mergeCaseTypeAndSubType"
import { findCaseTypeSubTypeByTypeIdSubTypeId } from "../../caseTypeSubType/findCaseTypeSubTypeByMergeName"
import { CaseDetails, CaseEntity, FileItem } from "@/cms/types/case"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "@/core/hooks/useTranslation";
import { exampleCaseState } from "../constants/exampleData";
import { source } from "../constants/caseConstants";
import { validateCaseForDraft, validateCaseForSubmission } from "../caseDataValidation/caseDataValidation";
import { CaseLayout } from "./layout";
import CasePanel from "../CasePanel";
import { readCachedAreas, readCachedCaseTypeSubTypes, readCachedCustomers } from "../caseFormOptions";
import {
    CaseAreaSelect,
    CaseAttachmentsSection,
    CaseCustomerSection,
    CaseDetailsInput,
    CaseDynamicForm,
    CaseIotDeviceInput,
    CaseLocationSection,
    CasePriorityBadge,
    CaseScheduleDateInput,
    CaseTypeSelect,
    CaseWorkOrderRefInput,
    useCaseTypeForm,
} from "../formFields";
import { useToast } from "@/core/hooks/useToast";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { CaseSop } from "@/cms/types/dispatch";
import { UploadFileRes } from "@/core/types/file";
import { useDeleteFileMutationMutation, usePostUploadFileMutationMutation } from "@/core/store/api/file";
import { updateCaseInLocalStorage } from "../caseLocalStorage.tsx/caseListUpdate";
import { handleFileChanges, uploadFileToServer } from "./createCaseFunction";
// const commonInputCss = "appearance-none border !border-1 rounded  text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:text-gray-300 dark:border-gray-800 dark:bg-gray-900 disabled:text-gray-500 disabled:border-gray-300 disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-400 dark:disabled:border-gray-700"







export default function CaseDetailViewSchedule({ onBack, caseData, disablePageMeta = false, isSubCase = false, isCreate = true }: { onBack?: () => void, caseData?: CaseEntity, disablePageMeta?: boolean, isSubCase?: boolean, isCreate?: boolean, isScheduleDate?: boolean }) {
    const navigate = useNavigate()
    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            navigate('/cms/case/assignment');
        }
    }, [onBack, navigate]);
    const { caseId: paramCaseId } = useParams<{ caseId: string }>();
    const [postUploadFile] = usePostUploadFileMutationMutation();
    const [updateCase] = usePatchUpdateCaseMutation();
    const [delFileApi] = useDeleteFileMutationMutation();
    const [originalFiles, setOriginalFiles] = useState<FileItem[]>([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialCaseData: CaseEntity | undefined = caseData || (paramCaseId ? { caseId: paramCaseId } as CaseEntity : undefined);
    const [caseState, setCaseState] = useState<CaseDetails | undefined>(() => {
        if (!initialCaseData) {
            return {
                location: "",
                date: "",
                caseType: undefined,
                priority: 0,
                description: "",
                area: undefined,
                status: "",
                scheduleDate: "",
                customerData: {} as Custommer,
                attachFile: [] as File[],
                attachFileResult: [] as File[],
                source: { id: "06", name: "OTHER" },
            } as CaseDetails;
        }
        return undefined;
    });
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    // const [isValueFill, setIsValueFill] = useState({ getType: false, dynamicForm: false });
    const [showPreviewData, setShowPreviewData] = useState(false);
    const [sopLocal] = useState<CaseSop>();
    const [listCustomerData, setListCustomerData] = useState<Customer[]>([])
    const [isInitialized, setIsInitialized] = useState(false);
    const { t, language } = useTranslation();
    const { toasts, addToast, removeToast } = useToast();

    const caseTypeSupTypeData = useMemo(() => readCachedCaseTypeSubTypes(), []);
    const areaList = useMemo(() => readCachedAreas(), []);

    const profile = useMemo(() =>
        JSON.parse(localStorage.getItem("profile") ?? "{}"), []
    );

    const [createCase] = usePostCreateCaseMutation();
    // Initialize customer data ONCE
    useEffect(() => {
        if (!isInitialized) {
            setListCustomerData(readCachedCustomers());
            setIsInitialized(true);
        }
    }, [isInitialized]);

    const updateCaseState = useCallback((updates: Partial<CaseDetails>) => {
        setCaseState(prev => prev ? { ...prev, ...updates } : prev);
    }, []);

    const {
        selectedCaseTypeForm,
        isFormLoading,
        caseTypeOptions,
        selectedPriority,
        handleCaseTypeChange,
        handleFormFieldChange,
    } = useCaseTypeForm({
        caseState: caseState ?? {} as CaseDetails,
        onCaseChange: updateCaseState,
        caseTypeSubTypeList: caseTypeSupTypeData,
        autoFetchForm: true,
        updateOnSameType: isCreate,
    });

    useEffect(() => {
        if (initialCaseData && sopLocal && areaList.length > 0 && !caseState && caseTypeSupTypeData.length > 0) {
            const utcTimestamp: string | undefined = sopLocal?.createdAt;
            const area = areaList.find((items) =>
                sopLocal.provId === items.provId &&
                sopLocal.distId === items.distId &&
                sopLocal.countryId === items.countryId
            );

            const initialCaseTypeData = findCaseTypeSubTypeByTypeIdSubTypeId(
                caseTypeSupTypeData,
                sopLocal.caseTypeId,
                sopLocal.caseSTypeId
            ) ?? {} as CaseTypeSubType;

            const initialMergedCaseType = mergeCaseTypeAndSubType(initialCaseTypeData, language);
            const newCaseState: CaseDetails = {
                location: sopLocal?.caseLocAddr || "",
                date: utcTimestamp ? getLocalISOString(utcTimestamp) : "",
                caseType: {
                    ...initialCaseTypeData,
                    caseType: initialMergedCaseType,
                    formField: sopLocal?.formAnswer || {} as FormFieldWithNode,
                },
                priority: sopLocal?.priority || 0,
                description: sopLocal?.caseDetail || "",
                workOrderNummber: sopLocal?.caseId || "",
                workOrderRef: sopLocal?.referCaseId || "",
                iotDevice: sopLocal?.deviceId || "",
                iotDate: sopLocal?.startedDate || "",
                area: area,
                status: sopLocal?.statusId || "",
                attachFile: [] as File[], // For new cases (edit mode)
                attachFileResult: [] as File[],
            } as CaseDetails;

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
    }, [sopLocal, initialCaseData, areaList.length, caseTypeSupTypeData, isSubCase]);




    useEffect(() => {
        if (listCustomerData.length > 0) {
            const result = listCustomerData.find(items => items.mobileNo === initialCaseData?.phoneNo)
            const customerData = result ? {
                ...result,
                name: `${result.firstName} ${result.lastName}`,
                contractMethod: {
                    id: "06",
                    name: source.find((items) => items.id === "06")?.name || ""
                }
            } as Custommer : {
                mobileNo: profile.mobileNo,
            } as Custommer;
            setCaseState(prev => prev ? {
                ...prev,
                customerData: customerData,
                status: prev.status || "",
            } as CaseDetails : prev);
        }
        setCaseState(prev => prev ? {
            ...prev,
            status: prev.status || "",
        } as CaseDetails : prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listCustomerData.length, sopLocal, initialCaseData?.phoneNo]);




    const createCaseAction = useCallback(async (action: "draft" | "submit") => {
        if (!caseState) return false;
        const isDraft = action === "draft";
        const caseVersion = action === "draft" ? "draft" : "publish";
        const statusId = action === "draft" ? "S000" : "S001";
        const createJson = {
            formData: caseState?.caseType?.formField,
            customerName: caseState?.customerData?.name,
            caseDetail: caseState?.description || "",
            caseDuration: 0,
            caseLat: caseState?.caseLat || "",
            caseSla: caseState?.caseType?.caseSla || "",
            caseLon: caseState?.caseLon || "",
            caseSTypeId: caseState?.caseType?.sTypeId || "",
            caseTypeId: caseState?.caseType?.typeId || "",
            caseVersion: caseVersion,
            caseLocAddr: caseState?.location || "",
            caseLocAddrDecs: "",
            deviceId: caseState?.iotDevice || "",
            countryId: caseState?.area?.countryId || "",
            distId: caseState?.area?.distId || "",
            extReceive: "",
            phoneNoHide: true,
            phoneNo: caseState?.customerData?.mobileNo || "",
            priority: caseState?.caseType?.priority || 0,
            provId: caseState?.area?.provId || "",
            referCaseId: caseState?.workOrderRef || "",
            resDetail: "",
            source: "06",
            createdDate: new Date(TodayDate()).toISOString(),
            // startedDate: new Date(caseState?.iotDate ?? TodayDate()).toISOString(),
            statusId: statusId,
            userarrive: "",
            userclose: "",
            caseId: caseState.workOrderNummber,
            usercommand: caseState?.serviceCenter?.commandTh || "",
            usercreate: profile?.username || "",
            userreceive: "",
            startedDate: new Date(TodayDate()).toISOString(),
            nodeId: caseState?.caseType?.formField?.nextNodeId || "",
            wfId: caseState?.caseType?.wfId || "",
            versions: caseState?.caseType?.formField?.versions || "",
            scheduleFlag: true,
            scheduleDate: caseState?.scheduleDate
                ? new Date(caseState.scheduleDate + "Z").toISOString()
                : undefined,

        } as CreateCase;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let data: any;

            if (!caseState.workOrderNummber) {

                // Step 1: Create case first (without files)
                data = await createCase({
                    ...createJson,
                    attachments: []
                }).unwrap();

                if (data?.msg !== "Success") {
                    throw new Error(data?.desc || "Failed to create case");
                }

                const newCaseId = data.caseId;

                // Step 2: Upload files with the new case ID
                let uploadedAttachments: UploadFileRes[] = [];

                if (caseState.attachFile && caseState.attachFile.length > 0) {
                    const newFiles = caseState.attachFile.filter(
                        (item): item is File => item instanceof File
                    );

                    if (newFiles.length > 0) {
                        console.log(`📤 Uploading ${newFiles.length} file(s)...`);
                        uploadedAttachments = await uploadFileToServer(newFiles, postUploadFile, newCaseId);

                        if (uploadedAttachments.length !== newFiles.length) {
                            addToast("warning", t("case.display.toast.partial_upload"));
                        }
                    }
                }

                // Step 3: Update state with case ID and convert uploaded files to attachments
                const attachmentFiles: FileItem[] = uploadedAttachments.map(file => file as FileItem);

                setCaseState(prev =>
                    prev ? {
                        ...prev,
                        workOrderNummber: newCaseId,
                        status: statusId,
                        attachFile: attachmentFiles
                    } : prev
                );

                setOriginalFiles(attachmentFiles);
                console.log(`📎 Tracking ${attachmentFiles.length} attachments`);

                // const newCase = {
                //     ...(casePayload as object),
                //     caseId: newCaseId,
                //     createdAt: TodayDate(),
                //     createdBy: profile?.username || ""
                // } as CaseEntity;
                // insertCaseToLocalStorage(newCase);

            } else {
                // ===== UPDATE EXISTING CASE =====
                console.log(`📝 Updating case: ${caseState.workOrderNummber}`);
                console.log(`Current files: ${caseState.attachFile?.length || 0}`);
                console.log(`Original files: ${originalFiles.length}`);

                // Step 1: Handle file changes (DELETE FROM SERVER & UPLOAD NEW)
                const fileChanges = await handleFileChanges(
                    caseState.attachFile || [],
                    originalFiles,
                    caseState.workOrderNummber,
                    delFileApi
                );

                if (fileChanges.errors.length > 0) {
                    console.warn("⚠️ File operation errors:", fileChanges.errors);
                    addToast("warning", `File issues: ${fileChanges.errors.join(", ")}`);
                }

                // Step 2: Prepare updated attachments list
                const newAttachments: FileItem[] = fileChanges.uploaded.map(file => file as FileItem);
                const updatedAttachments = [
                    ...fileChanges.remainingAttachments,
                    ...newAttachments
                ];

                console.log(`📎 Total attachments after changes: ${updatedAttachments.length}`);

                // Step 3: Update case with new attachment list
                const updateResult = await updateCase({
                    caseId: caseState.workOrderNummber,
                    updateCase: {
                        ...createJson,
                        attachments: updatedAttachments as UploadFileRes[]
                    },
                }).unwrap();

                console.log(`✅ Case updated successfully`);
                console.log('Update result:', updateResult);

                updateCaseInLocalStorage(createJson, caseState.workOrderNummber, profile);

                // Step 4: Update tracking
                setOriginalFiles(updatedAttachments);

                // Step 5: Update state
                setCaseState(prev =>
                    prev ? {
                        ...prev,
                        attachFile: updatedAttachments,
                        status: isDraft ? "S000" : "S001"
                    } : prev
                );
            }

            // Navigate if submitting
            if (!isDraft) {
                navigate(`/cms/case/${caseState.workOrderNummber || data?.caseId}`);
            }

            addToast(
                "success",
                isDraft
                    ? t("case.display.toast.savedaft_success")
                    : t("case.display.toast.add_case_success")
            );
            setShowPreviewData(false);

            return true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("❌ Save case error:", error);
            addToast(
                "error",
                isDraft
                    ? t("case.display.toast.savedaft_fail")
                    : t("case.display.toast.add_case_fail")
            );
            setShowPreviewData(false);
            return false;
        }
        return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseState, profile, createCase, navigate]);



    const handleCreateCase = useCallback(async () => {
        const isNotError = await createCaseAction("submit");
        if (isNotError === false) {
            setShowPreviewData(false)
            return
        }
    }, [createCaseAction]);

    const handlePreviewShow = useCallback(() => {
        const errorMessage = validateCaseForSubmission(caseState);
        if (errorMessage) {
            addToast("error", errorMessage);
            return;
        }
        setShowPreviewData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validateCaseForSubmission, caseState]);


    const handleSaveDrafts = useCallback(async () => {
        setShowPreviewData(false)
        const errorMessage = validateCaseForDraft(caseState);

        if (errorMessage) {
            addToast("error", errorMessage);
            return;
        }
        const isNotError = await createCaseAction("draft");
        if (isNotError === false) {
            return
        }
        localStorage.setItem("Create Case", JSON.stringify(caseState));
        addToast("success", t("case.display.toast.savedaft_success"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validateCaseForDraft, createCaseAction, caseState]);



    useEffect(() => {
        if (!caseState?.workOrderDate && !initialCaseData) {
            updateCaseState({ workOrderDate: TodayDate() });
        }
    }, [caseState?.workOrderDate, initialCaseData, updateCaseState]);

    const handleExampleData = () => {
        setCaseState(exampleCaseState as CaseDetails)
    }

    return (
        <CaseLayout
            disablePageMeta={disablePageMeta}
            onBack={handleBack}
            isPanelOpen={isPanelOpen}
            onPanelClose={() => setIsPanelOpen(false)}
            onPanelOpen={() => setIsPanelOpen(true)}
            t={t}
            // title={isCreate ? "Create Case" : "Case Detail"}
            panel={
                <CasePanel
                    onClose={() => setIsPanelOpen(false)}
                    deviceMetaData={caseState?.deviceMetaData}
                    caseWorkOrderNumber={caseState?.workOrderNummber}
                    customerNumber={caseState?.customerData?.mobileNo}
                    customerId={caseState?.customerData?.id}
                    referCaseList={sopLocal?.referCaseLists}
                    hideCustomerLinkActions
                    isCreate={isCreate}
                />
            }
        >
            {caseState && (
                <>
                    {/* Priority Section */}
                    {selectedCaseTypeForm && <CasePriorityBadge priority={selectedPriority} />}

                    <CaseScheduleDateInput caseState={caseState} onCaseChange={updateCaseState} />

                    {/* Case Type + IoT device, then the type's dynamic form */}
                    <div className="grid-cols-2 xl:grid">
                        <CaseTypeSelect
                            value={caseState?.caseType?.caseType ?? ""}
                            options={caseTypeOptions}
                            onChange={handleCaseTypeChange}
                            disabled={!!caseState.workOrderNummber}
                        />
                        <CaseIotDeviceInput caseState={caseState} onCaseChange={updateCaseState} />
                    </div>
                    <CaseDynamicForm
                        form={selectedCaseTypeForm?.formField}
                        isLoading={isFormLoading}
                        onFormChange={handleFormFieldChange}
                    />

                    <div className="xl:grid grid-cols-2">
                        {initialCaseData?.referCaseId && <CaseWorkOrderRefInput caseState={caseState} />}
                    </div>

                    {/* Case Details */}
                    <CaseDetailsInput
                        caseState={caseState}
                        onCaseChange={updateCaseState}
                        className="pr-7 mb-1"
                    />

                    {/* Service Center, Customer and Location */}
                    <div className="xl:grid grid-cols-2">
                        <CaseAreaSelect
                            caseState={caseState}
                            onCaseChange={updateCaseState}
                            areaList={areaList}
                            required={false}
                            className="2xsm:m-3 sm:w-full"
                        />
                        <CaseCustomerSection
                            caseState={caseState}
                            onCaseChange={updateCaseState}
                            listCustomerData={listCustomerData}
                            hidePhone
                        />
                        <CaseLocationSection
                            caseState={caseState}
                            onCaseChange={updateCaseState}
                            showMap={false}
                            className="pr-6 col-span-2"
                        />
                    </div>

                    <CaseAttachmentsSection caseState={caseState} onCaseChange={updateCaseState} />

                    <div className="flex justify-between items-center m-3">
                        <div>
                            <Button onClick={handleExampleData} variant="outline-no-transparent" size="sm">
                                <FileText className=" h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex">
                            <Button variant="outline-no-transparent" onClick={handleSaveDrafts} className="mx-3">
                                {t("case.display.save_as_draft")}
                            </Button>
                            <Button onClick={handlePreviewShow}>
                                {t("case.display.submit")}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <PreviewDataBeforeSubmit
                caseData={caseState}
                submitButton={handleCreateCase}
                isOpen={showPreviewData}
                onClose={() => setShowPreviewData(false)}
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </CaseLayout>
    );
}
