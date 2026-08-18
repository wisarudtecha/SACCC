import { CaseDetails, FileItem } from "@/cms/types/case";
import { memo, useCallback, useState } from "react";
import { CaseFormFields } from "../caseFormFields";
import { Customer, useLazyGetCustommerByPhoneNoQuery } from "@/cms/store/api/custommerApi";
import Button from "@/core/components/ui/button/Button";
import { ArrowLeft, FileText } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CreateCase, usePatchUpdateCaseMutation, usePostCreateCaseMutation } from "@/cms/store/api/caseApi";
import { useNavigate } from "react-router-dom";
import PreviewDataBeforeSubmit from "../PreviewCaseData";
import { TodayDate, TodayLocalDate } from "@/cms/components/date/DateToString";
import { exampleCaseState } from "../constants/exampleData";
import { validateCaseForDraft, validateCaseForSubmission } from "../caseDataValidation/caseDataValidation";
import { updateCaseInLocalStorage } from "../caseLocalStorage.tsx/caseListUpdate";
import { TranslationParams } from "@/core/types/i18n";
import { CaseLayout } from "./layout";
import CasePanel from "../CasePanel";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { UploadFileRes } from "@/core/types/file";
import { useDeleteFileMutationMutation, usePostUploadFileMutationMutation } from "@/core/store/api/file";
import { handleFileChanges, uploadFileToServer } from "./createCaseFunction";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";

const CaseHeader = memo(({ disablePageMeta, onBack, onOpenCustomerPanel, t }: {
    disablePageMeta?: boolean;
    onBack?: () => void;
    onOpenCustomerPanel: () => void;
    isCreate: boolean;
    t: (key: string, params?: TranslationParams | undefined) => string;
}) => (
    <div className="shrink-0">
        {/* {!disablePageMeta && <PageBreadcrumb pageTitle={isCreate ? "Create Case" : "Case"} />} */}
        <div className="">
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
                <div className="xl:hidden">
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
));
CaseHeader.displayName = 'CaseHeader';

export default function CaseCreation() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [createCase] = usePostCreateCaseMutation();
    const [updateCase] = usePatchUpdateCaseMutation();
    const [getCustomerByPhone] = useLazyGetCustommerByPhoneNoQuery();
    const profile = JSON.parse(localStorage.getItem("profile") ?? "{}");
    const { addToast } = useToastContext();
    const [caseState, setCaseState] = useState<CaseDetails | undefined>({
        location: "",
        date: "",
        caseType: undefined,
        priority: 0,
        description: "",
        area: undefined,
        status: "",
        iotDate: TodayLocalDate(),
        scheduleDate: "",
        customerData: {} as Customer,
        attachFile: [] as FileItem[], // Changed to FileItem[]
        attachFileResult: [] as File[]
    } as CaseDetails);
    /**
     * Only sweep the social index once this case actually has an identity to resolve.
     *
     * Reading one customer's channels means scanning the whole collection (the list
     * endpoint takes no filters), so mounting this unconditionally would put a multi-page
     * fetch on every open of the create-case screen for the benefit of the minority of
     * cases that arrive on a social channel.
     */
    const { lookupIdentity } = useCustomerSocials({
        enabled: Boolean(caseState?.socialIdentity?.socialId),
    });

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showPreviewData, setShowPreviewData] = useState(false);
    const [postUploadFile] = usePostUploadFileMutationMutation();
    const [originalFiles, setOriginalFiles] = useState<FileItem[]>([]);
    const [delFileApi] = useDeleteFileMutationMutation();

    const updateCaseState = useCallback((updates: Partial<CaseDetails>) => {
        setCaseState(prev => prev ? { ...prev, ...updates } : prev);
    }, []);





    const saveCase = useCallback(
        async (action: "draft" | "submit") => {
            if (!caseState) return false;

            const isDraft = action === "draft";
            const statusId = isDraft ? "S000" : "S001";
            const caseVersion = isDraft ? "draft" : "publish";
            const todayDate = new Date(TodayDate()).toISOString();

            let customerId = caseState?.customerData?.id || null;

            // Only fall back to a phone-number lookup when no customer has been resolved yet
            // (e.g. via "Link existing customer" / "Add new customer") - otherwise a phone
            // number that legitimately belongs to someone else must not clear the linked customer.
            if (!customerId && caseState?.customerData?.mobileNo) {
                try {
                    const custRes = await getCustomerByPhone({
                        id: caseState.customerData.mobileNo
                        // phoneNo: caseState.customerData.mobileNo
                    }).unwrap();
                    if (custRes?.data?.id) {
                        customerId = custRes.data.id;
                    }
                } catch (error) {
                    console.warn("Failed to fetch customer by phone:", error);
                }
            }

            // A case that arrived over LINE/Facebook/Text Chat usually has no phone number at
            // all, so the lookup above cannot help it. Resolve through the social identity
            // instead - if that account is already linked, it names its owner directly.
            //
            // "taken" is the only state acted on. An index that is still sweeping, or that
            // stopped short, cannot distinguish "nobody owns this" from "not seen yet", and
            // guessing wrong here would file the case against the wrong person.
            if (!customerId && caseState?.socialIdentity?.socialId) {
                const match = lookupIdentity(
                    caseState.socialIdentity.socialType,
                    caseState.socialIdentity.socialId
                );
                if (match.state === "taken") {
                    customerId = String(match.social.custId);
                }
            }

            const casePayload: CreateCase = {
                formData: caseState?.caseType?.formField,
                // customerName: caseState?.customerData?.name,
                customerId: customerId ? parseInt(customerId, 10) : null,
                caseDetail: caseState?.description || "",
                caseDuration: 0,
                caseId: caseState.workOrderNummber,
                caseSTypeId: caseState?.caseType?.sTypeId || "",
                caseTypeId: caseState?.caseType?.typeId || "",
                caseVersion,
                caseLocAddr: caseState?.location || "",
                caseLat: caseState?.caseLat || "",
                caseLon: caseState?.caseLon || "",
                caseLocAddrDecs: "",
                countryId: caseState?.area?.countryId || "",
                createdDate: todayDate,
                distId: caseState?.area?.distId || "",
                deviceId: caseState?.iotDevice,
                extReceive: "",
                phoneNoHide: true,
                phoneNo: caseState?.customerData?.mobileNo || "",
                priority: caseState?.caseType?.priority || 0,
                provId: caseState?.area?.provId || "",
                referCaseId: caseState?.workOrderRef || "",
                resDetail: "",
                source: caseState?.source?.id || "",
                startedDate: caseState?.iotDate ? new Date(caseState?.iotDate).toISOString() : todayDate,
                statusId,
                userarrive: "",
                userclose: "",
                usercommand: caseState?.serviceCenter?.commandTh || "",
                usercreate: profile?.username || "",
                userreceive: "",
                nodeId: caseState?.caseType?.formField?.nextNodeId || "",
                wfId: caseState?.caseType?.wfId || "",
                versions: caseState?.caseType?.formField?.versions || "",
                deptId: caseState?.serviceCenter?.deptId,
                commId: caseState?.serviceCenter?.commId,
                stnId: caseState?.serviceCenter?.stnId,
                caseSla: caseState?.caseType?.caseSla,
                scheduleFlag: false,
            } as CreateCase;

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let data: any;

                if (!caseState.workOrderNummber) {

                    data = await createCase({
                        ...casePayload,
                        attachments: []
                    }).unwrap();

                    if (data?.msg !== "Success") {
                        throw new Error(data?.desc || "Failed to create case");
                    }

                    const newCaseId = data.caseId;
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

                    // const newCase = {
                    //     ...(casePayload as object),
                    //     caseId: newCaseId,
                    //     createdAt: TodayDate(),
                    //     createdBy: profile?.username || ""
                    // } as CaseEntity;
                    // insertCaseToLocalStorage(newCase);

                } else {

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

                    const newAttachments: FileItem[] = fileChanges.uploaded.map(file => file as FileItem);
                    const updatedAttachments = [
                        ...fileChanges.remainingAttachments,
                        ...newAttachments
                    ];



                    await updateCase({
                        caseId: caseState.workOrderNummber,
                        updateCase: {
                            ...casePayload,
                            attachments: updatedAttachments as UploadFileRes[]
                        },
                    }).unwrap();


                    updateCaseInLocalStorage(casePayload, caseState.workOrderNummber, profile);

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
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [caseState, originalFiles, profile, createCase, updateCase, getCustomerByPhone, lookupIdentity, navigate, handleFileChanges, addToast, t]
    );

    const handleSaveDraft = useCallback(() => {
        const errorMessage = validateCaseForDraft(caseState);
        if (errorMessage) {
            addToast("error", errorMessage);
            return;
        }
        saveCase("draft");
    }, [caseState, saveCase, addToast]);

    const handleCreateCase = useCallback(() => {
        const errorMessage = validateCaseForSubmission(caseState);
        if (errorMessage) {
            addToast("error", errorMessage);
            return;
        }
        saveCase("submit");
    }, [caseState, saveCase, addToast]);

    const handlePreviewShow = useCallback(() => {
        const errorMessage = validateCaseForSubmission(caseState);
        if (errorMessage) {
            addToast("error", errorMessage);
            return;
        }
        setShowPreviewData(true);
    }, [caseState, addToast]);

    const handleExampleData = () => {
        setCaseState(exampleCaseState as CaseDetails);
    };

    return (
        <CaseLayout
            disablePageMeta={false}
            onBack={() => navigate(-1)}
            isPanelOpen={isPanelOpen}
            onPanelClose={() => setIsPanelOpen(false)}
            onPanelOpen={() => setIsPanelOpen(true)}
            t={t}
            panel={
                <CasePanel
                    onClose={() => setIsPanelOpen(false)}
                    deviceMetaData={caseState?.deviceMetaData}
                    caseWorkOrderNumber={caseState?.workOrderNummber}
                    customerNumber={caseState?.customerData?.mobileNo}
                    customerId={caseState?.customerData?.id}
                    referCaseList={[]}
                    setCaseState={setCaseState}
                    isCreate={true}
                />
            }
        >
            <CaseFormFields
                caseState={caseState || {} as CaseDetails}
                onCaseChange={updateCaseState}
                isCreate={true}
            />

            <div className="flex justify-between items-center m-3 w-full">
                <div>
                    <Button variant="outline-no-transparent" onClick={handleExampleData} size="sm">
                        <FileText className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex px-6">
                    <Button variant="outline-no-transparent" onClick={handleSaveDraft} className="mx-3">
                        {t("case.display.save_as_draft")}
                    </Button>
                    <Button onClick={handlePreviewShow}>
                        {t("case.display.submit")}
                    </Button>
                </div>
            </div>

            <PreviewDataBeforeSubmit
                caseData={caseState}
                submitButton={handleCreateCase}
                isOpen={showPreviewData}
                onClose={() => setShowPreviewData(false)}
            />
        </CaseLayout>
    );
}