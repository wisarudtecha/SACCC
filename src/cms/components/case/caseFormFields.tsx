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
    useServiceCenterMatch,
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
        autoLockedArea,
        showAttachments,
        autoFetchTypeForm,
        defaultIotDate,
    } = { ...capabilitiesForMode(isCreate), ...capabilities };

    // The incident coordinate the map has resolved, if any. Same parse the map
    // field does - kept here too so the Service Center match can react to it.
    const incidentCoord = useMemo(() => {
        const lat = parseFloat(caseState?.caseLat ?? "");
        const lon = parseFloat(caseState?.caseLon ?? "");
        return Number.isFinite(lat) && Number.isFinite(lon)
            ? { latitude: lat, longitude: lon }
            : null;
    }, [caseState?.caseLat, caseState?.caseLon]);

    // Test the incident point against the org's Service Center (district)
    // polygons. Only runs where the field is create-time editable: an
    // edit-after-create screen already locks it (lockArea) and is left alone.
    const serviceCenterMatch = useServiceCenterMatch({
        incident: incidentCoord,
        areaList,
        enabled: !lockArea,
    });

    // On a single unambiguous match, adopt that Service Center and lock the
    // field for the rest of the create flow. Zero or multiple matches leave the
    // field manually selectable and hand the map a radius circle instead.
    const isAreaAutoLocked = autoLockedArea || serviceCenterMatch.status === "matched";

    useEffect(() => {
        const matched = serviceCenterMatch.matchedArea;
        if (matched && caseState?.area?.id !== matched.id) {
            onCaseChange({ area: matched });
        }
    }, [serviceCenterMatch.matchedArea, caseState?.area?.id, onCaseChange]);

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
                    disabled={lockArea || isAreaAutoLocked}
                    autoLocked={isAreaAutoLocked && !lockArea}
                />
                <CaseCustomerSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    listCustomerData={customerList}
                />
                <CaseLocationSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    incidentRadius={serviceCenterMatch.incidentRadius}
                />
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
