import { useCallback, useEffect, useMemo, useState } from "react";
import { findCaseTypeSubType } from "@/cms/components/caseTypeSubType/findCaseTypeSubTypeByMergeName";
import { mergeCaseTypeAndSubType } from "@/cms/components/caseTypeSubType/mergeCaseTypeAndSubType";
import { FormField, formType } from "@/cms/components/interface/FormField";
import { useLazyGetTypeSubTypeQuery } from "@/cms/store/api/formApi";
import { CaseDetails, CaseTypeSubType } from "@/cms/types/case";
import { useTranslation } from "@/core/hooks/useTranslation";

interface UseCaseTypeFormArgs {
    caseState: CaseDetails;
    onCaseChange: (updates: Partial<CaseDetails>) => void;
    caseTypeSubTypeList: CaseTypeSubType[];
    /** Re-fetch the dynamic form whenever the selected case type changes. */
    autoFetchForm: boolean;
    /** Apply the case-type patch even when the same type is re-selected. */
    updateOnSameType: boolean;
}

/**
 * Owns everything case-type related: the option list, the priority of the
 * current selection, and the dynamic form fetched for it. Kept out of the field
 * components so any screen can drive its own case-type layout from one source.
 */
export const useCaseTypeForm = ({
    caseState,
    onCaseChange,
    caseTypeSubTypeList,
    autoFetchForm,
    updateOnSameType,
}: UseCaseTypeFormArgs) => {
    const { language } = useTranslation();
    const [getTypeSubType] = useLazyGetTypeSubTypeQuery();
    const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
    const [selectedCaseTypeForm, setSelectedCaseTypeForm] = useState<formType | undefined>(
        caseState?.caseType || undefined
    );

    const selectedCaseType = caseState?.caseType?.caseType ?? "";

    const caseTypeOptions = useMemo(() => {
        if (!caseTypeSubTypeList?.length) return [];
        return caseTypeSubTypeList.map(item => mergeCaseTypeAndSubType(item, language));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseTypeSubTypeList]);

    const selectedPriority = useMemo(() =>
        caseTypeSubTypeList.find(item =>
            mergeCaseTypeAndSubType(item, language) === selectedCaseType
        )?.priority ?? -1,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseTypeSubTypeList, selectedCaseType]);

    // Re-fetching keys on the selected type *and* its priority, matching the
    // behaviour the create-case form has always had.
    const caseTypeKey = useMemo(() => ({
        caseType: selectedCaseType,
        priority: caseState?.priority ?? 0
    }), [selectedCaseType, caseState?.priority]);

    const getFormByCaseType = useCallback(async () => {
        if (!selectedCaseType || !caseTypeSubTypeList.length) {
            return undefined;
        }

        const newCaseType = findCaseTypeSubType(caseTypeSubTypeList, selectedCaseType, language);

        if (!newCaseType?.sTypeId) {
            return undefined;
        }
        try {
            setIsFormLoading(true);
            const result = await getTypeSubType(caseState.caseType?.sTypeId ?? "").unwrap();
            if (result) {
                return {
                    ...newCaseType,
                    caseType: mergeCaseTypeAndSubType(newCaseType, language),
                    formField: result?.data
                } as formType;
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
        } finally {
            setIsFormLoading(false);
        }

        // Return data without formField if not found
        return {
            ...newCaseType,
            caseType: mergeCaseTypeAndSubType(newCaseType, language),
        } as formType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCaseType, caseTypeSubTypeList]);

    useEffect(() => {
        const fetchFormData = async () => {
            if (!caseState?.caseType?.sTypeId) return;

            const form = await getFormByCaseType();
            setSelectedCaseTypeForm(form);
        };
        if (autoFetchForm) {
            fetchFormData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseTypeKey]);

    const handleCaseTypeChange = useCallback((newValue: string) => {
        const newCaseType = findCaseTypeSubType(caseTypeSubTypeList, newValue, language);
        if (!newCaseType) {
            onCaseChange({ priority: undefined, caseType: undefined });
            return;
        }

        const shouldUpdate = updateOnSameType ||
            newCaseType?.typeId !== caseState?.caseType?.typeId ||
            newCaseType?.sTypeId !== caseState?.caseType?.sTypeId;

        if (shouldUpdate) {
            onCaseChange({
                priority: newCaseType.priority,
                caseType: {
                    ...newCaseType,
                    caseType: mergeCaseTypeAndSubType(newCaseType, language)
                } as formType
            });
        }
    }, [caseTypeSubTypeList, caseState?.caseType, updateOnSameType, language, onCaseChange]);

    const handleFormFieldChange = useCallback((getTypeData: FormField) => {
        const newData = {
            ...selectedCaseTypeForm,
            formField: getTypeData,
            caseType: selectedCaseType
        } as formType;
        onCaseChange({ caseType: newData });
    }, [selectedCaseType, selectedCaseTypeForm, onCaseChange]);

    return {
        selectedCaseTypeForm,
        isFormLoading,
        caseTypeOptions,
        selectedPriority,
        handleCaseTypeChange,
        handleFormFieldChange,
    };
};
