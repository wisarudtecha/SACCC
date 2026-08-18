import { memo, useEffect, useMemo } from "react";
import { Area } from "@/cms/store/api/area";
import { Customer } from "@/cms/store/api/custommerApi";
import { CaseDetails, CaseTypeSubType } from "@/cms/types/case";
import { TodayLocalDate } from "@/cms/components/date/DateToString";
import { readCachedAreas, readCachedCaseTypeSubTypes, readCachedCustomers } from "./caseFormOptions";
import {
    CaseAreaSelect,
    CaseAttachmentsSection,
    CaseCustomerSection,
    CaseDetailsInput,
    CaseDynamicForm,
    CaseIotDateInput,
    CaseIotDeviceInput,
    CaseLocationSection,
    CasePriorityBadge,
    CaseSourceSelect,
    CaseTypeSelect,
    CaseWorkOrderRefInput,
    capabilitiesForMode,
    useCaseTypeForm,
} from "./formFields";
import type { CaseFormCapabilities } from "./formFields";

interface CaseFormFieldsProps {
    caseState: CaseDetails;
    /**
     * The component's only write path. It hands back a patch and lets the caller
     * decide how the case is stored (useState, Redux, a form library, ...), so the
     * form is no longer tied to a `useState<CaseDetails | undefined>` setter.
     */
    onCaseChange: (updates: Partial<CaseDetails>) => void;
    /** Preset for the capabilities below. */
    isCreate: boolean;
    /** Override individual capabilities on top of the `isCreate` preset. */
    capabilities?: Partial<CaseFormCapabilities>;
    /** Reference data. Defaults to the localStorage caches when not supplied. */
    listCustomerData?: Customer[];
    caseTypeSubTypeList?: CaseTypeSubType[];
    areaList?: Area[];
}

/**
 * The standard case form: every field the create and edit screens share, in the
 * order they expect. Screens needing a different field set should compose the
 * sections in `./formFields` directly rather than adding flags here.
 */
export const CaseFormFields = memo<CaseFormFieldsProps>(({
    caseState,
    onCaseChange,
    isCreate,
    capabilities,
    listCustomerData,
    caseTypeSubTypeList,
    areaList: areaListProp,
}) => {
    const caseTypeSupTypeData = useMemo(() =>
        caseTypeSubTypeList ?? readCachedCaseTypeSubTypes(), [caseTypeSubTypeList]
    );
    const areaList = useMemo(() =>
        areaListProp ?? readCachedAreas(), [areaListProp]
    );
    const customerList = useMemo(() =>
        listCustomerData ?? readCachedCustomers(), [listCustomerData]
    );

    const {
        lockCaseType,
        lockArea,
        showAttachments,
        autoFetchTypeForm,
        defaultIotDate,
    } = { ...capabilitiesForMode(isCreate), ...capabilities };

    const {
        selectedCaseTypeForm,
        isFormLoading,
        caseTypeOptions,
        selectedPriority,
        handleCaseTypeChange,
        handleFormFieldChange,
    } = useCaseTypeForm({
        caseState,
        onCaseChange,
        caseTypeSubTypeList: caseTypeSupTypeData,
        autoFetchForm: autoFetchTypeForm,
        updateOnSameType: isCreate,
    });

    useEffect(() => {
        if (defaultIotDate && caseState && !caseState.iotDate) {
            onCaseChange({ iotDate: TodayLocalDate() });
        }
    }, [defaultIotDate, caseState, onCaseChange]);

    return (
        <>
            {/* Priority Section */}
            {selectedCaseTypeForm && <CasePriorityBadge priority={selectedPriority} />}

            {/* Case Type + Contact Method, then the type's dynamic form */}
            <div className="grid-cols-2 xl:grid">
                <CaseTypeSelect
                    value={caseState?.caseType?.caseType ?? ""}
                    options={caseTypeOptions}
                    onChange={handleCaseTypeChange}
                    disabled={lockCaseType || !!caseState.workOrderNummber}
                />
                <CaseSourceSelect caseState={caseState} onCaseChange={onCaseChange} />
            </div>
            <CaseDynamicForm
                form={selectedCaseTypeForm?.formField}
                isLoading={isFormLoading}
                onFormChange={handleFormFieldChange}
            />

            {/* IoT Device and Alert Date */}
            <div className="xl:grid grid-cols-2">
                {caseState?.workOrderRef && <CaseWorkOrderRefInput caseState={caseState} />}
                <CaseIotDeviceInput caseState={caseState} onCaseChange={onCaseChange} />
                <CaseIotDateInput caseState={caseState} onCaseChange={onCaseChange} />
            </div>

            {/* Case Details */}
            <CaseDetailsInput caseState={caseState} onCaseChange={onCaseChange} />

            {/* Service Center, Customer and Location */}
            <div className="xl:grid grid-cols-2">
                <CaseAreaSelect
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    areaList={areaList}
                    disabled={lockArea}
                />
                <CaseCustomerSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    listCustomerData={customerList}
                />
                <CaseLocationSection caseState={caseState} onCaseChange={onCaseChange} />
            </div>

            {/* File Upload for new cases */}
            {showAttachments && (
                <CaseAttachmentsSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    caseId={caseState.workOrderNummber}
                />
            )}
        </>
    );
});

CaseFormFields.displayName = 'CaseFormFields';
