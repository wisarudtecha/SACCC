import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthorizedDistrictIds } from "@/core/hooks/useAuthorizedDistrictIds";
import { Area } from "@/cms/store/api/area";
import { Customer } from "@/cms/store/api/custommerApi";
import { CaseDetails, CaseTypeSubType } from "@/cms/types/case";
import { TodayLocalDate } from "@/cms/components/date/DateToString";
import { readCachedAreas, readCachedCaseTypeSubTypes, readCachedCustomers } from "./caseFormOptions";
import { buildDistrictBoundaryCode } from "./createCase/map/boundaries/boundaryLevels";
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
    ServiceCenterRetryButton,
    useCaseTypeForm,
    useResolveServiceCenter,
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

    // Whether the dispatcher has actually moved the pin since the form opened.
    // On create it is always "moved" (there is no prior area to protect). On
    // edit, a case opens with a saved incident coordinate already in place; the
    // match still locks the field to its current verdict, but the stored
    // Service Center is only rewritten once the pin genuinely changes - a saved
    // pin sitting just inside a neighbouring district (boundary imprecision)
    // must not silently reassign the case on mount.
    const incidentKey = incidentCoord
        ? `${incidentCoord.latitude},${incidentCoord.longitude}`
        : null;
    const initialIncidentKeyRef = useRef(incidentKey);
    const pinMoved = isCreate || initialIncidentKeyRef.current !== incidentKey;

    // Test the incident point against the org's Service Center (district)
    // polygons. Runs on create and on edit (both leave lockArea false); a screen
    // that hard-locks the field via capabilities passes lockArea true to skip it.
    const serviceCenterMatch = useServiceCenterMatch({
        incident: incidentCoord,
        areaList,
        enabled: !lockArea,
    });

    // REQ 2: when the polygon match comes back `no-match`, "Try Again" asks the
    // (stubbed) backend to pick a Service Center instead. Tracked separately
    // from serviceCenterMatch so a successful backend resolution locks the
    // field the same way a polygon match does, and resets once the pin moves
    // again - a fresh incident gets its own resolution, not the last one's.
    const [backendResolvedAreaId, setBackendResolvedAreaId] = useState<string | null>(null);
    useEffect(() => {
        setBackendResolvedAreaId(null);
    }, [incidentKey]);
    const handleBackendResolved = useCallback((resolved: Area) => {
        setBackendResolvedAreaId(resolved.id);
        onCaseChange({ area: resolved });
    }, [onCaseChange]);
    const serviceCenterResolve = useResolveServiceCenter(areaList, handleBackendResolved);

    // On a single unambiguous match (polygon or backend fallback), adopt that
    // Service Center and lock the field. Zero or multiple polygon matches with
    // no backend resolution yet leave the field manually selectable and hand
    // the map a radius circle instead.
    const isAreaAutoLocked =
        autoLockedArea ||
        serviceCenterMatch.status === "matched" ||
        (backendResolvedAreaId !== null && caseState?.area?.id === backendResolvedAreaId);

    const showServiceCenterRetry = !lockArea && !isAreaAutoLocked && serviceCenterMatch.status === "no-match";

    // Assignment/edit-only: scope the boundary picker to the dispatcher's own
    // districts (REQ 5), and auto-show the matched Service Center's district
    // even though the map otherwise starts fully manual (REQ 4). The create
    // screen has no "area of responsibility" concept, so both stay unset there.
    const authorizedDistrictIds = useAuthorizedDistrictIds();
    const autoShowDistrictCode = !isCreate && serviceCenterMatch.matchedArea
        ? buildDistrictBoundaryCode(serviceCenterMatch.matchedArea)
        : null;

    useEffect(() => {
        const matched = serviceCenterMatch.matchedArea;
        if (matched && pinMoved && caseState?.area?.id !== matched.id) {
            onCaseChange({ area: matched });
        }
    }, [serviceCenterMatch.matchedArea, pinMoved, caseState?.area?.id, onCaseChange]);

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
                <div>
                    <CaseAreaSelect
                        caseState={caseState}
                        onCaseChange={onCaseChange}
                        areaList={areaList}
                        disabled={lockArea || isAreaAutoLocked}
                        autoLocked={isAreaAutoLocked && !lockArea}
                    />
                    {showServiceCenterRetry && (
                        <ServiceCenterRetryButton
                            status={serviceCenterResolve.status}
                            isDisabled={serviceCenterResolve.isDisabled}
                            onRetry={serviceCenterResolve.retry}
                        />
                    )}
                </div>
                <CaseCustomerSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    listCustomerData={customerList}
                />
                <CaseLocationSection
                    caseState={caseState}
                    onCaseChange={onCaseChange}
                    incidentRadius={serviceCenterMatch.incidentRadius}
                    manualOnly
                    authorizedDistrictIds={!isCreate ? authorizedDistrictIds : undefined}
                    autoShowDistrictCode={autoShowDistrictCode}
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
