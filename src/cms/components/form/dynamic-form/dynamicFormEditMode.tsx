import { FormFieldWithChildren, formMetaData, FormRule, IndividualFormFieldWithChildren } from "@/cms/components/interface/FormField";
import type { PiiRule } from "@/core/security/piiFields";
import Button from "@/core/components/ui/button/Button";
import { Modal } from "@/core/components/ui/modal";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useState, useMemo, useEffect, useCallback } from "react";
import { getCountries } from "react-phone-number-input";
import { maxGridCol, formConfigurations } from "./constant";
import Input from "@/core/components/form/input/InputField";
import { SortableFieldEditItem } from "./dynamicFormElement";
import { useTranslation } from "@/core/hooks/useTranslation.ts"; // Import useTranslation

import { ConfirmationModal } from "@/cms/components/case/modal/ConfirmationModal";
import { updateFieldRecursively, removeFieldRecursively, createDynamicFormField, getResponsiveGridClass, getResponsiveColSpanClass } from "./function";

interface FormEditProps {
    currentForm: FormFieldWithChildren;
    addField: (formType: string, parentId?: string) => void;
    editFormData: boolean;
    setCurrentForm: React.Dispatch<React.SetStateAction<FormFieldWithChildren>>;
    showValidationErrors: boolean,
    formMetaData?: formMetaData,
}

export const FormEdit: React.FC<FormEditProps> = ({
    currentForm,
    addField,
    editFormData,
    setCurrentForm,
    showValidationErrors,
    formMetaData
}) => {
    const { t } = useTranslation(); // Initialize t function
    const [modalRules, setModalRules] = useState<FormRule>({});
    const [countrySearch, setCountrySearch] = useState('');
    const allCountries = useMemo(() => getCountries(), []);
    const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
    const [showSettingModal, setShowSettingModal] = useState(false);
    const [expandedDynamicFields, setExpandedDynamicFields] = useState<Record<string, boolean>>({});
    const [showConfirmPubish, setShowConfirmPubish] = useState(false);
    const commonImageTypes = [
        { name: 'JPEG', mime: 'image/jpeg' },
        { name: 'PNG', mime: 'image/png' },
        { name: 'GIF', mime: 'image/gif' },
        { name: 'SVG', mime: 'image/svg+xml' },
        { name: 'WebP', mime: 'image/webp' },
        { name: 'BMP', mime: 'image/bmp' },
    ];
    const [currentEditingField, setCurrentEditingField] = useState<IndividualFormFieldWithChildren | null>(null);

    const [formMeta, setFormMeta] = useState<formMetaData | undefined>(formMetaData ?? undefined)

    useEffect(() => {
        if (currentEditingField) {
            setModalRules(currentEditingField.formRule || {});
        }
    }, [currentEditingField]);

    useEffect(() => {
        setFormMeta(formMetaData)
    }, [formMetaData]);

    if (!currentEditingField && showSettingModal) return null;

    const handleRuleInputChange = (ruleName: keyof FormRule, value: any) => {
        setModalRules(prevRules => ({
            ...prevRules,
            [ruleName]: value
        }));
    };

    const getAllFieldIds = (fields: IndividualFormFieldWithChildren[]): string[] => {
        let ids: string[] = [];
        for (const field of fields) {
            ids.push(field.id);
            if (field.type === "InputGroup" && Array.isArray(field.value)) {
                ids = ids.concat(getAllFieldIds(field.value));
            }
            if (field.type === "dynamicField" && Array.isArray(field.options)) {
                for (const option of field.options) {
                    if (Array.isArray(option.form)) { // Corrected from formMeta
                        ids = ids.concat(getAllFieldIds(option.form)); // Corrected from formMeta
                    }
                }
            }
        }
        return ids;
    };


    const toggleCardVisibility = useCallback((id: string) => {
        setHiddenCardIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const hideAllCards = useCallback(() => {
        const allIds = getAllFieldIds(currentForm.formFieldJson);
        setHiddenCardIds(new Set(allIds));
    }, [currentForm.formFieldJson]); // Dependency added

    const showAllCards = useCallback(() => {
        setHiddenCardIds(new Set());
    }, []);

    const handleSaveRules = () => {
        if (currentEditingField) {
            handleUpdateFieldRule(currentEditingField.id, modalRules);
        }
    };

    const getRuleLabel = useCallback((ruleName: string): string => {
        const keyMap: Record<string, string> = {
            maxFileSize: "formEdit.rules.maxFileSize",
            minLength: "formEdit.rules.minLength",
            maxLength: "formEdit.rules.maxLength",
            minnumber: "formEdit.rules.minnumber",
            maxnumber: "formEdit.rules.maxnumber",
            minSelections: "formEdit.rules.minSelections",
            maxSelections: "formEdit.rules.maxSelections",
            minFiles: "formEdit.rules.minFiles",
            maxFiles: "formEdit.rules.maxFiles",
            contain: "formEdit.rules.contain",
            allowedCountries: "formEdit.rules.allowedCountries",
            allowedFileTypes: "formEdit.rules.allowedFileTypes",
            minLocalDate: "formEdit.rules.minLocalDate",
            maxLocalDate: "formEdit.rules.maxLocalDate",
            minDate: "formEdit.rules.minDate",
            maxDate: "formEdit.rules.maxDate",
            validEmailFormat: "formEdit.rules.validEmailFormat",
            hasUppercase: "formEdit.rules.hasUppercase",
            hasLowercase: "formEdit.rules.hasLowercase",
            hasNumber: "formEdit.rules.hasNumber",
            hasSpecialChar: "formEdit.rules.hasSpecialChar",
            noWhitespace: "formEdit.rules.noWhitespace",
            futureDateOnly: "formEdit.rules.futureDateOnly",
            pastDateOnly: "formEdit.rules.pastDateOnly",
        };

        const tKey = keyMap[ruleName];

        if (tKey) {
            return t(tKey);
        }

        // Fallback for any unmapped rules
        return ruleName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }, [t]); // Added t as dependency

    const handleUpdateFieldRule = useCallback((fieldId: string, newRules: FormRule) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, fieldId, (field) => ({
                ...field,
                formRule: newRules
            })),
        }));
        setCurrentEditingField(null);
        setShowSettingModal(false);
    }, [setCurrentForm]); // Removed updateFieldRecursively from dep array

    const settingHandling = (fieldData: IndividualFormFieldWithChildren) => {
        setCurrentEditingField(fieldData);
        setShowSettingModal(true);
    }

    // const handleFormIdChange = useCallback((newId: string) => {
    //     setCurrentForm(prevForm => ({ ...prevForm, formId: newId }));
    // }, []);

    const handleFormNameChange = useCallback((newName: string) => {
        setCurrentForm(prevForm => ({ ...prevForm, formName: newName }));
    }, [setCurrentForm]); // Added dependency

    // const handleFormType = useCallback((type: string) => {
    //     setCurrentForm(prevForm => ({ ...prevForm, formType: type }));
    // }, [setCurrentForm]);


    const handleOverallFormColSpanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let newColSpan = parseInt(e.target.value, 10);
        if (isNaN(newColSpan) || newColSpan < 1) {
            newColSpan = 1;
        } else if (newColSpan > maxGridCol) {
            newColSpan = maxGridCol;
        }

        setCurrentForm(prevForm => {
            const updatedFieldJson = prevForm.formFieldJson.map(field => {
                if (field.colSpan && field.colSpan > newColSpan) {
                    return { ...field, colSpan: newColSpan as number };
                }
                return field;
            });
            return { ...prevForm, formColSpan: newColSpan, formFieldJson: updatedFieldJson };
        });
    }, [setCurrentForm]); // Added dependency


    const handleLabelChange = useCallback((id: string, newLabel: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                label: newLabel
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const handleShowLabelChange = useCallback((id: string, newValue: boolean) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                showLabel: newValue
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const handlePlaceholderChange = useCallback((id: string, newPlaceholder: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                placeholder: newPlaceholder
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const updateFieldId = useCallback((oldId: string, newId: string) => {
        const trimmedNewId = newId.trim();
        if (!trimmedNewId) {
            return;
        }
        const checkIdExistsRecursively = (fields: IndividualFormFieldWithChildren[]): boolean => {
            for (const field of fields) {
                if (field.id === trimmedNewId && field.id !== oldId) {
                    return true;
                }
                if (field.type === "InputGroup" && Array.isArray(field.value) && checkIdExistsRecursively(field.value)) {
                    return true;
                }
                if (field.type === "dynamicField" && Array.isArray(field.options)) {
                    for (const option of field.options) {
                        if (Array.isArray(option.form) && checkIdExistsRecursively(option.form)) { // Corrected from formMeta
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        if (checkIdExistsRecursively(currentForm.formFieldJson)) {
            return;
        }

        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, oldId, (field) => ({
                ...field,
                id: trimmedNewId
            })),
        }));
    }, [currentForm.formFieldJson, setCurrentForm]); // Removed updateFieldRecursively

    const handleAddOption = useCallback((id: string, newOptionTextValue: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => {
                if (newOptionTextValue.trim() !== "") {
                    const newOptionValue = newOptionTextValue.trim();
                    if (field.type === "dynamicField") {
                        const newOption = {
                            value: newOptionValue,
                            form: [] // Corrected from formMeta
                        };
                        if (field.options && !field.options.some(o => o.value === newOptionValue)) {
                            return { ...field, options: [...field.options, newOption] };
                        } else if (!field.options) {
                            return { ...field, options: [newOption] };
                        }
                    } else {
                        if (field.options && !field.options.includes(newOptionValue)) {
                            return { ...field, options: [...field.options, newOptionValue] };
                        } else if (!field.options) {
                            return { ...field, options: [newOptionValue] };
                        }
                    }
                }
                return field;
            }),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const removeField = useCallback((id: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: removeFieldRecursively(prevForm.formFieldJson, id),
        }));
    }, [setCurrentForm]); // Removed removeFieldRecursively

    const handleRemoveOption = useCallback((fieldId: string, optionIndexToRemove: number) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, fieldId, (field) => {
                if (field.options) {
                    const removedOption = field.options[optionIndexToRemove];
                    const updatedOptions = field.options.filter((_, index) => index !== optionIndexToRemove);
                    let newValue = field.value;

                    if (field.type === "dynamicField") {
                        if (field.value === removedOption.value) {
                            newValue = "";
                        }
                    } else if ((field.type === "select" || field.type === "radio") && field.value === removedOption) {
                        newValue = "";
                    } else if (field.type === "option" && Array.isArray(field.value)) {
                        newValue = field.value.filter(val => val !== removedOption);
                    }

                    return {
                        ...field,
                        options: updatedOptions,
                        value: newValue,
                    };
                }
                return field;
            }),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const handleToggleRequired = useCallback((id: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                required: !field.required
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    // `undefined` clears the marker - "Contains personal data" unchecked. Same
    // updateFieldRecursively pattern as handleToggleRequired, since `pii` lives on the field
    // object itself rather than inside `formRule`.
    const handleUpdatePii = useCallback((id: string, pii: PiiRule | undefined) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                pii
            })),
        }));
    }, [setCurrentForm]);


    const handleColSpanChange = useCallback((id: string, newColSpan: number) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                colSpan: newColSpan
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const addFieldToDynamicOption = useCallback((dynamicFieldId: string, optionValue: string, formType: string) => {
        const newField = createDynamicFormField(
            formConfigurations.map((item) => {
                return { ...item, title: t(item.title) };
            }),
            formType,
            true
        );
        if (!newField) return;

        const callback = (field: IndividualFormFieldWithChildren) => {
            if (field.id === dynamicFieldId && field.type === "dynamicField") {
                const updatedOptions = field.options?.map(option => {
                    if (option.value === optionValue) {
                        const newForm = Array.isArray(option.form) ? [...option.form, newField] : [newField]; // Corrected from formMeta
                        return { ...option, form: newForm }; // Corrected from formMeta
                    }
                    return option;
                });
                return { ...field, options: updatedOptions };
            }
            return field;
        };

        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, dynamicFieldId, callback)
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const handleChildContainerColSpanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, containerId: string, containerType: "InputGroup" | "dynamicField") => {
        let newColSpan = parseInt(e.target.value, 10);
        if (isNaN(newColSpan) || newColSpan < 1) {
            newColSpan = 1;
        } else if (newColSpan > maxGridCol) {
            newColSpan = maxGridCol;
        }

        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, containerId, (field) => {
                if (field.type === containerType) {
                    const updatedChildren = Array.isArray(field.value)
                        ? field.value.map((childField: IndividualFormFieldWithChildren) => {
                            if (childField.colSpan && childField.colSpan > newColSpan) {
                                return { ...childField, colSpan: newColSpan };
                            }
                            return childField;
                        })
                        : [];

                    if (containerType === "InputGroup") {
                        return { ...field, GroupColSpan: newColSpan, value: updatedChildren };
                    } else if (containerType === "dynamicField") {
                        const updatedOptions = field.options?.map(option => {
                            if (Array.isArray(option.form)) { // Corrected from formMeta
                                const updatedOptionForm = option.form.map((childField: IndividualFormFieldWithChildren) => { // Corrected from formMeta
                                    if (childField.colSpan && childField.colSpan > newColSpan) {
                                        return { ...childField, colSpan: newColSpan };
                                    }
                                    return childField;
                                });
                                return { ...option, form: updatedOptionForm }; // Corrected from formMeta
                            }
                            return option;
                        });
                        return { ...field, DynamicFieldColSpan: newColSpan, options: updatedOptions };
                    }
                }
                return field;
            }),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively

    const renderRuleInput = (ruleName: string, value: any) => {
        const label = getRuleLabel(ruleName);
        const commonInputClass = "mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400";
        const commonCheckboxClass = "form-checkbox h-4 w-4 text-blue-600 rounded"; // Corrected from formMeta-checkbox

        switch (ruleName) {
            case 'minLength':
            case 'maxLength':
            case 'minnumber':
            case 'maxnumber':
            case 'minSelections':
            case 'maxSelections':
            case 'maxFileSize':
            case 'minFiles':
            case 'maxFiles':
                const isNonNegative = ['minLength', 'maxLength', 'minSelections', 'maxSelections', 'maxFileSize', 'minFiles', 'maxFiles'].includes(ruleName);
                return <label className="block text-sm font-medium">{label}:
                    <Input
                        type="number"
                        {...(isNonNegative && { min: "0" })}
                        value={value || ''}
                        onChange={e => {
                            const rawValue = e.target.value;
                            if (rawValue === '') {
                                handleRuleInputChange(ruleName as keyof FormRule, undefined);
                                return;
                            }
                            let numValue = parseInt(rawValue, 10);
                            if (isNonNegative && numValue < 0) {
                                numValue = 0;
                            }
                            handleRuleInputChange(ruleName as keyof FormRule, isNaN(numValue) ? undefined : numValue);
                        }}
                        className={commonInputClass}
                    />
                </label>;
            case 'contain':
                return <label className="block text-sm font-medium">{label}:<Input type="text" value={value || ''} onChange={e => handleRuleInputChange(ruleName as keyof FormRule, e.target.value)} className={commonInputClass} /></label>;
            case 'allowedCountries':
                const filteredCountries = allCountries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
                return (
                    <div>
                        <label className="block text-sm font-medium">{label}:</label>
                        <Input
                            type="text"
                            placeholder={t("formEdit.rules.searchCountries")}
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className={`${commonInputClass} mb-2`}
                        />
                        <div className="max-h-40 overflow-y-auto border rounded p-2">
                            {filteredCountries.map(countryCode => (
                                <label key={countryCode} className="flex items-center text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        className={commonCheckboxClass}
                                        checked={(modalRules.allowedCountries || []).includes(countryCode)}
                                        onChange={e => {
                                            const isChecked = e.target.checked;
                                            const currentTypes = modalRules.allowedCountries || [];
                                            const newTypes = isChecked
                                                ? [...new Set([...currentTypes, countryCode])]
                                                : currentTypes.filter(t => t !== countryCode);
                                            handleRuleInputChange('allowedCountries', newTypes);
                                        }}
                                    />
                                    <span className="ml-2">{countryCode}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'allowedFileTypes':
                return (
                    <div>
                        <label className="block text-sm font-medium">{label}:</label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {commonImageTypes.map(imageType => (
                                <label key={imageType.mime} className="flex items-center text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        className={commonCheckboxClass}
                                        checked={(modalRules.allowedFileTypes || []).includes(imageType.mime)}
                                        onChange={e => {
                                            const isChecked = e.target.checked;
                                            const currentTypes = modalRules.allowedFileTypes || [];
                                            const newTypes = isChecked
                                                ? [...new Set([...currentTypes, imageType.mime])]
                                                : currentTypes.filter(t => t !== imageType.mime);
                                            handleRuleInputChange('allowedFileTypes', newTypes);
                                        }}
                                    />
                                    <span className="ml-2">{imageType.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'minLocalDate':
            case 'maxLocalDate':
                return <label className="block text-sm font-medium">{label}:<Input type="datetime-local" value={value || ''} onChange={e => handleRuleInputChange(ruleName as keyof FormRule, e.target.value)} className={commonInputClass} /></label>;
            case 'minDate':
            case 'maxDate':
                return <label className="block text-sm font-medium">{label}:<Input type="date" value={value || ''} onChange={e => handleRuleInputChange(ruleName as keyof FormRule, e.target.value)} className={commonInputClass} /></label>;
            case 'validEmailFormat':
            case 'hasUppercase':
            case 'hasLowercase':
            case 'hasNumber':
            case 'hasSpecialChar':
            case 'noWhitespace':
            case 'futureDateOnly':
            case 'pastDateOnly':
                return <label className="flex items-center text-sm font-medium"><input type="checkbox" checked={!!value} onChange={e => handleRuleInputChange(ruleName as keyof FormRule, e.target.checked)} className={commonCheckboxClass} /><span className="ml-2">{label}</span></label>;
            default:
                return <p>{t("formEdit.settingsModal.unsupportedRule", { ruleName: ruleName })}</p>;
        }
    };

    // const handleChangeVersion = async (versions: string) => {
    //     setCurrentForm((prev) => ({
    //         ...(prev),
    //         formFieldJson: [],
    //     }));
    //     const result = await getForm({ formId: currentForm.formId, version: versions }).unwrap()
    //     setCurrentForm(result?.data as FormFieldWithChildren)
    //     setFormMeta((prev) => (prev ? {
    //         ...(prev),
    //         currentVersions: versions,
    //     } : undefined));
    // }

    return (
        <>  <ConfirmationModal
            title={t("formEdit.confirmPublish.title")}
            description={t("formEdit.confirmPublish.description")}
            onConfirm={() => {
                // pusblishForm({ formId: currentForm.formId, publish: true });
                setFormMeta((prev) => (prev ? {
                    ...(prev),
                    publish: true,
                } : undefined));
                setShowConfirmPubish(false);
            }}
            isOpen={showConfirmPubish}
            onClose={() => setShowConfirmPubish(false)}
        />

            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <div className=" flex justify-between">
                    <div className="flex space-x-3">
                        <h2 className="text-lg font-bold mb-4">{t("formEdit.formSettings.title")}</h2>

                    </div>
                    {/* {formMeta?.versionsList && <SearchableSelect className='px-2 py-1 rounded-full text-xs font-medium' value={formMeta?.currentVersions} prefixedStringValue="v." options={(formMeta?.versionsList)} onChange={handleChangeVersion} disabledChevronsIcon={true} disabledRemoveButton={true} />} */}
                </div>
                <div className=" relative space-y-4">
                    <label className={`block text-gray-600 text-sm font-bold dark:text-gray-400`}>{t("formEdit.formSettings.formNameLabel")}

                    </label>
                    <div className={`${formMeta && "grid grid-cols-[1fr_auto_auto] space-x-3"} text-gray-600 text-sm font-bold dark:text-gray-400`}>
                        <Input type="text" value={currentForm.formName} onChange={(e) => handleFormNameChange(e.target.value)} className="mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400" placeholder={t("formEdit.formSettings.formNamePlaceholder")} disabled={!editFormData} />
                        {/* {formMeta?.currentVersions && <div className=" flex items-center">
                            {t("formEdit.formSettings.version")}
                            <label className={` items-center justify-center`}>{formMetaData?.currentVersions}</label>
                        </div>
                        } */}

                        {formMeta != undefined && <div className="flex justify-end">


                            {/* {!formMeta?.publish ?
                                <Button onClick={() => { setShowConfirmPubish(true) }}>{t("formEdit.formSettings.publish")}</Button>
                                : <Button onClick={() => { setShowConfirmPubish(true) }}>{t("formEdit.formSettings.unpublish")}</Button>} */}
                        </div>}

                    </div>
                    {/* <label className={`block text-gray-600 text-sm font-bold dark:text-gray-400`}>{t("formEdit.formSettings.formType") + ":"}

                    </label> */}
                    <div className={`${formMeta && "grid grid-cols-[1fr_auto_auto] space-x-3"} text-gray-600 text-sm font-bold dark:text-gray-400`}>
                        {/* <SearchableSelect 
                            value={currentForm.formType}
                            onChange={(value) => handleFormType(value)}
                            options={formTypeOption}
                            isDynamic={true}
                            enableI18Nlable={true} /> */}
                      

                        {formMeta != undefined && <div className="flex justify-end">


                            {/* {!formMeta?.publish ?
                                <Button onClick={() => { setShowConfirmPubish(true) }}>{t("formEdit.formSettings.publish")}</Button>
                                : <Button onClick={() => { setShowConfirmPubish(true) }}>{t("formEdit.formSettings.unpublish")}</Button>} */}
                        </div>}

                    </div>

                    {/* <label className="block text-gray-700 text-sm font-bold dark:text-gray-400">{t("formEdit.formSettings.formIdLabel")}
                        <Input type="text" value={currentForm.formId} onChange={(e) => handleFormIdChange(e.target.value)} className="mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400" placeholder={t("formEdit.formSettings.formIdPlaceholder")} disabled={true} />
                    </label> */}
                    <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`overallColSpan-input`} className="text-gray-700 text-sm dark:text-gray-400">{t("formEdit.formSettings.gridColumns")}</label>
                        <Input id={`overallColSpan-input`} type="number" min="1" max={maxGridCol.toString()} value={currentForm.formColSpan} onChange={handleOverallFormColSpanChange} className="py-1 px-2 border rounded-md text-gray-700 dark:bg-gray-800 dark:text-gray-400 w-20" disabled={!editFormData} />
                    </div>
                </div>
            </div>

            <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-bold">{t("formEdit.layoutEditor.title")}</h2>
                    <div className="flex gap-2">
                        <Button onClick={hideAllCards} variant="outline-no-transparent" className="px-3 py-1 bg-blue-200 text-gray-700 rounded-md hover:bg-blue-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 text-sm">{t("formEdit.layoutEditor.hideAll")}</Button>
                        <Button onClick={showAllCards} variant="outline-no-transparent" className="px-3 py-1 bg-blue-200 text-gray-700 rounded-md hover:bg-blue-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 text-sm">{t("formEdit.layoutEditor.showAll")}</Button>
                    </div>
                </div>

                {currentForm.formFieldJson.length === 0 ? (
                    <p className="text-center text-gray-500 italic">{t("formEdit.layoutEditor.noFields")}</p>
                ) : (
                    <div>
                        <SortableContext items={currentForm.formFieldJson.map(field => field.id)} strategy={rectSortingStrategy} key={currentForm.formId}>
                            <div className={`grid w-full grid-cols-1 ${getResponsiveGridClass(currentForm.formColSpan)} gap-4`}>
                                {currentForm.formFieldJson.map((field) => (
                                    <div className={getResponsiveColSpanClass(field.colSpan)} key={field.id}>
                                        <SortableFieldEditItem
                                            key={field.id}
                                            field={field}
                                            handleLabelChange={handleLabelChange}
                                            handleShowLabelChange={handleShowLabelChange}
                                            updateFieldId={updateFieldId}
                                            handleAddOption={handleAddOption}
                                            handleRemoveOption={handleRemoveOption}
                                            removeField={removeField}
                                            handleToggleRequired={handleToggleRequired}
                                            handleUpdatePii={handleUpdatePii}
                                            handlePlaceholderChange={handlePlaceholderChange}
                                            handleColSpanChange={handleColSpanChange}
                                            overallFormColSpan={currentForm.formColSpan}
                                            addField={addField}
                                            addFieldToDynamicOption={addFieldToDynamicOption}
                                            editFormData={editFormData}
                                            handleChildContainerColSpanChange={handleChildContainerColSpanChange}
                                            isHidden={hiddenCardIds.has(field.id)}
                                            toggleCardVisibility={toggleCardVisibility}
                                            settingHandling={settingHandling}
                                            expandedDynamicFields={expandedDynamicFields}
                                            setExpandedDynamicFields={setExpandedDynamicFields}
                                            hiddenCardIds={hiddenCardIds}
                                            setCurrentForm={setCurrentForm}
                                            showValidationErrors={showValidationErrors}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                    </div>
                )}
            </div>

            {
                showSettingModal && currentEditingField && (<Modal isOpen={showSettingModal} onClose={() => { setShowSettingModal(false); setCurrentEditingField(null); }} className="max-w-lg p-6">
                    <div className="dark:text-gray-200">
                        <h3 className="text-lg font-semibold ">{t("formEdit.settingsModal.title")} <span className="font-bold text-blue-500">{currentEditingField.label}</span></h3>
                        <p className="text-sm text-gray-500 mb-4">{t("formEdit.settingsModal.fieldType")} {currentEditingField.type}</p>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {formConfigurations.find(c => c.formType === currentEditingField.type)?.property?.map(rule => (
                                <div key={rule}>
                                    {renderRuleInput(rule, modalRules[rule as keyof FormRule])}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-6">
                            <Button onClick={() => { setShowSettingModal(false); setCurrentEditingField(null); }} variant="outline">{t("common.cancel")}</Button>
                            <Button onClick={handleSaveRules} variant="success">{t("formEdit.settingsModal.saveButton")}</Button>
                        </div>
                    </div>
                </Modal>)
            }
        </>
    );
};